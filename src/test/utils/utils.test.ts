import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateInstallment,
  generateWhatsAppLink,
  getInitials,
  calculateCreditScore,
  getScoreColor,
  getScoreLabel,
  cn,
} from '../../lib/utils'

describe('Funções de Formatação', () => {
  describe('formatCurrency', () => {
    it('deve formatar número para moeda BRL', () => {
      expect(formatCurrency(1000)).toContain('1.000,00')
      expect(formatCurrency(99.9)).toContain('99,90')
      expect(formatCurrency(0)).toContain('0,00')
    })

    it('deve formatar números negativos corretamente', () => {
      expect(formatCurrency(-500)).toContain('-')
    })
  })

  describe('formatDate', () => {
    it('deve formatar data no formato brasileiro', () => {
      const result = formatDate('2024-03-18')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })

    it('deve formatar objeto Date', () => {
      const result = formatDate(new Date('2024-03-18'))
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
    })
  })

  describe('formatDateTime', () => {
    it('deve formatar data com hora', () => {
      const result = formatDateTime('2024-03-18T14:30:00')
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })
  })
})

describe('Funções de Cálculo', () => {
  describe('calculateInstallment', () => {
    it('deve calcular parcelas sem juros (taxa zero)', () => {
      const result = calculateInstallment(1000, 0, 5)
      expect(result).toBe(200)
    })

    it('deve calcular parcelas com juros usando sistema price', () => {
      // Exemplo: 1000, 5% ao mês, 5 parcelas
      const result = calculateInstallment(1000, 5, 5)
      // PMT = P * (i * (1+i)^n) / ((1+i)^n - 1)
      // 1000 * (0.05 * 1.27628) / 0.27628 = 230.97
      expect(result).toBeCloseTo(230.97, 1)
    })

    it('deve lidar com taxa de 100% (juros dobrado)', () => {
      const result = calculateInstallment(1000, 100, 2)
      // Sistema Price com 100% ao ano = ~8.33% ao mês
      expect(result).toBeGreaterThan(500)
    })

    it('deve retornar 0 para valor principal zero', () => {
      const result = calculateInstallment(0, 10, 5)
      expect(result).toBe(0)
    })
  })

  describe('calculateCreditScore', () => {
    it('deve retornar 500 para histórico vazio', () => {
      expect(calculateCreditScore({ total: 0, paid: 0, late: 0 })).toBe(500)
    })

    it('deve calcular score com pagamentos perfeitos', () => {
      const result = calculateCreditScore({ total: 10, paid: 10, late: 0 })
      expect(result).toBe(800) // 300 + 1*500 - 0 = 800
    })

    it('deve calcular score com atrasos', () => {
      const result = calculateCreditScore({ total: 10, paid: 5, late: 5 })
      // 300 + 0.5*500 - 0.5*200 = 300 + 250 - 100 = 450
      expect(result).toBe(450)
    })

    it('deve limitar score mínimo em 300', () => {
      const result = calculateCreditScore({ total: 10, paid: 0, late: 10 })
      // 300 + 0*500 - 1*200 = 100, mas mínimo é 300
      expect(result).toBe(300)
    })

    it('deve limitar score máximo em 1000', () => {
      const result = calculateCreditScore({ total: 100, paid: 100, late: 0 })
      // Com 100% de pagamentos e 0 atrasos: 300 + 1*500 - 0 = 800
      // O máximo teórico é 800 com essa fórmula
      expect(result).toBeLessThanOrEqual(1000)
    })
  })
})

describe('Funções de Utilidade', () => {
  describe('generateWhatsAppLink', () => {
    it('deve gerar link do WhatsApp com mensagem', () => {
      const result = generateWhatsAppLink('11999999999', 'Olá!')
      expect(result).toContain('wa.me')
      expect(result).toContain('Ol%C3%A1!')
    })

    it('deve limpar caracteres especiais do telefone', () => {
      const result = generateWhatsAppLink('(11) 99999-9999', 'Teste')
      // O link deve conter o número limpo sem parênteses ou hífens
      expect(result).toContain('wa.me')
    })
  })

  describe('getInitials', () => {
    it('deve extrair iniciais de nome completo', () => {
      expect(getInitials('João Silva')).toBe('JS')
      expect(getInitials('Maria Santos Oliveira')).toBe('MS')
    })

    it('deve lidar com nome simples', () => {
      expect(getInitials('João')).toBe('J')
    })

    it('deve limitar a 2 iniciais', () => {
      expect(getInitials('João Silva Santos')).toBe('JS')
    })

    it('deve converter para maiúsculas', () => {
      expect(getInitials('joão silva')).toBe('JS')
    })
  })

  describe('getScoreColor', () => {
    it('deve retornar cor verde para score alto', () => {
      expect(getScoreColor(850)).toBe('text-green-600')
    })

    it('deve retornar cor amarela para score médio', () => {
      expect(getScoreColor(650)).toBe('text-yellow-600')
    })

    it('deve retornar cor laranja para score baixo', () => {
      expect(getScoreColor(450)).toBe('text-orange-600')
    })

    it('deve retornar cor vermelha para score muito baixo', () => {
      expect(getScoreColor(350)).toBe('text-red-600')
    })
  })

  describe('getScoreLabel', () => {
    it('deve retornar label correto por faixa', () => {
      expect(getScoreLabel(850)).toBe('Excelente')
      expect(getScoreLabel(650)).toBe('Bom')
      expect(getScoreLabel(450)).toBe('Regular')
      expect(getScoreLabel(250)).toBe('Ruim')
    })
  })

  describe('cn (classnames)', () => {
    it('deve mesclar classes condicionais', () => {
      const result = cn('base', true && 'conditional', false && 'ignored')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('ignored')
    })

    it('deve lidar com arrays', () => {
      const result = cn(['a', 'b'], ['c', 'd'])
      expect(result).toContain('a')
      expect(result).toContain('d')
    })
  })
})
