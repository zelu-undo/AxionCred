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
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

// Map Supabase error codes to user-friendly messages
function mapAuthError(error: { message: string; name?: string }, locale: string = "pt"): AuthError {
  const errorLower = error.message.toLowerCase()
  
  // Invalid login credentials
  if (errorLower.includes("invalid login credentials") || errorLower.includes("invalid email or password")) {
    return { 
      message: locale === "en" ? "Invalid email or password" : 
              locale === "es" ? "Correo o contraseña incorrectos" : 
              "E-mail ou senha incorretos",
      code: "INVALID_CREDENTIALS"
    }
  }
  
  // User not found
  if (errorLower.includes("user not found")) {
    return { 
      message: locale === "en" ? "User not found" : 
              locale === "es" ? "Usuario no encontrado" : 
              "Usuário não encontrado",
      code: "USER_NOT_FOUND"
    }
  }
  
  // Email already exists
  if (errorLower.includes("email already in use") || errorLower.includes("email already registered") || errorLower.includes("already been registered")) {
    return { 
      message: locale === "en" ? "This email is already registered" : 
              locale === "es" ? "Este correo ya está registrado" : 
              "Este e-mail já está cadastrado",
      code: "EMAIL_EXISTS"
    }
  }
  
  // Invalid email
  if (errorLower.includes("invalid email")) {
    return { 
      message: locale === "en" ? "Invalid email address" : 
              locale === "es" ? "Dirección de correo inválida" : 
              "Endereço de e-mail inválido",
      code: "INVALID_EMAIL"
    }
  }
  
  // Email not confirmed
  if (errorLower.includes("email not confirmed") || errorLower.includes("confirm your email")) {
    return { 
      message: locale === "en" ? "Please confirm your email. Check your inbox for the confirmation link." : 
              locale === "es" ? "Por favor confirma tu correo. Revisa tu bandeja de entrada." : 
              "Por favor, confirme seu e-mail. Verifique sua caixa de entrada.",
      code: "EMAIL_NOT_CONFIRMED"
    }
  }
  
  // Password too short
  if (errorLower.includes("password should be at least") || errorLower.includes("minimum length of 6")) {
    return { 
      message: locale === "en" ? "Password must be at least 6 characters" : 
              locale === "es" ? "La contraseña debe tener al menos 6 caracteres" : 
              "A senha deve ter pelo menos 6 caracteres",
      code: "WEAK_PASSWORD"
    }
  }
  
  // Network error
  if (errorLower.includes("network") || errorLower.includes("fetch")) {
    return { 
      message: locale === "en" ? "Connection error. Please try again." : 
              locale === "es" ? "Error de conexión. Intenta de nuevo." : 
              "Erro de conexão. Tente novamente.",
      code: "NETWORK_ERROR"
    }
  }
  
  // Too many attempts
  if (errorLower.includes("too many requests") || errorLower.includes("rate limit")) {
    return { 
      message: locale === "en" ? "Too many attempts. Try again later." : 
              locale === "es" ? "Demasiados intentos. Intenta más tarde." : 
              "Muitas tentativas. Tente novamente mais tarde.",
      code: "TOO_MANY_ATTEMPTS"
    }
  }
  
  // Default fallback
  return { 
    message: error.message,
    code: "UNKNOWN"
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/alerts", "/super-admin", "/demo"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [locale, setLocaleState] = useState<string>("pt")
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Get locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem("axion-locale")
    if (savedLocale && ["pt", "en", "es"].includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
  }, [])

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user data from our users table
          const { data: userData } = await supabase
            .from("users")
            .select("id, email, name, role, tenant_id")
            .eq("id", session.user.id)
            .single()

          if (userData) {
            const appUser: AppUser = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role || "operator",
              tenantId: userData.tenant_id
            }
            setUser(appUser)
            localStorage.setItem("axion_user", JSON.stringify(appUser))
          }
        }
      } catch (error) {
        console.error("Session check error:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if email is confirmed
        if (!session.user.email_confirmed_at) {
          // Email not confirmed - don't set user, redirect to login
          await supabase.auth.signOut()
          setUser(null)
          localStorage.removeItem("axion_user")
          router.push("/login?error=email_not_confirmed")
          return
        }

        const { data: userData } = await supabase
          .from("users")
          .select("id, email, name, role, tenant_id")
          .eq("id", session.user.id)
          .single()

        if (userData) {
          const appUser: AppUser = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || "operator",
            tenantId: userData.tenant_id
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        }
      } else {
        setUser(null)
        localStorage.removeItem("axion_user")
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Protect routes - redirect to login if not authenticated
  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.some(route => 
        pathname === route || pathname.startsWith(route + "/")
      )
      
      if (!user && !isPublicRoute) {
        router.push("/login")
      }
    }
  }, [user, loading, pathname, router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: mapAuthError(error, locale) }
      }

      if (data.user) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          return { 
            error: { 
              message: locale === "en" ? "Please confirm your email before logging in. Check your inbox." : 
                      locale === "es" ? "Por favor confirma tu correo antes de iniciar sesión." : 
                      "Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.",
              code: "EMAIL_NOT_CONFIRMED" 
            } 
          }
        }

        // Get user data from our users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, name, role, tenant_id")
          .eq("id", data.user.id)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          return { error: { message: "Erro ao buscar dados do usuário", code: "USER_FETCH_ERROR" } }
        }

        if (userData) {
          // Get tenant data for plan info
          let plan = "starter"
          if (userData.tenant_id) {
            const { data: tenantData } = await supabase
              .from("tenants")
              .select("plan")
              .eq("id", userData.tenant_id)
              .single()
            if (tenantData) {
              plan = tenantData.plan || "starter"
            }
          }

          const appUser: AppUser = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || "operator",
            tenantId: userData.tenant_id,
            plan
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        } else {
          // User exists in Supabase Auth but not in users table
          console.error("User not found in users table:", data.user.id)
          return { error: { message: "Usuário não encontrado. Entre em contato com o suporte.", code: "USER_NOT_FOUND" } }
        }
      }

      router.push("/dashboard")
      return { error: null }
    } catch (error) {
      return { error: mapAuthError(error as { message: string; name?: string }, locale) }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // First check if user already exists (suppress errors for network issues)
      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("email")
          .eq("email", email.toLowerCase())
          .single()

        if (existingUser) {
          return { 
            error: { 
              message: locale === "en" ? "This email is already registered" : 
                      locale === "es" ? "Este correo ya está registrado" : 
                      "Este e-mail já está cadastrado",
              code: "EMAIL_EXISTS" 
            } 
          }
        }
      } catch (checkError) {
        // Continue with signup even if check fails (network might be down)
        console.warn("User check failed, continuing with signup:", checkError)
      }

      // Attempt Supabase Auth signup
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: name || email.split("@")[0],
          slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Date.now()
        })
        .select()
        .single()

      if (tenantError) {
        console.error("Tenant creation error:", tenantError)
        return { error: { message: "Erro ao criar empresa. Tente novamente.", code: "TENANT_ERROR" } }
      }

      // Now create the user in Supabase Auth
=======
      // Attempt Supabase Auth signup
>>>>>>> c8fa688 (fix(auth): corrige fluxo de cadastro com tratamento adequado de erros)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
            tenant_id: tenantData.id
          }
        }
      })

      if (error) {
        // Rollback tenant creation if auth fails
        await supabase.from("tenants").delete().eq("id", tenantData.id)
        return { error: mapAuthError(error, locale) }
      }

      // If user was created successfully
      if (data.user) {
        const userName = name || email.split("@")[0]
        
        try {
          // Create user in our users table
          await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            name: userName,
            role: "owner",
            tenant_id: tenantData.id,
            email_confirmed: !data.session // false if confirmation required
          })

          // If no session (email confirmation required), return success message
          if (!data.session) {
            return { 
              error: { 
                message: locale === "en" ? "Please check your email to confirm your account" : 
                        locale === "es" ? "Por favor revisa tu correo para confirmar tu cuenta" : 
                        "Por favor, verifique seu e-mail para confirmar sua conta",
                code: "EMAIL_CONFIRMATION_REQUIRED" 
              } 
            }
          }

          // If session exists (email auto-confirmed), log user in
          const appUser: AppUser = {
            id: data.user.id,
            email: data.user.email!,
            name: userName,
            role: "owner",
            tenantId: tenantData.id
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        } catch (dbError) {
          console.error("Database error during signup:", dbError)
        }

        // Redirect to dashboard
        if (typeof window !== "undefined") {
          router.push("/dashboard")
        }
      }

      return { error: null }

    } catch (error) {
      console.error("Signup error:", error)
      return { error: { message: "Erro ao criar conta. Tente novamente.", code: "UNKNOWN_ERROR" } }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("axion_user")
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
