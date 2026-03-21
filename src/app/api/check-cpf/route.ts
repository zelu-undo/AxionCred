import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get("cpf")
    const excludeId = searchParams.get("excludeId")

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 })
    }

    // Get the authorization header (session token from client)
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.replace("Bearer ", "")
    
    // Create server client with the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuração inválida" }, { status: 500 })
    }
    
    // Use import dinâmico para evitar problemas com o cliente browser
    const { createClient: createServerClient } = await import("@supabase/supabase-js")
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
    
    // Get current user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user to find tenant_id
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!userData?.tenant_id) {
      // If no tenant, just return that CPF doesn't exist (for new users)
      return NextResponse.json({ exists: false })
    }

    // Build query
    let query = supabase
      .from("customers")
      .select("id, name, status, deleted_at")
      .eq("tenant_id", userData.tenant_id)
      .eq("document", cpf)
      .in("status", ["active", "inactive", "blocked", "deleted"])

    if (excludeId) {
      query = query.neq("id", excludeId)
    }

    const { data: existing, error } = await query.limit(1).single()

    if (existing) {
      return NextResponse.json({
        exists: true,
        deleted: existing.status === "deleted",
        name: existing.name,
        deletedAt: existing.deleted_at ? new Date(existing.deleted_at).toLocaleDateString("pt-BR") : null,
      })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error("Error checking CPF:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
