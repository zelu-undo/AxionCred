'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/contexts/auth-context";

interface InterestRule {
  id: string;
  name: string;
  minInstallments: number;
  maxInstallments: number;
  interestRate: number;
  interestType: 'fixed' | 'weekly' | 'monthly';
  isActive: boolean;
}

interface SystemConfig {
  lateFeeType: 'percentage' | 'fixed';
  lateFeeValue: number;
  lateInterestType: 'daily' | 'weekly' | 'monthly';
  lateInterestValue: number;
  renegotiationInterestRate: number;
  renegotiationMaxInstallments: number;
}

function validateNoOverlap(rules: InterestRule[], newRule: InterestRule, excludeId?: string): string {
  for (const rule of rules) {
    if (excludeId && rule.id === excludeId) continue;
    const overlaps = !(newRule.maxInstallments < rule.minInstallments || newRule.minInstallments > rule.maxInstallments);
    if (overlaps) return `A faixa ${newRule.minInstallments}-${newRule.maxInstallments} sobrepõe com "${rule.name}"`;
  }
  return '';
}

export default function BusinessRulesPage() {
  const { user, loading: authLoading } = useAuth()
  const utils = trpc.useUtils()
  
  // Fetch interest rules from database - pass tenantId
  const { data: interestRulesData, isLoading: rulesLoading, error: rulesError } = trpc.businessRules.listInterestRules.useQuery({ 
    tenantId: user?.tenantId 
  }, {
    enabled: !!user?.tenantId,
    retry: 1,
    staleTime: 30000,
  })
  
  // Fetch late fee config - pass tenantId
  const { data: lateFeeConfig, error: lateFeeError } = trpc.businessRules.getLateFeeConfig.useQuery({ 
    tenantId: user?.tenantId 
  }, {
    enabled: !!user?.tenantId,
    retry: 1,
    staleTime: 30000,
  })
  
  // Fetch loan config - pass tenantId
  const { data: loanConfig, error: loanConfigError } = trpc.businessRules.getLoanConfig.useQuery({ 
    tenantId: user?.tenantId 
  }, {
    enabled: !!user?.tenantId,
    retry: 1,
    staleTime: 30000,
  })
  
  // Mutations for CRUD operations - pass tenantId
  const createMutation = trpc.businessRules.createInterestRule.useMutation({
    onSuccess: () => {
      utils.businessRules.listInterestRules.invalidate()
      setMessage({ type: 'success', text: 'Faixa adicionada com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message })
    }
  })
  
  const updateMutation = trpc.businessRules.updateInterestRule.useMutation({
    onSuccess: () => {
      utils.businessRules.listInterestRules.invalidate()
      setMessage({ type: 'success', text: 'Faixa atualizada com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message })
    }
  })
  
  const deleteMutation = trpc.businessRules.deleteInterestRule.useMutation({
    onSuccess: () => {
      utils.businessRules.listInterestRules.invalidate()
      setMessage({ type: 'success', text: 'Faixa excluída com sucesso!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message })
    }
  })
  
  const updateLateFeeMutation = trpc.businessRules.updateLateFeeConfig.useMutation({
    onSuccess: () => {
      utils.businessRules.getLateFeeConfig.invalidate()
      setMessage({ type: 'success', text: 'Configurações de multa salvas!' })
      setTimeout(() => setMessage(null), 3000)
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message })
    }
  })

  const [interestRules, setInterestRules] = useState<InterestRule[]>([])
  const [config, setConfig] = useState<SystemConfig>({
    lateFeeType: 'percentage', lateFeeValue: 2,
    lateInterestType: 'monthly', lateInterestValue: 1, renegotiationInterestRate: 10, renegotiationMaxInstallments: 12,
  })

  // Update local state when data is loaded from database
  useEffect(() => {
    console.log("Interest rules data:", interestRulesData)
    if (interestRulesData && interestRulesData.length > 0) {
      setInterestRules(interestRulesData.map((r: any) => ({
        id: r.id,
        name: r.name,
        minInstallments: r.min_installments,
        maxInstallments: r.max_installments,
        interestRate: r.interest_rate,
        interestType: r.interest_type || 'monthly',
        isActive: r.is_active !== false
      })))
    }
  }, [interestRulesData])

  useEffect(() => {
    if (lateFeeConfig) {
      setConfig(prev => ({
        ...prev,
        lateFeeType: lateFeeConfig.percentage ? 'percentage' : 'fixed',
        lateFeeValue: lateFeeConfig.percentage || lateFeeConfig.fixed_fee || 0,
        lateInterestType: lateFeeConfig.monthly_interest ? 'monthly' : 'daily',
        lateInterestValue: lateFeeConfig.monthly_interest || lateFeeConfig.daily_interest || 0
      }))
    }
  }, [lateFeeConfig])

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<InterestRule>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRule, setNewRule] = useState<Partial<InterestRule>>({});

  const handleSaveLateFee = () => {
    updateLateFeeMutation.mutate({
      tenantId: user?.tenantId,
      percentage: config.lateFeeType === 'percentage' ? config.lateFeeValue : undefined,
      fixed_fee: config.lateFeeType === 'fixed' ? config.lateFeeValue : undefined,
      monthly_interest: config.lateInterestType === 'monthly' ? config.lateInterestValue : undefined,
      daily_interest: config.lateInterestType === 'daily' ? config.lateInterestValue : undefined,
    })
  };

  const handleAddNew = () => {
    if (!newRule.name || !newRule.minInstallments || !newRule.maxInstallments || !newRule.interestRate) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' }); return;
    }
    const ruleToAdd: InterestRule = { 
      id: String(Date.now()), 
      name: newRule.name, 
      minInstallments: newRule.minInstallments, 
      maxInstallments: newRule.maxInstallments, 
      interestRate: newRule.interestRate, 
      interestType: newRule.interestType || 'monthly',
      isActive: true 
    };
    const error = validateNoOverlap(interestRules, ruleToAdd);
    if (error) { setMessage({ type: 'error', text: error }); return; }
    
    // Save to database
    createMutation.mutate({
      tenantId: user?.tenantId,
      name: ruleToAdd.name,
      min_installments: ruleToAdd.minInstallments,
      max_installments: ruleToAdd.maxInstallments,
      interest_rate: ruleToAdd.interestRate,
      interest_type: ruleToAdd.interestType
    })
    
    setNewRule({}); setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta faixa?')) { 
      deleteMutation.mutate({ id, tenantId: user?.tenantId })
    }
  };

  const handleEdit = (rule: InterestRule) => { setEditingId(rule.id); setEditingRule({ ...rule }); };

  const handleSaveEdit = () => {
    if (!editingRule.name || !editingRule.minInstallments || !editingRule.maxInstallments || !editingRule.interestRate) return;
    const ruleToUpdate: InterestRule = { 
      id: editingId!, 
      name: editingRule.name!, 
      minInstallments: editingRule.minInstallments!, 
      maxInstallments: editingRule.maxInstallments!, 
      interestRate: editingRule.interestRate!, 
      interestType: editingRule.interestType || 'monthly',
      isActive: editingRule.isActive ?? true 
    };
    const error = validateNoOverlap(interestRules, ruleToUpdate, editingId!);
    if (error) { setMessage({ type: 'error', text: error }); return; }
    
    // Update in database
    updateMutation.mutate({
      id: editingId!,
      tenantId: user?.tenantId,
      name: ruleToUpdate.name,
      min_installments: ruleToUpdate.minInstallments,
      max_installments: ruleToUpdate.maxInstallments,
      interest_rate: ruleToUpdate.interestRate,
      interest_type: ruleToUpdate.interestType,
      is_active: ruleToUpdate.isActive
    })
    
    setEditingId(null); setEditingRule({});
  };

  const handleCancelEdit = () => { setEditingId(null); setEditingRule({}); setIsAddingNew(false); setNewRule({}); };
  const toggleRuleActive = (rule: InterestRule) => { 
    updateMutation.mutate({
      id: rule.id,
      tenantId: user?.tenantId,
      is_active: !rule.isActive
    })
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Show debug info - remove in production
  console.log("User:", user)
  console.log("TenantId:", user?.tenantId)

  // Show error if no tenantId
  if (!user?.tenantId && !authLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Regras de Negócio</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-700 font-medium">Configuração de tenant não encontrada.</p>
          <p className="text-yellow-600 text-sm mt-1">Faça login novamente para carregar suas configurações.</p>
        </div>
      </div>
    )
  }

  // Show error message if exists
  if (rulesError || lateFeeError || loanConfigError) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Regras de Negócio</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 font-medium">Erro ao carregar configurações:</p>
          <p className="text-red-600 text-sm mt-1">{rulesError?.message || lateFeeError?.message || loanConfigError?.message}</p>
          <p className="text-gray-500 text-xs mt-2">Verifique se você está logado corretamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Regras de Negócio</h1>
      {message && <div className={`px-4 py-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Configuração de Juros por Atraso</h2>
        <div className="flex items-center gap-4">
          <Select value={config.lateInterestType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setConfig({...config, lateInterestType: value})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <input type="number" value={config.lateInterestValue} onChange={(e) => setConfig({...config, lateInterestValue: parseFloat(e.target.value) || 0})} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>% {config.lateInterestType === 'daily' ? 'ao dia' : config.lateInterestType === 'weekly' ? 'por semana' : 'ao mês'}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Juros por Faixa de Parcelas</h2>
          {!isAddingNew && <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded"><Plus size={18} /> Nova Faixa</button>}
        </div>
        <div className="grid grid-cols-7 gap-4 px-4 py-2 bg-gray-100 rounded font-medium text-sm">
          <div>Nome</div><div>Mín</div><div>Máx</div><div>Juros</div><div>Tipo</div><div>Status</div><div>Ações</div>
        </div>
        {interestRules.map((rule) => (
          editingId === rule.id ? (
            <div key={rule.id} className="grid grid-cols-7 gap-4 p-3 bg-purple-50 rounded mb-2 items-center">
              <input type="text" value={editingRule.name || ''} onChange={(e) => setEditingRule({...editingRule, name: e.target.value})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.minInstallments || 0} onChange={(e) => setEditingRule({...editingRule, minInstallments: parseInt(e.target.value)})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.maxInstallments || 0} onChange={(e) => setEditingRule({...editingRule, maxInstallments: parseInt(e.target.value)})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.interestRate || 0} onChange={(e) => setEditingRule({...editingRule, interestRate: parseFloat(e.target.value)})} className="px-2 py-1 border rounded" />
              <select 
                value={editingRule.interestType || 'monthly'} 
                onChange={(e) => setEditingRule({...editingRule, interestType: e.target.value as 'fixed' | 'weekly' | 'monthly'})}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="fixed">Fixo</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
              <div className="text-sm text-blue-600">Editando...</div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="p-1 text-green-600"><Save size={18} /></button>
                <button onClick={handleCancelEdit} className="p-1 text-red-600"><X size={18} /></button>
              </div>
            </div>
          ) : (
            <div key={rule.id} className={`grid grid-cols-7 gap-4 p-3 rounded mb-2 items-center ${rule.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
              <div className="font-medium">{rule.name}</div>
              <div>{rule.minInstallments}</div>
              <div>{rule.maxInstallments}</div>
              <div>{rule.interestRate}%</div>
              <div className="text-sm text-gray-600">
                {rule.interestType === 'fixed' ? 'Fixo' : rule.interestType === 'weekly' ? 'Semanal' : 'Mensal'}
              </div>
              <div><button onClick={() => toggleRuleActive(rule)} className={`px-2 py-1 rounded text-xs ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button></div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(rule)} className="p-1 text-blue-600"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(rule.id)} className="p-1 text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
          )
        ))}
        {isAddingNew && (
          <div className="grid grid-cols-7 gap-4 p-3 bg-purple-50 rounded mb-2 items-center">
            <input type="text" value={newRule.name || ''} onChange={(e) => setNewRule({...newRule, name: e.target.value})} placeholder="Nome" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.minInstallments || ''} onChange={(e) => setNewRule({...newRule, minInstallments: parseInt(e.target.value)})} placeholder="Mín" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.maxInstallments || ''} onChange={(e) => setNewRule({...newRule, maxInstallments: parseInt(e.target.value)})} placeholder="Máx" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.interestRate || ''} onChange={(e) => setNewRule({...newRule, interestRate: parseFloat(e.target.value)})} placeholder="%" className="px-2 py-1 border rounded" />
            <select 
              value={newRule.interestType || 'monthly'} 
              onChange={(e) => setNewRule({...newRule, interestType: e.target.value as 'fixed' | 'weekly' | 'monthly'})}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="fixed">Fixo</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
            <div className="text-sm text-purple-600">Novo</div>
            <div className="flex gap-2">
              <button onClick={handleAddNew} className="p-1 text-green-600"><Save size={18} /></button>
              <button onClick={handleCancelEdit} className="p-1 text-red-600"><X size={18} /></button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Multa por Atraso</h2>
        <div className="flex items-center gap-4">
          <Select value={config.lateFeeType} onValueChange={(value: 'percentage' | 'fixed') => setConfig({...config, lateFeeType: value})}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentual</SelectItem>
              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
          <input type="number" value={config.lateFeeValue} onChange={(e) => setConfig({...config, lateFeeValue: parseFloat(e.target.value) || 0})} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>{config.lateFeeType === 'percentage' ? '%' : 'R$'}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Configurações de Renegociação</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Juros de Renegociação (%)</label>
            <input type="number" value={config.renegotiationInterestRate} onChange={(e) => setConfig({...config, renegotiationInterestRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded" min={0} step={0.1} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prazo Máximo (parcelas)</label>
            <input type="number" value={config.renegotiationMaxInstallments} onChange={(e) => setConfig({...config, renegotiationMaxInstallments: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded" min={1} />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleSaveLateFee} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
          Salvar Multa por Atraso
        </button>
      </div>
    </div>
  );
}
