"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  History,
  Calculator,
  ArrowRight,
  Filter,
  Download,
  Search,
  RefreshCw
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
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from "recharts"
import { trpc } from "@/trpc/client"
import { useDebounce } from "@/hooks/use-debounce"
import { formatCurrency } from "@/lib/utils"

export default function ScoringPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const debouncedSearch = useDebounce(searchTerm, 400)
  
  // Fetch customers with credit data
  const { data: customersData, isLoading, refetch } = trpc.customer.list.useQuery({
    limit: 100,
    search: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as "active" | "inactive",
  }, {
    refetchOnMount: true,
  })

  // Transform real data to scoring format
  const clientesScore = useMemo(() => {
    const customers = customersData?.customers || []
    return customers.map((c: any) => {
      // Calculate score based on loan history
      const totalLoans = c._count?.loans || 0
      const activeLoans = c.loans?.filter((l: any) => ["active", "late", "overdue"].includes(l.status)).length || 0
      const paidLoans = c.loans?.filter((l: any) => l.status === "paid").length || 0
      
      // Simple score calculation
      let score = 500
      if (totalLoans > 0) {
        const paymentRate = paidLoans / totalLoans
        score = Math.round(300 + (paymentRate * 700))
      }
      
      // Add months as customer bonus
      if (c.created_at) {
        const months = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        score = Math.min(1000, score + months * 10)
      }
      
      let status = "poor"
      if (score >= 800) status = "excellent"
      else if (score >= 700) status = "good"
      else if (score >= 600) status = "fair"
      else if (score >= 500) status = "poor"
      else status = "very_poor"
      
      // Calculate limit based on score
      let limite = 0
      if (score >= 900) limite = 15000
      else if (score >= 800) limite = 10000
      else if (score >= 700) limite = 5000
      else if (score >= 600) limite = 3000
      else if (score >= 500) limite = 1000
      
      // Calculate active debt
      const dividaAtiva = c.loans
        ?.filter((l: any) => ["active", "late", "overdue"].includes(l.status))
        .reduce((sum: number, l: any) => sum + (l.remaining_amount || 0), 0) || 0
      
      return {
        id: c.id,
        nome: c.name,
        cpf: c.document,
        score,
        limite,
        status,
        tendencia: activeLoans > 0 ? "stable" : "up",
        dividaAtiva,
      }
    })
  }, [customersData])

  const [selectedCliente, setSelectedCliente] = useState<typeof clientesScore[0] | null>(null)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Excelente</Badge>
      case "good":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">Bom</Badge>
      case "fair":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Regular</Badge>
      case "poor":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500">Ruim</Badge>
      case "very_poor":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Péssimo</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 900) return "text-green-400"
    if (score >= 800) return "text-green-300"
    if (score >= 700) return "text-lime-400"
    if (score >= 600) return "text-yellow-400"
    if (score >= 500) return "text-orange-400"
    return "text-red-400"
  }

  const filteredClientes = clientesScore.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpf.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || cliente.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate KPIs from real data
  const mediaScore = filteredClientes.length > 0 
    ? Math.round(filteredClientes.reduce((acc, c) => acc + c.score, 0) / filteredClientes.length)
    : 0
  const clientesAltoRisco = filteredClientes.filter(c => c.score < 500).length

  // Dynamic data for charts based on real clients
  const scoreDistribution = [
    { range: "900-1000", count: filteredClientes.filter(c => c.score >= 900 && c.score <= 1000).length, color: "#22C55E" },
    { range: "800-899", count: filteredClientes.filter(c => c.score >= 800 && c.score < 900).length, color: "#4ADE80" },
    { range: "700-799", count: filteredClientes.filter(c => c.score >= 700 && c.score < 800).length, color: "#84CC16" },
    { range: "600-699", count: filteredClientes.filter(c => c.score >= 600 && c.score < 700).length, color: "#F59E0B" },
    { range: "500-599", count: filteredClientes.filter(c => c.score >= 500 && c.score < 600).length, color: "#F97316" },
    { range: "400-499", count: filteredClientes.filter(c => c.score >= 400 && c.score < 500).length, color: "#EF4444" },
    { range: "300-399", count: filteredClientes.filter(c => c.score >= 300 && c.score < 400).length, color: "#DC2626" },
    { range: "0-299", count: filteredClientes.filter(c => c.score < 300).length, color: "#991B1B" },
  ]

  // Generate factors based on average scores
  const fatoresScore = [
    { factor: "Pagamentos", score: Math.min(100, Math.round(mediaScore / 10)), weight: 35 },
    { factor: "Utilização de Crédito", score: Math.min(100, Math.round(mediaScore / 12)), weight: 25 },
    { factor: "Tempo de Histórico", score: Math.min(100, Math.round(mediaScore / 15)), weight: 15 },
    { factor: "Novos Créditos", score: Math.min(100, Math.round(mediaScore / 8)), weight: 10 },
    { factor: "Diversidade", score: Math.min(100, Math.round(mediaScore / 9)), weight: 15 },
  ]

  const historicoScore = [
    { mes: "Out", score: Math.max(300, mediaScore - 50) },
    { mes: "Nov", score: Math.max(300, mediaScore - 30) },
    { mes: "Dez", score: Math.max(300, mediaScore - 10) },
    { mes: "Jan", score: Math.max(300, mediaScore - 20) },
    { mes: "Fev", score: Math.max(300, mediaScore - 5) },
    { mes: "Mar", score: mediaScore },
  ]

  const scoreRanges = [
    { min: 900, max: 1000, label: "Excelente", color: "bg-green-500", text: "text-green-400", desc: "Cliente prioritário, limite máximo" },
    { min: 800, max: 899, label: "Ótimo", color: "bg-green-400", text: "text-green-300", desc: "Bom histórico, limite alto" },
    { min: 700, max: 799, label: "Bom", color: "bg-lime-500", text: "text-lime-400", desc: "Confiável, limite médio" },
    { min: 600, max: 699, label: "Regular", color: "bg-yellow-500", text: "text-yellow-400", desc: "Atenção necessária" },
    { min: 500, max: 599, label: "Ruim", color: "bg-orange-500", text: "text-orange-400", desc: "Limite reduzido" },
    { min: 0, max: 499, label: "Péssimo", color: "bg-red-500", text: "text-red-400", desc: "Sem limite, cobrança ativa" },
  ]

  const calcularLimite = (score: number) => {
    if (score >= 900) return 15000
    if (score >= 800) return 10000
    if (score >= 700) return 5000
    if (score >= 600) return 3000
    if (score >= 500) return 1000
    return 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Scoring de Clientes</h1>
          <p className="text-gray-400">Análise de crédito e sugestões de limite</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recalcular
          </Button>
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Média de Score</p>
                  <p className="text-3xl font-bold text-blue-400">{mediaScore}</p>
                </div>
                <Star className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Clientes Excelentes</p>
                  <p className="text-3xl font-bold text-green-400">
                    {clientesScore.filter(c => c.score >= 800).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Alto Risco</p>
                  <p className="text-3xl font-bold text-red-400">{clientesAltoRisco}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
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
                  <p className="text-sm text-gray-400">Limites Sugeridos</p>
                  <p className="text-3xl font-bold text-purple-400">
                    R$ {clientesScore.reduce((acc, c) => acc + calcularLimite(c.score), 0).toLocaleString("pt-BR")}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="list">Lista de Clientes</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="ranges">Faixas de Score</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-white">Clientes por Score</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Buscar por nome ou CPF..." 
                      className="pl-9 w-64 bg-slate-900 border-slate-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Bom</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Ruim</SelectItem>
                      <SelectItem value="very_poor">Péssimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredClientes.map((cliente) => (
                  <motion.div
                    key={cliente.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer"
                    onClick={() => setSelectedCliente(cliente)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{cliente.nome}</p>
                        <p className="text-sm text-gray-400">{cliente.cpf}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(cliente.score)}`}>
                          {cliente.score}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      
                      <div className="text-center">
                        {cliente.tendencia === "up" ? (
                          <TrendingUp className="w-5 h-5 text-green-400 mx-auto" />
                        ) : cliente.tendencia === "down" ? (
                          <TrendingDown className="w-5 h-5 text-red-400 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-500 rounded mx-auto" />
                        )}
                        <div className="text-xs text-gray-500 mt-1">Tendência</div>
                      </div>
                      
                      <div className="text-center">
                        <p className="font-medium text-white">
                          R$ {calcularLimite(cliente.score).toLocaleString("pt-BR")}
                        </p>
                        <div className="text-xs text-gray-500">Limite Sugerido</div>
                      </div>
                      
                      {getStatusBadge(cliente.status)}
                      
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição de Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="range" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {scoreDistribution.map((entry, index) => (
                          <Bar key={`bar-${index}`} fill={entry.color} dataKey="count" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Fatores do Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={fatoresScore}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="factor" stroke="#9CA3AF" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
                      <Radar
                        name="Score"
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

        <TabsContent value="ranges">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Faixas de Score e Políticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoreRanges.map((range, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded ${range.color}`} />
                      <div>
                        <p className="font-medium text-white">{range.label}</p>
                        <p className="text-sm text-gray-400">{range.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{range.min}-{range.max}</p>
                        <p className="text-xs text-gray-500">Pontos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">
                          R$ {calcularLimite(range.min).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-gray-500">Limite Máximo</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-700">
                        Editar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhes do Cliente Selecionado */}
      {selectedCliente && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Detalhes: {selectedCliente.nome}
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedCliente(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-white">Informações</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPF:</span>
                      <span className="text-white">{selectedCliente.cpf}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Score Atual:</span>
                      <span className={`font-bold ${getScoreColor(selectedCliente.score)}`}>
                        {selectedCliente.score}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dívida Ativa:</span>
                      <span className="text-white">R$ {selectedCliente.dividaAtiva.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white">Sugestão de Limite</h4>
                  <div className="text-center p-4 bg-slate-900 rounded-lg">
                    <p className="text-4xl font-bold text-purple-400">
                      R$ {calcularLimite(selectedCliente.score).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">Limite recomendado</p>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular Novo Limite
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-white">Histórico de Score</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicoScore}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="mes" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} domain={[300, 900]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
