'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, User, CreditCard, Download, Eye, FileDown, Loader2 } from "lucide-react"

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'customer' | 'loan'>('customer');
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
    }, 1500);
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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Geração de PDF - Extratos</h1>
        <p className="text-gray-500 mt-1">Gere extratos e relatórios detalhados</p>
      </div>

      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
              <FileText className="h-5 w-5 text-[#1E3A8A]" />
            </div>
            <CardTitle className="text-lg font-semibold">Tipo de Relatório</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200
                ${reportType === 'customer' 
                  ? 'border-[#22C55E] bg-gradient-to-br from-emerald-50 to-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input 
                type="radio" 
                name="reportType" 
                value="customer" 
                checked={reportType === 'customer'} 
                onChange={() => setReportType('customer')} 
                className="sr-only" 
              />
              <div className={`
                p-3 rounded-full mb-3 transition-all duration-200
                ${reportType === 'customer' ? 'bg-[#22C55E] text-white' : 'bg-gray-100 text-gray-600'}
              `}>
                <User className="h-8 w-8" />
              </div>
              <div className={`font-semibold ${reportType === 'customer' ? 'text-emerald-700' : 'text-gray-700'}`}>
                Extrato por Cliente
              </div>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Histórico completo do cliente
              </p>
            </motion.label>

            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all duration-200
                ${reportType === 'loan' 
                  ? 'border-[#22C55E] bg-gradient-to-br from-emerald-50 to-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <input 
                type="radio" 
                name="reportType" 
                value="loan" 
                checked={reportType === 'loan'} 
                onChange={() => setReportType('loan')} 
                className="sr-only" 
              />
              <div className={`
                p-3 rounded-full mb-3 transition-all duration-200
                ${reportType === 'loan' ? 'bg-[#22C55E] text-white' : 'bg-gray-100 text-gray-600'}
              `}>
                <CreditCard className="h-8 w-8" />
              </div>
              <div className={`font-semibold ${reportType === 'loan' ? 'text-emerald-700' : 'text-gray-700'}`}>
                Extrato por Empréstimo
              </div>
              <p className="text-sm text-gray-500 mt-1 text-center">
                Detalhes do contrato
              </p>
            </motion.label>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="
              w-full py-6 text-lg font-semibold
              bg-[#22C55E] hover:bg-[#4ADE80] 
              shadow-lg shadow-emerald-500/25
              hover:shadow-emerald-500/40
              transition-all duration-300 hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando extrato...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-5 w-5" />
                Gerar Extrato
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {generated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Eye className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Preview do Extrato</CardTitle>
                  </div>
                  <Button 
                    onClick={downloadReport}
                    className="
                      bg-[#22C55E] hover:bg-[#4ADE80]
                      shadow-lg shadow-emerald-500/25
                      hover:shadow-emerald-500/40
                      transition-all duration-300
                    "
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 font-mono text-sm whitespace-pre-wrap shadow-inner">
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
