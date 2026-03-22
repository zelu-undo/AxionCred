/**
 * Cron job para atualizar automaticamente juros de mora e multas em parcelas atrasadas
 * 
 * Este serviço deve ser executado diariamente (via cron ou similar) para atualizar os valores
 * das parcelas que estão em atraso.
 * 
 * Função fazer:
 * 1. Identificar parcelas atrasadas
 * 2. Calcular multa fixa (se configurada)
 * 3. Calcular juros de mora diário
 * 4. Atualizar o valor da parcela com os encargos
 * 5. Criar registro de acompanhamento
 */

import { createClient } from "@/lib/supabase"

interface LateFeeConfig {
  tenant_id: string
  fixed_fee: number
  daily_interest: number
  max_interest_rate: number
}

interface InstallmentWithLoan {
  id: string
  loan_id: string
  amount: number
  paid_amount: number
  due_date: string
  status: string
  loan: {
    id: string
    customer_id: string
    tenant_id: string
  }
}

export async function processDailyLateFees(tenantId?: string): Promise<{
  processed: number
  errors: string[]
}> {
  const supabase = createClient()
  const errors: string[] = []
  let processed = 0

  try {
    // Buscar configuração de juros de mora
    const query = supabase
      .from("late_fee_config")
      .select("*")
      .eq("is_active", true)

    if (tenantId) {
      query.eq("tenant_id", tenantId)
    }

    const { data: configs, error: configError } = await query

    if (configError) {
      errors.push(`Erro ao buscar configurações: ${configError.message}`)
      return { processed, errors }
    }

    if (!configs || configs.length === 0) {
      return { processed, errors } // Sem configuração, sai silenciosamente
    }

    const today = new Date().toISOString().split('T')[0]

    // Buscar parcelas atrasadas (status 'late' e com vencimento antes de hoje)
    const { data: installments, error: instError } = await supabase
      .from("loan_installments")
      .select(`
        id,
        loan_id,
        amount,
        paid_amount,
        due_date,
        status,
        late_fee_applied,
        late_interest_applied,
        days_in_delay,
        loan:loans(id, customer_id, tenant_id, principal_amount, total_amount)
      `)
      .eq("status", "late")
      .lt("due_date", today)
      .gt("paid_amount", 0) // Tem valor pago mas não quitado
      .lt("paid_amount", "amount") // Não está quitado

    if (instError) {
      errors.push(`Erro ao buscar parcelas: ${instError.message}`)
      return { processed, errors }
    }

    if (!installments || installments.length === 0) {
      return { processed, errors }
    }

    // Processar cada parcela
    for (const inst of installments as unknown as InstallmentWithLoan[]) {
      try {
        const dueDate = new Date(inst.due_date)
        const todayDate = new Date(today)
        const daysLate = Math.floor(
          (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysLate <= 0) continue

        // Encontrar configuração do tenant
        const config = configs.find(
          (c: LateFeeConfig) => c.tenant_id === inst.loan?.tenant_id
        )
        if (!config) continue

        // Calcular valores
        const originalAmount = inst.amount
        let lateFee = inst.late_fee_applied || 0
        let lateInterest = inst.late_interest_applied || 0

        // Aplicar multa fixa (apenas uma vez)
        if (config.fixed_fee > 0 && lateFee === 0) {
          lateFee = config.fixed_fee
        }

        // Calcular juros diários progressivos
        if (config.daily_interest > 0) {
          // Juros acumulam a cada dia
          const dailyRate = config.daily_interest
          lateInterest = originalAmount * dailyRate * daysLate

          // Limitar ao máximo permitido
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
            amount: newTotal, // Atualiza o valor total com encargos
          })
          .eq("id", inst.id)

        if (updateError) {
          errors.push(
            `Erro ao atualizar parcela ${inst.id}: ${updateError.message}`
          )
          continue
        }

        processed++
      } catch (err: any) {
        errors.push(`Erro ao processar parcela ${inst.id}: ${err.message}`)
      }
    }
  } catch (err: any) {
    errors.push(`Erro geral: ${err.message}`)
  }

  return { processed, errors }
}

/**
 * Alternativa: Função que calcula encargos no momento do pagamento
 * (usada quando o usuário paga a parcela)
 */
export function calculateLateFees(
  amount: number,
  dueDate: string,
  config: LateFeeConfig,
  paymentDate: Date = new Date()
): {
  lateFee: number
  lateInterest: number
  daysLate: number
  totalWithFees: number
} {
  const due = new Date(dueDate)
  const today = paymentDate

  const daysLate = Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  )

  if (daysLate === 0) {
    return {
      lateFee: 0,
      lateInterest: 0,
      daysLate: 0,
      totalWithFees: amount,
    }
  }

  // Multa fixa
  const lateFee = config.fixed_fee || 0

  // Juros diários progressivos
  let lateInterest = 0
  if (config.daily_interest && daysLate > 0) {
    lateInterest = amount * config.daily_interest * daysLate

    // Limitar ao máximo
    if (config.max_interest_rate) {
      const maxInterest = amount * config.max_interest_rate
      lateInterest = Math.min(lateInterest, maxInterest)
    }
  }

  const totalWithFees = amount + lateFee + lateInterest

  return {
    lateFee,
    lateInterest,
    daysLate,
    totalWithFees,
  }
}