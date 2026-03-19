'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter()
  const [companies] = useState<Company[]>([
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
      name: 'CredFacil',
      domain: 'credfacil.com',
      plan: 'professional',
      status: 'active',
      metrics: { totalCustomers: 89, activeLoans: 45, defaultRate: 12.3, monthlyRevenue: 12000 },
    },
  ]);

  const [activeTab, setActiveTab] = useState<'demo' | 'companies' | 'plans' | 'metrics'>('demo');
  const [message, setMessage] = useState('');
  const [demoEnabled, setDemoEnabled] = useState(false)

  useEffect(() => {
    const demo = localStorage.getItem("axion_demo_enabled")
    setDemoEnabled(!!demo)
  }, [])

  const handleToggleDemo = () => {
    if (demoEnabled) {
      localStorage.removeItem("axion_demo_enabled")
      setDemoEnabled(false)
      setMessage('Demo desativado!')
    } else {
      localStorage.setItem("axion_demo_enabled", "true")
      setDemoEnabled(true)
      setMessage('Demo ativado!')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  const plans = [
    { id: 'starter', name: 'Starter', price: 97, features: [' ate 100 clientes', '5 usuarios', 'Relatorios basicos'] },
    { id: 'professional', name: 'Professional', price: 297, features: ['Clientes ilimitados', '15 usuarios', 'Relatorios avancados', 'API'] },
    { id: 'enterprise', name: 'Enterprise', price: 797, features: ['Clientes ilimitados', 'Usuarios ilimitados', 'Tudo incluso', 'Suporte prioritario'] },
  ];

  const totalMetrics = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    totalCustomers: companies.reduce((acc, c) => acc + c.metrics.totalCustomers, 0),
    avgDefaultRate: companies.reduce((acc, c) => acc + c.metrics.defaultRate, 0) / companies.length,
    totalRevenue: companies.reduce((acc, c) => acc + c.metrics.monthlyRevenue, 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Super Admin</h1>
        {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}
      </div>

      <div className="flex gap-2 border-b">
        <button key="demo" onClick={() => setActiveTab('demo')} className={`px-4 py-2 font-medium ${activeTab === 'demo' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          Demo
        </button>
        <button key="companies" onClick={() => setActiveTab('companies')} className={`px-4 py-2 font-medium ${activeTab === 'companies' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          Empresas
        </button>
        <button key="plans" onClick={() => setActiveTab('plans')} className={`px-4 py-2 font-medium ${activeTab === 'plans' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          Planos
        </button>
        <button key="metrics" onClick={() => setActiveTab('metrics')} className={`px-4 py-2 font-medium ${activeTab === 'metrics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          Metricas
        </button>
      </div>

      {activeTab === 'demo' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Configurar Demo</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Modo Demo</h3>
                <p className="text-sm text-gray-500">Permite acesso a demonstracao</p>
              </div>
              <button onClick={handleToggleDemo} className={`px-4 py-2 rounded-lg ${demoEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                {demoEnabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>
            <div className="mt-4 p-4 bg-#22C55E/10 rounded-lg">
              <p className="text-purple-800 font-medium">Link: https://seusite.vercel.app/demo</p>
              <button onClick={() => router.push('/demo')} className="mt-2 px-4 py-2 bg-#22C55E text-white rounded">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.totalCompanies}</div>
              <div className="text-sm text-gray-600">Empresas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{totalMetrics.activeCompanies}</div>
              <div className="text-sm text-gray-600">Ativas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.totalCustomers}</div>
              <div className="text-sm text-gray-600">Clientes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold">{totalMetrics.avgDefaultRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Inadimplencia</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Empresa</th>
                  <th className="px-4 py-3 text-left">Plano</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.domain}</div>
                    </td>
                    <td className="px-4 py-3">{company.plan}</td>
                    <td className="px-4 py-3">{company.status}</td>
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
              <div className="text-3xl font-bold mb-4">R$ {plan.price}<span className="text-sm font-normal">/mes</span></div>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
            <div className="text-3xl font-bold text-green-600">R$ {totalMetrics.totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
