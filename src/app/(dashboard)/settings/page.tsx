"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { User, Mail, Phone, Lock, Bell, Globe, CreditCard, Save } from "lucide-react"
import { motion } from "framer-motion"

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  // Skeleton components
  const ProfileSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" />
      </CardContent>
    </Card>
  )

  const NotificationSkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-56 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const SecuritySkeleton = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" />
      </CardContent>
    </Card>
  )

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
        <p className="text-gray-500">Gerencie suas configurações</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#22C55E]" />
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
                      className="focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input 
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      className="focus:border-[#22C55E] focus:ring-[#22C55E]/20"
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

              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving} 
                className="w-full md:w-auto bg-[#22C55E] hover:bg-[#16A34A] hover:shadow-lg hover:shadow-[#22C55E]/30 transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#22C55E]" />
                  Notificações
                </CardTitle>
                <CardDescription>Configure como você recebe notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {[
                { key: 'emailNotifications', title: 'Notificações por E-mail', desc: 'Receba atualizações por e-mail' },
                { key: 'overdueAlerts', title: 'Alertas de Inadimplência', desc: 'Seja notificado quando um cliente atrasar' },
                { key: 'paymentReminders', title: 'Lembretes de Pagamento', desc: 'Receba lembretes sobre parcelas próximas' }
              ].map((item) => (
                <motion.div 
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <motion.button
                    onClick={() => setNotificationSettings({...notificationSettings, [item.key]: !notificationSettings[item.key as keyof typeof notificationSettings]})}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      notificationSettings[item.key as keyof typeof notificationSettings] 
                        ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A]' 
                        : 'bg-gray-200'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                      animate={{
                        left: notificationSettings[item.key as keyof typeof notificationSettings] ? '32px' : '4px'
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </motion.div>
              ))}
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#22C55E]" />
                  Segurança
                </CardTitle>
                <CardDescription>Gerencie sua senha e segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" placeholder="••••••••" className="focus:border-[#22C55E] focus:ring-[#22C55E]/20" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input type="password" placeholder="••••••••" className="focus:border-[#22C55E] focus:ring-[#22C55E]/20" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Senha</Label>
                    <Input type="password" placeholder="••••••••" className="focus:border-[#22C55E] focus:ring-[#22C55E]/20" />
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-all duration-300"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div className="space-y-6" variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#22C55E]" />
                Resumo da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div 
                className="p-4 bg-gradient-to-r from-[#22C55E]/10 to-[#16A34A]/10 rounded-xl border border-[#22C55E]/20"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-sm text-[#22C55E] font-medium">Plano</p>
                <p className="text-xl font-bold text-[#16A34A]">Profissional</p>
                <p className="text-xs text-[#22C55E]">R$ 97/mês</p>
              </motion.div>
              
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

              <Button 
                variant="outline" 
                className="w-full border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-all duration-300"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade do Plano
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#22C55E]" />
                Ajuda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-[#22C55E]/5 hover:border-[#22C55E]/20 border border-transparent transition-all duration-300">
                <p className="font-medium text-sm">Documentação</p>
                <p className="text-xs text-gray-500">Aprenda a usar o AXION</p>
              </a>
              <a href="#" className="block p-3 bg-gray-50 rounded-lg hover:bg-[#22C55E]/5 hover:border-[#22C55E]/20 border border-transparent transition-all duration-300">
                <p className="font-medium text-sm">Contato Suporte</p>
                <p className="text-xs text-gray-500">Precisa de ajuda?</p>
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
