"use client"

import { useState } from "react"
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
  Clock
} from "lucide-react"

// Demo data for financial reports
const cashFlowData = [
  { month: "Jan", revenue: 12500, expenses: 4200, profit: 8300 },
  { month: "Fev", revenue: 15800, expenses: 5100, profit: 10700 },
  { month: "Mar", revenue: 18200, expenses: 4800, profit: 13400 },
  { month: "Abr", revenue: 14500, expenses: 6200, profit: 8300 },
  { month: "Mai", revenue: 21000, expenses: 5500, profit: 15500 },
  { month: "Jun", revenue: 19500, expenses: 7100, profit: 12400 },
]

const projectedCashFlow = [
  { month: "Jul", projected: 22000, confidence: 85 },
  { month: "Ago", projected: 23500, confidence: 80 },
  { month: "Set", projected: 21000, confidence: 75 },
  { month: "Out", projected: 25000, confidence: 70 },
]

const defaultData = [
  { month: "Jan", revenue: 12500, expenses: 4200, profit: 8300 },
  { month: "Fev", revenue: 15800, expenses: 5100, profit: 10700 },
  { month: "Mar", revenue: 18200, expenses: 4800, profit: 13400 },
]

const defaultProjected = [
  { month: "Jul", projected: 22000, confidence: 85 },
  { month: "Ago", projected: 23500, confidence: 80 },
]

const overdueData = [
  { period: "Últimos 7 dias", count: 3, amount: 2500, rate: 5.5 },
  { period: "Últimos 15 dias", count: 5, amount: 5200, rate: 11.4 },
  { period: "Últimos 30 dias", count: 8, amount: 8750, rate: 19.1 },
  { period: "Últimos 60 dias", count: 12, amount: 14200, rate: 31.0 },
  { period: "Acima de 60 dias", count: 7, amount: 8750, rate: 19.1 },
]

const teamPerformance = [
  { name: "Carlos Silva", role: "Cobrador", collected: 12500, target: 15000, recovery: 83.3, contacts: 45 },
  { name: "Maria Santos", role: "Cobrador", collected: 18200, target: 15000, recovery: 121.3, contacts: 62 },
  { name: "Pedro Costa", role: "Cobrador", collected: 9800, target: 15000, recovery: 65.3, contacts: 38 },
  { name: "Ana Oliveira", role: "Cobrador", collected: 15400, target: 15000, recovery: 102.7, contacts: 55 },
]

const maxProjected = Math.max(...projectedCashFlow.map(d => d.projected))
const maxCollected = Math.max(...teamPerformance.map(d => d.collected))

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

export default function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState("6months")
  const [activeTab, setActiveTab] = useState("cashflow")

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
                <p className="text-2xl font-bold mt-1">R$ 101.500</p>
                <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +12.5% vs período anterior
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
                <p className="text-2xl font-bold mt-1">R$ 32.900</p>
                <p className="text-xs text-blue-100 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  -3.2% vs período anterior
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
                <p className="text-2xl font-bold mt-1">R$ 68.600</p>
                <p className="text-xs text-purple-100 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +18.3% vs período anterior
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
                <p className="text-2xl font-bold mt-1">8.5%</p>
                <p className="text-xs text-orange-100 mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-3 w-3" />
                  -2.1% vs período anterior
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
                        <span className="text-sm font-semibold text-gray-900">R$ 101.500</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.revenue / 21000) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: R$ {item.revenue.toLocaleString("pt-BR")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expenses */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          Despesas
                        </span>
                        <span className="text-sm font-semibold text-gray-900">R$ 32.900</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.expenses / 8000) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: R$ {item.expenses.toLocaleString("pt-BR")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Profit */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-purple-500" />
                          Lucro
                        </span>
                        <span className="text-sm font-semibold text-gray-900">R$ 68.600</span>
                      </div>
                      <div className="h-8 bg-gray-100 rounded-lg overflow-hidden flex">
                        {cashFlowData.map((item, index) => (
                          <div 
                            key={index}
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-500 border-r border-white/20 last:border-0 relative group"
                            style={{ width: `${(item.profit / 16000) * 100}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.month}: R$ {item.profit.toLocaleString("pt-BR")}
                            </div>
                          </div>
                        ))}
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
                    {projectedCashFlow.map((item, index) => (
                      <motion.div 
                        key={item.month}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-[#22C55E] hover:shadow-md transition-all duration-300"
                      >
                        <p className="text-sm font-medium text-gray-600">{item.month}</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          R$ {(item.projected / 1000).toFixed(1)}k
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
                      <strong>Total projetado:</strong> R$ 91.500 nos próximos 4 meses
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
                    {overdueData.map((item, index) => (
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
                          <p className="font-bold text-gray-900">R$ {item.amount.toLocaleString("pt-BR")}</p>
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
                        <p className="text-2xl font-bold text-red-600">35</p>
                        <p className="text-sm text-gray-500">Total Parcelas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">R$ 45.900</p>
                        <p className="text-sm text-gray-500">Valor Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">67</p>
                        <p className="text-sm text-gray-500">Dias Médios</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">8.5%</p>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#22C55E]" />
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
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#22C55E] flex items-center justify-center text-white font-bold">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Valor Coletado</p>
                            <p className="font-bold text-gray-900">R$ {member.collected.toLocaleString("pt-BR")}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-500">Meta</p>
                            <p className="font-semibold text-gray-600">R$ {member.target.toLocaleString("pt-BR")}</p>
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
                    <p className="text-xl font-bold text-[#1E3A8A]">R$ 55.900</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Meta Total</p>
                    <p className="text-xl font-bold text-gray-700">R$ 60.000</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Contatos</p>
                    <p className="text-xl font-bold text-gray-700">200</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Média de Recuperação</p>
                    <p className="text-xl font-bold text-[#22C55E]">93.2%</p>
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
