'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function UsersRedirectPage() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Redirect to /super-admin?tab=users
    window.location.href = '/super-admin?tab=users'
  }, [])
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
    </div>
  )
}