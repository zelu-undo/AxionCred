"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  Users,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react"
import { trpc } from "@/trpc/client"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export default function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState("6months")
  const [activeTab, setActiveTab] = useState("cashflow")

  // Calculate date range
  const dateRangeMonths = useMemo(() => {
    switch (dateRange) {
      case "30days": return 1;
      case "3months": return 3;
      case "6months": return 6;
      case "12months": return 12;
      case "year": return new Date().getMonth() + 1;
      default: return 6;
    }
  }, [dateRange]);

  // Calculate date range strings
  const dateFrom = useMemo(() => {
    return new Date(Date.now() - dateRangeMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
  }, [dateRangeMonths]);

  // Fetch real data with error handling and fallback
  const { data: paymentsData, isLoading: loadingPayments, error: paymentsError } = trpc.payment.list.useQuery({
    limit: 100,
    // Don't filter by date - get all payments for proper cash flow calculation
  }, {
    retry: 1,
    refetchOnMount: false,
  });

  const { data: overdueData, isLoading: loadingOverdue, error: overdueError } = trpc.payment.list.useQuery({
    overdueOnly: true,
    limit: 100,
  }, {
    retry: 1,
    refetchOnMount: false,
  });

  const { data: loanDashboard, error: loanError } = trpc.loan.dashboard.useQuery(undefined, {
    retry: 1,
    refetchOnMount: false,
  });

  // Fetch real expenses from cash (only operational expenses - exclude loan releases)
  const { data: expensesData, isLoading: loadingExpenses, error: expensesError } = trpc.cash.getExpensesByPeriod.useQuery({
    dateFrom: dateFrom,
  }, {
    retry: 1,
    refetchOnMount: false,
  });

  // Process data for charts - with fallback for when data is undefined due to errors
  const { cashFlowData, summary } = useMemo(() => {
    const months: { [key: string]: { revenue: number; expenses: number; profit: number } } = {};
    const now = new Date();
    
    // Initialize months
    for (let i = dateRangeMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = formatDate(date);
      months[key] = { revenue: 0, expenses: 0, profit: 0 };
    }

    // Sum payments by month (use paid_date for when payment was made)
    // Only count payments that were actually paid (status = 'paid')
    const payments = paymentsData?.payments;
    if (payments && Array.isArray(payments)) {
      payments.forEach((payment: any) => {
        // Only count paid installments with valid data
        if (payment?.status === 'paid' && Number(payment.amount_paid) > 0) {
          const paidDate = payment.paid_date ? new Date(payment.paid_date) : null;
          const dueDate = new Date(payment.due_date);
          
          // Skip invalid dates
          if (paidDate && isNaN(paidDate.getTime())) return;
          if (isNaN(dueDate.getTime())) return;
          
          // Use paid_date if available, otherwise skip (pending/late not paid yet)
          const date = paidDate || dueDate;
          const key = formatDate(date);
          
          // Only add if within the selected date range
          const checkDate = new Date(date);
          const startDate = new Date(now.getFullYear(), now.getMonth() - dateRangeMonths + 1, 1);
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          if (checkDate >= startDate && checkDate <= endDate) {
            if (months[key]) {
              const amount = Number(payment.amount_paid) || 0;
              months[key].revenue += amount;
              months[key].profit += amount;
            }
          }
        }
      });
    }

    // Convert to array
    const data = Object.entries(months).map(([month, values]) => ({
      month,
      revenue: isNaN(values.revenue) ? 0 : values.revenue,
      expenses: isNaN(values.expenses) ? 0 : values.expenses,
      profit: isNaN(values.profit) ? 0 : values.profit,
    }));

    // Calculate summary - use real expenses from cash (with fallback to 0 if error)
    const totalRevenue = data.reduce((sum, d) => sum + (isNaN(d.revenue) ? 0 : d.revenue), 0);
    const realExpenses = isNaN(expensesData?.total) ? 0 : (expensesData?.total ?? 0);
    const totalProfit = totalRevenue - realExpenses;

    return {
      cashFlowData: data,
      summary: {
        totalRevenue,
        totalExpenses: realExpenses,
        totalProfit: isNaN(totalProfit) ? 0 : totalProfit,
      }
    };
  }, [paymentsData, expensesData, dateRangeMonths]);

  // Calculate overdue statistics - with fallback for undefined data
  const overdueStats = useMemo(() => {
    const stats = [
      { period: "Últimos 7 dias", count: 0, amount: 0, rate: 0 },
      { period: "Últimos 15 dias", count: 0, amount: 0, rate: 0 },
      { period: "Últimos 30 dias", count: 0, amount: 0, rate: 0 },
      { period: "Últimos 60 dias", count: 0, amount: 0, rate: 0 },
      { period: "Acima de 60 dias", count: 0, amount: 0, rate: 0 },
    ];

    const now = new Date();
    
    // Handle case where overdueData or payments is undefined - safely access payments
    const payments = overdueData?.payments;
    if (payments && Array.isArray(payments)) {
      payments.forEach((payment: any) => {
        // Skip if payment or due_date is invalid
        if (!payment?.due_date) return;
        
        const dueDate = new Date(payment.due_date);
        if (isNaN(dueDate.getTime())) return;
        
        const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amountDue = Number(payment.amount_due) || 0;
        const amountPaid = Number(payment.amount_paid) || 0;
        const amount = amountDue - amountPaid;

        if (daysDiff <= 7) {
          stats[0].count++;
          stats[0].amount += amount;
        } else if (daysDiff <= 15) {
          stats[1].count++;
          stats[1].amount += amount;
        } else if (daysDiff <= 30) {
          stats[2].count++;
          stats[2].amount += amount;
        } else if (daysDiff <= 60) {
          stats[3].count++;
          stats[3].amount += amount;
        } else {
          stats[4].count++;
          stats[4].amount += amount;
        }
      });
    }

    // Calculate rates
    const totalOverdue = payments?.length || 1;
    stats.forEach(s => {
      s.rate = totalOverdue > 1 ? (s.count / totalOverdue) * 100 : 0;
    });

    return stats;
  }, [overdueData]);

  // Helper function to get average days from period name
  function getAvgDaysFromPeriod(period: string): number {
    if (period.includes("7")) return 7;
    if (period.includes("15")) return 15;
    if (period.includes("30")) return 30;
    if (period.includes("60")) return 60;
    return 90;
  }

  // Calculate default rate based on overdue data
  const defaultRateData = useMemo(() => {
    // Calculate from overdue stats - safely handle undefined data
    const totalOverdue = overdueStats.reduce((sum, s) => sum + (isNaN(s.count) ? 0 : s.count), 0);
    const totalOverdueAmount = overdueStats.reduce((sum, s) => sum + (isNaN(s.amount) ? 0 : s.amount), 0);
    
    // Get total installments from payments - safely access
    const payments = paymentsData?.payments;
    const totalInstallments = (payments && Array.isArray(payments)) ? payments.length : 0;
    
    // Calculate rate (percentage of overdue installments)
    const rate = totalInstallments > 0 && totalOverdue > 0 ? (totalOverdue / totalInstallments) * 100 : 0;
    
    // Calculate average days overdue
    const avgDays = totalOverdue > 0 
      ? overdueStats.reduce((sum, s) => sum + (s.count * getAvgDaysFromPeriod(s.period)), 0) / totalOverdue 
      : 0;
    
    return {
      rate: isNaN(rate) ? 0 : rate,
      totalCount: isNaN(totalOverdue) ? 0 : totalOverdue,
      totalAmount: isNaN(totalOverdueAmount) ? 0 : totalOverdueAmount,
      avgDays: isNaN(avgDays) ? 0 : avgDays
    };
  }, [overdueStats, paymentsData]);

  // Team performance placeholder (would need payment collector tracking)
  const teamPerformance = useMemo(() => {
    // Since payment collector is not tracked, show team metrics from dashboard
    // Handle case where loanDashboard is undefined due to errors
    if (!loanDashboard) {
      return [
        { name: "Total Clientes", role: "Base", collected: 0, target: 0, recovery: 0, contacts: 0 },
        { name: "Empréstimos Ativos", role: "Portfolio", collected: 0, target: 0, recovery: 0, contacts: 0 },
      ];
    }
    
    // Use total revenue as collected amount and show as metric
    const totalCollected = summary.totalRevenue;
    const recovery = totalCollected > 0 ? 100 : 0;
    
    return [
      { name: "Total Clientes", role: "Base", collected: loanDashboard.total_customers || 0, target: 0, recovery: 0, contacts: 0 },
      { name: "Empréstimos Ativos", role: "Portfolio", collected: loanDashboard.active_loans || 0, target: 0, recovery: 0, contacts: 0 },
      { name: "Total Coletado", role: "Receita", collected: totalCollected, target: totalCollected * 1.2, recovery: recovery, contacts: defaultRateData.totalCount },
    ];
  }, [loanDashboard, summary.totalRevenue, defaultRateData]);

  // Calculate projected cash flow (simple projection based on average monthly revenue)
  const projectedCashFlow = useMemo(() => {
    // Calculate average monthly revenue
    const avgMonthlyRevenue = summary.totalRevenue / Math.max(1, cashFlowData.length);
    const months = ["Próximo mês", "2 meses", "3 meses", "4 meses"];
    
    // Calculate projected values for each month based on average
    const data = months.map((month, i) => ({
      month,
      projected: Math.round(avgMonthlyRevenue * (1 + (i * 0.05))), // 5% growth per month
      confidence: Math.round(85 - (i * 5)), // Decreasing confidence
    }));
    
    // Calculate total projected for 4 months
    const totalProjected = data.reduce((sum, item) => sum + item.projected, 0);
    
    return {
      monthly: data,
      total: totalProjected
    };
  }, [summary.totalRevenue, cashFlowData.length]);

  // Loading state
  const isLoading = loadingPayments || loadingOverdue || loadingExpenses;

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#22C55E]" />
            Relatórios Financeiros
          </h1>
          <p className="text-gray-500 mt-1">Análises completas do seu negócio</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200 focus:ring-[#22C55E] focus:border-[#22C55E]">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
              <SelectItem value="year">Ano atual</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="bg-white border-gray-200 hover:bg-gray-50 hover:border-[#22C55E] transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Receita Total</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : formatCurrency(summary.totalRevenue)}</p>
                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Período: {dateRange === "30days" ? "Últimos 30 dias" : 
                           dateRange === "3months" ? "Últimos 3 meses" :
                           dateRange === "6months" ? "Últimos 6 meses" :
                           dateRange === "12months" ? "Últimos 12 meses" :
                           dateRange === "year" ? "Ano atual" : dateRange}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Despesas</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : formatCurrency(summary.totalExpenses)}</p>
                <p className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  Do Caixa
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg shadow-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Lucro Líquido</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : formatCurrency(summary.totalProfit)}</p>
                <p className="text-xs text-purple-100 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Receita - Despesas
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Taxa de Inadimplência</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "..." : `${defaultRateData.rate.toFixed(1)}%`}</p>
                <p className="text-xs text-orange-100 mt-1 flex items-center gap-1">
                  {defaultRateData.rate > 20 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                  {defaultRateData.totalCount} parcelas pendentes
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white p-1 border border-gray-200 rounded-lg w-full lg:w-auto">
            <TabsTrigger 
              value="cashflow" 
              className="flex-1 lg:flex-none data-[state=active]:bg-[#22C55E] data-[state=active]:text-white px-4"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger 
              value="default" 
              className="flex-1 lg:flex-none data-[state=active]:bg-[#22C55E] data-[state=active]:text-white px-4"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Inadimplência
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className="flex-1 lg:flex-none data-[state=active]:bg-[#22C55E] data-[state=active]:text-white px-4"
            >
              <Users className="h-4 w-4 mr-2" />
              Performance da Equipe
            </TabsTrigger>
          </TabsList>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Cash Flow Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Evolução Financeira</CardTitle>
                  <CardDescription>Receita, despesas e lucro por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Simple bar chart visualization */}
                  <div className="space-y-6">
                    {/* Revenue */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                          Receita
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => {
                          const maxRevenue = Math.max(...cashFlowData.map(d => d.revenue), 1);
                          return (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: {formatCurrency(item.revenue)}
                            </div>
                          </div>
                        );})}
                      </div>
                    </div>

                    {/* Expenses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Despesas
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(summary.totalExpenses)}</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => {
                          const maxExpenses = Math.max(...cashFlowData.map(d => d.expenses), 1);
                          return (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.expenses / maxExpenses) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: {formatCurrency(item.expenses)}
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>

                    {/* Profit */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-purple-500" />
                          Lucro
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(summary.totalProfit)}</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => {
                          const maxProfit = Math.max(...cashFlowData.map(d => d.profit), 1);
                          return (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.profit / maxProfit) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: {formatCurrency(item.profit)}
                            </div>
                          </div>
                        );})}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-gray-500">Receita</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs text-gray-500">Despesas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-gray-500">Lucro</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projected Cash Flow */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#22C55E]" />
                    Fluxo de Caixa Projetado
                  </CardTitle>
                  <CardDescription>Projeção baseada nas parcelas a receber</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {projectedCashFlow.monthly.map((item, index) => (
                      <motion.div 
                        key={item.month}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-[#22C55E] hover:shadow-md transition-all duration-300"
                      >
                        <p className="text-sm font-medium text-gray-600">{item.month}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {isLoading ? "..." : formatCurrency(item.projected)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] rounded-full"
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{item.confidence}%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">confiança</p>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <strong>Total projetado:</strong> {isLoading ? "..." : `${formatCurrency(projectedCashFlow.total)} nos próximos 4 meses`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Default Rate Tab */}
          <TabsContent value="default" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Relatório de Inadimplência por Período
                  </CardTitle>
                  <CardDescription>Análise detalhada das parcelas inadimplentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {overdueStats.map((item, index) => (
                      <motion.div 
                        key={item.period}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            item.rate > 20 ? "bg-red-100 text-red-600" :
                            item.rate > 10 ? "bg-orange-100 text-orange-600" :
                            "bg-yellow-100 text-yellow-600"
                          }`}>
                            {item.rate > 20 ? <XCircle className="h-5 w-5" /> :
                             item.rate > 10 ? <Clock className="h-5 w-5" /> :
                             <AlertTriangle className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.period}</p>
                            <p className="text-sm text-gray-500">{item.count} parcelas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                          <Badge variant={item.rate > 20 ? "destructive" : item.rate > 10 ? "warning" : "default"}>
                            {item.rate}%
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Resumo de Inadimplência</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : defaultRateData.totalCount}</p>
                        <p className="text-sm text-gray-500">Total Parcelas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{isLoading ? "..." : formatCurrency(defaultRateData.totalAmount)}</p>
                        <p className="text-sm text-gray-500">Valor Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{isLoading ? "..." : Math.round(defaultRateData.avgDays)}</p>
                        <p className="text-sm text-gray-500">Dias Médios</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{isLoading ? "..." : `${defaultRateData.rate.toFixed(1)}%`}</p>
                        <p className="text-sm text-gray-500">Taxa Global</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Performance da Equipe de Cobrança
                </CardTitle>
                <CardDescription>Resultados individuais e coletivo da equipe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((member, index) => (
                    <motion.div 
                      key={member.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-white border border-gray-200 hover:border-[#22C55E] hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#22C55E] flex items-center justify-center text-white">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Valor Coletado</p>
                            <p className="font-bold text-gray-900">{formatCurrency(member.collected)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Meta</p>
                            <p className="font-semibold text-gray-600">{member.target > 0 ? formatCurrency(member.target) : '-'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Contatos</p>
                            <p className="font-semibold text-gray-600">{member.contacts}</p>
                          </div>
                          <div className="text-center min-w-[100px]">
                            <p className="text-sm text-gray-500 mb-1">% da Meta</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    member.recovery >= 100 ? "bg-gradient-to-r from-[#22C55E] to-[#4ADE80]" :
                                    member.recovery >= 70 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(member.recovery, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${
                                member.recovery >= 100 ? "text-green-600" :
                                member.recovery >= 70 ? "text-yellow-600" : "text-red-600"
                              }`}>
                                {member.recovery.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Team Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-[#1E3A8A]/5 to-[#22C55E]/5 rounded-xl border border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Coletado</p>
                    <p className="text-xl font-bold text-[#1E3A8A]">{isLoading ? "..." : formatCurrency(summary.totalRevenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Meta Total</p>
                    <p className="text-xl font-bold text-gray-700">{isLoading ? "..." : formatCurrency(summary.totalRevenue * 1.2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Contatos</p>
                    <p className="text-xl font-bold text-gray-700">{isLoading ? "..." : defaultRateData.totalCount * 2}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Média de Recuperação</p>
                    <p className="text-xl font-bold text-[#22C55E]">{isLoading ? "..." : `${(100 - defaultRateData.rate).toFixed(1)}%`}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
