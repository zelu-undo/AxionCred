"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Clock, 
  Calendar,
  Plus,
  X,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  Eye,
  Search,
  Download,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

// Dados de exemplo
const reminderTemplates = [
  { 
    id: 1, 
    name: "Lembrete 3 dias antes", 
    type: "reminder", 
    daysBefore: 3, 
    channel: "whatsapp", 
    enabled: true,
    template: "Olá {{customer_name}}! Lembrete: Sua parcela de R$ {{amount}} vence em {{days}} dias."
  },
  { 
    id: 2, 
    name: "Lembrete 1 dia antes", 
    type: "reminder", 
    daysBefore: 1, 
    channel: "whatsapp", 
    enabled: true,
    template: "Olá {{customer_name}}! Amanhã vence sua parcela de R$ {{amount}}. Não esqueça!"
  },
  { 
    id: 3, 
    name: "Parcela atrasada - 1º aviso", 
    type: "overdue", 
    daysAfter: 1, 
    channel: "whatsapp", 
    enabled: true,
    template: "Olá {{customer_name}}, sua parcela de R$ {{amount}} está atrasada. Regularize para evitar multas."
  },
  { 
    id: 4, 
    name: "Parcela atrasada - 7 dias", 
    type: "overdue", 
    daysAfter: 7, 
    channel: "sms", 
    enabled: true,
    template: "Olá {{customer_name}}, sua parcela está atrasada há {{days}} dias. Valor: R$ {{amount}}. Entre em contato!"
  },
  { 
    id: 5, 
    name: "Parcela atrasada - 15 dias", 
    type: "overdue", 
    daysAfter: 15, 
    channel: "email", 
    enabled: false,
    template: "Prezado(a) {{customer_name}}, informamos que sua parcela está inadimplente..."
  },
]

const emailTemplates = [
  { id: 1, name: "Boas-vindas", category: "welcome", subject: "Bem-vindo à AXION Cred!" },
  { id: 2, name: "Confirmação de Empréstimo", category: "loan", subject: "Confirmação: Seu empréstimo foi aprovado" },
  { id: 3, name: "Recibo de Pagamento", category: "payment", subject: "Recibo: Pagamento recebido" },
  { id: 4, name: "2ª Via de Boleto", category: "billing", subject: "2ª Via: Seu boleto está disponível" },
]

const sendingLogs = [
  { id: 1, template: "Lembrete 3 dias antes", channel: "whatsapp", sent: 145, delivered: 142, failed: 3, date: "2026-03-20" },
  { id: 2, template: "Parcela atrasada - 1º aviso", channel: "whatsapp", sent: 38, delivered: 36, failed: 2, date: "2026-03-20" },
  { id: 3, template: "Lembrete 1 dia antes", channel: "whatsapp", sent: 89, delivered: 87, failed: 2, date: "2026-03-19" },
  { id: 4, template: "Parcela atrasada - 7 dias", channel: "sms", sent: 22, delivered: 21, failed: 1, date: "2026-03-18" },
]

const bestSendTimes = [
  { day: "Segunda", time: "09:00", openRate: 32 },
  { day: "Terça", time: "10:00", openRate: 38 },
  { day: "Quarta", time: "14:00", openRate: 35 },
  { day: "Quinta", time: "09:00", openRate: 36 },
  { day: "Sexta", time: "10:00", openRate: 34 },
]

export default function RemindersPage() {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof reminderTemplates[0] | null>(null)

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp": return <MessageSquare className="w-4 h-4 text-green-500" />
      case "sms": return <Phone className="w-4 h-4 text-blue-500" />
      case "email": return <Mail className="w-4 h-4 text-yellow-500" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge className="bg-green-500/20 text-green-400 border-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ativo
      </Badge>
    ) : (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500">
        <XCircle className="w-3 h-3 mr-1" />
        Inativo
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Lembretes Inteligentes</h1>
          <p className="text-gray-400">Configure automação de comunicações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar Logs
          </Button>
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Novo Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-gray-300">Nome do Template</Label>
                  <Input className="bg-slate-900 border-slate-700 mt-1" placeholder="Ex: Lembrete de vencimento" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Tipo</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reminder">Lembrete</SelectItem>
                        <SelectItem value="overdue">Atraso</SelectItem>
                        <SelectItem value="payment">Pagamento</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Canal</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-900 border-slate-700 mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Dias Antes/Depois</Label>
                    <Input type="number" className="bg-slate-900 border-slate-700 mt-1" placeholder="3" />
                  </div>
                  <div>
                    <Label className="text-gray-300">Horário de Envio</Label>
                    <Input type="time" className="bg-slate-900 border-slate-700 mt-1" defaultValue="09:00" />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Mensagem</Label>
                  <Textarea 
                    className="bg-slate-900 border-slate-700 mt-1" 
                    rows={4} 
                    placeholder="Olá {{customer_name}}! Sua parcela de R$ {{amount}} vence em {{days}} dias."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variáveis disponíveis: {"{{customer_name}}"}, {"{{amount}}"}, {"{{due_date}}"}, {"{{days}}"}, {"{{company_name}}"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700">Criar Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Enviados Hoje</p>
                  <p className="text-3xl font-bold text-green-400">294</p>
                </div>
                <Send className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taxa de Entrega</p>
                  <p className="text-3xl font-bold text-blue-400">97.2%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Taxa de Resposta</p>
                  <p className="text-3xl font-bold text-yellow-400">24.5%</p>
                </div>
                <MessageSquare className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Templates Ativos</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {reminderTemplates.filter(t => t.enabled).length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Logs de Envio</TabsTrigger>
          <TabsTrigger value="email">E-mails</TabsTrigger>
          <TabsTrigger value="schedule">Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Templates de Lembretes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reminderTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        {getChannelIcon(template.channel)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{template.name}</p>
                        <p className="text-sm text-gray-400">
                          {template.type === "reminder" ? `${template.daysBefore} dias antes` : `${template.daysAfter} dias após`}
                          {" • "}
                          {template.channel === "whatsapp" ? "WhatsApp" : template.channel === "sms" ? "SMS" : "E-mail"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(template.enabled)}
                      <Button variant="ghost" size="icon">
                        {template.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Logs de Envio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sendingLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        {getChannelIcon(log.channel)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{log.template}</p>
                        <p className="text-sm text-gray-400">{log.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{log.sent}</p>
                        <p className="text-xs text-gray-500">Enviados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-400">{log.delivered}</p>
                        <p className="text-xs text-gray-500">Entregues</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-400">{log.failed}</p>
                        <p className="text-xs text-gray-500">Falhas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">
                          {((log.delivered / log.sent) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Taxa</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Templates de E-mail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emailTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{template.name}</p>
                        <p className="text-sm text-gray-400">{template.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-slate-600">
                        {template.category}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Melhor Horário para Envio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bestSendTimes.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-white">{item.day} às {item.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${item.openRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{item.openRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Lembretes Automáticos</p>
                    <p className="text-sm text-gray-400">Ativar envio automático de lembretes</p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Limite de Envios Diários</p>
                    <p className="text-sm text-gray-400">Máximo de envios por dia</p>
                  </div>
                  <Input type="number" className="w-24 bg-slate-900 border-slate-700" defaultValue="500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Fuso Horário</p>
                    <p className="text-sm text-gray-400">Horário para envio de mensagens</p>
                  </div>
                  <Select defaultValue="america Sao Paulo">
                    <SelectTrigger className="w-48 bg-slate-900 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america Sao Paulo">America/Sao Paulo (GMT-3)</SelectItem>
                      <SelectItem value="america Manaus">America/Manaus (GMT-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Settings className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
