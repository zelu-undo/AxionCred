"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n/client"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface DashboardChartsProps {
  loanStatus?: {
    pending: number
    active: number
    paid: number
    cancelled: number
    renegotiated: number
  }
  monthlyRevenue?: { month: string; revenue: number }[]
  monthlyNewData?: { month: string; customers: number; loans: number }[]
}

const COLORS = {
  pending: "#F59E0B",
  active: "#22C55E",
  paid: "#3B82F6",
  cancelled: "#EF4444",
  renegotiated: "#8B5CF6",
}

const PORTUGUESE_MONTHS: Record<string, string> = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez",
}

function translateMonth(monthKey: string): string {
  const [, monthNum] = monthKey.split("-")
  return PORTUGUESE_MONTHS[monthNum] || monthKey
}

export function DashboardCharts({
  loanStatus,
  monthlyRevenue,
  monthlyNewData,
}: DashboardChartsProps) {
  const { t } = useI18n()

  // Prepare pie chart data
  const pieData = loanStatus
    ? Object.entries(loanStatus)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name:
            name === "pending"
              ? t("loans.pending")
              : name === "active"
              ? t("loans.active")
              : name === "paid"
              ? t("loans.paidOut")
              : name === "cancelled"
              ? t("loans.cancelled")
              : name === "renegotiated"
              ? t("loans.renegotiated")
              : name,
          value,
          color: COLORS[name as keyof typeof COLORS] || "#6B7280",
        }))
    : []

  // Prepare bar chart data for revenue
  const revenueData = (monthlyRevenue || []).map((item) => ({
    ...item,
    month: translateMonth(item.month),
  }))

  // Prepare bar chart data for new data
  const newDataChart = (monthlyNewData || []).map((item) => ({
    ...item,
    month: translateMonth(item.month),
  }))

  const hasNoData =
    pieData.length === 0 &&
    revenueData.length === 0 &&
    newDataChart.length === 0

  if (hasNoData) {
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Pie Chart - Loan Status */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {t("dashboard.loanStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart - Monthly Revenue */}
      {revenueData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {t("dashboard.monthlyRevenue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(value) =>
                    value >= 1000
                      ? `R$ ${(value / 1000).toFixed(0)}k`
                      : `R$ ${value}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart - New Loans and Customers */}
      {newDataChart.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {t("dashboard.newLoansAndCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={newDataChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="customers"
                  name={t("customers.title")}
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="loans"
                  name={t("loans.title")}
                  fill="#22C55E"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
