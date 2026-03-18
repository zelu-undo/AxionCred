'use client';

import { useState } from 'react';

export default function CreditLimitPage() {
  const [cashBalance, setCashBalance] = useState(50000);
  const [percentage, setPercentage] = useState(2);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Configurações salvas!');
    setTimeout(() => setMessage(''), 3000);
  };

  const calculatedLimit = cashBalance * percentage / 100;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Limite de Crédito</h1>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Saldo de Caixa</h2>
        <input type="number" value={cashBalance} onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)} className="text-2xl font-bold border rounded px-4 py-2 w-48" />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Porcentagem do Caixa</h2>
        <div className="flex items-center gap-4">
          <input type="number" value={percentage} onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)} className="w-24 px-3 py-2 border rounded text-xl" min={0} max={100} />
          <span>% do caixa por cliente</span>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded">
          Limite máximo por cliente: <strong>R$ {calculatedLimit.toLocaleString()}</strong>
        </div>
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Configurações
      </button>
    </div>
  );
}
