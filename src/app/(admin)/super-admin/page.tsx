'use client';

import { useState } from 'react';

interface Company {
  id: string;
  name: string;
  domain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'pending';
  metrics: {
    totalCustomers: number;
    activeLoans: number;
    defaultRate: number;
    monthlyRevenue: number;
  };
}

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: '1',
      name: 'AXION Cred',
      domain: 'axioncred.com.br',
      plan: 'enterprise',
      status: 'active',
      metrics: { totalCustomers: 248, activeLoans: 156, defaultRate: 8.5, monthlyRevenue: 45000 },
    },
    {
      id: '2',
      name: 'CredFácil',
      domain: 'credfacil.com',
      plan: 'professional',
      status: 'active',
      metrics: { totalCustomers: 89, activeLoans: 45, defaultRate: 12.3, monthlyRevenue: 12000 },
    },
    {
      id: '3',
      name: 'MicroCred',
      domain: 'microcred.com',
      plan: 'starter',
      status: 'active',
      metrics: { totalCustomers: 34, activeLoans: 18, defaultRate: 5.2, monthlyRevenue: 3500 },
    },
    {
      id: '4',
      name: 'Teste Corp',
      domain: 'teste.com',
      plan: 'starter',
      status: 'pending',
      metrics: { totalCustomers: 0, activeLoans: 0, defaultRate: 0, monthlyRevenue: 0 },
    },
  ]);

  const [activeTab, setActiveTab] = useState<'companies' | 'plans' | 'metrics'>('companies');
  const [message, setMessage] = useState('');

  const plans = [
    { id: 'starter', name: 'Starter', price: 97, features: ['Até 100 clientes', '5 usuários', 'Relatórios básicos'] },
    { id: 'professional', name: 'Professional', price: 297, features: ['Clientes ilimitados', '15 usuários', 'Relatórios avançados', 'API'] },
    { id: 'enterprise', name: 'Enterprise', price: 797, features: ['Clientes ilimitados', 'Usuários ilimitados', 'Tudo incluso', 'Suporte prioritário'] },
  ];

  const handleToggleStatus = (id: string) => {
    setCompanies(companies.map(c => 
      c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c
    ));
    setMessage('Status atualizado!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleChangePlan = (companyId: string, plan: Company['plan']) => {
    setCompanies(companies.map(c => 
      c.id === companyId ? { ...c, plan } : c
    ));
    setMessage('Plano atualizado!');
    setTimeout(() => setMessage(''), 3000);
  };

  const totalMetrics = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    totalCustomers: companies.reduce((acc, c) => acc + c.metrics.totalCustomers, 0),
    avgDefaultRate: companies.reduce((acc, c) => acc + c.metrics.defaultRate, 0) / companies.length,
    totalRevenue: companies.reduce((acc, c) => acc + c.metrics.monthlyRevenue, 0),
  };

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getPlanColor = (plan: Company['plan']) => {
    switch (plan) {
      case 'starter': return 'bg-blue-100 text-blue-700';
      case 'professional': return 'bg-purple-100 text-purple-700';
      case 'enterprise': return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}
      </div>

      <div className="flex gap-2 border-b">
        {(['companies', 'plans', 'metrics'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
            {tab === 'companies' ? 'Empresas' : tab === 'plans' ? 'Planos' : 'Métricas Globais'}
          </button>
        ))}
      </div>

      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.totalCompanies}</div>
              <div className="text-sm text-gray-600">Total de Empresas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{totalMetrics.activeCompanies}</div>
              <div className="text-sm text-gray-600">Ativas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.totalCustomers}</div>
              <div className="text-sm text-gray-600">Total Clientes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.avgDefaultRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Taxa Média Inadimplência</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Empresa</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Métricas</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.domain}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select value={company.plan} onChange={(e) => handleChangePlan(company.id, e.target.value as Company['plan'])} className={`px-2 py-1 rounded text-sm ${getPlanColor(company.plan)}`}>
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(company.status)}`}>
                        {company.status === 'active' ? 'Ativo' : company.status === 'inactive' ? 'Inativo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{company.metrics.totalCustomers} clientes</div>
                      <div>{company.metrics.activeLoans} empréstimos</div>
                      <div className={company.metrics.defaultRate > 10 ? 'text-red-600' : 'text-green-600'}>
                        {company.metrics.defaultRate}% inadimplência
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(company.id)} className={`px-2 py-1 rounded text-sm ${company.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {company.status === 'active' ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-4">R$ {plan.price}<span className="text-sm font-normal">/mês</span></div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
              <div className="text-3xl font-bold text-green-600">R$ {totalMetrics.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Taxa Inadimplência</h3>
              <div className={`text-3xl font-bold ${totalMetrics.avgDefaultRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {totalMetrics.avgDefaultRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Uso da Plataforma</h3>
              <div className="text-3xl font-bold text-blue-600">{totalMetrics.totalCustomers}</div>
              <div className="text-sm text-gray-600">clientes cadastrados</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Inadimplência por Empresa</h3>
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm">{company.name}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div className={`h-4 rounded-full ${company.metrics.defaultRate > 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(company.metrics.defaultRate * 5, 100)}%` }} />
                  </div>
                  <div className="w-16 text-sm text-right">{company.metrics.defaultRate}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
