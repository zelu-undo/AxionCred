import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"

export function supabaseServer(authToken?: string, tenantId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const headers: Record<string, string> = {}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }

  // Set tenant_id for RLS policies via custom header
  // Supabase PostgREST reads custom headers with x-kps- prefix
  if (tenantId) {
    headers["x-kps-tenant-id"] = tenantId
  }

  const client = createSupabaseServerClient(supabaseUrl, supabaseKey, {
    global: {
      headers,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  
  return client
}
