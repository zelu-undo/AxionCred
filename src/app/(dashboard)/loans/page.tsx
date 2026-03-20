"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, DollarSign, Calendar, Loader2, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { useRouter } from "next/navigation"

export default function LoansPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  // Estados para busca e filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [minAmount, setMinAmount] = useState<string>("")
  const [maxAmount, setMaxAmount] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  const LIMIT = 20
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter, minAmount, maxAmount, startDate, endDate])
  
  const { data: loansData, isLoading, refetch } = trpc.loan.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter as "pending" | "active" | "paid" | "cancelled" | "renegotiated" | undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: LIMIT,
    offset: currentPage * LIMIT,
  })

  const deleteMutation = trpc.loan.cancel.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const loans = loansData?.loans || []
  const total = loansData?.total || 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">{t("loans.paidOut")}</span>
      case "active":
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{t("loans.active")}</span>
      case "pending":
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">{t("loans.pending")}</span>
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">{t("loans.cancelled")}</span>
      default:
        return null
    }
  }

  const handleViewDetails = (loanId: string) => {
    router.push(`/loans/${loanId}`)
  }

  const handleDelete = (loanId: string) => {
    if (confirm("Tem certeza que deseja cancelar este empréstimo?")) {
      deleteMutation.mutate({ id: loanId })
    }
    setOpenDropdown(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.title")}</h1>
          <p className="text-gray-500">{t("loans.subtitle")}</p>
        </div>
        <Button onClick={() => router.push("/loans/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("loans.newLoan")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou contrato..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(statusFilter || minAmount || maxAmount || startDate || endDate) && (
                    <span className="ml-1 bg-[#22C55E] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {[statusFilter, minAmount, maxAmount, startDate, endDate].filter(Boolean).length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {/* Status Filter */}
                <div className="p-2 border-b">
                  <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: undefined, label: "Todos" },
                      { value: "pending", label: "Pendente" },
                      { value: "active", label: "Ativo" },
                      { value: "paid", label: "Pago" },
                      { value: "cancelled", label: "Cancelado" },
                    ].map((option) => (
                      <button
                        key={option.value ?? "all"}
                        onClick={() => setStatusFilter(option.value)}
                        className={`px-2 py-1 text-xs rounded ${
                          statusFilter === option.value
                            ? "bg-[#22C55E] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Valor */}
                <div className="p-2 border-b">
                  <p className="text-xs font-medium text-gray-500 mb-2">Valor (R$)</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Mín"
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Máx"
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                
                {/* Data */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Data de Criação</p>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="De"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Até"
                    />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {(statusFilter || minAmount || maxAmount || startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setStatusFilter(undefined)
                  setMinAmount("")
                  setMaxAmount("")
                  setStartDate("")
                  setEndDate("")
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]600" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.customer")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.principal")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.installments")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.paid")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.remaining")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("common.status")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("common.date")}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loans.map((loan: any) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{loan.customer?.name || "-"}</p>
                          <p className="text-sm text-gray-500">{loan.customer?.phone || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{loan.paid_installments}/{loan.installments_count}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-medium">{formatCurrency(loan.paid_amount)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={Number(loan.remaining_amount) > 0 ? "text-orange-600 font-medium" : ""}>
                            {formatCurrency(loan.remaining_amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(loan.status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(loan.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu open={openDropdown === loan.id} onOpenChange={(open) => {
                            setOpenDropdown(open ? loan.id : null)
                          }}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(loan.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("loans.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(loan.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {loans.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  {t("loans.noLoansFound")}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Total de {total} empréstimos
                </div>
                {total > LIMIT && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage + 1} de {Math.ceil(total / LIMIT)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={(currentPage + 1) * LIMIT >= total}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
