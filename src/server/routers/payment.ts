import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Helper function to safely log customer events (won't fail if table doesn't exist)
async function logCustomerEvent(supabase: any, customerId: string, type: string, description: string) {
  try {
    await supabase.from("customer_events").insert({
      customer_id: customerId,
      type,
      description,
    })
  } catch (e) {
    // Silently ignore if table doesn't exist
    console.log("[payment] Event logging skipped:", type)
  }
}

// Payment router - gerencia registros de pagamento e listagem
export const paymentRouter = router({
  // Lista pagamentos com filtros
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["all", "paid", "pending", "late", "partial"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        customerId: z.string().optional(),
        loanId: z.string().optional(),
        todayOnly: z.boolean().optional(),
        overdueOnly: z.boolean().optional(),
        sortBy: z.enum(["due_date", "paid_date", "amount"]).optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, dateFrom, dateTo, customerId, loanId, todayOnly, overdueOnly, sortBy, sortOrder, limit, offset } = input

      const today = new Date().toISOString().split("T")[0]

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
        `, { count: "exact" })
        .eq("loan.tenant_id", ctx.tenantId!)
        .order(sortBy === "paid_date" ? "paid_date" : "due_date", { ascending: sortOrder === "desc" ? false : true })
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

      // Filtrar por busca (nome ou documento do cliente) - via ILIKE
      if (search) {
        query = query.or(`loan.customer.name.ilike.%${search}%,loan.customer.document.ilike.%${search.replace(/[^0-9]/g, '')}%`)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Filtros adicionais no backend
      let installments = data || []
      
      // Filtrar por status (late inclui pending com vencimento < hoje)
      if (status && status !== "all") {
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
      
      // Filtrar hoje
      if (todayOnly) {
        installments = installments.filter((inst: any) => 
          inst.due_date === today || inst.paid_date === today
        )
      }
      
      // Filtrar atrasados
      if (overdueOnly) {
        installments = installments.filter((inst: any) => 
          inst.status === "late" || (inst.status === "pending" && inst.due_date < today)
        )
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

      // Verificar se parcela já está quitada
      if (installment.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta parcela já foi quitada",
        })
      }

      // Calcular juros de mora se parcelas atrasadas
      const today = new Date()
      const dueDate = new Date(installment.due_date)
      const isOverdue = dueDate < today && installment.status !== "paid"
      
      let lateFee = 0
      let lateInterest = 0
      
      if (isOverdue) {
        // Buscar configuração de juros de mora
        const { data: lateFeeConfig } = await ctx.supabase
          .from("late_fee_config")
          .select("*")
          .eq("tenant_id", ctx.tenantId)
          .single()
        
        if (lateFeeConfig) {
          // Calcular dias de atraso
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // Calcular taxa fixa de multa
          lateFee = lateFeeConfig.fixed_fee || 0
          
          // Calcular juros de mora diários
          if (lateFeeConfig.daily_interest && daysOverdue > 0) {
            lateInterest = installment.amount * lateFeeConfig.daily_interest * daysOverdue
          }
        }
      }

      // Valor total com juros de mora (se houver)
      const totalWithLateFees = installment.amount + lateFee + lateInterest

      // Valida valor mínimo (80% da parcela + juros)
      const minAmount = totalWithLateFees * 0.8
      if (amount < minAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor mínimo para pagamento é R$ ${minAmount.toFixed(2)}` +
            (isOverdue ? ` (inclui R$ ${(lateFee + lateInterest).toFixed(2)} de juros de mora)` : ""),
        })
      }

      // Determina status do pagamento (considerando juros de mora)
      const isFullPayment = amount >= totalWithLateFees
      const newStatus = isFullPayment ? "paid" : "partial"
      const paidAmount = installment.paid_amount || 0
      const newPaidAmount = paidAmount + amount

      // Iniciar transação manual - salvar estado original para rollback
      const originalInstallmentStatus = installment.status
      const originalInstallmentPaidAmount = installment.paid_amount || 0
      const originalInstallmentPaidDate = installment.paid_date
      const originalLoanPaidAmount = installment.loan.paid_amount || 0
      const originalLoanPaidInstallments = installment.loan.paid_installments || 0

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
          message: `Erro ao atualizar parcela: ${updateError.message}`,
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
        // Rollback completo da parcela
        await ctx.supabase
          .from("loan_installments")
          .update({
            status: originalInstallmentStatus,
            paid_amount: originalInstallmentPaidAmount,
            paid_date: originalInstallmentPaidDate,
          })
          .eq("id", installment_id)

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao registrar transação: ${transactionError.message}`,
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
        // Rollback completo em caso de erro
        await ctx.supabase
          .from("loan_installments")
          .update({
            status: originalInstallmentStatus,
            paid_amount: originalInstallmentPaidAmount,
            paid_date: originalInstallmentPaidDate,
          })
          .eq("id", installment_id)
        
        // Remove a transação registrada
        await ctx.supabase
          .from("payment_transactions")
          .delete()
          .eq("installment_id", installment_id)
          .eq("status", "completed")
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao atualizar empréstimo: ${loanUpdateError.message}`,
        })
      }

      // Log do evento (safe - won't fail if table doesn't exist)
      try {
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
      } catch (e) {
        console.log("[payment] Event logging skipped")
      }

      // Registrar transação de caixa - Pagamento Recebido (entrada)
      try {
        await ctx.supabase.rpc("register_payment_received", {
          p_tenant_id: ctx.tenantId,
          p_payment_id: installment.loan_id, // Usar loan_id como referência
          p_valor: amount,
          p_usuario_responsavel: ctx.userId || "unknown",
        })
      } catch (cashError) {
        // Não bloqueia pagamento se falhar no caixa
        console.error("Erro ao registrar transação de caixa:", cashError)
      }

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
      // Log do estorno (safe - won't fail if table doesn't exist)
      try {
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
      } catch (e) {
        console.log("[payment] Reverse event logging skipped")
      }

      return { success: true }
    }),

  // Dashboard de pagamentos - overview
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0]
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startOfMonthStr = startOfMonth.toISOString()
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split("T")[0]

    // Queries paralelas para performance - usando via loans para filtrar por tenant
    const [todayResult, monthResult, overdueResult, upcomingResult] = await Promise.all([
      // Total receber hoje
      ctx.supabase
        .from("loans")
        .select(`
          installments:loan_installments(
            amount,
            due_date,
            status
          )
        `)
        .eq("tenant_id", ctx.tenantId!)
        .eq("installments.due_date", today)
        .eq("installments.status", "pending"),
      
      // Total recebido este mês
      ctx.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId!)
        .eq("status", "completed")
        .gte("created_at", startOfMonthStr),
      
      // Total atrasado - via loans
      ctx.supabase
        .from("loans")
        .select(`
          installments:loan_installments(
            amount,
            due_date,
            status
          )
        `)
        .eq("tenant_id", ctx.tenantId!)
        .lt("installments.due_date", today)
        .in("installments.status", ["pending", "partial", "late"]),
      
      // Parcelas próximas (próximos 7 dias) - via loans
      ctx.supabase
        .from("loans")
        .select(`
          installments:loan_installments(
            amount,
            due_date,
            status
          )
        `)
        .eq("tenant_id", ctx.tenantId!)
        .gte("installments.due_date", today)
        .lte("installments.due_date", nextWeekStr)
        .eq("installments.status", "pending"),
    ])

    // Handle nested installments structure from new query format
    const todayToReceive = todayResult.data?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    const todayCount = todayResult.data?.reduce((sum: number, loan: any) => {
      return sum + (loan.installments?.length || 0)
    }, 0) || 0
    const monthReceived = monthResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const overdueAmount = overdueResult.data?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    const overdueCount = overdueResult.data?.reduce((sum: number, loan: any) => {
      return sum + (loan.installments?.length || 0)
    }, 0) || 0
    const upcomingAmount = upcomingResult.data?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    const upcomingCount = upcomingResult.data?.reduce((sum: number, loan: any) => {
      return sum + (loan.installments?.length || 0)
    }, 0) || 0

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
