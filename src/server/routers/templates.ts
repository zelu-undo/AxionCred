import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Message templates router
export const templatesRouter = router({
  // List all templates
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        is_active: z.boolean().optional(),
        is_system: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { category, is_active, is_system, search, limit, offset } = input

      let query = ctx.supabase
        .from("message_templates")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .order("is_system", { ascending: true })
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1)

      if (category) {
        query = query.eq("category", category)
      }

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active)
      }

      if (is_system !== undefined) {
        query = query.eq("is_system", is_system)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { templates: data || [], total: count || 0 }
    }),

  // Get template by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("message_templates")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)
        .single()

      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" })
      }

      return data
    }),

  // Get template by category and customer score
  getByCategory: protectedProcedure
    .input(
      z.object({
        category: z.string(),
        customer_score: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("message_templates")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("category", input.category)
        .eq("is_active", true)

      // If customer score provided, try to match score range
      if (input.customer_score !== undefined) {
        const { data: scoreTemplates } = await ctx.supabase
          .from("message_templates")
          .select("*")
          .eq("tenant_id", ctx.tenantId!)
          .eq("category", input.category)
          .eq("is_active", true)
          .lte("min_score", input.customer_score)
          .gte("max_score", input.customer_score)
          .order("max_score - min_score", { ascending: true })
          .limit(1)
          .single()

        if (scoreTemplates) {
          return scoreTemplates
        }
      }

      // Fallback to system template or any active template
      const { data: fallbackTemplate } = await query
        .order("is_system", { ascending: false })
        .limit(1)
        .single()

      return fallbackTemplate
    }),

  // Create template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["welcome", "reminder", "overdue", "payment_received", "custom"]),
        content: z.string().min(1),
        variables: z.array(z.string()).default([]),
        min_score: z.number().min(0).max(1000).optional(),
        max_score: z.number().min(0).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("message_templates")
        .insert({
          tenant_id: ctx.tenantId,
          ...input,
          is_system: false,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        category: z.enum(["welcome", "reminder", "overdue", "payment_received", "custom"]).optional(),
        content: z.string().min(1).optional(),
        variables: z.array(z.string()).optional(),
        is_active: z.boolean().optional(),
        min_score: z.number().min(0).max(1000).optional(),
        max_score: z.number().min(0).max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Check if template is system
      const { data: existing } = await ctx.supabase
        .from("message_templates")
        .select("is_system")
        .eq("id", id)
        .single()

      if (existing?.is_system && updates.content) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível editar templates do sistema",
        })
      }

      const { data, error } = await ctx.supabase
        .from("message_templates")
        .update(updates)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if template is system
      const { data: existing } = await ctx.supabase
        .from("message_templates")
        .select("is_system")
        .eq("id", input.id)
        .single()

      if (existing?.is_system) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível excluir templates do sistema",
        })
      }

      const { error } = await ctx.supabase
        .from("message_templates")
        .delete()
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Preview template with variables
  preview: protectedProcedure
    .input(
      z.object({
        template_id: z.string(),
        variables: z.record(z.string(), z.string()),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: template } = await ctx.supabase
        .from("message_templates")
        .select("content")
        .eq("id", input.template_id)
        .single()

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" })
      }

      let preview = template.content
      for (const [key, value] of Object.entries(input.variables)) {
        preview = preview.replace(new RegExp(`{{${key}}}`, "g"), value)
      }

      return { preview }
    }),

  // Get available variables for a category
  getVariables: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const variablesByCategory: Record<string, string[]> = {
        welcome: ["customer_name", "company_name", "credit_limit", "loan_amount"],
        reminder: ["customer_name", "installment_amount", "due_date", "days_until", "loan_id"],
        overdue: ["customer_name", "installment_amount", "due_date", "days_late", "late_fee", "loan_id"],
        payment_received: ["customer_name", "amount", "receipt_id", "loan_id"],
        custom: ["customer_name", "company_name", "promo_details"],
      }

      return variablesByCategory[input.category] || []
    }),

  // Duplicate template
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: original } = await ctx.supabase
        .from("message_templates")
        .select("*")
        .eq("id", input.id)
        .single()

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template não encontrado" })
      }

      const { data, error } = await ctx.supabase
        .from("message_templates")
        .insert({
          tenant_id: ctx.tenantId,
          name: `${original.name} (cópia)`,
          category: original.category,
          content: original.content,
          variables: original.variables,
          is_system: false,
          is_active: true,
          min_score: original.min_score,
          max_score: original.max_score,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),
})

// Notifications router
export const notificationsRouter = router({
  // Get notification settings for current user
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", ctx.userId!)

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return data || []
  }),

  // Update notification settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        notification_type: z.string(),
        enabled: z.boolean(),
        method: z.enum(["visual", "email", "both"]),
        quiet_hours_start: z.string().optional(),
        quiet_hours_end: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("user_notification_settings")
        .upsert(
          {
            user_id: ctx.userId!,
            ...input,
          },
          { onConflict: "user_id,notification_type" }
        )
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Bulk update notification settings
  bulkUpdateSettings: protectedProcedure
    .input(
      z.array(
        z.object({
          notification_type: z.string(),
          enabled: z.boolean(),
          method: z.enum(["visual", "email", "both"]),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const settings = input.map((s) => ({
        user_id: ctx.userId!,
        ...s,
      }))

      const { error } = await ctx.supabase
        .from("user_notification_settings")
        .upsert(settings, { onConflict: "user_id,notification_type" })

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get list of available notification types
  getTypes: protectedProcedure.query(async () => {
    return [
      { type: "payment_received", label: "Pagamento recebido" },
      { type: "payment_overdue", label: "Pagamento atrasado" },
      { type: "loan_created", label: "Empréstimo criado" },
      { type: "loan_approved", label: "Empréstimo aprovado" },
      { type: "loan_rejected", label: "Empréstimo rejeitado" },
      { type: "customer_created", label: "Cliente criado" },
      { type: "reminder_sent", label: "Lembrete enviado" },
      { type: "new_user", label: "Novo usuário adicionado" },
    ]
  }),

  // Get tenant feature flags
  getFeatures: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("tenant_features")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return data || []
  }),

  // Update tenant feature
  updateFeature: protectedProcedure
    .input(
      z.object({
        feature_name: z.string(),
        enabled: z.boolean(),
        limit_value: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("tenant_features")
        .upsert(
          {
            tenant_id: ctx.tenantId!,
            ...input,
          },
          { onConflict: "tenant_id,feature_name" }
        )
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),
})
