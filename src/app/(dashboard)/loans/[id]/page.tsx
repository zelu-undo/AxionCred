"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timeline, TimelineItem } from "@/components/ui/timeline"
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Loader2, User, TrendingUp } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"

export default function LoanDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const loanId = params.id as string

  const { data: loanData, isLoading } = trpc.loan.byId.useQuery({ id: loanId })
  const loan = loanData

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t("loans.paidOut")}</Badge>
      case "active":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />{t("loans.active")}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />{t("loans.pending")}</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />{t("loans.cancelled")}</Badge>
      default:
        return null
    }
  }

  const getInstallmentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Pago</span>
      case "late":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Atrasado</span>
      case "pending":
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">Pendente</span>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Empréstimo não encontrado</p>
        <Button onClick={() => router.push("/loans")} className="bg-[#22C55E] hover:bg-[#4ADE80]">
          Voltar para Lista
        </Button>
      </div>
    )
  }

  const paidPercent = loan.installments_count > 0 
    ? (loan.paid_installments / loan.installments_count) * 100 
    : 0

  // Build timeline data from installments
  const timelineItems: TimelineItem[] = (loan.installments || []).map((inst: any) => ({
    id: inst.id,
    title: `Parcela #${inst.installment_number}`,
    description: inst.status === 'paid' ? 'Pagamento confirmado' : inst.status === 'late' ? 'Pagamento atrasado' : 'Aguardando pagamento',
    date: inst.paid_date ? formatDate(inst.paid_date) : formatDate(inst.due_date),
    status: inst.status === 'paid' ? 'completed' : inst.status === 'late' ? 'failed' : inst.status === 'pending' ? 'pending' : 'pending',
    amount: formatCurrency(inst.amount)
  })).reverse()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="hover:bg-gray-100 hover:scale-105 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Empréstimo #{loan.id.slice(0, 8)}</h1>
            {getStatusBadge(loan.status)}
          </div>
          <p className="text-gray-500 mt-1">Detalhes e histórico do empréstimo</p>
        </div>
      </div>

      {/* Premium Progress Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#22C55E] p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-white/80 text-sm">Valor Principal</p>
              <p className="text-3xl font-bold">{formatCurrency(loan.principal_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Total com Juros</p>
              <p className="text-2xl font-semibold">{formatCurrency(loan.total_amount)}</p>
            </div>
          </div>
          
          {/* Premium Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-white mb-2">
              <span className="text-sm font-medium">Progresso do Pagamento</span>
              <span className="text-sm font-bold">{paidPercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${paidPercent}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/70">
              <span>{loan.paid_installments} parcelas pagas</span>
              <span>{loan.installments_count - loan.paid_installments} restantes</span>
            </div>
          </div>
        </div>
        
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-600 font-medium">Pago</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(loan.paid_amount)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-blue-600 font-medium">Parcela</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(loan.total_amount / loan.installments_count)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50">
              <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-orange-600 font-medium">Restante</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(loan.remaining_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Info - Premium Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#22C55E]" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                <span className="text-lg font-bold text-[#22C55E]">
                  {loan.customer?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{loan.customer?.name || '-'}</p>
                <p className="text-sm text-gray-500">Cliente desde {formatDate(loan.created_at)}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Telefone</span>
                <span className="font-medium">{loan.customer?.phone || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">E-mail</span>
                <span className="font-medium text-sm">{loan.customer?.email || '-'}</span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full hover:bg-[#22C55E] hover:text-white hover:border-[#22C55E] transition-all duration-300"
              onClick={() => router.push(`/customers/${loan.customer_id}`)}
            >
              Ver Perfil Completo
            </Button>
          </CardContent>
        </Card>

        {/* Loan Details - Premium Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#22C55E]" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Taxa de Juros</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {loan.interest_rate}% ao mês
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Parcelas</span>
              <span className="font-semibold">{loan.installments_count}x</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Pagas</span>
              <span className="font-semibold text-green-600">{loan.paid_installments}/{loan.installments_count}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Criado em</span>
              <span className="font-medium text-sm">{formatDate(loan.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#22C55E]" />
              Histórico
            </CardTitle>
            <CardDescription>Acompanhamento das parcelas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[280px] overflow-y-auto pr-2">
              <Timeline items={timelineItems.slice(0, 5)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installments Table - Premium */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#22C55E]" />
            Todas as Parcelas
          </CardTitle>
          <CardDescription>Histórico completo de pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parcela</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Data Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(loan.installments || []).map((inst: any, index: number) => (
                  <tr 
                    key={inst.id} 
                    className="hover:bg-gray-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">#{inst.installment_number}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(inst.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(inst.due_date)}</td>
                    <td className="px-4 py-3">{getInstallmentStatusBadge(inst.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {inst.paid_date ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {formatDate(inst.paid_date)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
