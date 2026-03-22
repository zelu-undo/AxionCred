'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Bell, Mail, Smartphone, Clock } from 'lucide-react';
import { trpc } from "@/trpc/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { motion } from "framer-motion";

interface NotificationType {
  type: string;
  label: string;
}

interface UserSetting {
  notification_type: string;
  enabled: boolean;
  method: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export default function NotificationsPage() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([])
  const [settings, setSettings] = useState<Record<string, { enabled: boolean; method: string }>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch notification types
  const { data: typesData } = trpc.notifications.getTypes.useQuery()

  // Fetch current user settings
  const { data: settingsData, refetch: refetchSettings } = trpc.notifications.getSettings.useQuery()

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

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const settingsArray = notificationTypes.map(type => ({
        notification_type: type.type,
        enabled: settings[type.type]?.enabled ?? true,
        method: settings[type.type]?.method ?? 'visual',
      }))

      await trpc.notifications.bulkUpdateSettings.mutateAsync(settingsArray)
      showSuccessToast('Configurações salvas com sucesso!')
      setHasChanges(false)
      refetchSettings()
    } catch (error: any) {
      showErrorToast(error.message || 'Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  // Get icon for notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return '💰'
      case 'payment_overdue': return '⚠️'
      case 'loan_created': return '📝'
      case 'loan_approved': return '✅'
      case 'loan_rejected': return '❌'
      case 'customer_created': return '👤'
      case 'reminder_sent': return '⏰'
      case 'new_user': return '🆕'
      default: return '🔔'
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Notificações</h1>
          <p className="text-gray-500 mt-1">Gerencie quais notificações você deseja receber</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Tipos de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notificationTypes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#22C55E]" />
              <span className="ml-2 text-gray-500">Carregando tipos de notificação...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {notificationTypes.map((type) => (
                <div 
                  key={type.type} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(type.type)}</span>
                    <div>
                      <Label className="font-medium text-gray-900">{type.label}</Label>
                      <p className="text-xs text-gray-500">{type.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Enabled checkbox */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`enabled-${type.type}`}
                        checked={settings[type.type]?.enabled ?? true}
                        onCheckedChange={(checked) => handleSettingChange(type.type, 'enabled', checked as boolean)}
                      />
                      <Label htmlFor={`enabled-${type.type}`} className="text-sm text-gray-600 cursor-pointer">
                        Ativar
                      </Label>
                    </div>

                    {/* Method selection */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleSettingChange(type.type, 'method', 'visual')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          settings[type.type]?.method === 'visual' || (!settings[type.type]?.method && settings[type.type]?.enabled)
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <Bell className="h-4 w-4" />
                        Visual
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettingChange(type.type, 'method', 'email')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          settings[type.type]?.method === 'email'
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        E-mail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSettingChange(type.type, 'method', 'both')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          settings[type.type]?.method === 'both'
                            ? 'bg-[#22C55E] text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                        Ambos
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={isSaving || !hasChanges}
          className="bg-[#22C55E] hover:bg-[#16A34A]"
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
      </div>
    </motion.div>
  );
}
