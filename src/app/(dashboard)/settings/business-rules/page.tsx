'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X, Calculator, AlertCircle } from 'lucide-react';
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

// Tipos de juros:
// - monthly: percentual ao mês (recorrente)
// - weekly: percentual ao semana (recorrente)  
// - total: percentual único aplicado no total (não recorrente)
type InterestType = 'monthly' | 'weekly' | 'total';

interface InterestRule {
  id: string;
  name: string;
  minInstallments: number;
  maxInstallments: number;
  interestRate: number;
  interestType: InterestType;
  isActive: boolean;
}

interface LateFeeConfig {
  lateFeeType: 'percentage';
  lateFeeValue: number;
  lateInterestType: 'daily' | 'monthly';
  lateInterestValue: number;
}

function validateNoOverlap(rules: InterestRule[], newRule: InterestRule, excludeId?: string): string | null {
  const filtered = rules.filter(r => r.id !== excludeId);
  for (const r of filtered) {
    const overlap = !(newRule.maxInstallments < r.minInstallments || newRule.minInstallments > r.maxInstallments);
    if (overlap) return `Intervalo sobrepõe com "${r.name}" (${r.minInstallments}-${r.maxInstallments} parcelas)`;
  }
  return null;
}

function getInterestTypeLabel(type: InterestType): string {
  switch (type) {
    case 'monthly': return 'Ao mês';
    case 'weekly': return 'À semana';
    case 'total': return 'Taxa única';
  }
}

function getInterestTypeExample(type: InterestType, rate: number): string {
  switch (type) {
    case 'monthly': return `${rate}% ao mês`;
    case 'weekly': return `${rate}% por semana`;
    case 'total': return `${rate}% total`;
  }
}

// Format number to percent input (e.g., 10 -> "10", 5.5 -> "5,5")
function formatPercentInput(value: number): string {
  if (value === 0 || value === null || value === undefined) return '';
  return value.toString().replace('.', ',');
}

// Parse percent input to number (e.g., "10,5" -> 10.5)
function parsePercentInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default function BusinessRulesPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [interestRules, setInterestRules] = useState<InterestRule[]>([])
  const [lateFeeConfig, setLateFeeConfig] = useState<LateFeeConfig>({
    lateFeeType: 'percentage',
    lateFeeValue: 0,
    lateInterestType: 'monthly',
    lateInterestValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data directly from Supabase
  useEffect(() => {
    async function fetchData() {
      if (!user?.tenantId) {
        setLoading(false)
        return
      }
      
      try {
        // Fetch interest rules
        const { data: rulesData, error: rulesError } = await supabase
          .from("interest_rules")
          .select("*")
          .eq("tenant_id", user.tenantId)
          .order("min_installments", { ascending: true })
        
        if (rulesError) throw rulesError
        
        if (rulesData) {
          setInterestRules(rulesData.map((r: any) => ({
            id: r.id,
            name: r.name,
            minInstallments: r.min_installments,
            maxInstallments: r.max_installments,
            interestRate: r.interest_rate,
            interestType: r.interest_type || 'monthly',
            isActive: r.is_active !== false
          })))
        }
        
        // Fetch late fee config
        const { data: lateFeeData } = await supabase
          .from("late_fee_config")
          .select("*")
          .eq("tenant_id", user.tenantId)
          .single()
        
        if (lateFeeData) {
          setConfig(prev => ({
            ...prev,
            lateFeeType: lateFeeData.percentage ? 'percentage' : 'fixed',
            lateFeeValue: lateFeeData.percentage || lateFeeData.fixed_fee || 0,
            lateInterestType: lateFeeData.monthly_interest ? 'monthly' : 'daily',
            lateInterestValue: lateFeeData.monthly_interest || lateFeeData.daily_interest || 0
          }))
        }
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user?.tenantId])

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<InterestRule>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRule, setNewRule] = useState<Partial<InterestRule>>({});

  // Save interest rule
  const handleAddNew = async () => {
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
    
    try {
      const { error: insertError } = await supabase
        .from("interest_rules")
        .insert({
          tenant_id: user?.tenantId,
          name: ruleToAdd.name,
          min_installments: ruleToAdd.minInstallments,
          max_installments: ruleToAdd.maxInstallments,
          interest_rate: ruleToAdd.interestRate,
          interest_type: ruleToAdd.interestType,
        })
      
      if (insertError) throw insertError
      
      setMessage({ type: 'success', text: 'Faixa adicionada com sucesso!' })
      // Refresh data
      const { data } = await supabase
        .from("interest_rules")
        .select("*")
        .eq("tenant_id", user?.tenantId)
        .order("min_installments", { ascending: true })
      
      if (data) {
        setInterestRules(data.map((r: any) => ({
          id: r.id,
          name: r.name,
          minInstallments: r.min_installments,
          maxInstallments: r.max_installments,
          interestRate: r.interest_rate,
          interestType: r.interest_type || 'monthly',
          isActive: r.is_active !== false
        })))
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    
    setNewRule({}); setIsAddingNew(false);
    setTimeout(() => setMessage(null), 3000)
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta faixa?')) return
    
    try {
      const { error: deleteError } = await supabase
        .from("interest_rules")
        .delete()
        .eq("id", id)
      
      if (deleteError) throw deleteError
      
      setMessage({ type: 'success', text: 'Faixa excluída com sucesso!' })
      setInterestRules(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setTimeout(() => setMessage(null), 3000)
  };

  const handleEdit = (rule: InterestRule) => { setEditingId(rule.id); setEditingRule({ ...rule }); };

  const handleSaveEdit = async () => {
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
    
    try {
      const { error: updateError } = await supabase
        .from("interest_rules")
        .update({
          name: ruleToUpdate.name,
          min_installments: ruleToUpdate.minInstallments,
          max_installments: ruleToUpdate.maxInstallments,
          interest_rate: ruleToUpdate.interestRate,
          interest_type: ruleToUpdate.interestType,
          is_active: ruleToUpdate.isActive
        })
        .eq("id", editingId!)
      
      if (updateError) throw updateError
      
      setMessage({ type: 'success', text: 'Faixa atualizada com sucesso!' })
      setInterestRules(prev => prev.map(r => r.id === editingId ? ruleToUpdate : r))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    
    setEditingId(null); setEditingRule({});
    setTimeout(() => setMessage(null), 3000)
  };

  const handleCancelEdit = () => { setEditingId(null); setEditingRule({}); setIsAddingNew(false); setNewRule({}); };
  
  const toggleRuleActive = async (rule: InterestRule) => {
    try {
      const { error: toggleError } = await supabase
        .from("interest_rules")
        .update({ is_active: !rule.isActive })
        .eq("id", rule.id)
      
      if (toggleError) throw toggleError
      
      setInterestRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const handleSaveLateFee = async () => {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from("late_fee_config")
        .select("id")
        .eq("tenant_id", user?.tenantId)
        .single()
      
      if (existing) {
        const { error: updateError } = await supabase
          .from("late_fee_config")
          .update({
            percentage: lateFeeConfig.lateFeeValue,
            monthly_interest: lateFeeConfig.lateInterestType === 'monthly' ? lateFeeConfig.lateInterestValue : null,
            daily_interest: lateFeeConfig.lateInterestType === 'daily' ? lateFeeConfig.lateInterestValue : null,
          })
          .eq("tenant_id", user?.tenantId)
        
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("late_fee_config")
          .insert({
            tenant_id: user?.tenantId,
            percentage: lateFeeConfig.lateFeeValue,
            monthly_interest: lateFeeConfig.lateInterestType === 'monthly' ? lateFeeConfig.lateInterestValue : null,
            daily_interest: lateFeeConfig.lateInterestType === 'daily' ? lateFeeConfig.lateInterestValue : null,
          })
        
        if (insertError) throw insertError
      }
      
      setMessage({ type: 'success', text: 'Configurações de multa salvas!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
    setTimeout(() => setMessage(null), 3000)
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user?.tenantId) {
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

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Regras de Negócio</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-red-700 font-medium">Erro ao carregar configurações:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Regras de Negócio</h1>
      {message && <div className={`px-4 py-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>}

      {/* Interest Rules Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Faixas de Parcelas</h2>
          <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            <Plus size={16} /> Nova Faixa
          </button>
        </div>

        {/* Add new rule form */}
        {isAddingNew && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <input type="text" placeholder="Nome" className="border p-2 rounded" value={newRule.name || ''} onChange={e => setNewRule({...newRule, name: e.target.value})} />
              <input type="number" placeholder="Mínimas" className="border p-2 rounded" value={newRule.minInstallments || ''} onChange={e => setNewRule({...newRule, minInstallments: Number(e.target.value)})} />
              <input type="number" placeholder="Máximas" className="border p-2 rounded" value={newRule.maxInstallments || ''} onChange={e => setNewRule({...newRule, maxInstallments: Number(e.target.value)})} />
              <input 
                type="text" 
                placeholder="Juros %" 
                className="border p-2 rounded"
                value={formatPercentInput(newRule.interestRate)} 
                onChange={e => setNewRule({...newRule, interestRate: parsePercentInput(e.target.value)})} 
              />
              <Select value={newRule.interestType || 'monthly'} onValueChange={(v) => setNewRule({...newRule, interestType: v as InterestType})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Ao mês</SelectItem>
                  <SelectItem value="weekly">À semana</SelectItem>
                  <SelectItem value="total">Taxa única</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <button onClick={handleAddNew} className="p-2 bg-green-600 text-white rounded hover:bg-green-700"><Save size={16} /></button>
                <button onClick={handleCancelEdit} className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"><X size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Rules list */}
        {interestRules.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma faixa de parcelas configurada. Clique em "Nova Faixa" para adicionar.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nome</th>
                <th className="text-left py-2">Parcelas</th>
                <th className="text-left py-2">Taxa</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Status</th>
                <th className="text-right py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {interestRules.map(rule => (
                <tr key={rule.id} className="border-b">
                  {editingId === rule.id ? (
                    <>
                      <td className="py-2"><input className="border p-1 rounded w-full" value={editingRule.name || ''} onChange={e => setEditingRule({...editingRule, name: e.target.value})} /></td>
                      <td className="py-2"><input className="border p-1 rounded w-16" type="number" value={editingRule.minInstallments || 0} onChange={e => setEditingRule({...editingRule, minInstallments: Number(e.target.value)})} /> - <input className="border p-1 rounded w-16" type="number" value={editingRule.maxInstallments || 0} onChange={e => setEditingRule({...editingRule, maxInstallments: Number(e.target.value)})} /></td>
                      <td className="py-2">
                        <input 
                          className="border p-1 rounded w-20" 
                          type="text"
                          value={formatPercentInput(editingRule.interestRate)} 
                          onChange={e => setEditingRule({...editingRule, interestRate: parsePercentInput(e.target.value)})} 
                        />
                      </td>
                      <td className="py-2">
                        <Select value={editingRule.interestType || 'monthly'} onValueChange={(v) => setEditingRule({...editingRule, interestType: v as InterestType})}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Ao mês</SelectItem>
                            <SelectItem value="weekly">À semana</SelectItem>
                            <SelectItem value="total">Taxa única</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2">
                        <button onClick={() => toggleRuleActive(rule)} className={`px-2 py-1 rounded text-sm ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded mr-2"><Save size={18} /></button>
                        <button onClick={handleCancelEdit} className="p-1 text-gray-600 hover:bg-gray-50 rounded"><X size={18} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2">{rule.name}</td>
                      <td className="py-2">{rule.minInstallments} - {rule.maxInstallments}</td>
                      <td className="py-2">{rule.interestRate.toFixed(2).replace('.', ',')}%</td>
                      <td className="py-2">{getInterestTypeLabel(rule.interestType)}</td>
                      <td className="py-2">
                        <button onClick={() => toggleRuleActive(rule)} className={`px-2 py-1 rounded text-sm ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleEdit(rule)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-2"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(rule.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Late Fee Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Configuração de Juros por Atraso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Multa por Atraso (%)</label>
            <input 
              type="text" 
              className="border p-2 rounded w-full"
              placeholder="0,00"
              value={formatPercentInput(lateFeeConfig.lateFeeValue)} 
              onChange={e => {
                const val = parsePercentInput(e.target.value);
                setLateFeeConfig({...lateFeeConfig, lateFeeValue: val})
              }} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Juros por Atraso (%)</label>
            <div className="flex gap-2">
              <select 
                className="border p-2 rounded"
                value={lateFeeConfig.lateInterestType}
                onChange={e => setLateFeeConfig({...lateFeeConfig, lateInterestType: e.target.value as 'daily' | 'monthly'})}
              >
                <option value="daily">Ao dia</option>
                <option value="monthly">Ao mês</option>
              </select>
              <input 
                type="text" 
                className="flex-1 border p-2 rounded"
                placeholder="0,00"
                value={formatPercentInput(lateFeeConfig.lateInterestValue)} 
                onChange={e => {
                  const val = parsePercentInput(e.target.value);
                  setLateFeeConfig({...lateFeeConfig, lateInterestValue: val})
                }}
              />
            </div>
          </div>
        </div>
        <button onClick={handleSaveLateFee} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Salvar Configurações</button>
      </div>
    </div>
  );
}
