'use client';

import { useState } from 'react';

export default function QuickLoanPage() {
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState(6);
  const [success, setSuccess] = useState(false);

  const interestRate = 50;
  const principal = parseFloat(amount) || 0;
  const totalAmount = principal + (principal * interestRate / 100);
  const installmentValue = totalAmount / installments;

  const handleSubmit = async () => {
    if (!amount) return;
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setAmount(''); }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚡ Venda Rápida</h1>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Empréstimo criado com sucesso!
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Valor do Empréstimo (R$)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded text-2xl font-bold" placeholder="0,00" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Número de Parcelas</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 6, 12].map(num => (
                <button key={num} onClick={() => setInstallments(num)} className={`flex-1 py-2 rounded border ${installments === num ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                  {num}x
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!amount} className="w-full py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:bg-gray-300">
            ✅ Criar Empréstimo
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Preview do Contrato</h2>
          {!amount ? (
            <div className="text-center py-12 text-gray-500">Insira o valor</div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Valor Principal</div>
                <div className="font-bold">R$ {principal.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-yellow-700">Juros ({interestRate}%)</div>
                <div className="font-bold text-yellow-800">+ R$ {(principal * interestRate / 100).toLocaleString()}</div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm text-blue-700">Total a Pagar</div>
                <div className="text-2xl font-bold text-blue-800">R$ {totalAmount.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <div className="text-sm text-green-700">Valor da Parcela ({installments}x)</div>
                <div className="text-2xl font-bold text-green-800">R$ {installmentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
