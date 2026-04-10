"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { plans } from "@/lib/plans"
import { Button } from "@/components/ui/button"
import { X, Crown, ChevronUp } from "lucide-react"

// Banner context for state sharing between banner and layout
const BannerContext = createContext<{
  dismissed: boolean
  dismissBanner: () => void
}>({
  dismissed: false,
  dismissBanner: () => {}
})

export function useBanner() {
  return useContext(BannerContext)
}

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  
  // Reset dismissed state when user changes
  useEffect(() => {
    setDismissed(false)
  }, [user?.id])
  
  const dismissBanner = useCallback(() => {
    setDismissed(true)
  }, [])
  
  return (
    <BannerContext.Provider value={{ dismissed, dismissBanner }}>
      {children}
    </BannerContext.Provider>
  )
}

export function UpgradeBanner() {
  const { user } = useAuth()
  const { dismissed, dismissBanner } = useBanner()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Only show for free plan (and not for super_admin)
  if (!mounted || user?.plan !== 'free' || user?.role === 'super_admin' || dismissed) return null
  
  const nextPlan = plans.starter
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-amber-900 truncate">
                Plano Gratuito - Recursos Limitados
              </p>
              <p className="text-xs text-amber-700 hidden sm:block">
                Atualize para {nextPlan.name} por R$ {nextPlan.price}/mês e libere todos os recursos!
              </p>
              <p className="text-xs text-amber-700 sm:hidden">
                Atualize para {nextPlan.name}!
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button 
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2 sm:px-3"
              onClick={() => router.push("/settings/plan")}
            >
              <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Upgrade</span>
              <span className="sm:hidden">Up</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600 hover:text-amber-800"
              onClick={() => dismissBanner()}
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to check if banner should be visible
export function useBannerPadding() {
  const { user } = useAuth()
  const [showPadding, setShowPadding] = useState(false)
  
  useEffect(() => {
    // Show padding only if user is on free plan and not super_admin
    const shouldShow = user?.plan === 'free' && user?.role !== 'super_admin'
    setShowPadding(shouldShow)
  }, [user])
  
  return showPadding
}