import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Notification types
const NotificationType = z.enum([
  "payment_received",
  "payment_overdue",
  "payment_reminder",
  "loan_created",
  "loan_approved",
  "loan_rejected",
  "loan_cancelled",
  "loan_paid_off",
  "customer_created",
  "reminder_sent",
  "new_user",
  "renegotiation_created",
  "renegotiation_approved",
  "renegotiation_rejected",
  "collection_alert",
  "system_alert",
])

// Notifications router
export const notificationsApiRouter = router({
  // List notifications for current user
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional().default(false),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
        type: NotificationType.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx
      const { unreadOnly, limit, offset, type } = input

      if (!tenantId || !userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant ou usuário não encontrado",
        })
      }

      let query = ctx.supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (unreadOnly) {
        query = query.eq("read", false)
      }

      if (type) {
        query = query.eq("type", type)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar notificações",
        })
      }

      // Get unread count
      const { count: unreadCount } = await ctx.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("read", false)

      return {
        notifications: data || [],
        total: count || 0,
        unreadCount: unreadCount || 0,
      }
    }),

  // Get single notification
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      const { data, error } = await ctx.supabase
        .from("notifications")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notificação não encontrada",
        })
      }

      return data
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      const { error } = await ctx.supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao marcar notificação como lida",
        })
      }

      return { success: true }
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const { tenantId, userId } = ctx

    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao marcar notificações como lidas",
      })
    }

    return { success: true }
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      const { error } = await ctx.supabase
        .from("notifications")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao excluir notificação",
        })
      }

      return { success: true }
    }),

  // Clear all notifications
  clearAll: protectedProcedure.mutation(async ({ ctx }) => {
    const { tenantId, userId } = ctx

    const { error } = await ctx.supabase
      .from("notifications")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao limpar notificações",
      })
    }

    return { success: true }
  }),

  // Get unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId, userId } = ctx

    const { count, error } = await ctx.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("read", false)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar count",
      })
    }

    return { count: count || 0 }
  }),

  // Create notification (internal use - triggered by system events)
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        type: NotificationType,
        title: z.string(),
        message: z.string(),
        data: z.record(z.string(), z.any()).optional(),
        priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const { data, error } = await ctx.supabase
        .from("notifications")
        .insert({
          tenant_id: tenantId,
          user_id: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          priority: input.priority,
          read: false,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar notificação",
        })
      }

      return data
    }),

  // Bulk create notifications (for batch operations)
  bulkCreate: protectedProcedure
    .input(
      z.array(
        z.object({
          userId: z.string(),
          type: NotificationType,
          title: z.string(),
          message: z.string(),
          data: z.record(z.string(), z.any()).optional(),
          priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const notifications = input.map((n) => ({
        tenant_id: tenantId,
        user_id: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data || {},
        priority: n.priority,
        read: false,
      }))

      const { data, error } = await ctx.supabase
        .from("notifications")
        .insert(notifications)
        .select()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar notificações",
        })
      }

      return { notifications: data, count: data?.length || 0 }
    }),

  // Get notification statistics
  stats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId, userId } = ctx

    // Get counts by type
    const { data: byType, error: typeError } = await ctx.supabase
      .from("notifications")
      .select("type")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)

    if (typeError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar estatísticas",
      })
    }

    // Count by type
    const typeCounts: Record<string, number> = {}
    const unreadByType: Record<string, number> = {}

    byType?.forEach((n) => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1
    })

    // Get unread by type
    const { data: unreadData } = await ctx.supabase
      .from("notifications")
      .select("type")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("read", false)

    unreadData?.forEach((n) => {
      unreadByType[n.type] = (unreadByType[n.type] || 0) + 1
    })

    // Get total and unread counts
    const { count: total } = await ctx.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)

    const { count: unread } = await ctx.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("read", false)

    return {
      total: total || 0,
      unread: unread || 0,
      byType: typeCounts,
      unreadByType,
    }
  }),

  // Subscribe to real-time notifications (returns channel name)
  subscribe: protectedProcedure.mutation(async ({ ctx }) => {
    const { tenantId, userId } = ctx

    // This would typically set up a Supabase Realtime subscription
    // on the client side, but we return the channel pattern
    return {
      channel: `notifications:${tenantId}:${userId}`,
      message: "Use Supabase client to subscribe to real-time updates",
    }
  }),
})