"use client"

import { Sidebar, Header } from "@/components/dashboard/shell"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  
  // Avoid hydration mismatch - only render after client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Show loading spinner during initial load or if no user
  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
      </div>
    )
  }
  
  // If not authenticated after loading, the middleware will handle the redirect
  // This is a fallback safety check
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
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
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
