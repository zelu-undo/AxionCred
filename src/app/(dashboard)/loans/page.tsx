"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, DollarSign, Calendar, Loader2, Wallet, CreditCard } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
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
import { motion, AnimatePresence } from "framer-motion"

export default function LoansPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  // Debounce search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  
  const { data: loansData, isLoading, refetch } = trpc.loan.list.useQuery({
    limit: 100,
    search: debouncedSearchQuery || undefined,
  }, {
    // Only fetch when we have search or on initial load
    enabled: true,
  })

  const deleteMutation = trpc.loan.cancel.useMutation({
    onSuccess: () => {
      refetch()
    },
  })

  // Server-side filtering via tRPC - use debounced query directly
  const loans = loansData?.loans || []
  
  // Note: Search is already handled server-side via debouncedSearchQuery
  // No client-side filtering needed - data comes pre-filtered from API
  const displayLoans = loans

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { 
        bg: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200", 
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: t("loans.paidOut")
      },
      active: { 
        bg: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200", 
        text: "text-blue-700",
        dot: "bg-blue-500",
        label: t("loans.active")
      },
      pending: { 
        bg: "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200", 
        text: "text-amber-700",
        dot: "bg-amber-500",
        label: t("loans.pending")
      },
      cancelled: { 
        bg: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200", 
        text: "text-red-700",
        dot: "bg-red-500",
        label: t("loans.cancelled")
      },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    
    return (
      <span className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
        text-xs font-medium border
        ${config.bg} ${config.text}
      `}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.title")}</h1>
          <p className="text-gray-500 mt-1">{t("loans.subtitle")}</p>
        </div>
        <Button 
          onClick={() => router.push("/loans/new")} 
          className="
            bg-[#22C55E] hover:bg-[#4ADE80] 
            shadow-lg shadow-emerald-500/25
            hover:shadow-emerald-500/40
            transition-all duration-300 hover:scale-[1.02]
            active:scale-[0.98]
          "
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("loans.newLoan")}
        </Button>
      </div>

      <Card className="
        border-gray-200/60 
        shadow-sm hover:shadow-md 
        transition-all duration-300
      ">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder={t("loans.searchLoans")}
                className="
                  pl-9 bg-gray-50/50 border-gray-200/60
                  focus:bg-white focus:border-emerald-400 focus:ring-emerald-500/20
                  transition-all duration-200
                "
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-0">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="
                      bg-gradient-to-r from-gray-50 to-white
                      border-b border-gray-100
                    ">
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5" />
                          {t("loans.customer")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5" />
                          {t("loans.principal")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {t("loans.installments")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("loans.paid")}</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("loans.remaining")}</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.status")}</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.date")}</th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {displayLoans.map((loan: any, index: number) => (
                        <motion.tr 
                          key={loan.id} 
                          className="
                            hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-transparent
                            transition-all duration-200
                            group
                          "
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.3 }}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="
                                h-10 w-10 rounded-full 
                                bg-gradient-to-br from-gray-100 to-gray-200
                                flex items-center justify-center
                                text-gray-600 font-semibold
                                ring-2 ring-white shadow-sm
                                group-hover:ring-emerald-100 group-hover:scale-105
                                transition-all duration-200
                              ">
                                {loan.customer?.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{loan.customer?.name || "-"}</p>
                                <p className="text-sm text-gray-500">{loan.customer?.phone || "-"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(loan.principal_amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {loan.paid_installments}/{loan.installments_count}
                              </span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${(loan.paid_installments / loan.installments_count) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-emerald-600 font-semibold">{formatCurrency(loan.paid_amount)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={Number(loan.remaining_amount) > 0 ? "text-amber-600 font-medium" : "text-gray-400"}>
                              {formatCurrency(loan.remaining_amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(loan.status)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {formatDate(loan.created_at)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu open={openDropdown === loan.id} onOpenChange={(open) => {
                              setOpenDropdown(open ? loan.id : null)
                            }}>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="
                                    hover:bg-gray-100 
                                    opacity-0 group-hover:opacity-100
                                    transition-all duration-200
                                  "
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-44 p-1.5 border-gray-100 shadow-lg shadow-gray-200/50"
                              >
                                <DropdownMenuItem 
                                  onClick={() => handleViewDetails(loan.id)} 
                                  className="
                                    hover:bg-gray-50 rounded-md px-3 py-2 
                                    cursor-pointer transition-colors
                                  "
                                >
                                  <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{t("loans.viewDetails")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="
                                    text-red-600 hover:bg-red-50 rounded-md px-3 py-2 
                                    cursor-pointer transition-colors
                                  " 
                                  onClick={() => handleDelete(loan.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span className="text-sm">{t("common.delete")}</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {displayLoans.length === 0 && (
                <div className="py-16 text-center">
                  <div className="
                    inline-flex items-center justify-center w-20 h-20 
                    rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200
                    mb-4 shadow-inner
                  ">
                    <DollarSign className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">{t("loans.noLoansFound")}</p>
                  <p className="text-gray-400 text-sm mt-1">Comece criando um novo empréstimo</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
