'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, DollarSign, Percent, Calculator, CheckCircle2, Loader2 } from "lucide-react"

export default function QuickLoanPage() {
  const [amount, setAmount] = useState('');
  const [installments, setInstallments] = useState(6);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interestRate = 50;
  const principal = parseFloat(amount) || 0;
  const totalAmount = principal + (principal * interestRate / 100);
  const installmentValue = totalAmount / installments;

  const handleSubmit = async () => {
    if (!amount) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setAmount(''); }, 3000);
    }, 1500);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="h-7 w-7 text-[#22C55E]" />
          Venda Rápida
        </h1>
        <p className="text-gray-500 mt-1">Crie empréstimos de forma rápida e simples</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Empréstimo criado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4 border-b border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#22C55E]/10">
                <DollarSign className="h-5 w-5 text-[#22C55E]" />
              </div>
              <CardTitle className="text-lg font-semibold">Dados do Empréstimo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Valor do Empréstimo (R$)</label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="text-2xl font-bold border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20" 
                placeholder="0,00" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-700">Número de Parcelas</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 6, 12].map(num => (
                  <motion.button
                    key={num}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInstallments(num)}
                    className={`
                      py-3 rounded-lg border-2 font-semibold transition-all duration-200
                      ${installments === num 
                        ? 'border-[#22C55E] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] text-white shadow-lg shadow-emerald-500/25' 
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {num}x
                  </motion.button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={!amount || isSubmitting}
              className="
                w-full py-6 text-lg font-bold
                bg-[#22C55E] hover:bg-[#4ADE80] 
                shadow-lg shadow-emerald-500/25
                hover:shadow-emerald-500/40
                transition-all duration-300 hover:scale-[1.02]
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Criar Empréstimo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4 border-b border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Calculator className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <CardTitle className="text-lg font-semibold">Preview do Contrato</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!amount ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <DollarSign className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Insira o valor do empréstimo</p>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    Valor Principal
                  </div>
                  <div className="text-2xl font-bold text-gray-900">R$ {principal.toLocaleString()}</div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-1">
                    <Percent className="h-4 w-4" />
                    Juros ({interestRate}%)
                  </div>
                  <div className="text-2xl font-bold text-amber-800">+ R$ {(principal * interestRate / 100).toLocaleString()}</div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <Calculator className="h-4 w-4" />
                    Total a Pagar
                  </div>
                  <div className="text-3xl font-bold text-blue-900">R$ {totalAmount.toLocaleString()}</div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-sm text-emerald-700 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Valor da Parcela ({installments}x)
                  </div>
                  <div className="text-3xl font-bold text-emerald-800">R$ {installmentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
