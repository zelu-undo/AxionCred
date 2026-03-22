"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

type AppUser = {
  id: string
  email: string
  name: string
  role: string
  tenantId: string
  plan?: string
}

type AuthError = {
  message: string
  code?: string
}

type AuthContextType = {
  user: AppUser | null
  loading: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const publicRoutes = ["/", "/login", "/register", "/alerts", "/super-admin", "/demo"]

function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Função para fazer fetch com timeout
async function fetchWithTimeout(promise: Promise<any>, timeoutMs: number = 10000): Promise<any> {
  let timeoutId: NodeJS.Timeout
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Timeout excedido. Verifique sua conexão.")), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Carregar do localStorage imediatamente
  useEffect(() => {
    const stored = localStorage.getItem("axion_user")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.id && parsed.email) {
          setUser(parsed)
        }
      } catch {
        localStorage.removeItem("axion_user")
      }
    }
  }, [])

  // Verificar sessão
  useEffect(() => {
    const supabase = createSupabaseClient()
    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await fetchWithTimeout(supabase.auth.getSession(), 5000)
        
        if (!mounted) return

        if (session?.user) {
          let tenantId = ""
          try {
            const { data } = await supabase.from("users").select("tenant_id").eq("id", session.user.id).single()
            if (data) {
              tenantId = data.tenant_id || ""
            }
            
            // Se não encontrar tenant, criar automaticamente
            if (!tenantId) {
              console.log("[Auth] Criando tenant e usuário automaticamente...")
              
              // Criar tenant
              const { data: newTenant, error: tenantError } = await supabase
                .from("tenants")
                .insert({
                  name: session.user.email?.split("@")[0] || "Minha Empresa",
                  slug: session.user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "empresa",
                  plan: "starter"
                })
                .select()
                .single()
              
              if (tenantError) {
                console.error("[Auth] Erro ao criar tenant:", tenantError)
              } else if (newTenant) {
                // Criar usuário na tabela users com tenant_id
                const { error: userError } = await supabase
                  .from("users")
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
                    tenant_id: newTenant.id,
                    role: "owner",
                    is_active: true
                  })
                
                if (userError) {
                  console.error("[Auth] Erro ao criar usuário:", userError)
                } else {
                  tenantId = newTenant.id
                  console.log("[Auth] Tenant e usuário criados com sucesso!")
                }
              }
            }
          } catch (err) {
            console.error("[Auth] Erro ao buscar/criar usuário:", err)
          }

          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
            role: "owner",
            tenantId,
            plan: "starter"
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        } else {
          setUser(null)
          localStorage.removeItem("axion_user")
        }
      } catch (err) {
        console.error("[Auth] Session error:", err)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    checkSession()

    return () => { mounted = false }
  }, [])

  // Redirect
  useEffect(() => {
    if (!initialized || loading) return
    
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))
    
    if (!user && !isPublic) {
      router.push("/login")
    }
  }, [user, loading, initialized, pathname, router])

  const signIn = async (email: string, password: string) => {
    const supabase = createSupabaseClient()
    
    try {
      console.log("[Auth] signIn - starting...")
      
      // Fazer signIn com timeout de 15 segundos
      const { data, error } = await fetchWithTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000
      )

      console.log("[Auth] signIn - got response, error:", error)

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      if (data.user) {
        let tenantId = ""
        try {
          const { data: u } = await supabase.from("users").select("tenant_id").eq("id", data.user.id).single()
          if (u) {
            tenantId = u.tenant_id || ""
          }
          
          // Se não encontrar tenant, criar automaticamente
          if (!tenantId) {
            console.log("[Auth] Criando tenant e usuário automaticamente...")
            
            // Criar tenant
            const { data: newTenant, error: tenantError } = await supabase
              .from("tenants")
              .insert({
                name: data.user.email?.split("@")[0] || "Minha Empresa",
                slug: data.user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "empresa",
                plan: "starter"
              })
              .select()
              .single()
            
            if (tenantError) {
              console.error("[Auth] Erro ao criar tenant:", tenantError)
            } else if (newTenant) {
              // Criar usuário na tabela users com tenant_id
              const { error: userError } = await supabase
                .from("users")
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário",
                  tenant_id: newTenant.id,
                  role: "owner",
                  is_active: true
                })
              
              if (userError) {
                console.error("[Auth] Erro ao criar usuário:", userError)
              } else {
                tenantId = newTenant.id
                console.log("[Auth] Tenant e usuário criados com sucesso!")
              }
            }
          }
        } catch (err) {
          console.error("[Auth] Erro ao buscar/criar usuário:", err)
        }

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "owner",
          tenantId,
          plan: "starter"
        }
        
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        router.push("/dashboard")
      }

      return { error: null }
    } catch (error) {
      console.error("[Auth] signIn exception:", error)
      return { error: { message: (error as Error).message || "Erro de conexão. Tente novamente.", code: "TIMEOUT" } }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await fetchWithTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name || email.split("@")[0] } }
        }),
        15000
      )

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      if (!data.session) {
        return { error: { message: "Verifique seu e-mail para confirmar", code: "EMAIL_CONFIRM" } }
      }

      let tenantId = ""
      try {
        const { data: u } = await supabase.from("users").select("tenant_id").eq("id", data.user!.id).single()
        if (u) {
          tenantId = u.tenant_id || ""
        }
        
        // Se não encontrar tenant, criar automaticamente
        if (!tenantId) {
          console.log("[Auth] Criando tenant e usuário automaticamente...")
          
          // Criar tenant
          const { data: newTenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
              name: name || email.split("@")[0] || "Minha Empresa",
              slug: (name || email.split("@")[0])?.toLowerCase().replace(/[^a-z0-9]/g, "") || "empresa",
              plan: "starter"
            })
            .select()
            .single()
          
          if (tenantError) {
            console.error("[Auth] Erro ao criar tenant:", tenantError)
          } else if (newTenant) {
            // Criar usuário na tabela users com tenant_id
            const { error: userError } = await supabase
              .from("users")
              .insert({
                id: data.user!.id,
                email: data.user!.email,
                name: name || email.split("@")[0] || "Usuário",
                tenant_id: newTenant.id,
                role: "owner",
                is_active: true
              })
            
            if (userError) {
              console.error("[Auth] Erro ao criar usuário:", userError)
            } else {
              tenantId = newTenant.id
              console.log("[Auth] Tenant e usuário criados com sucesso!")
            }
          }
        }
      } catch (err) {
        console.error("[Auth] Erro ao buscar/criar usuário:", err)
      }

      const appUser: AppUser = {
        id: data.user!.id,
        email: data.user!.email!,
        name: name || email.split("@")[0],
        role: "owner",
        tenantId,
        plan: "starter"
      }
      
      setUser(appUser)
      localStorage.setItem("axion_user", JSON.stringify(appUser))
      router.push("/dashboard")

      return { error: null }
    } catch (error) {
      return { error: { message: (error as Error).message || "Erro de conexão", code: "TIMEOUT" } }
    }
  }

  const signOut = async () => {
    const supabase = createSupabaseClient()
    setUser(null)
    localStorage.removeItem("axion_user")
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, isInitialized: initialized, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
