"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function DebugUserPage() {
  const [dbData, setDbData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFromDb() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      )
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError("No session found")
        setLoading(false)
        return
      }

      setDbData({ sessionUserId: session.user.id, sessionEmail: session.user.email })

      try {
        // Try to fetch from users table
        const { data, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (dbError) {
          setError(`DB Error: ${dbError.message}`)
        } else {
          setDbData((prev: any) => ({ ...prev, usersTable: data }))
        }
      } catch (err: any) {
        setError(`Exception: ${err.message}`)
      }

      // Also check tenants
      try {
        const { data: tenantsData } = await supabase
          .from("tenants")
          .select("*")
          .maybeSingle()

        setDbData((prev: any) => ({ ...prev, tenantsTable: tenantsData }))
      } catch (err: any) {
        // ignore
      }

      setLoading(false)
    }

    fetchFromDb()
  }, [])

  if (loading) {
    return <div className="p-8">Carregando...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug - Dados do Banco</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Erro:</p>
          <p>{error}</p>
        </div>
      )}
      
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(dbData, null, 2)}
      </pre>
    </div>
  )
}