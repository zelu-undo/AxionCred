'use client';

import { useState } from 'react';

interface InterestRule {
  id: string;
  minInstallments: number;
  maxInstallments: number;
  interestRate: number;
}

export default function BusinessRulesPage() {
  const [interestRules, setInterestRules] = useState<InterestRule[]>([
    { id: '1', minInstallments: 1, maxInstallments: 5, interestRate: 50 },
    { id: '2', minInstallments: 6, maxInstallments: 10, interestRate: 80 },
    { id: '3', minInstallments: 11, maxInstallments: 24, interestRate: 100 },
  ]);
  const [interestType, setInterestType] = useState<'monthly' | 'weekly'>('monthly');
  const [lateFeeType, setLateFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [lateFeeValue, setLateFeeValue] = useState(2);
  const [lateInterestType, setLateInterestType] = useState<'daily' | 'monthly'>('monthly');
  const [lateInterestValue, setLateInterestValue] = useState(1);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    setMessage('Configurações salvas!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Regras de Negócio</h1>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tipo de Juros</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={interestType === 'monthly'} onChange={() => setInterestType('monthly')} className="w-4 h-4" />
            Mensal
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={interestType === 'weekly'} onChange={() => setInterestType('weekly')} className="w-4 h-4" />
            Semanal
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Juros por Faixa de Parcelas</h2>
        {interestRules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded mb-2">
            <span>De {rule.minInstallments} até {rule.maxInstallments} parcelas:</span>
            <input type="number" value={rule.interestRate} className="w-24 px-2 py-1 border rounded" min={0} step={0.1} />
            <span>%</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Multa por Atraso</h2>
        <div className="flex items-center gap-4">
          <select value={lateFeeType} onChange={(e) => setLateFeeType(e.target.value as 'percentage' | 'fixed')} className="px-3 py-2 border rounded">
            <option value="percentage">Percentual</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
          <input type="number" value={lateFeeValue} onChange={(e) => setLateFeeValue(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>{lateFeeType === 'percentage' ? '%' : 'R$'}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Juros por Atraso</h2>
        <div className="flex items-center gap-4">
          <select value={lateInterestType} onChange={(e) => setLateInterestType(e.target.value as 'daily' | 'monthly')} className="px-3 py-2 border rounded">
            <option value="daily">Diário</option>
            <option value="monthly">Mensal</option>
          </select>
          <input type="number" value={lateInterestValue} onChange={(e) => setLateInterestValue(parseFloat(e.target.value) || 0)} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>% {lateInterestType === 'daily' ? 'ao dia' : 'ao mês'}</span>
        </div>
      </div>

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Configurações
      </button>
    </div>
  );
}
