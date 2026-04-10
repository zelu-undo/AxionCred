'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function CompaniesRedirectPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to /super-admin?tab=companies
    window.location.href = '/super-admin?tab=companies'
  }, [])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
    </div>
  )
}