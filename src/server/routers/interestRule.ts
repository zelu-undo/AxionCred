import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Schema para validação de regras de juros
const interestRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  installments_min: z.number().int().positive().min(1),
  installments_max: z.number().int().positive().min(1),
  interest_rate: z.number().min(0).max(100),
  interest_type: z.enum(["weekly", "monthly"]).default("monthly"),
  late_fee_percentage: z.number().min(0).max(100).default(0),
  late_interest_type: z.enum(["daily", "monthly"]).default("daily"),
  late_interest_percentage: z.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
  priority: z.number().int().default(0),
})

export const interestRuleRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        active_only: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { active_only, limit, offset } = input

      let query = ctx.supabase
        .from("loan_interest_rules")
        .select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenantId!)
        .order("priority", { ascending: false })
        .range(offset, offset + limit - 1)

      if (active_only) {
        query = query.eq("is_active", true)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return { rules: data || [], total: count || 0 }
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("loan_interest_rules")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Regra de juros não encontrada",
        })
      }

      return data
    }),

  create: protectedProcedure
    .input(interestRuleSchema)
    .mutation(async ({ ctx, input }) => {
      // Validar sobreposição de faixas
      const { data: existingRules, error: checkError } = await ctx.supabase
        .from("loan_interest_rules")
        .select("id, installments_min, installments_max")
        .eq("tenant_id", ctx.tenantId!)
        .eq("is_active", true)

      if (checkError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: checkError.message,
        })
      }

      // Verificar sobreposição
      const hasOverlap = existingRules?.some(
        (rule) =>
          input.installments_min <= rule.installments_max &&
          input.installments_max >= rule.installments_min
      )

      if (hasOverlap) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe uma regra ativa que sobrepõe esta faixa de parcelas",
        })
      }

      const { data, error } = await ctx.supabase
        .from("loan_interest_rules")
        .insert({
          ...input,
          tenant_id: ctx.tenantId,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Registrar no audit log
      await ctx.supabase.from("audit_logs").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "create",
        entity_type: "interest_rule",
        entity_id: data.id,
        new_values: input,
      })

      return data
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: interestRuleSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input

      // Verificar se a regra existe
      const { data: existing, error: existingError } = await ctx.supabase
        .from("loan_interest_rules")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .single()

      if (existingError || !existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Regra de juros não encontrada",
        })
      }

      // Se estiver atualizando faixas, verificar sobreposição
      if (data.installments_min !== undefined || data.installments_max !== undefined) {
        const newMin = data.installments_min ?? existing.installments_min
        const newMax = data.installments_max ?? existing.installments_max

        const { data: otherRules } = await ctx.supabase
          .from("loan_interest_rules")
          .select("id, installments_min, installments_max")
          .eq("tenant_id", ctx.tenantId!)
          .eq("is_active", true)
          .neq("id", id)

        const hasOverlap = otherRules?.some(
          (rule) => newMin <= rule.installments_max && newMax >= rule.installments_min
        )

        if (hasOverlap) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Já existe uma regra ativa que sobrepõe esta faixa de parcelas",
          })
        }
      }

      const { data: updated, error } = await ctx.supabase
        .from("loan_interest_rules")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Registrar no audit log
      await ctx.supabase.from("audit_logs").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "update",
        entity_type: "interest_rule",
        entity_id: id,
        old_values: existing,
        new_values: updated,
      })

      return updated
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input

      // Verificar se a regra existe
      const { data: existing, error: existingError } = await ctx.supabase
        .from("loan_interest_rules")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .single()

      if (existingError || !existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Regra de juros não encontrada",
        })
      }

      // Soft delete - desativar em vez de excluir
      const { error } = await ctx.supabase
        .from("loan_interest_rules")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Registrar no audit log
      await ctx.supabase.from("audit_logs").insert({
        tenant_id: ctx.tenantId,
        user_id: ctx.userId,
        action: "delete",
        entity_type: "interest_rule",
        entity_id: id,
        old_values: existing,
      })

      return { success: true }
    }),

  // Obter regra aplicável para um número de parcelas
  getApplicable: protectedProcedure
    .input(z.object({ installments: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .rpc("get_applicable_interest_rule", {
          p_tenant_id: ctx.tenantId,
          p_installments: input.installments,
        })

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma regra de juros encontrada para esta quantidade de parcelas",
        })
      }

      return data
    }),

  // Simular cálculo de empréstimo com regras
  simulate: protectedProcedure
    .input(
      z.object({
        principal_amount: z.number().positive(),
        installments: z.number().int().positive().max(48),
        customer_id: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { principal_amount, installments, customer_id } = input

      // Buscar regra aplicável
      const { data: rule, error: ruleError } = await ctx.supabase
        .rpc("get_applicable_interest_rule", {
          p_tenant_id: ctx.tenantId,
          p_installments: installments,
        })

      if (ruleError || !rule || rule.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nenhuma regra de juros encontrada para esta quantidade de parcelas",
        })
      }

      const appliedRule = rule[0]

      // Calcular parcela usando sistema Price
      let installmentAmount: number
      const monthlyRate = appliedRule.interest_rate / 100 / 12

      if (monthlyRate === 0) {
        installmentAmount = principal_amount / installments
      } else {
        const factor = Math.pow(1 + monthlyRate, installments)
        installmentAmount = (principal_amount * monthlyRate * factor) / (factor - 1)
      }

      const totalAmount = installmentAmount * installments
      const totalInterest = totalAmount - principal_amount

      return {
        principal_amount,
        installments,
        interest_rate: appliedRule.interest_rate,
        interest_type: appliedRule.interest_type,
        installment_amount: Math.round(installmentAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        rule: appliedRule,
      }
    }),
})
