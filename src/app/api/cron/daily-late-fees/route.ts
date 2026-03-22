import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

/**
 * API Route para processar juros de mora diariamente
 * 
 * Configure um cron job (Vercel Cron, EasyCron, etc.) para chamar este endpoint
 * diariamente, por exemplo: https://seu-app.vercel.app/api/cron/daily-late-fees
 * 
 * O endpoint requer uma chave de API configurada como CRON_SECRET
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar chave de segurança do cron
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Buscar todas as configurações de juros de mora
    const { data: configs, error: configError } = await supabase
      .from("late_fee_config")
      .select("*")

    if (configError) {
      console.error("Erro ao buscar configurações:", configError)
      // Continuar mesmo sem config - usar valores padrão
    }

    // Buscar todas as parcelas atrasadas
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
        loan:loans(id, customer_id, tenant_id)
      `)
      .eq("status", "late")
      .lt("due_date", today)
      .or("paid_amount.is.null,paid_amount.lt.amount")

    if (instError) {
      console.error("Erro ao buscar parcelas:", instError)
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
      // Encontrar configuração do tenant
      const config = configs?.find((c: any) => c.tenant_id === inst.loan?.tenant_id)
      
      // Se não há configuração para este tenant, pular
      if (!config) {
        continue
      }

      // Verificar se há configuração de multa ou juros
      const hasLateFeeConfig = config.fixed_fee || config.percentage
      const hasLateInterestConfig = config.late_interest_type && config.late_interest_value

      // Se não tem nada configurado, pular
      if (!hasLateFeeConfig && !hasLateInterestConfig) {
        continue
      }

      // Usar os campos do banco
      const fixedFee = config.fixed_fee || config.percentage || 0
      
      // Calcular juros diários a partir da configuração
      let dailyInterest = 0
      if (config.late_interest_type === 'percentage' && config.late_interest_value) {
        // Converter taxa percentual para taxa diária
        if (config.late_interest_charge_type === 'daily') {
          dailyInterest = (config.late_interest_value / 100) // já é diário
        } else if (config.late_interest_charge_type === 'weekly') {
          dailyInterest = (config.late_interest_value / 100) / 7 // semanal para diário
        } else {
          dailyInterest = (config.late_interest_value / 100) / 30 // mensal para diário
        }
      }

      const dueDate = new Date(inst.due_date)
      const todayDate = new Date(today)
      const daysLate = Math.floor(
        (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysLate <= 0) continue

      const originalAmount = inst.amount
      let lateFee = inst.late_fee_applied || 0
      let lateInterest = inst.late_interest_applied || 0

      // Aplicar multa fixa (apenas na primeira vez)
      if (fixedFee > 0 && lateFee === 0) {
        lateFee = fixedFee
      }

      // Calcular juros diários progressivos
      if (dailyInterest > 0 && daysLate > 0 && hasLateInterestConfig) {
        lateInterest = originalAmount * dailyInterest * daysLate
      }

      const newTotal = originalAmount + lateFee + lateInterest

      // Atualizar parcela
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
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: totalProcessed,
      message: `${totalProcessed} parcela(s) atualizada(s)`
    })

  } catch (error: any) {
    console.error("Erro no cron de juros:", error)
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