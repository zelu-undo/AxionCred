"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, 
  Plus, 
  Search, 
  User, 
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  Car,
  Home,
  Handshake,
  ChevronRight
} from "lucide-react"

// Demo data for guarantors
const guarantorsData = [
  {
    id: "1",
    name: "José da Silva",
    document: "123.456.789-00",
    phone: "(11) 99999-9999",
    email: "jose@email.com",
    address: "Rua das Flores, 123 - São Paulo, SP",
    type: "personal",
    relation: "Cônjuge",
    linkedLoans: 2,
    totalValue: 15000,
    status: "active",
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "Maria Oliveira",
    document: "987.654.321-00",
    phone: "(11) 88888-8888",
    email: "maria@email.com",
    address: "Av. Paulista, 456 - São Paulo, SP",
    type: "personal",
    relation: "Pai",
    linkedLoans: 1,
    totalValue: 8000,
    status: "active",
    createdAt: "2024-02-20"
  },
  {
    id: "3",
    name: "Imobiliária XPTO",
    document: "12.345.678/0001-90",
    phone: "(11) 3333-3333",
    email: "contato@imobiliariatropical.com.br",
    address: "Rua do Comércio, 789 - São Paulo, SP",
    type: "business",
    relation: "Empresa",
    linkedLoans: 3,
    totalValue: 50000,
    status: "active",
    createdAt: "2024-01-10"
  },
  {
    id: "4",
    name: "Pedro Santos",
    document: "456.789.123-00",
    phone: "(11) 77777-7777",
    email: "pedro@email.com",
    address: "Rua dos Pines, 321 - São Paulo, SP",
    type: "personal",
    relation: "Irmão",
    linkedLoans: 0,
    totalValue: 0,
    status: "inactive",
    createdAt: "2024-03-05"
  }
]

// Demo data for guarantees
const guaranteesData = [
  {
    id: "1",
    type: "property",
    description: "Apartamento 2 quartos - Centro",
    value: 250000,
    status: "verified",
    owner: "José da Silva",
    address: "Rua das Flores, 123 - São Paulo, SP",
    linkedLoan: "CX-2024-0001",
    documentNumber: "IMO-001-2024",
    registeredDate: "2024-01-15"
  },
  {
    id: "2",
    type: "vehicle",
    description: "Honda Civic 2023",
    value: 85000,
    status: "verified",
    owner: "Maria Oliveira",
    address: "Veículo",
    linkedLoan: "CX-2024-0002",
    documentNumber: "VEI-001-2024",
    registeredDate: "2024-02-10"
  },
  {
    id: "3",
    type: "guarantor",
    description: "Fiador - José da Silva",
    value: 15000,
    status: "pending",
    owner: "José da Silva",
    address: "Rua das Flores, 123",
    linkedLoan: "CX-2024-0003",
    documentNumber: "FIA-001-2024",
    registeredDate: "2024-03-01"
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

export default function GuarantorsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"guarantors" | "guarantees">("guarantors")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [guarantors] = useState(guarantorsData)
  const [guarantees] = useState(guaranteesData)

  const filteredGuarantors = guarantors.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.document.includes(searchQuery) ||
    g.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGuarantees = guarantees.filter(g => 
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.documentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "property": return <Building className="h-4 w-4" />
      case "vehicle": return <Car className="h-4 w-4" />
      case "guarantor": return <Handshake className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": 
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>
      case "inactive": 
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Inativo</Badge>
      case "verified": 
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200"><CheckCircle className="h-3 w-3 mr-1" />Verificado</Badge>
      case "pending": 
        return <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" />Pendente</Badge>
      default: 
        return <Badge variant="outline">{status}</Badge>
    }
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
            <Shield className="h-6 w-6 text-[#22C55E]" />
            Fiadores e Garantias
          </h1>
          <p className="text-gray-500 mt-1">Gerencie fiadores e garantias dos empréstimos</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#22C55E]/30"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Fiador
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Total de Fiadores</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{guarantors.filter(g => g.status === "active").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-200 flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Garantias Cadastradas</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">{guarantees.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Valor em Garantias</p>
                <p className="text-2xl font-bold text-purple-800 mt-1">R$ 350.000</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Garantias Pendentes</p>
                <p className="text-2xl font-bold text-orange-800 mt-1">{guarantees.filter(g => g.status === "pending").length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-200 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs and Content */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setActiveTab("guarantors")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "guarantors" 
                  ? "bg-[#22C55E] text-white shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <User className="h-4 w-4 inline-block mr-2" />
              Fiadores
            </button>
            <button
              onClick={() => setActiveTab("guarantees")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "guarantees" 
                  ? "bg-[#22C55E] text-white shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Shield className="h-4 w-4 inline-block mr-2" />
              Garantias
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar..." 
              className="pl-10 w-[250px] bg-white border-gray-200 focus:ring-[#22C55E] focus:border-[#22C55E]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Guarantors Tab */}
        <AnimatePresence mode="wait">
          {activeTab === "guarantors" && (
            <motion.div
              key="guarantors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {filteredGuarantors.map((guarantor, index) => (
                      <motion.div 
                        key={guarantor.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-white ${
                              guarantor.type === "business" ? "bg-gradient-to-br from-purple-500 to-purple-700" : "bg-gradient-to-br from-[#1E3A8A] to-[#22C55E]"
                            }`}>
                              {guarantor.type === "business" ? (
                                <Building className="h-5 w-5" />
                              ) : (
                                guarantor.name.split(" ").map(n => n[0]).join("")
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{guarantor.name}</p>
                                {getStatusBadge(guarantor.status)}
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="font-medium">{guarantor.relation}</span>
                                <span>•</span>
                                <span>{guarantor.document}</span>
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{guarantor.phone}</span>
                                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{guarantor.email}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-500">Empréstimos</p>
                              <p className="font-semibold text-gray-900">{guarantor.linkedLoans}</p>
                            </div>
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-500">Valor Total</p>
                              <p className="font-semibold text-gray-900">R$ {guarantor.totalValue.toLocaleString("pt-BR")}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Guarantees Tab */}
          {activeTab === "guarantees" && (
            <motion.div
              key="guarantees"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {filteredGuarantees.map((guarantee, index) => (
                      <motion.div 
                        key={guarantee.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              guarantee.type === "property" ? "bg-blue-100 text-blue-600" :
                              guarantee.type === "vehicle" ? "bg-purple-100 text-purple-600" :
                              "bg-orange-100 text-orange-600"
                            }`}>
                              {getTypeIcon(guarantee.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900">{guarantee.description}</p>
                                {getStatusBadge(guarantee.status)}
                              </div>
                              <p className="text-sm text-gray-500">
                                {guarantee.type === "property" ? "Imóvel" : guarantee.type === "vehicle" ? "Veículo" : "Fiador"} • {guarantee.owner}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <FileText className="h-3 w-3" />{guarantee.documentNumber}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-500">Valor</p>
                              <p className="font-semibold text-gray-900">R$ {guarantee.value.toLocaleString("pt-BR")}</p>
                            </div>
                            <div className="text-right hidden md:block">
                              <p className="text-sm text-gray-500">Contrato</p>
                              <p className="font-semibold text-gray-900">{guarantee.linkedLoan}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Fiador</DialogTitle>
            <DialogDescription>
              Preencha os dados do fiador para vincular a um empréstimo
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <Input placeholder="Nome do fiador" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CPF/CNPJ</label>
                <Input placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input placeholder="email@exemplo.com" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Endereço</label>
              <Input placeholder="Rua, número, bairro, cidade, estado" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]">
                  <option value="personal">Pessoa Física</option>
                  <option value="business">Pessoa Jurídica</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Relacionamento</label>
                <select className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]">
                  <option value="spouse">Cônjuge</option>
                  <option value="parent">Pai/Mãe</option>
                  <option value="sibling">Irmão(ã)</option>
                  <option value="friend">Amigo(iga)</option>
                  <option value="business">Empresa</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#22C55E] hover:bg-[#16A34A]">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Fiador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
