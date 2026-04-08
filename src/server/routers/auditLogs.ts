import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Audit Logs Router
export const auditLogsRouter = router({
  // List audit logs with filters
  list: protectedProcedure
    .input(
      z.object({
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        userId: z.string().optional(),
        action: z.enum(["INSERT", "UPDATE", "DELETE"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { entityType, entityId, userId, action, dateFrom, dateTo, limit, offset } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      let query = ctx.supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset || 0, (offset || 0) + (limit || 50) - 1)

      if (entityType) {
        query = query.eq("entity_type", entityType)
      }

      if (entityId) {
        query = query.eq("entity_id", entityId)
      }

      if (userId) {
        query = query.eq("user_id", userId)
      }

      if (action) {
        query = query.eq("action", action)
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom)
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar logs de auditoria",
        })
      }

      // Get unique users for display
      const userIds = [...new Set((data || []).map((log) => log.user_id).filter(Boolean))]
      const { data: users } = await ctx.supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userMap: Record<string, any> = (users || []).reduce(
        (acc, u) => ({ ...acc, [u.id]: { name: u.name, email: u.email } }),
        {}
      )

      // Enrich data with user names
      const enrichedData = (data || []).map((log) => ({
        ...log,
        user_name: log.user_id ? userMap[log.user_id]?.name || "Desconhecido" : null,
        user_email: log.user_id ? userMap[log.user_id]?.email || null : null,
      }))

      return {
        logs: enrichedData,
        total: count || 0,
      }
    }),

  // Get audit log by ID
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx

      const { data, error } = await ctx.supabase
        .from("audit_logs")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Log de auditoria não encontrado",
        })
      }

      return data
    }),

  // Get entity history (all changes to a specific entity)
  getEntityHistory: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { entityType, entityId } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const { data, error } = await ctx.supabase
        .from("audit_logs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar histórico",
        })
      }

      return { history: data || [] }
    }),

  // Get user activity (all actions by a specific user)
  getUserActivity: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { userId, limit } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const { data, error } = await ctx.supabase
        .from("audit_logs")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit || 50)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar atividade do usuário",
        })
      }

      // Group by entity type
      const byEntityType = (data || []).reduce(
        (acc, log) => {
          acc[log.entity_type] = (acc[log.entity_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        activity: data || [],
        summary: byEntityType,
      }
    }),

  // Get audit statistics
  stats: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { dateFrom, dateTo } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      let query = ctx.supabase
        .from("audit_logs")
        .select("action, entity_type, created_at")
        .eq("tenant_id", tenantId)

      if (dateFrom) {
        query = query.gte("created_at", dateFrom)
      }

      if (dateTo) {
        query = query.lte("created_at", dateTo)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar estatísticas",
        })
      }

      // Count by action
      const byAction = (data || []).reduce(
        (acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Count by entity type
      const byEntityType = (data || []).reduce(
        (acc, log) => {
          acc[log.entity_type] = (acc[log.entity_type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Count by day (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split("T")[0]
      })

      const byDay = last7Days.reduce((acc, date) => {
        acc[date] = (data || []).filter(
          (log) => log.created_at.split("T")[0] === date
        ).length
        return acc
      }, {} as Record<string, number>)

      return {
        total: data?.length || 0,
        byAction,
        byEntityType,
        byDay,
      }
    }),
})