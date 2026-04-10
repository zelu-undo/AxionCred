'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Building2, TrendingUp, Users, Search, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";

interface Company {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  created_at: string;
  user_count?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  tenant_id: string;
}

export default function SuperAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'companies' | 'users'>('dashboard')
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Read tab from URL params
  useEffect(() => {
    const tab = searchParams?.get('tab') as 'dashboard' | 'companies' | 'users' | null
    if (tab && ['dashboard', 'companies', 'users'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])
  
  // Dialog states
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false)
  const [isDeleteCompanyOpen, setIsDeleteCompanyOpen] = useState(false)
  const [isViewUsersOpen, setIsViewUsersOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', document: '', plan: '' })

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
        // Fetch tenants with user count
        const { data: tenantsData } = await supabase
          .from("tenants")
          .select("id, name, document, email, phone, plan, is_active, created_at")
          .order("created_at", { ascending: false })
        
        if (tenantsData) {
          // Get user counts for each tenant
          const tenantsWithUsers = await Promise.all(
            tenantsData.map(async (t) => {
              const { count } = await supabase
                .from("users")
                .select("*", { count: 'exact', head: true })
                .eq("tenant_id", t.id)
              
              return {
                id: t.id,
                name: t.name,
                document: t.document || '',
                email: t.email || '',
                phone: t.phone || '',
                plan: t.plan || 'free',
                status: t.is_active ? 'active' : 'inactive',
                created_at: t.created_at,
                user_count: count || 0
              }
            })
          )
          setCompanies(tenantsWithUsers)
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

  // Filter companies by search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.document?.includes(searchQuery)
  )

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load users when tab changes to users
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      const loadAllUsers = async () => {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name, email, role, status, tenant_id")
        
        if (usersData) {
          setUsers(usersData.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || 'operator',
            status: u.status || 'active',
            tenant_id: u.tenant_id
          })))
        }
      }
      loadAllUsers()
    }
  }, [activeTab])

  // Statistics
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    free: companies.filter(c => c.plan === 'free').length,
    starter: companies.filter(c => c.plan === 'starter').length,
    pro: companies.filter(c => c.plan === 'pro').length,
    enterprise: companies.filter(c => c.plan === 'enterprise').length,
    totalUsers: companies.reduce((acc, c) => acc + (c.user_count || 0), 0),
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

  // Actions
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

  const handleDeactivateCompany = async (companyId: string) => {
    await supabase
      .from("tenants")
      .update({ is_active: false })
      .eq("id", companyId)
    
    setCompanies(companies.map(c => 
      c.id === companyId ? { ...c, status: 'inactive' } : c
    ))
    setMessage('Empresa desativada!')
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

  const openEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setEditForm({
      name: company.name,
      email: company.email,
      phone: company.phone,
      document: company.document,
      plan: company.plan
    })
    setIsEditCompanyOpen(true)
  }

  const handleSaveCompany = async () => {
    if (!selectedCompany) return

    await supabase
      .from("tenants")
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        document: editForm.document,
        plan: editForm.plan
      })
      .eq("id", selectedCompany.id)

    setCompanies(companies.map(c => 
      c.id === selectedCompany.id ? { 
        ...c, 
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        document: editForm.document,
        plan: editForm.plan
      } : c
    ))

    setIsEditCompanyOpen(false)
    setMessage('Empresa atualizada!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return

    // Delete users first
    await supabase
      .from("users")
      .delete()
      .eq("tenant_id", selectedCompany.id)

    // Delete tenant
    await supabase
      .from("tenants")
      .delete()
      .eq("id", selectedCompany.id)

    setCompanies(companies.filter(c => c.id !== selectedCompany.id))
    setIsDeleteCompanyOpen(false)
    setMessage('Empresa excluída!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleViewUsers = async (company: Company) => {
    setSelectedCompany(company)
    
    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, email, role, status")
      .eq("tenant_id", company.id)
    
    if (usersData) {
      setUsers(usersData.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'operator',
        status: u.status || 'active',
        tenant_id: company.id
      })))
    }
    
    setIsViewUsersOpen(true)
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId)

    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ))
    setMessage('Função do usuário atualizada!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeactivateUser = async (userId: string) => {
    await supabase
      .from("users")
      .update({ status: 'inactive' })
      .eq("id", userId)

    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: 'inactive' } : u
    ))
    setMessage('Usuário desativado!')
    setTimeout(() => setMessage(''), 3000)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-700">Super Admin</Badge>
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-700">Proprietário</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
      case 'manager':
        return <Badge className="bg-amber-100 text-amber-700">Gerente</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">Operador</Badge>
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
          <p className="text-gray-500">Gerencie todas as empresas e usuários do sistema</p>
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
          Empresas ({companies.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'users' 
              ? 'border-[#22C55E] text-[#22C55E]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Usuários ({users.length})
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
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-500">Usuários</p>
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar empresas por nome, email ou documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Companies Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Plano</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Usuários</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Criado em</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhuma empresa encontrada
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
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
                      <td className="px-4 py-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewUsers(company)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          {company.user_count || 0}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditCompany(company)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {company.status === 'active' ? (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeactivateCompany(company.id)}
                              title="Desativar"
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleApproveCompany(company.id)}
                              title="Ativar"
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <select
                            value={company.plan}
                            onChange={(e) => handleUpdatePlan(company.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                            title="Alterar plano"
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

      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Função</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {companies.find(c => c.id === user.tenant_id)?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Select value={user.role} onValueChange={(v) => handleChangeUserRole(user.id, v)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Proprietário</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.role !== 'owner' && user.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeactivateUser(user.id)}
                            title="Desativar"
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Empresa</Label>
              <Input 
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input 
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div>
              <Label>CNPJ/CPF</Label>
              <Input 
                value={editForm.document}
                onChange={(e) => setEditForm({...editForm, document: e.target.value})}
              />
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={editForm.plan} onValueChange={(v) => setEditForm({...editForm, plan: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCompany}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Users Dialog */}
      <Dialog open={isViewUsersOpen} onOpenChange={setIsViewUsersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Usuários da {selectedCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum usuário encontrado</p>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Nome</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Função</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-2">{u.name}</td>
                      <td className="px-4 py-2 text-gray-500">{u.email}</td>
                      <td className="px-4 py-2">
                        <Select value={u.role} onValueChange={(v) => handleChangeUserRole(u.id, v)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Proprietário</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        {u.status === 'active' ? (
                          <span className="text-green-600">Ativo</span>
                        ) : (
                          <span className="text-red-600">Inativo</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {u.role !== 'owner' && u.status === 'active' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeactivateUser(u.id)}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewUsersOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}