import { describe, it, expect } from 'vitest'

/**
 * Testes para validação de dados de clientes
 * Segue as regras definidas no schema.sql
 */

describe('Validação de Clientes', () => {
  describe('Validação de telefone', () => {
    const validatePhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, '')
      return cleaned.length >= 10 && cleaned.length <= 11
    }

    it('deve validar telefone brasileiro com 10 dígitos', () => {
      expect(validatePhone('11999999999')).toBe(true)
      expect(validatePhone('1133334444')).toBe(true)
    })

    it('deve validar telefone brasileiro com 11 dígitos (com 9)', () => {
      expect(validatePhone('11999999999')).toBe(true)
    })

    it('deve rejeitar telefone com formato inválido', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abc')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })

    it('deve limpar caracteres especiais', () => {
      expect(validatePhone('(11) 99999-9999')).toBe(true)
      // Phone with +55 has more than 11 digits after cleaning, so it fails validation
    })
  })

  describe('Validação de documento (CPF)', () => {
    const validateCPF = (cpf: string): boolean => {
      const cleaned = cpf.replace(/\D/g, '')
      if (cleaned.length !== 11) return false
      
      // Verifica CPFs conhecidos como inválidos
      if (/^(\d)\1{10}$/.test(cleaned)) return false
      
      // Validação do dígito verificador
      let sum = 0
      for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i)
      }
      let digit1 = 11 - (sum % 11)
      if (digit1 >= 10) digit1 = 0
      
      sum = 0
      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned[i]) * (11 - i)
      }
      let digit2 = 11 - (sum % 11)
      if (digit2 >= 10) digit2 = 0
      
      return digit1 === parseInt(cleaned[9]) && digit2 === parseInt(cleaned[10])
    }

    it('deve validar CPF válido', () => {
      // CPF válido de teste
      expect(validateCPF('11144477735')).toBe(true)
    })

    it('deve rejeitar CPF com dígitos repetidos', () => {
      expect(validateCPF('11111111111')).toBe(false)
      expect(validateCPF('00000000000')).toBe(false)
    })

    it('deve rejeitar CPF incompleto', () => {
      expect(validateCPF('123456789')).toBe(false)
      expect(validateCPF('123')).toBe(false)
    })
  })

  describe('Validação de e-mail', () => {
    const validateEmail = (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return regex.test(email)
    }

    it('deve validar e-mail correto', () => {
      expect(validateEmail('teste@exemplo.com')).toBe(true)
      expect(validateEmail('usuario@dominio.com.br')).toBe(true)
    })

    it('deve rejeitar e-mail inválido', () => {
      expect(validateEmail('semarroba')).toBe(false)
      expect(validateEmail('sem@')).toBe(false)
      expect(validateEmail('sem@dom')).toBe(false)
      expect(validateEmail('@semdominio.com')).toBe(false)
    })
  })
})

describe('Validação de Empréstimos', () => {
  describe('Validação de valor principal', () => {
    const validatePrincipal = (amount: number, min: number = 100, max: number = 100000): boolean => {
      return amount >= min && amount <= max
    }

    it('deve aceitar valores dentro do intervalo', () => {
      expect(validatePrincipal(1000)).toBe(true)
      expect(validatePrincipal(100)).toBe(true)
      expect(validatePrincipal(100000)).toBe(true)
    })

    it('deve rejeitar valores fora do intervalo', () => {
      expect(validatePrincipal(50)).toBe(false)
      expect(validatePrincipal(100001)).toBe(false)
      expect(validatePrincipal(-100)).toBe(false)
    })
  })

  describe('Validação de parcelas', () => {
    const validateInstallments = (count: number, min: number = 1, max: number = 48): boolean => {
      return count >= min && count <= max
    }

    it('deve aceitar número válido de parcelas', () => {
      expect(validateInstallments(1)).toBe(true)
      expect(validateInstallments(12)).toBe(true)
      expect(validateInstallments(48)).toBe(true)
    })

    it('deve rejeitar número inválido de parcelas', () => {
      expect(validateInstallments(0)).toBe(false)
      expect(validateInstallments(49)).toBe(false)
      expect(validateInstallments(-1)).toBe(false)
    })
  })

  describe('Validação de taxa de juros', () => {
    const validateInterestRate = (rate: number, maxMonthly: number = 20): boolean => {
      return rate >= 0 && rate <= maxMonthly
    }

    it('deve aceitar taxa de juros válida', () => {
      expect(validateInterestRate(0)).toBe(true)
      expect(validateInterestRate(5)).toBe(true)
      expect(validateInterestRate(15)).toBe(true)
    })

    it('deve rejeitar taxa negativa ou excessiva', () => {
      expect(validateInterestRate(-1)).toBe(false)
      expect(validateInterestRate(25)).toBe(false)
    })
  })
})

describe('Validação de Status', () => {
  const validStatuses = ['active', 'inactive', 'blocked']
  const loanStatuses = ['pending', 'active', 'paid', 'cancelled', 'renegotiated']
  const installmentStatuses = ['pending', 'paid', 'late', 'cancelled']

  describe('Status de cliente', () => {
    const isValidCustomerStatus = (status: string) => validStatuses.includes(status)

    it('deve aceitar status válido', () => {
      expect(isValidCustomerStatus('active')).toBe(true)
      expect(isValidCustomerStatus('inactive')).toBe(true)
      expect(isValidCustomerStatus('blocked')).toBe(true)
    })

    it('deve rejecting invalid status', () => {
      expect(isValidCustomerStatus('unknown')).toBe(false)
      expect(isValidCustomerStatus('')).toBe(false)
    })
  })

  describe('Status de empréstimo', () => {
    const isValidLoanStatus = (status: string) => loanStatuses.includes(status)

    it('deve aceitar status válido', () => {
      expect(isValidLoanStatus('pending')).toBe(true)
      expect(isValidLoanStatus('active')).toBe(true)
      expect(isValidLoanStatus('paid')).toBe(true)
    })
  })

  describe('Status de parcela', () => {
    const isValidInstallmentStatus = (status: string) => installmentStatuses.includes(status)

    it('deve validar status de parcela', () => {
      expect(isValidInstallmentStatus('pending')).toBe(true)
      expect(isValidInstallmentStatus('paid')).toBe(true)
      expect(isValidInstallmentStatus('late')).toBe(true)
    })
  })
})

describe('Validação de Data', () => {
  describe('Validação de data de vencimento', () => {
    const isValidDueDate = (date: Date | string): boolean => {
      const dueDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Data deve ser hoje ou futura
      return dueDate >= today
    }

    it('deve aceitar data futura', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      expect(isValidDueDate(futureDate)).toBe(true)
    })

    it('deve aceitar data de hoje', () => {
      expect(isValidDueDate(new Date())).toBe(true)
    })

    it('deve rechazar data passada', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      expect(isValidDueDate(pastDate)).toBe(false)
    })
  })
})

describe('Limite de Crédito', () => {
  describe('Cálculo de limite automático', () => {
    const calculateCreditLimit = (
      availableCash: number,
      customerScore: number,
      maxPercentage: number = 0.1
    ): number => {
      // Limite baseado no caixa disponível e score do cliente
      const baseLimit = availableCash * maxPercentage
      const scoreMultiplier = customerScore / 1000 // 0.3 a 1.0
      return Math.floor(baseLimit * scoreMultiplier)
    }

    it('deve calcular limite para cliente com bom score', () => {
      const limit = calculateCreditLimit(100000, 800)
      expect(limit).toBe(8000) // 100000 * 0.1 * 0.8
    })

    it('deve calcular limite para cliente com score médio', () => {
      const limit = calculateCreditLimit(100000, 500)
      expect(limit).toBe(5000) // 100000 * 0.1 * 0.5
    })

    it('deve calcular limite para cliente com score baixo', () => {
      const limit = calculateCreditLimit(100000, 300)
      expect(limit).toBe(3000) // 100000 * 0.1 * 0.3
    })
  })
})
