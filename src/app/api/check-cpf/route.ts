import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cpf = searchParams.get("cpf")
    const excludeId = searchParams.get("excludeId") // For edit mode - exclude current customer

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 })
    }

    const supabase = createClient()
    
    // Get current tenant from auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user to find tenant_id
    const { data: user } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", session.user.id)
      .single()

    if (!user?.tenant_id) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from("customers")
      .select("id, name, status, deleted_at")
      .eq("tenant_id", user.tenant_id)
      .eq("document", cpf)
      .in("status", ["active", "inactive", "blocked", "deleted"])

    // Exclude current customer in edit mode
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
