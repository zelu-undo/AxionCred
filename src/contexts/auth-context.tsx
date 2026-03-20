"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

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

// Função para buscar tenant_id do banco
async function fetchTenantId(supabase: any, userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", userId)
      .single()
    
    if (error || !data) return ""
    return data.tenant_id || ""
  } catch {
    return ""
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Carregar usuário do localStorage primeiro (instantâneo)
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

  // Verificar sessão atual
  useEffect(() => {
    let mounted = true
    let isInitialCheck = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          // Primeiro usa dados do localStorage se disponíveis
          const stored = localStorage.getItem("axion_user")
          let appUser: AppUser | null = null
          
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              if (parsed.id === session.user.id) {
                appUser = parsed
              }
            } catch {}
          }

          // Se não tem no localStorage ou é outro usuário, busca do banco
          if (!appUser) {
            const tenantId = await fetchTenantId(supabase, session.user.id)
            appUser = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
              role: "owner",
              tenantId: tenantId,
              plan: "starter"
            }
            localStorage.setItem("axion_user", JSON.stringify(appUser))
          }
          
          setUser(appUser)
        } else {
          setUser(null)
          localStorage.removeItem("axion_user")
        }
      } catch (err) {
        console.error("[Auth] Session check error:", err)
        // Em caso de erro, tenta usar localStorage
        const stored = localStorage.getItem("axion_user")
        if (stored) {
          try {
            setUser(JSON.parse(stored))
          } catch {}
        }
      } finally {
        if (mounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    checkSession()

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      // Só processa se não for o evento inicial (já tratado pelo getSession)
      if (isInitialCheck) {
        isInitialCheck = false
        return
      }

      if (session?.user) {
        // Usa dados do evento diretamente para速度
        const appUser: AppUser = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
          role: "owner",
          tenantId: session.user.user_metadata?.tenant_id || "",
          plan: "starter"
        }
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        
        // Atualiza tenantId em background
        fetchTenantId(supabase, session.user.id).then(tenantId => {
          if (mounted && tenantId) {
            const updatedUser = { ...appUser, tenantId }
            setUser(updatedUser)
            localStorage.setItem("axion_user", JSON.stringify(updatedUser))
          }
        })
      } else {
        setUser(null)
        localStorage.removeItem("axion_user")
      }
      setLoading(false)
      setInitialized(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
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
        // Buscar tenant_id do banco
        const tenantId = await fetchTenantId(supabase, data.user.id)

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "owner",
          tenantId: tenantId,
          plan: "starter"
        }
        
        // Salvar no localStorage ANTES de redirecionar
        localStorage.setItem("axion_user", JSON.stringify(appUser))
        setUser(appUser)
        
        // Redirecionar
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

      // Buscar tenant_id do banco
      const tenantId = await fetchTenantId(supabase, data.user!.id)

      const appUser: AppUser = {
        id: data.user!.id,
        email: data.user!.email!,
        name: name || email.split("@")[0],
        role: "owner",
        tenantId: tenantId
      }
      
      localStorage.setItem("axion_user", JSON.stringify(appUser))
      setUser(appUser)
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
