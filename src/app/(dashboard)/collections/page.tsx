"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Phone, MessageCircle, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { useDebounce } from "@/hooks/use-debounce"

export default function CollectionsPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 400)
  
  // Fetch overdue payments (late status)
  const { data: overdueData, isLoading: loadingOverdue } = trpc.payment.list.useQuery({
    overdueOnly: true,
    limit: 50,
    sortBy: "due_date",
    sortOrder: "asc",
  }, {
    refetchOnMount: true,
  })
  
  // Fetch today's payments
  const today = new Date().toISOString().split("T")[0]
  const { data: todayData, isLoading: loadingToday } = trpc.payment.list.useQuery({
    todayOnly: true,
    limit: 50,
    sortBy: "due_date",
    sortOrder: "asc",
  }, {
    refetchOnMount: true,
  })
  
  // Transform API data to collection format
  const overduePayments = (overdueData?.payments || []).map((p) => ({
    id: p.id,
    customer: p.customer_name,
    phone: p.customer_phone || "",
    amount: p.amount_due - (p.amount_paid || 0),
    dueDate: p.due_date,
    daysOverdue: Math.floor((new Date().getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)),
    loan: `Empréstimo #${p.loan_id?.slice(0, 8) || "-"}`
  }))
  
  const todayPayments = (todayData?.payments || []).map((p) => ({
    id: p.id,
    customer: p.customer_name,
    phone: p.customer_phone || "",
    amount: p.amount_due - (p.amount_paid || 0),
    dueDate: p.due_date,
    loan: `Empréstimo #${p.loan_id?.slice(0, 8) || "-"}`
  }))
  
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

      {/* Loading State */}
      {(loadingOverdue || loadingToday) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
          <span className="ml-2 text-gray-500">Carregando cobranças...</span>
        </div>
      ) : (
      <>
      {/* Summary Cards - Premium Design */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="
          relative overflow-hidden
          border-l-4 border-l-red-500
          bg-gradient-to-br from-red-50/50 to-white
          hover:shadow-lg hover:-translate-y-0.5
          transition-all duration-300
        ">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-8 -mt-8" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Inadimplente</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-gray-500 mt-1">{overduePayments.length} parcelas atrasadas</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center shadow-sm">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="
          relative overflow-hidden
          border-l-4 border-l-yellow-500
          bg-gradient-to-br from-yellow-50/50 to-white
          hover:shadow-lg hover:-translate-y-0.5
          transition-all duration-300
        ">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full -mr-8 -mt-8" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vence Hoje</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(totalToday)}</p>
                <p className="text-xs text-gray-500 mt-1">{todayPayments.length} parcelas</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center shadow-sm">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="
          relative overflow-hidden
          border-l-4 border-l-green-500
          bg-gradient-to-br from-green-50/50 to-white
          hover:shadow-lg hover:-translate-y-0.5
          transition-all duration-300
        ">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-8 -mt-8" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recuperado (30d)</p>
                <p className="text-2xl font-bold text-green-600 mt-1">R$ 12.450</p>
                <p className="text-xs text-gray-500 mt-1">85% de taxa de recuperação</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shadow-sm">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
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
      </>
      )}
    </div>
  )
}
