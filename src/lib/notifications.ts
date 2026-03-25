import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { sendNotificationEmail } from "./notification-email"

type Supabase = SupabaseClient<Database>

/**
 * Interface para configurações de notificação do usuário
 */
interface UserNotificationSetting {
  user_id: string
  method: string
}

/**
 * Interface para dados do usuário
 */
interface UserData {
  id: string
  email: string
}

/**
 * Interface para notificação do banco
 */
interface NotificationData {
  user_id: string
  tenant_id: string
  type: string
  title: string
  message: string
  data: string
  is_read: boolean
}

/**
 * Cria notificações para usuários baseado em suas preferências
 * Suporta both: visual (banco) + email (Resend)
 * 
 * @param supabase - Cliente do Supabase
 * @param tenantId - ID do tenant
 * @param notificationType - Tipo da notificação (ex: 'payment_received', 'loan_created')
 * @param title - Título da notificação
 * @param message - Mensagem da notificação
 * @param data - Dados adicionais em formato JSON
 */
export async function createNotification(
  supabase: Supabase,
  tenantId: string,
  notificationType: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<void> {
  // Buscar todos os usuários ativos do tenant com seus emails
  const { data: tenantUsers, error: tenantUsersError } = await supabase
    .from("users")
    .select("id, email")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)

  if (tenantUsersError) {
    console.error("Erro ao buscar usuários do tenant:", tenantUsersError)
    return
  }

  if (!tenantUsers || tenantUsers.length === 0) {
    return
  }

  // Tipos explícitos para evitar erro de inferência
  const usersArray: UserData[] = tenantUsers as unknown as UserData[]
  const userIds = usersArray.map(u => u.id)

  // Buscar configurações de notificação para esses usuários
  const { data: userSettings, error: settingsError } = await supabase
    .from("user_notification_settings")
    .select("user_id, method")
    .in("user_id", userIds)
    .eq("notification_type", notificationType)
    .eq("enabled", true)

  if (settingsError) {
    console.error("Erro ao buscar configurações de notificação:", settingsError)
    return
  }

  // Separar usuários por método de notificação
  const usersForVisual: string[] = []
  const usersForEmail: string[] = []

  if (!userSettings || userSettings.length === 0) {
    // Se não há configurações específicas, enviar para todos os usuários ativos (visual + email)
    usersArray.forEach((u) => {
      usersForVisual.push(u.id)
      usersForEmail.push(u.id)
    })
  } else {
    // Separar por método
    userSettings.forEach((setting: UserNotificationSetting) => {
      if (setting.method === "visual" || setting.method === "both") {
        usersForVisual.push(setting.user_id)
      }
      if (setting.method === "email" || setting.method === "both") {
        usersForEmail.push(setting.user_id)
      }
    })
  }

  // 1. Criar notificações visuais no banco
  if (usersForVisual.length > 0) {
    const notifications: NotificationData[] = usersForVisual.map((userId) => ({
      user_id: userId,
      tenant_id: tenantId,
      type: notificationType,
      title,
      message,
      data: JSON.stringify(data),
      is_read: false,
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications as unknown as never)

    if (insertError) {
      console.error("Erro ao criar notificações visuais:", insertError)
    }
  }

  // 2. Enviar notificações por email
  if (usersForEmail.length > 0) {
    // Buscar emails dos usuários que devem receber
    const usersToEmail = usersArray.filter((u: UserData) => 
      usersForEmail.includes(u.id) && u.email
    )

    // Enviar emails em paralelo (não bloqueante)
    usersToEmail.forEach((user: UserData) => {
      sendNotificationEmail(
        user.email,
        notificationType,
        title,
        message,
        data
      ).catch((err) => {
        console.error(`Erro ao enviar email para ${user.email}:`, err)
      })
    })
  }
}

/**
 * Notificações pré-definidas do sistema
 */
export const NotificationTypes = {
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_OVERDUE: "payment_overdue",
  LOAN_CREATED: "loan_created",
  LOAN_APPROVED: "loan_approved",
  LOAN_REJECTED: "loan_rejected",
  LOAN_CANCELLED: "loan_cancelled",
  LOAN_PAID_OFF: "loan_paid_off",
  CUSTOMER_CREATED: "customer_created",
  REMINDER_SENT: "reminder_sent",
  NEW_USER: "new_user",
  RENEGOTIATION_CREATED: "renegotiation_created",
  RENEGOTIATION_APPROVED: "renegotiation_approved",
  RENEGOTIATION_REJECTED: "renegotiation_rejected",
} as const

/**
 * Funções helper para criar notificações específicas
 */
export const Notifications = {
  /**
   * Notifica que um pagamento foi recebido
   */
  paymentReceived: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.PAYMENT_RECEIVED,
      "Pagamento Recebido",
      `R$ ${amount.toLocaleString("pt-BR")} de ${customerName}`,
      { customerName, amount }
    )
  },

  /**
   * Notifica que uma parcela está atrasada
   */
  paymentOverdue: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    daysLate: number,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.PAYMENT_OVERDUE,
      "Parcela Vencida",
      `${customerName} - ${daysLate} dia${daysLate > 1 ? "s" : ""} atrasado${daysLate > 1 ? "s" : ""}`,
      { customerName, daysLate, amount }
    )
  },

  /**
   * Notifica que um novo empréstimo foi criado
   */
  loanCreated: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.LOAN_CREATED,
      "Novo Empréstimo",
      `${customerName} - R$ ${amount.toLocaleString("pt-BR")}`,
      { customerName, amount }
    )
  },

  /**
   * Notifica que um empréstimo foi aprovado
   */
  loanApproved: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.LOAN_APPROVED,
      "Empréstimo Aprovado",
      `${customerName} - R$ ${amount.toLocaleString("pt-BR")}`,
      { customerName, amount }
    )
  },

  /**
   * Notifica que um empréstimo foi rejeitado
   */
  loanRejected: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    reason?: string
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.LOAN_REJECTED,
      "Empréstimo Rejeitado",
      reason ? `${customerName} - ${reason}` : customerName,
      { customerName, reason }
    )
  },

  /**
   * Notifica que um novo cliente foi criado
   */
  customerCreated: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    document?: string
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.CUSTOMER_CREATED,
      "Novo Cliente",
      customerName,
      { customerName, document }
    )
  },

  /**
   * Notifica que um novo usuário foi adicionado
   */
  newUser: async (
    supabase: Supabase,
    tenantId: string,
    userName: string,
    role: string
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.NEW_USER,
      "Novo Usuário Adicionado",
      `${userName} - ${role}`,
      { userName, role }
    )
  },

  /**
   * Notifica que um lembrete foi enviado
   */
  reminderSent: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    installmentNumber: number,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.REMINDER_SENT,
      "Lembrete Enviado",
      `${customerName} - Parcela #${installmentNumber} - R$ ${amount.toLocaleString("pt-BR")}`,
      { customerName, installmentNumber, amount }
    )
  },

  /**
   * Notifica que um empréstimo foi cancelado
   */
  loanCancelled: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.LOAN_CANCELLED,
      "Empréstimo Cancelado",
      `${customerName} - R$ ${amount.toLocaleString("pt-BR")}`,
      { customerName, amount }
    )
  },

  /**
   * Notifica que um empréstimo foi quitado
   */
  loanPaidOff: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    amount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.LOAN_PAID_OFF,
      "Empréstimo Quitado",
      `${customerName} quitou R$ ${amount.toLocaleString("pt-BR")}`,
      { customerName, amount }
    )
  },

  /**
   * Notifica que uma renegociação foi criada
   */
  renegotiationCreated: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    oldAmount: number,
    newAmount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.RENEGOTIATION_CREATED,
      "Nova Renegociação",
      `${customerName} - De R$ ${oldAmount.toLocaleString("pt-BR")} para R$ ${newAmount.toLocaleString("pt-BR")}`,
      { customerName, oldAmount, newAmount }
    )
  },

  /**
   * Notifica que uma renegociação foi aprovada
   */
  renegotiationApproved: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    newAmount: number
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.RENEGOTIATION_APPROVED,
      "Renegociação Aprovada",
      `${customerName} - Novo valor: R$ ${newAmount.toLocaleString("pt-BR")}`,
      { customerName, newAmount }
    )
  },

  /**
   * Notifica que uma renegociação foi rejeitada
   */
  renegotiationRejected: async (
    supabase: Supabase,
    tenantId: string,
    customerName: string,
    reason?: string
  ) => {
    await createNotification(
      supabase,
      tenantId,
      NotificationTypes.RENEGOTIATION_REJECTED,
      "Renegociação Rejeitada",
      `${customerName}${reason ? ` - ${reason}` : ""}`,
      { customerName, reason }
    )
  },
}
