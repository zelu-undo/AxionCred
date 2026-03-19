"use client"

import { useRouter } from "next/navigation"
import { TrendingUp, Users, CreditCard, DollarSign, AlertTriangle, CheckCircle, ArrowRight, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Demo data
const demoStats = {
  total_customers: 248,
  active_loans: 156,
  total_to_receive: 245750.00,
  total_received: 123450.00,
  overdue_amount: 8750.00,
  overdue_count: 12,
}

const recentLoans = [
  { name: "João Silva", amount: 5000, installments: 6, status: "active", date: "18/03/2024" },
  { name: "Maria Santos", amount: 2500, installments: 3, status: "paid", date: "17/03/2024" },
  { name: "Pedro Costa", amount: 10000, installments: 12, status: "pending", date: "16/03/2024" },
  { name: "Ana Pereira", amount: 3500, installments: 6, status: "active", date: "15/03/2024" },
]

const overdueCustomers = [
  { name: "Carlos Oliveira", overdue: 2, amount: 1500 },
  { name: "Roberto Lima", overdue: 1, amount: 750 },
  { name: "Juliana Alves", overdue: 3, amount: 3200 },
]

export default function DemoDashboardPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar - No Navigation Allowed */}
      <header className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            <span className="text-xl font-bold">AXION - Demo</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Modo Demo - Apenas visualização
            </span>
            <Button size="sm" onClick={() => {
              localStorage.removeItem("axion_demo_enabled")
              router.push("/login")
            }}>
              Fazer Login
            </Button>
          </div>
        </div>
      </header>

      {/* Demo Notice */}
      <div className="bg-purple-600 text-white px-6 py-2 text-center text-sm">
        Esta é uma demonstração. Navegação desabilitada. •{" "}
        <Button variant="link" className="text-white h-auto p-0 text-sm underline" onClick={() => router.push("/login")}>
          Clique aqui para fazer login e acessar o sistema completo
        </Button>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoStats.total_customers}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Empréstimos Ativos</CardTitle>
              <CreditCard className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{demoStats.active_loans}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {demoStats.total_to_receive.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                156 contratos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Recebido</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {demoStats.total_received.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15% este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Loans */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">Empréstimos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLoans.map((loan, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{loan.name}</p>
                      <p className="text-sm text-gray-500">{loan.installments}x • {loan.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {loan.amount.toLocaleString("pt-BR")}</p>
                      <span className={`text-xs ${
                        loan.status === "paid" ? "text-green-600" :
                        loan.status === "active" ? "text-blue-600" :
                        "text-yellow-600"
                      }`}>
                        {loan.status === "paid" ? "Pago" :
                         loan.status === "active" ? "Ativo" : "Pendente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Clientes Inadimplentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-red-500">
                        {customer.overdue} {customer.overdue > 1 ? "parcelas atrasadas" : "parcela atrasada"}
                      </p>
                    </div>
                    <p className="font-medium text-red-600">
                      R$ {customer.amount.toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA to Login */}
        <div className="mt-8 text-center">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="py-8">
              <h3 className="text-xl font-bold text-purple-900 mb-2">
                Gostou do que viu?
              </h3>
              <p className="text-purple-700 mb-4">
                Crie sua conta agora e tenha acesso completo ao sistema AXION Cred
              </p>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={() => router.push("/login")}>
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
