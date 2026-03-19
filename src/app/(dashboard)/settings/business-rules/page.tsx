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

function formatPercent(value: number): string {
  return value.toString().replace(/[^0-9.]/g, '');
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

export default function BusinessRulesPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [interestRules, setInterestRules] = useState<InterestRule[]>([])
  const [lateFeeConfig, setLateFeeConfig] = useState<LateFeeConfig>({
    lateFeeType: 'percentage',
    lateFeeValue: 2,
    lateInterestType: 'monthly',
    lateInterestValue: 1,
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
          setLateFeeConfig({
            lateFeeType: 'percentage',
            lateFeeValue: lateFeeData.percentage || 0,
            lateInterestType: lateFeeData.monthly_interest ? 'monthly' : 'daily',
            lateInterestValue: lateFeeData.monthly_interest || lateFeeData.daily_interest || 0
          })
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-#22C55E"></div>
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
      <h1 className="text-2xl font-bold">Configuração de Juros</h1>
      <p className="text-gray-600">Defina as taxas de juros para cada faixa de parcelas.</p>
      {message && <div className={`px-4 py-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>}

      {/* Interest Rules Section */}
      <div className="bg-white rounded-lg shadow p-6">
              <Calculator className="h-5 w-5 text-purple-600" />
              Taxas por Faixa de Parcelas
            </h2>
            <p className="text-sm text-gray-500 mt-1">Configure o percentual de juros para cada quantidade de parcelas.</p>
          </div>
          <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
>>>>>>> 6aba21a79762aaec1363f0bbf5339fbd88cba923
            <Plus size={16} /> Nova Faixa
          </button>
        </div>

        {/* Add new rule form */}
        {isAddingNew && (
          <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
            <h3 className="font-medium mb-4">Nova Faixa de Juros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input 
                  type="text" 
                  placeholder="Ex: Parcelas Pequenas" 
                  className="w-full border p-2 rounded"
                  value={newRule.name || ''} 
                  onChange={e => setNewRule({...newRule, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas Mínimas</label>
                <input 
                  type="number" 
                  placeholder="1" 
                  className="w-full border p-2 rounded no-arrows"
                  value={newRule.minInstallments || ''} 
                  onChange={e => setNewRule({...newRule, minInstallments: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas Máximas</label>
                <input 
                  type="number" 
                  placeholder="6" 
                  className="w-full border p-2 rounded no-arrows"
                  value={newRule.maxInstallments || ''} 
                  onChange={e => setNewRule({...newRule, maxInstallments: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentual (%)</label>
                <input 
                  type="number" 
                  placeholder="10" 
                  className="w-full border p-2 rounded no-arrows"
                  value={newRule.interestRate || ''} 
                  onChange={e => setNewRule({...newRule, interestRate: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Juros</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={newRule.interestType || 'monthly'}
                  onChange={e => setNewRule({...newRule, interestType: e.target.value as InterestType})}
                >
                  <option value="monthly">Ao mês (recorrente)</option>
                  <option value="weekly">À semana (recorrente)</option>
                  <option value="total">Taxa única (total)</option>
                </select>
              </div>
            </div>
            {newRule.interestRate && newRule.interestType && (
              <div className="mt-3 p-2 bg-purple-100 rounded text-sm text-purple-700">
                <strong>Exemplo:</strong> {getInterestTypeExample(newRule.interestType, newRule.interestRate)}
                {newRule.interestType === 'total' && newRule.minInstallments && newRule.maxInstallments && (
                  <span> - O valor total terá {newRule.interestRate}% de juros incluído</span>
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <Save size={16} /> Salvar
              </button>
              <button onClick={handleCancelEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                <X size={16} /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Rules list */}
        {interestRules.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma faixa de juros configurada.</p>
            <p className="text-gray-400 text-sm">Clique em "Nova Faixa" para adicionar sua primeira regra.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Parcelas</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Percentual</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Como Aplica</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {interestRules.map(rule => (
                  <tr key={rule.id} className="border-b hover:bg-gray-50">
                    {editingId === rule.id ? (
                      <>
                        <td className="py-3 px-4"><input className="border p-1 rounded w-full" value={editingRule.name || ''} onChange={e => setEditingRule({...editingRule, name: e.target.value})} /></td>
                        <td className="py-3 px-4">
                          <input className="border p-1 rounded w-16 no-arrows" type="number" value={editingRule.minInstallments || 0} onChange={e => setEditingRule({...editingRule, minInstallments: Number(e.target.value)})} />
                          <span className="mx-1">-</span>
                          <input className="border p-1 rounded w-16 no-arrows" type="number" value={editingRule.maxInstallments || 0} onChange={e => setEditingRule({...editingRule, maxInstallments: Number(e.target.value)})} />
                        </td>
                        <td className="py-3 px-4"><input className="border p-1 rounded w-20 no-arrows" type="number" value={editingRule.interestRate || 0} onChange={e => setEditingRule({...editingRule, interestRate: Number(e.target.value)})} /></td>
                        <td className="py-3 px-4">
                          <select className="border p-1 rounded" value={editingRule.interestType || 'monthly'} onChange={e => setEditingRule({...editingRule, interestType: e.target.value as InterestType})}>
                            <option value="monthly">Ao mês</option>
                            <option value="weekly">À semana</option>
                            <option value="total">Taxa única</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleRuleActive(rule)} className={`px-2 py-1 rounded text-sm ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded mr-1"><Save size={18} /></button>
                          <button onClick={handleCancelEdit} className="p-1 text-gray-600 hover:bg-gray-50 rounded"><X size={18} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-medium">{rule.name}</td>
                        <td className="py-3 px-4">{rule.minInstallments} - {rule.maxInstallments}</td>
                        <td className="py-3 px-4 font-semibold text-purple-600">{rule.interestRate}%</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-purple-50 text-purple-700">
                            {getInterestTypeLabel(rule.interestType)}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">{getInterestTypeExample(rule.interestType, rule.interestRate)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleRuleActive(rule)} className={`px-2 py-1 rounded text-sm ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleEdit(rule)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-1"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(rule.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Late Fee Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Juros por Atraso
          </h2>
          <p className="text-sm text-gray-500 mt-1">Configure a cobrança adicional para parcelas atrasadas.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Multa por Atraso (%)</label>
            <input 
              type="number" 
              className="w-full border p-2 rounded no-arrows"
              value={lateFeeConfig.lateFeeValue} 
              onChange={e => setLateFeeConfig({...lateFeeConfig, lateFeeValue: Number(e.target.value)})} 
            />
            <p className="text-xs text-gray-500 mt-1">Percentual aplicado sobre o valor da parcela atrasada.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Juros por Dia de Atraso (%)</label>
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
                type="number" 
                className="flex-1 border p-2 rounded no-arrows"
                value={lateFeeConfig.lateInterestValue} 
                onChange={e => setLateFeeConfig({...lateFeeConfig, lateInterestValue: Number(e.target.value)})} 
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lateFeeConfig.lateInterestType === 'daily' 
                ? `${lateFeeConfig.lateInterestValue}% por dia de atraso`
                : `${lateFeeConfig.lateInterestValue}% ao mês de atraso`
              }
            </p>
          </div>
        </div>
        <button onClick={handleSaveLateFee} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
          Salvar Configurações de Atraso
        </button>
>>>>>>> 6aba21a79762aaec1363f0bbf5339fbd88cba923
      </div>

      {/* CSS for hiding number input arrows */}
      <style jsx>{`
        .no-arrows::-webkit-outer-spin-button,
        .no-arrows::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-arrows[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
