import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type Supabase = SupabaseClient<Database>

/**
 * Cria notificações para usuários baseado em suas preferências
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
  // Buscar todos os usuários ativos do tenant
  const { data: tenantUsers, error: tenantUsersError } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)

  if (tenantUsersError) {
    console.error("Erro ao buscar usuários do tenant:", tenantUsersError)
    return
  }

  if (!tenantUsers || tenantUsers.length === 0) {
    return
  }

  const userIds = tenantUsers.map(u => u.id)

  // Buscar configurações de notificação para esses usuários
  // A tabela user_notification_settings não tem tenant_id, então usamos .in() com os userIds
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

  let usersToNotify: string[] = []

  if (!userSettings || userSettings.length === 0) {
    // Se não há configurações específicas, enviar para todos os usuários ativos
    usersToNotify = tenantUsers.map(u => u.id)
  } else {
    // Filtrar apenas usuários que desejam receber por método visual ou ambos
    usersToNotify = userSettings
      .filter((setting) => setting.method === "visual" || setting.method === "both")
      .map((setting) => setting.user_id)
  }

  if (usersToNotify.length > 0) {
    const notifications = usersToNotify.map((userId) => ({
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
      .insert(notifications)

    if (insertError) {
      console.error("Erro ao criar notificações:", insertError)
    }
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
  CUSTOMER_CREATED: "customer_created",
  REMINDER_SENT: "reminder_sent",
  NEW_USER: "new_user",
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
}
