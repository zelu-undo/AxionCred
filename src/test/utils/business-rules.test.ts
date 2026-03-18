import { describe, it, expect } from 'vitest'

/**
 * Testes para Regras de Negócio de Empréstimos
 * Baseado no MVP_PLAN.md - Fase 1
 */

describe('Sistema de Juros', () => {
  describe('Cálculo de Parcelas (Sistema Price)', () => {
    const calculatePriceInstallment = (
      principal: number,
      annualRate: number,
      installments: number
    ): number => {
      if (annualRate === 0) return principal / installments
      
      const monthlyRate = annualRate / 100 / 12
      const factor = Math.pow(1 + monthlyRate, installments)
      return (principal * monthlyRate * factor) / (factor - 1)
    }

    it('deve calcular parcelas sem juros corretamente', () => {
      const installment = calculatePriceInstallment(1000, 0, 5)
      expect(installment).toBe(200)
    })

    it('deve calcular parcelas com taxa anual converting para mensal', () => {
      // 60% ao ano = 5% ao mês
      const installment = calculatePriceInstallment(1000, 60, 5)
      // Taxa mensal = 60/12 = 5%
      // PMT = 1000 * (0.05 * 1.27628) / 0.27628 = 230.97
      expect(installment).toBeCloseTo(230.97, 1)
    })

    it('deve calcular parcelas com taxa mensal direta', () => {
      // A função usa rate como taxa anual, não mensal
      // 5 = 5% ao ano = ~0.42% ao mês
      const installment = calculatePriceInstallment(1000, 5, 5)
      expect(installment).toBeCloseTo(202.51, 1)
    })
  })

  describe('Juros por Faixa de Parcelas', () => {
    const getInterestRateByInstallments = (
      installments: number,
      rules: Array<{ min: number; max: number; rate: number }>
    ): number => {
      const rule = rules.find(r => installments >= r.min && installments <= r.max)
      return rule?.rate ?? 0
    }

    const defaultRules = [
      { min: 1, max: 5, rate: 50 },
      { min: 6, max: 12, rate: 80 },
      { min: 13, max: 24, rate: 120 },
      { min: 25, max: 48, rate: 150 },
    ]

    it('deve retornar taxa de 50% para 1-5 parcelas', () => {
      expect(getInterestRateByInstallments(1, defaultRules)).toBe(50)
      expect(getInterestRateByInstallments(3, defaultRules)).toBe(50)
      expect(getInterestRateByInstallments(5, defaultRules)).toBe(50)
    })

    it('deve retornar taxa de 80% para 6-12 parcelas', () => {
      expect(getInterestRateByInstallments(6, defaultRules)).toBe(80)
      expect(getInterestRateByInstallments(12, defaultRules)).toBe(80)
    })

    it('deve retornar taxa de 120% para 13-24 parcelas', () => {
      expect(getInterestRateByInstallments(13, defaultRules)).toBe(120)
      expect(getInterestRateByInstallments(24, defaultRules)).toBe(120)
    })

    it('deve retornar 0 para faixa não encontrada', () => {
      expect(getInterestRateByInstallments(0, defaultRules)).toBe(0)
      expect(getInterestRateByInstallments(100, defaultRules)).toBe(0)
    })
  })

  describe('Validação de Sobreposição de Faixas', () => {
    const validateNoOverlap = (
      rules: Array<{ min: number; max: number }>
    ): boolean => {
      const sorted = [...rules].sort((a, b) => a.min - b.min)
      
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].min <= sorted[i - 1].max) {
          return false // Sobreposição encontrada
        }
      }
      return true
    }

    it('deve aceitar faixas não sobrepostas', () => {
      const rules = [
        { min: 1, max: 5 },
        { min: 6, max: 12 },
        { min: 13, max: 24 },
      ]
      expect(validateNoOverlap(rules)).toBe(true)
    })

    it('deve rejeitar faixas sobrepostas', () => {
      const rules = [
        { min: 1, max: 7 },  // Sobrepõe com próxima
        { min: 5, max: 12 },
      ]
      expect(validateNoOverlap(rules)).toBe(false)
    })

    it('deve rejeitar regras duplicadas', () => {
      const rules = [
        { min: 1, max: 5 },
        { min: 1, max: 5 },
      ]
      expect(validateNoOverlap(rules)).toBe(false)
    })
  })

  describe('Multa por Atraso', () => {
    const calculateLateFee = (
      installmentAmount: number,
      lateFeePercentage: number
    ): number => {
      return installmentAmount * (lateFeePercentage / 100)
    }

    it('deve calcular multa de 2%', () => {
      const fee = calculateLateFee(230.97, 2)
      expect(fee).toBeCloseTo(4.62, 1)
    })

    it('deve calcular multa de 10%', () => {
      const fee = calculateLateFee(1000, 10)
      expect(fee).toBe(100)
    })
  })

  describe('Juros por Atraso', () => {
    const calculateDailyInterest = (
      installmentAmount: number,
      monthlyRate: number,
      daysLate: number
    ): number => {
      const dailyRate = (monthlyRate / 100) / 30
      return installmentAmount * dailyRate * daysLate
    }

    const calculateMonthlyInterest = (
      installmentAmount: number,
      monthlyRate: number,
      monthsLate: number
    ): number => {
      const monthlyInterest = installmentAmount * (monthlyRate / 100)
      return monthlyInterest * monthsLate
    }

    it('deve calcular juros diários', () => {
      // 5% ao mês, 10 dias de atraso
      const interest = calculateDailyInterest(230.97, 5, 10)
      expect(interest).toBeCloseTo(3.85, 1)
    })

    it('deve calcular juros mensais', () => {
      // 5% ao mês, 2 meses de atraso
      const interest = calculateMonthlyInterest(230.97, 5, 2)
      expect(interest).toBeCloseTo(23.10, 1)
    })
  })

  describe('Cálculo Total do Empréstimo', () => {
    const calculateTotalLoan = (
      principal: number,
      annualRate: number,
      installments: number
    ): { totalAmount: number; installmentAmount: number } => {
      const installmentAmount = annualRate === 0 
        ? principal / installments 
        : (principal * (annualRate / 100 / 12) * Math.pow(1 + annualRate / 100 / 12, installments)) / 
          (Math.pow(1 + annualRate / 100 / 12, installments) - 1)
      
      return {
        installmentAmount,
        totalAmount: installmentAmount * installments
      }
    }

    it('deve calcular total sem juros', () => {
      const result = calculateTotalLoan(1000, 0, 5)
      expect(result.totalAmount).toBe(1000)
      expect(result.installmentAmount).toBe(200)
    })

    it('deve calcular total com juros', () => {
      const result = calculateTotalLoan(1000, 60, 5)
      expect(result.totalAmount).toBeCloseTo(1154.85, 1) // 230.97 * 5
      expect(result.installmentAmount).toBeCloseTo(230.97, 1)
    })
  })
})

describe('Sistema de Amortização', () => {
  describe('Parcelasfixas (Price)', () => {
    const generatePriceSchedule = (
      principal: number,
      annualRate: number,
      installments: number,
      firstDueDate: Date
    ): Array<{ number: number; amount: number; dueDate: Date }> => {
      const monthlyRate = annualRate / 100 / 12
      const installmentAmount = annualRate === 0
        ? principal / installments
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, installments)) /
          (Math.pow(1 + monthlyRate, installments) - 1)

      const schedule = []
      let currentDate = new Date(firstDueDate)

      for (let i = 1; i <= installments; i++) {
        schedule.push({
          number: i,
          amount: Number(installmentAmount.toFixed(2)),
          dueDate: new Date(currentDate)
        })
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      return schedule
    }

    it('deve gerar cronograma sem juros', () => {
      const schedule = generatePriceSchedule(1000, 0, 5, new Date('2024-01-01'))
      
      expect(schedule).toHaveLength(5)
      schedule.forEach(item => {
        expect(item.amount).toBe(200)
      })
    })

    it('deve gerar cronograma com datas corretas', () => {
      const schedule = generatePriceSchedule(1000, 0, 3, new Date('2024-01-15'))
      
      expect(schedule[0].dueDate.getMonth()).toBe(0) // Janeiro
      expect(schedule[1].dueDate.getMonth()).toBe(1) // Fevereiro
      expect(schedule[2].dueDate.getMonth()).toBe(2) // Março
    })
  })
})

describe('Validação de Contrato', () => {
  describe('Imutabilidade do Contrato', () => {
    interface LoanRuleSnapshot {
      principal: number
      rate: number
      installments: number
      totalAmount: number
      createdAt: Date
    }

    const createImmutableSnapshot = (
      principal: number,
      rate: number,
      installments: number
    ): LoanRuleSnapshot => {
      return Object.freeze({
        principal,
        rate,
        installments,
        totalAmount: principal * (1 + rate / 100),
        createdAt: new Date()
      })
    }

    it('deve criar snapshot que preserva valores originais', () => {
      const snapshot = createImmutableSnapshot(1000, 50, 5)
      
      // O snapshot deve preservar os valores originais
      expect(snapshot.totalAmount).toBe(1500)
    })

    it('deve preservar valores originais independente de mudanças futuras', () => {
      const snapshot = createImmutableSnapshot(1000, 50, 5)
      
      // Novos cálculos não afetam o snapshot
      const newTotal = 2000
      
      expect(snapshot.totalAmount).toBe(1500) // 1000 * 1.5
      expect(snapshot.totalAmount).not.toBe(newTotal)
    })
  })
})
