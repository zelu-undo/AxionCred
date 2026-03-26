// Plan configuration for AXION Cred
// Defines what features are available in each plan

export type Plan = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanFeatures {
  name: string
  description: string
  price: number // in BRL
  modules: ModuleAccess[]
  limits: PlanLimits
}

export interface ModuleAccess {
  module: string
  access: 'none' | 'read' | 'write' | 'full'
}

export interface PlanLimits {
  maxCustomers: number
  maxLoans: number
  maxUsers: number
}

// All available modules in the system
export const availableModules = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral do negócio' },
  { key: 'customers', label: 'Clientes', description: 'Cadastro e gestão de clientes' },
  { key: 'loans', label: 'Empréstimos', description: 'Criação e gestão de empréstimos' },
  { key: 'business_rules', label: 'Regras de Negócio', description: 'Configuração de taxas e regras' },
  { key: 'payments', label: 'Pagamentos', description: 'Recebimento e registro de pagamentos' },
  { key: 'collections', label: 'Cobranças', description: 'Gestão de cobranças e atrasos' },
  { key: 'reports', label: 'Relatórios', description: 'Relatórios financeiros e аналитики' },
  { key: 'alerts', label: 'Alertas', description: 'Sistema de alertas e notificações' },
  { key: 'guarantors', label: 'Fiadores', description: 'Gestão de fiadores e garantias' },
  { key: 'renegotiations', label: 'Renegociações', description: 'Renegociação de dívidas' },
  { key: 'quick_sale', label: 'Venda Rápida', description: 'Venda de carteira inadimplente' },
  { key: 'settings', label: 'Configurações', description: 'Configurações da conta' },
]

// Plan definitions
export const plans: Record<Plan, PlanFeatures> = {
  free: {
    name: 'Gratuito',
    description: 'Para testar o sistema',
    price: 0,
    modules: [
      { module: 'dashboard', access: 'read' },
      { module: 'customers', access: 'read' },
      { module: 'loans', access: 'read' },
      { module: 'business_rules', access: 'read' },
      { module: 'payments', access: 'write' },
    ],
    limits: {
      maxCustomers: 50,
      maxLoans: 20,
      maxUsers: 1,
    },
  },
  starter: {
    name: 'Iniciante',
    description: 'Para pequenos negócios',
    price: 97,
    modules: [
      { module: 'dashboard', access: 'read' },
      { module: 'customers', access: 'full' },
      { module: 'loans', access: 'full' },
      { module: 'business_rules', access: 'write' },
      { module: 'payments', access: 'write' },
      { module: 'collections', access: 'write' },
      { module: 'reports', access: 'read' },
    ],
    limits: {
      maxCustomers: 200,
      maxLoans: 100,
      maxUsers: 3,
    },
  },
  pro: {
    name: 'Profissional',
    description: 'Para negócios em crescimento',
    price: 197,
    modules: [
      { module: 'dashboard', access: 'full' },
      { module: 'customers', access: 'full' },
      { module: 'loans', access: 'full' },
      { module: 'business_rules', access: 'full' },
      { module: 'payments', access: 'full' },
      { module: 'collections', access: 'full' },
      { module: 'reports', access: 'full' },
      { module: 'alerts', access: 'full' },
      { module: 'guarantors', access: 'full' },
      { module: 'renegotiations', access: 'full' },
    ],
    limits: {
      maxCustomers: 1000,
      maxLoans: 500,
      maxUsers: 10,
    },
  },
  enterprise: {
    name: 'Empresarial',
    description: 'Para grandes operações',
    price: 497,
    modules: [
      { module: 'dashboard', access: 'full' },
      { module: 'customers', access: 'full' },
      { module: 'loans', access: 'full' },
      { module: 'business_rules', access: 'full' },
      { module: 'payments', access: 'full' },
      { module: 'collections', access: 'full' },
      { module: 'reports', access: 'full' },
      { module: 'alerts', access: 'full' },
      { module: 'guarantors', access: 'full' },
      { module: 'renegotiations', access: 'full' },
      { module: 'quick_sale', access: 'full' },
      { module: 'settings', access: 'full' },
    ],
    limits: {
      maxCustomers: -1, // unlimited
      maxLoans: -1,
      maxUsers: -1,
    },
  },
}

// Helper function to check if module is accessible
export function hasModuleAccess(plan: Plan, module: string, requiredAccess: 'read' | 'write' | 'full' = 'read'): boolean {
  const planConfig = plans[plan]
  const moduleAccess = planConfig.modules.find(m => m.module === module)
  
  if (!moduleAccess) return false
  
  const accessLevels = { none: 0, read: 1, write: 2, full: 3 }
  const userLevel = accessLevels[moduleAccess.access]
  const requiredLevel = accessLevels[requiredAccess]
  
  return userLevel >= requiredLevel
}

// Helper to get plan from string
export function getPlan(planName: string): Plan {
  if (planName in plans) {
    return planName as Plan
  }
  return 'free' // default to free if unknown
}