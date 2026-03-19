"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { trpc } from "@/trpc/client"
import { showErrorToast, showSuccessToast } from "@/lib/toast"
import { useI18n } from "@/i18n/client"
import { ArrowLeft, Save, Loader2, Phone, Mail, MapPin, Calendar, FileText, History, User } from "lucide-react"

export default function CustomerDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const customerId = params.id as string
  const isEditMode = searchParams.get("edit") === "true"

  const [isEditing, setIsEditing] = useState(isEditMode)
  const [showHistory, setShowHistory] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    address: "",
    notes: "",
    status: "active" as "active" | "inactive" | "blocked",
  })

  // Fetch customer data
  const { data: customer, isLoading, refetch } = trpc.customer.byId.useQuery(
    { id: customerId },
    { enabled: !!customerId }
  )

  // Fetch customer events for audit
  const { data: events } = trpc.customer.events.useQuery(
    { customerId },
    { enabled: !!customerId }
  )

  // Update mutation
  const updateMutation = trpc.customer.update.useMutation({
    onSuccess: () => {
      showSuccessToast("Cliente atualizado com sucesso!")
      setIsEditing(false)
      refetch()
    },
    onError: (error) => {
      showErrorToast(error.message || "Erro ao atualizar cliente")
    },
  })

  // Set form data when customer loads
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        document: customer.document || "",
        address: customer.address || "",
        notes: customer.notes || "",
        status: customer.status || "active",
      })
    }
  }, [customer])

  const handleSave = () => {
    updateMutation.mutate({
      id: customerId,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      status: formData.status,
    })
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleString("pt-BR")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Cliente não encontrado</p>
            <Button onClick={() => router.push("/customers")} className="mt-4">
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <Badge variant={customer.status === "active" ? "default" : "secondary"}>
              {customer.status === "active" ? "Ativo" : customer.status === "inactive" ? "Inativo" : customer.status === "deleted" ? "Excluído" : "Bloqueado"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          {!isEditing && customer.status !== "deleted" && (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          )}
        </div>
      </div>

      {/* Audit History */}
      {showHistory && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <History className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="font-medium">{event.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum histórico disponível</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ (não editável)</Label>
                  <Input id="document" value={formData.document} disabled className="bg-gray-100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{customer.email || "-"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span>{customer.document || "-"}</span>
                </div>
                {customer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                className="w-full border rounded-md p-3 min-h-[150px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Adicione observações sobre o cliente..."
              />
            ) : (
              <p className="text-gray-600">{customer.notes || "Nenhuma observação"}</p>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 font-mono">{customer.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Criado em:</span>
                <span className="ml-2">{formatDate(customer.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Última alteração:</span>
                <span className="ml-2">{formatDate(customer.updated_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Excluído em:</span>
                <span className="ml-2">{formatDate((customer as any).deleted_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      )}
    </div>
  )
}
