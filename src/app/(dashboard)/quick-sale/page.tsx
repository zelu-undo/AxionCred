'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  User, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  ArrowLeft, 
  CheckCircle2,
  Calculator,
  AlertCircle,
  Loader2,
  Percent
} from 'lucide-react';
import { trpc } from "@/trpc/client";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

// Demo data for customers
const demoCustomers = [
  { id: '1', name: 'João Silva', document: '123.456.789-00', phone: '(11) 99999-8888', credit_limit: 5000 },
  { id: '2', name: 'Maria Santos', document: '987.654.321-00', phone: '(11) 98888-7777', credit_limit: 8000 },
  { id: '3', name: 'Pedro Costa', document: '456.789.123-00', phone: '(11) 97777-6666', credit_limit: 3000 },
  { id: '4', name: 'Ana Pereira', document: '321.654.987-00', phone: '(11) 96666-5555', credit_limit: 10000 },
];

interface InstallmentOption {
  value: number;
  label: string;
  interestRate: number;
}

// Customer type from API (simplified)
interface CustomerData {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  credit_limit?: number;
}

export default function QuickSalePage() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [installments, setInstallments] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get customer data
  const { data: customersData } = trpc.customer.list.useQuery({
    limit: 100,
    offset: 0,
  }, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Use demo data if no real data
  const customers: CustomerData[] = customersData?.customers?.length ? customersData.customers : demoCustomers;
  
  const customer = customers.find((c: CustomerData) => c.id === selectedCustomer);

  // Installment options with interest rates
  const installmentOptions: InstallmentOption[] = [
    { value: 1, label: '1x', interestRate: 0 },
    { value: 2, label: '2x', interestRate: 0.05 },
    { value: 3, label: '3x', interestRate: 0.10 },
    { value: 4, label: '4x', interestRate: 0.15 },
    { value: 5, label: '5x', interestRate: 0.20 },
    { value: 6, label: '6x', interestRate: 0.25 },
    { value: 10, label: '10x', interestRate: 0.40 },
    { value: 12, label: '12x', interestRate: 0.50 },
  ];

  const selectedInstallment = installmentOptions.find(opt => opt.value === parseInt(installments));

  // Calculate loan details
  const calculateLoan = () => {
    const amount = parseFloat(loanAmount) || 0;
    const interestRate = selectedInstallment?.interestRate || 0;
    const totalInterest = amount * interestRate;
    const totalAmount = amount + totalInterest;
    const installmentValue = totalAmount / (parseInt(installments) || 1);
    
    return {
      amount,
      interestRate,
      totalInterest,
      totalAmount,
      installmentValue,
    };
  };

  const loan = calculateLoan();

  // Check credit limit
  const isOverLimit = customer && loanAmount ? parseFloat(loanAmount) > (customer.credit_limit || 0) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !loanAmount || !installments) {
      showErrorToast('Preencha todos os campos');
      return;
    }

    if (isOverLimit) {
      showErrorToast('Valor excede o limite de crédito do cliente');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setSelectedCustomer('');
      setLoanAmount('');
      setInstallments('1');
    }, 3000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <Zap className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Venda Rápida</h1>
            <p className="text-gray-500">Criação rápida de empréstimo</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Empréstimo criado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4 border-b border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <CreditCard className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <CardTitle className="text-lg font-semibold">Dados do Empréstimo</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente *</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{c.name}</span>
                          <span className="text-gray-400 text-sm ml-2">
                            {c.document ? `(${c.document})` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              {customer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">{customer.name}</p>
                      <p className="text-xs text-blue-700">
                        Limite de crédito: {formatCurrency(customer.credit_limit || 0)}
                      </p>
                    </div>
                    {isOverLimit && (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Excede limite</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Loan Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Empréstimo *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0,00"
                    value={loanAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLoanAmount((parseInt(value) / 100).toFixed(2));
                    }}
                    className="pl-10 border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                  />
                </div>
              </div>

              {/* Installments */}
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas *</Label>
                <Select value={installments} onValueChange={setInstallments}>
                  <SelectTrigger className="border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          {option.interestRate > 0 && (
                            <span className="text-gray-400 text-sm ml-2">
                              +{(option.interestRate * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={isSubmitting || !selectedCustomer || !loanAmount || isOverLimit}
                className="
                  w-full py-6 text-lg font-semibold
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
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-100/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Calculator className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-semibold">Resumo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loanAmount && selectedCustomer ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Valor solicitado</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Juros ({selectedInstallment?.label})</span>
                    </div>
                    <span className="font-semibold text-amber-600">
                      +{formatCurrency(loan.totalInterest)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 -mx-6 px-6">
                    <span className="font-semibold text-gray-900">Total a pagar</span>
                    <span className="text-xl font-bold text-emerald-600">{formatCurrency(loan.totalAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Valor da parcela</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(loan.installmentValue)}</span>
                  </div>
                  
                  <div className="pt-4">
                    <div className="text-sm text-gray-500">
                      {installments}x de {formatCurrency(loan.installmentValue)} sem entrada
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Preencha os dados para ver o resumo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Dica</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Utilize a venda rápida para criar empréstimos em poucos segundos. 
                    O cliente recebe todas as informações automaticamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
