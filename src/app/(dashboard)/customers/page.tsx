"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye, Loader2, MapPin } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    credit_limit: 0,
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  })
  
  // Fetch customers from database
  const { data, isLoading, error, refetch } = trpc.customer.list.useQuery({
    search: searchQuery || undefined,
    limit: 50,
    offset: 0,
  }, {
    retry: false,
    refetchOnWindowFocus: false,
  })

  const createMutation = trpc.customer.create.useMutation({
    onSuccess: () => {
      setIsCreateOpen(false)
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        document: "",
        credit_limit: 0,
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      })
      refetch()
    },
  })

  const customers = data?.customers || []
  const total = data?.total || 0

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
          setNewCustomer((prev: typeof newCustomer) => ({
            ...prev,
            cep: cleanCep,
            street: data.logradouro || "",
            complement: data.complemento || "",
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
      credit_limit: newCustomer.credit_limit,
      address: fullAddress || undefined,
    })
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
              <p className="text-red-500 font-medium">Erro ao carregar clientes</p>
              <p className="text-gray-500 text-sm mt-1">{error.message}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Tentar novamente
              </Button>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                {t("customers.viewDetails")}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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

              <div className="mt-4 text-sm text-gray-500">
                Total de {total} clientes
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customers.newCustomer")}</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer}>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
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
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="document" className="text-sm font-medium">CPF/CNPJ *</label>
                <Input
                  id="document"
                  placeholder="000.000.000-00"
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="credit_limit" className="text-sm font-medium">Limite de Crédito</label>
                <Input
                  id="credit_limit"
                  type="number"
                  placeholder="0,00"
                  value={newCustomer.credit_limit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: Number(e.target.value) })}
                />
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
                        onChange={(e) => handleCepChange(e.target.value)}
                        required
                        maxLength={8}
                      />
                      {isLoadingCep && (
                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
