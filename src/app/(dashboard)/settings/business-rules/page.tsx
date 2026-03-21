'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, Save, X, Percent, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";

interface InterestRule {
  id: string;
  name: string;
  minInstallments: number;
  maxInstallments: number;
  interestRate: number;
  interestType: 'fixed' | 'weekly' | 'monthly';
  isActive: boolean;
}

interface DbInterestRule {
  id: string;
  name: string;
  min_installments: number;
  max_installments: number;
  interest_rate: number;
  interest_type: string;
  is_active: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

type SelectValue = 'percentage' | 'fixed' | 'none';
type LateInterestChargeType = 'daily' | 'weekly' | 'monthly';

interface SystemConfig {
  lateFeeType: 'percentage' | 'fixed' | null;
  lateFeeValue: number;
  lateInterestType: 'percentage' | 'fixed' | null;
  lateInterestValue: number;
  lateInterestChargeType: 'daily' | 'weekly' | 'monthly';
  renegotiationInterestRate: number;
  renegotiationMaxInstallments: number;
}

const isLateFeeEnabled = (config: SystemConfig) => config.lateFeeType !== null;
const isLateInterestEnabled = (config: SystemConfig) => config.lateInterestType !== null;

function validateNoOverlap(rules: InterestRule[], newRule: InterestRule, excludeId?: string): string | null {
  const filtered = rules.filter(r => r.id !== excludeId);
  for (const r of filtered) {
    const overlap = !(newRule.maxInstallments < r.minInstallments || newRule.minInstallments > r.maxInstallments);
    if (overlap) return `Intervalo sobrepõe com "${r.name}" (${r.minInstallments}-${r.maxInstallments} parcelas)`;
  }
  return null;
}

export default function BusinessRulesPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [interestRules, setInterestRules] = useState<InterestRule[]>([])
  const [config, setConfig] = useState<SystemConfig>({
    lateFeeType: null, lateFeeValue: 0,
    lateInterestType: null, lateInterestValue: 0, lateInterestChargeType: 'daily',
    renegotiationInterestRate: 10, renegotiationMaxInstallments: 12,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!user?.tenantId) {
        setLoading(false)
        return
      }
      
      try {
        const { data: rulesData, error: rulesError } = await supabase
          .from("interest_rules")
          .select("*")
          .eq("tenant_id", user.tenantId)
          .order("min_installments", { ascending: true })
        
        if (rulesError) throw rulesError
        
        if (rulesData) {
          setInterestRules(rulesData.map((r: DbInterestRule) => ({
            id: r.id,
            name: r.name,
            minInstallments: r.min_installments,
            maxInstallments: r.max_installments,
            interestRate: r.interest_rate,
            interestType: (r.interest_type || 'monthly') as 'fixed' | 'weekly' | 'monthly',
            isActive: r.is_active !== false
          })))
        }
        
        const { data: lateFeeData } = await supabase
          .from("late_fee_config")
          .select("*")
          .eq("tenant_id", user.tenantId)
          .single()
        
        if (lateFeeData) {
          const hasLateFee = lateFeeData.percentage !== null || lateFeeData.fixed_fee !== null
          const hasLateInterest = lateFeeData.late_interest_value !== null && lateFeeData.late_interest_value > 0
          
          setConfig(prev => ({
            ...prev,
            lateFeeType: hasLateFee ? (lateFeeData.percentage ? 'percentage' : 'fixed') : null,
            lateFeeValue: lateFeeData.percentage || lateFeeData.fixed_fee || 0,
            lateInterestType: hasLateInterest ? (lateFeeData.late_interest_type === 'fixed' ? 'fixed' : 'percentage') : null,
            lateInterestValue: lateFeeData.late_interest_value || 0,
            lateInterestChargeType: lateFeeData.late_interest_charge_type || 'daily'
          }))
        }
      } catch (err: unknown) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
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
      const { data } = await supabase
        .from("interest_rules")
        .select("*")
        .eq("tenant_id", user?.tenantId)
        .order("min_installments", { ascending: true })
      
      if (data) {
        setInterestRules(data.map((r: DbInterestRule) => ({
          id: r.id,
          name: r.name,
          minInstallments: r.min_installments,
          maxInstallments: r.max_installments,
          interestRate: r.interest_rate,
          interestType: (r.interest_type || 'monthly') as 'fixed' | 'weekly' | 'monthly',
          isActive: r.is_active !== false
        })))
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
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
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
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
        })
        .eq("id", editingId!)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Faixa atualizada com sucesso!' })
      setInterestRules(prev => prev.map(r => r.id === editingId ? ruleToUpdate : r))
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
    }

    setEditingId(null); setEditingRule({});
    setTimeout(() => setMessage(null), 3000)
  };

  const handleCancelEdit = () => { setEditingId(null); setEditingRule({}); setIsAddingNew(false); setNewRule({}); };

  const toggleRuleActive = async (rule: InterestRule) => {
    const newStatus = !rule.isActive
    try {
      const { error: updateError } = await supabase
        .from("interest_rules")
        .update({ is_active: newStatus })
        .eq("id", rule.id)

      if (updateError) throw updateError

      setInterestRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: newStatus } : r))
      setMessage({ type: 'success', text: `Faixa ${newStatus ? 'ativada' : 'desativada'} com sucesso!` })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
    }
    setTimeout(() => setMessage(null), 3000)
  };

  const handleSaveLateFee = async () => {
    try {
      const { data: existing } = await supabase
        .from("late_fee_config")
        .select("id")
        .eq("tenant_id", user?.tenantId)
        .single()

      const lateFeeEnabled = isLateFeeEnabled(config)
      const lateInterestEnabled = isLateInterestEnabled(config)

      if (existing) {
        const { error: updateError } = await supabase
          .from("late_fee_config")
          .update({
            percentage: config.lateFeeType === 'percentage' && lateFeeEnabled ? config.lateFeeValue : null,
            fixed_fee: config.lateFeeType === 'fixed' && lateFeeEnabled ? config.lateFeeValue : null,
            late_interest_type: lateInterestEnabled ? config.lateInterestType : null,
            late_interest_value: lateInterestEnabled ? config.lateInterestValue : null,
            late_interest_charge_type: lateInterestEnabled ? config.lateInterestChargeType : null,
          })
          .eq("tenant_id", user?.tenantId)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("late_fee_config")
          .insert({
            tenant_id: user?.tenantId,
            percentage: config.lateFeeType === 'percentage' && lateFeeEnabled ? config.lateFeeValue : null,
            fixed_fee: config.lateFeeType === 'fixed' && lateFeeEnabled ? config.lateFeeValue : null,
            late_interest_type: lateInterestEnabled ? config.lateInterestType : null,
            late_interest_value: lateInterestEnabled ? config.lateInterestValue : null,
            late_interest_charge_type: lateInterestEnabled ? config.lateInterestChargeType : null,
          })

        if (insertError) throw insertError
      }

      setMessage({ type: 'success', text: 'Configurações de multa salvas!' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
    }
    setTimeout(() => setMessage(null), 3000)
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C55E]"></div>
      </div>
    )
  }

  if (!user?.tenantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regras de Negócio</h1>
          <p className="text-gray-500 mt-1">Configure as taxas de juros e multas</p>
        </div>
        <Card className="border-yellow-200/60 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Configuração de tenant não encontrada.</p>
                <p className="text-sm text-yellow-700 mt-1">Faça login novamente para carregar suas configurações.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regras de Negócio</h1>
          <p className="text-gray-500 mt-1">Configure as taxas de juros e multas</p>
        </div>
        <Card className="border-red-200/60 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Erro ao carregar configurações:</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Regras de Negócio</h1>
        <p className="text-gray-500 mt-1">Configure as taxas de juros e multas</p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Interest Rules Section */}
      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Percent className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <CardTitle className="text-lg font-semibold">Faixas de Parcelas</CardTitle>
            </div>
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="bg-[#22C55E] hover:bg-[#4ADE80] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Faixa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isAddingNew && (
            <div className="bg-gray-50/50 p-4 rounded-lg mb-4 border border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Input 
                  placeholder="Nome" 
                  value={newRule.name || ''} 
                  onChange={e => setNewRule({...newRule, name: e.target.value})}
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Input 
                  type="number" 
                  placeholder="Mínimas" 
                  value={newRule.minInstallments || ''} 
                  onChange={e => setNewRule({...newRule, minInstallments: Number(e.target.value)})}
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Input 
                  type="number" 
                  placeholder="Máximas" 
                  value={newRule.maxInstallments || ''} 
                  onChange={e => setNewRule({...newRule, maxInstallments: Number(e.target.value)})}
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Input 
                  type="number" 
                  placeholder="Juros %" 
                  value={newRule.interestRate || ''} 
                  onChange={e => setNewRule({...newRule, interestRate: Number(e.target.value)})}
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                />
                <Select value={newRule.interestType || 'monthly'} onValueChange={(v) => setNewRule({...newRule, interestType: v as any})}>
                  <SelectTrigger className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="fixed">Fixo</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddNew}
                    size="sm"
                    className="bg-[#22C55E] hover:bg-[#4ADE80] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    className="border-gray-200/60 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {interestRules.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Percent className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhuma faixa de parcelas configurada</p>
              <p className="text-sm text-gray-400 mt-1">Clique em "Nova Faixa" para adicionar</p>
            </div>
          ) : (
            <div className="rounded-md border border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Parcelas</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Taxa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {interestRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                      {editingId === rule.id ? (
                        <>
                          <td className="p-2"><Input className="border-gray-200/60 focus:border-[#22C55E]" value={editingRule.name || ''} onChange={e => setEditingRule({...editingRule, name: e.target.value})} /></td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Input className="w-16 border-gray-200/60 focus:border-[#22C55E]" type="number" value={editingRule.minInstallments || 0} onChange={e => setEditingRule({...editingRule, minInstallments: Number(e.target.value)})} /> 
                              <span className="text-gray-400">-</span>
                              <Input className="w-16 border-gray-200/60 focus:border-[#22C55E]" type="number" value={editingRule.maxInstallments || 0} onChange={e => setEditingRule({...editingRule, maxInstallments: Number(e.target.value)})} />
                            </div>
                          </td>
                          <td className="p-2"><Input className="w-20 border-gray-200/60 focus:border-[#22C55E]" type="number" value={editingRule.interestRate || 0} onChange={e => setEditingRule({...editingRule, interestRate: Number(e.target.value)})} /></td>
                          <td className="p-2">
                            <Select value={editingRule.interestType || 'monthly'} onValueChange={(v) => setEditingRule({...editingRule, interestType: v as any})}>
                              <SelectTrigger className="w-28 border-gray-200/60 focus:border-[#22C55E]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="fixed">Fixo</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2">
                            <Button 
                              onClick={() => toggleRuleActive(rule)} 
                              variant="ghost"
                              size="sm"
                              className={rule.isActive ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'}
                            >
                              {rule.isActive ? 'Ativo' : 'Inativo'}
                            </Button>
                          </td>
                          <td className="p-2 text-right">
                            <Button onClick={handleSaveEdit} size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50 mr-1">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button onClick={handleCancelEdit} size="sm" variant="ghost" className="text-gray-500 hover:text-gray-600 hover:bg-gray-100">
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{rule.name}</td>
                          <td className="px-4 py-3">{rule.minInstallments} - {rule.maxInstallments}</td>
                          <td className="px-4 py-3">{rule.interestRate}%</td>
                          <td className="px-4 py-3">{rule.interestType === 'monthly' ? 'Mensal' : rule.interestType === 'weekly' ? 'Semanal' : 'Fixo'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              rule.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rule.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button onClick={() => handleEdit(rule)} size="sm" variant="ghost" className="text-[#1E3A8A] hover:text-[#22C55E] hover:bg-[#1E3A8A]/5 mr-1">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDelete(rule.id)} size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Late Fee Section */}
      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
              <AlertCircle className="h-5 w-5 text-[#1E3A8A]" />
            </div>
            <CardTitle className="text-lg font-semibold">Configuração de Juros por Atraso</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-6 pb-6 border-b border-gray-100">
            <h3 className="text-base font-medium mb-4">Multa de Atraso (cobrada uma vez)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Tipo</label>
                <Select value={isLateFeeEnabled(config) ? config.lateFeeType! : 'none'} onValueChange={(v: SelectValue) => setConfig({...config, lateFeeType: v === 'none' ? null : v as 'percentage' | 'fixed', lateFeeValue: v === 'none' ? 0 : config.lateFeeValue})}>
                  <SelectTrigger className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Valor</label>
                <Input 
                  type="number" 
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20" 
                  value={config.lateFeeValue || ''} 
                  onChange={e => setConfig({...config, lateFeeValue: Number(e.target.value)})}
                  placeholder={config.lateFeeType === 'percentage' ? "Ex: 10" : "Ex: 50,00"}
                  disabled={!config.lateFeeType}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Juros de Atraso (cobrados continuamente)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Tipo</label>
                <Select value={isLateInterestEnabled(config) ? config.lateInterestType! : 'none'} onValueChange={(v: SelectValue) => setConfig({...config, lateInterestType: v === 'none' ? null : v as 'percentage' | 'fixed', lateInterestValue: v === 'none' ? 0 : config.lateInterestValue})}>
                  <SelectTrigger className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Valor</label>
                <Input 
                  type="number" 
                  className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20" 
                  value={config.lateInterestValue || ''} 
                  onChange={e => setConfig({...config, lateInterestValue: Number(e.target.value)})}
                  placeholder={config.lateInterestType === 'percentage' ? "Ex: 1" : "Ex: 5,00"}
                  disabled={!config.lateInterestType}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Cobrar</label>
                <Select value={config.lateInterestChargeType} onValueChange={(v: LateInterestChargeType) => setConfig({...config, lateInterestChargeType: v})}>
                  <SelectTrigger className="bg-white border-gray-200/60 focus:border-[#22C55E] focus:ring-[#22C55E]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        
          <div className="mt-6">
            <Button 
              onClick={handleSaveLateFee}
              className="bg-[#22C55E] hover:bg-[#4ADE80] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
