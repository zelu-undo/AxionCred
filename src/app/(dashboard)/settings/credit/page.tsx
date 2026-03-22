"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Save, AlertTriangle, HelpCircle, Lock } from "lucide-react"
import { trpc } from "@/trpc/client"

export default function CreditSettingsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Check if user is owner
  const isOwner = user?.role === "owner"
  
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
    // Pesos do Score (visível apenas para owner)
    score_payment_weight: 30,
    score_time_weight: 25,
    score_default_weight: 20,
    score_usage_weight: 15,
    score_stability_weight: 10,
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
        // Score weights
        score_payment_weight: settings.score_payment_weight || 30,
        score_time_weight: settings.score_time_weight || 25,
        score_default_weight: settings.score_default_weight || 20,
        score_usage_weight: settings.score_usage_weight || 15,
        score_stability_weight: settings.score_stability_weight || 10,
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
    <TooltipProvider>
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

      {/* Legenda de Classificação de Risco - SEGUNDO */}
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

      {/* Configurações de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Caixa</CardTitle>
          <CardDescription>Defina como o sistema gerencia a alocação de recursos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Percentual Máximo do Caixa Utilizável (%)</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Define a porcentagem do caixa disponível total que pode ser utilizada para novos empréstimos. Isso garante que sempre haja reserva para operações.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
              <div className="flex items-center gap-2">
                <Label>Comportamento ao Atingir Limite</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Bloquear:</strong> Impede a criação de novos empréstimos quando o limite de caixa for atingido.</p>
                    <p className="mt-2"><strong>Alertar:</strong> Permite criar o empréstimo, mas exibe um aviso ao operador.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.block_on_box_limit ? "block" : "warn"}
                onValueChange={(value) => setFormData({ ...formData, block_on_box_limit: value === "block" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Bloquear novos empréstimos</SelectItem>
                  <SelectItem value="warn">Apenas alertar</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="flex items-center gap-2">
                <Label>Score Mínimo para Aprovação Automática</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Score mínimo para que um empréstimo seja aprovado automaticamente. Clientes com score abaixo deste valor precisam de aprovação manual.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                min={0}
                max={1000}
                value={formData.min_score_for_approval}
                onChange={(e) => setFormData({ ...formData, min_score_for_approval: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Comportamento quando Score Abaixo do Mínimo</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Negar automaticamente:</strong> Bloqueia o empréstimo se o score estiver abaixo do mínimo.</p>
                    <p className="mt-2"><strong>Apenas alertar:</strong> Permite criar o empréstimo com aviso, mas precisa de aprovação manual.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
          </div>

          {/* Pesos do Score - Only for Owner */}
          {isOwner ? (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">Pesos do Cálculo de Score</h4>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Configure a importância de cada fator no cálculo do score final do cliente. A soma deve ser igual a 100%.</p>
                  <p className="mt-2">Cada owner pode ter sua própria configuração de pesos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-gray-500 mb-4">Ajuste a importância de cada fator no cálculo do score. O total deve ser 100%.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Pagamento (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3 w-3 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Peso do histórico de pagamentos. Clientes que pagam em dia têm score maior.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.score_payment_weight}
                  onChange={(e) => setFormData({ ...formData, score_payment_weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Tempo (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3 w-3 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Peso do tempo de relacionamento. Quanto mais tempo o cliente está com você, maior o score.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.score_time_weight}
                  onChange={(e) => setFormData({ ...formData, score_time_weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Inadimplência (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3 w-3 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Peso da ausência de inadimplência. Clientes sem débitos vencidos têm score maior.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.score_default_weight}
                  onChange={(e) => setFormData({ ...formData, score_default_weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Uso Crédito (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3 w-3 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Peso do uso de crédito. Considera o limite utilizado vs disponível.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.score_usage_weight}
                  onChange={(e) => setFormData({ ...formData, score_usage_weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Estabilidade (%)</Label>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-3 w-3 text-gray-400" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Peso da estabilidade. Considera Consistency de pagamentos e tempo no cadastro.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.score_stability_weight}
                  onChange={(e) => setFormData({ ...formData, score_stability_weight: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className={formData.score_payment_weight + formData.score_time_weight + formData.score_default_weight + formData.score_usage_weight + formData.score_stability_weight === 100 ? "text-green-600" : "text-red-600"}>
                Total: {formData.score_payment_weight + formData.score_time_weight + formData.score_default_weight + formData.score_usage_weight + formData.score_stability_weight}%
              </span>
              {formData.score_payment_weight + formData.score_time_weight + formData.score_default_weight + formData.score_usage_weight + formData.score_stability_weight !== 100 && (
                <span className="text-red-500 ml-2">(deve ser 100%)</span>
              )}
            </div>
          </div>
          ) : (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500">
                <Lock className="h-4 w-4" />
                <p className="text-sm">Os pesos do cálculo de score são configurados apenas pelo proprietário (owner) da conta.</p>
              </div>
            </div>
          )}
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
              <div className="flex items-center gap-2">
                <Label>Percentual Máximo do Caixa por Cliente (%)</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Porcentagem do caixa total que pode ser alocada para um único cliente. Isso evita que um cliente comprometa todo o caixa da empresa.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.max_box_percentage_per_client}
                onChange={(e) => setFormData({ ...formData, max_box_percentage_per_client: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Número Máximo de Empréstimos Ativos por Cliente</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Limite de empréstimos ativos que um cliente pode ter simultaneamente. Ajuda a controlar o risco de concentração.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.max_active_loans_per_customer}
                onChange={(e) => setFormData({ ...formData, max_active_loans_per_customer: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Comportamento ao Exceder Limite do Cliente</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p><strong>Bloquear:</strong> Não permite criar empréstimo que exceda o limite do cliente.</p>
                  <p className="mt-2"><strong>Alertar:</strong> Permite criar com aviso, mas exige aprovação manual.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.client_limit_mandatory ? "mandatory" : "optional"}
              onValueChange={(value) => setFormData({ ...formData, client_limit_mandatory: value === "mandatory" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mandatory">Bloquear - Não permite exceder limite</SelectItem>
                <SelectItem value="optional">Alertar - Permite aprovação manual</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Permitir Refinanciamento</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p><strong>Sim:</strong> Permite criar novos empréstimos baseados em anteriores (refinanciamento).</p>
                  <p className="mt-2"><strong>Não:</strong> Bloqueia a criação de novos empréstimos para clientes com empréstimos ativos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.allow_refinancing ? "allow" : "disallow"}
              onValueChange={(value) => setFormData({ ...formData, allow_refinancing: value === "allow" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Sim - Permite criar novos empréstimos baseados em anteriores</SelectItem>
                <SelectItem value="disallow">Não - Bloqueia refinancing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.allow_refinancing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Estratégia de Refinanciamento</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle className="h-4 w-4 text-gray-400" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>Quitar automaticamente:</strong> O sistema quita o empréstimo anterior e cria um novo com o valor solicitado.</p>
                    <p className="mt-2"><strong>Somar saldo:</strong> O novo empréstimo inclui o saldo devedor anterior + novo valor solicitado.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
    </TooltipProvider>
  )
}