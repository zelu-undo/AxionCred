'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CreditCard, Settings, TrendingUp, Bell, DollarSign, Clock, UserX, Loader2 } from "lucide-react"
import { trpc } from "@/trpc/client"

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
}

type FilterType = 'all' | 'credit' | 'operational' | 'strategic' | 'high';

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  
  // Fetch real alerts from the API
  const { data: overdueData, isLoading: loadingOverdue } = trpc.payment.list.useQuery({
    overdueOnly: true,
    limit: 20,
  }, { refetchOnMount: true })
  
  const { data: todayData, isLoading: loadingToday } = trpc.payment.list.useQuery({
    todayOnly: true,
    limit: 20,
  }, { refetchOnMount: true })
  
  // Transform API data into alerts
  const alerts: Alert[] = useMemo(() => {
    const result: Alert[] = []
    const now = new Date()
    
    // Add overdue payment alerts
    if (overdueData?.payments) {
      overdueData.payments.forEach((p) => {
        const dueDate = new Date(p.due_date)
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        result.push({
          id: p.id,
          type: 'credit',
          title: daysOverdue > 30 ? 'Cliente inadimplente' : `Parcela vencida há ${daysOverdue} dias`,
          message: `${p.customer_name} tem parcela de R$ ${(p.amount_due - (p.amount_paid || 0)).toFixed(2)} vencida`,
          priority: daysOverdue > 30 ? 'high' : daysOverdue > 7 ? 'high' : 'medium',
          timestamp: dueDate.toLocaleString('pt-BR'),
        })
      })
    }
    
    // Add today's payment alerts
    if (todayData?.payments) {
      todayData.payments.forEach((p) => {
        result.push({
          id: p.id + '-today',
          type: 'operational',
          title: 'Parcela vence hoje',
          message: `${p.customer_name} tem parcela de R$ ${(p.amount_due - (p.amount_paid || 0)).toFixed(2)} vence hoje`,
          priority: 'medium',
          timestamp: new Date().toLocaleString('pt-BR'),
        })
      })
    }
    
    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    })
  }, [overdueData, todayData])

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'credit': 
        return { 
          bg: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200', 
          text: 'text-red-700',
          icon: CreditCard,
          iconBg: 'bg-red-100'
        };
      case 'operational': 
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200', 
          text: 'text-blue-700',
          icon: Settings,
          iconBg: 'bg-blue-100'
        };
      case 'strategic': 
        return { 
          bg: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200', 
          text: 'text-emerald-700',
          icon: TrendingUp,
          iconBg: 'bg-emerald-100'
        };
      default: 
        return { 
          bg: 'bg-gray-50 border-gray-200', 
          text: 'text-gray-700',
          icon: Bell,
          iconBg: 'bg-gray-100'
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-red-500', label: 'Alta' };
      case 'medium': return { bg: 'bg-yellow-500', label: 'Média' };
      case 'low': return { bg: 'bg-green-500', label: 'Baixa' };
      default: return { bg: 'bg-gray-500', label: 'Normal' };
    }
  };

  const isLoading = loadingOverdue || loadingToday
  const creditCount = alerts.filter(a => a.type === 'credit').length;
  const operationalCount = alerts.filter(a => a.type === 'operational').length;
  const strategicCount = alerts.filter(a => a.type === 'strategic').length;
  const highPriorityCount = alerts.filter(a => a.priority === 'high').length;

  // Filter alerts based on active filter
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'high') return alert.priority === 'high'
    return alert.type === activeFilter
  })

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter)
  }

  return (
    isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#22C55E]" />
        <span className="ml-2 text-gray-500">Carregando alertas...</span>
      </div>
    ) : (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Alertas Inteligentes</h1>
        <p className="text-gray-500 mt-1">Monitore alertas importantes do seu negócio</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={() => handleFilterClick('credit')}
            className={`w-full text-left transition-all duration-300 ${
              activeFilter === 'credit' 
                ? 'ring-2 ring-[#22C55E] ring-offset-2' 
                : 'hover:shadow-md'
            }`}
          >
            <Card className={`border-gray-200/60 shadow-sm ${activeFilter === 'credit' ? 'bg-green-50 border-[#22C55E]' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <CreditCard className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Crédito</p>
                    <p className="text-2xl font-bold text-gray-900">{creditCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={() => handleFilterClick('operational')}
            className={`w-full text-left transition-all duration-300 ${
              activeFilter === 'operational' 
                ? 'ring-2 ring-[#22C55E] ring-offset-2' 
                : 'hover:shadow-md'
            }`}
          >
            <Card className={`border-gray-200/60 shadow-sm ${activeFilter === 'operational' ? 'bg-green-50 border-[#22C55E]' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Operacional</p>
                    <p className="text-2xl font-bold text-gray-900">{operationalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => handleFilterClick('strategic')}
            className={`w-full text-left transition-all duration-300 ${
              activeFilter === 'strategic' 
                ? 'ring-2 ring-[#22C55E] ring-offset-2' 
                : 'hover:shadow-md'
            }`}
          >
            <Card className={`border-gray-200/60 shadow-sm ${activeFilter === 'strategic' ? 'bg-green-50 border-[#22C55E]' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estratégico</p>
                    <p className="text-2xl font-bold text-gray-900">{strategicCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={() => handleFilterClick('high')}
            className={`w-full text-left transition-all duration-300 ${
              activeFilter === 'high' 
                ? 'ring-2 ring-[#22C55E] ring-offset-2' 
                : 'hover:shadow-md'
            }`}
          >
            <Card className={`border-gray-200/60 shadow-sm ${activeFilter === 'high' ? 'bg-green-50 border-[#22C55E]' : ''} border-l-4 border-red-500`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Alta Prioridade</p>
                    <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        </motion.div>
      </div>

      {/* Filter indicator */}
      {activeFilter !== 'all' && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
          <span className="text-sm text-gray-600">
            Filtrando por: <span className="font-semibold text-gray-900">
              {activeFilter === 'high' ? 'Alta Prioridade' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </span>
          </span>
          <button 
            onClick={() => setActiveFilter('all')}
            className="text-sm text-[#22C55E] hover:underline"
          >
            Limpar filtro
          </button>
        </div>
      )}

      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <CardTitle className="text-lg font-semibold">Todos os Alertas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum alerta encontrado para o filtro selecionado.</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredAlerts.map((alert, index) => {
                const config = getTypeConfig(alert.type);
                const priorityConfig = getPriorityConfig(alert.priority);
                const IconComponent = config.icon;
                
                return (
                  <motion.div 
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      p-4 rounded-lg border ${config.bg}
                      hover:shadow-md transition-all duration-200
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.iconBg}`}>
                          <IconComponent className={`h-5 w-5 ${config.text}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{alert.title}</div>
                          <div className="text-sm text-gray-600">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${priorityConfig.bg}`}>
                        {priorityConfig.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
    )
  );
}
