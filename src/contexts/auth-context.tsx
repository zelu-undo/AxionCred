"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

// Criar cliente supabase apenas uma vez
const supabaseClient = createClient()

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

function mapAuthError(error: any, locale: string = "pt"): AuthError {
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return {
      message: locale === "en" ? "An unexpected error occurred. Please try again." : 
              locale === "es" ? "Ocurriu un error inesperado. Intenta de nuevo." : 
              "Ocorreu um erro inesperado. Tente novamente.",
      code: "EMPTY_ERROR"
    }
  }

  const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error))
  const errorLower = errorMessage.toLowerCase()
  
  if (errorLower.includes("invalid login credentials") || errorLower.includes("invalid email or password")) {
    return { 
      message: locale === "en" ? "Invalid email or password" : 
              locale === "es" ? "Correo o contraseña incorrectos" : 
              "E-mail ou senha incorretos",
      code: "INVALID_CREDENTIALS"
    }
  }
  
  if (errorLower.includes("email already in use") || errorLower.includes("email already registered")) {
    return { 
      message: locale === "en" ? "This email is already registered" : 
              locale === "es" ? "Este correo ya está registrado" : 
              "Este e-mail já está cadastrado",
      code: "EMAIL_EXISTS"
    }
  }
  
  if (errorLower.includes("email not confirmed") || errorLower.includes("confirm your email")) {
    return { 
      message: locale === "en" ? "Please confirm your email. Check your inbox for the confirmation link." : 
              locale === "es" ? "Por favor confirma tu correo. Revisa tu bandeja de entrada." : 
              "Por favor, confirme seu e-mail. Verifique sua caixa de entrada.",
      code: "EMAIL_NOT_CONFIRMED"
    }
  }
  
  if (errorLower.includes("network") || errorLower.includes("fetch")) {
    return { 
      message: locale === "en" ? "Connection error. Please try again." : 
              locale === "es" ? "Error de conexión. Intenta de nuevo." : 
              "Erro de conexão. Tente novamente.",
      code: "NETWORK_ERROR"
    }
  }
  
  return { message: error.message, code: "UNKNOWN" }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const publicRoutes = ["/", "/login", "/register", "/alerts", "/super-admin", "/demo"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = supabaseClient

  // Initial session check
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted && session?.user) {
          // Buscar tenant_id do banco de dados
          let tenantId = ""
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("tenant_id")
              .eq("id", session.user.id)
              .single()
            
            if (userData) {
              tenantId = userData.tenant_id || ""
            }
          } catch (err) {
            console.log("[Auth] Using fallback tenant_id")
          }

          const appUser: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
            role: "owner",
            tenantId: tenantId,
            plan: "starter"
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        }
      } catch (err) {
        console.error("[Auth] Session check error:", err)
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    initAuth()

    return () => {
      mounted = false
    }
  }, [])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Buscar tenant_id do banco de dados
        let tenantId = ""
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", session.user.id)
            .single()
          
          if (userData) {
            tenantId = userData.tenant_id || ""
          }
        } catch (err) {
          console.log("[Auth] Using fallback tenant_id")
        }

        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
          role: "owner",
          tenantId: tenantId,
          plan: "starter"
        }
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
      } else {
        setUser(null)
        localStorage.removeItem("axion_user")
      }
      // Always set initialized to true when we get auth state
      setInitialized(true)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!initialized || loading) return
    
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route + "/")
    )
    
    if (!user && !isPublicRoute) {
      router.push("/login")
    }
  }, [user, loading, initialized, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: mapAuthError(error) }
      }

      if (data.user && data.session) {
        // Buscar tenant_id do banco de dados
        let tenantId = ""
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id, role")
            .eq("id", data.user.id)
            .single()
          
          if (userData) {
            tenantId = userData.tenant_id || ""
          }
        } catch (err) {
          console.log("[Auth] Using fallback tenant_id")
        }

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "owner",
          tenantId: tenantId,
          plan: "starter"
        }
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        router.push("/dashboard")
      }

      return { error: null }
    } catch (error: any) {
      return { error: mapAuthError(error) }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name || email.split("@")[0] }
        }
      })

      if (error) {
        return { error: mapAuthError(error) }
      }

      if (!data.session) {
        return { 
          error: { 
            message: "Por favor, verifique seu e-mail para confirmar sua conta",
            code: "EMAIL_CONFIRMATION_REQUIRED" 
          } 
        }
      }

      // Buscar tenant_id do banco de dados
      let tenantId = ""
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("tenant_id")
          .eq("id", data.user!.id)
          .single()
        
        if (userData) {
          tenantId = userData.tenant_id || ""
        }
      } catch (err) {
        console.log("[Auth] Using fallback tenant_id")
      }

      const appUser: AppUser = {
        id: data.user!.id,
        email: data.user!.email!,
        name: name || email.split("@")[0],
        role: "owner",
        tenantId: tenantId
      }
      setUser(appUser)
      localStorage.setItem("axion_user", JSON.stringify(appUser))
      router.push("/dashboard")

      return { error: null }
    } catch (error) {
      return { error: { message: "Erro ao criar conta. Tente novamente.", code: "UNKNOWN_ERROR" } }
    }
  }

  const signOut = async () => {
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
