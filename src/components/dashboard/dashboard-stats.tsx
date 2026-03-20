"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { motion } from "framer-motion"

interface DashboardStatsProps {
  data: {
    total_customers: number
    active_loans: number
    total_to_receive: number
    total_received: number
    overdue_amount: number
    overdue_count: number
  }
}

export function DashboardStats({ data }: DashboardStatsProps) {
  const { t } = useI18n()
  
  const stats = [
    {
      title: t("dashboard.totalCustomers"),
      value: data.total_customers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-500/10",
      borderColor: "hover:border-blue-300/50",
    },
    {
      title: t("dashboard.activeLoans"),
      value: data.active_loans,
      icon: CreditCard,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10",
      iconBg: "bg-[#22C55E]/10",
      borderColor: "hover:border-[#22C55E]/30",
    },
    {
      title: t("dashboard.totalToReceive"),
      value: formatCurrency(data.total_to_receive),
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-500/10",
      borderColor: "hover:border-orange-300/50",
    },
    {
      title: t("dashboard.receivedThisMonth"),
      value: formatCurrency(data.total_received),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconBg: "bg-green-500/10",
      borderColor: "hover:border-green-300/50",
    },
    {
      title: t("dashboard.overdueAmount"),
      value: formatCurrency(data.overdue_amount),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconBg: "bg-red-500/10",
      borderColor: "hover:border-red-300/50",
    },
    {
      title: t("dashboard.overdueInstallments"),
      value: data.overdue_count,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconBg: "bg-red-500/10",
      borderColor: "hover:border-red-300/50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className={`border border-gray-200/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${stat.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
