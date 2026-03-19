"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calculator, CheckCircle, Loader2 } from "lucide-react"
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
  
  // Get customers for dropdown
  const { data: customersData } = trpc.customer.list.useQuery({ limit: 1000 })
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
    interestRate: "5",
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

  const calculateLoan = () => {
    const principal = parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100
    const rate = parseFloat(formData.interestRate) / 100
    const numInstallments = parseInt(formData.installments)
    
    if (!principal || !numInstallments) return

    let monthlyPayment: number
    let totalAmount: number
    
    if (rate === 0) {
      // Sem juros - divisão simples
      monthlyPayment = principal / numInstallments
      totalAmount = principal
    } else {
      // Sistema Price (parcelas fixas)
      monthlyPayment = (principal * rate * Math.pow(1 + rate, numInstallments)) / 
                      (Math.pow(1 + rate, numInstallments) - 1)
      totalAmount = monthlyPayment * numInstallments
    }
    
    const totalInterest = totalAmount - principal
    
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
    if (formData.principal && formData.installments) {
      calculateLoan()
    }
  }, [formData.principal, formData.interestRate, formData.installments, formData.firstPaymentDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const principal = parseFloat(formData.principal.replace(/[^0-9]/g, "")) / 100
    
    createMutation.mutate({
      customer_id: formData.customerId,
      principal_amount: principal,
      interest_rate: parseFloat(formData.interestRate),
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
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Label>Taxa de Juros (% ao mês)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Select 
                    value={formData.installments} 
                    onValueChange={(value) => setFormData({ ...formData, installments: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data da Primeira Parcela</Label>
                <Input
                  type="date"
                  value={formData.firstPaymentDate}
                  onChange={(e) => setFormData({ ...formData, firstPaymentDate: e.target.value })}
                />
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
