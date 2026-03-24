"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, DollarSign, Calendar, CheckCircle, Clock, AlertCircle, 
  MoreVertical, Eye, Edit, RotateCcw, Plus, Filter, X,
  ArrowUpDown, ArrowUp, ArrowDown, CreditCard, FileText, User,
  Loader2, AlertTriangle, Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { useDebounce } from "@/hooks/use-debounce"

// Payment method type
type PaymentMethod = "cash" | "pix" | "transfer" | "card" | "boleto"
type InstallmentStatus = "paid" | "pending" | "late" | "partial"

interface PaymentRecord {
  id: string
  customer_name: string
  customer_document: string
  loan_id: string
  loan_contract_number: string
  installment_number: number
  installment_total: number
  amount_due: number
  amount_paid: number
  due_date: string
  paid_date: string | null
  status: InstallmentStatus
  payment_method: PaymentMethod | null
  notes: string | null
}

interface Installment {
  id: string
  installment_number: number
  amount: number
  paid_amount: number
  due_date: string
  paid_date: string | null
  status: InstallmentStatus
  notes?: string | null
  payment_method?: string | null
}

interface LoanDetails {
  id: string
  contract_number: string
  principal_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  installments_count: number
  paid_installments: number
  customer: {
    id: string
    name: string
    document: string
    phone: string
    email: string
  }
  installments: Installment[]
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function PaymentsPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [todayOnly, setTodayOnly] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"due_date" | "paid_date" | "amount">("due_date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const pageSize = 20
  
  // Debounce search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400)
  
  // Modal states
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isReverseOpen, setIsReverseOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<LoanDetails | null>(null)
  const [paymentToReverse, setPaymentToReverse] = useState<PaymentRecord | null>(null)
  
  // Payment form state - customer selection first
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedCustomerName, setSelectedCustomerName] = useState("")
  const [selectedLoanId, setSelectedLoanId] = useState("")
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("")
  const debouncedCustomerSearch = useDebounce(customerSearch, 400)
  
  // Fetch customers for payment
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.searchForPayment.useQuery({
    search: debouncedCustomerSearch || undefined,
  }, {
    enabled: isRegisterOpen,
  })
  
  // Type for loans from customer query (no customer nested)
interface LoanForPayment {
  id: string
  principal_amount: number
  total_amount: number
  paid_amount: number
  remaining_amount: number
  installments_count: number
  paid_installments: number
  status: string
  created_at: string
  customer_id: string
}


// Fetch loans when customer is selected
  const { data: loansData, isLoading: loadingLoans, error: loansError, refetch: refetchLoans } = trpc.customer.loansForPayment.useQuery<LoanForPayment[]>({
    customerId: selectedCustomerId,
  }, {
    enabled: !!selectedCustomerId,
    retry: 2,
    retryDelay: 1000,
  })

  // Refetch loans when customer changes
  useEffect(() => {
    if (selectedCustomerId && loansData === undefined && !loadingLoans) {
      refetchLoans()
    }
  }, [selectedCustomerId, loansData, loadingLoans, refetchLoans])

  // Fetch installments when loan is selected
  const { data: installmentsData, isLoading: loadingInstallments } = trpc.loan.installmentsForPayment.useQuery({
    loanId: selectedLoanId,
  }, {
    enabled: !!selectedLoanId,
  })












  
  // Helper to get current date in local timezone (YYYY-MM-DD)
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: getCurrentDate(),
    payment_method: "cash" as PaymentMethod,
    notes: "",
    payment_type: "full" as "full" | "interest_only",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch payments from API with server-side filters
  const { data: paymentsData, isLoading, refetch } = trpc.payment.list.useQuery({
    search: debouncedSearchQuery || undefined,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    todayOnly: todayOnly || undefined,
    overdueOnly: overdueOnly || undefined,
    sortBy,
    sortOrder,
    limit: pageSize,
    offset: page * pageSize,
  }, {
    // Refresh when filters change
    refetchOnMount: true,
  })
  
  // Register payment mutation
  const registerPaymentMutation = trpc.payment.register.useMutation({
    onSuccess: () => {
      showSuccessToast("Pagamento registrado com sucesso!")
      refetch()
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao registrar pagamento")
    },
  })
  
  // Reverse payment mutation
  const reversePaymentMutation = trpc.payment.reverse.useMutation({
    onSuccess: () => {
      showSuccessToast("Pagamento estornado com sucesso!")
      refetch()
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao estornar pagamento")
    },
  })
  
  const updatePaymentMutation = trpc.payment.update.useMutation({
    onSuccess: () => {
      showSuccessToast("Pagamento atualizado com sucesso!")
      refetch()
      setEditingPayment(null)
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao atualizar pagamento")
    },
  })
  
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null)
  const [editForm, setEditForm] = useState({
    amount: "",
    payment_date: "",
    payment_method: "cash" as PaymentMethod,
    notes: "",
  })
  
  // Initialize edit form when editingPayment changes
  useEffect(() => {
    if (editingPayment) {
      setEditForm({
        amount: editingPayment.amount_paid.toString(), // CurrencyInput expects cents
        payment_date: editingPayment.paid_date ? editingPayment.paid_date.split('T')[0] : "",
        payment_method: editingPayment.payment_method as PaymentMethod || "cash",
        notes: editingPayment.notes || "",
      })
    }
  }, [editingPayment])
  
  // Use real payments data from API (already filtered by server)
  const paginatedPayments: PaymentRecord[] = paymentsData?.payments?.map((p) => ({
    id: p.id,
    customer_name: p.customer_name,
    customer_document: p.customer_document,
    loan_id: p.loan_id,
    loan_contract_number: p.loan_id?.slice(0, 8) || "-",
    installment_number: p.installment_number,
    installment_total: p.installment_total,
    amount_due: p.amount_due,
    amount_paid: p.amount_paid,
    due_date: p.due_date,
    paid_date: p.paid_date,
    status: p.status,
    payment_method: p.payment_method as PaymentMethod | null,
    notes: p.notes,
  })) || []

  // Total from server (already filtered)
  const totalPages = Math.ceil((paymentsData?.total || 0) / pageSize)

  // Toggle sort
  const handleSort = (column: "due_date" | "paid_date" | "amount") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  // Get status badge
  const getStatusBadge = (status: InstallmentStatus) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700">
            <CheckCircle className="h-3 w-3" />
            Pago
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        )
      case "late":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700">
            <AlertCircle className="h-3 w-3" />
            Atrasado
          </span>
        )
      case "partial":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700">
            <CreditCard className="h-3 w-3" />
            Parcial
          </span>
        )
    }
  }

  // Get payment method label
  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    switch (method) {
      case "cash": return "Dinheiro"
      case "pix": return "PIX"
      case "transfer": return "Transferência"
      case "card": return "Cartão"
      case "boleto": return "Boleto"
      default: return "-"
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
    setTodayOnly(false)
    setOverdueOnly(false)
    setPage(0)
  }

  // Handle payment registration
  const handleRegisterPayment = async () => {
    if (!selectedCustomerId || !selectedLoanId || !selectedInstallmentId) {
      showErrorToast("Selecione o cliente, contrato e parcela")
      return
    }
    
    // CurrencyInput already returns value in cents
    const amount = parseInt(paymentForm.amount || "0", 10) / 100
    
    // Format payment date with time to avoid timezone issues
    const paymentDateWithTime = paymentForm.payment_date + "T12:00:00"
    if (isNaN(amount) || amount <= 0) {
      showErrorToast("Valor inválido")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await registerPaymentMutation.mutateAsync({
        installment_id: selectedInstallmentId,
        amount,
        payment_date: paymentDateWithTime,
        method: paymentForm.payment_method,
        notes: paymentForm.notes,
        payment_type: paymentForm.payment_type,
      })
      
      setIsRegisterOpen(false)
      setPaymentForm({
        amount: "",
        payment_date: getCurrentDate(),
        payment_method: "cash",
        notes: "",
        payment_type: "full",
      })
      setSelectedInstallmentId("")
      setSelectedLoanId("")
      setCustomerSearch("")
      setSelectedCustomerId("")
      setSelectedCustomerName("")
    } catch (error) {
      // Error is handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment reversal
  const handleReversePayment = async () => {
    if (!paymentToReverse) {
      showErrorToast("Selecione um pagamento para estornar")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await reversePaymentMutation.mutateAsync({
        transaction_id: paymentToReverse.id,
        reason: "Estorno solicitado pelo operador",
      })
      
      setIsReverseOpen(false)
      setPaymentToReverse(null)
    } catch (error) {
      // Error is handled by mutation onError
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if there are active filters
  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFrom || dateTo || todayOnly || overdueOnly

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#22C55E]" />
            Registro de Pagamentos
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os pagamentos de parcelas dos empréstimos</p>
        </div>
        <Button 
          onClick={() => setIsRegisterOpen(true)}
          className="bg-[#22C55E] hover:bg-[#16A34A] hover:shadow-xl hover:shadow-[#22C55E]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pagamento
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200/60 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-[#22C55E]">
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente, CPF ou contrato..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="pl-9"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
              >
                <option value="all">Todos os Status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="late">Atrasado</option>
                <option value="partial">Parcial</option>
              </select>
              
              {/* Date From */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="text-sm"
              />
              
              {/* Date To */}
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="text-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                variant={todayOnly ? "default" : "outline"}
                size="sm"
                onClick={() => { setTodayOnly(!todayOnly); setPage(0); }}
                className={todayOnly ? "bg-[#22C55E] hover:bg-[#16A34A]" : ""}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Hoje
              </Button>
              <Button
                variant={overdueOnly ? "default" : "outline"}
                size="sm"
                onClick={() => { setOverdueOnly(!overdueOnly); setPage(0); }}
                className={overdueOnly ? "bg-red-500 hover:bg-red-600" : "text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Atrasados
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payments List */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              // Loading skeleton
              <div className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort("due_date")}
                          className="flex items-center gap-1 hover:text-[#22C55E] transition-colors"
                        >
                          Vencimento
                          {sortBy === "due_date" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </button>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrato</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parcela</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort("amount")}
                          className="flex items-center gap-1 hover:text-[#22C55E] transition-colors"
                        >
                          Valor
                          {sortBy === "amount" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </button>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort("paid_date")}
                          className="flex items-center gap-1 hover:text-[#22C55E] transition-colors"
                        >
                          Pago em
                          {sortBy === "paid_date" ? (
                            sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </button>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {paginatedPayments.map((payment, index) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`hover:bg-gray-50/80 transition-colors ${payment.status === "late" ? "bg-red-50/30" : ""}`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{formatDate(payment.due_date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                payment.status === "late" ? "bg-red-400" :
                                payment.status === "paid" ? "bg-green-500" :
                                "bg-blue-500"
                              }`}>
                                {payment.customer_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{payment.customer_name}</p>
                                <p className="text-xs text-gray-500">{payment.customer_document}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600 font-mono text-sm">{payment.loan_contract_number}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-600">#{payment.installment_number}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{formatCurrency(payment.amount_paid)}</p>
                              {payment.status === "partial" && (
                                <p className="text-xs text-gray-500">de {formatCurrency(payment.installment_total)}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {payment.paid_date ? (
                              <span className="text-green-600 font-medium">{formatDate(payment.paid_date)}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-[#22C55E]/10 hover:text-[#22C55E]"
                                onClick={() => {
                                  setSelectedInstallment({
                                    id: payment.id,
                                    installment_number: payment.installment_number,
                                    amount: payment.amount_due,
                                    paid_amount: payment.amount_paid,
                                    due_date: payment.due_date,
                                    paid_date: payment.paid_date,
                                    status: payment.status,
                                    notes: payment.notes,
                                    payment_method: payment.payment_method,
                                  })
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingPayment(payment)
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {payment.status === "paid" && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setPaymentToReverse(payment)
                                        setIsReverseOpen(true)
                                      }}
                                      className="text-red-600"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Estornar
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Empty state */}
            {!isLoading && paginatedPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pagamento encontrado</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  {hasActiveFilters 
                    ? "Tente ajustar os filtros para encontrar o que procura."
                    : "Registre o primeiro pagamento do sistema."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Mostrando {page * pageSize + 1} - {Math.min((page + 1) * pageSize, paymentsData?.total || 0)} de {paymentsData?.total || 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Register Payment Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => {
        setIsRegisterOpen(open)
        if (!open) {
          // Reset form when modal closes
          setCustomerSearch("")
          setSelectedCustomerId("")
          setSelectedCustomerName("")
          setSelectedLoanId("")
          setSelectedInstallmentId("")
          setPaymentForm({
            amount: "",
            payment_date: getCurrentDate(),
            payment_method: "cash",
            notes: "",
            payment_type: "full",
          })
        }
      }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#22C55E]" />
              Registrar Pagamento
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do pagamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Step 1: Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente *</label>
              {!selectedCustomerId ? (
                <>
                  <Input
                    placeholder="Pesquisar por nome ou CPF..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full"
                  />
                  {customerSearch && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {loadingCustomers ? (
                        <div className="p-3 text-center text-gray-500">Carregando...</div>
                      ) : customersData && customersData.length > 0 ? (
                        customersData.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(customer.id)
                              setSelectedCustomerName(customer.name || 'Cliente')
                              // Keep only the name for search to avoid issues
                              setCustomerSearch(customer.name || '')
                              setSelectedLoanId("")
                              setSelectedInstallmentId("")
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm">
                              {customer.name || 'Cliente'}
                            </div>
                            <div className="text-sm text-gray-600">
                              CPF: {customer.document || '-'}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">Nenhum cliente encontrado</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="flex-1 text-sm font-medium">{selectedCustomerName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId("")
                      setSelectedCustomerName("")
                      setCustomerSearch("")
                      setSelectedLoanId("")
                      setSelectedInstallmentId("")
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Alterar
                  </button>
                </div>
              )}
            </div>
            
            {/* Step 2: Loan Selection - Show after customer is selected */}
            {selectedCustomerId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Contrato *</label>
                {selectedLoanId && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">Contrato #{selectedLoanId.slice(0,8)}</div>
                      {loansData?.find(l => l.id === selectedLoanId) && (
                        <div className="text-xs text-gray-500">
                          R$ {loansData.find(l => l.id === selectedLoanId)?.remaining_amount?.toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLoanId("")
                        setSelectedInstallmentId("")
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Alterar
                    </button>
                  </div>
                )}
                
                {!selectedLoanId && (
                  <>
                    {loadingLoans ? (
                  <div className="text-gray-500 text-sm">Carregando contratos...</div>
                ) : loansError ? (
                  <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg">
                    Erro ao carregar contratos: {loansError.message}
                    <button 
                      onClick={() => refetchLoans()} 
                      className="ml-2 text-blue-500 underline"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : loansData && loansData.length > 0 ? (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {loansData.map((loan) => (
                      <button
                        key={loan.id}
                        type="button"
                        onClick={() => {
                          setSelectedLoanId(loan.id)
                          setSelectedInstallmentId("")
                        }}
                        className={`w-full text-left p-3 border-b last:border-b-0 transition-colors ${
                          selectedLoanId === loan.id 
                            ? "bg-blue-50 border-l-4 border-l-blue-500" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-sm flex justify-between items-center">
                          <span>Contrato #{loan.id.slice(0,8)}</span>
                          {selectedLoanId === loan.id && (
                            <span className="text-blue-600 text-xs">✓ Selecionado</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          R$ {loan.remaining_amount?.toLocaleString('pt-BR')} | {loan.paid_installments}/{loan.installments_count} parcelas | Status: {loan.status}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded-lg">
                    Nenhum contrato ativo encontrado para este cliente
                    <button 
                      onClick={() => refetchLoans()} 
                      className="ml-2 text-blue-500 underline"
                    >
                      Atualizar
                    </button>
                  </div>
                )}
                  </>
                )}
              </div>
            )}
            
            {/* Step 3: Installment Selection - Show only after loan is selected */}
            {selectedLoanId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Parcela *</label>
                {loadingInstallments ? (
                  <div className="text-gray-500 text-sm">Carregando parcelas...</div>
                ) : installmentsData && installmentsData.length > 0 ? (
                  <select
                    value={selectedInstallmentId}
                    onChange={(e) => {
                      setSelectedInstallmentId(e.target.value)
                      const inst = installmentsData.find(i => i.id === e.target.value)
                      if (inst) {
                        // CurrencyInput expects value in cents, so multiply by 100
                        const remainingAmount = ((inst.amount || 0) - (inst.paid_amount || 0))
                        setPaymentForm({ 
                          ...paymentForm, 
                          amount: (remainingAmount * 100).toString() 
                        })
                      }
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
                  >
                    <option value="">Selecione a parcela...</option>
                    {installmentsData.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        Parcela {inst.installment_number} - R$ {((inst.amount || 0) - (inst.paid_amount || 0)).toLocaleString('pt-BR')} - Venc: {new Date(inst.due_date).toLocaleDateString('pt-BR')} [{inst.status}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-500 text-sm">Todas as parcelas foram pagas</div>
                )}
              </div>
            )}
            
            {/* Step 4: Payment Amount - Show after installment is selected */}
            {selectedInstallmentId && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Pago *</label>
                  <div className="relative">
                    <CurrencyInput
                      placeholder="0,00"
                      value={paymentForm.amount}
                      onChange={(value) => setPaymentForm({ ...paymentForm, amount: value })}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Valor remaining: R$ {installmentsData?.find(i => i.id === selectedInstallmentId) ? 
                      ((installmentsData.find(i => i.id === selectedInstallmentId)?.amount || 0) - (installmentsData.find(i => i.id === selectedInstallmentId)?.paid_amount || 0)).toLocaleString('pt-BR') 
                      : '0'}
                  </p>
                </div>
                
                {/* Payment Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, payment_type: "full" })}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        paymentForm.payment_type === "full"
                          ? "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      💰 Pagamento Integral
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Calcular valor de juros (5% da parcela)
                        const inst = installmentsData?.find(i => i.id === selectedInstallmentId)
                        const interestAmount = inst ? (inst.amount * 0.05 * 100) : 0
                        setPaymentForm({ 
                          ...paymentForm, 
                          payment_type: "interest_only",
                          amount: interestAmount.toString()
                        })
                      }}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        paymentForm.payment_type === "interest_only"
                          ? "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      📈 Apenas Juros
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    "Apenas Juros" paga apenas os juros da parcela (5%), sem abatimento do principal.
                  </p>
                </div>
                
                {/* Payment Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data do Pagamento *</label>
                  <Input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  />
                </div>
                
                {/* Payment Method - Only show after amount and date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pagamento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["cash", "pix", "transfer", "card", "boleto"] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, payment_method: method })}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          paymentForm.payment_method === method
                            ? "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {method === "cash" && "💵 Dinheiro"}
                        {method === "pix" && "⚡ PIX"}
                        {method === "transfer" && "🏦 Transfer"}
                        {method === "card" && "💳 Cartão"}
                        {method === "boleto" && "📄 Boleto"}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Notes - Only show after payment method */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Observações</label>
                    <span className={`text-xs ${paymentForm.notes?.length > 150 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {paymentForm.notes?.length || 0}/150
                    </span>
                  </div>
                  <textarea
                    value={paymentForm.notes?.slice(0, 150) || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value.slice(0, 150) })}
                    placeholder="Observações opcionais..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E] resize-none"
                  />
                  {paymentForm.notes?.length > 150 && (
                    <p className="text-xs text-red-500">Limite máximo de 150 caracteres excedido</p>
                  )}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRegisterPayment}
              disabled={isSubmitting || !selectedCustomerId || !selectedLoanId || !selectedInstallmentId || !paymentForm.amount}
              className="bg-[#22C55E] hover:bg-[#16A34A]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#22C55E]" />
              Detalhes do Pagamento
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstallment && (
            <div className="space-y-6 py-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${
                selectedInstallment.status === "paid" ? "bg-green-50 border-green-200" :
                selectedInstallment.status === "late" ? "bg-red-50 border-red-200" :
                selectedInstallment.status === "partial" ? "bg-blue-50 border-blue-200" :
                "bg-amber-50 border-amber-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedInstallment.status === "paid" && "Pagamento Concluído"}
                      {selectedInstallment.status === "late" && "Pagamento Atrasado"}
                      {selectedInstallment.status === "partial" && "Pagamento Parcial"}
                      {selectedInstallment.status === "pending" && "Aguardando Pagamento"}
                    </p>
                    <p className="text-sm text-gray-600">Parcela #{selectedInstallment.installment_number}</p>
                  </div>
                  {getStatusBadge(selectedInstallment.status)}
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Valor da Parcela</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedInstallment.amount)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Valor Pago</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedInstallment.paid_amount)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Data de Vencimento</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedInstallment.due_date)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Data de Pagamento</p>
                  <p className="font-semibold text-gray-900">
                    {selectedInstallment.paid_date ? formatDate(selectedInstallment.paid_date) : "-"}
                  </p>
                </div>
              </div>
              
              {/* Payment Method & Notes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Método de Pagamento</p>
                    <p className="font-medium text-gray-900">
                      {selectedInstallment.payment_method === "pix" && "PIX"}
                      {selectedInstallment.payment_method === "cash" && "Dinheiro"}
                      {selectedInstallment.payment_method === "card" && "Cartão"}
                      {selectedInstallment.payment_method === "boleto" && "Boleto"}
                      {selectedInstallment.payment_method === "transfer" && "Transferência"}
                      {!selectedInstallment.payment_method && "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="font-medium text-gray-900">{selectedInstallment.notes || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedInstallment?.status !== "paid" && (
              <Button 
                onClick={() => {
                  setIsDetailsOpen(false)
                  setIsRegisterOpen(true)
                }}
                className="bg-[#22C55E] hover:bg-[#16A34A]"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Registrar Pagamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse Payment Confirmation Modal */}
      <Dialog open={isReverseOpen} onOpenChange={setIsReverseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Estorno
            </DialogTitle>
          </DialogHeader>
          
          {paymentToReverse && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <p className="text-sm text-red-600 mb-2">Atenção: Esta ação não pode ser desfeita!</p>
                <p className="text-gray-700">
                  Você está prestes a estornar o pagamento de <strong>{formatCurrency(paymentToReverse.amount_paid)}</strong> 
                  {' '}de {paymentToReverse.customer_name}.
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium">Motivo do Estorno</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
                  <option value="">Selecione o motivo...</option>
                  <option value="duplicate">Pagamento Duplicado</option>
                  <option value="error">Erro no Valor</option>
                  <option value="chargeback">Chargeback</option>
                  <option value="other">Outro Motivo</option>
                </select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReverseOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReversePayment}
              disabled={isSubmitting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Confirmar Estorno
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editingPayment} onOpenChange={(open) => {
            if (!open) setEditingPayment(null)
          }}>
            <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-[#22C55E]" />
                  Editar Pagamento
                </DialogTitle>
                <DialogDescription>
                  Atualize os dados do pagamento
                </DialogDescription>
              </DialogHeader>
              
              {editingPayment && (
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-sm text-gray-500">Parcela</p>
                    <p className="font-semibold">
                      {editingPayment.installment_number} de {editingPayment.installment_total}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Valor da Parcela</p>
                      <p className="font-bold text-gray-900">{formatCurrency(editingPayment.amount_due)}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Valor Pago</p>
                      <p className="font-bold text-green-600">{formatCurrency(editingPayment.amount_paid)}</p>
                    </div>
                  </div>
                  
                  {/* Edit Form */}
                  <div className="space-y-3 border-t pt-4">
                    <div>
                      <label className="text-sm font-medium">Valor Pago *</label>
                      <CurrencyInput
                        value={editForm.amount}
                        onChange={(val) => setEditForm({ ...editForm, amount: val })}
                        placeholder="Digite o valor"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Data do Pagamento *</label>
                      <Input
                        type="date"
                        value={editForm.payment_date}
                        onChange={(e) => setEditForm({ ...editForm, payment_date: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Método de Pagamento</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {(["cash", "pix", "transfer", "card", "boleto"] as PaymentMethod[]).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setEditForm({ ...editForm, payment_method: method })}
                            className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                              editForm.payment_method === method
                                ? "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            {method === "cash" && "💵"}
                            {method === "pix" && "⚡"}
                            {method === "transfer" && "🏦"}
                            {method === "card" && "💳"}
                            {method === "boleto" && "📄"}
                            <span className="ml-1">{method}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Input
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="Observações (opcional)"
                        maxLength={150}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPayment(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    if (!editForm.amount || !editForm.payment_date) {
                      showErrorToast("Preencha o valor e a data")
                      return
                    }
                    // CurrencyInput already sends cents, pass directly
                    updatePaymentMutation.mutate({
                      installment_id: editingPayment!.id,
                      amount: parseInt(editForm.amount, 10),
                      payment_date: editForm.payment_date,
                      method: editForm.payment_method,
                      notes: editForm.notes,
                    })
                  }}
                  disabled={updatePaymentMutation.isPending}
                >
                  {updatePaymentMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </motion.div>
  )
}
