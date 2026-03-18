'use client';

import { useState } from 'react';

export default function CustomerMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const suggestedMessage = 'Olá João! Sua parcela de R$ 850,00 vence amanhã. Prepare o pagamento!';

  const handleSendMessage = () => {
    alert('Mensagem enviada!');
    setSelectedMessage(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="text-gray-600 hover:text-gray-800">← Voltar</button>
        <h1 className="text-2xl font-bold">Mensagens - João Silva</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <button onClick={() => setSelectedMessage('suggested')} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-left">
          <div className="text-2xl mb-2">💡</div>
          <div className="font-medium">Mensagem Sugerida</div>
        </button>
        <button onClick={() => setSelectedMessage('whatsapp')} className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-left">
          <div className="text-2xl mb-2">💬</div>
          <div className="font-medium">Enviar WhatsApp</div>
        </button>
        <button onClick={() => setSelectedMessage('custom')} className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-left">
          <div className="text-2xl mb-2">✏️</div>
          <div className="font-medium">Mensagem Personalizada</div>
        </button>
      </div>

      {selectedMessage === 'suggested' && (
        <div className="bg-white p-6 rounded-lg shadow border-2 border-blue-500">
          <h2 className="text-lg font-semibold mb-4">Mensagem Sugerida</h2>
          <div className="p-4 bg-gray-50 rounded mb-4">{suggestedMessage}</div>
          <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Marcar como Enviada</button>
        </div>
      )}

      {selectedMessage === 'custom' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Mensagem Personalizada</h2>
          <textarea className="w-full p-3 border rounded h-32 mb-4" placeholder="Digite sua mensagem..." />
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enviar</button>
        </div>
      )}
    </div>
  );
}
