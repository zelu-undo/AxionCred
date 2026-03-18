'use client';

import { useState } from 'react';

interface Log {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs] = useState<Log[]>([
    { id: '1', user: 'João Silva', action: 'create', module: 'customer', timestamp: '2024-02-15 14:30' },
    { id: '2', user: 'Maria Santos', action: 'update', module: 'loan', timestamp: '2024-02-15 14:25' },
    { id: '3', user: 'João Silva', action: 'delete', module: 'payment', timestamp: '2024-02-15 14:20' },
    { id: '4', user: 'Pedro Costa', action: 'login', module: 'auth', timestamp: '2024-02-15 14:15' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs e Auditoria</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Exportar Logs</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Data/Hora</th>
              <th className="px-4 py-3 text-left">Usuário</th>
              <th className="px-4 py-3 text-left">Módulo</th>
              <th className="px-4 py-3 text-left">Ação</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-600">{log.timestamp}</td>
                <td className="px-4 py-3">{log.user}</td>
                <td className="px-4 py-3 capitalize">{log.module}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    log.action === 'create' ? 'bg-green-100 text-green-700' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                    log.action === 'delete' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
