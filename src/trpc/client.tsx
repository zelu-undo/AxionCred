"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { useState, useEffect, useMemo } from "react"
import type { AppRouter } from "@/server/routers"

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== "undefined") return ""
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

// Check if user is logged in (demo mode)
function checkIsDemoMode(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("axion_user")
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Use state but initialize with synchronous check
  const [isDemoMode, setIsDemoMode] = useState(() => checkIsDemoMode())

  useEffect(() => {
    // Listen for changes in localStorage
    const handleStorage = () => {
      setIsDemoMode(checkIsDemoMode())
    }
    
    // Also check on mount in case localStorage changed
    setIsDemoMode(checkIsDemoMode())
    
    // Poll every second for localStorage changes (for demo login/logout)
    const interval = setInterval(() => {
      setIsDemoMode(checkIsDemoMode())
    }, 1000)
    
    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
      clearInterval(interval)
    }
  }, [])

  // Create client with current isDemoMode value
  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: {
            // Always send demo mode header - server will handle both cases
            "x-demo-mode": isDemoMode ? "true" : "false",
          },
        }),
      ],
    })
  }, [isDemoMode])

  return (
    <trpc.Provider 
      client={trpcClient} 
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
