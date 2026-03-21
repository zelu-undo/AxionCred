"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  CreditCard,
  PieChart,
  Calendar,
  Download,
  Settings,
  Plus,
  X,
  GripVertical,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Maximize2,
  LayoutDashboard,
  LineChart,
  BarChart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter
} from "recharts"

// KPIs disponíveis
const availableKPIs = [
  { id: "total_clients", name: "Total de Clientes", category: "clientes", icon: Users },
  { id: "active_loans", name: "Empréstimos Ativos", category: "emprestimos", icon: CreditCard },
  { id: "revenue", name: "Receita Total", category: "financeiro", icon: DollarSign },
  { id: "default_rate", name: "Taxa de Inadimplência", category: "financeiro", icon: TrendingDown },
  { id: "avg_ticket", name: "Ticket Médio", category: "financeiro", icon: DollarSign },
  { id: "recovery_rate", name: "Taxa de Recuperação", category: "financeiro", icon: TrendingUp },
  { id: "new_clients", name: "Novos Clientes", category: "clientes", icon: Users },
  { id: "churn_rate", name: "Taxa de Churn", category: "clientes", icon: TrendingDown },
]

// Dados de exemplo
const monthlyData = [
  { month: "Jan", revenue: 45000, clients: 120, loans: 45, defaults: 3 },
  { month: "Fev", revenue: 52000, clients: 135, loans: 52, defaults: 4 },
  { month: "Mar", revenue: 48000, clients: 142, loans: 48, defaults: 2 },
  { month: "Abr", revenue: 61000, clients: 158, loans: 61, defaults: 5 },
  { month: "Mai", revenue: 55000, clients: 165, loans: 55, defaults: 3 },
  { month: "Jun", revenue: 67000, clients: 180, loans: 67, defaults: 4 },
]

const comparisonData = [
  { period: "Jan", current: 45000, previous: 38000 },
  { period: "Fev", current: 52000, previous: 42000 },
  { period: "Mar", current: 48000, previous: 45000 },
  { period: "Abr", current: 61000, previous: 48000 },
  { period: "Mai", current: 55000, previous: 52000 },
  { period: "Jun", current: 67000, previous: 58000 },
]

const loansByStatus = [
  { name: "Ativos", value: 145, color: "#22C55E" },
  { name: "Pagos", value: 89, color: "#3B82F6" },
  { name: "Atrasados", value: 23, color: "#EF4444" },
  { name: "Cancelados", value: 12, color: "#6B7280" },
]

const loansByRange = [
  { range: "R$ 0-1k", count: 45 },
  { range: "R$ 1-3k", count: 78 },
  { range: "R$ 3-5k", count: 52 },
  { range: "R$ 5-10k", count: 34 },
  { range: "R$ 10k+", count: 18 },
]

const performanceMetrics = [
  { metric: "Receita", score: 85 },
  { metric: "Novos Clientes", score: 72 },
  { metric: "Recuperação", score: 90 },
  { metric: "Inadimplência", score: 65 },
  { metric: "Satisfação", score: 88 },
  { metric: "Eficiência", score: 78 },
]

const funnelData = [
  { stage: "Leads", count: 500, rate: 100 },
  { stage: "Qualificados", count: 250, rate: 50 },
  { stage: "Propostas", count: 120, rate: 24 },
  { stage: "Aprovados", count: 85, rate: 17 },
  { stage: "Contratados", count: 67, rate: 13 },
]

// Componente de KPI
function KPICard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string
  value: string
  change: string
  icon: React.ElementType
  trend: "up" | "down"
}) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            <div className={`flex items-center mt-1 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm">{change}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6months")
  const [selectedKPIs, setSelectedKPIs] = useState(["total_clients", "revenue", "active_loans", "default_rate"])
  const [isKPIDialogOpen, setIsKPIDialogOpen] = useState(false)
  const [chartType, setChartType] = useState("bar")

  const defaultKPIs = [
    { id: "total_clients", name: "Total de Clientes", value: "180", change: "+12%", trend: "up" as const, icon: Users },
    { id: "revenue", name: "Receita Total", value: "R$ 328k", change: "+22%", trend: "up" as const, icon: DollarSign },
    { id: "active_loans", name: "Empréstimos Ativos", value: "145", change: "+8%", trend: "up" as const, icon: CreditCard },
    { id: "default_rate", name: "Taxa de Inadimplência", value: "2.3%", change: "-0.5%", trend: "down" as const, icon: TrendingDown },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Analítico</h1>
          <p className="text-gray-400">Métricas, KPIs e análises avançadas</p>
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
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Selecionáveis */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Indicadores Principais</h2>
        <Dialog open={isKPIDialogOpen} onOpenChange={setIsKPIDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-slate-700">
              <Settings className="w-4 h-4 mr-2" />
              Personalizar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Personalizar KPIs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-gray-400 text-sm">Selecione os indicadores que deseja exibir:</p>
              <div className="grid grid-cols-2 gap-2">
                {availableKPIs.map((kpi) => (
                  <div key={kpi.id} className="flex items-center gap-2">
                    <Checkbox 
                      id={kpi.id}
                      checked={selectedKPIs.includes(kpi.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedKPIs([...selectedKPIs, kpi.id])
                        } else {
                          setSelectedKPIs(selectedKPIs.filter(k => k !== kpi.id))
                        }
                      }}
                    />
                    <Label htmlFor={kpi.id} className="text-gray-200 cursor-pointer">
                      {kpi.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsKPIDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsKPIDialogOpen(false)}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {defaultKPIs.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Tipo de Visualização */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Receita */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-white text-sm">Evolução da Receita</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant={chartType === "bar" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={chartType === "line" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8"
                    onClick={() => setChartType("line")}
                  >
                    <LineChart className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <RechartsBarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" tickFormatter={(v) => `R$ ${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, 'Receita']}
                        />
                        <Bar dataKey="revenue" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    ) : (
                      <RechartsLineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" tickFormatter={(v) => `R$ ${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                          formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, 'Receita']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E' }} />
                      </RechartsLineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Status de Empréstimos */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Empréstimos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={loansByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {loansByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {loansByStatus.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-300">{item.name}</span>
                      <span className="text-sm font-medium text-white ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda Linha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Empréstimos por Faixa */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Empréstimos por Faixa de Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={loansByRange} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis type="category" dataKey="range" stroke="#9CA3AF" width={80} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar de Performance */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceMetrics}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
                      <Radar
                        name="Performance"
                        dataKey="score"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Comparativo entre Períodos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, '']}
                    />
                    <Bar dataKey="previous" name="Período Anterior" fill="#6B7280" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" name="Período Atual" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="current" stroke="#22C55E" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded" />
                  <span className="text-gray-300">Período Anterior</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-gray-300">Período Atual</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((stage, index) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-gray-300">{stage.stage}</div>
                      <div className="flex-1 h-8 bg-slate-900 rounded overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.rate}%` }}
                          transition={{ delay: index * 0.1, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded"
                        />
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-white font-medium">{stage.count}</span>
                        <span className="text-gray-400 text-sm ml-2">({stage.rate}%)</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Tendência de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Area type="monotone" dataKey="clients" stroke="#3B82F6" fillOpacity={1} fill="url(#colorClients)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Tendência de Inadimplência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Line type="monotone" dataKey="defaults" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
