"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase"
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
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 0,
            onError: (error) => {
              console.error("[tRPC] Mutation error:", error)
            },
          },
        },
      })
  )

  const [sessionToken, setSessionToken] = useState<string>("")

  useEffect(() => {
    // Get Supabase session token
    const getSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setSessionToken(session.access_token)
      }
    }

    getSession()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        setSessionToken(session.access_token)
      } else {
        setSessionToken("")
        // Clear all queries when user logs out to prevent stale data
        queryClient.clear()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  // Create client with session token
  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers: {
            // Send Supabase session token for authentication
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
        }),
      ],
    })
  }, [sessionToken])

  return (
    <trpc.Provider 
      client={trpcClient} 
      queryClient={queryClient}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
