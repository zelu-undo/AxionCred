"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calculator, CheckCircle, Loader2, Search } from "lucide-react"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"

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
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.list.useQuery({ 
    limit: 100,
    search: customerSearch || undefined
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
    const principal = parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100
    const numInstallments = parseInt(formData.installments)
    
    if (!principal || !numInstallments) return

    // Get interest rate and type from business rules
    const rule = businessRulesData?.interestRules?.find(
      rule => numInstallments >= rule.minInstallments && numInstallments <= rule.maxInstallments
    )
    
    const interestRate = rule?.interestRate || 0
    const interestType = rule?.interestType || 'monthly'
    
    let monthlyPayment: number
    let totalAmount: number
    let totalInterest: number
    
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
    
    const principal = parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100
    
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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou CPF..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {customerSearch && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {loadingCustomers ? (
                      <div className="p-2 text-center text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        Carregando...
                      </div>
                    ) : customers.length === 0 ? (
                      <div className="p-2 text-center text-gray-500">Nenhum cliente encontrado</div>
                    ) : (
                      customers.map((customer: any) => (
                        <div
                          key={customer.id}
                          className={`p-2 cursor-pointer hover:bg-purple-50 ${
                            formData.customerId === customer.id ? "bg-purple-100" : ""
                          }`}
                          onClick={() => {
                            setFormData({ ...formData, customerId: customer.id })
                            setCustomerSearch(customer.name)
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.document || "Sem CPF"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {formData.customerId && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    ✓ Cliente selecionado
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
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36, 48].map((num) => (
                      <option key={num} value={num}>
                        {num}x
                      </option>
                    ))}
                  </select>
                  {currentInterestRate.rate > 0 && (
                    <p className="text-xs text-gray-500">
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

              <Button type="submit" className="w-full" disabled={isSubmitting || !formData.customerId || !formData.principal}>
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
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Total a Pagar</p>
                    <p className="text-lg font-bold text-purple-600">{formatCurrency(preview.totalAmount)}</p>
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
