"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Shield, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  Lock,
  Globe,
  Bell,
  Database,
  ChevronDown,
  ChevronUp,
  Info
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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"

// Dados de exemplo
const consentTypes = [
  { 
    id: "marketing", 
    name: "Marketing e Ofertas", 
    description: "Receber promoções, ofertas especiais e comunicações de marketing",
    required: false,
    enabled: true,
    icon: Bell
  },
  { 
    id: "third_party", 
    name: "Compartilhamento com Terceiros", 
    description: "Compartilhar dados com parceiros estratégicos para ofertas",
    required: false,
    enabled: false,
    icon: Globe
  },
  { 
    id: "credit_analysis", 
    name: "Análise de Crédito", 
    description: "Utilizar dados para análise de crédito e scoring",
    required: true,
    enabled: true,
    icon: Shield
  },
  { 
    id: "data_retention", 
    name: "Retenção de Dados", 
    description: "Manter histórico de dados para consultas futuras",
    required: true,
    enabled: true,
    icon: Database
  },
]

const privacyPolicy = `
# Política de Privacidade - AXION Cred

## 1. Introdução
A AXION Cred valoriza a privacidade e a proteção dos dados pessoais de seus clientes. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações.

## 2. Dados que Coletamos
- Informações pessoais (nome, CPF, endereço, telefone)
- Dados financeiros (histórico de crédito, empréstimos, pagamentos)
- Dados de uso da plataforma
- Comunicações e interações

## 3. Como Usamos seus Dados
- Processar solicitações de crédito
- Avaliar capacidade de pagamento
- Enviar comunicações sobre seus contratos
- Cumprir obrigações legais
- Melhorar nossos serviços

## 4. Seus Direitos (LGPD)
- Acesso aos seus dados pessoais
- Correção de dados incorretos
- Solicitação de exclusão (anonimização)
- Portabilidade dos dados
- Revogação de consentimento

## 5. Retenção de Dados
**IMPORTANTE**: Mesmo após solicitação de exclusão, determinados dados serão mantidos:
- CPF e histórico de crédito para sistema de scoring
- Dados necessários para compliance regulatório
- Registros de transações financeiras

## 6. Contato
Para exercer seus direitos ou tirar dúvidas, entre em contato com nosso DPO (Encarregado de Dados).
`

const termsOfUse = `
# Termos de Uso - AXION Cred

## 1. Aceitação dos Termos
Ao utilizar a plataforma AXION Cred, você concorda com estes termos.

## 2. Uso da Plataforma
- Usar para fins lícitos
- Não tentar acessar dados de outros usuários
- Manter suas credenciais de acesso seguras
- Reportar problemas de segurança

## 3. Responsabilidades
- Fornecer informações verdadeiras
- Manter dados atualizados
- Respeitar políticas de uso

## 4. Limitação de Responsabilidade
A AXION Cred não se responsabiliza por:
- Decisões de crédito tomadas por instituições parceiras
- Interrupções de serviço por fatores externos
- Uso indevido da plataforma pelo usuário
`

const customerDataRequests = [
  { id: 1, customer: "João Silva", cpf: "123.456.789-00", type: "access", status: "completed", date: "2026-03-15", completedDate: "2026-03-16" },
  { id: 2, customer: "Maria Santos", cpf: "987.654.321-00", type: "deletion", status: "pending", date: "2026-03-18", completedDate: null },
  { id: 3, customer: "Pedro Costa", cpf: "456.789.123-00", type: "export", status: "completed", date: "2026-03-10", completedDate: "2026-03-11" },
  { id: 4, customer: "Ana Pereira", cpf: "321.654.987-00", type: "correction", status: "in_progress", date: "2026-03-19", completedDate: null },
]

const dataRetentionRules = [
  { id: 1, dataType: "CPF e Score", retention: "Permanente", reason: "Sistema de crédito e compliance", canDelete: false },
  { id: 2, dataType: "Histórico de Pagamentos", retention: "10 anos", reason: "Obrigação legal e contábil", canDelete: false },
  { id: 3, dataType: "Dados de Contato", retention: "5 anos após inatividade", reason: "Comunicação", canDelete: true },
  { id: 4, dataType: "Logs de Acesso", retention: "2 anos", reason: "Segurança e auditoria", canDelete: false },
  { id: 5, dataType: "Dados de Navegação", retention: "1 ano", reason: "Análise de uso", canDelete: true },
]

export default function LGPDPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case "access": 
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">Acesso</Badge>
      case "deletion": 
        return <Badge className="bg-red-500/20 text-red-400 border-red-500">Exclusão</Badge>
      case "export": 
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Exportação</Badge>
      case "correction": 
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Correção</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": 
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">Concluído</Badge>
      case "pending": 
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">Pendente</Badge>
      case "in_progress": 
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">Em Andamento</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">LGPD / Privacidade</h1>
          <p className="text-gray-400">Gerencie consentimentos e conformidade com a LGPD</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>
          <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Alerta Importante */}
      <Card className="bg-yellow-500/10 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400">Informações Importantes sobre Retenção de Dados</p>
              <p className="text-sm text-gray-300 mt-1">
                Conforme a LGPD e necessidades regulatórias, <strong>o CPF e o histórico de crédito</strong> dos clientes 
                <strong> NUNCA serão excluídos</strong> do sistema. Estes dados são essenciais para o sistema de 
                scoring de crédito e para cumprimento de obrigações legais. Ao solicitar "Exclusão de Dados", 
                apenas dados não essenciais serão removidos, como informações de contato, endereço e preferências.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <p className="text-sm text-gray-400">Consentimentos Ativos</p>
                  <p className="text-3xl font-bold text-green-400">85%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
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
                  <p className="text-sm text-gray-400">Requisições LGPD</p>
                  <p className="text-3xl font-bold text-blue-400">4</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Dados Criptografados</p>
                  <p className="text-3xl font-bold text-purple-400">100%</p>
                </div>
                <Lock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Em Processamento</p>
                  <p className="text-3xl font-bold text-yellow-400">1</p>
                </div>
                <Settings className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="consent" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="consent">Consentimentos</TabsTrigger>
          <TabsTrigger value="policy">Política de Privacidade</TabsTrigger>
          <TabsTrigger value="terms">Termos de Uso</TabsTrigger>
          <TabsTrigger value="requests">Requisições</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
        </TabsList>

        <TabsContent value="consent">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Tipos de Consentimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consentTypes.map((consent, index) => (
                  <motion.div
                    key={consent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <consent.icon className="w-6 h-6 text-gray-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{consent.name}</p>
                          {consent.required && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500 text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{consent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {consent.required ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Sempre ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={consent.enabled} 
                            onCheckedChange={() => {}}
                          />
                          <span className="text-sm text-gray-400">
                            {consent.enabled ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Política de Privacidade</CardTitle>
              <Button variant="outline" size="sm" className="border-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans bg-transparent">
                  {privacyPolicy}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Termos de Uso</CardTitle>
              <Button variant="outline" size="sm" className="border-slate-700">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans bg-transparent">
                  {termsOfUse}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Requisições de Dados (LGPD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customerDataRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.customer}</p>
                        <p className="text-sm text-gray-400">CPF: {request.cpf}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {getRequestTypeBadge(request.type)}
                      {getStatusBadge(request.status)}
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {request.status === "completed" 
                            ? `Concluído em ${request.completedDate}`
                            : `Solicitado em ${request.date}`
                          }
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Regras de Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dataRetentionRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                  >
                    <div>
                      <p className="font-medium text-white">{rule.dataType}</p>
                      <p className="text-sm text-gray-400">{rule.reason}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">
                        {rule.retention}
                      </Badge>
                      {rule.canDelete ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500">
                          Pode excluir
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500">
                          Essencial
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Simple Switch component
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-green-600" : "bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}
