"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function NoCompanyPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
            <Building2 className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo ao AXION</h1>
          <p className="text-slate-400 mt-2">Você está conectado, mas ainda não faz parte de uma empresa</p>
        </div>

        <Card className="bg-white/5 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-500" />
              Sua conta
            </CardTitle>
            <CardDescription className="text-slate-400">
              Informações da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Email</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">Nome</span>
              <span className="text-white font-medium">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Status</span>
              <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                Sem empresa
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-slate-700 mt-4">
          <CardHeader>
            <CardTitle className="text-white text-lg">O que fazer agora?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-white">Aguarde um convite</p>
                <p className="text-slate-400 text-sm">
                  Um proprietário ou administrador de empresa pode convidá-lo para fazer parte da equipe
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-white">Crie sua própria empresa</p>
                <p className="text-slate-400 text-sm">
                  Se você é empreendedor, pode criar sua própria empresa no AXION
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-white">Entre em contato</p>
                <p className="text-slate-400 text-sm">
                  Precisa de ajuda? Fale com nosso suporte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => signOut()}
          >
            Sair da conta
          </Button>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2026 AXION Cred - Gestão de Crédito
        </p>
      </div>
    </div>
  )
}