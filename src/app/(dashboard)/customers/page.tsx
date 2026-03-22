"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye, Loader2, MapPin, User, CreditCard, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDebounce } from "@/hooks/use-debounce"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useI18n } from "@/i18n/client"
import { trpc } from "@/trpc/client"
import { showErrorToast, showSuccessToast } from "@/lib/toast"

interface Address {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export default function CustomersPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  
  // Sync search query with URL params when coming from global search
  useEffect(() => {
    const urlSearch = searchParams.get("search")
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams, searchQuery])

  // Debounce search to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 400)

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [cpfError, setCpfError] = useState("")
  const [isCheckingCpf, setIsCheckingCpf] = useState(false)
  const [cepError, setCepError] = useState("")
  const [newCustomer, setNewCustomer] = useState({
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
  })
  
  // Reset form when modal closes
  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) {
      // Clear form when closing
      setNewCustomer({
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
      })
    }
  }
  
  // Fetch customers from database with debounced search
  const { data, isLoading, error, refetch } = trpc.customer.list.useQuery({
    search: debouncedSearchQuery || undefined,
    limit: 50,
    offset: 0,
  }, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const createMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      handleDialogOpenChange(false)
      refetch()
      showSuccessToast("Cliente criado com sucesso!")
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao criar cliente")
    },
  })

  // Delete customer mutation
  const deleteMutation = trpc.customer.delete.useMutation({
    onSuccess: () => {
      showSuccessToast("Cliente excluído com sucesso!")
      refetch()
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao excluir cliente")
    },
  })

  const customers = data?.customers || []
  const total = data?.total || 0

  // Validate CPF format and check for duplicates on blur
  const handleCpfBlur = async () => {
    const cleanCpf = newCustomer.document.replace(/\D/g, "")
    
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

    // Check for duplicate in database
    setIsCheckingCpf(true)
    setCpfError("")
    try {
      // Get the session token to send in header
      const supabase = (await import("@/lib/supabase")).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token || ""
      
      const response = await fetch(`/api/check-cpf?cpf=${cleanCpf}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro de conexão" }))
        throw new Error(errorData.error || `Erro ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.exists) {
        if (result.deleted) {
          setCpfError(`CPF já foi cadastrado. Cliente "${result.name}" foi excluído em ${result.deletedAt}. deseja reativar?`)
        } else {
          setCpfError("CPF já está cadastrado para outro cliente")
        }
      } else {
        setCpfError("")
      }
    } catch (error: any) {
      console.error("Erro ao verificar CPF:", error)
      // Don't block submission on network errors - just warn
      setCpfError(error.message ? `Aviso: ${error.message}` : "")
    } finally {
      setIsCheckingCpf(false)
    }
  }

  // Validate CEP format on blur
  const handleCepBlur = () => {
    const cleanCep = newCustomer.cep.replace(/\D/g, "")
    
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

  // Consulta CEP via ViaCEP (with fallback and timeout)
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    setNewCustomer({ ...newCustomer, cep })

    if (cleanCep.length !== 8) return

    setIsLoadingCep(true)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    try {
      let data = null
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        data = await response.json()
      } catch {
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
        setNewCustomer((prev) => ({
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

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Build address string (for backwards compatibility)
    const addressParts = [
      newCustomer.street,
      newCustomer.number,
      newCustomer.complement,
      newCustomer.neighborhood,
      newCustomer.city,
      newCustomer.state,
    ].filter(Boolean)
    
    const fullAddress = addressParts.join(", ")
    
    createMutation.mutate({
      name: newCustomer.name,
      email: newCustomer.email || undefined,
      phone: newCustomer.phone,
      document: newCustomer.document,
      cep: newCustomer.cep || undefined,
      street: newCustomer.street || undefined,
      number: newCustomer.number || undefined,
      complement: newCustomer.complement || undefined,
      neighborhood: newCustomer.neighborhood || undefined,
      city: newCustomer.city || undefined,
      state: newCustomer.state || undefined,
      address: fullAddress || undefined,
    })
  }

  // Format input masks
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  // Enhanced status badge with gradient
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        bg: "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200", 
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: t("customers.active")
      },
      inactive: { 
        bg: "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200", 
        text: "text-gray-700",
        dot: "bg-gray-400",
        label: t("customers.inactive")
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

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("customers.title")}</h1>
          <p className="text-gray-500">{t("customers.subtitle")}</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="
            bg-[#22C55E] hover:bg-[#4ADE80] 
            shadow-lg shadow-emerald-500/25
            hover:shadow-emerald-500/40
            transition-all duration-300 hover:scale-[1.02]
            active:scale-[0.98]
          "
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("customers.newCustomer")}
        </Button>
      </div>

      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder={t("customers.searchCustomers")}
                className="pl-9 bg-gray-50/50 border-gray-200/60 focus:bg-white focus:border-emerald-400 focus:ring-emerald-500/20 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-800 font-medium">Não foi possível carregar os clientes</p>
                <p className="text-red-600 text-sm mt-1">
                  {error.message?.includes("Unauthorized") || error.message?.includes("UNAUTHORIZED")
                    ? "Você não tem permissão para acessar esta funcionalidade. Verifique se seu e-mail foi confirmado."
                    : "Tente novamente mais tarde ou entre em contato com o suporte."}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 bg-white"
                  onClick={() => refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
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
                          <User className="h-3.5 w-3.5" />
                          {t("customers.name")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          {t("customers.phone")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          {t("common.status")}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {customers.map((customer: any, index) => (
                        <motion.tr 
                          key={customer.id} 
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
                              <div>
                                <p className="font-semibold text-gray-900">{customer.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                              {customer.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{customer.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(customer.status)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu open={openDropdown === customer.id} onOpenChange={(open) => setOpenDropdown(open ? customer.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="
                                    hover:bg-gray-100 
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
                                  className="
                                    hover:bg-gray-50 rounded-md px-3 py-2 
                                    cursor-pointer transition-colors
                                  "
                                  onClick={() => router.push(`/customers/${customer.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{t("customers.viewDetails")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="
                                    hover:bg-gray-50 rounded-md px-3 py-2 
                                    cursor-pointer transition-colors
                                  "
                                  onClick={() => router.push(`/customers/${customer.id}?edit=true`)}
                                >
                                  <Edit className="mr-2 h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{t("common.edit")}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="
                                    text-red-600 hover:bg-red-50 rounded-md px-3 py-2 
                                    cursor-pointer transition-colors
                                  "
                                  onClick={() => {
                                    if (confirm("Tem certeza que deseja excluir este cliente?")) {
                                      deleteMutation.mutate({ id: customer.id })
                                    }
                                  }}
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
              
              {customers.length === 0 && (
                <div className="py-16 text-center">
                  <div className="
                    inline-flex items-center justify-center w-20 h-20 
                    rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200
                    mb-4 shadow-inner
                  ">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">{t("customers.noCustomersFound")}</p>
                  <p className="text-gray-400 text-sm mt-1">Comece adicionando um novo cliente</p>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Total de {total} clientes
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("customers.newCustomer")}</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente
            </DialogDescription>
          </DialogHeader>
          <form id="create-customer-form" onSubmit={handleCreateCustomer} className="flex-1 overflow-y-auto">
            <div className="space-y-4 py-2 pr-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nome *</label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Telefone *</label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: formatPhone(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="document" className="text-sm font-medium">CPF/CNPJ *</label>
                <div className="relative">
                  <Input
                    id="document"
                    placeholder="000.000.000-00"
                    value={newCustomer.document}
                    onChange={(e) => setNewCustomer({ ...newCustomer, document: formatCpf(e.target.value) })}
                    onBlur={handleCpfBlur}
                    required
                  />
                  {isCheckingCpf && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                {cpfError && (
                  <p className="text-sm text-red-500">{cpfError}</p>
                )}
              </div>
              
              {/* Endereço */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="cep" className="text-sm font-medium">CEP *</label>
                    <div className="relative">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={newCustomer.cep}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value)
                          handleCepChange(formatted)
                        }}
                        onBlur={handleCepBlur}
                        required
                      />
                      {isLoadingCep && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    {cepError && (
                      <p className="text-sm text-red-500">{cepError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="state" className="text-sm font-medium">Estado *</label>
                    <Input
                      id="state"
                      placeholder="UF"
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value.toUpperCase() })}
                      required
                      maxLength={2}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">Cidade *</label>
                    <Input
                      id="city"
                      placeholder="Cidade"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label htmlFor="neighborhood" className="text-sm font-medium">Bairro *</label>
                    <Input
                      id="neighborhood"
                      placeholder="Bairro"
                      value={newCustomer.neighborhood}
                      onChange={(e) => setNewCustomer({ ...newCustomer, neighborhood: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label htmlFor="street" className="text-sm font-medium">Rua *</label>
                    <Input
                      id="street"
                      placeholder="Rua, Avenida, etc."
                      value={newCustomer.street}
                      onChange={(e) => setNewCustomer({ ...newCustomer, street: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="number" className="text-sm font-medium">Número *</label>
                    <Input
                      id="number"
                      placeholder="Número"
                      value={newCustomer.number}
                      onChange={(e) => setNewCustomer({ ...newCustomer, number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="complement" className="text-sm font-medium">Complemento</label>
                    <Input
                      id="complement"
                      placeholder="Apto, sala, etc."
                      value={newCustomer.complement}
                      onChange={(e) => setNewCustomer({ ...newCustomer, complement: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
          <DialogFooter className="p-4 border-t bg-background">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="create-customer-form" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
