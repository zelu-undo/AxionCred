"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calculator, CheckCircle, Loader2, Search, DollarSign, Calendar, AlertCircle, Info } from "lucide-react"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { motion, AnimatePresence } from "framer-motion"

interface InstallmentPreview {
  number: number
  amount: number
  dueDate: string
}

export default function NewLoanPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  // Get customers with search
  const [customerSearch, setCustomerSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.list.useQuery({ 
    limit: 100,
    search: customerSearch || undefined
  }, {
    enabled: customerSearch.length > 0 // Only fetch when searching
  })
  const customers = customersData?.customers || []

  const createMutation = trpc.loan.create.useMutation({
    onSuccess: () => {
      setIsSuccess(true)
      setTimeout(() => {
        router.push("/loans")
      }, 2000)
    },
    onError: (error) => {
      alert(error.message)
      setIsSubmitting(false)
    }
  })

  const [formData, setFormData] = useState({
    customerId: "",
    principal: "",
    installments: "6",
    firstPaymentDate: new Date().toISOString().split("T")[0],
  })
  
  const [preview, setPreview] = useState<{
    monthlyPayment: number
    totalInterest: number
    totalAmount: number
    installments: InstallmentPreview[]
  } | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Calculate loan preview using business rules
  const { data: businessRulesData } = trpc.businessRules.get.useQuery()

  const calculateLoan = () => {
    // Parse principal - Brazilian format: 1.234,56 = 1234.56
    const principalStr = formData.principal.replace(/[^0-9]/g, "")
    const principal = principalStr.length > 2 
      ? parseFloat(principalStr.slice(0, -2) + "." + principalStr.slice(-2))
      : parseFloat(principalStr) / 100
    
    const numInstallments = parseInt(formData.installments)
    
    if (!principal || !numInstallments) return

    // Get interest rate and type from business rules
    const rules = businessRulesData?.interestRules || []
    const rule = rules.find(
      (rule: any) => numInstallments >= rule.min_installments && numInstallments <= rule.max_installments
    )
    
    const interestRate = rule?.interest_rate || 0
    const interestType = rule?.interest_type || 'monthly'
    
    let monthlyPayment: number
    let totalAmount: number
    let totalInterest: number
    
    // Debug log
    console.log("Calculation:", { principal, numInstallments, interestRate, interestType })
    
    if (interestRate === 0 || interestType === 'fixed') {
      // Sem juros ou juros fixos
      if (interestType === 'fixed') {
        // Juros fixos: taxa aplicada uma única vez sobre o principal
        totalInterest = principal * (interestRate / 100)
        totalAmount = principal + totalInterest
      } else {
        // Sem juros
        totalAmount = principal
        totalInterest = 0
      }
      monthlyPayment = totalAmount / numInstallments
    } else if (interestType === 'weekly') {
      // Juros semanal (sistema Price)
      const weeklyRate = interestRate / 100 / 4.33 // ~52 semanas/ano
      const totalWeeks = numInstallments * 4
      const factor = Math.pow(1 + weeklyRate, totalWeeks)
      totalAmount = (principal * weeklyRate * factor) / (factor - 1)
      monthlyPayment = totalAmount / numInstallments
      totalInterest = totalAmount - principal
    } else {
      // monthly: sistema Price com taxa mensal
      const monthlyRate = interestRate / 100
      const factor = Math.pow(1 + monthlyRate, numInstallments)
      totalAmount = (principal * monthlyRate * factor) / (factor - 1)
      monthlyPayment = totalAmount / numInstallments
      totalInterest = totalAmount - principal
    }
    
    // Generate installment dates
    const firstDate = new Date(formData.firstPaymentDate)
    const installments: InstallmentPreview[] = []
    
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(firstDate)
      dueDate.setMonth(dueDate.getMonth() + i + 1)
      installments.push({
        number: i + 1,
        amount: monthlyPayment,
        dueDate: dueDate.toISOString().split("T")[0],
      })
    }
    
    setPreview({
      monthlyPayment,
      totalInterest,
      totalAmount,
      installments,
    })
  }

  useEffect(() => {
    if (formData.principal && formData.installments && businessRulesData) {
      calculateLoan()
    }
  }, [formData.principal, formData.installments, formData.firstPaymentDate, businessRulesData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Parse principal - Brazilian format
    const principalStr = formData.principal.replace(/[^0-9]/g, "")
    const principal = principalStr.length > 2 
      ? parseFloat(principalStr.slice(0, -2) + "." + principalStr.slice(-2))
      : parseFloat(principalStr) / 100
    
    createMutation.mutate({
      customer_id: formData.customerId,
      principal_amount: principal,
      installments_count: parseInt(formData.installments),
      first_due_date: formData.firstPaymentDate,
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  }

  // Get current interest rate and type for display
  const currentInterestRate = useMemo(() => {
    const numInstallments = parseInt(formData.installments)
    if (!businessRulesData?.interestRules) return { rate: 0, type: 'monthly' }
    const rule = businessRulesData.interestRules.find(
      r => numInstallments >= r.min_installments && numInstallments <= r.max_installments
    )
    return { 
      rate: rule?.interest_rate || 0, 
      type: rule?.interest_type || 'monthly' 
    }
  }, [formData.installments, businessRulesData])

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="w-full max-w-md border-2 border-green-200 shadow-xl shadow-green-100">
          <CardContent className="pt-8 pb-8 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-lg"
            >
              <CheckCircle className="h-10 w-10 text-green-600" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              Empréstimo Criado!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500"
            >
              O empréstimo foi criado com sucesso.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-sm text-green-600"
            >
              Redirecionando para lista de empréstimos...
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="hover:bg-gray-100 hover:scale-105 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.newLoan")}</h1>
          <p className="text-gray-500">Crie um novo empréstimo com cálculo automático</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-gray-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#22C55E]/10">
                <DollarSign className="h-5 w-5 text-[#22C55E]" />
              </div>
              Dados do Empréstimo
            </CardTitle>
            <CardDescription>Preencha os dados do empréstimo</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Searchable Customer Select */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Cliente *</Label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#22C55E] transition-colors" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="pl-9 bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all"
                  />
                </div>
                {/* Show dropdown only when focused and has results */}
                <AnimatePresence>
                  {showDropdown && customerSearch && customers.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border rounded-xl max-h-56 overflow-y-auto absolute z-20 bg-white w-full shadow-xl"
                    >
                      {loadingCustomers ? (
                        <div className="p-4 text-center text-gray-500">
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                          Carregando...
                        </div>
                      ) : (
                        customers.map((customer: any) => (
                          <motion.div
                            key={customer.id}
                            whileHover={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                            className={`p-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                              formData.customerId === customer.id ? "bg-[#22C55E]/5" : ""
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, customerId: customer.id })
                              setCustomerSearch(customer.name)
                              setShowDropdown(false)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#1E3A8A]/5 flex items-center justify-center text-[#1E3A8A] font-bold">
                                {customer.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{customer.name}</div>
                                <div className="text-sm text-gray-500">{customer.document || "Sem CPF"}</div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {formData.customerId && !showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Cliente selecionado
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customerId: "" })
                        setCustomerSearch("")
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      (Alterar)
                    </button>
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Valor Principal (R$) *</Label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    R$
                  </div>
                  <Input
                    type="text"
                    placeholder="0,00"
                    value={formData.principal}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "")
                      const formatted = value ? (parseInt(value) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) : ""
                      setFormData({ ...formData, principal: formatted })
                    }}
                    className="pl-10 bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all text-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Número de Parcelas</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      value={formData.installments}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1
                        setFormData({ ...formData, installments: String(value) })
                      }}
                      onBlur={() => {
                        // Auto-adjust to nearest valid range
                        const rules = businessRulesData?.interestRules || []
                        const num = parseInt(formData.installments)
                        
                        if (rules.length > 0) {
                          // Find ranges and adjust to nearest valid
                          const ranges = rules.map((r: any) => ({
                            min: r.min_installments,
                            max: r.max_installments
                          }))
                          
                          // Check if within any range
                          const inRange = ranges.some(r => num >= r.min && num <= r.max)
                          
                          if (!inRange) {
                            // Find nearest range
                            let nearestMax = ranges[0].max
                            let minDiff = Math.abs(num - ranges[0].max)
                            
                            for (const r of ranges) {
                              const diff = Math.abs(num - r.max)
                              if (diff < minDiff) {
                                minDiff = diff
                                nearestMax = r.max
                              }
                            }
                            setFormData({ ...formData, installments: String(nearestMax) })
                          }
                        } else if (num > 12) {
                          // No rules, use default max of 12
                          setFormData({ ...formData, installments: "12" })
                        }
                      }}
                      className="bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      x
                    </div>
                  </div>
                  {/* Show available ranges */}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {businessRulesData?.interestRules?.length ? (
                      <>Faixas: {businessRulesData.interestRules.map((r: any) => `${r.min_installments}-${r.max_installments}x`).join(", ")}</>
                    ) : (
                      "Máximo: 12x"
                    )}
                  </p>
                  {currentInterestRate.rate > 0 && (
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Taxa: {currentInterestRate.rate}% {currentInterestRate.type === 'fixed' ? '(fixo)' : currentInterestRate.type === 'weekly' ? 'semanal' : 'ao mês'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Data da 1ª Parcela</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={formData.firstPaymentDate}
                      onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                      className="bg-gray-50/50 border-gray-100 focus:bg-white focus:border-[#22C55E] focus:ring-[#22C55E]/20 transition-all"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-[#22C55E] hover:bg-[#4ADE80] h-12 text-base font-semibold shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 transition-all"
                  disabled={isSubmitting || !formData.customerId || !formData.principal}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando Empréstimo...
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-5 w-5" />
                      Criar Empréstimo
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-gray-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              Simulação
            </CardTitle>
            <CardDescription>Visualize o valor das parcelas</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {preview ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-3 gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <p className="text-xs text-gray-500 font-medium">Principal</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100)}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100 shadow-sm"
                  >
                    <p className="text-xs text-orange-600 font-medium">Total Juros</p>
                    <p className="text-sm font-bold text-orange-600 mt-1">{formatCurrency(preview.totalInterest)}</p>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 shadow-sm"
                  >
                    <p className="text-xs text-green-600 font-medium">Total a Pagar</p>
                    <p className="text-sm font-bold text-green-600 mt-1">{formatCurrency(preview.totalAmount)}</p>
                  </motion.div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#22C55E]" />
                    Parcelas ({formData.installments}x)
                  </h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {preview.installments.map((inst) => (
                      <motion.div 
                        key={inst.number}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: inst.number * 0.02 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-[#22C55E]/30 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] font-bold text-sm">
                            {inst.number}
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{formatDate(inst.dueDate)}</span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(inst.amount)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Preencha os dados para ver a simulação</p>
                <p className="text-gray-400 text-sm mt-1">O valor das parcelas será calculado automaticamente</p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
