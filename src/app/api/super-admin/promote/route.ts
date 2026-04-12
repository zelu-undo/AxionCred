import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Secret key to allow self-promotion to super admin (for recovery purposes)
// In production, this should be set as an environment variable
const SELF_PROMOTE_SECRET = process.env.SELF_PROMOTE_SECRET || "axion-cred-recovery-2024"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, userId } = body

    // Verify secret key
    if (secret !== SELF_PROMOTE_SECRET) {
      return NextResponse.json(
        { error: "Chave de recuperação inválida" },
        { status: 401 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuração do Supabase incompleta" },
        { status: 500 }
      )
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Update user to super admin
    const { data, error } = await supabase
      .from("users")
      .update({ 
        role: "super_admin",
        is_super_admin: true
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error promoting user:", error)
      return NextResponse.json(
        { error: "Erro ao promover usuário: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Usuário promovido a Super Admin!",
      user: data
    })

  } catch (error: any) {
    console.error("Self-promotion error:", error)
    return NextResponse.json(
      { error: "Erro interno: " + error.message },
      { status: 500 }
    )
  }
}