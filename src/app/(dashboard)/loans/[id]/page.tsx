"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, Loader2, FileText, Download } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import type { LoanInstallment } from "@/types"
import { usePDF, LoanContractDocument } from "@/components/pdf"

export default function LoanDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const loanId = params.id as string

  const { data: loanData, isLoading } = trpc.loan.byId.useQuery({ id: loanId })
  const loan = loanData
  
  // Use the usePDF hook
  const { generatePDF, isGenerating } = usePDF()

  // Fetch installments for PDF
  const { data: installmentsData } = trpc.loan.installmentsForPayment.useQuery(
    { loanId },
    { enabled: !!loanId }
  )

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
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]600" />
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 mb-4">Empréstimo não encontrado</p>
        <Button onClick={() => router.push("/loans")}>Voltar para Lista</Button>
      </div>
    )
  }

  const paidPercent = loan.installments > 0 && typeof loan.installments === "number" 
    ? (loan.paid_installments / loan.installments) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Empréstimo #{loan.id.slice(0, 8)}</h1>
          <p className="text-gray-500">Detalhes do empréstimo</p>
        </div>
        <Button
          variant="outline"
          disabled={isGenerating || !installmentsData}
          onClick={() => {
            try {
              const doc = <LoanContractDocument data={{
                contractNumber: loan.id.slice(0, 8).toUpperCase(),
                createdAt: formatDate(loan.created_at),
                status: loan.status,
                amount: loan.amount,
                interestRate: loan.interest_rate || 0,
                installmentValue: loan.installment_amount,
                totalInstallments: loan.installments,
                paidInstallments: loan.paid_installments,
                remainingInstallments: loan.installments - loan.paid_installments,
                totalValue: loan.total_amount,
                customer: {
                  name: loan.customer?.name || 'Cliente',
                  document: loan.customer?.document || '',
                  email: loan.customer?.email || '',
                  phone: loan.customer?.phone || '',
                },
                installments: (installmentsData || []).map((inst) => ({
                  number: inst.installment_number,
                  dueDate: formatDate(inst.due_date),
                  value: Number(inst.amount),
                  status: inst.status as 'paid' | 'pending' | 'overdue',
                  paidAt: inst.paid_date ? formatDate(inst.paid_date) : undefined,
                })),
              }} />
              generatePDF(doc, `contrato-${loan.id.slice(0, 8)}.pdf`)
            } catch (err) {
              console.error('PDF error:', err)
              const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
              alert(`Erro ao gerar PDF: ${errorMessage}`)
            }
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? 'Gerando...' : 'Baixar PDF'}
        </Button>
        {getStatusBadge(loan.status)}
      </div>

      {/* Loan Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#22C55E]100 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#22C55E]600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Principal</p>
                <p className="text-xl font-bold">{formatCurrency(loan.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total com Juros</p>
                <p className="text-xl font-bold">{formatCurrency(loan.total_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Pago</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(loan.paid_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Restante</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(loan.remaining_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{loan.customer?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium">{loan.customer?.phone || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">E-mail</p>
              <p className="font-medium">{loan.customer?.email || "-"}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/customers/${loan.customer_id}`)}>
              Ver Cliente
            </Button>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Empréstimo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Taxa de Juros</p>
              <p className="font-medium">{loan.interest_rate}% ao mês</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Número de Parcelas</p>
              <p className="font-medium">{loan.installments}x</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Parcelas Pagas</p>
              <p className="font-medium">{loan.paid_installments}/{loan.installments}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Data de Criação</p>
              <p className="font-medium">{formatDate(loan.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-[#22C55E]600 bg-[#22C55E]200">
                    Progresso
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-[#22C55E]600">
                    {paidPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#22C55E]200">
                <div style={{ width: `${paidPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#22C55E]600 transition-all duration-500"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Valor por Parcela</p>
              <p className="text-2xl font-bold text-[#22C55E]600">
                {formatCurrency(loan.total_amount / loan.installments)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installments */}
      <Card>
        <CardHeader>
          <CardTitle>Parcelas</CardTitle>
          <CardDescription>Histórico de pagamentos das parcelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Original</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Juros Multa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Atual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(loan.installments_list || []).map((inst: LoanInstallment) => {
                    const lateFees = inst.late_fee_applied || 0
                    const lateInterest = inst.late_interest_applied || 0
                    const totalLate = lateFees + lateInterest
                    const originalValue = inst.amount - totalLate
                    
                    return (
                      <tr key={inst.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">#{inst.installment_number}</td>
                        <td className="px-4 py-3">{formatCurrency(originalValue)}</td>
                        <td className="px-4 py-3">
                          {totalLate > 0 ? (
                            <div className="text-red-600">
                              <span className="font-medium">+{formatCurrency(totalLate)}</span>
                              {inst.days_in_delay ? (
                                <span className="text-xs ml-1">({inst.days_in_delay}d)</span>
                              ) : null}
                              {lateFees > 0 && (
                                <div className="text-xs text-gray-500">
                                  Multa: {formatCurrency(lateFees)}
                                </div>
                              )}
                              {lateInterest > 0 && (
                                <div className="text-xs text-gray-500">
                                  Juros: {formatCurrency(lateInterest)}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(inst.amount)}</td>
                        <td className="px-4 py-3">{formatDate(inst.due_date)}</td>
                        <td className="px-4 py-3">{getInstallmentStatusBadge(inst.status)}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {inst.paid_date ? formatDate(inst.paid_date) : "-"}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
