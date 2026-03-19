"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye, Loader2 } from "lucide-react"
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

export default function CustomersPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    credit_limit: 0,
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
      setNewCustomer({ name: "", email: "", phone: "", document: "", credit_limit: 0 })
      refetch()
    },
  })

  const customers = data?.customers || []
  const total = data?.total || 0

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(newCustomer)
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
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Nome</label>
                <Input
                  id="name"
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
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="document" className="text-sm font-medium">CPF/CNPJ</label>
                <Input
                  id="document"
                  value={newCustomer.document}
                  onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="credit_limit" className="text-sm font-medium">Limite de Crédito</label>
                <Input
                  id="credit_limit"
                  type="number"
                  value={newCustomer.credit_limit}
                  onChange={(e) => setNewCustomer({ ...newCustomer, credit_limit: Number(e.target.value) })}
                />
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
