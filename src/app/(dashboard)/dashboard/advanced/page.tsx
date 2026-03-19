"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, DollarSign, CreditCard, Percent, Activity } from "lucide-react"
import { useI18n } from "@/i18n/client"

// Mock data for charts
const monthlyData = [
  { month: "Jan", revenue: 12500, loans: 8 },
  { month: "Feb", revenue: 15800, loans: 12 },
  { month: "Mar", revenue: 18200, loans: 15 },
  { month: "Apr", revenue: 14500, loans: 10 },
  { month: "May", revenue: 21000, loans: 18 },
  { month: "Jun", revenue: 19500, loans: 16 },
]

const topDebtors = [
  { name: "Carlos Oliveira", amount: 4500, days: 45 },
  { name: "Ana Pereira", amount: 3200, days: 30 },
  { name: "Roberto Lima", amount: 2800, days: 25 },
  { name: "Maria Silva", amount: 2100, days: 20 },
  { name: "João Santos", amount: 1800, days: 15 },
]

const statusDistribution = [
  { status: "Quitados", count: 45, percentage: 35, color: "bg-green-500" },
  { status: "Ativos", count: 52, percentage: 40, color: "bg-blue-500" },
  { status: "Atrasados", count: 23, percentage: 18, color: "bg-red-500" },
  { status: "Pendentes", count: 10, percentage: 7, color: "bg-yellow-500" },
]

export default function AdvancedDashboardPage() {
  const { t } = useI18n()
  
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue))
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Avançado</h1>
        <p className="text-gray-500">Análise completa da sua operação de crédito</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ 4.250</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2">+12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taxa de Inadimplência</p>
                <p className="text-2xl font-bold">8.5%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Percent className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 mt-2">-2.3% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Taxa de Recuperação</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">+5% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Novos Clientes</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#22C55E]100 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#22C55E]600" />
              </div>
            </div>
            <p className="text-xs text-[#22C55E]600 mt-2">+18% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Receita</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-[#22C55E]600 rounded-t-md transition-all hover:bg-[#22C55E]700"
                    style={{ height: `${(data.revenue / maxRevenue) * 200}px` }}
                    title={`R$ ${data.revenue.toLocaleString("pt-BR")}`}
                  />
                  <span className="text-xs text-gray-500">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Total: <span className="font-bold text-gray-900">R$ 101.500</span></span>
              <span className="text-green-600 font-medium">+56%</span>
            </div>
          </CardContent>
        </Card>

        {/* Loans Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Empréstimos por Mês</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                    style={{ height: `${(data.loans / 20) * 200}px` }}
                    title={`${data.loans} empréstimos`}
                  />
                  <span className="text-xs text-gray-500">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Total: <span className="font-bold text-gray-900">79 empréstimos</span></span>
              <span className="text-green-600 font-medium">+100%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Debtors */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Devedores</CardTitle>
            <CardDescription>Clientes com maior saldo devedor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDebtors.map((debtor, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{debtor.name}</p>
                      <p className="text-xs text-gray-500">{debtor.days} dias em atraso</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">R$ {debtor.amount.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Visão geral da carteira</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.status}</span>
                    <span className="text-gray-500">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Total Clientes</p>
                  <p className="text-2xl font-bold">130</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Empréstimos Ativos</p>
                  <p className="text-2xl font-bold">52</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
