"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Users, 
  Tag, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Plus,
  X,
  Edit,
  Trash2,
  Filter,
  Download,
  Mail,
  MessageSquare,
  Phone,
  AlertCircle,
  CheckCircle,
  UserMinus,
  UserPlus,
  BarChart3,
  Send,
  Calendar,
  Search
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Progress } from "@/components/ui/progress"
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
  ResponsiveContainer,
  Treemap
} from "recharts"

// Dados de exemplo
const segments = [
  { 
    id: 1, 
    name: "Premium", 
    description: "Clientes com score alto e pagamento em dia",
    color: "#22C55E",
    icon: "star",
    count: 45,
    totalValue: 250000,
    avgScore: 820,
    automatic: true,
    rules: [{ field: "score", operator: ">=", value: 800 }, { field: "status", operator: "=", value: "active" }]
  },
  { 
    id: 2, 
    name: "Regular", 
    description: "Clientes com bom histórico de pagamentos",
    color: "#3B82F6",
    icon: "user",
    count: 120,
    totalValue: 180000,
    avgScore: 650,
    automatic: true,
    rules: [{ field: "score", operator: "between", value: [600, 799] }]
  },
  { 
    id: 3, 
    name: "Atenção", 
    description: "Clientes com pagamentos atrasados",
    color: "#F59E0B",
    icon: "alert",
    count: 35,
    totalValue: 85000,
    avgScore: 520,
    automatic: true,
    rules: [{ field: "installments_late", operator: ">", value: 1 }]
  },
  { 
    id: 4, 
    name: "Alto Risco", 
    description: "Clientes com inadimplência",
    color: "#EF4444",
    icon: "warning",
    count: 18,
    totalValue: 45000,
    avgScore: 380,
    automatic: true,
    rules: [{ field: "score", operator: "<", value: 500 }]
  },
  { 
    id: 5, 
    name: "Novos", 
    description: "Clientes cadastrados nos últimos 30 dias",
    color: "#8B5CF6",
    icon: "user-plus",
    count: 22,
    totalValue: 55000,
    avgScore: 600,
    automatic: true,
    rules: [{ field: "created_at", operator: "days_ago", value: 30 }]
  },
]

const manualTags = [
  { id: 1, name: "VIP", color: "#FFD700", count: 12 },
  { id: 2, name: "Prioritário", color: "#FF6B6B", count: 8 },
  { id: 3, name: "Indicação", color: "#4ECDC4", count: 25 },
  { id: 4, name: "Contato Urgente", color: "#FF4757", count: 5 },
  { id: 5, name: "Seguimento", color: "#45B7D1", count: 15 },
]

const campaigns = [
  { 
    id: 1, 
    name: "Promoção de Março", 
    segment: "Premium",
    channel: "whatsapp",
    sent: 45,
    delivered: 42,
    responded: 18,
    status: "completed",
    date: "2026-03-15"
  },
  { 
    id: 2, 
    name: "Lembrete de Vencimento", 
    segment: "Atenção",
    channel: "sms",
    sent: 35,
    delivered: 33,
    responded: 12,
    status: "completed",
    date: "2026-03-18"
  },
  { 
    id: 3, 
    name: "Nova Proposta", 
    segment: "Regular",
    channel: "email",
    sent: 120,
    delivered: 108,
    responded: 25,
    status: "active",
    date: "2026-03-20"
  },
]

const churnAnalysis = [
  { month: "Out", lost: 5, regained: 2, rate: 2.1 },
  { month: "Nov", lost: 8, regained: 3, rate: 3.2 },
  { month: "Dez", lost: 6, regained: 4, rate: 2.5 },
  { month: "Jan", lost: 4, regained: 5, rate: 1.8 },
  { month: "Fev", lost: 7, regained: 2, rate: 2.9 },
  { month: "Mar", lost: 3, regained: 4, rate: 1.2 },
]

const segmentDistribution = segments.map(s => ({
  name: s.name,
  value: s.count,
  color: s.color
}))

const recentChurn = [
  { id: 1, name: "Carlos Mendes", reason: "Concorrência", date: "2026-03-18", value: 5000 },
  { id: 2, name: "Fernanda Silva", reason: "Inadimplência", date: "2026-03-15", value: 8500 },
  { id: 3, name: "Ricardo Alves", reason: "Sem contato", date: "2026-03-10", value: 3200 },
]

export default function SegmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegment, setSelectedSegment] = useState<typeof segments[0] | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false)

  const totalClientes = segments.reduce((acc, s) => acc + s.count, 0)
  const totalValue = segments.reduce((acc, s) => acc + s.totalValue, 0)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "star": return <Users className="w-5 h-5" />
      case "user": return <Users className="w-5 h-5" />
      case "alert": return <AlertCircle className="w-5 h-5" />
      case "warning": return <AlertCircle className="w-5 h-5" />
      case "user-plus": return <UserPlus className="w-5 h-5" />
      default: return <Users className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Segmentação de Clientes</h1>
          <p className="text-gray-400">Gerencie segmentos, tags e campanhas</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                <Tag className="w-4 h-4 mr-2" />
                Nova Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Nova Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Nome da Tag</Label>
                  <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: VIP, Prioritário..." />
                </div>
                <div>
                  <Label className="text-gray-300">Cor</Label>
                  <div className="flex gap-2 mt-1">
                    {["#FFD700", "#FF6B6B", "#4ECDC4", "#FF4757", "#45B7D1", "#8B5CF6"].map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700">Criar Tag</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
                <Send className="w-4 h-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Nome da Campanha</Label>
                  <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: Promoção de Páscoa" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Segmento</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map(s => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Canal</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Mensagem</Label>
                  <Textarea className="bg-slate-900 border-slate-700 mt-1" rows={4} placeholder="Digite sua mensagem..." />
                </div>
                <div>
                  <Label className="text-gray-300">Agendar</Label>
                  <Input type="datetime-local" className="bg-slate-900 border-slate-700 mt-1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Segmento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Novo Segmento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Nome do Segmento</Label>
                  <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: Clientes Premium" />
                </div>
                <div>
                  <Label className="text-gray-300">Descrição</Label>
                  <Textarea className="bg-slate-900 border-slate-700 mt-1" rows={2} placeholder="Descrição do segmento..." />
                </div>
                <div>
                  <Label className="text-gray-300">Critérios de Automação</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                          <SelectValue placeholder="Campo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Score</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="loans">Empréstimos</SelectItem>
                          <SelectItem value="installments">Parcelas Atrasadas</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="bg-slate-900 border-slate-700 w-32">
                          <SelectValue placeholder="Operador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=">Igual</SelectItem>
                          <SelectItem value=">">Maior que</SelectItem>
                          <SelectItem value="<">Menor que</SelectItem>
                          <SelectItem value=">=">Maior igual</SelectItem>
                          <SelectItem value="<=">Menor igual</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input className="bg-slate-900 border-slate-700" placeholder="Valor" />
                      <Button variant="outline" size="icon" className="border-slate-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-700">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar Critério
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700">Criar Segmento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  <p className="text-sm text-gray-400">Total de Clientes</p>
                  <p className="text-3xl font-bold text-blue-400">{totalClientes}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
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
                  <p className="text-sm text-gray-400">Valor Total</p>
                  <p className="text-3xl font-bold text-green-400">
                    R$ {(totalValue / 1000).toFixed(0)}k
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Segmentos</p>
                  <p className="text-3xl font-bold text-purple-400">{segments.length}</p>
                </div>
                <Tag className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taxa de Churn</p>
                  <p className="text-3xl font-bold text-red-400">2.1%</p>
                </div>
                <UserMinus className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="segments" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="tags">Tags Manuais</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="churn">Análise de Churn</TabsTrigger>
        </TabsList>

        <TabsContent value="segments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment, index) => (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => setSelectedSegment(segment)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${segment.color}20` }}
                        >
                          <span style={{ color: segment.color }}>{getIcon(segment.icon)}</span>
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">{segment.name}</CardTitle>
                          <p className="text-xs text-gray-400">{segment.count} clientes</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">{segment.description}</p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Valor Total:</span>
                        <span className="text-white font-medium">
                          R$ {segment.totalValue.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Score Médio:</span>
                        <span className="text-white font-medium">{segment.avgScore}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Automático:</span>
                        <Badge variant={segment.automatic ? "default" : "secondary"} className={segment.automatic ? "bg-green-600" : ""}>
                          {segment.automatic ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={(segment.count / totalClientes) * 100} 
                      className="mt-4 h-2"
                      style={{ 
                        backgroundColor: '#374151',
                        '--progress': segment.color 
                      } as React.CSSProperties}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {((segment.count / totalClientes) * 100).toFixed(1)}% do total
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tags">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tags Manuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {manualTags.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-white text-sm">{tag.name}</span>
                    </div>
                    <Badge variant="outline" className="border-slate-600">
                      {tag.count}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Campanhas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div 
                    key={campaign.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        {campaign.channel === "whatsapp" ? (
                          <MessageSquare className="w-5 h-5 text-green-500" />
                        ) : campaign.channel === "sms" ? (
                          <Phone className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Mail className="w-5 h-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{campaign.name}</p>
                        <p className="text-sm text-gray-400">
                          {campaign.segment} • {campaign.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{campaign.sent}</p>
                        <p className="text-xs text-gray-400">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-400">{campaign.delivered}</p>
                        <p className="text-xs text-gray-400">Entregues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{campaign.responded}</p>
                        <p className="text-xs text-gray-400">Responderam</p>
                      </div>
                      <Badge className={campaign.status === "active" ? "bg-green-600" : "bg-gray-600"}>
                        {campaign.status === "active" ? "Ativa" : "Concluída"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="churn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Taxa de Churn por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={churnAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                      <Bar dataKey="lost" name="Perdidos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="regained" name="Recuperados" fill="#22C55E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Clientes Recentemente Perdidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentChurn.map((client) => (
                    <div 
                      key={client.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                    >
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-sm text-gray-400">{client.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-medium">R$ {client.value.toLocaleString("pt-BR")}</p>
                        <p className="text-xs text-gray-500">{client.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detalhes do Segmento Selecionado */}
      {selectedSegment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">
                Clientes do Segmento: {selectedSegment.name}
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedSegment(null)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input 
                  placeholder="Buscar cliente..." 
                  className="bg-slate-900 border-slate-700 max-w-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="text-gray-400 text-center py-8">
                Lista de clientes do segmento seria exibida aqui com paginação
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
