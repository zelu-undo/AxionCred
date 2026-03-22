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
    
    // Buscar configurações de juros de mora ativos
    const { data: configs, error: configError } = await supabase
      .from("late_fee_config")
      .select("*")
      .eq("is_active", true)

    if (configError) {
      console.error("Erro ao buscar configurações:", configError)
      return NextResponse.json({ 
        success: false, 
        message: "Erro ao buscar configurações",
        processed: 0 
      }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhuma configuração de juros ativo",
        processed: 0 
      })
    }

    let totalProcessed = 0

    // Processar cada configuração de tenant
    for (const config of configs) {
      // Buscar parcelas atrasadas deste tenant
      const { data: installments, error: instError } = await supabase
        .from("loan_installments")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          late_fee_applied,
          late_interest_applied,
          loan:loans(tenant_id)
        `)
        .eq("status", "late")
        .lt("due_date", today)
        .or("paid_amount.is.null,paid_amount.lt.amount")

      if (instError) {
        console.error("Erro ao buscar parcelas:", instError)
        continue
      }

      if (!installments || installments.length === 0) {
        continue
      }

      // Processar cada parcela
      for (const inst of installments as any[]) {
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
        if (config.fixed_fee > 0 && lateFee === 0) {
          lateFee = config.fixed_fee
        }

        // Calcular juros diários progressivos
        if (config.daily_interest > 0 && daysLate > 0) {
          lateInterest = originalAmount * config.daily_interest * daysLate

          // Aplicar limite máximo
          if (config.max_interest_rate) {
            const maxInterest = originalAmount * config.max_interest_rate
            lateInterest = Math.min(lateInterest, maxInterest)
          }
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