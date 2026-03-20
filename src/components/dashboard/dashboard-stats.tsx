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
      bgColor: "bg-blue-50",
      gradient: "from-blue-500/20 to-blue-600/10",
      iconGradient: "from-blue-500 to-blue-600",
      borderColor: "border-blue-200/40 hover:border-blue-400/50",
      hoverShadow: "hover:shadow-blue-500/15",
    },
    {
      title: t("dashboard.activeLoans"),
      value: data.active_loans,
      icon: CreditCard,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      gradient: "from-emerald-500/20 to-emerald-600/10",
      iconGradient: "from-emerald-500 to-emerald-600",
      borderColor: "border-emerald-200/40 hover:border-emerald-400/50",
      hoverShadow: "hover:shadow-emerald-500/15",
    },
    {
      title: t("dashboard.totalToReceive"),
      value: formatCurrency(data.total_to_receive),
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      gradient: "from-amber-500/20 to-amber-600/10",
      iconGradient: "from-amber-500 to-amber-600",
      borderColor: "border-amber-200/40 hover:border-amber-400/50",
      hoverShadow: "hover:shadow-amber-500/15",
    },
    {
      title: t("dashboard.receivedThisMonth"),
      value: formatCurrency(data.total_received),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      gradient: "from-green-500/20 to-green-600/10",
      iconGradient: "from-green-500 to-green-600",
      borderColor: "border-green-200/40 hover:border-green-400/50",
      hoverShadow: "hover:shadow-green-500/15",
    },
    {
      title: t("dashboard.overdueAmount"),
      value: formatCurrency(data.overdue_amount),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      gradient: "from-red-500/20 to-red-600/10",
      iconGradient: "from-red-500 to-red-600",
      borderColor: "border-red-200/40 hover:border-red-400/50",
      hoverShadow: "hover:shadow-red-500/15",
    },
    {
      title: t("dashboard.overdueInstallments"),
      value: data.overdue_count,
      icon: TrendingDown,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      gradient: "from-rose-500/20 to-rose-600/10",
      iconGradient: "from-rose-500 to-rose-600",
      borderColor: "border-rose-200/40 hover:border-rose-400/50",
      hoverShadow: "hover:shadow-rose-500/15",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className={`
            relative overflow-hidden border ${stat.borderColor}
            bg-white/80 backdrop-blur-sm
            hover:shadow-lg ${stat.hoverShadow}
            transition-all duration-300 hover:-translate-y-1
            group
          `}>
            {/* Background gradient effect */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${stat.gradient}
              opacity-0 group-hover:opacity-100
              transition-opacity duration-500
            `} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`
                relative p-2.5 rounded-xl
                bg-gradient-to-br ${stat.gradient}
                border border-white/50
                shadow-sm
                group-hover:scale-110 transition-transform duration-300
              `}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <div className={`
                text-2xl font-bold tracking-tight
                bg-gradient-to-r from-gray-900 to-gray-700
                bg-clip-text text-transparent
                group-hover:from-gray-900 group-hover:to-gray-800
                transition-all duration-300
              `}>
                {stat.value}
              </div>
              {/* Subtle indicator line */}
              <div className={`
                absolute bottom-0 left-0 right-0 h-0.5
                bg-gradient-to-r ${stat.gradient}
                transform scale-x-0 group-hover:scale-x-100
                transition-transform duration-500 ease-out
              `} />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
