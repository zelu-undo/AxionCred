'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/lib/toast'
import { Sparkles, Building2 } from 'lucide-react'

type OnboardingData = {
  isFirstLogin: boolean
  companyChanged: boolean
  previousCompanyId: string | null
}

export function OnboardingToast() {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check for onboarding data in session storage
    const onboardingData = sessionStorage.getItem("onboarding")
    
    if (onboardingData && !dismissed) {
      const data: OnboardingData = JSON.parse(onboardingData)
      
      // Clear from session storage after reading
      sessionStorage.removeItem("onboarding")
      
      // Show appropriate toast after a small delay
      setTimeout(() => {
        if (data.isFirstLogin) {
          showToast({
            title: "👋 Bem-vindo ao AXION!",
            description: "Pronto para começar? Acesse o tutorial para aprender como usar o sistema.",
            type: "success"
          })
        } else if (data.companyChanged) {
          showToast({
            title: "🏢 Bem-vindo à nova empresa!",
            description: "Você foi adicionado a uma nova empresa. Explore as funcionalidades.",
            type: "success"
          })
        }
      }, 1500)
    }
  }, [dismissed, router])

  return null
}