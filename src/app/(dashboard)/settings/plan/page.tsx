"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { plans, plans as planConfigs } from "@/lib/plans"
import { Check, Crown, Zap, Building2, Rocket, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const planIcons = {
  free: Rocket,
  starter: Crown,
  pro: Zap,
  enterprise: Building2,
}

export default function PlanPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  
  const currentPlan = user?.plan || 'free'
  
  const handleSelectPlan = async (planKey: string) => {
    if (planKey === currentPlan) return
    
    setLoading(planKey)
    
    // Simulate payment processing (in real app, integrate with payment gateway)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Update plan in database
    // const { error } = await supabase.from("tenants").update({ plan: planKey }).eq("id", user.tenantId)
    
    setLoading(null)
    alert(`Plano ${planConfigs[planKey as keyof typeof planConfigs].name} selecionado! Em um ambiente real, você seria redirecionado para o pagamento.`)
  }
  
  const planEntries = Object.entries(plans) as [string, typeof plans.free][]
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecione o plano que melhor atendendo suas necessidades. 
          Comece gratuitamente e upgrade quando precisar de mais recursos.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planEntries.map(([key, plan], index) => {
          const Icon = planIcons[key as keyof typeof planIcons]
          const isCurrent = currentPlan === key
          const isPopular = key === 'starter'
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col ${isPopular ? 'border-[#22C55E] border-2 relative' : 'border-gray-200'} ${isCurrent ? 'bg-green-50' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#22C55E] text-white px-3">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                    key === 'free' ? 'bg-gray-100' :
                    key === 'starter' ? 'bg-amber-100' :
                    key === 'pro' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <Icon className={`w-7 h-7 ${
                      key === 'free' ? 'text-gray-600' :
                      key === 'starter' ? 'text-amber-600' :
                      key === 'pro' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {plan.price}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.modules.slice(0, 6).map((mod) => (
                      <li key={mod.module} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${mod.access === 'full' ? 'text-[#22C55E]' : mod.access === 'write' ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className={mod.access === 'none' ? 'text-gray-400' : 'text-gray-700'}>
                          {mod.module === 'dashboard' && 'Dashboard'}
                          {mod.module === 'customers' && 'Clientes'}
                          {mod.module === 'loans' && 'Empréstimos'}
                          {mod.module === 'business_rules' && 'Regras de Negócio'}
                          {mod.module === 'payments' && 'Pagamentos'}
                          {mod.module === 'collections' && 'Cobranças'}
                          {mod.module === 'reports' && 'Relatórios'}
                          {mod.module === 'alerts' && 'Alertas'}
                          {mod.module === 'guarantors' && 'Fiadores'}
                          {mod.module === 'renegotiations' && 'Renegociações'}
                          {mod.module === 'quick_sale' && 'Venda Rápida'}
                          {mod.module === 'settings' && 'Configurações'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      Limite: {plan.limits.maxCustomers === -1 ? 'Ilimitado' : plan.limits.maxCustomers} clientes, 
                      {plan.limits.maxUsers === -1 ? ' ilimitado' : ` ${plan.limits.maxUsers}`} usuários
                    </p>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-4">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-green-600">
                      <Check className="w-4 h-4 mr-2" />
                      Plano Atual
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleSelectPlan(key)}
                      disabled={loading === key}
                    >
                      {loading === key && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Selecionar
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${isPopular ? 'bg-[#22C55E] hover:bg-[#16a34a]' : ''}`}
                      onClick={() => handleSelectPlan(key)}
                      disabled={loading === key}
                    >
                      {loading === key && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Assinar por R$ {plan.price}/mês
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Precisa de ajuda para escolher? 
          <Button variant="link" className="text-[#22C55E]" onClick={() => router.push('/support')}>
            Fale com nosso time
          </Button>
        </p>
      </div>
    </div>
  )
}