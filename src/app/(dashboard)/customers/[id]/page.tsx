"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trpc } from "@/trpc/client"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { useI18n } from "@/i18n/client"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Loader2, Phone, Mail, MapPin, Calendar, FileText, History, User, TextCursor, TrendingUp, AlertTriangle, CheckCircle, Clock, CreditCard, Calculator } from "lucide-react"

// Calculate recommended credit limit based on payment history
function calculateRecommendedLimit(): number {
  // This would typically be calculated based on:
  // - Payment history
  // - Income (if available)
  // - Current debt ratio
  // - Tenant's max limit settings
  // For demo, we'll return a fixed value
  return 5000
}

// CPF formatting
function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length >= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  } else if (digits.length >= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  } else if (digits.length >= 3) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  return digits
}

// Phone formatting
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length >= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  } else if (digits.length >= 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  return digits
}

// CEP formatting
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  if (digits.length >= 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  return digits
}

export default function CustomerDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const customerId = params.id as string
  const isEditMode = searchParams.get("edit") === "true"

  const [isEditing, setIsEditing] = useState(isEditMode)
  const [showHistory, setShowHistory] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [cpfError, setCpfError] = useState("")
  const [cepError, setCepError] = useState("")
  const [isCheckingCpf, setIsCheckingCpf] = useState(false)
  const [notesLength, setNotesLength] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_NOTES_LENGTH = 400
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
    status: "active" as "active" | "inactive" | "blocked",
    credit_limit: 0,
  })

  // Priority configuration
  const priorityConfig: Record<number, { label: string; color: string; icon: any; bg: string; text: string }> = {
    1: { label: "Alta", color: "red", icon: AlertTriangle, bg: "bg-red-100", text: "text-red-700" },
    2: { label: "Média", color: "yellow", icon: Clock, bg: "bg-yellow-100", text: "text-yellow-700" },
    3: { label: "Baixa", color: "green", icon: CheckCircle, bg: "bg-green-100", text: "text-green-700" },
  }

  // Payment status configuration  
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    em_dia: { label: "Em Dia", color: "green", icon: CheckCircle },
    atencao: { label: "Atenção", color: "yellow", icon: Clock },
    inadimplente: { label: "Inadimplente", color: "red", icon: AlertTriangle },
  }

  // Fetch customer data FIRST (must be before any hooks that use customer)
  const { data: customer, isLoading, refetch } = trpc.customer.byId.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  )

  // Calculate status based on customer data (after it's loaded)
  const getSafePaymentStatus = () => {
    if (!customer) return "em_dia"
    if (customer.status === "inactive" || customer.status === "blocked") return "inadimplente"
    return "em_dia"
  }
  
  const getSafePriorityScore = () => {
    const status = getSafePaymentStatus()
    if (status === "inadimplente") return 1
    if (status === "em_dia") return 3
    return 2
  }

  const currentPaymentStatus = getSafePaymentStatus()
  const currentPriorityScore = getSafePriorityScore()

  // Safe access to config objects
  const currentPriority = priorityConfig[currentPriorityScore as keyof typeof priorityConfig] || priorityConfig[2]
  const currentStatus = statusConfig[currentPaymentStatus as keyof typeof statusConfig] || statusConfig.em_dia

  // Fetch customer events for audit
  const { data: events } = trpc.customer.events.useQuery(
    { customerId },
    { enabled: !!customerId }
  )

  // Update mutation
  const updateMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      showSuccessToast("Cliente atualizado com sucesso!")
      setIsEditing(false)
      refetch()
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao atualizar cliente")
    },
  })

  // Set form data when customer loads
  useEffect(() => {
    if (customer) {
      // Use individual address fields from database
      const street = customer.street || ""
      const number = customer.number || ""
      const complement = customer.complement || ""
      const neighborhood = customer.neighborhood || ""
      const city = customer.city || ""
      const state = customer.state || ""
      const cep = customer.cep || ""
      
      // Build address string for display
      const addressParts = [street, number, complement, neighborhood, city, state].filter(Boolean)
      const fullAddress = addressParts.join(", ")
      
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        document: customer.document || "",
        cep: cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        notes: customer.notes || "",
        status: customer.status || "active",
        credit_limit: customer.credit_limit || 0,
      })
    }
  }, [customer])

  // Validate CPF on blur
  const handleCpfBlur = async () => {
    const cleanCpf = formData.document.replace(/\D/g, "")
    
    if (!cleanCpf) {
      setCpfError("")
      return
    }

    if (cleanCpf.length !== 11) {
      setCpfError("CPF deve ter 11 dígitos")
      return
    }

    // Basic CPF validation
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      setCpfError("CPF inválido")
      return
    }

    // Check CPF digits
    let sum = 0
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.charAt(i - 1)) * (11 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCpf.charAt(9))) {
      setCpfError("CPF inválido")
      return
    }

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.charAt(i - 1)) * (12 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCpf.charAt(10))) {
      setCpfError("CPF inválido")
      return
    }

    // Check for duplicate CPF (excluding current customer)
    setIsCheckingCpf(true)
    try {
      // Get the session token to send in header
      const supabase = (await import("@/lib/supabase")).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ""
      
      const response = await fetch(`/api/check-cpf?cpf=${cleanCpf}&excludeId=${customerId}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const result = await response.json()
      
      if (result.exists) {
        setCpfError("CPF já está cadastrado para outro cliente")
      } else {
        setCpfError("")
      }
    } catch (error) {
      console.error("Erro ao verificar CPF:", error)
    } finally {
      setIsCheckingCpf(false)
    }
  }

  // Validate CEP on blur
  const handleCepBlur = () => {
    const cleanCep = formData.cep.replace(/\D/g, "")
    
    if (!cleanCep) {
      setCepError("")
      return
    }

    if (cleanCep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos")
      return
    }

    setCepError("")
  }

  // Consulta CEP via ViaCEP
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    setFormData({ ...formData, cep })

    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    
    // Abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      // Try ViaCEP first
      let data = null
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        data = await response.json()
      } catch {
        // If ViaCEP fails, try BrasilAPI as fallback
        clearTimeout(timeoutId)
        const fallbackController = new AbortController()
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000)
        
        const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
          signal: fallbackController.signal
        })
        clearTimeout(fallbackTimeout)
        const apiData = await response.json()
        data = {
          logradouro: apiData.street || apiData.address || "",
          bairro: apiData.neighborhood || "",
          locality: apiData.city || "",
          uf: apiData.state || ""
        }
      }

      if (data && !data.erro) {
        setFormData((prev) => ({
          ...prev,
          cep: cleanCep,
          street: data.logradouro || data.street || "",
          neighborhood: data.bairro || data.neighborhood || "",
          city: data.localidade || data.city || "",
          state: data.uf || data.state || "",
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleSave = () => {
    // Build address string
    const addressParts = [
      formData.street,
      formData.number,
      formData.complement,
      formData.neighborhood,
      formData.city,
      formData.state,
    ].filter(Boolean)
    
    const fullAddress = addressParts.join(", ")

    updateMutation.mutate({
      id: customerId,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone,
      cep: formData.cep || undefined,
      street: formData.street || undefined,
      number: formData.number || undefined,
      complement: formData.complement || undefined,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      address: fullAddress || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleString("pt-BR")
  }

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.max(100, textarea.scrollHeight) + "px"
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_NOTES_LENGTH) {
      setFormData({ ...formData, notes: value })
      setNotesLength(value.length)
      // Adjust height after state update
      setTimeout(adjustTextareaHeight, 0)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Cliente não encontrado</p>
            <Button onClick={() => router.push("/customers")} className="mt-4">
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto py-8 max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {/* Payment Status Badge */}
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                text-xs font-medium border
                ${currentPaymentStatus === "em_dia" ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-700" :
                  "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700"}
              `}>
                {currentStatus && <currentStatus.icon className="h-3 w-3" />}
                {currentStatus?.label}
              </span>
              
              {/* Priority Badge */}
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                text-xs font-medium border
                ${currentPriorityScore === 1 ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200" :
                  currentPriorityScore === 2 ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200" :
                  "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"}
              `}>
                <TrendingUp className="h-3 w-3" />
                Prioridade {currentPriority?.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending || !!cpfError || !!cepError}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
            </>
          ) : customer.status !== "deleted" && (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          )}
        </div>
      </div>

      {/* Audit History */}
      {showHistory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <History className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum histórico disponível</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ (não editável)</Label>
                  <Input id="document" value={formData.document} disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{customer.email || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>{customer.document || "-"}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Credit Limit */}
        <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#22C55E]" />
                Limite de Crédito
              </CardTitle>
              {isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFormData({ ...formData, credit_limit: calculateRecommendedLimit() })}
                  className="text-xs text-[#22C55E] hover:text-[#4ADE80]"
                >
                  Calcular automático
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={formData.credit_limit || ""}
                  onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className="text-2xl font-bold border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <p className="text-xs text-gray-500">
                  Limite recomendado: R$ {calculateRecommendedLimit().toLocaleString("pt-BR")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">Limite disponível</p>
                  <p className="text-3xl font-bold text-emerald-800">
                    R$ {(customer.credit_limit || 0).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Baseado no histórico de pagamentos</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Endereço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={formData.cep}
                      onChange={(e) => {
                        const formatted = formatCep(e.target.value)
                        handleCepChange(formatted)
                      }}
                      onBlur={handleCepBlur}
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                  {cepError && <p className="text-sm text-red-500">{cepError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      maxLength={2}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {!customer.address && <p className="text-gray-500">Sem endereço cadastrado</p>}
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className={isEditing ? "" : "md:col-span-2"}>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  className="w-full border border-gray-300 rounded-md p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-[#22C55E]500 focus:border-transparent"
                  value={formData.notes}
                  onChange={handleNotesChange}
                  placeholder="Adicione observações sobre o cliente..."
                  onFocus={adjustTextareaHeight}
                  onInput={adjustTextareaHeight}
                />
                <div className="flex items-center justify-between">
                  {notesLength >= MAX_NOTES_LENGTH && (
                    <span className="text-xs text-red-500 font-medium animate-pulse">
                      Limite atingido!
                    </span>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Progress circle */}
                    <div className="relative w-5 h-5">
                      <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 10}
                          strokeDashoffset={2 * Math.PI * 10 * (1 - notesLength / MAX_NOTES_LENGTH)}
                          className={`${notesLength >= MAX_NOTES_LENGTH ? 'text-red-500' : 'text-[#22C55E]500'} transition-all duration-300`}
                        />
                      </svg>
                    </div>
                    <span className={`text-xs ${notesLength >= MAX_NOTES_LENGTH ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {notesLength}/{MAX_NOTES_LENGTH}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">{customer.notes || "Nenhuma observação"}</p>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono">{customer.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Criado em:</span>
                <span className="ml-2">{formatDate(customer.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Última alteração:</span>
                <span className="ml-2">{formatDate(customer.updated_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Excluído em:</span>
                <span className="ml-2">{formatDate((customer as any).deleted_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
