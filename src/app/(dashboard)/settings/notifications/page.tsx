'use client';

import { useState } from 'react';

export default function NotificationsPage() {
  const [settings, setSettings] = useState({ visual: true, sound: false, email: true });
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Configurações salvas!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações de Notificações</h1>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tipos de Notificação</h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
            <span>👁️ Notificação Visual</span>
            <input type="checkbox" checked={settings.visual} onChange={(e) => setSettings({ ...settings, visual: e.target.checked })} className="w-6 h-6" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
            <span>🔔 Notificação Sonora</span>
            <input type="checkbox" checked={settings.sound} onChange={(e) => setSettings({ ...settings, sound: e.target.checked })} className="w-6 h-6" />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer">
            <span>📧 E-mail</span>
            <input type="checkbox" checked={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.checked })} className="w-6 h-6" />
          </label>
        </div>
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Configurações
      </button>
    </div>
  );
}
