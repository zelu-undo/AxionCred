import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Payment router - gerencia registros de pagamento e listagem
export const paymentRouter = router({
  // Lista pagamentos com filtros
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", "paid", "pending", "late", "partial"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        customerId: z.string().optional(),
        loanId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, dateFrom, dateTo, customerId, loanId, limit, offset } = input

      // Primeiro, busca as parcelas com informações relacionadas
      let query = ctx.supabase
        .from("loan_installments")
        .select(`
          id,
          installment_number,
          amount,
          paid_amount,
          due_date,
          paid_date,
          status,
          loan:loans(
            id,
            customer_id,
            principal_amount,
            total_amount,
            paid_amount as loan_paid_amount,
            remaining_amount,
            installments_count,
            paid_installments,
            status as loan_status,
            customer:customers(
              id,
              name,
              document,
              phone,
              email
            )
          )
        `)
        .eq("tenant_id", ctx.tenantId!)
        .order("due_date", { ascending: true })
        .range(offset, offset + limit - 1)

      if (customerId) {
        query = query.eq("loan.customer_id", customerId)
      }

      if (loanId) {
        query = query.eq("loan_id", loanId)
      }

      if (dateFrom) {
        query = query.gte("due_date", dateFrom)
      }

      if (dateTo) {
        query = query.lte("due_date", dateTo)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Filtra por status no lado do cliente se necessário
      let installments = data || []
      
      if (status && status !== "all") {
        const today = new Date().toISOString().split("T")[0]
        
        installments = installments.filter((inst: any) => {
          const instStatus = inst.status
          
          if (status === "late") {
            // Atrasado: status é 'late' ou (pending e vencimento menor que hoje)
            return instStatus === "late" || 
              (instStatus === "pending" && inst.due_date < today)
          }
          
          return instStatus === status
        })
      }

      // Formata os dados para o frontend
      const payments = installments.map((inst: any) => ({
        id: inst.id,
        customer_name: inst.loan?.customer?.name || "-",
        customer_document: inst.loan?.customer?.document || "-",
        customer_phone: inst.loan?.customer?.phone || "-",
        customer_email: inst.loan?.customer?.email || "-",
        loan_id: inst.loan?.id,
        installment_number: inst.installment_number,
        installment_total: inst.loan?.installments_count || 0,
        amount_due: inst.amount,
        amount_paid: inst.paid_amount || 0,
        due_date: inst.due_date,
        paid_date: inst.paid_date,
        status: inst.status,
        payment_method: null, // Será preenchido quando houver transação
        notes: null,
      }))

      return { payments, total: count || 0 }
    }),

  // Registrar um pagamento
  register: protectedProcedure
    .input(
      z.object({
        installment_id: z.string(),
        amount: z.number().positive(),
        payment_date: z.string(),
        method: z.enum(["cash", "pix", "boleto", "card", "transfer"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { installment_id, amount, payment_date, method, notes } = input

      // Busca a parcela
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select(`
          *,
          loan:loans(id, customer_id, tenant_id, principal_amount, total_amount, paid_amount, remaining_amount, installments_count, paid_installments, status)
        `)
        .eq("id", installment_id)
        .single()

      if (instError || !installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parcela não encontrada",
        })
      }

      // Valida tenant
      if (installment.loan.tenant_id !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        })
      }

      // Valida valor mínimo (80% da parcela)
      const minAmount = installment.amount * 0.8
      if (amount < minAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor mínimo para pagamento é R$ ${minAmount.toFixed(2)}`,
        })
      }

      // Determina status do pagamento
      const isFullPayment = amount >= installment.amount
      const newStatus = isFullPayment ? "paid" : "partial"
      const paidAmount = installment.paid_amount || 0
      const newPaidAmount = paidAmount + amount

      // Atualiza a parcela
      const { error: updateError } = await ctx.supabase
        .from("loan_installments")
        .update({
          status: newStatus,
          paid_amount: newPaidAmount,
          paid_date: payment_date,
        })
        .eq("id", installment_id)

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateError.message,
        })
      }

      // Cria registro de transação
      const { error: transactionError } = await ctx.supabase
        .from("payment_transactions")
        .insert({
          tenant_id: ctx.tenantId,
          loan_id: installment.loan_id,
          installment_id,
          method,
          amount,
          status: "completed",
          notes,
        })

      if (transactionError) {
        // Faz rollback da parcela
        await ctx.supabase
          .from("loan_installments")
          .update({
            status: installment.status,
            paid_amount: paidAmount,
            paid_date: installment.paid_date,
          })
          .eq("id", installment_id)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar transação",
        })
      }

      // Atualiza o loan com novos valores
      const loan = installment.loan
      const newLoanPaidAmount = (loan.paid_amount || 0) + amount
      const newRemainingAmount = (loan.total_amount || 0) - newLoanPaidAmount
      const newPaidInstallments = isFullPayment 
        ? (loan.paid_installments || 0) + 1 
        : loan.paid_installments

      // Determina status do loan
      let newLoanStatus = loan.status
      if (newPaidInstallments >= loan.installments_count) {
        newLoanStatus = "paid"
      } else if (newPaidInstallments > 0) {
        newLoanStatus = "active"
      }

      const { error: loanUpdateError } = await ctx.supabase
        .from("loans")
        .update({
          paid_amount: newLoanPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          paid_installments: newPaidInstallments,
          status: newLoanStatus,
        })
        .eq("id", loan.id)

      if (loanUpdateError) {
        console.error("Erro ao atualizar loan:", loanUpdateError)
        // Não lança erro porque a parcela foi atualizada
      }

      // Log do evento
      await ctx.supabase.from("customer_events").insert({
        customer_id: loan.customer_id,
        type: "payment_received",
        description: `Pagamento de R$ ${amount.toFixed(2)} ${isFullPayment ? '(quitação)' : ''} - Parcela ${installment.installment_number}/${loan.installments_count}`,
        metadata: { 
          loan_id: loan.id, 
          installment_id, 
          amount,
          method,
          is_full_payment: isFullPayment,
        },
      })

      return { 
        success: true, 
        installment_id,
        new_status: newStatus,
        loan_status: newLoanStatus,
      }
    }),

  // Estorna um pagamento
  reverse: protectedProcedure
    .input(
      z.object({
        transaction_id: z.string(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { transaction_id, reason } = input

      // Busca a transação
      const { data: transaction, error: transError } = await ctx.supabase
        .from("payment_transactions")
        .select(`
          *,
          loan:loans(id, customer_id, tenant_id, paid_amount, remaining_amount, paid_installments, installments_count, status),
          installment:loan_installments(id, installment_number, amount, paid_amount, status)
        `)
        .eq("id", transaction_id)
        .single()

      if (transError || !transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transação não encontrada",
        })
      }

      // Valida tenant
      if (transaction.tenant_id !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        })
      }

      // Atualiza transação para estornada
      const { error: updateTransError } = await ctx.supabase
        .from("payment_transactions")
        .update({
          status: "reversed",
          notes: `Estornado: ${reason}`,
        })
        .eq("id", transaction_id)

      if (updateTransError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateTransError.message,
        })
      }

      // Reverte a parcela
      const installment = transaction.installment
      const wasPaid = installment.status === "paid"
      const newPaidAmount = Math.max(0, (installment.paid_amount || 0) - transaction.amount)

      const { error: updateInstError } = await ctx.supabase
        .from("loan_installments")
        .update({
          status: newPaidAmount > 0 ? "partial" : "pending",
          paid_amount: newPaidAmount,
          paid_date: null,
        })
        .eq("id", transaction.installment_id)

      if (updateInstError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: updateInstError.message,
        })
      }

      // Atualiza o loan
      const loan = transaction.loan
      const newLoanPaidAmount = Math.max(0, (loan.paid_amount || 0) - transaction.amount)
      const newRemainingAmount = (loan.total_amount || 0) - newLoanPaidAmount
      const newPaidInstallments = wasPaid 
        ? Math.max(0, (loan.paid_installments || 0) - 1) 
        : loan.paid_installments

      let newLoanStatus = loan.status
      if (newPaidInstallments === 0) {
        newLoanStatus = "pending"
      } else if (newLoanStatus === "paid") {
        newLoanStatus = "active"
      }

      await ctx.supabase
        .from("loans")
        .update({
          paid_amount: newLoanPaidAmount,
          remaining_amount: newRemainingAmount,
          paid_installments: newPaidInstallments,
          status: newLoanStatus,
        })
        .eq("id", loan.id)

      // Log do estorno
      await ctx.supabase.from("customer_events").insert({
        customer_id: loan.customer_id,
        type: "payment_reversed",
        description: `Pagamento estornado: R$ ${transaction.amount.toFixed(2)} - Motivo: ${reason}`,
        metadata: { 
          loan_id: loan.id, 
          transaction_id,
          amount: transaction.amount,
          reason,
        },
      })

      return { success: true }
    }),

  // Dashboard de pagamentos -overview
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0]
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Total receber hoje
    const { data: todayData } = await ctx.supabase
      .from("loan_installments")
      .select("amount")
      .eq("tenant_id", ctx.tenantId!)
      .eq("due_date", today)
      .in("status", ["pending", "partial"])

    const todayToReceive = todayData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const todayCount = todayData?.length || 0

    // Total recebido este mês
    const { data: monthData } = await ctx.supabase
      .from("payment_transactions")
      .select("amount")
      .eq("tenant_id", ctx.tenantId!)
      .eq("status", "completed")
      .gte("created_at", startOfMonth.toISOString())

    const monthReceived = monthData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    // Total atrasado
    const { data: overdueData } = await ctx.supabase
      .from("loan_installments")
      .select("amount")
      .eq("tenant_id", ctx.tenantId!)
      .lt("due_date", today)
      .in("status", ["pending", "partial", "late"])

    const overdueAmount = overdueData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const overdueCount = overdueData?.length || 0

    // Parcelas próximas (próximos 7 dias)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const { data: upcomingData } = await ctx.supabase
      .from("loan_installments")
      .select("amount")
      .eq("tenant_id", ctx.tenantId!)
      .gte("due_date", today)
      .lte("due_date", nextWeek.toISOString().split("T")[0])
      .eq("status", "pending")

    const upcomingAmount = upcomingData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const upcomingCount = upcomingData?.length || 0

    return {
      today_to_receive: todayToReceive,
      today_count: todayCount,
      month_received: monthReceived,
      overdue_amount: overdueAmount,
      overdue_count: overdueCount,
      upcoming_amount: upcomingAmount,
      upcoming_count: upcomingCount,
    }
  }),
})
