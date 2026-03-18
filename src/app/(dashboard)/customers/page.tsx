"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Phone, Mail, MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n } from "@/i18n/client"

// Demo customers data
const demoCustomers = [
  { id: "1", name: "João Silva", phone: "(11) 99999-9999", email: "joao@email.com", status: "active", credit_limit: 5000 },
  { id: "2", name: "Maria Santos", phone: "(11) 88888-8888", email: "maria@email.com", status: "active", credit_limit: 10000 },
  { id: "3", name: "Pedro Costa", phone: "(11) 77777-7777", email: "pedro@email.com", status: "active", credit_limit: 3000 },
  { id: "4", name: "Ana Pereira", phone: "(11) 66666-6666", email: "ana@email.com", status: "inactive", credit_limit: 0 },
  { id: "5", name: "Roberto Lima", phone: "(11) 55555-5555", email: "roberto@email.com", status: "active", credit_limit: 8000 },
  { id: "6", name: "Juliana Oliveira", phone: "(11) 44444-4444", email: "juliana@email.com", status: "active", credit_limit: 6000 },
]

export default function CustomersPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredCustomers = demoCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("customers.title")}</h1>
          <p className="text-gray-500">{t("customers.subtitle")}</p>
        </div>
        <Button>
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
                {filteredCustomers.map((customer) => (
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
                      {customer.credit_limit > 0 
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
          
          {filteredCustomers.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {t("customers.noCustomersFound")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
