import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Interest rules router
export const businessRulesRouter = router({
  // Get all business rules in one call
  get: protectedProcedure.query(async ({ ctx }) => {
    // Get interest rules
    const { data: interestRules, error: irError } = await ctx.supabase
      .from("interest_rules")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .order("min_installments", { ascending: true })

    // Get loan config
    const { data: loanConfig, error: lcError } = await ctx.supabase
      .from("loan_config")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .single()

    // Get late fee config
    const { data: lateFeeConfig, error: lfError } = await ctx.supabase
      .from("late_fee_config")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .single()

    return {
      interestRules: interestRules || [],
      loanConfig,
      lateFeeConfig,
    }
  }),

  // Interest Rules
  listInterestRules: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("interest_rules")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .order("min_installments", { ascending: true })

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data || []
    }),

  createInterestRule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        min_installments: z.number().positive(),
        max_installments: z.number().positive(),
        interest_rate: z.number().min(0),
        interest_type: z.enum(["monthly", "weekly"]).default("monthly"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate no overlap
      const { data: existing } = await ctx.supabase
        .from("interest_rules")
        .select("id")
        .eq("tenant_id", ctx.tenantId!)
        .lte("min_installments", input.max_installments)
        .gte("max_installments", input.min_installments)

      if (existing && existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Já existe uma regra de juros que sobrepõe esta faixa de parcelas",
        })
      }

      const { data, error } = await ctx.supabase
        .from("interest_rules")
        .insert({
          tenant_id: ctx.tenantId,
          ...input,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  updateInterestRule: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        min_installments: z.number().positive().optional(),
        max_installments: z.number().positive().optional(),
        interest_rate: z.number().min(0).optional(),
        interest_type: z.enum(["monthly", "weekly"]).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const { data, error } = await ctx.supabase
        .from("interest_rules")
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

  deleteInterestRule: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("interest_rules")
        .delete()
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get interest rate for specific installments
  getInterestRate: protectedProcedure
    .input(z.object({ installments: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("interest_rules")
        .select("interest_rate, interest_type")
        .eq("tenant_id", ctx.tenantId!)
        .eq("is_active", true)
        .lte("min_installments", input.installments)
        .gte("max_installments", input.installments)
        .order("max_installments - min_installments", { ascending: true })
        .limit(1)
        .single()

      if (error || !data) {
        return { rate: 0, type: "monthly" as const }
      }

      return { rate: data.interest_rate, type: data.interest_type }
    }),

  // Late Fee Config
  getLateFeeConfig: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("late_fee_config")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .single()

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return data
  }),

  updateLateFeeConfig: protectedProcedure
    .input(
      z.object({
        fixed_fee: z.number().min(0).optional(),
        percentage: z.number().min(0).max(100).optional(),
        daily_interest: z.number().min(0).optional(),
        monthly_interest: z.number().min(0).optional(),
        grace_days: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if config exists
      const { data: existing } = await ctx.supabase
        .from("late_fee_config")
        .select("id")
        .eq("tenant_id", ctx.tenantId!)
        .single()

      let data, error

      if (existing) {
        ;({ data, error } = await ctx.supabase
          .from("late_fee_config")
          .update(input)
          .eq("tenant_id", ctx.tenantId!)
          .select()
          .single())
      } else {
        ;({ data, error } = await ctx.supabase
          .from("late_fee_config")
          .insert({ tenant_id: ctx.tenantId, ...input })
          .select()
          .single())
      }

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Loan Config
  getLoanConfig: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("loan_config")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .single()

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return data
  }),

  updateLoanConfig: protectedProcedure
    .input(
      z.object({
        default_interest_rate: z.number().min(0).max(100).optional(),
        min_amount: z.number().positive().optional(),
        max_amount: z.number().positive().optional(),
        min_installments: z.number().positive().optional(),
        max_installments: z.number().positive().optional(),
        allow_renewal: z.boolean().optional(),
        max_active_loans_per_customer: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if config exists
      const { data: existing } = await ctx.supabase
        .from("loan_config")
        .select("id")
        .eq("tenant_id", ctx.tenantId!)
        .single()

      let data, error

      if (existing) {
        ;({ data, error } = await ctx.supabase
          .from("loan_config")
          .update(input)
          .eq("tenant_id", ctx.tenantId!)
          .select()
          .single())
      } else {
        ;({ data, error } = await ctx.supabase
          .from("loan_config")
          .insert({ tenant_id: ctx.tenantId, ...input })
          .select()
          .single())
      }

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),
})
