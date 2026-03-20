"use client"

import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, CreditCard, ArrowRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"
import { useEffect } from "react"
import { motion } from "framer-motion"

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
  const { user, loading } = useAuth()
  
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login")
    }
  }, [user, loading])
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
      </div>
    )
  }
  
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
          <Button 
            variant="outline" 
            asChild 
            className="group relative overflow-hidden border-2 border-[#1E3A8A]/20 hover:border-[#22C55E] bg-white hover:bg-[#22C55E]/5 transition-all duration-300 hover:shadow-lg hover:shadow-[#22C55E]/20"
          >
            <Link href="/customers" className="flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-[#22C55E]/0 via-[#22C55E]/5 to-[#22C55E]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#1E3A8A]/10 group-hover:bg-[#22C55E]/20 transition-colors duration-300">
                  <Users className="h-4 w-4 text-[#1E3A8A] group-hover:text-[#22C55E] transition-colors duration-300" />
                </span>
                <span className="text-[#1E3A8A] group-hover:text-[#22C55E] font-medium transition-colors duration-300">
                  {t("dashboard.viewCustomers")}
                </span>
              </span>
              <ArrowRight className="ml-2 h-4 w-4 text-[#1E3A8A]/50 group-hover:text-[#22C55E] group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          </Button>
          <Button 
            asChild 
            className="group relative overflow-hidden bg-[#22C55E] hover:bg-[#16A34A] hover:shadow-xl hover:shadow-[#22C55E]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/loans/new">
              <span className="relative flex items-center">
                <span className="p-1.5 rounded-lg bg-white/20 mr-2 group-hover:bg-white/30 transition-colors duration-300">
                  <Plus className="h-4 w-4" />
                </span>
                {t("dashboard.newLoan")}
              </span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <DashboardStats data={demoData} />
      </motion.div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card className="h-full hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-[#22C55E]/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium group-hover:text-[#22C55E] transition-colors">{t("dashboard.recentLoans")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-[#22C55E] hover:text-[#4ADE80] hover:bg-[#22C55E]/5">
                <Link href="/loans">
                  {t("common.seeAll")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "João Silva", amount: 5000, installments: 6, status: "active" },
                  { name: "Maria Santos", amount: 2500, installments: 3, status: "paid" },
                  { name: "Pedro Costa", amount: 10000, installments: 12, status: "pending" },
                ].map((loan, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/80 transition-all duration-200 group/item cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-semibold text-sm shadow-sm ${
                        loan.status === "paid" ? "bg-gradient-to-br from-green-100 to-green-200 text-green-700" :
                        loan.status === "active" ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" :
                        "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700"
                      }`}>
                        {loan.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{loan.name}</p>
                        <p className="text-sm text-gray-500">{loan.installments}x parcelas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">R$ {loan.amount.toLocaleString("pt-BR")}</p>
                      <span className={`text-xs inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        loan.status === "paid" ? "bg-green-100 text-green-700" :
                        loan.status === "active" ? "bg-blue-100 text-blue-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {loan.status === "paid" ? t("loans.paidOut") :
                         loan.status === "active" ? t("loans.active") : t("loans.pending")}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="h-full hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-red-300/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium group-hover:text-red-600 transition-colors">{t("dashboard.overdueCustomers")}</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Link href="/collections">
                  Ver todos
                  <ArrowUpRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Carlos Oliveira", overdue: 2, amount: 1500 },
                  { name: "Ana Pereira", overdue: 1, amount: 750 },
                  { name: "Roberto Lima", overdue: 4, amount: 3200 },
                ].map((customer, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50/50 transition-all duration-200 group/item cursor-pointer"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.01, x: -4 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center font-semibold text-sm text-red-700 shadow-sm">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-sm text-red-500">{customer.overdue} {customer.overdue > 1 ? "parcelas" : "parcela"} atrasada{customer.overdue > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">R$ {customer.amount.toLocaleString("pt-BR")}</p>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500 hover:text-red-600 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        Cobrar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
