"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/i18n/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, CheckCircle, Mail, Lock, User, ArrowRight, Building2 } from "lucide-react"

// Dynamic import for particles (client-side only for performance)
const FloatingParticles = dynamic(
  () => import("@/components/landing/floating-particles").then((mod) => mod.FloatingParticles),
  { ssr: false }
)

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdEmail, setCreatedEmail] = useState("")
  const [createdCompany, setCreatedCompany] = useState("")
  
  const { signUp, user, loading: authLoading, isInitialized } = useAuth()
  const router = useRouter()
  const { t } = useI18n()

  // Verificar se usuário já está autenticado
  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (user) {
        router.push("/dashboard")
      }
    }
  }, [user, authLoading, isInitialized, router])

  // Limpar estados residuais ao montar o componente
  useEffect(() => {
    setError(null)
    setSuccess(false)
    setIsLoading(false)
    setIsSubmitting(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Evitar múltiplas requisições simultâneas
    if (isSubmitting) {
      return
    }
    
    // Reset completo do estado antes de nova tentativa
    setError(null)
    setSuccess(false)
    setIsLoading(true)
    setIsSubmitting(true)

    // Validation with translations
    if (!name.trim()) {
      setError(t("auth.nameRequired"))
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (!companyName.trim()) {
      setError("Nome da empresa é obrigatório")
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"))
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError(t("auth.weakPassword"))
      setIsLoading(false)
      setIsSubmitting(false)
      return
    }

    const { error } = await signUp(email, password, name)

    if (error) {
      // Check if it's email confirmation required
      if (error.code === "EMAIL_CONFIRMATION_REQUIRED") {
        setSuccess(true)
        setCreatedEmail(email)
        setCreatedCompany(companyName)
        setIsLoading(false)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/login?success=email_sent&email=${encodeURIComponent(email)}`)
        }, 3000)
      } else {
        setError(error.message)
        setIsLoading(false)
        setIsSubmitting(false)
      }
    } else {
      // No error means registration was successful
      // Small delay to show the form was processed
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/dashboard")
    }
    setIsLoading(false)
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] relative overflow-hidden px-4 py-12">
        {/* Animated background */}
        <FloatingParticles particleCount={150} className="z-0 fixed inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A] z-0" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#22C55E] shadow-lg shadow-[#22C55E]/30">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">AXI<span className="text-[#22C55E]">ON</span></span>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl animate-fade-in-up-delay-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 ring-2 ring-green-500/30">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Conta criada com sucesso!</h2>
                <p className="text-white/60 mb-6">
                  Enviamos um e-mail de confirmação para <strong className="text-white/80">{createdEmail}</strong>
                </p>
                {createdCompany && (
                  <p className="text-white/50 text-sm mb-4">
                    Empresa: <strong className="text-white/70">{createdCompany}</strong>
                  </p>
                )}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-400">Verifique sua caixa de entrada</p>
                      <p className="text-sm text-yellow-300/80 mt-1">
                        Clique no link de confirmação no e-mail que enviamos para ativar sua conta.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/40 mb-4">
                  Você será redirecionado para o login em alguns segundos...
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 text-[#22C55E] hover:text-[#4ADE80] font-medium transition-colors">
                  Ir para Login agora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Mostrar loading enquanto verifica autenticação
  if (authLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] relative overflow-hidden px-4 py-12">
        <FloatingParticles particleCount={150} className="z-0 fixed inset-0" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A] z-0" />
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl z-10">
          <CardContent className="pt-8 pb-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22C55E] mb-4"></div>
            <p className="text-white/60">Verificando autenticação...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1F3A] relative overflow-hidden px-4 py-12">
      {/* Animated background */}
      <FloatingParticles particleCount={150} className="z-0 fixed inset-0" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1a3a5c] to-[#0B1F3A] z-0" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#22C55E] shadow-lg shadow-[#22C55E]/30">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">AXI<span className="text-[#22C55E]">ON</span></span>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl animate-fade-in-up-delay-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
            <CardDescription className="text-white/60">Comece a gerenciar seus créditos hoje</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white/80">
                  Nome completo
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#22C55E] transition-colors" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all duration-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-white/80">
                  Nome da Empresa
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#22C55E] transition-colors" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Nome da sua empresa"
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all duration-300"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                  Confirmar Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-[#22C55E] transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:bg-white/10 focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all duration-300"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar Conta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-white/50">Já tem uma conta? </span>
              <Link href="/login" className="text-[#22C55E] hover:text-[#4ADE80] font-medium transition-colors">
                Entrar
              </Link>
            </div>
          </CardContent>
        </Card>
        
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
