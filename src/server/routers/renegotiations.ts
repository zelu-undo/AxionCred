import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Renegotiations router
export const renegotiationsRouter = router({
  // List all renegotiations
  list: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "pending", "approved", "rejected"]).optional().default("all"),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const inputVal = input || { status: "all", limit: 50, offset: 0 }
      const { status, limit, offset } = inputVal
      
      let query = ctx.supabase
        .from("loan_renegotiations")
        .select(`
          *,
          loan:loans(
            id,
            customer_id,
            principal_amount,
            total_amount,
            customer:customers(name, document)
          )
        `, { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset || 0, (offset || 0) + limit - 1)

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar renegociações",
        })
      }

      return { renegotiations: data || [], total: count || 0 }
    }),

  // Get single renegotiation
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx

      const { data, error } = await ctx.supabase
        .from("loan_renegotiations")
        .select(`
          *,
          loan:loans(
            *,
            customer:customers(*)
          )
        `)
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Renegociação não encontrada",
        })
      }

      return data
    }),

  // Create renegotiation
  create: protectedProcedure
    .input(z.object({
      loan_id: z.string(),
      new_installments: z.number().min(1),
      new_interest_rate: z.number().min(0),
      new_total_amount: z.number().min(0),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Get current loan data
      const { data: loan, error: loanError } = await ctx.supabase
        .from("loans")
        .select("*")
        .eq("id", input.loan_id)
        .eq("tenant_id", tenantId)
        .single()

      if (loanError || !loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Empréstimo não encontrado",
        })
      }

      // Create renegotiation record
      const { data, error } = await ctx.supabase
        .from("loan_renegotiations")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          loan_id: input.loan_id,
          original_amount: loan.total_amount,
          original_installments: loan.installments_count,
          original_interest_rate: loan.interest_rate,
          new_installments: input.new_installments,
          new_interest_rate: input.new_interest_rate,
          new_total_amount: input.new_total_amount,
          reason: input.reason,
          notes: input.notes,
          status: "pending",
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar renegociação",
        })
      }

      return data
    }),

  // Approve renegotiation
  approve: protectedProcedure
    .input(z.object({
      id: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      // Get renegotiation
      const { data: renegotiation, error: renegoError } = await ctx.supabase
        .from("loan_renegotiations")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .single()

      if (renegoError || !renegotiation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Renegociação não encontrada",
        })
      }

      // Update loan with new terms
      const { error: loanError } = await ctx.supabase
        .from("loans")
        .update({
          installments_count: renegotiation.new_installments,
          interest_rate: renegotiation.new_interest_rate,
          total_amount: renegotiation.new_total_amount,
          remaining_amount: renegotiation.new_total_amount,
        })
        .eq("id", renegotiation.loan_id)
        .eq("tenant_id", tenantId)

      if (loanError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar empréstimo",
        })
      }

      // Update renegotiation status
      const { data, error } = await ctx.supabase
        .from("loan_renegotiations")
        .update({
          status: "approved",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          approval_notes: input.notes,
        })
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao aprovar renegociação",
        })
      }

      return data
    }),

  // Reject renegotiation
  reject: protectedProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      const { data, error } = await ctx.supabase
        .from("loan_renegotiations")
        .update({
          status: "rejected",
          rejected_by: userId,
          rejected_at: new Date().toISOString(),
          rejection_reason: input.reason,
        })
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao rejeitar renegociação",
        })
      }

      return data
    }),
})
