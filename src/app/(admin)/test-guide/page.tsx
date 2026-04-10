"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Users, 
  CreditCard, 
  Wallet, 
  RefreshCw, 
  FileText, 
  Settings, 
  Shield,
  Search,
  BarChart3,
  Building,
  Download,
  BookOpen,
  Save,
  Bell
} from "lucide-react"
import { trpc } from "@/trpc/client"
import { useI18n } from "@/i18n/client"

interface TestItem {
  id: string
  category: string
  feature: string
  description: string
  status: "passed" | "failed" | "pending" | "skipped"
  notes?: string
}

const testCategories = [
  { id: "auth", name: "Autenticação", icon: Shield, color: "text-purple-500" },
  { id: "dashboard", name: "Dashboard", icon: BarChart3, color: "text-blue-500" },
  { id: "customers", name: "Clientes", icon: Users, color: "text-green-500" },
  { id: "loans", name: "Empréstimos", icon: CreditCard, color: "text-orange-500" },
  { id: "late_fees", name: "Juros Atraso", icon: AlertTriangle, color: "text-red-600" },
  { id: "payments", name: "Pagamentos", icon: CreditCard, color: "text-teal-500" },
  { id: "cash", name: "Caixa", icon: Wallet, color: "text-emerald-500" },
  { id: "guarantors", name: "Fiadores", icon: User, color: "text-pink-500" },
  { id: "renegotiations", name: "Renegociações", icon: RefreshCw, color: "text-yellow-500" },
  { id: "credit", name: "Crédito", icon: BarChart3, color: "text-cyan-500" },
  { id: "rules", name: "Regras", icon: Settings, color: "text-violet-500" },
  { id: "reports", name: "Relatórios", icon: FileText, color: "text-indigo-500" },
  { id: "notifications", name: "Notificações", icon: Bell, color: "text-amber-500" },
  { id: "search", name: "Busca Global", icon: Search, color: "text-slate-500" },
  { id: "settings", name: "Configurações", icon: Settings, color: "text-gray-500" },
  { id: "team", name: "Equipe", icon: Users, color: "text-orange-600" },
  { id: "pdf", name: "PDF", icon: Download, color: "text-red-500" },
]

const defaultTests: TestItem[] = [
  // Autenticação
  { id: "auth-1", category: "auth", feature: "Login", description: "Login com email e senha válidos", status: "pending" },
  { id: "auth-2", category: "auth", feature: "Login inválido", description: "Login com senha incorreta", status: "pending" },
  { id: "auth-3", category: "auth", feature: "Registro", description: "Cadastro de novo usuário", status: "pending" },
  { id: "auth-4", category: "auth", feature: "Logout", description: "Sair do sistema", status: "pending" },
  { id: "auth-5", category: "auth", feature: "Sessão", description: "Sessão expira corretamente", status: "pending" },
  
  // Dashboard
  { id: "dash-1", category: "dashboard", feature: "Estatísticas", description: "Cards de stats carregam", status: "pending" },
  { id: "dash-2", category: "dashboard", feature: "Gráficos", description: "Gráficos renderizam", status: "pending" },
  { id: "dash-3", category: "dashboard", feature: "Menu lateral", description: "Navegação funciona", status: "pending" },
  { id: "dash-4", category: "dashboard", feature: "Busca global", description: "Ctrl+K abre busca", status: "pending" },
  
  // Clientes
  { id: "cust-1", category: "customers", feature: "Listagem", description: "Lista de clientes carrega", status: "pending" },
  { id: "cust-2", category: "customers", feature: "Busca", description: "Buscar por nome funciona", status: "pending" },
  { id: "cust-3", category: "customers", feature: "Criar", description: "Novo cliente é criado (CEP funciona)", status: "pending" },
  { id: "cust-4", category: "customers", feature: "Editar", description: "Editar dados do cliente (CEP/zip_code)", status: "pending" },
  { id: "cust-5", category: "customers", feature: "Excluir", description: "Excluir cliente", status: "pending" },
  { id: "cust-6", category: "customers", feature: "PDF", description: "Gerar histórico em PDF", status: "pending" },
  { id: "cust-7", category: "customers", feature: "Score", description: "Score de crédito é calculado", status: "pending" },
  
  // Empréstimos
  { id: "loan-1", category: "loans", feature: "Listagem", description: "Lista de empréstimos", status: "pending" },
  { id: "loan-2", category: "loans", feature: "Criar", description: "Criar novo empréstimo", status: "pending" },
  { id: "loan-3", category: "loans", feature: "Detalhes", description: "Ver detalhes do empréstimo", status: "pending" },
  { id: "loan-4", category: "loans", feature: "Parcelas", description: "Listagem de parcelas", status: "pending" },
  { id: "loan-5", category: "loans", feature: "PDF", description: "Baixar contrato PDF", status: "pending" },
  { id: "loan-6", category: "loans", feature: "Cancelar", description: "Cancelar empréstimo", status: "pending" },
  
  // Juros de Atraso (CRÍTICO)
  { id: "late-1", category: "late_fees", feature: "Configuração", description: "Verificar configuração de juros (Regras de Negócio > Juros mora)", status: "pending" },
  { id: "late-2", category: "late_fees", feature: "Criação com data retroativa", description: "Criar empréstimo com 1ª parcela já vencida - calcula juros automaticamente", status: "pending" },
  { id: "late-3", category: "late_fees", feature: "Criação 10 dias atrasado", description: "Criar empréstimo com 10 dias de atraso - valor correto com juros compostos", status: "pending" },
  { id: "late-4", category: "late_fees", feature: "Lista loans atualiza", description: "Acessar lista de loans atualiza status de parcelas vencidas", status: "pending" },
  { id: "late-5", category: "late_fees", feature: "Página pagamento", description: "Acessar página de pagamento mostra valores atualizados com juros", status: "pending" },
  { id: "late-6", category: "late_fees", feature: "Dashboard stats", description: "Dashboard mostra valores corretos de empréstimos atrasados", status: "pending" },
  { id: "late-7", category: "late_fees", feature: "Cálculo composto", description: "Verificar fórmula: amount * ((1+rate)^days - 1) está correta", status: "pending" },
  { id: "late-8", category: "late_fees", feature: "Multa fixa", description: "Multa fixa (fixed_fee) é adicionada corretamente", status: "pending" },
  
  // Caixa
  { id: "cash-1", category: "cash", feature: "Saldo", description: "Saldo atual exibido", status: "pending" },
  { id: "cash-2", category: "cash", feature: "Aporte", description: "Registrar novo aporte - valor correto (R$ 100 = 100, não 10000)", status: "pending" },
  { id: "cash-3", category: "cash", feature: "Retirada", description: "Registrar retirada - valor correto", status: "pending" },
  { id: "cash-4", category: "cash", feature: "Ajuste", description: "Registrar ajuste positivo/negativo", status: "pending" },
  { id: "cash-5", category: "cash", feature: "Filtros", description: "Filtros funcionam", status: "pending" },
  { id: "cash-6", category: "cash", feature: "PDF", description: "Gerar PDF com filtros", status: "pending" },
  
  // Renegociações
  { id: "reneg-1", category: "renegotiations", feature: "Listagem", description: "Lista de renegociações", status: "pending" },
  { id: "reneg-2", category: "renegotiations", feature: "Criar", description: "Criar nova renegociação", status: "pending" },
  { id: "reneg-3", category: "renegotiations", feature: "Aprovar", description: "Aprovar renegociação", status: "pending" },
  { id: "reneg-4", category: "renegotiations", feature: "Rejeitar", description: "Rejeitar renegociação", status: "pending" },
  { id: "reneg-5", category: "renegotiations", feature: "PDF", description: "Gerar PDF da renegociação", status: "pending" },
  
  // Relatórios
  { id: "report-1", category: "reports", feature: "Relatório clientes", description: "Dados carregam", status: "pending" },
  { id: "report-2", category: "reports", feature: "Filtros", description: "Filtros funcionam", status: "pending" },
  { id: "report-3", category: "reports", feature: "Cash Flow", description: "Gráficos de fluxo", status: "pending" },
  { id: "report-4", category: "reports", feature: "Financeiro", description: "Dados financeiros", status: "pending" },
  
  // Configurações
  { id: "set-1", category: "settings", feature: "Geral", description: "Configurações gerais", status: "pending" },
  { id: "set-2", category: "settings", feature: "Plano", description: "Ver plano atual", status: "pending" },
  { id: "set-3", category: "settings", feature: "Usuários", description: "Gerenciar staff", status: "pending" },
  { id: "set-4", category: "settings", feature: "Funções", description: "Permissões por perfil", status: "pending" },
  { id: "set-5", category: "settings", feature: "LGPD", description: "Política de privacidade", status: "pending" },
  
  // PDF Generation
  { id: "pdf-1", category: "pdf", feature: "LoanContract", description: "PDF de contrato de empréstimo", status: "pending" },
  { id: "pdf-2", category: "pdf", feature: "CustomerHistory", description: "PDF de histórico do cliente", status: "pending" },
  { id: "pdf-3", category: "pdf", feature: "CashFlow", description: "PDF de fluxo de caixa", status: "pending" },
  { id: "pdf-4", category: "pdf", feature: "Refinancing", description: "PDF de refinanciamento", status: "pending" },
  
  // Pagamentos
  { id: "pay-1", category: "payments", feature: "Listagem", description: "Lista de parcelas a pagar", status: "pending" },
  { id: "pay-2", category: "payments", feature: "Pagar parcela", description: "Pagar parcela única", status: "pending" },
  { id: "pay-3", category: "payments", feature: "Quitar loan", description: "Quitar empréstimo completo", status: "pending" },
  { id: "pay-4", category: "payments", feature: "Juros atraso", description: "Valores com juros de mora", status: "pending" },
  { id: "pay-5", category: "payments", feature: "Recibo", description: "Gerar recibo de pagamento", status: "pending" },
  { id: "pay-6", category: "payments", feature: "Filtros", description: "Filtros por status e data", status: "pending" },
  
  // Fiadores
  { id: "guar-1", category: "guarantors", feature: "Listagem", description: "Lista de fiadores", status: "pending" },
  { id: "guar-2", category: "guarantors", feature: "Criar", description: "Cadastrar fiador", status: "pending" },
  { id: "guar-3", category: "guarantors", feature: "Vincular", description: "Vincular fiador ao loan", status: "pending" },
  { id: "guar-4", category: "guarantors", feature: "Editar", description: "Editar fiador", status: "pending" },
  
  // Crédito
  { id: "cred-1", category: "credit", feature: "Score", description: "Score de crédito do cliente", status: "pending" },
  { id: "cred-2", category: "credit", feature: "Limite", description: "Limite de crédito calculado", status: "pending" },
  { id: "cred-3", category: "credit", feature: "Análise", description: "Análise de crédito completa", status: "pending" },
  
  // Regras de Negócio
  { id: "rule-1", category: "rules", feature: "Juros mora", description: "Configurar juros de mora", status: "pending" },
  { id: "rule-2", category: "rules", feature: "Taxas", description: "Configurar taxas de juros", status: "pending" },
  { id: "rule-3", category: "rules", feature: "Parcelas", description: "Regras por quantidade de parcelas", status: "pending" },
  { id: "rule-4", category: "rules", feature: "Valor mínimo", description: "Valor mínimo por parcela", status: "pending" },
  
  // Notificações
  { id: "notif-1", category: "notifications", feature: "Listagem", description: "Lista de notificações", status: "pending" },
  { id: "notif-2", category: "notifications", feature: "Ler", description: "Marcar como lida", status: "pending" },
  { id: "notif-3", category: "notifications", feature: "Config", description: "Configurar notificações", status: "pending" },
  { id: "notif-4", category: "notifications", feature: "Email", description: "Notificações por email", status: "pending" },
  
  // Busca Global
  { id: "search-1", category: "search", feature: "Abrir", description: "Ctrl+K abre busca global", status: "pending" },
  { id: "search-2", category: "search", feature: "Clientes", description: "Buscar clientes", status: "pending" },
  { id: "search-3", category: "search", feature: "Empréstimos", description: "Buscar empréstimos", status: "pending" },
  { id: "search-4", category: "search", feature: "Navegação", description: "Navegar para resultado", status: "pending" },
  
  // Equipe
  { id: "team-1", category: "team", feature: "Listagem", description: "Lista de membros", status: "pending" },
  { id: "team-2", category: "team", feature: "Convidar", description: "Convidar novo membro", status: "pending" },
  { id: "team-3", category: "team", feature: "Permissões", description: "Definir permissões", status: "pending" },
  { id: "team-4", category: "team", feature: "Remover", description: "Remover membro", status: "pending" },
]

export default function TestGuidePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [tests, setTests] = useState<TestItem[]>(defaultTests)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Get current user for super admin check
  const { data: userData } = trpc.admin.getCurrentUser.useQuery()

  // Check if super admin based on role
  const isSuperAdmin = userData?.user?.role === "super_admin"

  const filteredTests = tests.filter(test => {
    const matchesCategory = selectedCategory === "all" || test.category === selectedCategory
    const matchesSearch = test.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "skipped":
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const updateTestStatus = (testId: string, status: TestItem["status"]) => {
    setTests(tests.map(test => 
      test.id === testId ? { ...test, status } : test
    ))
  }

  const getCategoryStats = (categoryId: string) => {
    const categoryTests = tests.filter(t => t.category === categoryId)
    const passed = categoryTests.filter(t => t.status === "passed").length
    const failed = categoryTests.filter(t => t.status === "failed").length
    const pending = categoryTests.filter(t => t.status === "pending").length
    return { passed, failed, pending, total: categoryTests.length }
  }

  const totalStats = {
    passed: tests.filter(t => t.status === "passed").length,
    failed: tests.filter(t => t.status === "failed").length,
    pending: tests.filter(t => t.status === "pending").length,
    total: tests.length
  }

  // Redirect if not super admin
  useEffect(() => {
    if (userData && !isSuperAdmin) {
      router.push("/dashboard")
    }
  }, [userData, isSuperAdmin, router])

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
      </div>
    )
  }

  // Show access denied if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Acesso Negado</h1>
        <p className="text-gray-500 mt-2">Esta página é apenas para super administradores</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#1E3A8A] rounded-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guia de Testes</h1>
            <p className="text-gray-500">Sistema AXION Cred - v3.0</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              // Export JSON
              const report = {
                generatedAt: new Date().toISOString(),
                version: "3.0",
                total: totalStats,
                byCategory: testCategories.map(cat => ({
                  name: cat.name,
                  ...getCategoryStats(cat.id)
                })),
                results: tests.map(t => ({
                  id: t.id,
                  category: t.category,
                  feature: t.feature,
                  description: t.description,
                  status: t.status
                }))
              }
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `test-report-${new Date().toISOString().split("T")[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }} 
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button 
            onClick={() => {
              // Export Markdown
              const md = `# Relatório de Testes - AXION Cred

**Data**: ${new Date().toLocaleDateString("pt-BR")}
**Versão**: 3.0

## Resumo

| Status | Quantidade |
|--------|------------|
| ✅ Aprovados | ${totalStats.passed} |
| ❌ Falhos | ${totalStats.failed} |
| ⏳ Pendentes | ${totalStats.pending} |
| **Total** | ${totalStats.total} |

## Por Categoria

${testCategories.map(cat => {
  const stats = getCategoryStats(cat.id)
  return `### ${cat.name}
- ✅ ${stats.passed} | ❌ ${stats.failed} | ⏳ ${stats.pending} / ${stats.total}`
}).join("\n")}

## Detalhamento

${tests.map(t => {
  const statusIcon = t.status === "passed" ? "✅" : t.status === "failed" ? "❌" : "⏳"
  return `- ${statusIcon} **${t.feature}** - ${t.description} (${t.category})`
}).join("\n")}
`
              const blob = new Blob([md], { type: "text/markdown" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `test-report-${new Date().toISOString().split("T")[0]}.md`
              a.click()
              URL.revokeObjectURL(url)
            }} 
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button onClick={() => router.push("/super-admin")} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            Voltar ao Admin
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Falhos</p>
                <p className="text-2xl font-bold text-red-600">{totalStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{totalStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#1E3A8A]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-[#1E3A8A]">{totalStats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-[#1E3A8A]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {testCategories.map(category => {
          const stats = getCategoryStats(category.id)
          const Icon = category.icon
          return (
            <Card 
              key={category.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === category.id ? 'ring-2 ring-[#22C55E]' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? "all" : category.id)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${category.color}`} />
                <p className="text-xs font-medium">{category.name}</p>
                <p className="text-xs text-gray-500">{stats.passed}/{stats.total}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar teste..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Test List */}
      <div className="space-y-4">
        {filteredTests.map(test => {
          const category = testCategories.find(c => c.id === test.category)
          const Icon = category?.icon || Shield
          
          return (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${category?.color?.replace('text-', 'bg-')}/10`}>
                      <Icon className={`h-5 w-5 ${category?.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{test.feature}</p>
                      <p className="text-sm text-gray-500">{test.description}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {category?.name}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant={test.status === "passed" ? "default" : "outline"}
                        className={test.status === "passed" ? "bg-green-500 hover:bg-green-600" : ""}
                        onClick={() => updateTestStatus(test.id, "passed")}
                      >
                        ✓
                      </Button>
                      <Button 
                        size="sm" 
                        variant={test.status === "failed" ? "default" : "outline"}
                        className={test.status === "failed" ? "bg-red-500 hover:bg-red-600" : ""}
                        onClick={() => updateTestStatus(test.id, "failed")}
                      >
                        ✗
                      </Button>
                      <Button 
                        size="sm" 
                        variant={test.status === "pending" ? "default" : "outline"}
                        className={test.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                        onClick={() => updateTestStatus(test.id, "pending")}
                      >
                        ⏳
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum teste encontrado</p>
        </div>
      )}
    </div>
  )
}