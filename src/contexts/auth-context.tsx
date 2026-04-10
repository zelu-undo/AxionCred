"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { plans, hasModuleAccess, type Plan } from "@/lib/plans"

type AppUser = {
  id: string
  email: string
  name: string
  role: string
  tenantId: string
  plan?: string
  planAccess?: string[] // List of accessible modules
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
          let userRole = "owner"
          let userPlan: Plan = "free"
          
          try {
            const { data } = await supabase.from("users").select("tenant_id, role").eq("id", session.user.id).maybeSingle()
            if (data) {
              tenantId = data.tenant_id || ""
              userRole = data.role || "owner"
              
              // Super admin tem acesso total
              if (userRole === 'super_admin') {
                userPlan = 'enterprise'
              }
            }
            
            // If no user found, create one
            if (!data) {
              // Create user first without tenant
              const { error: userError } = await supabase
                .from("users")
                .upsert({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
                  role: "owner",
                  is_active: true
                })
              
              if (!userError) {
                userRole = "owner"
              }
            }
            
            // If still no tenant, create one
            if (!tenantId) {
              // Create tenant
              const { data: newTenant, error: tenantError } = await supabase
                .from("tenants")
                .insert({
                  name: session.user.email?.split("@")[0] || "Minha Empresa",
                  slug: session.user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") || "empresa",
                  plan: userRole === 'super_admin' ? 'enterprise' : 'free'
                })
                .select()
                .maybeSingle()
              
              if (!tenantError && newTenant) {
                // Update user with tenant_id
                await supabase
                  .from("users")
                  .update({ tenant_id: newTenant.id })
                  .eq("id", session.user.id)
                
                tenantId = newTenant.id
              }
            }
          } catch (err) {
            // Silent fail
          }

          // Get plan from tenant if exists
          if (tenantId && userPlan === 'free') {
            const { data: tenant } = await supabase.from("tenants").select("plan").eq("id", tenantId).maybeSingle()
            if (tenant?.plan) {
              userPlan = tenant.plan as Plan
            }
          }

          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
            role: userRole,
            tenantId,
            plan: userPlan,
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        } else {
          setUser(null)
          localStorage.removeItem("axion_user")
        }
      } catch (err) {
        // Silent fail
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
      
      // Fazer signIn com timeout de 15 segundos
      const { data, error } = await fetchWithTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        15000
      )


      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      if (data.user) {
        let tenantId = ""
        let userPlan: Plan = "free"
        let userRole = "owner"
        
        try {
          // Fetch user with tenant info
          const { data: u } = await supabase
            .from("users")
            .select("tenant_id, role")
            .eq("id", data.user.id)
            .maybeSingle()
          
          if (u) {
            tenantId = u.tenant_id || ""
            userRole = u.role || "owner"
            
            // Super admin always has full access
            if (userRole === 'super_admin') {
              userPlan = 'enterprise'
            }
            // If user has a tenant, fetch the plan
            else if (tenantId) {
              const { data: tenant } = await supabase
                .from("tenants")
                .select("plan")
                .eq("id", tenantId)
                .maybeSingle()
              
              if (tenant?.plan) {
                userPlan = tenant.plan as Plan
              }
            }
          }
          
          // If no user found, create one (without tenant by default)
          if (!u) {
            const { error: userError } = await supabase
              .from("users")
              .upsert({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Usuário",
                role: "owner",
                is_active: true
                // NOT setting tenant_id - user will be without company until invited
              })
            
            if (!userError) {
              userRole = "owner"
            }
          }
          
          // NEW LOGIC: Check for pending invites before creating/associating tenant
          // Only associate if there's a valid invite, otherwise leave user without company
          if (!tenantId) {
            // Check for pending invite
            const { data: invite } = await supabase
              .from("invites")
              .select("tenant_id, role")
              .eq("email", data.user.email)
              .eq("status", "pending")
              .gte("expires_at", new Date().toISOString())
              .maybeSingle()
            
            if (invite) {
              // Valid invite found - accept it
              await supabase
                .from("users")
                .update({ 
                  tenant_id: invite.tenant_id,
                  role: invite.role
                })
                .eq("id", data.user.id)
              
              // Update invite status
              await supabase
                .from("invites")
                .update({ status: "accepted" })
                .eq("email", data.user.email)
                .eq("tenant_id", invite.tenant_id)
              
              tenantId = invite.tenant_id
              userRole = invite.role || "owner"
              
              // Get tenant plan
              const { data: tenant } = await supabase
                .from("tenants")
                .select("plan")
                .eq("id", tenantId)
                .maybeSingle()
              
              if (tenant?.plan) {
                userPlan = tenant.plan as Plan
              }
            }
            // NO INVITE: Do NOT create or associate tenant - leave user without company
            // User must be invited to join a company
          }
        } catch (err) {
          // Silent fail
        }

        // Calculate accessible modules based on plan
        const planConfig = plans[userPlan]
        const accessibleModules = planConfig.modules
          .filter(m => m.access !== 'none')
          .map(m => m.module)
        
        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: userRole,
          tenantId,
          plan: userPlan,
          planAccess: accessibleModules
        }
        
        // Clear old cached data and set new
        localStorage.removeItem("axion_user")
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        
        // Redirect based on plan, role and company status
        if (userRole === 'super_admin') {
          router.push("/dashboard")
        } else if (!tenantId) {
          // User has no company - redirect to no-company page
          router.push("/no-company")
        } else if (userPlan === 'free') {
          router.push("/dashboard?plan=free") // Show upgrade banner
        } else {
          router.push("/dashboard")
        }
      }

      return { error: null }
    } catch (error) {
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
