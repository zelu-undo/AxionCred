import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"

export function supabaseServer(authToken?: string, tenantId?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const options: any = {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }

  // Set tenant_id for RLS policies via PostgREST config
  if (tenantId) {
    options.postgrestSettings = {
      "app.current_tenant_id": tenantId,
    }
  }

  const client = createSupabaseServerClient(supabaseUrl, supabaseKey, options)
  
  return client
}
