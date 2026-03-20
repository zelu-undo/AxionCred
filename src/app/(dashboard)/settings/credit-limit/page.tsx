'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  DollarSign, 
  Percent, 
  Save, 
  CheckCircle,
  Calculator,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function CreditLimitPage() {
  const [cashBalance, setCashBalance] = useState(50000);
  const [percentage, setPercentage] = useState(2);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setMessage('Configurações salvas com sucesso!')
    setIsSaving(false)
    setTimeout(() => setMessage(''), 3000);
  };

  const calculatedLimit = cashBalance * percentage / 100;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-[#22C55E]" />
          Limite de Crédito
        </h1>
        <p className="text-gray-500 mt-1">Configure os limites de crédito para seus clientes</p>
      </div>

      {/* Success Message */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          {message}
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Balance Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#22C55E]" />
                Saldo de Caixa
              </CardTitle>
              <CardDescription>Informe o valor total disponível para empréstimos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Valor em Reais</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                  <Input 
                    type="number"
                    value={cashBalance} 
                    onChange={(e) => setCashBalance(parseFloat(e.target.value) || 0)} 
                    className="pl-12 text-2xl font-bold h-14"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Percentage Card */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-[#22C55E]" />
                Porcentagem do Caixa
              </CardTitle>
              <CardDescription>Defina o percentual máximo do caixa por cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Percentual</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number"
                    value={percentage} 
                    onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)} 
                    className="w-24 text-2xl font-bold h-14 text-center"
                    min={0} 
                    max={100} 
                  />
                  <span className="text-gray-500">% do caixa por cliente</span>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Preview do Cálculo</span>
                </div>
                <p className="text-3xl font-bold text-[#22C55E]">
                  R$ {calculatedLimit.toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-gray-500 mt-1">Limite máximo por cliente</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full h-12 bg-[#22C55E] hover:bg-[#4ADE80] hover:shadow-lg hover:shadow-[#22C55E]/30 transition-all duration-300"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1.5 bg-[#22C55E]" />
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-[#22C55E]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Como funciona?</h3>
                <p className="text-sm text-gray-500">
                  O limite de crédito é calculado automaticamente baseado no saldo de caixa da sua empresa e no percentual configurado.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md">
            <div className="h-1.5 bg-yellow-500" />
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Atenção</h3>
                  <p className="text-sm text-gray-500">
                    Limites muito altos podem aumentar o risco de inadimplência. Recomendamos manter entre 1-5% do caixa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
