"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Plus,
  X,
  Edit,
  Trash2,
  ArrowRight,
  DollarSign,
  Users,
  Shield,
  History,
  Filter,
  Download,
  Search,
  Bell,
  Settings
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

// Dados de exemplo
const approvalLevels = [
  { id: 1, name: "Operador", level: 1, limit: 5000, canApprove: ["create_loan"], icon: Users },
  { id: 2, name: "Gerente", level: 2, limit: 20000, canApprove: ["create_loan", "edit_loan", "cancel_loan"], icon: Shield },
  { id: 3, name: "Diretor", level: 3, limit: 100000, canApprove: ["create_loan", "edit_loan", "cancel_loan", "delete_loan", "approve_renegotiation"], icon: Shield },
  { id: 4, name: "Admin", level: 4, limit: null, canApprove: ["*"], icon: Shield },
]

const approvalRules = [
  { id: 1, name: "Empréstimo até R$ 5.000", minValue: 0, maxValue: 5000, requiredLevel: 1, description: "Aprovação automática" },
  { id: 2, name: "Empréstimo R$ 5.001 - R$ 20.000", minValue: 5001, maxValue: 20000, requiredLevel: 2, description: "Necessita aprovação do Gerente" },
  { id: 3, name: "Empréstimo R$ 20.001 - R$ 50.000", minValue: 20001, maxValue: 50000, requiredLevel: 3, description: "Necessita aprovação do Diretor" },
  { id: 4, name: "Empréstimo acima de R$ 50.000", minValue: 50001, maxValue: null, requiredLevel: 4, description: "Necessita aprovação do Admin" },
]

const pendingApprovals = [
  { 
    id: 1, 
    type: "loan", 
    customer: "João Silva", 
    amount: 15000, 
    requestedBy: "Operador Maria",
    requestedAt: "2026-03-20 14:30",
    status: "pending",
    level: 2,
    description: "Empréstimo de R$ 15.000 em 12x"
  },
  { 
    id: 2, 
    type: "loan", 
    customer: "Pedro Costa", 
    amount: 8000, 
    requestedBy: "Operador João",
    requestedAt: "2026-03-20 11:15",
    status: "pending",
    level: 2,
    description: "Empréstimo de R$ 8.000 em 6x"
  },
  { 
    id: 3, 
    type: "renegotiation", 
    customer: "Ana Pereira", 
    amount: 12000, 
    requestedBy: "Gerente Carlos",
    requestedAt: "2026-03-19 16:45",
    status: "pending",
    level: 3,
    description: "Renegociação de dívida"
  },
  { 
    id: 4, 
    type: "loan", 
    customer: "Roberto Lima", 
    amount: 35000, 
    requestedBy: "Operador Maria",
    requestedAt: "2026-03-19 09:20",
    status: "approved",
    level: 3,
    description: "Empréstimo de R$ 35.000 em 24x"
  },
  { 
    id: 5, 
    type: "loan", 
    customer: "Juliana Oliveira", 
    amount: 2500, 
    requestedBy: "Operador João",
    requestedAt: "2026-03-18 15:30",
    status: "rejected",
    level: 1,
    description: "Empréstimo de R$ 2.500 em 4x",
    reason: "Cliente com score baixo"
  },
]

const approvalHistory = [
  { id: 1, type: "loan", customer: "Roberto Lima", amount: 35000, action: "approved", level: "Diretor", user: "Admin", date: "2026-03-19 10:00" },
  { id: 2, type: "loan", customer: "Carlos Mendes", amount: 12000, action: "approved", level: "Gerente", user: "Gerente Carlos", date: "2026-03-18 14:30" },
  { id: 3, type: "renegotiation", customer: "Fernanda Silva", amount: 8500, action: "rejected", level: "Diretor", user: "Admin", date: "2026-03-17 11:00" },
  { id: 4, type: "loan", customer: "Ricardo Alves", amount: 5000, action: "auto_approved", level: "Sistema", user: "Sistema", date: "2026-03-16 09:15" },
]

export default function ApprovalsPage() {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false)
  const [isCreateLevelOpen, setIsCreateLevelOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<typeof pendingApprovals[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Pendente</Badge>
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Aprovado</Badge>
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Rejeitado</Badge>
      case "auto_approved":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">Auto-Aprovado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "loan":
        return <DollarSign className="w-5 h-5" />
      case "renegotiation":
        return <History className="w-5 h-5" />
      default:
        return <CheckCircle className="w-5 h-5" />
    }
  }

  const filteredApprovals = pendingApprovals.filter(a => 
    filterStatus === "all" || a.status === filterStatus
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow de Aprovações</h1>
          <p className="text-gray-400">Gerencie aprovações e níveis hierárquicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
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
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {pendingApprovals.filter(a => a.status === "pending").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
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
                  <p className="text-sm text-gray-400">Aprovados Hoje</p>
                  <p className="text-3xl font-bold text-green-400">12</p>
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
                  <p className="text-sm text-gray-400">Rejeitados Hoje</p>
                  <p className="text-3xl font-bold text-red-400">3</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Níveis</p>
                  <p className="text-3xl font-bold text-blue-400">{approvalLevels.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="levels">Níveis</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-white">Aprovações Pendentes</CardTitle>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredApprovals.map((approval) => (
                  <motion.div
                    key={approval.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer"
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        {getTypeIcon(approval.type)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{approval.customer}</p>
                        <p className="text-sm text-gray-400">{approval.description}</p>
                        <p className="text-xs text-gray-500">
                          Solicitado por {approval.requestedBy} • {approval.requestedAt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xl font-bold text-white">
                          R$ {approval.amount.toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-gray-500">Valor</p>
                      </div>
                      
                      {getStatusBadge(approval.status)}
                      
                      {approval.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Aprovar
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Rejeitar
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                      
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Regras de Aprovação</CardTitle>
              <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Nova Regra</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-gray-300">Nome da Regra</Label>
                      <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: Empréstimo até R$ 5.000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300">Valor Mínimo</Label>
                        <Input type="number" className="bg-slate-900 border-slate-700 mt-1" placeholder="0" />
                      </div>
                      <div>
                        <Label className="text-gray-300">Valor Máximo</Label>
                        <Input type="number" className="bg-slate-900 border-slate-700 mt-1" placeholder="5000" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-300">Nível Necessário</Label>
                      <Select>
                        <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {approvalLevels.map(level => (
                            <SelectItem key={level.id} value={level.level.toString()}>
                              {level.name} (até {level.limit ? `R$ ${level.limit.toLocaleString()}` : "Ilimitado"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Descrição</Label>
                      <Textarea className="bg-slate-900 border-slate-700 mt-1" placeholder="Descrição da regra..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateRuleOpen(false)}>Cancelar</Button>
                    <Button className="bg-green-600 hover:bg-green-700">Criar Regra</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {approvalRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div>
                      <p className="font-medium text-white">{rule.name}</p>
                      <p className="text-sm text-gray-400">{rule.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">
                        Nível {rule.requiredLevel}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Níveis Hierárquicos</CardTitle>
              <Dialog open={isCreateLevelOpen} onOpenChange={setIsCreateLevelOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Nível
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Criar Novo Nível</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-gray-300">Nome do Nível</Label>
                      <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: Supervisor" />
                    </div>
                    <div>
                      <Label className="text-gray-300">Limite de Aprovação</Label>
                      <Input type="number" className="bg-slate-900 border-slate-700 mt-1" placeholder="25000" />
                    </div>
                    <div>
                      <Label className="text-gray-300">Permissões</Label>
                      <div className="space-y-2 mt-2">
                        {["Criar Empréstimo", "Editar Empréstimo", "Cancelar Empréstimo", "Excluir Dados", "Aprovar Renegociação"].map(perm => (
                          <div key={perm} className="flex items-center gap-2">
                            <Checkbox id={perm} />
                            <Label htmlFor={perm} className="text-gray-300 cursor-pointer">{perm}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateLevelOpen(false)}>Cancelar</Button>
                    <Button className="bg-green-600 hover:bg-green-700">Criar Nível</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvalLevels.map((level, index) => (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <level.icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{level.name}</p>
                        <p className="text-sm text-gray-400">Nível {level.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-medium text-white">
                          {level.limit ? `R$ ${level.limit.toLocaleString("pt-BR")}` : "Ilimitado"}
                        </p>
                        <p className="text-xs text-gray-500">Limite</p>
                      </div>
                      <Badge variant="outline" className="border-slate-600">
                        {level.canApprove.length} permissões
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Aprovações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.action === "approved" ? "bg-green-500/20" : 
                        item.action === "rejected" ? "bg-red-500/20" : 
                        "bg-blue-500/20"
                      }`}>
                        {item.action === "approved" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : item.action === "rejected" ? (
                          <XCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.customer}</p>
                        <p className="text-sm text-gray-400">
                          {item.type === "loan" ? "Empréstimo" : "Renegociação"} • R$ {item.amount.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{item.level}</p>
                        <p className="text-xs text-gray-500">{item.date}</p>
                      </div>
                      <Badge className={
                        item.action === "approved" ? "bg-green-500/20 text-green-400 border-green-500" :
                        item.action === "rejected" ? "bg-red-500/20 text-red-400 border-red-500" :
                        "bg-blue-500/20 text-blue-400 border-blue-500"
                      }>
                        {item.action === "approved" ? "Aprovado" : 
                         item.action === "rejected" ? "Rejeitado" : "Auto-Aprovado"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
