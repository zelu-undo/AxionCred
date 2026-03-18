"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Phone, MessageCircle, AlertCircle, CheckCircle, Clock } from "lucide-react"
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
    loan: "Empréstimo #1234"
  },
  { 
    id: "2", 
    customer: "Ana Pereira", 
    phone: "(11) 98888-7777",
    amount: 3200, 
    dueDate: "2024-02-01",
    daysOverdue: 30,
    loan: "Empréstimo #1235"
  },
  { 
    id: "3", 
    customer: "Roberto Lima", 
    phone: "(11) 97777-6666",
    amount: 2800, 
    dueDate: "2024-02-05",
    daysOverdue: 25,
    loan: "Empréstimo #1236"
  },
  { 
    id: "4", 
    customer: "Maria Silva", 
    phone: "(11) 96666-5555",
    amount: 2100, 
    dueDate: "2024-02-10",
    daysOverdue: 20,
    loan: "Empréstimo #1237"
  },
  { 
    id: "5", 
    customer: "João Santos", 
    phone: "(11) 95555-4444",
    amount: 1800, 
    dueDate: "2024-02-15",
    daysOverdue: 15,
    loan: "Empréstimo #1238"
  },
]

const todayPayments = [
  { 
    id: "6", 
    customer: "Pedro Costa", 
    phone: "(11) 94444-3333",
    amount: 890, 
    dueDate: "2024-03-18",
    loan: "Empréstimo #1240"
  },
  { 
    id: "7", 
    customer: "Juliana Oliveira", 
    phone: "(11) 93333-2222",
    amount: 1250, 
    dueDate: "2024-03-18",
    loan: "Empréstimo #1241"
  },
]

export default function CollectionsPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredOverdue = overduePayments.filter(payment =>
    payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.phone.includes(searchQuery)
  )

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("navigation.collections")}</h1>
        <p className="text-gray-500">Gerencie cobranças e inadimplências</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inadimplente</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-gray-500">{overduePayments.length} parcelas atrasadas</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Vence Hoje</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalToday)}</p>
                <p className="text-xs text-gray-500">{todayPayments.length} parcelas</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recuperado (30d)</p>
                <p className="text-2xl font-bold text-green-600">R$ 12.450</p>
                <p className="text-xs text-gray-500">85% de taxa de recuperação</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Parcelas Atrasadas
          </CardTitle>
          <CardDescription>Clientes com pagamento em atraso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOverdue.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    {payment.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{payment.customer}</p>
                    <p className="text-sm text-gray-500">{payment.loan}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">{payment.daysOverdue} dias em atraso</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">Venceu em {new Date(payment.dueDate).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${payment.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
                      <a href={getWhatsAppLink(payment.phone, payment.customer, payment.amount)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOverdue.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              Nenhum pagamento atrasado encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Vencimentos do Dia
          </CardTitle>
          <CardDescription>Parcelas que vencem hoje</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {todayPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                    {payment.customer.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{payment.customer}</p>
                    <p className="text-sm text-gray-500">{payment.loan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(payment.amount)}</p>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600" asChild>
                    <a href={getWhatsAppLink(payment.phone, payment.customer, payment.amount)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Cobrar
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
