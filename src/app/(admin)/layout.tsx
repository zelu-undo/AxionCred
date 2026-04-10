"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if user is super admin
  useEffect(() => {
    if (mounted && user && user.role !== 'super_admin') {
      router.push('/dashboard')
    }
  }, [mounted, user, router])

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#22C55E]"></div>
          <p className="text-sm text-gray-500 animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Acesso restrito ao Super Admin</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}