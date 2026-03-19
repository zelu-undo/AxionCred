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
}

type AuthContextType = {
  user: AppUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/alerts", "/super-admin", "/demo"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

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
        return { error: error }
      }

      if (data.user) {
        // Get user data from our users table
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, name, role, tenant_id")
          .eq("id", data.user.id)
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

      router.push("/dashboard")
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
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
        return { error: error }
      }

      if (data.user) {
        // Create tenant for new user
        const { data: tenantData } = await supabase
          .from("tenants")
          .insert({
            name: name || email.split("@")[0],
            slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")
          })
          .select()
          .single()

        const tenantId = tenantData?.id || ""

        // Create user in our users table
        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          name: name || email.split("@")[0],
          role: "owner",
          tenant_id: tenantId
        })

        const appUser: AppUser = {
          id: data.user.id,
          email: data.user.email!,
          name: name || email.split("@")[0],
          role: "owner",
          tenantId
        }
        setUser(appUser)
        localStorage.setItem("axion_user", JSON.stringify(appUser))
      }

      router.push("/dashboard")
      return { error: null }
    } catch (error) {
      return { error: error as Error }
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
