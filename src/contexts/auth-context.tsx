"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo user for testing
const DEMO_USER: User = {
  id: "demo-1",
  email: "demo@axioncred.com.br"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored session (demo mode)
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

  const signIn = async (email: string, _password: string) => {
    // Demo mode: accept any login
    const loggedUser: User = {
      id: "user-" + Date.now(),
      email
    }
    localStorage.setItem("axion_user", JSON.stringify(loggedUser))
    setUser(loggedUser)
    router.push("/dashboard")
    return { error: null }
  }

  const signUp = async (email: string, _password: string) => {
    // Demo mode: treat sign up like sign in
    const newUser: User = {
      id: "user-" + Date.now(),
      email
    }
    localStorage.setItem("axion_user", JSON.stringify(newUser))
    setUser(newUser)
    router.push("/dashboard")
    return { error: null }
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
