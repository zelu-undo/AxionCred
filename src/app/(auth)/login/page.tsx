"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/i18n/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, AlertCircle, Mail, Lock, ArrowRight } from "lucide-react"

// Dynamic import for particles (client-side only for performance)
const FloatingParticles = dynamic(
  () => import("@/components/landing/floating-particles").then((mod) => mod.FloatingParticles),
  { ssr: false }
)

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()

  // Check for email confirmation error
  const emailNotConfirmed = searchParams.get("error") === "email_not_confirmed"
  // Check for success after registration
  const emailSent = searchParams.get("success") === "email_sent"
  const sentEmail = searchParams.get("email") || ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    if (!email || !password) {
      setError("Por favor, preencha e-mail e senha")
      return
    }
    
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      // Success - don't set isLoading to false as we're redirecting
      // This prevents the button from flickering
    }
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-white">Bem-vindo de volta</CardTitle>
        <CardDescription className="text-white/60">Entre com sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-5">
          {emailSent && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-400">E-mail de confirmação enviado!</p>
                  <p className="text-sm text-green-300/80 mt-1">
                    Enviamos um link de confirmação para <strong className="text-green-300">{sentEmail}</strong>. 
                    Verifique sua caixa de entrada e clique no link para ativar sua conta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {emailNotConfirmed && !emailSent && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-400">E-mail não confirmado</p>
                  <p className="text-sm text-yellow-300/80 mt-1">
                    Por favor, verifique sua caixa de entrada e confirme seu e-mail para acessar o sistema.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && !emailNotConfirmed && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-400">Não foi possível fazer login</p>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              E-mail
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#22C55E] transition-colors" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#22C55E] transition-colors" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all duration-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold h-11 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#22C55E]/30 disabled:opacity-50 disabled:hover:scale-100" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Entrando...
              </>
            ) : (
              <>
                Entrar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-white/50">Não tem uma conta? </span>
          <Link href="/register" className="text-[#22C55E] hover:text-[#4ADE80] font-medium transition-colors">
            Criar conta
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] relative overflow-hidden px-4 py-12">
      {/* Animated background */}
      <FloatingParticles particleCount={150} className="z-0 fixed inset-0" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A] z-0" />
      
      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#22C55E] shadow-lg shadow-[#22C55E]/30">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">AXI<span className="text-[#22C55E]">ON</span></span>
        </div>

        <div className="animate-fade-in-up-delay-200">
          <Suspense fallback={
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E] mx-auto"></div>
              <p className="text-white/60 mt-4">Carregando...</p>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
        
        {/* Back to home */}
        <div className="mt-8 text-center animate-fade-in-up-delay-300">
          <Link href="/" className="text-white/40 hover:text-white/60 text-sm transition-colors inline-flex items-center gap-1">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  )
}
