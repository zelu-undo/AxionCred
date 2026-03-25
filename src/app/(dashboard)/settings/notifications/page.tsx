'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Save, Bell, Mail, Smartphone, Clock, 
  DollarSign, CreditCard, AlertTriangle, CheckCircle, XCircle,
  UserPlus, RefreshCw, Sparkles, Settings
} from 'lucide-react';
import { trpc } from "@/trpc/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationType {
  type: string;
  label: string;
}

interface UserSetting {
  notification_type: string;
  enabled: boolean;
  method: string;
}

// Group notifications by category
const notificationGroups = [
  {
    id: 'payments',
    title: 'Pagamentos',
    icon: DollarSign,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    types: ['payment_received', 'payment_overdue', 'reminder_sent']
  },
  {
    id: 'loans',
    title: 'Empréstimos',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    types: ['loan_created', 'loan_approved', 'loan_rejected', 'loan_cancelled', 'loan_paid_off']
  },
  {
    id: 'customers',
    title: 'Clientes',
    icon: UserPlus,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    types: ['customer_created']
  },
  {
    id: 'renegotiations',
    title: 'Renegociações',
    icon: RefreshCw,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    types: ['renegotiation_created', 'renegotiation_approved', 'renegotiation_rejected']
  },
  {
    id: 'system',
    title: 'Sistema',
    icon: Settings,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    types: ['new_user']
  }
];

export default function NotificationsPage() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [settings, setSettings] = useState<Record<string, { enabled: boolean; method: string }>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch notification types
  const { data: typesData } = trpc.notifications.getTypes.useQuery()

  // Fetch current user settings
  const { data: settingsData, refetch: refetchSettings } = trpc.notifications.getSettings.useQuery()

  // Save settings
  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    try {
      const settingsArray = notificationTypes.map(type => ({
        notification_type: type.type,
        enabled: settings[type.type]?.enabled ?? true,
        method: (settings[type.type]?.method ?? 'visual') as 'visual' | 'email' | 'both',
      }))

      // Using raw fetch to call the mutation endpoint
      const response = await fetch('/api/trpc/notifications.bulkUpdateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { 0: settingsArray } })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar')
      }
      
      showSuccessToast('Configurações salvas com sucesso!')
      setHasChanges(false)
      refetchSettings()
    } catch (error: any) {
      showErrorToast(error.message || 'Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }, [notificationTypes, settings, refetchSettings])

  // Initialize notification types
  useEffect(() => {
    if (typesData) {
      setNotificationTypes(typesData)
    }
  }, [typesData])

  // Initialize settings from fetched data
  useEffect(() => {
    if (settingsData && settingsData.length > 0) {
      const settingsMap: Record<string, { enabled: boolean; method: string }> = {}
      settingsData.forEach((s: UserSetting) => {
        settingsMap[s.notification_type] = {
          enabled: s.enabled,
          method: s.method,
        }
      })
      setSettings(settingsMap)
    }
  }, [settingsData])

  // Track changes
  const handleSettingChange = (type: string, field: 'enabled' | 'method', value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
    setHasChanges(true)
  }

  // Get icon for notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return <DollarSign className="h-5 w-5 text-green-600" />
      case 'payment_overdue': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'loan_created': return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'loan_approved': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'loan_rejected': return <XCircle className="h-5 w-5 text-red-600" />
      case 'loan_cancelled': return <XCircle className="h-5 w-5 text-red-600" />
      case 'loan_paid_off': return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'customer_created': return <UserPlus className="h-5 w-5 text-purple-600" />
      case 'reminder_sent': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'new_user': return <UserPlus className="h-5 w-5 text-indigo-600" />
      case 'renegotiation_created': return <RefreshCw className="h-5 w-5 text-orange-600" />
      case 'renegotiation_approved': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'renegotiation_rejected': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  // Filter types based on active tab
  const getFilteredTypes = () => {
    if (activeTab === 'all') return notificationTypes
    const group = notificationGroups.find(g => g.id === activeTab)
    return notificationTypes.filter(t => group?.types.includes(t.type))
  }

  const filteredTypes = getFilteredTypes()

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
          <motion.h1 
            className="text-2xl font-bold text-gray-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Configurações de Notificações
          </motion.h1>
          <motion.p 
            className="text-gray-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Gerencie quais notificações você deseja receber e por qual canal
          </motion.p>
        </div>
      </div>

      {/* Stats Overview */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {notificationGroups.map((group, index) => {
          const activeCount = notificationTypes
            .filter(t => group.types.includes(t.type))
            .filter(t => settings[t.type]?.enabled).length
          const totalCount = group.types.length
          
          return (
            <motion.button
              key={group.id}
              onClick={() => setActiveTab(activeTab === group.id ? 'all' : group.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                activeTab === group.id 
                  ? `${group.border} bg-white shadow-lg` 
                  : 'border-transparent bg-gray-50 hover:bg-gray-100'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-10 h-10 rounded-lg ${group.bg} flex items-center justify-center mb-2`}>
                <group.icon className={`h-5 w-5 ${group.color}`} />
              </div>
              <p className="text-sm font-medium text-gray-900">{group.title}</p>
              <p className="text-xs text-gray-500">
                {activeCount}/{totalCount} ativas
              </p>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Tabs for categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            Todas
          </TabsTrigger>
          {notificationGroups.map(group => (
            <TabsTrigger 
              key={group.id} 
              value={group.id}
              className="data-[state=active]:bg-white"
            >
              {group.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value={activeTab} className="mt-6">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#22C55E]" />
                    {activeTab === 'all' ? 'Todas as Notificações' : notificationGroups.find(g => g.id === activeTab)?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {notificationTypes.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-[#22C55E]" />
                      <span className="ml-2 text-gray-500">Carregando tipos de notificação...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredTypes.map((type, index) => (
                          <motion.div 
                            key={type.type}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                {getTypeIcon(type.type)}
                              </div>
                              <div>
                                <Label className="font-medium text-gray-900">{type.label}</Label>
                                <p className="text-xs text-gray-400">{type.type}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Enabled checkbox */}
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`enabled-${type.type}`}
                                  checked={settings[type.type]?.enabled ?? true}
                                  onCheckedChange={(checked) => handleSettingChange(type.type, 'enabled', checked as boolean)}
                                  className="data-[state=checked]:bg-[#22C55E] data-[state=checked]:border-[#22C55E]"
                                />
                                <Label htmlFor={`enabled-${type.type}`} className="text-sm text-gray-600 cursor-pointer">
                                  Ativar
                                </Label>
                              </div>

                              {/* Method selection */}
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange(type.type, 'method', 'visual')}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                                    settings[type.type]?.method === 'visual' || (!settings[type.type]?.method && settings[type.type]?.enabled)
                                      ? 'bg-[#22C55E] text-white shadow-sm'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <Bell className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Visual</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange(type.type, 'method', 'email')}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                                    settings[type.type]?.method === 'email'
                                      ? 'bg-[#22C55E] text-white shadow-sm'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Email</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSettingChange(type.type, 'method', 'both')}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                                    settings[type.type]?.method === 'both'
                                      ? 'bg-[#22C55E] text-white shadow-sm'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <Smartphone className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Ambos</span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Save Button */}
      <motion.div 
        className="flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          onClick={saveSettings} 
          disabled={isSaving || !hasChanges}
          className="bg-[#22C55E] hover:bg-[#16A34A] px-8"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}