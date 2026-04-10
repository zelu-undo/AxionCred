"use client"

import { useState } from "react"
import { trpc } from "@/trpc/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Search, UserPlus, Pencil, Trash2, AlertTriangle, Users, Trash, Building2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function UsersPage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(0)
  const [showCleanup, setShowCleanup] = useState(false)
  const [cleanupDryRun, setCleanupDryRun] = useState(true)
  
  // Dialog states
  const [editUser, setEditUser] = useState<any>(null)
  const [deleteUser, setDeleteUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    tenant_id: "",
    is_active: true,
  })

  // Fetch users
  const { data, isLoading, refetch } = trpc.superAdmin.listUsers.useQuery({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    is_active: statusFilter !== "all" ? statusFilter === "true" : undefined,
    limit: 20,
    offset: page * 20,
  })

  // Fetch tenants for assignment
  const { data: tenants } = trpc.superAdmin.listTenantsForAssignment.useQuery()

  // Mutations
  const updateUserMutation = trpc.superAdmin.updateUser.useMutation({
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso!" })
      setEditUser(null)
      refetch()
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" })
    },
  })

  const deleteUserMutation = trpc.superAdmin.deleteUser.useMutation({
    onSuccess: () => {
      toast({ title: "Usuário excluído com sucesso!" })
      setDeleteUser(null)
      refetch()
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" })
      setDeleteUser(null)
    },
  })

  // Cleanup orphaned tenants mutation
  const cleanupMutation = trpc.admin.cleanupOrphanedTenants.useMutation({
    onSuccess: (data) => {
      toast({ 
        title: data.message,
        description: data.tenants.length > 0 
          ? `${data.tenants.map((t: any) => t.name).join(", ")}`
          : undefined,
      })
      setShowCleanup(false)
      refetch()
    },
    onError: (error) => {
      toast({ title: "Erro no cleanup", description: error.message, variant: "destructive" })
    },
  })

  // Get user details for edit
  const { data: userDetails } = trpc.superAdmin.getUser.useQuery(
    { user_id: editUser?.id },
    { enabled: !!editUser }
  )

  // Update edit form when user details load
  if (userDetails && editUser && editForm.name === "") {
    setEditForm({
      name: userDetails.name || "",
      role: userDetails.role || "",
      tenant_id: userDetails.tenant_id || "",
      is_active: userDetails.is_active ?? true,
    })
  }

  const handleEdit = (user: any) => {
    setEditForm({
      name: user.name || "",
      role: user.role || "",
      tenant_id: user.tenant_id || "",
      is_active: user.is_active ?? true,
    })
    setEditUser(user)
  }

  const handleSave = () => {
    updateUserMutation.mutate({
      user_id: editUser.id,
      name: editForm.name,
      role: editForm.role,
      tenant_id: editForm.tenant_id || null,
      is_active: editForm.is_active,
    })
  }

  const handleDelete = () => {
    deleteUserMutation.mutate({ user_id: deleteUser.id })
  }

  const roles = [
    { value: "owner", label: "Proprietário" },
    { value: "admin", label: "Administrador" },
    { value: "manager", label: "Gerente" },
    { value: "operator", label: "Operador" },
    { value: "super_admin", label: "Super Admin" },
  ]

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
            <p className="text-gray-500">Visualize e gerencie todos os usuários do sistema</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowCleanup(true)}
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Trash className="w-4 h-4 mr-2" />
              Cleanup
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.tenant ? (
                          <div>
                            <p className="font-medium">{user.tenant.name}</p>
                            <p className="text-xs text-gray-500">{user.tenant.slug}</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-600">
                            Sem empresa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                          {roles.find((r) => r.value === user.role)?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteUser(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {data?.users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.total > 20 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Mostrando {page * 20 + 1} - {Math.min((page + 1) * 20, data.total)} de {data.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={(page + 1) * 20 >= data.total}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto z-[100]">
          <DialogHeader className="sticky top-0 bg-white pb-2 border-b">
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário. Tenant vazio significa "sem empresa".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={editUser?.email || ""} disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select
                value={editForm.tenant_id || "none"}
                onValueChange={(value) => setEditForm({ ...editForm, tenant_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem empresa</SelectItem>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.plan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={editForm.role}
                onValueChange={(value) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Usuário ativo
              </label>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-4">
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deleteUser?.name}</strong> ({deleteUser?.email})?
              
              {deleteUser?.tenant_id && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                  ⚠️ Este usuário pertence a uma empresa. A exclusão pode causar problemas de acesso.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cleanup Orphaned Tenants */}
      <AlertDialog open={showCleanup} onOpenChange={setShowCleanup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              Cleanup - Empresas Órfãs
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta função irá remover empresas que não possuem usuários associados.
              {!cleanupDryRun && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={cleanupDryRun}
                onChange={(e) => setCleanupDryRun(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Modo Simulation (dry run) - apenas mostrar o que seria deletado</span>
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCleanup(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cleanupMutation.mutate({ dryRun: cleanupDryRun })}
              disabled={cleanupMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {cleanupMutation.isPending ? "Executando..." : cleanupDryRun ? "Verificar" : "Executar Cleanup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}