"use client"

import { useState } from "react"
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

// Dados de exemplo
const clientesScore = [
  { id: 1, nome: "João Silva", cpf: "123.456.789-00", score: 850, limite: 10000, status: "excellent", tendencia: "up", dividaAtiva: 2500 },
  { id: 2, nome: "Maria Santos", cpf: "987.654.321-00", score: 720, limite: 5000, status: "good", tendencia: "stable", dividaAtiva: 0 },
  { id: 3, nome: "Pedro Costa", cpf: "456.789.123-00", score: 480, limite: 0, status: "poor", tendencia: "down", dividaAtiva: 8500 },
  { id: 4, nome: "Ana Pereira", cpf: "321.654.987-00", score: 620, limite: 3000, status: "fair", tendencia: "up", dividaAtiva: 1500 },
  { id: 5, nome: "Roberto Lima", cpf: "654.321.789-00", score: 780, limite: 8000, status: "good", tendencia: "up", dividaAtiva: 0 },
  { id: 6, nome: "Juliana Oliveira", cpf: "789.123.456-00", score: 320, limite: 0, status: "very_poor", tendencia: "down", dividaAtiva: 12000 },
]

const scoreDistribution = [
  { range: "900-1000", count: 12, color: "#22C55E" },
  { range: "800-899", count: 28, color: "#4ADE80" },
  { range: "700-799", count: 45, color: "#84CC16" },
  { range: "600-699", count: 38, color: "#F59E0B" },
  { range: "500-599", count: 22, color: "#F97316" },
  { range: "400-499", count: 15, color: "#EF4444" },
  { range: "300-399", count: 8, color: "#DC2626" },
  { range: "0-299", count: 4, color: "#991B1B" },
]

const fatoresScore = [
  { factor: "Pagamentos", score: 85, weight: 35 },
  { factor: "Utilização de Crédito", score: 72, weight: 25 },
  { factor: "Tempo de Histórico", score: 90, weight: 15 },
  { factor: "Novos Créditos", score: 65, weight: 10 },
  { factor: "Diversidade", score: 80, weight: 15 },
]

const historicoScore = [
  { mes: "Out", score: 780 },
  { mes: "Nov", score: 795 },
  { mes: "Dez", score: 810 },
  { mes: "Jan", score: 805 },
  { mes: "Fev", score: 830 },
  { mes: "Mar", score: 850 },
]

const scoreRanges = [
  { min: 900, max: 1000, label: "Excelente", color: "bg-green-500", text: "text-green-400", desc: "Cliente prioritário, limite máximo" },
  { min: 800, max: 899, label: "Ótimo", color: "bg-green-400", text: "text-green-300", desc: "Bom histórico, limite alto" },
  { min: 700, max: 799, label: "Bom", color: "bg-lime-500", text: "text-lime-400", desc: "Confiável, limite médio" },
  { min: 600, max: 699, label: "Regular", color: "bg-yellow-500", text: "text-yellow-400", desc: "Atenção necessária" },
  { min: 500, max: 599, label: "Ruim", color: "bg-orange-500", text: "text-orange-400", desc: "Limite reduzido" },
  { min: 0, max: 499, label: "Péssimo", color: "bg-red-500", text: "text-red-400", desc: "Sem limite, cobrança ativa" },
]

export default function ScoringPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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

  const calcularLimite = (score: number) => {
    if (score >= 900) return 15000
    if (score >= 800) return 10000
    if (score >= 700) return 5000
    if (score >= 600) return 3000
    if (score >= 500) return 1000
    return 0
  }

  const mediaScore = Math.round(clientesScore.reduce((acc, c) => acc + c.score, 0) / clientesScore.length)
  const clientesAltoRisco = clientesScore.filter(c => c.score < 500).length

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
