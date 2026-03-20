"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye, Loader2, MapPin, ChevronLeft, ChevronRight, Filter } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
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
  
  const LIMIT = 20
  
  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, statusFilter])
  
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
  
  // Fetch customers from database with pagination and filters
  const { data, isLoading, error, refetch } = trpc.customer.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter as "active" | "inactive" | "blocked" | undefined,
    limit: LIMIT,
    offset: currentPage * LIMIT,
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
    try {
      const response = await fetch(`/api/check-cpf?cpf=${cleanCpf}`)
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
    } catch (error) {
      console.error("Erro ao verificar CPF:", error)
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

  // Consulta CEP via ViaCEP
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "")
    setNewCustomer({ ...newCustomer, cep })

    if (cleanCep.length === 8) {
      setIsLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setNewCustomer((prev) => ({
            ...prev,
            cep: cleanCep,
            street: data.logradouro || "",
            // Don't auto-fill complement - it causes confusion
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }))
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Build address string
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("customers.title")}</h1>
          <p className="text-gray-500">{t("customers.subtitle")}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("customers.newCustomer")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {statusFilter && <span className="ml-1 bg-[#22C55E] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">1</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => setStatusFilter(undefined)}
                  className={!statusFilter ? "bg-[#22C55E]10 font-medium" : ""}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("active")}
                  className={statusFilter === "active" ? "bg-[#22C55E]10 font-medium" : ""}
                >
                  Ativo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("inactive")}
                  className={statusFilter === "inactive" ? "bg-[#22C55E]10 font-medium" : ""}
                >
                  Inativo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter("blocked")}
                  className={statusFilter === "blocked" ? "bg-[#22C55E]10 font-medium" : ""}
                >
                  Bloqueado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {(searchQuery || statusFilter) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter(undefined)
                }}
              >
                Limpar filtros
              </Button>
            )}
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
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("customers.name")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("customers.phone")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("common.status")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("customers.creditLimit")}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {customer.status === "active" ? t("customers.active") : t("customers.inactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {customer.credit_limit && customer.credit_limit > 0 
                            ? `R$ ${customer.credit_limit.toLocaleString("pt-BR")}`
                            : "-"
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu open={openDropdown === customer.id} onOpenChange={(open) => setOpenDropdown(open ? customer.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setOpenDropdown(customer.id)}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("customers.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}?edit=true`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este cliente?")) {
                                  deleteMutation.mutate({ id: customer.id })
                                }
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {customers.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  {t("customers.noCustomersFound")}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Total de {total} clientes
                </div>
                {total > LIMIT && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage + 1} de {Math.ceil(total / LIMIT)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={(currentPage + 1) * LIMIT >= total}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
    </div>
  )
}
