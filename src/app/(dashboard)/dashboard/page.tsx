"use client"

import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, CreditCard, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { trpc } from "@/trpc/client"
import type { DashboardRecentLoan, DashboardOverdueCustomer, Customer } from "@/types"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    }
  },
}

export default function DashboardPage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useAuth()
  
  // Fetch real dashboard data
  const { data: dashboardData, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: !!user,
  })
  
  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login")
    }
  }, [user, authLoading])
  
  if (authLoading || !user || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  // Use real data or fallback to zeros
  const stats = dashboardData?.stats || {
    total_customers: 0,
    active_loans: 0,
    total_to_receive: 0,
    total_received: 0,
    overdue_amount: 0,
    overdue_count: 0,
  }

  const recentLoans = dashboardData?.recentLoans || []
  const overdueCustomers = dashboardData?.overdueCustomers || []
  
  return (
    <motion.div 
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" variants={itemVariants}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
          <p className="text-gray-500 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <DashboardStats data={stats} />
      </motion.div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{t("dashboard.recentLoans")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-[#22C55E] hover:text-[#4ADE80] hover:bg-[#22C55E]/5">
                <Link href="/loans">
                  {t("common.seeAll")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLoans.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhum empréstimo recente</p>
                ) : (
                  recentLoans.map((loan: DashboardRecentLoan) => (
                    <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-medium text-sm ${
                          loan.status === "paid" ? "bg-green-100 text-green-700" :
                          loan.status === "active" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {loan.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{loan.name || "Cliente"}</p>
                          <p className="text-sm text-gray-500">{loan.installments}x parcelas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {(loan.amount || 0).toLocaleString("pt-BR")}</p>
                        <span className={`text-xs inline-flex items-center gap-1 ${
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{t("dashboard.overdueCustomers")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Link href="/collections">
                  Ver todos
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overdueCustomers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Nenhum cliente inadimplente</p>
                ) : (
                  overdueCustomers.map((customer: DashboardOverdueCustomer, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-red-50/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center font-medium text-sm text-red-700">
                          {customer.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name || "Cliente"}</p>
                          <p className="text-sm text-red-500">{customer.count} {customer.count > 1 ? "parcelas" : "parcela"} atrasada{customer.count > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">R$ {(customer.amount || 0).toLocaleString("pt-BR")}</p>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                          <Link href="/collections">Cobrar</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
