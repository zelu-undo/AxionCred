"use client"

import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { trpc } from "@/trpc/client"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Cores para os gráficos
const COLORS = {
  active: "#22C55E",
  paid: "#3B82F6",
  pending: "#F59E0B",
  overdue: "#EF4444",
}

const STATUS_LABELS: Record<string, string> = {
  active: "Ativos",
  paid: "Pagos",
  pending: "Pendentes",
  overdue: "Atrasados",
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { t } = useI18n()
  const { user, loading } = useAuth()
  
  // Fetch real dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.loan.dashboard.useQuery(undefined, {
    enabled: !!user,
  })
  
  // Fetch recent loans
  const { data: recentLoansData } = trpc.loan.list.useQuery({
    limit: 5,
    offset: 0,
  }, {
    enabled: !!user,
  })
  
  // Fetch overdue customers
  const { data: overdueData } = trpc.loan.overdueCustomers.useQuery(undefined, {
    enabled: !!user,
  })
  
  // Fetch charts data
  const { data: chartsData } = trpc.loan.dashboardCharts.useQuery(undefined, {
    enabled: !!user,
  })
  
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])
  
  if (loading || dashboardLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]600"></div>
      </div>
    )
  }
  
  const recentLoans = recentLoansData?.loans || []
  const overdueCustomers = overdueData || []
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
          <p className="text-gray-500">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/customers">
              <Users className="mr-2 h-4 w-4" />
              {t("dashboard.viewCustomers")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/loans/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.newLoan")}
            </Link>
          </Button>
        </div>
      </div>

      <DashboardStats data={dashboardData || {
        total_customers: 0,
        active_loans: 0,
        total_to_receive: 0,
        total_received: 0,
        overdue_amount: 0,
        overdue_count: 0,
      }} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.recentLoans")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/loans">
                {t("common.seeAll")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLoans.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum empréstimo encontrado</p>
              ) : (
                recentLoans.map((loan: any) => (
                  <div key={loan.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{loan.customer?.name || 'Cliente'}</p>
                      <p className="text-sm text-gray-500">{loan.installments_count}x</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {Number(loan.principal_amount).toLocaleString("pt-BR")}</p>
                      <span className={`text-xs ${
                        loan.status === "paid" ? "text-green-600" :
                        loan.status === "active" ? "text-blue-600" :
                        "text-yellow-600"
                      }`}>
                        {loan.status === "paid" ? t("loans.paidOut") :
                         loan.status === "active" ? t("loans.active") : t("loans.pending")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Gráfico de Pizza - Status dos Empréstimos */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-medium">Status dos Empréstimos</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsData && chartsData.loansByStatus && chartsData.loansByStatus.some((s: any) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartsData.loansByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartsData.loansByStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Empréstimos"]} />
                  <Legend formatter={(value: string) => STATUS_LABELS[value] || value} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Receita Mensal */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Receita Mensal (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsData && chartsData.monthlyRevenue ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartsData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]} />
                  <Bar dataKey="revenue" fill="#22C55E" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Novos Empréstimos por Mês */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-medium">Novos Empréstimos e Clientes (Últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsData && chartsData.loansPerMonth ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartsData.loansPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="loans" fill="#3B82F6" name="Empréstimos" />
                  <Bar dataKey="customers" fill="#F59E0B" name="Clientes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
