"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, DollarSign, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useI18n } from "@/i18n/client"

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
    },
    {
      title: t("dashboard.activeLoans"),
      value: data.active_loans,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("dashboard.totalToReceive"),
      value: formatCurrency(data.total_to_receive),
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: t("dashboard.receivedThisMonth"),
      value: formatCurrency(data.total_received),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("dashboard.overdueAmount"),
      value: formatCurrency(data.overdue_amount),
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: t("dashboard.overdueInstallments"),
      value: data.overdue_count,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
