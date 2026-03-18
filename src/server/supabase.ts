import { createClient as createSupabaseServerClient } from "@supabase/supabase-js"

export function supabaseServer(authToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createSupabaseServerClient(supabaseUrl, supabaseKey, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
