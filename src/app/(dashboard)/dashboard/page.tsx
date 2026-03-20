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
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  
  // Fetch dashboard data using tRPC
  const { data: statsData, isLoading: statsLoading } = trpc.loan.dashboard.useQuery(undefined, {
    enabled: !!user,
  })
  
  const { data: recentLoans, isLoading: loansLoading } = trpc.loan.recentLoans.useQuery(undefined, {
    enabled: !!user,
  })
  
  const { data: overdueCustomers, isLoading: overdueLoading } = trpc.loan.overdueCustomers.useQuery(undefined, {
    enabled: !!user,
  })
  
  const { data: loanStatus, isLoading: statusLoading } = trpc.loan.loanStatusDistribution.useQuery(undefined, {
    enabled: !!user,
  })
  
  const { data: monthlyRevenue, isLoading: revenueLoading } = trpc.loan.monthlyRevenue.useQuery(undefined, {
    enabled: !!user,
  })
  
  const { data: monthlyNewData, isLoading: newDataLoading } = trpc.loan.monthlyNewData.useQuery(undefined, {
    enabled: !!user,
  })
  
  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login")
    }
  }, [user, authLoading])
  
  const isLoading = authLoading || statsLoading || loansLoading || overdueLoading || statusLoading || revenueLoading || newDataLoading
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]600"></div>
      </div>
    )
  }
  
  const stats = statsData || {
    total_customers: 0,
    active_loans: 0,
    total_to_receive: 0,
    total_received: 0,
    overdue_amount: 0,
    overdue_count: 0,
  }
  
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

      <DashboardStats data={stats} />

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
              {(recentLoans || []).length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t("dashboard.noLoans")}</p>
              ) : (
                (recentLoans || []).map((loan: any) => (
                  <div key={loan.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{loan.customer?.name || "Cliente"}</p>
                      <p className="text-sm text-gray-500">{loan.installments_count}x</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">R$ {Number(loan.principal_amount).toLocaleString("pt-BR")}</p>
                      <span className={`text-xs ${
                        loan.status === "paid" ? "text-green-600" :
                        loan.status === "active" ? "text-blue-600" :
                        loan.status === "pending" ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {loan.status === "paid" ? t("loans.paidOut") :
                         loan.status === "active" ? t("loans.active") : 
                         loan.status === "pending" ? t("loans.pending") :
                         loan.status === "cancelled" ? t("loans.cancelled") :
                         loan.status === "renegotiated" ? t("loans.renegotiated") : loan.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.overdueCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(overdueCustomers || []).length === 0 ? (
                <p className="text-green-600 text-center py-4">{t("dashboard.noOverdue")}</p>
              ) : (
                (overdueCustomers || []).map((customer: any) => (
                  <div key={customer.customer_id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{customer.customer_name}</p>
                      <p className="text-sm text-red-500">{customer.overdue_count} {customer.overdue_count === 1 ? "parcela" : "parcelas"} atrasada(s)</p>
                    </div>
                    <p className="font-medium text-red-600">R$ {customer.overdue_amount.toLocaleString("pt-BR")}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts 
        loanStatus={loanStatus}
        monthlyRevenue={monthlyRevenue}
        monthlyNewData={monthlyNewData}
      />
    </div>
  )
}
