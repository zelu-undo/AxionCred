"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, DollarSign, Calendar } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useI18n } from "@/i18n/client"

// Demo loans data
const demoLoans = [
  { 
    id: "1", 
    customer: "João Silva", 
    principal: 5000, 
    total: 5300, 
    paid: 2650, 
    remaining: 2650, 
    installments: 6, 
    paid_installments: 3,
    status: "active",
    created_at: "2024-01-15"
  },
  { 
    id: "2", 
    customer: "Maria Santos", 
    principal: 2500, 
    total: 2500, 
    paid: 2500, 
    remaining: 0, 
    installments: 3, 
    paid_installments: 3,
    status: "paid",
    created_at: "2024-01-10"
  },
  { 
    id: "3", 
    customer: "Pedro Costa", 
    principal: 10000, 
    total: 11200, 
    paid: 0, 
    remaining: 11200, 
    installments: 12, 
    paid_installments: 0,
    status: "pending",
    created_at: "2024-02-01"
  },
  { 
    id: "4", 
    customer: "Roberto Lima", 
    principal: 8000, 
    total: 8800, 
    paid: 2200, 
    remaining: 6600, 
    installments: 12, 
    paid_installments: 3,
    status: "active",
    created_at: "2024-01-20"
  },
]

export default function LoansPage() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredLoans = demoLoans.filter(loan =>
    loan.customer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">{t("loans.paidOut")}</span>
      case "active":
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">{t("loans.active")}</span>
      case "pending":
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">{t("loans.pending")}</span>
      case "cancelled":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">{t("loans.cancelled")}</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("loans.title")}</h1>
          <p className="text-gray-500">{t("loans.subtitle")}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("loans.newLoan")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("loans.searchLoans")}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.customer")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.principal")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.installments")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.paid")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("loans.remaining")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("common.status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("common.date")}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{loan.customer}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{formatCurrency(loan.principal)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{loan.paid_installments}/{loan.installments}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-600 font-medium">{formatCurrency(loan.paid)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={loan.remaining > 0 ? "text-orange-600 font-medium" : ""}>
                        {formatCurrency(loan.remaining)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(loan.created_at)}
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
                            {t("loans.viewDetails")}
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
          
          {filteredLoans.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              {t("loans.noLoansFound")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
