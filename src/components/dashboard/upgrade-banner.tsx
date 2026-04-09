"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { plans } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import { X, Crown, ChevronUp } from "lucide-react"

export function UpgradeBanner() {
  const { user } = useAuth()
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  
  // Only show for free plan
  if (user?.plan !== 'free' || dismissed) return null
  
  const nextPlan = plans.starter
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Plano Gratuito - Recursos Limitados
              </p>
              <p className="text-xs text-amber-700">
                Atualize para {nextPlan.name} por R$ {nextPlan.price}/mês e libere todos os recursos!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => router.push("/settings/plan")}
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-600 hover:text-amber-800"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}