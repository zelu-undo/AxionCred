"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id: string
  email: string
  name: string
  role: string
  tenantId: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/alerts", "/super-admin", "/demo"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem("axion_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("axion_user")
      }
    }
    setLoading(false)
  }, [])

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

  const signIn = async (email: string, _password: string) => {
    try {
      // In demo mode, accept any login and create a user session
      // The tRPC will validate against the database in real scenarios
      const loggedUser: User = {
        id: "00000000-0000-0000-0000-000000000001",
        email,
        name: "Demo Usuário",
        role: "owner",
        tenantId: "00000000-0000-0000-0000-000000000001"
      }
      
      localStorage.setItem("axion_user", JSON.stringify(loggedUser))
      setUser(loggedUser)
      router.push("/dashboard")
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, _password: string, name?: string) => {
    try {
      // In demo mode, treat sign up like sign in
      const newUser: User = {
        id: "00000000-0000-0000-0000-000000000001",
        email,
        name: name || email.split("@")[0],
        role: "owner",
        tenantId: "00000000-0000-0000-0000-000000000001"
      }
      
      localStorage.setItem("axion_user", JSON.stringify(newUser))
      setUser(newUser)
      router.push("/dashboard")
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    localStorage.removeItem("axion_user")
    setUser(null)
    router.push("/login")
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
