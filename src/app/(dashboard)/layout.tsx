"use client"

import { Sidebar, Header } from "@/components/dashboard/shell"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { PageTransition } from "@/components/ui/page-transition"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, isInitialized } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Avoid hydration mismatch - only render after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Mostrar loading spinner durante o carregamento inicial
  // Também mostra enquanto isInitialized é false (verificação de sessão em andamento)
  if (!mounted || !isInitialized || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#22C55E]"></div>
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Carregando...</p>
        </div>
      </div>
    )
  }
  
  // Se não está autenticado após a verificação, esperar um pouco mais
  // O middleware e o AuthProvider vão lidar com o redirecionamento
  // Apenas mostrar loading enquanto isso
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
          <p className="text-sm text-gray-500">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
