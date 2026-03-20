'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Mail, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Shield,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import type { StaffMember, CustomRole, InvitationStatus } from '@/types';

// Demo data
const demoRoles: CustomRole[] = [
  {
    id: '1',
    owner_id: 'owner-1',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    permissions: [
      { module: 'dashboard', view: true, create: true, edit: true, delete: true },
      { module: 'customers', view: true, create: true, edit: true, delete: true },
      { module: 'loans', view: true, create: true, edit: true, delete: true },
      { module: 'collections', view: true, create: true, edit: true, delete: true },
      { module: 'reports', view: true, create: true, edit: true, delete: true },
      { module: 'settings', view: true, create: true, edit: true, delete: true },
    ],
    is_default: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    owner_id: 'owner-1',
    name: 'Operador',
    description: 'Pode criar e editar, mas não excluir',
    permissions: [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false },
      { module: 'customers', view: true, create: true, edit: true, delete: false },
      { module: 'loans', view: true, create: true, edit: true, delete: false },
      { module: 'collections', view: true, create: true, edit: true, delete: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false },
      { module: 'settings', view: false, create: false, edit: false, delete: false },
    ],
    is_default: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '3',
    owner_id: 'owner-1',
    name: 'Visualizador',
    description: 'Apenas visualização',
    permissions: [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false },
      { module: 'customers', view: true, create: false, edit: false, delete: false },
      { module: 'loans', view: true, create: false, edit: false, delete: false },
      { module: 'collections', view: true, create: false, edit: false, delete: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false },
      { module: 'settings', view: false, create: false, edit: false, delete: false },
    ],
    is_default: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// Demo staff data
const demoStaff: StaffMember[] = [
  {
    id: '1',
    owner_id: 'owner-1',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    role_id: '1',
    role_name: 'Administrador',
    status: 'active',
    invitation_status: 'accepted',
    invitation_sent_at: '2024-01-15',
    invitation_accepted_at: '2024-01-15',
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: '2',
    owner_id: 'owner-1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    role_id: '2',
    role_name: 'Operador',
    status: 'active',
    invitation_status: 'accepted',
    invitation_sent_at: '2024-02-01',
    invitation_accepted_at: '2024-02-01',
    created_at: '2024-02-01',
    updated_at: '2024-02-01',
  },
  {
    id: '3',
    owner_id: 'owner-1',
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    role_id: '3',
    role_name: 'Visualizador',
    status: 'active',
    invitation_status: 'pending',
    invitation_sent_at: '2024-03-01',
    created_at: '2024-03-01',
    updated_at: '2024-03-01',
  },
  {
    id: '4',
    owner_id: 'owner-1',
    name: 'Ana Pereira',
    email: 'ana@empresa.com',
    role_id: undefined,
    role_name: undefined,
    status: 'active',
    invitation_status: 'pending',
    invitation_sent_at: '2024-03-10',
    created_at: '2024-03-10',
    updated_at: '2024-03-10',
  },
];

const modules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'customers', label: 'Clientes' },
  { key: 'loans', label: 'Empréstimos' },
  { key: 'collections', label: 'Cobranças' },
  { key: 'reports', label: 'Relatórios' },
  { key: 'settings', label: 'Configurações' },
];

export default function StaffManagementPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>(demoStaff);
  const [roles, setRoles] = useState<CustomRole[]>(demoRoles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: '', name: '', role_id: '' });
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && s.invitation_status === 'pending') ||
                         (statusFilter === 'active' && s.invitation_status === 'accepted' && s.status === 'active');
    return matchesSearch && matchesStatus;
  });

  const pendingInvitations = staff.filter(s => s.invitation_status === 'pending');
  const activeStaff = staff.filter(s => s.invitation_status === 'accepted' && s.status === 'active');

  // Handle invite
  const handleInvite = async () => {
    if (!newInvite.email || !newInvite.name) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newStaff: StaffMember = {
      id: String(Date.now()),
      owner_id: user?.id || 'owner-1',
      name: newInvite.name,
      email: newInvite.email,
      role_id: newInvite.role_id || undefined,
      role_name: roles.find(r => r.id === newInvite.role_id)?.name,
      status: 'active',
      invitation_status: 'pending',
      invitation_sent_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0],
    };
    
    setStaff([newStaff, ...staff]);
    setIsInviteOpen(false);
    setNewInvite({ email: '', name: '', role_id: '' });
    setSuccessMessage(`Convite enviado para ${newInvite.email}`);
    setTimeout(() => setSuccessMessage(''), 3000);
    setIsLoading(false);
  };

  // Handle update role
  const handleUpdateRole = (staffId: string, roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    setStaff(staff.map(s => 
      s.id === staffId 
        ? { ...s, role_id: roleId, role_name: role?.name, updated_at: new Date().toISOString().split('T')[0] }
        : s
    ));
    setSuccessMessage('Função atualizada com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle resend invite
  const handleResendInvite = (staffId: string) => {
    setStaff(staff.map(s => 
      s.id === staffId 
        ? { ...s, invitation_sent_at: new Date().toISOString().split('T')[0], updated_at: new Date().toISOString().split('T')[0] }
        : s
    ));
    setSuccessMessage('Convite reenviado!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle cancel invitation
  const handleCancelInvite = (staffId: string) => {
    setStaff(staff.filter(s => s.id !== staffId));
    setSuccessMessage('Convite cancelado!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle remove staff
  const handleRemoveStaff = (staffId: string) => {
    setStaff(staff.filter(s => s.id !== staffId));
    setSuccessMessage('Funcionário removido!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Get status badge
  const getStatusBadge = (staffMember: StaffMember) => {
    if (staffMember.invitation_status === 'pending') {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
    }
    if (staffMember.status === 'active') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Funcionários</h1>
          <p className="text-gray-500 mt-1">Convide e gerencie membros da sua equipe</p>
        </div>
        <Button 
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#22C55E] hover:bg-[#4ADE80] shadow-lg shadow-emerald-500/25"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Funcionário
        </Button>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Users className="h-5 w-5 text-[#1E3A8A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Convites Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">{pendingInvitations.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Equipe Ativa</p>
                <p className="text-2xl font-bold text-green-600">{activeStaff.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] border-gray-200">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Users className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <CardTitle className="text-lg font-semibold">Lista de Funcionários</CardTitle>
            </div>
            <p className="text-sm text-gray-500">
              Vinculados ao seu usuário (isolamento de dados)
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-md border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Funcionário</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Função</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Convidado em</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aceito em</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum funcionário encontrado</p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staffMember) => (
                    <tr key={staffMember.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#22C55E] flex items-center justify-center text-white font-semibold">
                            {staffMember.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{staffMember.name}</p>
                            <p className="text-sm text-gray-500">{staffMember.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {staffMember.invitation_status === 'accepted' ? (
                          <Select 
                            value={staffMember.role_id || ''} 
                            onValueChange={(value) => handleUpdateRole(staffMember.id, value)}
                          >
                            <SelectTrigger className="w-[160px] h-9">
                              <SelectValue placeholder="Selecionar função" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(staffMember)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(staffMember.invitation_sent_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(staffMember.invitation_accepted_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {staffMember.invitation_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResendInvite(staffMember.id)}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                title="Reenviar convite"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelInvite(staffMember.id)}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Cancelar convite"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {staffMember.invitation_status === 'accepted' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStaff(staffMember.id)}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              title="Remover funcionário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Owner Info */}
      <Card className="border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Você é o proprietário</p>
              <p className="text-sm text-blue-700">
                Apenas você pode gerenciar funcionários. Todos os dados são isolados por proprietário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
            <DialogDescription>
              Envie um convite por e-mail para adicionar um novo membro à sua equipe.
              Ele terá acesso apenas aos dados que você permitir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={newInvite.name}
                onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@empresa.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={newInvite.role_id} onValueChange={(value) => setNewInvite({ ...newInvite, role_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleInvite} 
              disabled={isLoading || !newInvite.email || !newInvite.name}
              className="bg-[#22C55E] hover:bg-[#4ADE80]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
