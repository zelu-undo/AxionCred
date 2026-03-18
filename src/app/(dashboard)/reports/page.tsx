'use client';

import { useState } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'customer' | 'loan'>('customer');
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const downloadReport = () => {
    const content = `
========================================
       EXTRATO - AXION CRED
========================================

CLIENTE: João Silva
DOCUMENTO: 123.456.789-00

----------------------------------------
EMPRÉSTIMOS
----------------------------------------
Contrato: CX-2024-0001
Valor: R$ 5.000
Parcelas: 3/6
Status: Ativo

----------------------------------------
RESUMO
----------------------------------------
TOTAL PAGO: R$ 2.500
TOTAL DEVIDO: R$ 2.500

========================================
Gerado em: ${new Date().toLocaleString()}
========================================
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extrato.txt';
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Geração de PDF - Extratos</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tipo de Relatório</h2>
        <div className="flex gap-4 mb-6">
          <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer ${reportType === 'customer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <input type="radio" name="reportType" value="customer" checked={reportType === 'customer'} onChange={() => setReportType('customer')} className="sr-only" />
            <div className="text-3xl mb-2">👤</div>
            <div className="font-medium">Extrato por Cliente</div>
          </label>
          <label className={`flex-1 p-4 border-2 rounded-lg cursor-pointer ${reportType === 'loan' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <input type="radio" name="reportType" value="loan" checked={reportType === 'loan'} onChange={() => setReportType('loan')} className="sr-only" />
            <div className="text-3xl mb-2">📄</div>
            <div className="font-medium">Extrato por Empréstimo</div>
          </label>
        </div>

        <button onClick={handleGenerate} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          📄 Gerar Extrato
        </button>
      </div>

      {generated && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Preview do Extrato</h2>
            <button onClick={downloadReport} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              📥 Baixar PDF
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded font-mono text-sm whitespace-pre-wrap">
========================================
       EXTRATO - AXION CRED
========================================

CLIENTE: João Silva
DOCUMENTO: 123.456.789-00

----------------------------------------
EMPRÉSTIMOS
----------------------------------------
Contrato: CX-2024-0001
Valor: R$ 5.000
Parcelas: 3/6
Status: Ativo

----------------------------------------
RESUMO
----------------------------------------
TOTAL PAGO: R$ 2.500
TOTAL DEVIDO: R$ 2.500
========================================
          </div>
        </div>
      )}
    </div>
  );
}
