'use client';

import { useState } from 'react';

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-red-100 text-red-700 border-red-200';
      case 'operational': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'strategic': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit': return '💰';
      case 'operational': return '⚙️';
      case 'strategic': return '📊';
      default: return '📝';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔔 Alertas Inteligentes</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <span>💰</span>
            <span className="text-sm text-gray-600">Crédito</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.type === 'credit').length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <span>⚙️</span>
            <span className="text-sm text-gray-600">Operacional</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.type === 'operational').length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <span>📊</span>
            <span className="text-sm text-gray-600">Estratégico</span>
          </div>
          <div className="text-2xl font-bold">{alerts.filter(a => a.type === 'strategic').length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <span>⚠️</span>
            <span className="text-sm text-gray-600">Alta Prioridade</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{alerts.filter(a => a.priority === 'high').length}</div>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-lg border ${getTypeColor(alert.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="text-sm">{alert.message}</div>
                  <div className="text-xs opacity-70 mt-1">{alert.timestamp}</div>
                </div>
              </div>
              <span className={`w-3 h-3 rounded-full ${getPriorityColor(alert.priority)}`}></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
