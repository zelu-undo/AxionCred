'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Percent,
  Search
} from 'lucide-react';
import { trpc } from "@/trpc/client";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { useLoanCalculator, type InterestType } from "@/hooks/use-loan-calculator";
import type { InterestRule } from "@/types";

interface InstallmentPreview {
  number: number;
  amount: number;
  dueDate: string;
}

export default function QuickSalePage() {
  const router = useRouter();
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Form data
  const [customerId, setCustomerId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [installments, setInstallments] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [debouncedPrincipal, setDebouncedPrincipal] = useState("");

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch.length > 3) {
        setDebouncedSearch(customerSearch);
      } else {
        setDebouncedSearch("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounce principal for preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrincipal(principal);
    }, 500);
    return () => clearTimeout(timer);
  }, [principal]);

  // Get customers with search
  const { data: customersData, isLoading: loadingCustomers } = trpc.customer.list.useQuery({
    limit: 5,
    search: debouncedSearch || undefined,
    status: "active",
  }, {
    enabled: true,
  });

  const customers = customersData?.customers || [];
  const shouldShowDropdown = showDropdown && (customers.length > 0 || customerSearch.length > 0);

  // Get selected customer
  const { data: selectedCustomer } = trpc.customer.byId.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  );

  // Business rules for interest rates
  const { data: businessRulesData, isLoading: isLoadingRules } = trpc.businessRules.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // Use loan calculator hook
  const { calculateLoan: computeLoan, generateSchedule } = useLoanCalculator();

  // Calculate preview
  const [preview, setPreview] = useState<{
    monthlyPayment: number;
    totalInterest: number;
    totalAmount: number;
    installments: InstallmentPreview[];
  } | null>(null);

  const calculateLoan = () => {
    const principalStr = principal.replace(/[^0-9]/g, "");
    const principalValue = principalStr.length > 2 
      ? parseFloat(principalStr.slice(0, -2) + "." + principalStr.slice(-2))
      : parseFloat(principalStr) / 100;
    
    const numInstallments = parseInt(installments);
    
    if (!principalValue || !numInstallments) {
      setPreview(null);
      return;
    }

    // Get interest rate from business rules
    const rules = businessRulesData?.interestRules || [];
    const rule = rules.find(
      (rule: InterestRule) => numInstallments >= rule.min_installments && numInstallments <= rule.max_installments
    );
    
    const interestRate = rule ? rule.interest_rate : 0;
    const interestType = (rule?.interest_type || 'monthly') as InterestType;

    // Calculate using hook
    const calculation = computeLoan(principalValue, interestRate, numInstallments, interestType);

    // Generate schedule
    const installmentList = generateSchedule(
      principalValue,
      interestRate,
      numInstallments,
      interestType,
      firstPaymentDate
    ).map(inst => ({
      number: inst.number,
      amount: inst.amount,
      dueDate: inst.dueDate,
    }));
    
    setPreview({
      monthlyPayment: calculation.installmentAmount,
      totalInterest: calculation.totalInterest,
      totalAmount: calculation.totalAmount,
      installments: installmentList,
    });
  };

  // Recalculate when values change
  useEffect(() => {
    if (principal && installments && businessRulesData) {
      calculateLoan();
    }
  }, [principal, installments, firstPaymentDate, businessRulesData]);

  // Create loan mutation
  const createLoanMutation = trpc.loan.create.useMutation({
    onSuccess: () => {
      showSuccessToast('Empréstimo criado com sucesso!');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCustomerId("");
        setPrincipal("");
        setInstallments("");
        setCustomerSearch("");
      }, 3000);
    },
    onError: (error) => {
      showErrorToast(error.message);
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerId || !principal || !installments) {
      showErrorToast('Preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    
    const principalStr = principal.replace(/[^0-9]/g, "");
    const principalValue = principalStr.length > 2 
      ? parseFloat(principalStr.slice(0, -2) + "." + principalStr.slice(-2))
      : parseFloat(principalStr) / 100;

    createLoanMutation.mutate({
      customer_id: customerId,
      principal_amount: principalValue,
      installments_count: parseInt(installments),
      first_due_date: firstPaymentDate,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Get current interest rate for display
  const getCurrentInterestRate = () => {
    const numInstallments = parseInt(installments);
    if (!numInstallments || !businessRulesData) return 0;
    
    const rules = businessRulesData.interestRules || [];
    const rule = rules.find(
      (rule: InterestRule) => numInstallments >= rule.min_installments && numInstallments <= rule.max_installments
    );
    return rule ? rule.interest_rate : 0;
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
              {/* Customer Search */}
              <div className="space-y-2 relative">
                <Label htmlFor="customer-search">Cliente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="customer-search"
                    type="text"
                    placeholder="Buscar cliente por nome, CPF ou telefone..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="pl-10 border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                  />
                </div>
                
                {/* Dropdown de resultados */}
                {shouldShowDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingCustomers ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-[#22C55E]" />
                        <span className="ml-2 text-sm text-gray-500">Buscando...</span>
                      </div>
                    ) : customers.length > 0 ? (
                      customers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          onClick={() => {
                            setCustomerId(c.id);
                            setCustomerSearch(c.name);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-medium text-gray-900">{c.name}</div>
                          <div className="text-sm text-gray-500">{c.document}</div>
                        </button>
                      ))
                    ) : customerSearch.length > 3 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Customer Info */}
              {selectedCustomer && customerId && (
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
                      <p className="text-sm font-medium text-blue-900">{selectedCustomer.name}</p>
                      <p className="text-xs text-blue-700">
                        {selectedCustomer.document} • {selectedCustomer.phone}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loan Amount */}
              <div className="space-y-2">
                <Label htmlFor="principal">Valor do Empréstimo *</Label>
                <Input
                  id="principal"
                  type="text"
                  placeholder="0,00"
                  value={principal}
                  onChange={(e) => {
                    // Permite apenas dígitos
                    const digits = e.target.value.replace(/[^0-9]/g, '');
                    if (!digits) {
                      setPrincipal('');
                      return;
                    }
                    // Converte para formato brasileiro: 1234 -> 12,34
                    const numericValue = parseInt(digits) / 100;
                    setPrincipal(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                  }}
                  onBlur={() => {
                    // Formata ao sair do campo
                    if (principal) {
                      const digits = principal.replace(/[^0-9]/g, '');
                      if (digits) {
                        const numericValue = parseInt(digits) / 100;
                        setPrincipal(numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                      }
                    }
                  }}
                  className="border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
              </div>

              {/* Installments */}
              <div className="space-y-2">
                <Label htmlFor="installments">Parcelas *</Label>
                <Input
                  id="installments"
                  type="number"
                  placeholder="Digite o número de parcelas"
                  value={installments}
                  onChange={(e) => {
                    const num = e.target.value.replace(/[^0-9]/g, '');
                    setInstallments(num);
                  }}
                  onBlur={() => {
                    // Valida contra as regras de negócio
                    const num = parseInt(installments) || 0;
                    const rules = businessRulesData?.interestRules || [];
                    
                    if (rules.length > 0) {
                      const validRule = rules.find(
                        (r: InterestRule) => num >= r.min_installments && num <= r.max_installments
                      );
                      
                      if (!validRule) {
                        // Se não estiver válido, ajusta para o intervalo válido mais próximo
                        const minAllowed = Math.min(...rules.map((r: InterestRule) => r.min_installments));
                        const maxAllowed = Math.max(...rules.map((r: InterestRule) => r.max_installments));
                        
                        if (num < minAllowed) {
                          setInstallments(String(minAllowed));
                        } else if (num > maxAllowed) {
                          setInstallments(String(maxAllowed));
                        }
                      }
                    }
                  }}
                  className="border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                {/* Mostra as faixas disponíveis */}
                {businessRulesData?.interestRules && businessRulesData.interestRules.length > 0 && (
                  <p className="text-xs text-gray-500">
                    Faixas disponíveis: {businessRulesData.interestRules.map((r: InterestRule) => `${r.min_installments}-${r.max_installments}x`).join(", ")}
                  </p>
                )}
              </div>

              {/* First Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="firstPaymentDate">Data da Primeira Parcela *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstPaymentDate"
                    type="date"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={isSubmitting || !customerId || !principal || !installments}
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
              {isLoadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#22C55E]" />
                  <span className="ml-2 text-gray-500">Carregando...</span>
                </div>
              ) : principal && customerId ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Valor solicitado</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(principal.replace(/[^0-9]/g, "")) / 100 || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Juros ({installments}x)</span>
                    </div>
                    <span className="font-semibold text-amber-600">
                      +{preview ? formatCurrency(preview.totalInterest) : formatCurrency(0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50 -mx-6 px-6">
                    <span className="font-semibold text-gray-900">Total a pagar</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {preview ? formatCurrency(preview.totalAmount) : formatCurrency(0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Valor da parcela</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {preview ? formatCurrency(preview.monthlyPayment) : formatCurrency(0)}
                    </span>
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