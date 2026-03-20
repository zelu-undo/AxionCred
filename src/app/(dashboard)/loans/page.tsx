"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, DollarSign, Calendar, Loader2, CreditCard } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
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
    const statusConfig = {
      paid: { bg: "bg-gradient-to-r from-green-100 to-green-50", text: "text-green-700", icon: "✓" },
      active: { bg: "bg-gradient-to-r from-blue-100 to-blue-50", text: "text-blue-700", icon: "●" },
      pending: { bg: "bg-gradient-to-r from-yellow-100 to-yellow-50", text: "text-yellow-700", icon: "◐" },
      cancelled: { bg: "bg-gradient-to-r from-red-100 to-red-50", text: "text-red-700", icon: "✕" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const labels = {
      paid: t("loans.paidOut"),
      active: t("loans.active"),
      pending: t("loans.pending"),
      cancelled: t("loans.cancelled"),
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-3 py-1 text-xs font-semibold ${config.text}`}>
        <span className="text-[8px]">{config.icon}</span>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
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

      <Card className="hover:shadow-xl transition-all duration-300 border border-gray-100">
        <CardHeader className="pb-4 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#22C55E] transition-colors" />
              <Input
                placeholder={t("loans.searchLoans")}
                className="pl-9 bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all"
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
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("loans.customer")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("loans.principal")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("loans.installments")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("loans.paid")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("loans.remaining")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("common.status")}</th>
                        <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t("common.date")}</th>
                        <th className="px-5 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredLoans.map((loan: any, index: number) => (
                        <motion.tr 
                          key={loan.id} 
                          className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group cursor-pointer"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ scale: 1.005 }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#1E3A8A]/5 flex items-center justify-center text-[#1E3A8A] font-bold shadow-sm">
                                {loan.customer?.name?.charAt(0) || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{loan.customer?.name || "-"}</p>
                                <p className="text-sm text-gray-500">{loan.customer?.phone || "-"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-green-50">
                                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                              </div>
                              <span className="font-semibold text-gray-900">{formatCurrency(loan.principal_amount)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-blue-50">
                                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-700">{loan.paid_installments}/{loan.installments_count}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-green-600 font-bold">{formatCurrency(loan.paid_amount)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={Number(loan.remaining_amount) > 0 ? "text-orange-600 font-bold" : "text-gray-400 font-medium"}>
                              {formatCurrency(loan.remaining_amount)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {getStatusBadge(loan.status)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500 font-medium">
                              {formatDate(loan.created_at)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <DropdownMenu open={openDropdown === loan.id} onOpenChange={(open) => {
                              setOpenDropdown(open ? loan.id : null)
                            }}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-gray-100 h-8 w-8 rounded-lg">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                                <DropdownMenuItem onClick={() => handleViewDetails(loan.id)} className="hover:bg-gray-50 rounded-lg cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                  <span className="text-gray-700">{t("loans.viewDetails")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" onClick={() => handleDelete(loan.id)}>
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
              </div>
              
              {filteredLoans.length === 0 && (
                <EmptyState
                  icon={CreditCard}
                  title={t("loans.noLoansFound")}
                  description="Comece criando seu primeiro empréstimo para gerenciar seus clientes."
                  actionLabel="Criar Empréstimo"
                  onAction={() => router.push("/loans/new")}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
