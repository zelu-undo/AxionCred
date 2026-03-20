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
  console.log("[Auth] Creating Supabase client")
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  console.log("[Auth] Provider render - loading:", loading, "initialized:", initialized, "user:", user?.email)

  // Carregar do localStorage imediatamente
  useEffect(() => {
    console.log("[Auth] localStorage effect running")
    const stored = localStorage.getItem("axion_user")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.id && parsed.email) {
          console.log("[Auth] Loaded from localStorage:", parsed.email)
          setUser(parsed)
        }
      } catch (e) {
        console.error("[Auth] Error parsing localStorage:", e)
        localStorage.removeItem("axion_user")
      }
    }
  }, [])

  // Verificar sessão
  useEffect(() => {
    console.log("[Auth] Session check effect running")
    const supabase = createSupabaseClient()
    let mounted = true

    const checkSession = async () => {
      console.log("[Auth] checkSession - starting")
      try {
        console.log("[Auth] Calling getSession...")
        const result = await supabase.auth.getSession()
        console.log("[Auth] getSession result:", result)
        
        const { data: { session }, error } = result
        
        if (error) {
          console.error("[Auth] Session error:", error)
        }
        
        if (!mounted) {
          console.log("[Auth] Component unmounted, stopping")
          return
        }

        if (session?.user) {
          console.log("[Auth] Session found for:", session.user.email)
          
          // Buscar tenant_id
          let tenantId = ""
          try {
            const { data } = await supabase
              .from("users")
              .select("tenant_id")
              .eq("id", session.user.id)
              .single()
            if (data) tenantId = data.tenant_id || ""
            console.log("[Auth] tenantId fetched:", tenantId)
          } catch (e) {
            console.log("[Auth] Error fetching tenantId:", e)
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
          console.log("[Auth] User set:", appUser.email)
        } else {
          console.log("[Auth] No session found")
          setUser(null)
          localStorage.removeItem("axion_user")
        }
      } catch (err) {
        console.error("[Auth] Session check exception:", err)
      } finally {
        if (mounted) {
          console.log("[Auth] Setting loading=false, initialized=true")
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    checkSession()

    return () => { 
      console.log("[Auth] Session check effect cleanup")
      mounted = false 
    }
  }, [])

  // Redirect
  useEffect(() => {
    console.log("[Auth] Redirect effect - loading:", loading, "initialized:", initialized, "pathname:", pathname)
    
    if (!initialized || loading) {
      console.log("[Auth] Skipping redirect - not ready")
      return
    }
    
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith(r + "/"))
    console.log("[Auth] Redirect check - isPublic:", isPublic, "hasUser:", !!user)
    
    if (!user && !isPublic) {
      console.log("[Auth] Redirecting to /login")
      router.push("/login")
    }
  }, [user, loading, initialized, pathname, router])

  const signIn = async (email: string, password: string) => {
    console.log("[Auth] signIn called for:", email)
    const supabase = createSupabaseClient()
    
    try {
      console.log("[Auth] Calling signInWithPassword...")
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log("[Auth] signIn result - error:", error, "data:", data ? "user exists" : "no data")

      if (error) {
        console.error("[Auth] signIn error:", error)
        return { error: { message: error.message, code: error.code } }
      }

      if (data.user) {
        console.log("[Auth] signIn success, user:", data.user.email)

        let tenantId = ""
        try {
          const { data: u } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", data.user.id)
            .single()
          if (u) tenantId = u.tenant_id || ""
        } catch (e) {
          console.log("[Auth] Error fetching tenantId:", e)
        }

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "owner",
          tenantId,
          plan: "starter"
        }
        
        console.log("[Auth] Setting user and redirecting...")
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        router.push("/dashboard")
      }

      return { error: null }
    } catch (error: any) {
      console.error("[Auth] signIn exception:", error)
      return { error: { message: error.message || "Erro desconhecido", code: "EXCEPTION" } }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    console.log("[Auth] signUp called")
    const supabase = createSupabaseClient()
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name || email.split("@")[0] } }
      })

      if (error) {
        return { error: { message: error.message, code: error.code } }
      }

      if (!data.session) {
        return { error: { message: "Verifique seu e-mail para confirmar", code: "EMAIL_CONFIRM" } }
      }

      let tenantId = ""
      try {
        const { data: u } = await supabase.from("users").select("tenant_id").eq("id", data.user!.id).single()
        if (u) tenantId = u.tenant_id || ""
      } catch {}

      const appUser: AppUser = {
        id: data.user!.id,
        email: data.user!.email!,
        name: name || email.split("@")[0],
        role: "owner",
        tenantId
      }
      
      setUser(appUser)
      localStorage.setItem("axion_user", JSON.stringify(appUser))
      router.push("/dashboard")

      return { error: null }
    } catch (error) {
      return { error: { message: "Erro ao criar conta", code: "UNKNOWN" } }
    }
  }

  const signOut = async () => {
    console.log("[Auth] signOut called")
    const supabase = createSupabaseClient()
    setUser(null)
    localStorage.removeItem("axion_user")
    await supabase.auth.signOut()
    router.push("/login")
  }

  console.log("[Auth] Provider rendering with - loading:", loading, "initialized:", initialized, "user:", user?.email)

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
