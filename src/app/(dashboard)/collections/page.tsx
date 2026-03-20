"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState, FilterBar } from "@/components/ui/empty-state"
import { Search, Phone, MessageCircle, AlertCircle, CheckCircle, Clock, Filter, X, UserPlus } from "lucide-react"
import { useI18n } from "@/i18n/client"

// Demo overdue payments
const overduePayments = [
  { 
    id: "1", 
    customer: "Carlos Oliveira", 
    phone: "(11) 99999-8888",
    amount: 4500, 
    dueDate: "2024-01-15",
    daysOverdue: 45,
    loan: "Empréstimo #1234",
    status: "late"
  },
  { 
    id: "2", 
    customer: "Ana Pereira", 
    phone: "(11) 98888-7777",
    amount: 3200, 
    dueDate: "2024-02-01",
    daysOverdue: 30,
    loan: "Empréstimo #1235",
    status: "late"
  },
  { 
    id: "3", 
    customer: "Roberto Lima", 
    phone: "(11) 97777-6666",
    amount: 2800, 
    dueDate: "2024-02-05",
    daysOverdue: 25,
    loan: "Empréstimo #1236",
    status: "late"
  },
  { 
    id: "4", 
    customer: "Maria Silva", 
    phone: "(11) 96666-5555",
    amount: 2100, 
    dueDate: "2024-02-10",
    daysOverdue: 20,
    loan: "Empréstimo #1237",
    status: "late"
  },
  { 
    id: "5", 
    customer: "João Santos", 
    phone: "(11) 95555-4444",
    amount: 1800, 
    dueDate: "2024-02-15",
    daysOverdue: 15,
    loan: "Empréstimo #1238",
    status: "late"
  },
]

const todayPayments = [
  { 
    id: "6", 
    customer: "Pedro Costa", 
    phone: "(11) 94444-3333",
    amount: 890, 
    dueDate: "2024-03-18",
    loan: "Empréstimo #1240",
    status: "due_today"
  },
  { 
    id: "7", 
    customer: "Juliana Oliveira", 
    phone: "(11) 93333-2222",
    amount: 1250, 
    dueDate: "2024-03-18",
    loan: "Empréstimo #1241",
    status: "due_today"
  },
]

export default function CollectionsPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [daysFilter, setDaysFilter] = useState("")
  
  const filteredOverdue = overduePayments.filter(payment => {
    const matchesSearch = 
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.phone.includes(searchQuery)
    
    const matchesStatus = !statusFilter || payment.status === statusFilter
    
    const matchesDays = !daysFilter || 
      (daysFilter === "0-15" && payment.daysOverdue <= 15) ||
      (daysFilter === "16-30" && payment.daysOverdue > 15 && payment.daysOverdue <= 30) ||
      (daysFilter === "30+" && payment.daysOverdue > 30)
    
    return matchesSearch && matchesStatus && matchesDays
  })

  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0)
  const totalToday = todayPayments.reduce((sum, p) => sum + p.amount, 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getWhatsAppLink = (phone: string, customer: string, amount: number) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "")
    const message = `Olá ${customer}, verificamos que você tem uma parcela de ${formatCurrency(amount)} atrasada. Gostaría de negociar o pagamento?`
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("")
    setDaysFilter("")
  }

  const hasActiveFilters = searchQuery || statusFilter || daysFilter

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("navigation.collections")}</h1>
          <p className="text-gray-500">Gerencie cobranças e inadimplências</p>
        </div>
        <Button className="bg-[#22C55E] hover:bg-[#4ADE80] transition-all duration-300 hover:scale-105">
          <UserPlus className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Summary Cards - Premium */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="h-1.5 bg-red-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inadimplente</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-gray-500">{overduePayments.length} parcelas atrasadas</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="h-1.5 bg-yellow-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vence Hoje</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalToday)}</p>
                <p className="text-xs text-gray-500">{todayPayments.length} parcelas</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-7 w-7 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="h-1.5 bg-green-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recuperado (30d)</p>
                <p className="text-2xl font-bold text-green-600">R$ 12.450</p>
                <p className="text-xs text-gray-500">85% de taxa de recuperação</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Parcelas Atrasadas
            </CardTitle>
            <Badge variant="destructive" className="bg-red-100 text-red-700">
              {filteredOverdue.length} registros
            </Badge>
          </div>
          <CardDescription>Clientes com pagamento em atraso</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Bar */}
          <div className="mb-6">
            <FilterBar
              searchPlaceholder="Buscar por nome ou telefone..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={[
                {
                  label: "Status",
                  value: "status",
                  options: [
                    { label: "Todos", value: "" },
                    { label: "Atrasado", value: "late" },
                    { label: "Vence hoje", value: "due_today" },
                  ]
                },
                {
                  label: "Dias",
                  value: "days",
                  options: [
                    { label: "Todos", value: "" },
                    { label: "0-15 dias", value: "0-15" },
                    { label: "16-30 dias", value: "16-30" },
                    { label: "30+ dias", value: "30+" },
                  ]
                }
              ]}
              activeFilters={{
                "Status": statusFilter,
                "Dias": daysFilter
              }}
              onFilterChange={(key, value) => {
                if (key === "Status") setStatusFilter(value)
                if (key === "Dias") setDaysFilter(value)
              }}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Empty State or List */}
          {filteredOverdue.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={<Search className="h-10 w-10 text-gray-400" />}
                title="Nenhum resultado encontrado"
                description="Tente ajustar seus filtros para encontrar o que procura."
                action={{
                  label: "Limpar filtros",
                  onClick: clearFilters
                }}
              />
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-10 w-10 text-green-500" />}
                title="Nenhuma parcela atrasada!"
                description="Parabéns! Todos os clientes estão em dia com seus pagamentos."
              />
            )
          ) : (
            <div className="space-y-4">
              {filteredOverdue.map((payment, index) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100 hover:bg-red-50 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                      {payment.customer.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{payment.customer}</p>
                      <p className="text-sm text-gray-500">{payment.loan}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600 font-medium">{payment.daysOverdue} dias em atraso</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-lg">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">Venceu em {new Date(payment.dueDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="hover:bg-gray-100 hover:scale-105 transition-all"
                        asChild
                      >
                        <a href={`tel:${payment.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all" 
                        asChild
                      >
                        <a href={getWhatsAppLink(payment.phone, payment.customer, payment.amount)} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Payments */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Vencimentos do Dia
          </CardTitle>
          <CardDescription>Parcelas que vencem hoje</CardDescription>
        </CardHeader>
        <CardContent>
          {todayPayments.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="h-10 w-10 text-green-500" />}
              title="Nenhuma parcela vence hoje"
              description="Volte amanhã para verificar os vencimentos."
            />
          ) : (
            <div className="space-y-4">
              {todayPayments.map((payment, index) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-xl border border-yellow-100 hover:bg-yellow-50 hover:shadow-md transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-lg">
                      {payment.customer.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{payment.customer}</p>
                      <p className="text-sm text-gray-500">{payment.loan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(payment.amount)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all" 
                      asChild
                    >
                      <a href={getWhatsAppLink(payment.phone, payment.customer, payment.amount)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Cobrar
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
