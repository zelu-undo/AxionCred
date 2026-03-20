"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calculator, CheckCircle, Loader2, Search, UserX } from "lucide-react"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface InstallmentPreview {
  number: number
  amount: number
  dueDate: string
}

export default function NewLoanPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  // Get customers with search - optimized with debounce
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  
  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Minimum 2 characters to trigger search
  const MIN_SEARCH_CHARS = 2
  const MAX_RESULTS = 10
  
  // Fetch customers with optimizations
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.list.useQuery({ 
    limit: MAX_RESULTS,
    search: debouncedSearch.length >= MIN_SEARCH_CHARS ? debouncedSearch : undefined
  }, {
    enabled: debouncedSearch.length >= MIN_SEARCH_CHARS,
    staleTime: 5 * 60 * 1000, // Cache results for 5 minutes
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
  const [adjustedInstallments, setAdjustedInstallments] = useState<number | null>(null)

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
    
    // Find the rule that matches the number of installments
    const rule = rules.find(
      (rule: any) => 
        numInstallments >= (rule.min_installments || 0) && 
        numInstallments <= (rule.max_installments || 999)
    )
    
    // Don't use default - require explicit rule configuration
    if (!rule) {
      console.log("No matching interest rule found for", numInstallments, "installments")
      setPreview(null)
      setAdjustedInstallments(null)
      return
    }
    
    // Clear adjustment message if rule exists
    setAdjustedInstallments(null)
    
    const interestRate = rule.interest_rate
    const interestType = rule.interest_type
    
    let monthlyPayment: number
    let totalAmount: number
    let totalInterest: number
    
    // Calculate using Price system (French Amortization)
    // PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    if (interestType === 'fixed') {
      // Fixed interest: simple calculation
      // Interest applied once on principal
      totalInterest = principal * (interestRate / 100)
      totalAmount = principal + totalInterest
      monthlyPayment = totalAmount / numInstallments
    } else if (interestType === 'weekly') {
      // Weekly interest rate - convert to monthly using compound interest
      // Formula: monthlyRate = (1 + weeklyRate)^4.33 - 1
      const weeklyRate = interestRate / 100
      const monthlyRate = Math.pow(1 + weeklyRate, 4.33) - 1
      
      const factor = Math.pow(1 + monthlyRate, numInstallments)
      monthlyPayment = (principal * monthlyRate * factor) / (factor - 1)
      totalAmount = monthlyPayment * numInstallments
      totalInterest = totalAmount - principal
    } else {
      // Monthly interest rate (standard Price system)
      const monthlyRate = interestRate / 100
      
      if (monthlyRate === 0) {
        // No interest - simple division
        monthlyPayment = principal / numInstallments
        totalAmount = principal
        totalInterest = 0
      } else {
        // Price system with monthly rate
        const factor = Math.pow(1 + monthlyRate, numInstallments)
        monthlyPayment = (principal * monthlyRate * factor) / (factor - 1)
        totalAmount = monthlyPayment * numInstallments
        totalInterest = totalAmount - principal
      }
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
    if (!businessRulesData?.interestRules) return null
    
    const rule = businessRulesData.interestRules.find(
      (r: any) => 
        numInstallments >= (r.min_installments || 0) && 
        numInstallments <= (r.max_installments || 999)
    )
    return rule ? { 
      rate: rule.interest_rate, 
      type: rule.interest_type 
    } : null
  }, [formData.installments, businessRulesData])

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Empréstimo Criado!</h2>
            <p className="text-gray-500">O empréstimo foi criado com sucesso.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.newLoan")}</h1>
          <p className="text-gray-500">Crie um novo empréstimo com cálculo automático</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Empréstimo</CardTitle>
            <CardDescription>Preencha os dados do empréstimo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Searchable Customer Select */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="pl-9"
                    autoComplete="off"
                  />
                  {/* Loading indicator inside input */}
                  {loadingCustomers && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                  {/* Show dropdown when has input or has results */}
                  {showDropdown && (searchInput.length >= MIN_SEARCH_CHARS) && (
                    <div className="border rounded-md max-h-48 overflow-y-auto absolute z-50 bg-white w-full shadow-lg mt-1 left-0 right-0">
                      {loadingCustomers ? (
                        <div className="p-3 text-center text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Buscando...
                        </div>
                      ) : customers.length > 0 ? (
                        customers.map((customer: any) => (
                          <div
                            key={customer.id}
                            className={`p-3 cursor-pointer hover:bg-[#22C55E]50 border-b last:border-b-0 ${
                              formData.customerId === customer.id ? "bg-[#22C55E]100" : ""
                            }`}
                            onClick={() => {
                              setFormData({ ...formData, customerId: customer.id })
                              setSearchInput(customer.name)
                              setShowDropdown(false)
                            }}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.document || "Sem CPF"}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          <UserX className="h-4 w-4 inline mr-2" />
                          Nenhum cliente encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.customerId && !showDropdown && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Cliente selecionado
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customerId: "" })
                        setSearchInput("")
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      (Alterar)
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Valor Principal (R$) *</Label>
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.installments}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      
                      // Auto-adjust to nearest valid range in real-time
                      const rules = businessRulesData?.interestRules || []
                      let adjustedValue = value
                      
                      if (rules.length > 0) {
                        const ranges = rules.map((r: any) => ({
                          min: r.min_installments,
                          max: r.max_installments
                        }))
                        
                        const inRange = ranges.some(r => adjustedValue >= r.min && adjustedValue <= r.max)
                        
                        if (!inRange) {
                          // Find nearest range
                          let nearestMax = ranges[0].max
                          let minDiff = Math.abs(adjustedValue - ranges[0].max)
                          let nearestMin = ranges[0].min
                          
                          for (const r of ranges) {
                            const diff = Math.abs(adjustedValue - r.max)
                            if (diff < minDiff) {
                              minDiff = diff
                              nearestMax = r.max
                              nearestMin = r.min
                            }
                          }
                          adjustedValue = nearestMax
                          // Set adjusted value to show message
                          setAdjustedInstallments(adjustedValue)
                        } else {
                          setAdjustedInstallments(null)
                        }
                      } else if (adjustedValue > 12) {
                        adjustedValue = 12
                        setAdjustedInstallments(adjustedValue)
                      } else {
                        setAdjustedInstallments(null)
                      }
                      
                      setFormData({ ...formData, installments: String(adjustedValue) })
                    }}
                  />
                  {/* Show available ranges */}
                  <p className="text-xs text-gray-500">
                    {businessRulesData?.interestRules?.length ? (
                      <>Faixas disponíveis: {businessRulesData.interestRules.map((r: any) => `${r.min_installments}-${r.max_installments}x`).join(", ")}</>
                    ) : (
                      "Configure regras de juros para definir parcelas disponíveis"
                    )}
                  </p>
                  
                  {/* Auto-adjustment message */}
                  {adjustedInstallments && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Número de parcelas ajustado automaticamente para {adjustedInstallments} (faixa válida mais próxima)
                    </p>
                  )}
                  
                  {/* Show interest rate if rule is found */}
                  {currentInterestRate && (
                    <p className="text-xs text-green-600 font-medium">
                      Taxa: {currentInterestRate.rate}% {currentInterestRate.type === 'fixed' ? '(fixo)' : currentInterestRate.type === 'weekly' ? 'semanal' : 'ao mês'}
                    </p>
                  )}
                  
                  {/* Warning if no rule matches */}
                  {!currentInterestRate && formData.installments && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ❌ Nenhuma regra de juros configurada para {formData.installments} parcelas. Configure uma faixa de juros.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Data da Primeira Parcela</Label>
                  <Input
                    type="date"
                    value={formData.firstPaymentDate}
                    onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !formData.customerId || !formData.principal || !currentInterestRate}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : !currentInterestRate ? (
                  "Configure regras de juros para continuar"
                ) : "Criar Empréstimo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simulação
            </CardTitle>
            <CardDescription>Visualize o valor das parcelas</CardDescription>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Valor Principal</p>
                    <p className="text-lg font-bold">{formatCurrency(parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100)}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total Juros</p>
                    <p className="text-lg font-bold text-orange-600">{formatCurrency(preview.totalInterest)}</p>
                  </div>
                  <div className="text-center p-4 bg-[#22C55E]50 rounded-lg">
                    <p className="text-sm text-[#22C55E]600">Total a Pagar</p>
                    <p className="text-lg font-bold text-[#22C55E]600">{formatCurrency(preview.totalAmount)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Parcelas ({formData.installments}x)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.installments.map((inst) => (
                      <div key={inst.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">#{inst.number}</span>
                          <span className="text-xs text-gray-500">{formatDate(inst.dueDate)}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Preencha os dados para ver a simulação
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
