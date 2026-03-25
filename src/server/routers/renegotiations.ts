import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { Notifications } from "@/lib/notifications"

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
            total_amount,
            remaining_amount,
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
          loan_id: input.loan_id,
          renegotiation_date: new Date().toISOString().split('T')[0],
          original_total_amount: loan.total_amount,
          original_installments_count: loan.installments_count,
          new_total_amount: input.new_total_amount,
          new_installments_count: input.new_installments,
          interest_rate: input.new_interest_rate,
          status: "pending",
          notes: input.notes,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro database:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar renegociação: " + error.message,
        })
      }

      // Buscar nome do cliente para notificação
      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("name")
        .eq("id", loan.customer_id)
        .single()

      // Criar notificação de nova renegociação
      await Notifications.renegotiationCreated(
        ctx.supabase,
        tenantId,
        customer?.name || "Cliente",
        loan.total_amount,
        input.new_total_amount
      )

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

      // Buscar nome do cliente para notificação
      if (renegotiation?.loan_id) {
        const { data: loan } = await ctx.supabase
          .from("loans")
          .select("customer_id")
          .eq("id", renegotiation.loan_id)
          .single()

        if (loan?.customer_id) {
          const { data: customer } = await ctx.supabase
            .from("customers")
            .select("name")
            .eq("id", loan.customer_id)
            .single()

          // Criar notificação de renegociação aprovada
          await Notifications.renegotiationApproved(
            ctx.supabase,
            tenantId,
            customer?.name || "Cliente",
            renegotiation.new_total_amount
          )
        }
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

      // Buscar dados da renegociação para notificação
      const { data: renegotiationData } = await ctx.supabase
        .from("loan_renegotiations")
        .select("loan_id")
        .eq("id", input.id)
        .single()

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

      // Buscar nome do cliente para notificação
      if (renegotiationData?.loan_id) {
        const { data: loan } = await ctx.supabase
          .from("loans")
          .select("customer_id")
          .eq("id", renegotiationData.loan_id)
          .single()

        if (loan?.customer_id) {
          const { data: customer } = await ctx.supabase
            .from("customers")
            .select("name")
            .eq("id", loan.customer_id)
            .single()

          // Criar notificação de renegociação rejeitada
          await Notifications.renegotiationRejected(
            ctx.supabase,
            tenantId,
            customer?.name || "Cliente",
            input.reason
          )
        }
      }

      return data
    }),
})
