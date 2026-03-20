'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Send, Lightbulb, Edit3, Phone, AlertCircle, CheckCircle2, ArrowLeft, User } from "lucide-react"

interface MessageTemplate {
  id: string;
  title: string;
  description: string;
  message: string;
  icon: string;
  color: string;
}

// Demo customer data
const customerData = {
  name: "João Silva",
  phone: "(11) 99999-8888",
  email: "joao@email.com",
  status: "active", // active, overdue, inactive
  hasPhone: true,
}

export default function CustomerMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Message templates based on customer situation
  const messageTemplates: MessageTemplate[] = [
    {
      id: 'payment_tomorrow',
      title: 'Vencimento Amanhã',
      description: 'Lembrete de parcela vencendo',
      message: `Olá ${customerData.name}! Tudo bem? 👋\n\nSua parcela de R$ 850,00 vence AMANHÃ. Prepare o pagamento para evitar juros! 💰\n\nQualquer dúvida, estamos à disposição!`,
      icon: 'lightbulb',
      color: 'blue'
    },
    {
      id: 'payment_overdue',
      title: 'Parcela Atrasada',
      description: 'Cobrar parcelas vencidas',
      message: `Olá ${customerData.name}! 📢\n\nVerificamos que você tem uma parcela de R$ 850,00 atrasada. Gostaría de negociar o pagamento?\n\nTemos opções de parcelamento disponíveis! 😊`,
      icon: 'alert',
      color: 'red'
    },
    {
      id: 'payment_reminder',
      title: 'Lembrete de Pagamento',
      description: 'Lembrete geral de pagamento',
      message: `Olá ${customerData.name}! 🔔\n\nEste é um lembrete sobre sua parcela de R$ 850,00.\n\nPague pelo app ou entre em contato para outras formas de pagamento!\n\nAtenciosamente,\nEquipe AXION Cred`,
      icon: 'message',
      color: 'green'
    },
    {
      id: 'welcome',
      title: 'Boas-Vindas',
      description: 'Mensagem de boas-vindas',
      message: `Olá ${customerData.name}! 🎉\n\nSeja bem-vindo à AXION Cred!\n\nEstamos muito felizes em ter você conosco. Qualquer dúvida sobre seus empréstimos, basta entrar em contato!\n\nAtenciosamente,\nEquipe AXION Cred`,
      icon: 'user',
      color: 'emerald'
    },
  ];

  const getSelectedTemplate = () => {
    return messageTemplates.find(t => t.id === selectedMessage);
  };

  const getWhatsAppLink = (message: string) => {
    const cleanPhone = customerData.phone.replace(/[^0-9]/g, "");
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleSendMessage = async () => {
    setIsSending(true);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      setSelectedMessage(null);
      setCustomMessage('');
    }, 2000);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'lightbulb': return Lightbulb;
      case 'alert': return AlertCircle;
      case 'message': return MessageSquare;
      case 'user': return User;
      default: return MessageSquare;
    }
  };

  const getColorClasses = (color: string, isSelected: boolean = false) => {
    const colors: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
      blue: { 
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', 
        border: 'border-blue-200', 
        icon: 'bg-blue-100 text-blue-600',
        hover: 'hover:from-blue-100 hover:to-indigo-100'
      },
      red: { 
        bg: 'bg-gradient-to-br from-red-50 to-rose-50', 
        border: 'border-red-200', 
        icon: 'bg-red-100 text-red-600',
        hover: 'hover:from-red-100 hover:to-rose-100'
      },
      green: { 
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50', 
        border: 'border-green-200', 
        icon: 'bg-green-100 text-green-600',
        hover: 'hover:from-green-100 hover:to-emerald-100'
      },
      emerald: { 
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50', 
        border: 'border-emerald-200', 
        icon: 'bg-emerald-100 text-emerald-600',
        hover: 'hover:from-emerald-100 hover:to-teal-100'
      },
    };
    return isSelected ? colors[color] : { ...colors[color], bg: 'bg-white', hover: colors[color].hover };
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => window.history.back()}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
          <p className="text-gray-500">{customerData.name}</p>
        </div>
      </div>

      {/* Phone Validation Warning */}
      {!customerData.hasPhone && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Telefone não cadastrado</p>
            <p className="text-sm text-amber-700">Este cliente não possui telefone cadastrado. Sugira o cadastro para enviar mensagens.</p>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {sendSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Mensagem enviada com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Templates */}
      <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
              <MessageSquare className="h-5 w-5 text-[#1E3A8A]" />
            </div>
            <CardTitle className="text-lg font-semibold">Escolha uma Mensagem</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {messageTemplates.map((template, index) => {
              const IconComponent = getIconComponent(template.icon);
              const isSelected = selectedMessage === template.id;
              const colorClasses = getColorClasses(template.color, isSelected);
              
              return (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMessage(template.id)}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${colorClasses.bg} ${colorClasses.border}
                    ${isSelected ? 'ring-2 ring-[#22C55E] ring-offset-2' : ''}
                    ${colorClasses.hover}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{template.title}</div>
                      <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Custom Message Option */}
          <div className="mt-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedMessage('custom')}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3
                ${selectedMessage === 'custom' 
                  ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 ring-2 ring-[#22C55E] ring-offset-2' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${selectedMessage === 'custom' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                <Edit3 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Mensagem Personalizada</div>
                <div className="text-sm text-gray-500 mt-1">Escreva sua própria mensagem</div>
              </div>
              {selectedMessage === 'custom' && (
                <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
              )}
            </motion.button>
          </div>
        </CardContent>
      </Card>

      {/* Message Preview / Edit */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-gray-200/60 shadow-md">
              <CardHeader className="pb-4 border-b border-gray-100/50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#22C55E]/10">
                    <Send className="h-5 w-5 text-[#22C55E]" />
                  </div>
                  <CardTitle className="text-lg font-semibold">
                    {selectedMessage === 'custom' ? 'Editar Mensagem' : 'Preview da Mensagem'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {selectedMessage === 'custom' ? (
                  <Textarea 
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Digite sua mensagem personalizada..."
                    className="min-h-[150px] border-gray-200 focus:border-[#22C55E] focus:ring-[#22C55E]/20"
                  />
                ) : (
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 whitespace-pre-wrap">
                    {getSelectedTemplate()?.message}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    <span>Enviando para: {customerData.phone}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedMessage(null)}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isSending || (selectedMessage === 'custom' && !customMessage.trim())}
                      className="
                        bg-[#22C55E] hover:bg-[#4ADE80] 
                        shadow-lg shadow-emerald-500/25
                        hover:shadow-emerald-500/40
                        transition-all duration-300
                      "
                    >
                      {isSending ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Enviando...
                        </>
                      ) : selectedMessage === 'custom' ? (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Criar Mensagem
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Abrir no WhatsApp
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
