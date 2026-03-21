"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { 
  RefreshCw, 
  Plus, 
  Search, 
  User, 
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  History,
  Calculator,
  ChevronRight,
  Download,
  Send,
  Building,
  Phone,
  Mail,
  Loader2
} from "lucide-react"
import { trpc } from "@/trpc/client"
import { formatCurrency, formatDate } from "@/lib/utils"

// Demo data for renegotiations
const renegotiationsData = [
  {
    id: "1",
    originalLoan: "CX-2024-0001",
    customer: {
      name: "João Silva",
      document: "123.456.789-00",
      phone: "(11) 99999-9999",
      email: "joao@email.com"
    },
    originalValue: 10000,
    currentDebt: 8500,
    newValue: 9200,
    newInstallments: 12,
    newInterest: 2.5,
    status: "completed",
    requestedBy: "Cliente",
    requestedAt: "2024-03-01",
    completedAt: "2024-03-05",
    notes: "Parcelas atrasadas por 30 dias"
  },
  {
    id: "2",
    originalLoan: "CX-2024-0002",
    customer: {
      name: "Maria Santos",
      document: "987.654.321-00",
      phone: "(11) 88888-8888",
      email: "maria@email.com"
    },
    originalValue: 5000,
    currentDebt: 4500,
    newValue: 4800,
    newInstallments: 6,
    newInterest: 2.0,
    status: "pending",
    requestedBy: "Operador",
    requestedAt: "2024-03-15",
    completedAt: null,
    notes: "Dificuldades financeiras temporárias"
  },
  {
    id: "3",
    originalLoan: "CX-2024-0003",
    customer: {
      name: "Pedro Costa",
      document: "456.789.123-00",
      phone: "(11) 77777-7777",
      email: "pedro@email.com"
    },
    originalValue: 8000,
    currentDebt: 7200,
    newValue: 7500,
    newInstallments: 10,
    newInterest: 2.0,
    status: "rejected",
    requestedBy: "Cliente",
    requestedAt: "2024-03-10",
    completedAt: null,
    notes: "Proposta recusada pelo cliente"
  }
]

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

export default function RenegotiationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedRenegotiation, setSelectedRenegotiation] = useState<any>(null)
  
  // Fetch real data from API
  const { data: renegotiationsData, isLoading } = trpc.renegotiations.list.useQuery({ status: statusFilter as any }, {
    refetchOnMount: true,
  })
  
  const renegotiations = renegotiationsData?.renegotiations || []

  const filteredRenegotiations = renegotiations.filter((r: any) => {
    const customerName = r.loan?.customer?.name || ""
    const customerDoc = r.loan?.customer?.document || ""
    const matchesSearch = 
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerDoc.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": 
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200"><CheckCircle className="h-3 w-3 mr-1" />Concluída</Badge>
      case "pending": 
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      case "rejected": 
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Recusada</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

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
            <RefreshCw className="h-6 w-6 text-[#22C55E]" />
            Renegociação de Dívidas
          </h1>
          <p className="text-gray-500 mt-1">Gerencie renegociações de empréstimos com novas condições</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#22C55E]/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Renegociação
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Pendentes</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{renegotiations.filter(r => r.status === "pending").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Concluídas</p>
                <p className="text-2xl font-bold text-green-800 mt-1">{renegotiations.filter(r => r.status === "completed").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Valor Renegociado</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">
                  {formatCurrency(renegotiations.filter(r => r.status === "completed").reduce((acc, r) => acc + r.newValue, 0))}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-orange-800 mt-1">
                  {Math.round((renegotiations.filter(r => r.status === "completed").length / renegotiations.length) * 100)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center">
                <Percent className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar por cliente ou contrato..." 
                  className="pl-10 bg-white border-gray-200 focus:ring-[#22C55E] focus:border-[#22C55E]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="rejected">Recusada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredRenegotiations.map((renegotiation, index) => (
                <motion.div 
                  key={renegotiation.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedRenegotiation(renegotiation)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Customer Info */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#22C55E] flex items-center justify-center text-white font-bold">
                        {renegotiation.customer.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{renegotiation.customer.name}</p>
                          {getStatusBadge(renegotiation.status)}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <FileText className="h-3 w-3" />{renegotiation.originalLoan}
                          <span>•</span>
                          <span>{renegotiation.customer.document}</span>
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{renegotiation.customer.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{renegotiation.customer.email}</span>
                        </p>
                      </div>
                    </div>

                    {/* Values Comparison */}
                    <div className="flex items-center gap-6">
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-gray-500 mb-1">Dívida Atual</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(renegotiation.currentDebt)}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-gray-500 mb-1">Novo Valor</p>
                        <p className="font-semibold text-green-600">{formatCurrency(renegotiation.newValue)}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Parcelas</p>
                        <p className="font-semibold text-gray-900">{renegotiation.newInstallments}x</p>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Juros</p>
                        <p className="font-semibold text-gray-900">{renegotiation.newInterest}%</p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#22C55E] transition-colors" />
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Solicitado em: {new Date(renegotiation.requestedAt).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Por: {renegotiation.requestedBy}
                    </span>
                    {renegotiation.notes && (
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {renegotiation.notes}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* New Renegotiation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#22C55E]" />
              Nova Renegociação
            </DialogTitle>
            <DialogDescription>
              Crie um novo contrato com condições renegociadas mantendo o histórico original
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Cliente</label>
              <Select>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Buscar cliente por nome ou CPF..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joao">João Silva - 123.456.789-00</SelectItem>
                  <SelectItem value="maria">Maria Santos - 987.654.321-00</SelectItem>
                  <SelectItem value="pedro">Pedro Costa - 456.789.123-00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Original Loan Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações do Empréstimo Original
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Contrato</p>
                  <p className="font-semibold">CX-2024-0001</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Valor Original</p>
                  <p className="font-semibold">{formatCurrency(10000)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dívida Atual</p>
                  <p className="font-semibold text-red-600">{formatCurrency(8500)}</p>
                </div>
              </div>
            </div>

            {/* New Terms */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Novas Condições
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Novo Valor</label>
                  <Input type="number" placeholder="R$ 0,00" defaultValue={9200} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parcelas</label>
                  <Select defaultValue="12">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3x</SelectItem>
                      <SelectItem value="6">6x</SelectItem>
                      <SelectItem value="9">9x</SelectItem>
                      <SelectItem value="12">12x</SelectItem>
                      <SelectItem value="18">18x</SelectItem>
                      <SelectItem value="24">24x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Juros (% a.m.)</label>
                  <Input type="number" placeholder="0%" step="0.1" defaultValue={2.5} />
                </div>
              </div>
            </div>

            {/* Simulation */}
            <div className="p-4 bg-gradient-to-r from-[#22C55E]/10 to-[#4ADE80]/10 rounded-lg border border-[#22C55E]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Valor da Parcela</span>
                <span className="text-xl font-bold text-[#22C55E]">{formatCurrency(9200 / 12)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total a Pagar</span>
                <span className="font-semibold text-gray-900">{formatCurrency(9200)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea placeholder="Descreva os motivos da renegociação..." rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button variant="outline" className="gap-2">
              <Calculator className="h-4 w-4" />
              Simular
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A] gap-2">
              <CheckCircle className="h-4 w-4" />
              Criar Renegociação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!selectedRenegotiation} onOpenChange={() => setSelectedRenegotiation(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedRenegotiation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#22C55E]" />
                  Detalhes da Renegociação
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Customer */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#22C55E] flex items-center justify-center text-white font-bold">
                    {selectedRenegotiation.customer.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedRenegotiation.customer.name}</p>
                    <p className="text-sm text-gray-500">{selectedRenegotiation.customer.document}</p>
                  </div>
                  {getStatusBadge(selectedRenegotiation.status)}
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-700 mb-2">Antes</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor Original</span>
                        <span className="font-semibold">{formatCurrency(selectedRenegotiation.originalValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Dívida Atual</span>
                        <span className="font-semibold text-red-600">{formatCurrency(selectedRenegotiation.currentDebt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-2">Depois</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Novo Valor</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedRenegotiation.newValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Parcelas</span>
                        <span className="font-semibold">{selectedRenegotiation.newInstallments}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Juros</span>
                        <span className="font-semibold">{selectedRenegotiation.newInterest}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solicitado em</span>
                    <span className="font-medium">{new Date(selectedRenegotiation.requestedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {selectedRenegotiation.completedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Concluído em</span>
                      <span className="font-medium">{new Date(selectedRenegotiation.completedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Solicitado por</span>
                    <span className="font-medium">{selectedRenegotiation.requestedBy}</span>
                  </div>
                </div>

                {selectedRenegotiation.notes && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{selectedRenegotiation.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRenegotiation(null)}>
                  Fechar
                </Button>
                {selectedRenegotiation.status === "pending" && (
                  <>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-2" />
                      Recusar
                    </Button>
                    <Button className="bg-[#22C55E] hover:bg-[#16A34A]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
