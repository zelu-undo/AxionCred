"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, DollarSign, Calendar, Loader2 } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  const { data: loansData, isLoading, refetch } = trpc.loan.list.useQuery({
    limit: 100,
  })

  const deleteMutation = trpc.loan.cancel.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  const loans = loansData?.loans || []
  
  const filteredLoans = loans.filter((loan: any) => {
    const customerName = loan.customer?.name?.toLowerCase() || ""
    return customerName.includes(searchQuery.toLowerCase())
  })

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
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("loans.searchLoans")}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                    {filteredLoans.map((loan: any) => (
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
              
              {filteredLoans.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  {t("loans.noLoansFound")}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
