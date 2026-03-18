'use client';

import { useState } from 'react';

export default function ContractNumberingPage() {
  const [prefix, setPrefix] = useState('CX');
  const [digits, setDigits] = useState(4);
  const [includeYear, setIncludeYear] = useState(true);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Configurações salvas!');
    setTimeout(() => setMessage(''), 3000);
  };

  const example = includeYear ? `${prefix}-2024-${'0'.repeat(digits-1)}1` : `${prefix}-${'0'.repeat(digits-1)}1`;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Numeração de Contratos</h1>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Configuração</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prefixo</label>
            <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Dígitos</label>
            <select value={digits} onChange={(e) => setDigits(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded">
              <option value={3}>3 dígitos</option>
              <option value={4}>4 dígitos</option>
              <option value={5}>5 dígitos</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeYear} onChange={(e) => setIncludeYear(e.target.checked)} className="w-5 h-5" />
            <span>Incluir ano</span>
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Exemplo</h2>
        <div className="p-4 bg-gray-50 rounded text-center text-2xl font-mono">{example}</div>
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Configurações
      </button>
    </div>
  );
}
