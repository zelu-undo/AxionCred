'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CreditCard, Settings, TrendingUp, Bell, DollarSign, Clock, UserX } from "lucide-react"

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: string;
}

export default function AlertsPage() {
  const [alerts] = useState<Alert[]>([
    { id: '1', type: 'credit', title: 'Parcela vencida há 5 dias', message: 'João Silva tem parcela de R$ 1.250 vencida', priority: 'high', timestamp: '2024-02-15 10:30' },
    { id: '2', type: 'credit', title: 'Parcela vence amanhã', message: 'Maria Santos tem parcela de R$ 850 vence em 1 dia', priority: 'medium', timestamp: '2024-02-15 09:00' },
    { id: '3', type: 'credit', title: 'Cliente inadimplente', message: 'Pedro Costa está inadimplente há 45 dias', priority: 'high', timestamp: '2024-02-15 08:00' },
    { id: '4', type: 'operational', title: 'Pagamento registrado', message: 'Novo pagamento de R$ 1.250 recebido', priority: 'low', timestamp: '2024-02-15 11:00' },
    { id: '5', type: 'strategic', title: 'Aumento de inadimplência', message: 'Taxa de inadimplência subiu 5% esta semana', priority: 'high', timestamp: '2024-02-15 07:00' },
  ]);

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

  const creditCount = alerts.filter(a => a.type === 'credit').length;
  const operationalCount = alerts.filter(a => a.type === 'operational').length;
  const strategicCount = alerts.filter(a => a.type === 'strategic').length;
  const highPriorityCount = alerts.filter(a => a.priority === 'high').length;

  return (
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
          <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-red-500">
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
        </motion.div>
      </div>

      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <CardTitle className="text-lg font-semibold">Todos os Alertas</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 mb-4">
                    <Bell className="h-10 w-10 text-blue-500" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhum alerta no momento</p>
                  <p className="text-gray-400 text-sm mt-1">Você receberá notificações importantes aqui</p>
                </div>
              ) : (
                alerts.map((alert, index) => {
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
              })
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
