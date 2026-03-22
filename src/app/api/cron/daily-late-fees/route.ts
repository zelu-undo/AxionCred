import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/server/supabase"

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
    // Verificar chave de segurança do cron (apenas para chamadas automatizadas)
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")
    
    // Se tem CRON_SECRET configurado, verificar apenas se for uma chamada automatizada
    // (com Authorization header). Chamadas manuais (sem header) são permitidas.
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = supabaseServer()
    
    // Debug: testar query simples sem filtros de tenant
    const { data: testData, error: testError } = await supabase
      .from("loans")
      .select("id, tenant_id")
      .limit(1)
    
    console.log("Test loans:", testData, testError)

    // Se não consegue acessar, talvez seja RLS
    if (!testData || testData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Erro: não foi possível acessar os dados. Verifique RLS ou credenciais.",
        debug: { 
          test_error: testError?.message,
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
          supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing"
        },
        processed: 0 
      }, { status: 500 })
    }

    // Primeira etapa: atualizar parcelas que estão com status "pending" mas a data de vencimento já passou para "late"
    console.log("Atualizando parcelas pending para late...")
    const today = new Date().toISOString().split('T')[0]
    console.log("Data de hoje (Brasil):", today)
    
    // Primeiro, atualizar parcelas que estão atrasadas (pending com data vencida)
    const { data: updatedInstallments, error: updateStatusError } = await supabase
      .from("loan_installments")
      .update({ status: "late" })
      .eq("status", "pending")
      .lt("due_date", today)
      .select("id")

    console.log("Parcelas atualizadas para 'late':", updatedInstallments?.length || 0)
    
    if (updateStatusError) {
      console.error("Erro ao atualizar status:", updateStatusError)
    }

    // Agora buscarParcelas atrasadas (status = 'late')
    console.log("Buscando parcelas com status 'late'...")
    const { data: configs, error: configError } = await supabase
      .from("late_fee_config")
      .select("*")

    if (configError) {
      console.error("Erro ao buscar configurações:", configError)
      // Continuar mesmo sem config - usar valores padrão
    }

    // Buscar todas as parcelas atrasadas
    console.log("Query: status=late, due_date <", today)
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
        loan:loans(id, customer_id, tenant_id)
      `)
      .eq("status", "late")
      .lt("due_date", today)

    console.log("Parcelas encontradas:", installments?.length || 0)
    if (installments && installments.length > 0) {
      console.log("Primeira parcela:", installments[0])
    }

    if (instError) {
      console.error("Erro ao buscar parcelas:", instError)
      return NextResponse.json({ 
        success: false, 
        message: "Erro ao buscar parcelas: " + instError.message,
        processed: 0 
      }, { status: 500 })
    }

    // Buscar todas as parcelas para debug
    const { data: allInstallments, error: allInstError } = await supabase
      .from("loan_installments")
      .select(`
        id,
        amount,
        paid_amount,
        due_date,
        status
      `)
      .order("due_date", { ascending: false })
      .limit(10)

    if (allInstError) {
      console.error("Erro ao buscar todas:", allInstError)
    }

    // Se não encontrou com a query original, tentar sem filtro de data
    if (!installments || installments.length === 0) {
      // Ver se existem parcelas com status "late" ou "pending"
      const { data: lateOrPending } = await supabase
        .from("loan_installments")
        .select("id, status, due_date")
        .in("status", ["late", "pending"])
        .limit(5)
      
      // Retornar debug info
      return NextResponse.json({ 
        success: true, 
        message: "Nenhuma parcela atrasada para processar",
        debug: {
          data_hoje: today,
          parcelas_atualizadas: updatedInstallments?.length || 0,
          query_feita: `status=late E due_date < ${today}`,
          sample_dates: lateOrPending?.map(i => ({ id: i.id, status: i.status, due_date: i.due_date })) || [],
          total_installments_sample: allInstallments?.length || 0,
          sample_all: allInstallments?.slice(0, 3).map(i => ({ id: i.id, status: i.status, due_date: i.due_date, amount: i.amount }))
        },
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