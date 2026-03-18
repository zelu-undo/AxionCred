'use client';

import { useState } from 'react';

export default function CustomerStatusPage() {
  const [customers] = useState([
    { id: '1', name: 'João Silva', status: 'current', priority: 'high', debt: 5000, score: 850 },
    { id: '2', name: 'Maria Santos', status: 'overdue', priority: 'high', debt: 3500, score: 720 },
    { id: '3', name: 'Pedro Costa', status: 'default', priority: 'high', debt: 4800, score: 580 },
    { id: '4', name: 'Ana Pereira', status: 'current', priority: 'medium', debt: 1000, score: 790 },
  ]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'current': return { label: 'Em dia', color: 'bg-green-100 text-green-700' };
      case 'overdue': return { label: 'Atrasado', color: 'bg-yellow-100 text-yellow-700' };
      case 'default': return { label: 'Inadimplente', color: 'bg-red-100 text-red-700' };
      default: return { label: 'Novo', color: 'bg-blue-100 text-blue-700' };
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Status e Prioridade de Clientes</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold">{customers.filter(c => c.status === 'current').length}</div>
          <div className="text-sm text-gray-600">Em dia</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{customers.filter(c => c.status === 'overdue').length}</div>
          <div className="text-sm text-gray-600">Atrasados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{customers.filter(c => c.status === 'default').length}</div>
          <div className="text-sm text-gray-600">Inadimplentes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-orange-600">{customers.filter(c => c.priority === 'high').length}</div>
          <div className="text-sm text-gray-600">Alta Prioridade</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Prioridade</th>
              <th className="px-4 py-3 text-right">Dívida</th>
              <th className="px-4 py-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const statusInfo = getStatusInfo(customer.status);
              return (
                <tr key={customer.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${statusInfo.color}`}>{statusInfo.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={customer.priority === 'high' ? 'text-red-600 font-medium' : 'text-yellow-600'}>{customer.priority === 'high' ? 'Alta' : 'Média'}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">R$ {customer.debt.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={customer.score >= 700 ? 'text-green-600' : customer.score >= 600 ? 'text-yellow-600' : 'text-red-600'}>{customer.score}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
