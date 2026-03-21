/**
 * Hook centralizado para cálculos financeiros de empréstimos
 * 
 * Este hook garante consistência entre os cálculos do frontend e backend
 * используя a mesma fórmula do sistema Price para amortização
 */

import { useMemo } from "react"

export type InterestType = "fixed" | "weekly" | "monthly"

export interface LoanCalculation {
  principalAmount: number
  installmentsCount: number
  interestRate: number
  interestType: InterestType
  installmentAmount: number
  totalAmount: number
  totalInterest: number
}

export interface InstallmentSchedule {
  number: number
  amount: number
  dueDate: string
  principalPortion: number
  interestPortion: number
  balance: number
}

/**
 * Calcula o valor da parcela usando o sistema Price (amortização constante)
 * 
 * @param principal - Valor principal do empréstimo
 * @param rate - Taxa de juros (em porcentaje, ex: 5 para 5%)
 * @param periods - Número de parcelas
 * @param type - Tipo de juros (fixed, weekly, monthly)
 * @returns Valor da parcela
 */
export function calculateInstallmentAmount(
  principal: number,
  rate: number,
  periods: number,
  type: InterestType = "monthly"
): number {
  if (rate === 0 || type === "fixed") {
    // Sem juros ou juros fixo: simplesmente divide o principal
    return principal / periods
  }

  let periodicRate: number
  let totalPeriods: number

  if (type === "weekly") {
    // Juros semanal: converte taxa mensal para semanal
    // 52 semanas / 12 meses = 4.33 semanas por mês
    periodicRate = rate / 100 / 4.33
    totalPeriods = periods * 4
  } else {
    // Juros mensal
    periodicRate = rate / 100
    totalPeriods = periods
  }

  // Fórmula do sistema Price (amortização constante)
  // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + periodicRate, totalPeriods)
  const installment = (principal * periodicRate * factor) / (factor - 1)

  return installment
}

/**
 * Calcula o total de juros pagos ao longo do empréstimo
 * 
 * @param principal - Valor principal
 * @param installmentAmount - Valor de cada parcela
 * @param periods - Número de parcelas
 * @returns Total de juros
 */
export function calculateTotalInterest(
  principal: number,
  installmentAmount: number,
  periods: number
): number {
  return (installmentAmount * periods) - principal
}

/**
 * Gera o cronograma completo de parcelas
 * 
 * @param principal - Valor principal
 * @param rate - Taxa de juros
 * @param periods - Número de parcelas
 * @param type - Tipo de juros
 * @param firstDueDate - Data do primeiro vencimento
 * @returns Array com todas as parcelas
 */
export function generateInstallmentSchedule(
  principal: number,
  rate: number,
  periods: number,
  type: InterestType,
  firstDueDate: string
): InstallmentSchedule[] {
  const schedule: InstallmentSchedule[] = []
  
  const installmentAmount = calculateInstallmentAmount(principal, rate, periods, type)
  const periodicRate = type === "weekly" ? rate / 100 / 4.33 : rate / 100

  let balance = principal

  for (let i = 1; i <= periods; i++) {
    // Calcula juros do período
    const interestPortion = type === "fixed" 
      ? (principal * rate / 100 / periods)
      : balance * periodicRate

    // Calcula principal do período
    const principalPortion = installmentAmount - interestPortion

    // Atualiza saldo
    balance = Math.max(0, balance - principalPortion)

    // Calcula data de vencimento
    const dueDate = new Date(firstDueDate)
    if (type === "weekly") {
      dueDate.setDate(dueDate.getDate() + (i * 7))
    } else {
      dueDate.setMonth(dueDate.getMonth() + i)
    }

    schedule.push({
      number: i,
      amount: Math.round(installmentAmount * 100) / 100,
      dueDate: dueDate.toISOString().split("T")[0],
      principalPortion: Math.round(principalPortion * 100) / 100,
      interestPortion: Math.round(interestPortion * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    })
  }

  return schedule
}

/**
 * Hook React para cálculos de empréstimo
 * Retorna funções memoizadas para evitar recálculos desnecessários
 */
export function useLoanCalculator() {
  const calculateLoan = useMemo(() => {
    return (
      principal: number,
      interestRate: number,
      installments: number,
      interestType: InterestType = "monthly"
    ): LoanCalculation => {
      if (principal <= 0 || installments <= 0) {
        return {
          principalAmount: principal,
          installmentsCount: installments,
          interestRate,
          interestType,
          installmentAmount: 0,
          totalAmount: 0,
          totalInterest: 0,
        }
      }

      const installmentAmount = calculateInstallmentAmount(
        principal,
        interestRate,
        installments,
        interestType
      )

      const totalAmount = installmentAmount * installments
      const totalInterest = calculateTotalInterest(principal, installmentAmount, installments)

      return {
        principalAmount: principal,
        installmentsCount: installments,
        interestRate,
        interestType,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
      }
    }
  }, [])

  const generateSchedule = useMemo(() => {
    return (
      principal: number,
      interestRate: number,
      installments: number,
      interestType: InterestType,
      firstDueDate: string
    ): InstallmentSchedule[] => {
      return generateInstallmentSchedule(
        principal,
        interestRate,
        installments,
        interestType,
        firstDueDate
      )
    }
  }, [])

  return {
    calculateLoan,
    calculateInstallmentAmount,
    calculateTotalInterest,
    generateSchedule,
  }
}

/**
 * Valida se um valor de pagamento é válido
 * 
 * @param paymentAmount - Valor do pagamento
 * @param installmentAmount - Valor da parcela
 * @param allowPartial - Permite pagamento parcial?
 * @param minPercentage - Percentual mínimo aceito (padrão: 50%)
 * @returns Objeto com válido e mensagem de erro
 */
export function validatePaymentAmount(
  paymentAmount: number,
  installmentAmount: number,
  allowPartial: boolean = false,
  minPercentage: number = 50
): { valid: boolean; error?: string } {
  if (paymentAmount <= 0) {
    return { valid: false, error: "Valor do pagamento deve ser maior que zero" }
  }

  if (!allowPartial && paymentAmount < installmentAmount) {
    return { 
      valid: false, 
      error: `Valor mínimo é R$ ${installmentAmount.toFixed(2)}` 
    }
  }

  if (allowPartial) {
    const minAmount = installmentAmount * (minPercentage / 100)
    if (paymentAmount < minAmount) {
      return {
        valid: false,
        error: `Valor mínimo para pagamento parcial é R$ ${minAmount.toFixed(2)} (${minPercentage}% da parcela)`
      }
    }
  }

  return { valid: true }
}
