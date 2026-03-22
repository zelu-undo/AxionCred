"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calculator, CheckCircle, Loader2, Search, AlertCircle } from "lucide-react"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { useLoanCalculator, type InterestType } from "@/hooks/use-loan-calculator"

interface InstallmentPreview {
  number: number
  amount: number
  dueDate: string
}

export default function NewLoanPage() {
  const { t } = useI18n()
  const router = useRouter()
  
  // Test alert to see if component renders
  React.useEffect(() => {
    alert("NewLoanPage rendered!")
  }, [])
  
  console.log(">>> NewLoanPage rendered")
  
  // Get customers with search
  const [customerSearch, setCustomerSearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if more than 3 characters
      if (customerSearch.length > 3) {
        console.log("Debounced search changed to:", customerSearch)
        setDebouncedSearch(customerSearch)
      } else {
        setDebouncedSearch("")
      }
    }, 500)  // 500ms debounce
    return () => clearTimeout(timer)
  }, [customerSearch])
  
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.list.useQuery({ 
    limit: 5,
    search: debouncedSearch || undefined
  }, {
    enabled: true  // Always enable, let backend handle empty search
  })
  
  const customers = customersData?.customers || []
  
  // Show dropdown when input is focused or has content
  const shouldShowDropdown = showDropdown && (customers.length > 0 || customerSearch.length > 0)
  
  console.log(">>> shouldShowDropdown:", shouldShowDropdown, "showDropdown:", showDropdown, "customers.length:", customers.length, "customerSearch:", customerSearch)
  
  console.log("Customers query result:", customersData, "search:", debouncedSearch)

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
    installments: "",
    firstPaymentDate: new Date().toISOString().split("T")[0],
    monthlyIncome: "",
  })
  
  // Debounce for validation
  const [debouncedPrincipal, setDebouncedPrincipal] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrincipal(formData.principal)
    }, 500)  // 500ms debounce
    return () => clearTimeout(timer)
  }, [formData.principal])
  
  const [preview, setPreview] = useState<{
    monthlyPayment: number
    totalInterest: number
    totalAmount: number
    installments: InstallmentPreview[]
  } | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Use centralized loan calculator hook
  const { calculateLoan: computeLoan, generateSchedule } = useLoanCalculator()

  // Calculate loan preview using business rules
  const { data: businessRulesData, isLoading: isLoadingRules } = trpc.businessRules.get.useQuery()
  
  console.log("Business rules loaded:", businessRulesData, "loading:", isLoadingRules)

  const calculateLoan = () => {
    console.log("=== calculateLoan called ===")
    console.log("formData.principal:", formData.principal)
    console.log("formData.installments:", formData.installments)
    console.log("businessRulesData:", businessRulesData)
    
    // Parse principal - Brazilian format: 1.234,56 = 1234.56
    const principalStr = formData.principal.replace(/[^0-9]/g, "")
    const principal = principalStr.length > 2 
      ? parseFloat(principalStr.slice(0, -2) + "." + principalStr.slice(-2))
      : parseFloat(principalStr) / 100
    
    const numInstallments = parseInt(formData.installments)
    
    console.log("principal:", principal, "numInstallments:", numInstallments)
    
    if (!principal || !numInstallments) {
      setPreview(null)
      return
    }

    // Get interest rate and type from business rules
    const rules = businessRulesData?.interestRules || []
    console.log("rules in calculateLoan:", rules)
    
    const rule = rules.find(
      (rule: any) => numInstallments >= rule.min_installments && numInstallments <= rule.max_installments
    )
    console.log("matched rule:", rule)
    
    // Default interest rate if no rule found: 5% monthly
    const interestRate = rule?.interest_rate ?? 5
    const interestType = (rule?.interest_type || 'monthly') as InterestType
    
    console.log("interestRate:", interestRate, "interestType:", interestType)

    // Use centralized calculation from hook
    const calculation = computeLoan(principal, interestRate, numInstallments, interestType)

    // Generate installment schedule using the hook
    const installments = generateSchedule(
      principal,
      interestRate,
      numInstallments,
      interestType,
      formData.firstPaymentDate
    ).map(inst => ({
      number: inst.number,
      amount: inst.amount,
      dueDate: inst.dueDate,
    }))
    
    setPreview({
      monthlyPayment: calculation.installmentAmount,
      totalInterest: calculation.totalInterest,
      totalAmount: calculation.totalAmount,
      installments,
    })
  }

  useEffect(() => {
    console.log("=== useEffect triggered ===")
    console.log("debouncedPrincipal:", debouncedPrincipal)
    console.log("formData.installments:", formData.installments)
    console.log("businessRulesData:", businessRulesData)
    
    if (debouncedPrincipal && formData.installments && businessRulesData) {
      calculateLoan()
    }
  }, [debouncedPrincipal, formData.installments, formData.firstPaymentDate, businessRulesData, computeLoan, generateSchedule])

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
      monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome.replace(/[^0-9]/g, "")) / 100 : undefined,
      override_reason: overrideReason || undefined,
    })
  }

  // ============================================
  // CRÉDITO - Validação em tempo real
  // ============================================
  const [selectedCustomerDoc, setSelectedCustomerDoc] = useState("")
  
  // Buscar dados do cliente selecionado
  const { data: selectedCustomer } = trpc.customer.byId.useQuery(
    { id: formData.customerId },
    { enabled: !!formData.customerId }
  )

  // Effect para atualizar documento quando cliente muda
  useEffect(() => {
    if (selectedCustomer?.document) {
      setSelectedCustomerDoc(selectedCustomer.document)
    }
  }, [selectedCustomer])

  // Validar crédito em tempo real (com debounce)
  const { data: validationData, refetch: refetchValidation } = trpc.credit.validateLoan.useQuery(
    {
      customer_document: selectedCustomerDoc,
      amount: debouncedPrincipal ? parseFloat(debouncedPrincipal.replace(/[^0-9]/g, "")) / 100 : 0,
      monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome.replace(/[^0-9]/g, "")) / 100 : undefined,
    },
    { 
      enabled: !!selectedCustomerDoc && !!debouncedPrincipal && parseFloat(debouncedPrincipal.replace(/[^0-9]/g, "")) > 0 
    }
  )

  // State for override
  const [overrideReason, setOverrideReason] = useState("")

  // Show override field if blocked but can override
  const showOverride = validationData && !validationData.is_valid && validationData.can_override

  // Risk level colors
  const getRiskColor = (level: string) => {
    switch (level) {
      case "low": return "text-green-600 bg-green-50 border-green-200"
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "high": return "text-orange-600 bg-orange-50 border-orange-200"
      case "very_high": return "text-red-600 bg-red-50 border-red-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "low": return "Baixo"
      case "medium": return "Médio"
      case "high": return "Alto"
      case "very_high": return "Muito Alto"
      default: return "Não calculado"
    }
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
    const numInstallments = parseInt(formData.installments) || 1
    
    console.log("=== Interest Rate Debug ===")
    console.log("formData.installments:", formData.installments)
    console.log("numInstallments:", numInstallments)
    console.log("businessRulesData:", businessRulesData)
    
    // Check if rules are available
    const rules = businessRulesData?.interestRules
    console.log("interestRules:", rules)
    
    if (!rules || rules.length === 0) {
      console.log("NO RULES FOUND - returning rate: 0")
      return { rate: 0, type: 'monthly' }
    }
    
    const rule = rules.find(
      r => numInstallments >= r.min_installments && numInstallments <= r.max_installments
    )
    
    console.log("Matched rule:", rule)
    
    if (!rule) {
      console.log("NO MATCHING RULE - returning rate: 0")
      return { rate: 0, type: 'monthly' }
    }
    
    return { 
      rate: rule.interest_rate, 
      type: rule.interest_type || 'monthly' 
    }
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
              <div className="space-y-2 relative">
                <Label>Cliente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="pl-9 pr-9"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearch("")
                        setShowDropdown(false)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                  {/* Show dropdown when focused and has results */}
                {shouldShowDropdown && customers.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto absolute z-50 bg-white w-full shadow-lg">
                    {loadingCustomers ? (
                      <div className="p-2 text-center text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Carregando...
                      </div>
                    ) : (
                      customers.map((customer: any) => (
                        <div
                          key={customer.id}
                          className={`p-3 cursor-pointer hover:bg-green-50 border-b last:border-b-0 ${
                            formData.customerId === customer.id ? "bg-green-100" : ""
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, customerId: customer.id })
                            setCustomerSearch(customer.name)
                            setShowDropdown(false)
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.document || "Sem CPF"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {formData.customerId && !showDropdown && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Cliente selecionado
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
                    placeholder="Número de parcelas"
                    value={formData.installments}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setFormData({ ...formData, installments: "" })
                      } else {
                        const num = parseInt(value) || 1
                        setFormData({ ...formData, installments: String(num) })
                      }
                    }}
                    onBlur={() => {
                      // Auto-adjust to nearest valid range
                      const rules = businessRulesData?.interestRules || []
                      const num = parseInt(formData.installments) || 0
                      
                      // If empty or 0, set default
                      if (!num || num < 1) {
                        setFormData({ ...formData, installments: rules.length > 0 ? String(rules[0].min_installments) : "1" })
                        return
                      }
                      
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
                  />
                  {/* Show available ranges */}
                  <p className="text-xs text-gray-500">
                    {businessRulesData?.interestRules?.length ? (
                      <>Faixas disponíveis: {businessRulesData.interestRules.map((r: any) => `${r.min_installments}-${r.max_installments}x`).join(", ")}</>
                    ) : (
                      "Máximo: 12x"
                    )}
                  </p>
                  {currentInterestRate.rate > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Taxa: {currentInterestRate.rate}% {currentInterestRate.type === 'fixed' ? '(fixo)' : currentInterestRate.type === 'weekly' ? 'semanal' : 'ao mês'}
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

              {/* Credit Info Card - Mostrar apenas quando cliente selecionado e com valor */}
              {formData.customerId && formData.principal && validationData && (
                <Card className={`
                  mt-4 border-2
                  ${!validationData.is_valid && !validationData.can_override ? 'border-red-200 bg-red-50' : 
                    validationData.warnings?.length > 0 ? 'border-yellow-200 bg-yellow-50' : 
                    'border-green-200 bg-green-50'}
                `}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Análise de Crédito
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Score com Gauge Visual */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20">
                        <svg className="w-20 h-20 transform -rotate-90">
                          <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                          <circle 
                            cx="40" cy="40" r="35" 
                            stroke={validationData.customer_score && validationData.customer_score >= 801 ? '#22c55e' : 
                                   validationData.customer_score && validationData.customer_score >= 601 ? '#eab308' : 
                                   validationData.customer_score && validationData.customer_score >= 301 ? '#f97316' : '#ef4444'}
                            strokeWidth="8" fill="none"
                            strokeDasharray={`${(validationData.customer_score || 0) / 1000 * 220} 220`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-lg font-bold ${
                            validationData.customer_score && validationData.customer_score >= 801 ? 'text-green-600' :
                            validationData.customer_score && validationData.customer_score >= 601 ? 'text-yellow-600' :
                            validationData.customer_score && validationData.customer_score >= 301 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {validationData.customer_score || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-600">Score de Crédito</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${
                          validationData.customer_risk_level === 'low' ? 'bg-green-100 text-green-700' :
                          validationData.customer_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          validationData.customer_risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Risco {validationData.customer_risk_level === 'low' ? 'Baixo' :
                                 validationData.customer_risk_level === 'medium' ? 'Médio' :
                                 validationData.customer_risk_level === 'high' ? 'Alto' :
                                 validationData.customer_risk_level === 'very_high' ? 'Muito Alto' : '—'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {validationData.customer_score && validationData.customer_score >= 801 ? '✓ Excelente pagador' :
                           validationData.customer_score && validationData.customer_score >= 601 ? '✓ Bom pagador' :
                           validationData.customer_score && validationData.customer_score >= 301 ? '⚠ Pagador regular' :
                           '✗ Alto risco'}
                        </div>
                      </div>
                    </div>

                    {/* Limite do Cliente */}
                    {validationData.client_limit && (
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Limite de Crédito</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(validationData.client_limit)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Utilizado</span>
                            <span className="text-gray-700">{formatCurrency(validationData.client_limit_used || 0)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Disponível</span>
                            <span className="font-medium text-green-600">{formatCurrency(validationData.client_limit_available || 0)}</span>
                          </div>
                          {/* Barra de progresso */}
                          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                ((validationData.client_limit_used || 0) / validationData.client_limit) > 0.9 ? 'bg-red-500' : 
                                ((validationData.client_limit_used || 0) / validationData.client_limit) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, ((validationData.client_limit_used || 0) / (validationData.client_limit || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informações do Cliente */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-white rounded-lg p-3 border text-center">
                        <div className="text-2xl font-bold text-gray-900">{validationData.active_loans_count || 0}</div>
                        <div className="text-xs text-gray-500">Empréstimos Ativos</div>
                      </div>
                    </div>

                    {/* Alertas/Warnings */}
                    {validationData.warnings && validationData.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Atenção</span>
                        </div>
                        <ul className="list-disc list-inside text-yellow-700 text-xs space-y-1">
                          {validationData.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Mensagem de Bloqueio */}
                    {!validationData.is_valid && !validationData.can_override && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Empréstimo Bloqueado</span>
                        </div>
                        <p className="text-red-700 text-xs">{validationData.message}</p>
                      </div>
                    )}

                    {/* Status de Aprovação */}
                    {validationData.is_valid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Pronto para aprovação</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Override Reason - Only show when blocked but can override */}
              {showOverride && (
                <div className="space-y-2 mt-4">
                  <Label className="text-orange-600">Justificativa para aprovação manual *</Label>
                  <textarea
                    className="w-full p-2 border rounded-md text-sm"
                    rows={3}
                    placeholder="Descreva o motivo da aprovação fora das regras..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !formData.customerId || !formData.principal || (showOverride && !overrideReason)}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
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
            {isLoadingRules ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#22C55E]" />
                <p className="mt-2 text-gray-500">Carregando regras...</p>
              </div>
            ) : preview ? (
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
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                <p>Preencha os dados para ver a simulação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
