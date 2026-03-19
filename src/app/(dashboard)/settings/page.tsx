"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { User, Mail, Phone, Lock, Bell, Globe, CreditCard, Save } from "lucide-react"

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const { user } = useAuth()
  
  const [profileData, setProfileData] = useState({
    name: user?.email?.split("@")[0] || "Demo User",
    email: user?.email || "demo@axioncred.com.br",
    phone: "(11) 99999-9999",
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    overdueAlerts: true,
    paymentReminders: true,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-gray-500">Gerencie suas configurações</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>Informações do seu perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input 
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={locale} onValueChange={(value) => setLocale(value as "pt" | "en" | "es")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt">Português (BR)</SelectItem>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-gray-500">Receba atualizações por e-mail</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                  className={`w-12 h-6 rounded-full transition-colors ${notificationSettings.emailNotifications ? 'bg-#22C55E' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alertas de Inadimplência</p>
                  <p className="text-sm text-gray-500">Seja notificado quando um cliente atrasar</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, overdueAlerts: !notificationSettings.overdueAlerts})}
                  className={`w-12 h-6 rounded-full transition-colors ${notificationSettings.overdueAlerts ? 'bg-#22C55E' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationSettings.overdueAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembretes de Pagamento</p>
                  <p className="text-sm text-gray-500">Receba lembretes sobre parcelas próximas</p>
                </div>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, paymentReminders: !notificationSettings.paymentReminders})}
                  className={`w-12 h-6 rounded-full transition-colors ${notificationSettings.paymentReminders ? 'bg-#22C55E' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${notificationSettings.paymentReminders ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>Gerencie sua senha e segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
              <Button variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-#22C55E/10 rounded-lg">
                <p className="text-sm text-#22C55E">Plano</p>
                <p className="text-xl font-bold text-#16A34A">Profissional</p>
                <p className="text-xs text-#22C55E">R$ 97/mês</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Clientes</span>
                  <span className="font-medium">130 / 500</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Empréstimos Ativos</span>
                  <span className="font-medium">52 / 100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Armazenamento</span>
                  <span className="font-medium">2.1 GB / 10 GB</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade do Plano
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ajuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-sm">Documentação</p>
                <p className="text-xs text-gray-500">Aprenda a usar o AXION</p>
              </a>
              <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <p className="font-medium text-sm">Contato Suporte</p>
                <p className="text-xs text-gray-500">Precisa de ajuda?</p>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
