'use client';

import { useState } from 'react';
import { Trash2, Plus, Edit2, Save, X } from 'lucide-react';

interface InterestRule {
  id: string;
  name: string;
  minInstallments: number;
  maxInstallments: number;
  interestRate: number;
  isActive: boolean;
}

interface SystemConfig {
  interestType: 'monthly' | 'weekly';
  lateFeeType: 'percentage' | 'fixed';
  lateFeeValue: number;
  lateInterestType: 'daily' | 'monthly';
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
  const [interestRules, setInterestRules] = useState<InterestRule[]>([
    { id: '1', name: 'Curto Prazo', minInstallments: 1, maxInstallments: 5, interestRate: 50, isActive: true },
    { id: '2', name: 'Médio Prazo', minInstallments: 6, maxInstallments: 10, interestRate: 80, isActive: true },
    { id: '3', name: 'Longo Prazo', minInstallments: 11, maxInstallments: 24, interestRate: 100, isActive: true },
  ]);
  
  const [config, setConfig] = useState<SystemConfig>({
    interestType: 'monthly', lateFeeType: 'percentage', lateFeeValue: 2,
    lateInterestType: 'monthly', lateInterestValue: 1, renegotiationInterestRate: 10, renegotiationMaxInstallments: 12,
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<InterestRule>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRule, setNewRule] = useState<Partial<InterestRule>>({});

  const handleSave = () => {
    for (const rule of interestRules) {
      const error = validateNoOverlap(interestRules, rule, rule.id);
      if (error) { setMessage({ type: 'error', text: error }); return; }
    }
    setMessage({ type: 'success', text: 'Configurações salvas!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddNew = () => {
    if (!newRule.name || !newRule.minInstallments || !newRule.maxInstallments || !newRule.interestRate) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' }); return;
    }
    const ruleToAdd: InterestRule = { id: String(Date.now()), name: newRule.name, minInstallments: newRule.minInstallments, maxInstallments: newRule.maxInstallments, interestRate: newRule.interestRate, isActive: true };
    const error = validateNoOverlap(interestRules, ruleToAdd);
    if (error) { setMessage({ type: 'error', text: error }); return; }
    setInterestRules([...interestRules, ruleToAdd]); setNewRule({}); setIsAddingNew(false);
    setMessage({ type: 'success', text: 'Faixa adicionada!' }); setTimeout(() => setMessage(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta faixa?')) { setInterestRules(interestRules.filter(r => r.id !== id)); }
  };

  const handleEdit = (rule: InterestRule) => { setEditingId(rule.id); setEditingRule({ ...rule }); };

  const handleSaveEdit = () => {
    if (!editingRule.name || !editingRule.minInstallments || !editingRule.maxInstallments || !editingRule.interestRate) return;
    const ruleToUpdate: InterestRule = { id: editingId!, name: editingRule.name!, minInstallments: editingRule.minInstallments!, maxInstallments: editingRule.maxInstallments!, interestRate: editingRule.interestRate!, isActive: editingRule.isActive ?? true };
    const error = validateNoOverlap(interestRules, ruleToUpdate, editingId!);
    if (error) { setMessage({ type: 'error', text: error }); return; }
    setInterestRules(interestRules.map(r => r.id === editingId ? ruleToUpdate : r)); setEditingId(null); setEditingRule({});
  };

  const handleCancelEdit = () => { setEditingId(null); setEditingRule({}); setIsAddingNew(false); setNewRule({}); };
  const toggleRuleActive = (id: string) => { setInterestRules(interestRules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r)); };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Regras de Negócio</h1>
      {message && <div className={`px-4 py-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message.text}</div>}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Tipo de Juros</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={config.interestType === 'monthly'} onChange={() => setConfig({...config, interestType: 'monthly'})} className="w-4 h-4" />
            Mensal
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={config.interestType === 'weekly'} onChange={() => setConfig({...config, interestType: 'weekly'})} className="w-4 h-4" />
            Semanal
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Juros por Faixa de Parcelas</h2>
          {!isAddingNew && <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded"><Plus size={18} /> Nova Faixa</button>}
        </div>
        <div className="grid grid-cols-6 gap-4 px-4 py-2 bg-gray-100 rounded font-medium text-sm">
          <div>Nome</div><div>Mín</div><div>Máx</div><div>Juros</div><div>Status</div><div>Ações</div>
        </div>
        {interestRules.map((rule) => (
          editingId === rule.id ? (
            <div key={rule.id} className="grid grid-cols-6 gap-4 p-3 bg-purple-50 rounded mb-2 items-center">
              <input type="text" value={editingRule.name || ''} onChange={(e) => setEditingRule({...editingRule, name: e.target.value})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.minInstallments || 0} onChange={(e) => setEditingRule({...editingRule, minInstallments: parseInt(e.target.value)})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.maxInstallments || 0} onChange={(e) => setEditingRule({...editingRule, maxInstallments: parseInt(e.target.value)})} className="px-2 py-1 border rounded" />
              <input type="number" value={editingRule.interestRate || 0} onChange={(e) => setEditingRule({...editingRule, interestRate: parseFloat(e.target.value)})} className="px-2 py-1 border rounded" />
              <div className="text-sm text-blue-600">Editando...</div>
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="p-1 text-green-600"><Save size={18} /></button>
                <button onClick={handleCancelEdit} className="p-1 text-red-600"><X size={18} /></button>
              </div>
            </div>
          ) : (
            <div key={rule.id} className={`grid grid-cols-6 gap-4 p-3 rounded mb-2 items-center ${rule.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
              <div className="font-medium">{rule.name}</div>
              <div>{rule.minInstallments}</div>
              <div>{rule.maxInstallments}</div>
              <div>{rule.interestRate}%</div>
              <div><button onClick={() => toggleRuleActive(rule.id)} className={`px-2 py-1 rounded text-xs ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{rule.isActive ? 'Ativo' : 'Inativo'}</button></div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(rule)} className="p-1 text-blue-600"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(rule.id)} className="p-1 text-red-600"><Trash2 size={18} /></button>
              </div>
            </div>
          )
        ))}
        {isAddingNew && (
          <div className="grid grid-cols-6 gap-4 p-3 bg-purple-50 rounded mb-2 items-center">
            <input type="text" value={newRule.name || ''} onChange={(e) => setNewRule({...newRule, name: e.target.value})} placeholder="Nome" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.minInstallments || ''} onChange={(e) => setNewRule({...newRule, minInstallments: parseInt(e.target.value)})} placeholder="Mín" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.maxInstallments || ''} onChange={(e) => setNewRule({...newRule, maxInstallments: parseInt(e.target.value)})} placeholder="Máx" className="px-2 py-1 border rounded" />
            <input type="number" value={newRule.interestRate || ''} onChange={(e) => setNewRule({...newRule, interestRate: parseFloat(e.target.value)})} placeholder="%" className="px-2 py-1 border rounded" />
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
          <select value={config.lateFeeType} onChange={(e) => setConfig({...config, lateFeeType: e.target.value as 'percentage' | 'fixed'})} className="px-3 py-2 border rounded">
            <option value="percentage">Percentual</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
          <input type="number" value={config.lateFeeValue} onChange={(e) => setConfig({...config, lateFeeValue: parseFloat(e.target.value) || 0})} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>{config.lateFeeType === 'percentage' ? '%' : 'R$'}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Juros por Atraso</h2>
        <div className="flex items-center gap-4">
          <select value={config.lateInterestType} onChange={(e) => setConfig({...config, lateInterestType: e.target.value as 'daily' | 'monthly'})} className="px-3 py-2 border rounded">
            <option value="daily">Diário</option>
            <option value="monthly">Mensal</option>
          </select>
          <input type="number" value={config.lateInterestValue} onChange={(e) => setConfig({...config, lateInterestValue: parseFloat(e.target.value) || 0})} className="w-32 px-3 py-2 border rounded" min={0} step={0.01} />
          <span>% {config.lateInterestType === 'daily' ? 'ao dia' : 'ao mês'}</span>
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

      <button onClick={handleSave} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
        Salvar Configurações
      </button>
    </div>
  );
}
