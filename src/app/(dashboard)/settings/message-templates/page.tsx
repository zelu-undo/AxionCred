'use client';

import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  message: string;
}

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([
    { id: '1', name: 'Parcela Vencida', message: 'Olá {nome}! Sua parcela de R$ {valor} está vencida há {dias} dias.' },
    { id: '2', name: 'Vence Hoje', message: 'Olá {nome}! Sua parcela de R$ {valor} vence HOJE!' },
    { id: '3', name: 'Pagamento Recebido', message: 'Olá {nome}! Recebemos seu pagamento de R$ {valor}.' },
  ]);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Templates salvos!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Templates de Mensagem</h1>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-3">{template.name}</h3>
            <textarea defaultValue={template.message} className="w-full p-3 bg-gray-50 rounded h-24" />
          </div>
        ))}
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Templates
      </button>
    </div>
  );
}
