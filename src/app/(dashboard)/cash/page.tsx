"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Minus,
  RefreshCw,
  Filter,
  Calendar,
  ArrowRight,
  History,
  DollarSign
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
  referencia_id: string | null
  referencia_tipo: string | null
}

const categoryLabels: Record<string, string> = {
  aporte: "Aporte",
  pagamento_recebido: "Pagamento Recebido",
  emprestimo_liberado: "Empréstimo Liberado",
  retirada: "Retirada",
  ajuste: "Ajuste",
}

const categoryColors: Record<string, string> = {
  aporte: "bg-green-100 text-green-800",
  pagamento_recebido: "bg-blue-100 text-blue-800",
  emprestimo_liberado: "bg-red-100 text-red-800",
  retirada: "bg-orange-100 text-orange-800",
  ajuste: "bg-purple-100 text-purple-800",
}

export default function CashPage() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<CashSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<"entrada" | "saida" | "">("")
  const [filterCategoria, setFilterCategoria] = useState<"aporte" | "pagamento_recebido" | "emprestimo_liberado" | "retirada" | "ajuste" | "">("")

  // Handler for filter changes
  const handleFilterTipoChange = (value: string) => {
    setFilterTipo(value as "entrada" | "saida" | "")
  }

  const handleFilterCategoriaChange = (value: string) => {
    setFilterCategoria(value as "aporte" | "pagamento_recebido" | "emprestimo_liberado" | "retirada" | "ajuste" | "")
  }

  // Dialog states
  const [aporteOpen, setAporteOpen] = useState(false)
  const [retiradaOpen, setRetiradaOpen] = useState(false)
  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [aporteForm, setAporteForm] = useState({ valor: "", descricao: "" })
  const [retiradaForm, setRetiradaForm] = useState({ valor: "", descricao: "", justificativa: "" })
  const [ajusteForm, setAjusteForm] = useState({ valor: "", descricao: "", justificativa: "", positivo: true })

  // Queries
  const { data: summaryData, refetch: refetchSummary } = trpc.cash.getSummary.useQuery()

  const { data: transactionsData, refetch: refetchTransactions } = trpc.cash.listTransactions.useQuery({
    limit: 50,
    offset: 0,
    tipo: filterTipo === "" ? undefined : filterTipo,
    categoria: filterCategoria === "" ? undefined : filterCategoria,
  })

  // Handle data updates
  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData as CashSummary)
    }
  }, [summaryData])

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData as Transaction[])
    }
  }, [transactionsData])

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

  useEffect(() => {
    if (transactionsData) {
      setTransactions(transactionsData as Transaction[])
    }
  }, [transactionsData])

  useEffect(() => {
    if (summaryData) {
      setSummary(summaryData as CashSummary)
    }
    setLoading(false)
  }, [summaryData])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
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
    if (!retiradaForm.descricao || !retiradaForm.justificativa) {
      toast({ title: "Descrição e justificativa obrigatórias", variant: "destructive" })
      return
    }
    registerWithdrawal.mutate({
      valor,
      descricao: retiradaForm.descricao,
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Gestão de Caixa
          </h1>
          <p className="text-gray-500">Controle de entradas e saídas do caixa</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => { refetchSummary(); refetchTransactions() }}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Saldo Atual */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Saldo Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">
            {formatCurrency(summary?.saldo_atual || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Dialog open={aporteOpen} onOpenChange={setAporteOpen}>
          <DialogTrigger asChild>
            <Button className="h-20 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
              <ArrowUpCircle className="h-6 w-6" />
              <span>Novo Aporte</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Aporte</DialogTitle>
              <DialogDescription>
                Adicionar dinheiro ao caixa (depósito inicial, investimento, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={aporteForm.valor}
                  onChange={(e) => setAporteForm({ ...aporteForm, valor: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Depósito inicial, Investimento..."
                  value={aporteForm.descricao}
                  onChange={(e) => setAporteForm({ ...aporteForm, descricao: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAporteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAporte} disabled={registerContribution.isPending}>
                {registerContribution.isPending ? "Salvando..." : "Confirmar Aporte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={retiradaOpen} onOpenChange={setRetiradaOpen}>
          <DialogTrigger asChild>
            <Button className="h-20 flex flex-col gap-2 bg-red-600 hover:bg-red-700">
              <ArrowDownCircle className="h-6 w-6" />
              <span>Nova Retirada</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Retirada</DialogTitle>
              <DialogDescription>
                Remover dinheiro do caixa (sangria, retirada de lucro, custos)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={retiradaForm.valor}
                  onChange={(e) => setRetiradaForm({ ...retiradaForm, valor: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Retirada de lucro, Pagamento de fornecedor..."
                  value={retiradaForm.descricao}
                  onChange={(e) => setRetiradaForm({ ...retiradaForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Justificativa (obrigatória)</Label>
                <Textarea
                  placeholder="Explique o motivo da retirada..."
                  value={retiradaForm.justificativa}
                  onChange={(e) => setRetiradaForm({ ...retiradaForm, justificativa: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRetiradaOpen(false)}>Cancelar</Button>
              <Button onClick={handleRetirada} disabled={registerWithdrawal.isPending} className="bg-red-600 hover:bg-red-700">
                {registerWithdrawal.isPending ? "Salvando..." : "Confirmar Retirada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={ajusteOpen} onOpenChange={setAjusteOpen}>
          <DialogTrigger asChild>
            <Button className="h-20 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="h-6 w-6" />
              <span>Ajuste Manual</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajuste Manual de Saldo</DialogTitle>
              <DialogDescription>
                Corrigir o saldo do caixa (positivo ou negativo)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Ajuste</Label>
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
                <Input
                  type="text"
                  placeholder="0,00"
                  value={ajusteForm.valor}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, valor: e.target.value })}
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Correção de saldo, Erro de lançamento..."
                  value={ajusteForm.descricao}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <Label>Justificativa (obrigatória)</Label>
                <Textarea
                  placeholder="Explique o motivo do ajuste..."
                  value={ajusteForm.justificativa}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, justificativa: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAjusteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAjuste} disabled={registerAdjustment.isPending} className="bg-purple-600 hover:bg-purple-700">
                {registerAdjustment.isPending ? "Salvando..." : "Confirmar Ajuste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Total Entradas</span>
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(summary?.total_entradas || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Total Saídas</span>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary?.total_saidas || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-600">
              <ArrowUpCircle className="h-4 w-4" />
              <span className="text-sm">Aportes</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary?.total_aportes || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-600">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm">Retiradas</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(summary?.total_retiradas || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Transações
          </CardTitle>
          <CardDescription>
            {summary?.total_transactions || 0} transações registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <Select value={filterTipo} onValueChange={handleFilterTipoChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={handleFilterCategoriaChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="aporte">Aporte</SelectItem>
                <SelectItem value="pagamento_recebido">Pagamento Recebido</SelectItem>
                <SelectItem value="emprestimo_liberado">Empréstimo Liberado</SelectItem>
                <SelectItem value="retirada">Retirada</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Transações */}
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma transação encontrada</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {tx.tipo === "entrada" ? (
                      <ArrowUpCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{tx.descricao || categoryLabels[tx.categoria]}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge className={categoryColors[tx.categoria]}>
                          {categoryLabels[tx.categoria]}
                        </Badge>
                        <span>•</span>
                        <span>{formatDate(tx.data_transacao)}</span>
                        <span>•</span>
                        <span className="text-xs">{tx.usuario_responsavel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.tipo === "entrada" ? "text-green-600" : "text-red-600"}`}>
                      {tx.tipo === "entrada" ? "+" : "-"}{formatCurrency(tx.valor)}
                    </p>
                    <p className="text-xs text-gray-500">
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
