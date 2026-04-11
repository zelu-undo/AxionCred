'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Eye,
  UserPlus,
  Settings,
  FileText,
  Users,
  CreditCard,
  Receipt,
  LayoutDashboard,
  Loader2,
  Search,
  Copy,
  Info
} from 'lucide-react';
import { trpc } from "@/trpc/client";
import type { CustomRole, RolePermission } from '@/types';

// Available modules for permissions
const availableModules = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'loans', label: 'Empréstimos', icon: CreditCard },
  { key: 'collections', label: 'Cobranças', icon: Receipt },
  { key: 'reports', label: 'Relatórios', icon: FileText },
  { key: 'settings', label: 'Configurações', icon: Settings },
];

// Demo roles
const demoRoles: CustomRole[] = [
  {
    id: '1',
    owner_id: 'owner-1',
    name: 'Administrador',
    description: 'Acesso total ao sistema com todas as permissões',
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
    name: 'Gerente',
    description: 'Pode gerenciar clientes, empréstimos e cobranças',
    permissions: [
      { module: 'dashboard', view: true, create: true, edit: true, delete: false },
      { module: 'customers', view: true, create: true, edit: true, delete: false },
      { module: 'loans', view: true, create: true, edit: true, delete: false },
      { module: 'collections', view: true, create: true, edit: true, delete: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false },
      { module: 'settings', view: true, create: false, edit: false, delete: false },
    ],
    is_default: false,
    created_at: '2024-01-15',
    updated_at: '2024-01-15',
  },
  {
    id: '3',
    owner_id: 'owner-1',
    name: 'Operador',
    description: 'Pode criar e editar, mas não excluir dados',
    permissions: [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false },
      { module: 'customers', view: true, create: true, edit: true, delete: false },
      { module: 'loans', view: true, create: true, edit: true, delete: false },
      { module: 'collections', view: true, create: true, edit: true, delete: false },
      { module: 'reports', view: false, create: false, edit: false, delete: false },
      { module: 'settings', view: false, create: false, edit: false, delete: false },
    ],
    is_default: false,
    created_at: '2024-02-01',
    updated_at: '2024-02-01',
  },
  {
    id: '4',
    owner_id: 'owner-1',
    name: 'Visualizador',
    description: 'Apenas visualização, sem permissões de edição',
    permissions: [
      { module: 'dashboard', view: true, create: false, edit: false, delete: false },
      { module: 'customers', view: true, create: false, edit: false, delete: false },
      { module: 'loans', view: true, create: false, edit: false, delete: false },
      { module: 'collections', view: true, create: false, edit: false, delete: false },
      { module: 'reports', view: true, create: false, edit: false, delete: false },
      { module: 'settings', view: false, create: false, edit: false, delete: false },
    ],
    is_default: false,
    created_at: '2024-02-15',
    updated_at: '2024-02-15',
  },
];

// Default permissions structure
const createDefaultPermissions = (): RolePermission[] => {
  return availableModules.map(mod => ({
    module: mod.key,
    view: false,
    create: false,
    edit: false,
    delete: false,
  }));
};

export default function RolesManagementPage() {
  // Fetch roles from API
  const { data: rolesData, refetch: refetchRoles } = trpc.users.listRoles.useQuery()
  
  // Create role mutation
  const createRoleMutation = trpc.users.createRole.useMutation({
    onSuccess: () => refetchRoles(),
    onError: (error: any) => alert('Erro: ' + error.message)
  })
  
  // Update role mutation
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => refetchRoles(),
    onError: (error: any) => alert('Erro: ' + error.message)
  })
  
  // Delete role mutation
  const deleteRoleMutation = trpc.users.deleteRole.useMutation({
    onSuccess: () => refetchRoles(),
    onError: (error: any) => alert('Erro: ' + error.message)
  })
  
  // Use API data or demo
  const roles: CustomRole[] = rolesData?.roles || demoRoles
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: createDefaultPermissions(),
  });

  // Filter roles
  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open dialog for new role
  const handleOpenNewRole = () => {
    setFormData({
      name: '',
      description: '',
      permissions: createDefaultPermissions(),
    });
    setIsEditing(false);
    setSelectedRole(null);
    setIsRoleDialogOpen(true);
  };

  // Open dialog for editing
  const handleOpenEdit = (role: CustomRole) => {
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setIsEditing(true);
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDelete = (role: CustomRole) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  // Handle permission change - with gradual validation
  const handlePermissionChange = (module: string, permission: keyof RolePermission, value: boolean) => {
    // If enabling create/edit/delete, automatically enable view first
    if (value && permission !== 'view') {
      const currentPerm = formData.permissions.find(p => p.module === module)
      if (currentPerm && !currentPerm.view) {
        setFormData(prev => ({
          ...prev,
          permissions: prev.permissions.map(p => 
            p.module === module ? { ...p, view: true, [permission]: value } : p
          ),
        }))
        return
      }
    }
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.module === module ? { ...p, [permission]: value } : p
      ),
    }))
  }

  // Handle view change - auto-disable others when view is disabled
  const handleViewChange = (module: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.module === module 
          ? { ...p, view: value, create: value ? p.create : false, edit: value ? p.edit : false, delete: value ? p.delete : false } 
          : p
      ),
    }))
  }

  // Handle select all for a module
  const handleSelectAllModule = (module: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => 
        p.module === module ? { ...p, view: value, create: value, edit: value, delete: value } : p
      ),
    }));
  };

  // Handle save role
  const handleSaveRole = async () => {
    if (!formData.name) return;
    
    // Convert permissions to array of strings
    const permissionsArray = formData.permissions
      .filter(p => p.view || p.create || p.edit || p.delete)
      .map(p => `${p.module}:${p.view ? 'view' : ''}${p.create ? ',create' : ''}${p.edit ? ',edit' : ''}${p.delete ? ',delete' : ''}`)
    
    if (isEditing && selectedRole) {
      updateRoleMutation.mutate({
        id: selectedRole.id,
        name: formData.name,
        permissions: permissionsArray,
      })
    } else {
      createRoleMutation.mutate({
        name: formData.name,
        permissions: permissionsArray,
      })
    }
    
    setIsRoleDialogOpen(false);
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    deleteRoleMutation.mutate({ id: selectedRole.id })
    setIsDeleteDialogOpen(false);
  };

  // Get permission count
  const getPermissionCount = (role: CustomRole) => {
    const total = role.permissions.reduce((acc, p) => {
      return acc + (p.view ? 1 : 0) + (p.create ? 1 : 0) + (p.edit ? 1 : 0) + (p.delete ? 1 : 0);
    }, 0);
    return total;
  };

  // Get module icon
  const getModuleIcon = (moduleKey: string) => {
    const mod = availableModules.find(m => m.key === moduleKey);
    return mod ? mod.icon : Shield;
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
          <h1 className="text-2xl font-bold text-gray-900">Funções e Permissões</h1>
          <p className="text-gray-500 mt-1">Gerencie funções e controle de acesso (RBAC)</p>
        </div>
        <Button 
          onClick={handleOpenNewRole}
          className="bg-[#22C55E] hover:bg-[#4ADE80] shadow-lg shadow-emerald-500/25"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
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
                <p className="text-sm text-gray-500">Total de Funções</p>
                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Shield className="h-5 w-5 text-[#1E3A8A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Função Padrão</p>
                <p className="text-2xl font-bold text-blue-600">{roles.filter(r => r.is_default).length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Permissões Configuradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {roles.reduce((acc, r) => acc + getPermissionCount(r), 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar funções..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredRoles.map((role) => {
          const ModuleIcon = Shield;
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 border-b border-gray-100/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                        <ModuleIcon className="h-5 w-5 text-[#1E3A8A]" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          {role.name}
                          {role.is_default && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Padrão
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">{role.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(role)}
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!role.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(role)}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Permissions summary */}
                  <div className="space-y-3">
                    {role.permissions.filter(p => p.view).map((perm) => {
                      const IconComponent = getModuleIcon(perm.module);
                      const moduleLabel = availableModules.find(m => m.key === perm.module)?.label || perm.module;
                      return (
                        <div key={perm.module} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{moduleLabel}</span>
                          </div>
                          <div className="flex gap-1">
                            {perm.view && (
                              <Badge variant="outline" className="text-xs bg-gray-50">
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Badge>
                            )}
                            {perm.create && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                <Plus className="h-3 w-3 mr-1" />
                                Criar
                              </Badge>
                            )}
                            {perm.edit && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Badge>
                            )}
                            {perm.delete && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {role.permissions.filter(p => p.view).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Nenhuma permissão configurada
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Função' : 'Nova Função'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Edite as permissões da função' 
                : 'Crie uma nova função com permissões específicas'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nome da Função</Label>
                <Input
                  id="roleName"
                  placeholder="Ex: Gerente Financeiro"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Descrição</Label>
                <Input
                  id="roleDescription"
                  placeholder="Breve descrição da função"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Permissões por Módulo</Label>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-1/4">Módulo</th>
                      <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                        <Eye className="h-4 w-4 mx-auto" />
                        <span className="block text-[10px] mt-1">Visualizar</span>
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                        <Plus className="h-4 w-4 mx-auto" />
                        <span className="block text-[10px] mt-1">Criar</span>
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                        <Edit className="h-4 w-4 mx-auto" />
                        <span className="block text-[10px] mt-1">Editar</span>
                      </th>
                      <th className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase">
                        <Trash2 className="h-4 w-4 mx-auto" />
                        <span className="block text-[10px] mt-1">Excluir</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {availableModules.map((module) => {
                      const perm = formData.permissions.find(p => p.module === module.key) || {
                        module: module.key,
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                      };
                      const IconComponent = module.icon;
                      
                      return (
                        <tr key={module.key} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{module.label}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Checkbox
                              checked={perm.view}
                              onCheckedChange={(checked) => handleViewChange(module.key, checked as boolean)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Checkbox
                              checked={perm.create}
                              onCheckedChange={(checked) => handlePermissionChange(module.key, 'create', checked as boolean)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Checkbox
                              checked={perm.edit}
                              onCheckedChange={(checked) => handlePermissionChange(module.key, 'edit', checked as boolean)}
                              className="mx-auto"
                            />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Checkbox
                              checked={perm.delete}
                              onCheckedChange={(checked) => handlePermissionChange(module.key, 'delete', checked as boolean)}
                              className="mx-auto"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveRole} 
              disabled={isLoading || !formData.name}
              className="bg-[#22C55E] hover:bg-[#4ADE80]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Criar Função'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Função</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a função "{selectedRole?.name}"? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteRole} 
              disabled={isLoading}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
