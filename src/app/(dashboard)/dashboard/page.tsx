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

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Demo data for visualization
const demoData = {
  total_customers: 24,
  active_loans: 18,
  total_to_receive: 45750.00,
  total_received: 12340.00,
  overdue_amount: 8750.00,
  overdue_count: 7,
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]600"></div>
      </div>
    )
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

      <DashboardStats data={demoData} />

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
              {[
                { name: "João Silva", amount: 5000, installments: 6, status: "active" },
                { name: "Maria Santos", amount: 2500, installments: 3, status: "paid" },
                { name: "Pedro Costa", amount: 10000, installments: 12, status: "pending" },
              ].map((loan, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{loan.name}</p>
                    <p className="text-sm text-gray-500">{loan.installments}x</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {loan.amount.toLocaleString("pt-BR")}</p>
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
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">{t("dashboard.overdueCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Carlos Oliveira", overdue: 2, amount: 1500 },
                { name: "Ana Pereira", overdue: 1, amount: 750 },
                { name: "Roberto Lima", overdue: 4, amount: 3200 },
              ].map((customer, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-red-500">{customer.overdue} {customer.overdue > 1 ? t("dashboard.overdueInstallments").toLowerCase() : t("dashboard.overdueInstallments").toLowerCase().replace("s", "")}</p>
                  </div>
                  <p className="font-medium text-red-600">R$ {customer.amount.toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
