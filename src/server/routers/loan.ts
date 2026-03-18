import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const loanRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
        status: z.enum(["pending", "active", "paid", "cancelled", "renegotiated"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { customerId, status, limit, offset } = input

      let query = ctx.supabase
        .from("loans")
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .eq("tenant_id", ctx.tenantId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (customerId) {
        query = query.eq("customer_id", customerId)
      }

      if (status) {
        query = query.eq("status", status)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return { loans: data || [], total: count || 0 }
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("loans")
        .select(`
          *,
          customer:customers(name, phone, email),
          installments:loan_installments(*)
        `)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Empréstimo não encontrado",
        })
      }

      return data
    }),

  create: protectedProcedure
    .input(
      z.object({
        customer_id: z.string(),
        principal_amount: z.number().positive(),
        interest_rate: z.number().min(0).max(100).default(0),
        installments_count: z.number().positive().max(48),
        first_due_date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { customer_id, principal_amount, interest_rate, installments_count, first_due_date, notes } = input

      // Calculate total amount with interest
      let total_amount: number
      if (interest_rate === 0) {
        total_amount = principal_amount
      } else {
        const monthlyRate = interest_rate / 100
        const factor = Math.pow(1 + monthlyRate, installments_count)
        total_amount = (principal_amount * monthlyRate * factor) / (factor - 1)
      }

      const installment_amount = total_amount / installments_count

      // Create loan
      const { data: loan, error: loanError } = await ctx.supabase
        .from("loans")
        .insert({
          tenant_id: ctx.tenantId,
          customer_id,
          principal_amount,
          interest_rate,
          total_amount,
          paid_amount: 0,
          remaining_amount: total_amount,
          installments_count,
          paid_installments: 0,
          status: "pending",
          notes,
        })
        .select()
        .single()

      if (loanError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: loanError.message,
        })
      }

      // Generate installments
      const installments = []
      let dueDate = new Date(first_due_date)

      for (let i = 1; i <= installments_count; i++) {
        installments.push({
          loan_id: loan.id,
          installment_number: i,
          amount: installment_amount,
          due_date: dueDate.toISOString().split("T")[0],
          status: "pending",
        })
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      const { error: installmentError } = await ctx.supabase
        .from("loan_installments")
        .insert(installments)

      if (installmentError) {
        // Rollback loan
        await ctx.supabase.from("loans").delete().eq("id", loan.id)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: installmentError.message,
        })
      }

      // Log event
      await ctx.supabase.from("customer_events").insert({
        customer_id,
        type: "loan_created",
        description: `Empréstimo de R$ ${total_amount.toFixed(2)} criado`,
        metadata: { loan_id: loan.id, amount: total_amount },
      })

      return loan
    }),

  payInstallment: protectedProcedure
    .input(
      z.object({
        installment_id: z.string(),
        amount: z.number().positive(),
        payment_date: z.string(),
        method: z.enum(["cash", "pix", "boleto", "card", "transfer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { installment_id, amount, payment_date, method } = input

      // Get installment
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select("*, loan:loans(customer_id, tenant_id)")
        .eq("id", installment_id)
        .single()

      if (instError || !installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parcela não encontrada",
        })
      }

      if (installment.loan.tenant_id !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        })
      }

      // Update installment
      const { error: updateError } = await ctx.supabase
        .from("loan_installments")
        .update({
          status: "paid",
          paid_amount: amount,
          paid_date: payment_date,
        })
        .eq("id", installment_id)

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        })
      }

      // Create payment transaction
      await ctx.supabase.from("payment_transactions").insert({
        tenant_id: ctx.tenantId,
        loan_id: installment.loan_id,
        installment_id,
        method,
        amount,
        status: "completed",
      })

      // Log event
      await ctx.supabase.from("customer_events").insert({
        customer_id: installment.loan.customer_id,
        type: "payment_received",
        description: `Pagamento de R$ ${amount.toFixed(2)} recebido`,
        metadata: { loan_id: installment.loan_id, installment_id, amount },
      })

      return { success: true }
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("loans")
        .update({ status: "cancelled" })
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return { success: true }
    }),

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    // Get total customers
    const { count: totalCustomers } = await ctx.supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId!)

    // Get active loans
    const { count: activeLoans } = await ctx.supabase
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenantId!)
      .eq("status", "active")

    // Get total to receive
    const { data: loansData } = await ctx.supabase
      .from("loans")
      .select("remaining_amount")
      .eq("tenant_id", ctx.tenantId!)
      .in("status", ["pending", "active"])

    const totalToReceive = loansData?.reduce((sum, l) => sum + Number(l.remaining_amount), 0) || 0

    // Get total received this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: receivedData } = await ctx.supabase
      .from("payment_transactions")
      .select("amount")
      .eq("tenant_id", ctx.tenantId!)
      .eq("status", "completed")
      .gte("created_at", startOfMonth.toISOString())

    const totalReceived = receivedData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    // Get overdue
    const { data: overdueData } = await ctx.supabase
      .from("loan_installments")
      .select("amount")
      .eq("status", "late")
      .lt("due_date", new Date().toISOString().split("T")[0])

    const overdueAmount = overdueData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const overdueCount = overdueData?.length || 0

    return {
      total_customers: totalCustomers || 0,
      active_loans: activeLoans || 0,
      total_to_receive: totalToReceive,
      total_received: totalReceived,
      overdue_amount: overdueAmount,
      overdue_count: overdueCount,
    }
  }),
})
