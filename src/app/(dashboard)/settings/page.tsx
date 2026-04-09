"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useI18n } from "@/i18n/client"
import { useAuth } from "@/contexts/auth-context"
import { createBrowserClient } from "@supabase/ssr"
import { User, Mail, Phone, Lock, Bell, Globe, CreditCard, Save, Eye, EyeOff } from "lucide-react"
import { motion } from "framer-motion"
import { plans } from "@/lib/plans"

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()
  const { user } = useAuth()
  
  // Create Supabase client for data operations
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  
  const [tenantData, setTenantData] = useState<any>(null)
  const [statsData, setStatsData] = useState({
    totalCustomers: 0,
    activeLoans: 0,
    totalLoans: 0,
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    overdueAlerts: true,
    paymentReminders: true,
  })

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Buscar dados do usuário ao carregar
  useEffect(() => {
    async function fetchUserData() {
      if (!user?.id || !user?.tenantId) return
      
      try {
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("name, email, phone")
          .eq("id", user.id)
          .single()
        
        if (userData) {
          setProfileData({
            name: userData.name || user.email?.split("@")[0] || "",
            email: userData.email || user.email || "",
            phone: userData.phone || "",
          })
        }
        
        // Buscar dados do tenant (empresa)
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("name, plan")
          .eq("id", user.tenantId)
          .single()
        
        if (tenantData) {
          setTenantData(tenantData)
        }
        
        // Buscar estatísticas
        const { count: customerCount } = await supabase
          .from("customers")
          .select("*", { count: 'exact', head: true })
          .eq("tenant_id", user.tenantId)
        
        const { count: activeLoansCount } = await supabase
          .from("loans")
          .select("*", { count: 'exact', head: true })
          .eq("tenant_id", user.tenantId)
          .eq("status", "active")
        
        const { count: totalLoansCount } = await supabase
          .from("loans")
          .select("*", { count: 'exact', head: true })
          .eq("tenant_id", user.tenantId)
        
        setStatsData({
          totalCustomers: customerCount || 0,
          activeLoans: activeLoansCount || 0,
          totalLoans: totalLoansCount || 0,
        })
        
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user?.id && user?.tenantId) {
      fetchUserData()
    } else {
      setIsLoading(false)
    }
  }, [user?.id, user?.tenantId])
  
  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})/, "($1) $2")
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
  }
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setProfileData({ ...profileData, phone: formatted })
  }

  const handleSaveProfile = async () => {
    if (!user?.id) return
    
    setIsSavingProfile(true)
    setProfileMessage(null)
    
    try {
      // Update user in database
      const { error } = await supabase
        .from("users")
        .update({
          name: profileData.name,
          phone: profileData.phone,
        })
        .eq("id", user.id)
      
      if (error) throw error
      
      setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setProfileMessage({ type: 'error', text: 'Erro ao salvar perfil. Tente novamente.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user?.id) return
    
    // Validations
    if (!passwordData.currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Informe a senha atual.' })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não conferem.' })
      return
    }
    
    setIsChangingPassword(true)
    setPasswordMessage(null)
    
    try {
      // Update password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) {
        if (error.message.includes("Invalid login")) {
          setPasswordMessage({ type: 'error', text: 'Senha atual incorreta.' })
        } else {
          setPasswordMessage({ type: 'error', text: error.message })
        }
      } else {
        setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      }
    } catch (err: any) {
      console.error("Error changing password:", err)
      setPasswordMessage({ type: 'error', text: 'Erro ao alterar senha. Tente novamente.' })
    } finally {
      setIsChangingPassword(false)
    }
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
                {profileMessage && (
                  <div className={`p-3 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {profileMessage.text}
                  </div>
                )}
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
                      disabled
                      className="bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={profileData.phone}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      className="focus:border-[#22C55E] focus:ring-[#22C55E]/20"
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
                  disabled={isSavingProfile} 
                  className="w-full md:w-auto bg-[#22C55E] hover:bg-[#16A34A] hover:shadow-lg hover:shadow-[#22C55E]/30 transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingProfile ? "Salvando..." : "Salvar Alterações"}
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
                {passwordMessage && (
                  <div className={`p-3 rounded-lg ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {passwordMessage.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <div className="relative">
                    <Input 
                      type={showPasswords.current ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="focus:border-[#22C55E] focus:ring-[#22C55E]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showPasswords.new ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="focus:border-[#22C55E] focus:ring-[#22C55E]/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showPasswords.confirm ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="focus:border-[#22C55E] focus:ring-[#22C55E]/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-all duration-300"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
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
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                <>
                  <motion.div 
                    className="p-4 bg-gradient-to-r from-[#22C55E]/10 to-[#16A34A]/10 rounded-xl border border-[#22C55E]/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="text-sm text-[#22C55E] font-medium">Plano</p>
                    <p className="text-xl font-bold text-[#16A34A]">
                      {tenantData?.plan ? plans[tenantData.plan as keyof typeof plans]?.name || 'Gratuito' : 'Gratuito'}
                    </p>
                    <p className="text-xs text-[#22C55E]">
                      {tenantData?.plan ? `R$ ${plans[tenantData.plan as keyof typeof plans]?.price}/mês` : 'Grátis'}
                    </p>
                  </motion.div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Clientes</span>
                      <span className="font-medium">{statsData.totalCustomers} / {plans[user?.plan as keyof typeof plans]?.limits.maxCustomers || 50}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Empréstimos Ativos</span>
                      <span className="font-medium">{statsData.activeLoans}</span>
                    </div>
                    {tenantData?.name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Empresa</span>
                        <span className="font-medium text-xs">{tenantData.name}</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E] hover:text-white transition-all duration-300"
                    onClick={() => window.location.href = '/settings/plan'}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Alterar Plano
                  </Button>
                </>
              )}
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
              <a 
                href="https://docs.axioncred.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-[#22C55E]/5 hover:border-[#22C55E]/20 border border-transparent transition-all duration-300"
              >
                <p className="font-medium text-sm">Documentação</p>
                <p className="text-xs text-gray-500">Aprenda a usar o AXION</p>
              </a>
              <a 
                href="mailto:suporte@axioncred.com.br"
                className="block p-3 bg-gray-50 rounded-lg hover:bg-[#22C55E]/5 hover:border-[#22C55E]/20 border border-transparent transition-all duration-300"
              >
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
