"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

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
      isCurrency: false,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      iconBg: "bg-blue-500/10",
      borderColor: "hover:border-blue-300/50",
      gradient: "from-blue-50 to-white",
    },
    {
      title: t("dashboard.activeLoans"),
      value: data.active_loans,
      isCurrency: false,
      icon: CreditCard,
      color: "text-[#22C55E]",
      bgColor: "bg-[#22C55E]/10",
      iconBg: "bg-[#22C55E]/10",
      borderColor: "hover:border-[#22C55E]/30",
      gradient: "from-green-50 to-white",
    },
    {
      title: t("dashboard.totalToReceive"),
      value: data.total_to_receive,
      isCurrency: true,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      iconBg: "bg-orange-500/10",
      borderColor: "hover:border-orange-300/50",
      gradient: "from-orange-50 to-white",
    },
    {
      title: t("dashboard.receivedThisMonth"),
      value: data.total_received,
      isCurrency: true,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconBg: "bg-green-500/10",
      borderColor: "hover:border-green-300/50",
      gradient: "from-emerald-50 to-white",
    },
    {
      title: t("dashboard.overdueAmount"),
      value: data.overdue_amount,
      isCurrency: true,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconBg: "bg-red-500/10",
      borderColor: "hover:border-red-300/50",
      gradient: "from-red-50 to-white",
    },
    {
      title: t("dashboard.overdueInstallments"),
      value: data.overdue_count,
      isCurrency: false,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconBg: "bg-red-500/10",
      borderColor: "hover:border-red-300/50",
      gradient: "from-red-50 to-white",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
        >
          <Card className={`relative overflow-hidden border border-gray-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${stat.borderColor}`}>
            {/* Gradient background overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl p-2.5 ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900">
                {stat.isCurrency ? (
                  <CountUp
                    end={stat.value}
                    decimals={2}
                    prefix="R$ "
                    useLocale
                  />
                ) : (
                  <CountUp end={stat.value} />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
