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
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
