"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Wallet,
  CreditCard,
  ArrowRight,
  PieChart,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts"

// Dados de exemplo para demonstração
const cashFlowData = [
  { month: "Jan", entrada: 45000, saida: 28000, lucro: 17000 },
  { month: "Fev", entrada: 52000, saida: 31000, lucro: 21000 },
  { month: "Mar", entrada: 48000, saida: 29000, lucro: 19000 },
  { month: "Abr", entrada: 61000, saida: 35000, lucro: 26000 },
  { month: "Mai", entrada: 55000, saida: 32000, lucro: 23000 },
  { month: "Jun", entrada: 67000, saida: 38000, lucro: 29000 },
]

const projectionsData = [
  { month: "Jul", projetado: 58000, realizado: null },
  { month: "Ago", projetado: 62000, realizado: null },
  { month: "Set", projetado: 70000, realizado: null },
  { month: "Out", projetado: 65000, realizado: null },
  { month: "Nov", projetado: 72000, realizado: null },
  { month: "Dez", projeto: 80000, realizado: null },
]

const receivablesData = [
  { name: "Recebidas", value: 185000, color: "#22C55E" },
  { name: "A Receber", value: 95000, color: "#3B82F6" },
  { name: "Atrasadas", value: 15000, color: "#EF4444" },
]

const expensesData = [
  { category: "Operacionais", amount: 45000 },
  { category: "Marketing", amount: 12000 },
  { category: "Pessoal", amount: 28000 },
  { category: "Administrativo", amount: 8000 },
  { category: "Outros", amount: 5000 },
]

const recentTransactions = [
  { id: 1, type: "entrada", description: "Pagamento - João Silva", amount: 2500, date: "2026-03-20" },
  { id: 2, type: "entrada", description: "Pagamento - Maria Santos", amount: 1800, date: "2026-03-20" },
  { id: 3, type: "saida", description: "Fornecedor - Material", amount: -3500, date: "2026-03-19" },
  { id: 4, type: "entrada", description: "Pagamento - Pedro Costa", amount: 3200, date: "2026-03-19" },
  { id: 5, type: "saida", description: "Folha de Pagamento", amount: -15000, date: "2026-03-18" },
]

export default function CashFlowPage() {
  const [period, setPeriod] = useState("6months")
  const [view, setView] = useState("overview")

  const totalEntrada = 328000
  const totalSaida = 193000
  const lucroTotal = 135000
  const mediaMensal = lucroTotal / 6

  const healthAlerts = [
    { type: "warning", message: "Despesas operacionais aumentaram 12% este mês" },
    { type: "info", message: "Projeção de receita para próximo mês: R$ 58.000" },
    { type: "success", message: "Taxa de inadimplência em queda: 2.3%" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fluxo de Caixa</h1>
          <p className="text-gray-400">Gerencie entradas, saídas e projeções financeiras</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="12months">Últimos 12 meses</SelectItem>
              <SelectItem value="year">Ano atual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alertas de Saúde Financeira */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthAlerts.map((alert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-l-4 ${
              alert.type === "warning" ? "border-l-yellow-500 bg-yellow-500/10" :
              alert.type === "success" ? "border-l-green-500 bg-green-500/10" :
              "border-l-blue-500 bg-blue-500/10"
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.type === "warning" ? "text-yellow-500" :
                    alert.type === "success" ? "text-green-500" :
                    "text-blue-500"
                  }`} />
                  <p className="text-sm text-gray-200">{alert.message}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Entradas</p>
                  <p className="text-2xl font-bold text-green-400">
                    R$ {totalEntrada.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15.3% vs período anterior
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Saídas</p>
                  <p className="text-2xl font-bold text-red-400">
                    R$ {totalSaida.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-red-400">
                <TrendingDown className="w-4 h-4 mr-1" />
                +8.7% vs período anterior
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Lucro Total</p>
                  <p className="text-2xl font-bold text-blue-400">
                    R$ {lucroTotal.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-blue-400">
                <TrendingUp className="w-4 h-4 mr-1" />
                +22.1% vs período anterior
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Média Mensal</p>
                  <p className="text-2xl font-bold text-purple-400">
                    R$ {mediaMensal.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Lucro médio por mês
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
          <TabsTrigger value="receivables">Recebimentos</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução do Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$ ${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      formatter={(value) => [`R$ ${Number(value || 0).toLocaleString("pt-BR")}`, '']}
                    />
                    <Area type="monotone" dataKey="entrada" stroke="#22C55E" fillOpacity={1} fill="url(#colorEntrada)" name="Entradas" />
                    <Area type="monotone" dataKey="saida" stroke="#EF4444" fillOpacity={1} fill="url(#colorSaida)" name="Saídas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projection">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Projeção de Recebimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R$ ${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      formatter={(value) => [`R$ ${Number(value || 0).toLocaleString("pt-BR") || 0}`, '']}
                    />
                    <Line type="monotone" dataKey="projetado" stroke="#3B82F6" strokeWidth={2} name="Projetado" />
                    <Line type="monotone" dataKey="realizado" stroke="#22C55E" strokeWidth={2} name="Realizado" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Situação dos Recebimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={receivablesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: R$ ${Number(value || 0).toLocaleString("pt-BR")}`}
                      >
                        {receivablesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        formatter={(value) => [`R$ ${Number(value || 0).toLocaleString("pt-BR")}`, '']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Porcentagem por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {receivablesData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${(item.value / (receivablesData[0].value + receivablesData[1].value + receivablesData[2].value)) * 100}%`,
                            backgroundColor: item.color 
                          }} 
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-16 text-right">
                        {((item.value / (receivablesData[0].value + receivablesData[1].value + receivablesData[2].value)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Breakdown de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9CA3AF" tickFormatter={(value) => `R$ ${value/1000}k`} />
                    <YAxis type="category" dataKey="category" stroke="#9CA3AF" width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      formatter={(value) => [`R$ ${Number(value || 0).toLocaleString("pt-BR")}`, '']}
                    />
                    <Bar dataKey="amount" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transações Recentes */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Transações Recentes</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
            Ver todas <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "entrada" ? "bg-green-500/20" : "bg-red-500/20"
                  }`}>
                    {transaction.type === "entrada" ? (
                      <ArrowUpRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{transaction.description}</p>
                    <p className="text-xs text-gray-400">{transaction.date}</p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  transaction.type === "entrada" ? "text-green-400" : "text-red-400"
                }`}>
                  {transaction.type === "entrada" ? "+" : ""}
                  R$ {transaction.amount.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Saúde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Liquidez Corrente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-400">2.5</span>
              <span className="text-sm text-gray-400 mb-1">x</span>
            </div>
            <p className="text-xs text-green-400 mt-1">Indicador saudável</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-blue-400">41.2</span>
              <span className="text-sm text-gray-400 mb-1">%</span>
            </div>
            <p className="text-xs text-blue-400 mt-1">Acima da média do setor</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Prazo Médio de Recebimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-purple-400">32</span>
              <span className="text-sm text-gray-400 mb-1">dias</span>
            </div>
            <p className="text-xs text-yellow-400 mt-1">Atenção: +5 dias vs mês anterior</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
