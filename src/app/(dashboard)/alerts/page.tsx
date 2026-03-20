'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { FilterBar } from "@/components/ui/empty-state"
import { 
  Bell, 
  CreditCard, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Check,
  X,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
}

const alertTypeConfig = {
  credit: {
    label: 'Crédito',
    icon: CreditCard,
    bgGradient: 'from-red-500/10 to-red-600/5',
    borderColor: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  operational: {
    label: 'Operacional',
    icon: Settings,
    bgGradient: 'from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  strategic: {
    label: 'Estratégico',
    icon: TrendingUp,
    bgGradient: 'from-green-500/10 to-green-600/5',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
}

const priorityConfig = {
  high: {
    label: 'Alta',
    color: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  medium: {
    label: 'Média',
    color: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    label: 'Baixa',
    color: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
  },
}

export default function AlertsPage() {
  const [alerts] = useState<Alert[]>([
    { id: '1', type: 'credit', title: 'Parcela vencida há 5 dias', message: 'João Silva tem parcela de R$ 1.250 vencida', priority: 'high', timestamp: '2024-02-15 10:30' },
    { id: '2', type: 'credit', title: 'Parcela vence amanhã', message: 'Maria Santos tem parcela de R$ 850 vence em 1 dia', priority: 'medium', timestamp: '2024-02-15 09:00' },
    { id: '3', type: 'credit', title: 'Cliente inadimplente', message: 'Pedro Costa está inadimplente há 45 dias', priority: 'high', timestamp: '2024-02-15 08:00' },
    { id: '4', type: 'operational', title: 'Pagamento registrado', message: 'Novo pagamento de R$ 1.250 recebido', priority: 'low', timestamp: '2024-02-15 11:00' },
    { id: '5', type: 'strategic', title: 'Aumento de inadimplência', message: 'Taxa de inadimplência subiu 5% esta semana', priority: 'high', timestamp: '2024-02-15 07:00' },
  ])

  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = !typeFilter || alert.type === typeFilter
    const matchesPriority = !priorityFilter || alert.priority === priorityFilter
    const matchesSearch = !searchQuery || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesPriority && matchesSearch
  })

  const creditCount = alerts.filter(a => a.type === 'credit').length
  const operationalCount = alerts.filter(a => a.type === 'operational').length
  const strategicCount = alerts.filter(a => a.type === 'strategic').length
  const highPriorityCount = alerts.filter(a => a.priority === 'high').length

  const clearFilters = () => {
    setTypeFilter('')
    setPriorityFilter('')
    setSearchQuery('')
  }

  const hasActiveFilters = typeFilter || priorityFilter || searchQuery

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-[#22C55E]" />
            Alertas Inteligentes
          </h1>
          <p className="text-gray-500 mt-1">Monitore eventos importantes do seu negócio</p>
        </div>
      </div>

      {/* Stats Cards - Premium */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="h-1.5 bg-red-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Crédito</p>
                <p className="text-2xl font-bold text-gray-900">{creditCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="h-1.5 bg-blue-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Operacional</p>
                <p className="text-2xl font-bold text-gray-900">{operationalCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="h-1.5 bg-green-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estratégico</p>
                <p className="text-2xl font-bold text-gray-900">{strategicCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="h-1.5 bg-red-500" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Alta Prioridade</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="pt-6">
          <FilterBar
            searchPlaceholder="Buscar alertas..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={[
              {
                label: "Tipo",
                value: "type",
                options: [
                  { label: "Todos", value: "" },
                  { label: "Crédito", value: "credit" },
                  { label: "Operacional", value: "operational" },
                  { label: "Estratégico", value: "strategic" },
                ]
              },
              {
                label: "Prioridade",
                value: "priority",
                options: [
                  { label: "Todas", value: "" },
                  { label: "Alta", value: "high" },
                  { label: "Média", value: "medium" },
                  { label: "Baixa", value: "low" },
                ]
              }
            ]}
            activeFilters={{
              "Tipo": typeFilter,
              "Prioridade": priorityFilter
            }}
            onFilterChange={(key, value) => {
              if (key === "Tipo") setTypeFilter(value)
              if (key === "Prioridade") setPriorityFilter(value)
            }}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Alerts List - Premium */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#22C55E]" />
              Todos os Alertas
            </CardTitle>
            <Badge variant="outline" className="bg-gray-50">
              {filteredAlerts.length} registros
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={<Filter className="h-10 w-10 text-gray-400" />}
                title="Nenhum alerta encontrado"
                description="Tente ajustar seus filtros para encontrar o que procura."
                action={{
                  label: "Limpar filtros",
                  onClick: clearFilters
                }}
              />
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-10 w-10 text-green-500" />}
                title="Nenhum alerta no momento!"
                description="Tudo está em ordem. Volte mais tarde para verificar novos alertas."
              />
            )
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => {
                const typeConfig = alertTypeConfig[alert.type as keyof typeof alertTypeConfig]
                const priorityConfigItem = priorityConfig[alert.priority as keyof typeof priorityConfig]
                const TypeIcon = typeConfig?.icon || Bell

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative overflow-hidden rounded-xl border ${typeConfig?.borderColor || 'border-gray-200'} bg-gradient-to-r ${typeConfig?.bgGradient || 'from-gray-50 to-gray-100'} p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.01]`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${typeConfig?.iconBg || 'bg-gray-100'} ${typeConfig?.iconColor || 'text-gray-600'}`}>
                          <TypeIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfigItem?.badge || 'bg-gray-100 text-gray-700'}`}>
                              {priorityConfigItem?.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${priorityConfigItem?.color || 'bg-gray-500'}`} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
