"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { useState, useEffect } from "react"
import type { AppRouter } from "@/server/routers"

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== "undefined") return ""
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
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

  // Check if we're in demo mode - needs to be reactive
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check localStorage after mount
    const storedUser = localStorage.getItem("axion_user")
    setIsDemoMode(!!storedUser)
  }, [])

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            // Send demo mode header if user is in demo mode
            if (isDemoMode) {
              return { "x-demo-mode": "true" }
            }
            return {}
          },
        }),
      ],
    })
  )

  // Recreate client when demo mode changes
  const [clientKey, setClientKey] = useState(0)
  useEffect(() => {
    setClientKey(prev => prev + 1)
  }, [isDemoMode])

  return (
    <trpc.Provider 
      key={clientKey}
      client={trpcClient} 
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
