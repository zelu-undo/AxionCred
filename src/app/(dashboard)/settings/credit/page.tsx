"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, AlertTriangle } from "lucide-react"
import { trpc } from "@/trpc/client"

export default function CreditSettingsPage() {
  const { toast } = useToast()
  
  // Queries
  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = trpc.credit.getSettings.useQuery()
  const { data: cashFlow, isLoading: loadingCash } = trpc.credit.getCashFlow.useQuery()
  
  // Mutations
  const updateSettings = trpc.credit.updateSettings.useMutation({
    onSuccess: () => {
      toast({ title: "Configurações salvas com sucesso!" })
      refetchSettings()
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
    }
  })

  const [formData, setFormData] = useState({
    max_box_percentage: 80,
    block_on_box_limit: true,
    min_score_for_approval: 500,
    below_score_action: "deny" as "deny" | "warn",
    block_on_low_score: true,
    max_box_percentage_per_client: 20,
    client_limit_mandatory: false,
    max_active_loans_per_customer: 5,
    allow_refinancing: true,
    refinancing_strategy: "pay_off" as "pay_off" | "add_balance",
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setFormData({
        max_box_percentage: settings.max_box_percentage || 80,
        block_on_box_limit: settings.block_on_box_limit ?? true,
        min_score_for_approval: settings.min_score_for_approval || 500,
        below_score_action: settings.below_score_action || "deny",
        block_on_low_score: settings.block_on_low_score ?? true,
        max_box_percentage_per_client: settings.max_box_percentage_per_client || 20,
        client_limit_mandatory: settings.client_limit_mandatory ?? false,
        max_active_loans_per_customer: settings.max_active_loans_per_customer || 5,
        allow_refinancing: settings.allow_refinancing ?? true,
        refinancing_strategy: settings.refinancing_strategy || "pay_off",
      })
    }
  }, [settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings.mutateAsync(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value)
  }

  if (loadingSettings) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Crédito</h1>
          <p className="text-gray-500">Configure as regras de alocação de caixa e concessão de crédito</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>

      {/* Resumo do Caixa */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            Resumo do Caixa
          </CardTitle>
          <CardDescription>Visão geral da disponibilidade de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCash ? (
            <div className="animate-pulse flex gap-4">
              <div className="h-20 w-48 bg-gray-200 rounded"></div>
              <div className="h-20 w-48 bg-gray-200 rounded"></div>
              <div className="h-20 w-48 bg-gray-200 rounded"></div>
            </div>
          ) : cashFlow ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Recebido</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(cashFlow.total_received || 0)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total Liberado</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlow.total_disbursed || 0)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Caixa Disponível</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlow.available_cash || 0)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Caixa Utilizável ({formData.max_box_percentage}%)</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(cashFlow.usable_cash || 0)}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Carregando dados do caixa...</p>
          )}
        </CardContent>
      </Card>

      {/* Configurações de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Caixa</CardTitle>
          <CardDescription>Defina como o sistema gerencia a alocação de recursos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Percentual Máximo do Caixa Utilizável (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.max_box_percentage}
                onChange={(e) => setFormData({ ...formData, max_box_percentage: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Porcentagem do caixa disponível que pode ser alocada para novos empréstimos</p>
            </div>

            <div className="space-y-2">
              <Label>Comportamento ao Atingir Limite</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.block_on_box_limit}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_on_box_limit: checked })}
                />
                <span className="text-sm">
                  {formData.block_on_box_limit ? "Bloquear novos empréstimos" : "Apenas alertar"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Score */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Score</CardTitle>
          <CardDescription>Defina regras baseadas no score do cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Score Mínimo para Aprovação Automática</Label>
              <Input
                type="number"
                min={0}
                max={1000}
                value={formData.min_score_for_approval}
                onChange={(e) => setFormData({ ...formData, min_score_for_approval: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Clientes com score abaixo deste valor serão avaliados manualmente</p>
            </div>

            <div className="space-y-2">
              <Label>Comportamento quando Score Abaixo do Mínimo</Label>
              <Select
                value={formData.below_score_action}
                onValueChange={(value) => setFormData({ ...formData, below_score_action: value as "deny" | "warn" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deny">Negar automaticamente</SelectItem>
                  <SelectItem value="warn">Apenas alertar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.block_on_low_score}
                  onCheckedChange={(checked) => setFormData({ ...formData, block_on_low_score: checked })}
                />
                <Label>Bloquear automaticamente se abaixo do mínimo</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Limite por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Limite por Cliente</CardTitle>
          <CardDescription>Defina limites individuais baseados em renda e risco</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Percentual Máximo do Caixa por Cliente (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.max_box_percentage_per_client}
                onChange={(e) => setFormData({ ...formData, max_box_percentage_per_client: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">Porcentagem do caixa total que pode ser alocada para um único cliente</p>
            </div>

            <div className="space-y-2">
              <Label>Número Máximo de Empréstimos Ativos por Cliente</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.max_active_loans_per_customer}
                onChange={(e) => setFormData({ ...formData, max_active_loans_per_customer: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.client_limit_mandatory}
                  onCheckedChange={(checked) => setFormData({ ...formData, client_limit_mandatory: checked })}
                />
                <Label>Limite do cliente é obrigatório (bloqueia)</Label>
              </div>
              <p className="text-xs text-gray-500">
                {formData.client_limit_mandatory 
                  ? "O sistema bloqueará empréstimos que excedam o limite calculado" 
                  : "O sistema apenas alertará, mas permitirá a aprovação manual"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Refinanciamento */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Refinanciamento</CardTitle>
          <CardDescription>Configure as regras de roll-over de empréstimos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.allow_refinancing}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_refinancing: checked })}
                />
                <Label>Permitir Refinanciamento</Label>
              </div>
              <p className="text-xs text-gray-500">Permite criar novos empréstimos baseados em anteriores</p>
            </div>

            {formData.allow_refinancing && (
              <div className="space-y-2">
                <Label>Estratégia de Refinanciamento</Label>
                <Select
                  value={formData.refinancing_strategy}
                  onValueChange={(value) => setFormData({ ...formData, refinancing_strategy: value as "pay_off" | "add_balance" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pay_off">Quitar automaticamente o anterior</SelectItem>
                    <SelectItem value="add_balance">Somar saldo devedor ao novo valor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legenda de Classificação de Risco */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação de Risco</CardTitle>
          <CardDescription>Como o sistema classifica o risco do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="font-bold text-red-700">Muito Alto</p>
              <p className="text-sm text-red-600">Score 0-300</p>
              <p className="text-xs text-red-500">Fator: 0.20-0.39</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
              <p className="font-bold text-orange-700">Alto</p>
              <p className="text-sm text-orange-600">Score 301-600</p>
              <p className="text-xs text-orange-500">Fator: 0.40-0.69</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="font-bold text-yellow-700">Médio</p>
              <p className="text-sm text-yellow-600">Score 601-800</p>
              <p className="text-xs text-yellow-500">Fator: 0.70-0.89</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="font-bold text-green-700">Baixo</p>
              <p className="text-sm text-green-600">Score 801-1000</p>
              <p className="text-xs text-green-500">Fator: 0.90-1.00</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}