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
    // Check current session with timeout
    const checkSession = async () => {
      console.log("[Auth] Starting session check...")
      
      try {
        // Simple timeout without AbortController (getSession doesn't support abort)
        const timeoutMs = 5000 // 5 seconds timeout
        
        // Start session check
        const sessionPromise = supabase.auth.getSession()
        
        // Add timeout wrapper
        const sessionResult = await new Promise<{ data: { session: any }; error: any }>((resolve) => {
          const timeout = setTimeout(() => {
            // If timeout, try to use cached user but it will be limited
            console.log("[Auth] Session check timed out")
            resolve({ data: { session: null }, error: new Error("timeout") })
          }, timeoutMs)
          
          sessionPromise.then(result => {
            clearTimeout(timeout)
            resolve(result)
          }).catch(err => {
            clearTimeout(timeout)
            resolve({ data: { session: null }, error: err })
          })
        })
        
        const { data: { session }, error: sessionError } = sessionResult
        
        console.log("[Auth] getSession result:", sessionError ? sessionError.message : "success", session ? "has session" : "no session")
        
        if (session?.user) {
          console.log("[Auth] User found in session:", session.user.id)
          let appUser: AppUser | null = null
          
          // Try to get user data from our users table
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("id, email, name, role, tenant_id")
              .eq("id", session.user.id)
              .single()

            console.log("[Auth] Users table query:", userError ? userError.message : "success", userData)

            // Only use DB data if query succeeded
            if (!userError && userData) {
              appUser = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role || "owner",
                tenantId: userData.tenant_id || ""
              }
            }
          } catch (err) {
            console.log("[Auth] Users table exception:", err)
          }

          // Fallback to Supabase Auth data if no user in DB
          if (!appUser) {
            // Try to get tenant_id from user_metadata in JWT token
            const metadataTenantId = session.user.user_metadata?.tenant_id
            console.log("[Auth] Using fallback with tenant_id from metadata:", metadataTenantId)
            appUser = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
              role: "owner",
              tenantId: metadataTenantId || ""
            }
          }
          
          console.log("[Auth] Setting user:", appUser)
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))
        } else {
          console.log("[Auth] No session, setting loading to false")
        }
      } catch (error) {
        console.error("[Auth] Session check error:", error)
      } finally {
        // Always set loading to false - critical to avoid infinite loading
        console.log("[Auth] Setting loading to false")
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

        let appUser: AppUser | null = null
        
        // Try to get from database
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("id, email, name, role, tenant_id")
            .eq("id", session.user.id)
            .single()

          if (userData) {
            appUser = {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: userData.role || "owner",
              tenantId: userData.tenant_id || ""
            }
          }
        } catch (err) {
          console.log("Using Supabase Auth data directly")
        }

        // Fallback to Supabase Auth data
        if (!appUser) {
          // Try to get tenant_id from user_metadata in JWT token
          const metadataTenantId = session.user.user_metadata?.tenant_id
          appUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Usuário",
            role: "owner",
            tenantId: metadataTenantId || ""
          }
        }
        
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
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

        // Use user data from Supabase Auth directly
        // Default role is owner - DB sync is optional
        const supabase = createClient()
        
        let appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split("@")[0],
          role: "owner",
          tenantId: "",
          plan: "starter"
        }

        // Try to sync with database (optional - won't block login if it fails)
        try {
          // Check if tables exist by trying to list tenants
          const { error: tenantError } = await supabase
            .from("tenants")
            .select("id")
            .limit(1)

          if (tenantError) {
            // Tables don't exist or no access - skip sync
            console.log("Skipping DB sync - tables not available")
          } else {
            // Tables exist - try to sync user
            const { data: dbUser } = await supabase
              .from("users")
              .select("id, email, name, role, tenant_id")
              .eq("email", data.user.email!)
              .single()

            if (dbUser) {
              appUser = {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role || "owner",
                tenantId: dbUser.tenant_id || "",
                plan: "starter"
              }
            } else {
              // Check if any tenants exist
              const { data: tenants } = await supabase
                .from("tenants")
                .select("id")
                .limit(1)

              if (!tenants?.length) {
                // First time - create tenant and user
                const { data: tenantData } = await supabase
                  .from("tenants")
                  .insert({
                    name: appUser.name,
                    slug: appUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Date.now()
                  })
                  .select("id")
                  .single()

                if (tenantData?.id) {
                  appUser.tenantId = tenantData.id
                  await supabase.from("users").insert({
                    id: data.user.id,
                    email: data.user.email!,
                    name: appUser.name,
                    role: "owner",
                    tenant_id: tenantData.id
                  })
                }
              }
            }
          }
        } catch (err) {
          console.log("DB sync skipped:", err)
        }
        
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))

        if (typeof window !== "undefined") {
          router.push("/dashboard")
        }
      }

      return { error: null }
    } catch (error) {
      return { error: mapAuthError(error as { message: string; name?: string }, locale) }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Attempt Supabase Auth signup directly
      // The user record will be created in the database after successful auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0]
          }
        }
      })

      if (error) {
        return { error: mapAuthError(error, locale) }
      }

      // If user was created successfully
      if (data.user) {
        const userName = name || email.split("@")[0]
        
        try {
          // Try to create tenant for new user (may fail if table doesn't exist)
          let tenantId = ""
          try {
            const { data: tenantData, error: tenantError } = await supabase
              .from("tenants")
              .insert({
                name: userName,
                slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Date.now()
              })
              .select()
              .single()

            if (!tenantError && tenantData) {
              tenantId = tenantData.id
            }
          } catch (tenantErr) {
            console.warn("Tenant table may not exist:", tenantErr)
          }

          // Try to create user in our users table (may fail if table doesn't exist)
          try {
            await supabase.from("users").insert({
              id: data.user.id,
              email: data.user.email,
              name: userName,
              role: "owner",
              tenant_id: tenantId,
              email_confirmed: !data.session
            })
          } catch (userErr) {
            console.warn("Users table may not exist:", userErr)
          }

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
            tenantId
          }
          setUser(appUser)
          localStorage.setItem("axion_user", JSON.stringify(appUser))

          // Redirect to dashboard
          if (typeof window !== "undefined") {
            router.push("/dashboard")
          }
        } catch (dbError) {
          console.error("Database error during signup:", dbError)
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
