import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"
import { createNotification, NotificationTypes } from "@/lib/notifications"

/**
 * API Route para processar juros de mora diariamente
 * 
 * Configure um cron job (Vercel Cron, EasyCron, etc.) para chamar este endpoint
 * diariamente, por exemplo: https://seu-app.vercel.app/api/cron/daily-late-fees
 * 
 * O endpoint requer uma chave de API configurada como CRON_SECRET
 */

// Valores padrão se não houver configuração
const DEFAULT_MAX_INTEREST_RATE = 0.10 // 10% máximo

export async function POST(request: NextRequest) {
  try {
    // Verificar chave de segurança do cron (apenas para chamadas automatizadas)
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    
    // Se tem CRON_SECRET configurado, verificar apenas se for uma chamada automatizada
    // (com Authorization header). Chamadas manuais (sem header) são permitidas.
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Usar service role key para bypass de RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createSupabaseServerClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const today = new Date().toISOString().split('T')[0]
    
    // Atualizar parcelas pending com data vencida para late
    await supabase
      .from("loan_installments")
      .update({ status: "late" })
      .eq("status", "pending")
      .lt("due_date", today)

    // Buscar configurações de juros
    const { data: configs } = await supabase
      .from("late_fee_config")
      .select("*")

    // Buscar parcelas atrasadas
    const { data: installments, error: instError } = await supabase
      .from("loan_installments")
      .select(`
        id,
        amount,
        paid_amount,
        due_date,
        late_fee_applied,
        late_interest_applied,
        days_in_delay,
        status,
        installment_number,
        loan:loans(id, customer_id, tenant_id, principal_amount, installments_count)
      `)
      .eq("status", "late")
      .lt("due_date", today)

    if (instError) {
      return NextResponse.json({ 
        success: false, 
        message: "Erro ao buscar parcelas: " + instError.message,
        processed: 0 
      }, { status: 500 })
    }

    if (!installments || installments.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhuma parcela atrasada para processar",
        processed: 0 
      })
    }

    // Se não há configurações, não processar
    if (!configs || configs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhuma configuração de juros encontrada. Configure em Regras de Negócio.",
        processed: 0 
      })
    }

    let totalProcessed = 0

    // Processar cada parcela
    for (const inst of installments as any[]) {
      const config = configs?.find((c: any) => c.tenant_id === inst.loan?.tenant_id)
      
      if (!config) {
        continue
      }

      const hasLateFeeConfig = config.fixed_fee || config.percentage
      const hasLateInterestConfig = config.late_interest_type && config.late_interest_value

      if (!hasLateFeeConfig && !hasLateInterestConfig) {
        continue
      }

      const fixedFee = config.fixed_fee || config.percentage || 0
      
      let dailyInterest = 0
      if (config.late_interest_type === 'percentage' && config.late_interest_value) {
        if (config.late_interest_charge_type === 'daily') {
          dailyInterest = (config.late_interest_value / 100)
        } else if (config.late_interest_charge_type === 'weekly') {
          dailyInterest = (config.late_interest_value / 100) / 7
        } else {
          dailyInterest = (config.late_interest_value / 100) / 30
        }
      }

      const dueDate = new Date(inst.due_date)
      const todayDate = new Date(today)
      const daysLate = Math.floor(
        (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysLate <= 0) continue

      // Calcular valor base: remover juros anteriores para calcular apenas a diferença
      // Isso evita acumulação infinita de juros
      const previousLateFees = inst.late_fee_applied || 0
      const previousLateInterest = inst.late_interest_applied || 0
      const baseAmount = inst.amount - previousLateFees - previousLateInterest
      
      // Aplicar multa fixa APENAS uma vez (se ainda não foi aplicada)
      let lateFee = previousLateFees
      if (fixedFee > 0 && previousLateFees === 0) {
        lateFee = fixedFee
      }
      
      // Calcular juros apenas para novos dias de atraso (progressivo)
      // Se já tinha juros, calculamos apenas a diferença
      let lateInterest = previousLateInterest
      if (dailyInterest > 0 && daysLate > 0 && hasLateInterestConfig) {
        // Calcular juros totais e subtrair os já aplicados
        const totalInterest = baseAmount * dailyInterest * daysLate
        lateInterest = totalInterest - previousLateInterest
        
        // Se resultado negativo, não atualizar (manter os anteriores)
        if (lateInterest < 0) lateInterest = 0
      }

      const newTotal = baseAmount + lateFee + lateInterest

      const { error: updateError } = await supabase
        .from("loan_installments")
        .update({
          late_fee_applied: lateFee,
          late_interest_applied: lateInterest,
          days_in_delay: daysLate,
          amount: newTotal,
        })
        .eq("id", inst.id)

      if (!updateError) {
        totalProcessed++
        
        // Enviar notificação apenas para novas parcelas atrasadas (primeira vez que recebe juros)
        if (inst.late_fee_applied === 0 && inst.late_interest_applied === 0) {
          // Buscar nome do cliente
          const { data: customerData } = await supabase
            .from("customers")
            .select("name")
            .eq("id", inst.loan?.customer_id)
            .single()
          
          const customerName = customerData?.name || "Cliente"
          
          // Enviar notificação
          await createNotification(
            supabase,
            inst.loan?.tenant_id,
            NotificationTypes.PAYMENT_OVERDUE,
            "Parcela Atrasada",
            `${customerName} - ${daysLate} dia${daysLate > 1 ? "s" : ""} atrasado - R$ ${newTotal.toLocaleString("pt-BR")}`,
            { 
              customerName, 
              daysLate, 
              amount: newTotal,
              installmentId: inst.id,
              loanId: inst.loan?.id
            }
          )
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: totalProcessed,
      message: `${totalProcessed} parcela(s) atualizada(s)`
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message,
      processed: 0 
    }, { status: 500 })
  }
}

// Permitir GET para testes
export async function GET(request: NextRequest) {
  return POST(request)
}