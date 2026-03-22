"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  History,
  DollarSign,
  Loader2
} from "lucide-react"
import { trpc } from "@/trpc/client"

interface CashSummary {
  saldo_atual: number
  total_entradas: number
  total_saidas: number
  total_aportes: number
  total_retiradas: number
  total_emprestimos_liberados: number
  total_pagamentos_recebidos: number
  total_ajustes: number
  total_transactions: number
}

interface Transaction {
  id: string
  tipo: "entrada" | "saida"
  categoria: string
  valor: number
  data_transacao: string
  descricao: string
  usuario_responsavel: string
  saldo_antes: number
  saldo_depois: number
  justificativa: string | null
}

const categoryLabels: Record<string, string> = {
  aporte: "Aporte",
  pagamento_recebido: "Pagamento Recebido",
  emprestimo_liberado: "Empréstimo Liberado",
  retirada: "Retirada",
  ajuste: "Ajuste",
}

const categoryColors: Record<string, string> = {
  aporte: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  pagamento_recebido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  emprestimo_liberado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  retirada: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  ajuste: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
}

const categoriesByType: Record<string, { value: string; label: string }[]> = {
  entrada: [
    { value: "pagamento_recebido", label: "Pagamento Recebido" },
    { value: "aporte", label: "Aporte" },
    { value: "ajuste", label: "Ajuste (positivo)" },
  ],
  saida: [
    { value: "emprestimo_liberado", label: "Empréstimo Liberado" },
    { value: "retirada", label: "Retirada" },
    { value: "ajuste", label: "Ajuste (negativo)" },
  ],
}

export default function CashPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [filterCategoria, setFilterCategoria] = useState<string>("all")
  const [filterDataInicio, setFilterDataInicio] = useState<string>("")
  const [filterDataFim, setFilterDataFim] = useState<string>("")

  // Dialog states
  const [aporteOpen, setAporteOpen] = useState(false)
  const [retiradaOpen, setRetiradaOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)

  // Form states
  const [aporteForm, setAporteForm] = useState({ valor: "", descricao: "" })
  const [retiradaForm, setRetiradaForm] = useState({ valor: "", descricao: "", justificativa: "" })
  const [ajusteForm, setAjusteForm] = useState({ valor: "", descricao: "", justificativa: "", positivo: true })

  // Queries
  const { data: summaryData, refetch: refetchSummary } = trpc.cash.getSummary.useQuery()
  const { data: transactionsData, refetch: refetchTransactions, isRefetching } = trpc.cash.listTransactions.useQuery({
    limit: 50,
    offset: 0,
    tipo: filterTipo === "all" ? undefined : filterTipo as "entrada" | "saida",
    categoria: filterCategoria === "all" ? undefined : filterCategoria as any,
    dataInicio: filterDataInicio || undefined,
    dataFim: filterDataFim || undefined,
  })

  const registerContribution = trpc.cash.registerContribution.useMutation({
    onSuccess: () => {
      toast({ title: "Aporte registrado com sucesso!" })
      refetchSummary()
      refetchTransactions()
      setAporteOpen(false)
      setAporteForm({ valor: "", descricao: "" })
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar aporte", description: error.message, variant: "destructive" })
    },
  })

  const registerWithdrawal = trpc.cash.registerWithdrawal.useMutation({
    onSuccess: () => {
      toast({ title: "Retirada registrada com sucesso!" })
      refetchSummary()
      refetchTransactions()
      setRetiradaOpen(false)
      setRetiradaForm({ valor: "", descricao: "", justificativa: "" })
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar retirada", description: error.message, variant: "destructive" })
    },
  })

  const registerAdjustment = trpc.cash.registerAdjustment.useMutation({
    onSuccess: () => {
      toast({ title: "Ajuste registrado com sucesso!" })
      refetchSummary()
      refetchTransactions()
      setAjusteOpen(false)
      setAjusteForm({ valor: "", descricao: "", justificativa: "", positivo: true })
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar ajuste", description: error.message, variant: "destructive" })
    },
  })

  // Update data when queries return
  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData as CashSummary)
    }
    setLoading(false)
  }, [summaryData])

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData as Transaction[])
    }
  }, [transactionsData])

  // Handle tipo change - reset categoria
  const handleTipoChange = (value: string) => {
    setFilterTipo(value)
    setFilterCategoria("all")
  }

  const formatCurrency = (value: number | undefined | null) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const handleAporte = () => {
    const valor = parseFloat(aporteForm.valor.replace(",", "."))
    if (!valor || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    if (!aporteForm.descricao) {
      toast({ title: "Descrição obrigatória", variant: "destructive" })
      return
    }
    registerContribution.mutate({ valor, descricao: aporteForm.descricao })
  }

  const handleRetirada = () => {
    const valor = parseFloat(retiradaForm.valor.replace(",", "."))
    if (!valor || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    if (!retiradaForm.justificativa) {
      toast({ title: "Justificativa obrigatória", variant: "destructive" })
      return
    }
    registerWithdrawal.mutate({
      valor,
      descricao: retiradaForm.descricao || "Retirada",
      justificativa: retiradaForm.justificativa,
    })
  }

  const handleAjuste = () => {
    const valor = parseFloat(ajusteForm.valor.replace(",", "."))
    if (!valor || valor <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" })
      return
    }
    if (!ajusteForm.descricao || !ajusteForm.justificativa) {
      toast({ title: "Descrição e justificativa obrigatórias", variant: "destructive" })
      return
    }
    registerAdjustment.mutate({
      valor,
      descricao: ajusteForm.descricao,
      justificativa: ajusteForm.justificativa,
      positivo: ajusteForm.positivo,
    })
  }

  const clearFilters = () => {
    setFilterTipo("all")
    setFilterCategoria("all")
    setFilterDataInicio("")
    setFilterDataFim("")
  }

  const availableCategories = filterTipo === "all" 
    ? Object.entries(categoryLabels).map(([v, l]) => ({ value: v, label: l }))
    : categoriesByType[filterTipo as keyof typeof categoriesByType] || []

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Caixa
          </h1>
          <p className="text-sm text-muted-foreground">Controle de entradas e saídas</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => { refetchSummary(); refetchTransactions() }}>
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Saldo Atual */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Saldo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary?.saldo_atual)}
          </p>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Dialog open={aporteOpen} onOpenChange={setAporteOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 bg-green-600 hover:bg-green-700">
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Novo Aporte
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Aporte</DialogTitle>
              <DialogDescription>
                Adicionar dinheiro ao caixa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <CurrencyInput
                  placeholder="0,00"
                  value={aporteForm.valor}
                  onChange={(value) => setAporteForm({ ...aporteForm, valor: value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Depósito inicial"
                  value={aporteForm.descricao}
                  onChange={(e) => setAporteForm({ ...aporteForm, descricao: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAporteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAporte} disabled={registerContribution.isPending}>
                {registerContribution.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={retiradaOpen} onOpenChange={setRetiradaOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 bg-red-600 hover:bg-red-700">
              <ArrowDownCircle className="mr-2 h-5 w-5" />
              Nova Retirada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Retirada</DialogTitle>
              <DialogDescription>
                Remover dinheiro do caixa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <CurrencyInput
                  placeholder="0,00"
                  value={retiradaForm.valor}
                  onChange={(value) => setRetiradaForm({ ...retiradaForm, valor: value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Retirada de lucro"
                  value={retiradaForm.descricao}
                  onChange={(e) => setRetiradaForm({ ...retiradaForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Justificativa (obrigatória)</Label>
                <Textarea
                  placeholder="Explique o motivo..."
                  value={retiradaForm.justificativa}
                  onChange={(e) => setRetiradaForm({ ...retiradaForm, justificativa: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRetiradaOpen(false)}>Cancelar</Button>
              <Button onClick={handleRetirada} disabled={registerWithdrawal.isPending} className="bg-red-600 hover:bg-red-700">
                {registerWithdrawal.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
          <DialogTrigger asChild>
            <Button className="h-16 bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="mr-2 h-5 w-5" />
              Ajuste Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajuste Manual</DialogTitle>
              <DialogDescription>
                Corrigir saldo do caixa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={ajusteForm.positivo ? "positivo" : "negativo"}
                  onValueChange={(v) => setAjusteForm({ ...ajusteForm, positivo: v === "positivo" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positivo">Positivo (+)</SelectItem>
                    <SelectItem value="negativo">Negativo (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <CurrencyInput
                  placeholder="0,00"
                  value={ajusteForm.valor}
                  onChange={(value) => setAjusteForm({ ...ajusteForm, valor: value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Correção de saldo"
                  value={ajusteForm.descricao}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Justificativa (obrigatória)</Label>
                <Textarea
                  placeholder="Explique o motivo..."
                  value={ajusteForm.justificativa}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, justificativa: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAjusteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAjuste} disabled={registerAdjustment.isPending} className="bg-purple-600 hover:bg-purple-700">
                {registerAdjustment.isPending ? "Salvando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Entradas</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary?.total_entradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span>Saídas</span>
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summary?.total_saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpCircle className="h-4 w-4 text-blue-500" />
              <span>Aportes</span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(summary?.total_aportes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownCircle className="h-4 w-4 text-orange-500" />
              <span>Retiradas</span>
            </div>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary?.total_retiradas)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Transações
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {summary?.total_transactions || 0} transações
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterTipo} onValueChange={handleTipoChange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filterCategoria} 
              onValueChange={setFilterCategoria}
              disabled={filterTipo === "all" && availableCategories.length <= 1}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="w-40"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
              placeholder="De"
            />

            <Input
              type="date"
              className="w-40"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
              placeholder="Até"
            />

            {(filterTipo !== "all" || filterCategoria !== "all" || filterDataInicio || filterDataFim) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar
              </Button>
            )}
          </div>

          {/* Lista de Transações */}
          <div className="space-y-2">
            {isRefetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação encontrada
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {tx.tipo === "entrada" ? (
                      <ArrowUpCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{tx.descricao || categoryLabels[tx.categoria]}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={categoryColors[tx.categoria]}>
                          {categoryLabels[tx.categoria]}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(tx.data_transacao)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                      {tx.tipo === "entrada" ? "+" : "-"}{formatCurrency(tx.valor)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {formatCurrency(tx.saldo_depois)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
