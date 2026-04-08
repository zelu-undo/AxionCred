"use client"

import { useState } from "react"
import { trpc } from "@/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Download, 
  Eye, 
  User, 
  Clock, 
  FileText, 
  Trash2,
  AlertCircle,
  CheckCircle,
  PenLine,
  RefreshCw
} from "lucide-react"

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    entityType: "all",
    action: "all",
    dateFrom: "",
    dateTo: "",
  })
  const [page, setPage] = useState(0)
  const limit = 20

  // Fetch audit logs
  const { data, isLoading, refetch } = trpc.auditLogs.list.useQuery(
    {
      entityType: filters.entityType !== "all" ? filters.entityType : undefined,
      action: filters.action !== "all" ? filters.action as "INSERT" | "UPDATE" | "DELETE" : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      limit,
      offset: page * limit,
    },
    {
      refetchInterval: 30000,
    }
  )

  // Fetch stats
  const { data: stats } = trpc.auditLogs.stats.useQuery(
    {
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    },
    {
      refetchInterval: 60000,
    }
  )

  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleExport = () => {
    if (!data?.logs) return
    
    const csv = [
      "Data/Hora,Usuário,Entidade,Ação",
      ...data.logs.map((log: any) => 
        `${log.created_at},${log.user_name || "Sistema"},${log.entity_type},${log.action}`
      )
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Criado</Badge>
      case "UPDATE":
        return <Badge className="bg-blue-100 text-blue-700"><PenLine className="w-3 h-3 mr-1" /> Atualizado</Badge>
      case "DELETE":
        return <Badge className="bg-red-100 text-red-700"><Trash2 className="w-3 h-3 mr-1" /> Deletado</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  const entityTypes = [
    "all",
    "customers",
    "loans",
    "loan_installments",
    "users",
    "payment_transactions",
    "guarantors",
    "loan_renegotiations",
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
          <p className="text-sm text-gray-500 mt-1">Histórico completo de todas as operações do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Operações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Criações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.byAction?.INSERT || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Atualizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.byAction?.UPDATE || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Exclusões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.byAction?.DELETE || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={filters.entityType} onValueChange={(v) => setFilters({ ...filters, entityType: v })}>
              <SelectTrigger><SelectValue placeholder="Tipo de Entidade" /></SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type === "all" ? "Todas" : type.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
              <SelectTrigger><SelectValue placeholder="Tipo de Ação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
            <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]" />
            </div>
          ) : data?.logs && data.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" />{formatDate(log.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center"><User className="w-3 h-3 text-[#22C55E]" /></div>
                          <span className="text-sm font-medium">{log.user_name || "Sistema"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm capitalize">{log.entity_type?.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">{log.entity_id?.substring(0, 8)}...</td>
                      <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-3"><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
              <p>Nenhum registro encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Mostrando {page * limit + 1} - {Math.min((page + 1) * limit, data.total)} de {data.total}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Anterior</Button>
            <Button variant="outline" onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= data.total}>Próximo</Button>
          </div>
        </div>
      )}
    </div>
  )
}
