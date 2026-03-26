// Hook para verificar acesso a módulos baseado no plano
import { useAuth } from "@/contexts/auth-context"
import { hasModuleAccess, type Plan } from "@/lib/plans"

export function usePlanAccess() {
  const { user } = useAuth()
  
  const plan = (user?.plan || 'free') as Plan
  
  const canAccess = (module: string, requiredAccess: 'read' | 'write' | 'full' = 'read'): boolean => {
    return hasModuleAccess(plan, module, requiredAccess)
  }
  
  const getAccessibleModules = (): string[] => {
    return user?.planAccess || []
  }
  
  const isFree = plan === 'free'
  const isStarter = plan === 'starter'
  const isPro = plan === 'pro'
  const isEnterprise = plan === 'enterprise'
  
  return {
    plan,
    canAccess,
    getAccessibleModules,
    isFree,
    isStarter,
    isPro,
    isEnterprise,
    isPaid: plan !== 'free',
  }
}