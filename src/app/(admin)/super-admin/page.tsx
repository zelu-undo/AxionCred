'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building2, TrendingUp } from "lucide-react";

interface Company {
  id: string;
  name: string;
  document: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
}

export default function SuperAdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies'>('dashboard')
  const [message, setMessage] = useState('')

  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/dashboard')
    }
  }, [user, router])

  // Fetch all tenants (companies)
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const { data } = await supabase
          .from("tenants")
          .select("id, name, document, email, plan, is_active, created_at")
          .order("created_at", { ascending: false })
        
        if (data) {
          setCompanies(data.map(t => ({
            id: t.id,
            name: t.name,
            document: t.document || '',
            email: t.email || '',
            plan: t.plan || 'free',
            status: t.is_active ? 'active' : 'inactive',
            created_at: t.created_at
          })))
        }
      } catch (err) {
        console.error("Error fetching companies:", err)
      } finally {
        setLoading(false)
      }
    }
    
    if (user?.role === 'super_admin') {
      fetchCompanies()
    }
  }, [user])

  const handleApproveCompany = async (companyId: string) => {
    await supabase
      .from("tenants")
      .update({ is_active: true })
      .eq("id", companyId)
    
    setCompanies(companies.map(c => 
      c.id === companyId ? { ...c, status: 'active' } : c
    ))
    setMessage('Empresa ativada!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleUpdatePlan = async (companyId: string, newPlan: string) => {
    await supabase
      .from("tenants")
      .update({ plan: newPlan })
      .eq("id", companyId)
    
    setCompanies(companies.map(c => 
      c.id === companyId ? { ...c, plan: newPlan } : c
    ))
    setMessage('Plano atualizado!')
    setTimeout(() => setMessage(''), 3000)
  }

  // Statistics
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    free: companies.filter(c => c.plan === 'free').length,
    starter: companies.filter(c => c.plan === 'starter').length,
    pro: companies.filter(c => c.plan === 'pro').length,
    enterprise: companies.filter(c => c.plan === 'enterprise').length,
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-purple-100 text-purple-700">Enterprise</Badge>
      case 'pro':
        return <Badge className="bg-blue-100 text-blue-700">Pro</Badge>
      case 'starter':
        return <Badge className="bg-amber-100 text-amber-700">Starter</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">Free</Badge>
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Acesso restrito</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
          <p className="text-gray-500">Gerencie todas as empresas e planos</p>
        </div>
        {message && (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            {message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'dashboard' 
              ? 'border-[#22C55E] text-[#22C55E]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('companies')} 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'companies' 
              ? 'border-[#22C55E] text-[#22C55E]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Empresas
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-gray-500">Total Empresas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm text-gray-500">Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inactive}</p>
                    <p className="text-sm text-gray-500">Inativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.enterprise}</p>
                    <p className="text-sm text-gray-500">Enterprise</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plans Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-700">{stats.free}</p>
                  <p className="text-sm text-gray-500">Free</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{stats.starter}</p>
                  <p className="text-sm text-gray-500">Starter</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.pro}</p>
                  <p className="text-sm text-gray-500">Pro</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{stats.enterprise}</p>
                  <p className="text-sm text-gray-500">Enterprise</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Plano</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Criado em</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma empresa encontrada
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getPlanBadge(company.plan)}
                      </td>
                      <td className="px-4 py-3">
                        {company.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" /> Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {company.status === 'inactive' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveCompany(company.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Ativar
                            </Button>
                          )}
                          <select
                            value={company.plan}
                            onChange={(e) => handleUpdatePlan(company.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="free">Free</option>
                            <option value="starter">Starter</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}