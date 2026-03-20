"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye, Loader2, MapPin, Users } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
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
import { motion } from "framer-motion"

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
  
  // Fetch customers from database
  const { data, isLoading, error, refetch } = trpc.customer.list.useQuery({
    search: searchQuery || undefined,
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("customers.title")}</h1>
          <p className="text-gray-500">{t("customers.subtitle")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-[#22C55E] hover:bg-[#4ADE80] w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("customers.newCustomer")}
          </Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("customers.searchCustomers")}
                className="pl-9"
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
                  <tbody className="divide-y divide-gray-50">
                    {customers.map((customer, index) => (
                      <motion.tr 
                        key={customer.id} 
                        className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-200 group cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.005 }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1E3A8A]/10 to-[#1E3A8A]/5 flex items-center justify-center text-[#1E3A8A] font-bold shadow-sm">
                              {customer.name.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3 text-[#22C55E]" />
                              {customer.phone}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Mail className="h-3 w-3 text-blue-500" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            customer.status === "active" 
                              ? "bg-gradient-to-r from-green-100 to-green-50 text-green-700" 
                              : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700"
                          }`}>
                            {customer.status === "active" ? t("customers.active") : t("customers.inactive")}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          {customer.credit_limit && customer.credit_limit > 0 
                            ? `R$ ${customer.credit_limit.toLocaleString("pt-BR")}`
                            : "-"
                          }
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu open={openDropdown === customer.id} onOpenChange={(open) => setOpenDropdown(open ? customer.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-gray-100 h-8 w-8 rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border-gray-100">
                              <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)} className="hover:bg-gray-50 rounded-lg cursor-pointer">
                                <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                <span className="text-gray-700">{t("customers.viewDetails")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}?edit=true`)} className="hover:bg-gray-50 rounded-lg cursor-pointer">
                                <Edit className="mr-2 h-4 w-4 text-[#22C55E]" />
                                <span className="text-gray-700">{t("common.edit")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" onClick={() => {
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
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {customers.length === 0 && (
                <EmptyState
                  icon={Users}
                  title={t("customers.noCustomersFound")}
                  description="Comece adicionando seu primeiro cliente para gerenciar seus empréstimos."
                  actionLabel="Adicionar Cliente"
                  onAction={() => setIsCreateOpen(true)}
                />
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
