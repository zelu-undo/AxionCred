"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
import { motion } from "framer-motion"

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
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">{t("loans.paidOut")}</span>
      case "active":
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">{t("loans.active")}</span>
      case "pending":
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">{t("loans.pending")}</span>
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{t("loans.cancelled")}</span>
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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.title")}</h1>
          <p className="text-gray-500 mt-1">{t("loans.subtitle")}</p>
        </div>
        <Button onClick={() => router.push("/loans/new")} className="bg-[#22C55E] hover:bg-[#4ADE80] transition-colors">
          <Plus className="mr-2 h-4 w-4" />
          {t("loans.newLoan")}
        </Button>
      </div>

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4">
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
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("loans.customer")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("loans.principal")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("loans.installments")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("loans.paid")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("loans.remaining")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("common.date")}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLoans.map((loan: any, index: number) => (
                      <motion.tr 
                        key={loan.id} 
                        className="hover:bg-gray-50/80 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{loan.customer?.name || "-"}</p>
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
                          <span className={Number(loan.remaining_amount) > 0 ? "text-orange-600 font-medium" : "text-gray-400"}>
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
                              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleViewDetails(loan.id)} className="hover:bg-gray-50">
                                <Eye className="mr-2 h-4 w-4" />
                                {t("loans.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(loan.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredLoans.length === 0 && (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">{t("loans.noLoansFound")}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
