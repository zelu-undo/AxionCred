import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { Notifications } from "@/lib/notifications"

// Helper function to safely log customer events (won't fail if table doesn't exist)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logCustomerEvent(supabase: SupabaseClient<any>, customerId: string, type: string, description: string) {
  try {
    await supabase.from("customer_events").insert({
      customer_id: customerId,
      type,
      description,
    })
  } catch {
    // Silently ignore if table doesn't exist
  }
}

// Payment router - gerencia registros de pagamento e listagem
export const paymentRouter = router({
  // Calcula valor do pagamento com juros de mora
  calculate: protectedProcedure
    .input(
      z.object({
        installment_id: z.string(),
        payment_date: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { installment_id, payment_date } = input;

      // Busca a parcela
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select(`
          *,
          loan:loans(id, customer_id, tenant_id, amount, total_amount, paid_amount, remaining_amount, installments, paid_installments, status)
        `)
        .eq("id", installment_id)
        .single()

      if (instError || !installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parcela não encontrada",
        })
      }

      // Calcula juros de mora
      const today = new Date()
      const dueDate = new Date(installment.due_date)
      const isOverdue = dueDate < today && installment.status !== "paid"
      
      let lateFee = 0
      let lateInterest = 0
      
      if (isOverdue) {
        const { data: lateFeeConfig } = await ctx.supabase
          .from("late_fee_config")
          .select("*")
          .eq("tenant_id", ctx.tenantId)
          .single()
        
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        if (lateFeeConfig) {
          // Calcular taxa fixa de multa (pode ser percentual ou valor fixo)
          // Assume percentual se fixed_fee <= 100 ou se late_fee_type for 'percent'
          const isPercentFee = lateFeeConfig.late_fee_type === 'percent' || 
            lateFeeConfig.late_fee_type === undefined || 
            (lateFeeConfig.fixed_fee || 0) <= 100
          
          if (isPercentFee) {
            lateFee = installment.amount * ((lateFeeConfig.fixed_fee || 0) / 100)
          } else {
            lateFee = lateFeeConfig.fixed_fee || 0
          }
          
          // Calcular juros de mora (pode ser percentual ou valor fixo diário)
          const effectiveDaysOverdue = Math.min(daysOverdue, 30)
          const dailyInterest = lateFeeConfig.daily_interest || 0
          
          if (effectiveDaysOverdue > 0) {
            if (dailyInterest > 1) {
              // Valor fixo por dia (ex: R$15/dia)
              lateInterest = dailyInterest * effectiveDaysOverdue
            } else if (dailyInterest > 0) {
              // Percentual ao dia
              lateInterest = installment.amount * dailyInterest * effectiveDaysOverdue
            }
          }
        }
      }

      return {
        installment_amount: installment.amount,
        late_fee: lateFee,
        late_interest: lateInterest,
        total_amount: installment.amount + lateFee + lateInterest,
        is_overdue: isOverdue,
      }
    }),

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
            amount,
            total_amount,
            paid_amount,
            remaining_amount,
            installments,
            paid_installments,
            status,
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

      // Exclude installments from fully paid loans - show only pending/active installments
      query = query.in("loan.status", ["pending", "active", "late", "overdue", "partial"])

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let installments = (data || []) as any[]
      
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
      // Primeiro, buscar as transações de pagamento para obter método e observações
      const installmentIds = (data || []).map((inst: any) => inst.id)
      
      let transactionsMap: Record<string, { payment_method: string; notes: string }> = {}
      
      if (installmentIds.length > 0) {
        const { data: transactions } = await ctx.supabase
          .from("payment_transactions")
          .select("id, installment_id, payment_method, notes")
          .in("installment_id", installmentIds)
          .eq("status", "completed")
        
        if (transactions) {
          transactions.forEach((t: any) => {
            transactionsMap[t.installment_id] = { payment_method: t.payment_method, notes: t.notes }
          })
        }
      }

      const payments = installments.map((inst: any) => {
        const transaction = transactionsMap[inst.id]
        
        // Calculate total with late fees for display
        const dueDate = new Date(inst.due_date)
        const today = new Date()
        const isOverdue = dueDate < today && inst.status !== 'paid'
        let totalWithLateFees = inst.amount // Default to base amount
        
        if (isOverdue && inst.status !== 'paid') {
          // Get late config and calculate
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // This would need late_fee_config - we'll calculate based on what's stored
          const lateFee = inst.late_fee_applied || 0
          const lateInterest = inst.late_interest_applied || 0
          totalWithLateFees = inst.amount + lateFee + lateInterest
        }
        
        return {
          id: inst.id,
          customer_name: inst.loan?.customer?.name || "-",
          customer_document: inst.loan?.customer?.document || "-",
          customer_phone: inst.loan?.customer?.phone || "-",
          customer_email: inst.loan?.customer?.email || "-",
          loan_id: inst.loan?.id,
          installment_number: inst.installment_number,
          installment_total: inst.loan?.installments || 0,
          amount_due: inst.amount,
          amount_with_late_fees: totalWithLateFees,
          amount_paid: inst.paid_amount || 0,
          due_date: inst.due_date,
          paid_date: inst.paid_date,
          status: inst.status,
          late_fee_applied: inst.late_fee_applied || 0,
          late_interest_applied: inst.late_interest_applied || 0,
          days_in_delay: inst.days_in_delay || 0,
          payment_method: transaction?.payment_method || null,
          notes: transaction?.notes || null,
        }
      })

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
        notes: z.string().min(0).max(150, "Máximo de 150 caracteres"),
        payment_type: z.enum(["full", "interest_only"]).default("full"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { installment_id, amount, payment_date, method, notes, payment_type } = input

      // Busca a parcela
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select(`
          *,
          loan:loans(id, customer_id, tenant_id, amount, total_amount, paid_amount, remaining_amount, installments, paid_installments, status)
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

      // Buscar nome do cliente para notificação
      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("name")
        .eq("id", installment.loan.customer_id)
        .single()

      const customerName = customer?.name || "Cliente"

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
        
        // Calcular dias de atraso com segurança
        const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        if (lateFeeConfig) {
          // Calcular taxa fixa de multa (pode ser percentual ou valor fixo)
          // Assume percentual se fixed_fee <= 100 ou se late_fee_type for 'percent'
          // Assume valor fixo apenas se late_fee_type explicitamente 'fixed'
          const isPercentFee = lateFeeConfig.late_fee_type === 'percent' || 
            lateFeeConfig.late_fee_type === undefined || 
            (lateFeeConfig.fixed_fee || 0) <= 100
          
          if (isPercentFee) {
            lateFee = installment.amount * ((lateFeeConfig.fixed_fee || 0) / 100)
          } else {
            lateFee = lateFeeConfig.fixed_fee || 0
          }
          
          // Calcular juros de mora (pode ser percentual ou valor fixo diário)
          const effectiveDaysOverdue = Math.min(daysOverdue, 30)
          const dailyInterest = lateFeeConfig.daily_interest || 0
          
          if (effectiveDaysOverdue > 0) {
            if (dailyInterest > 1) {
              // Valor fixo por dia (ex: R$15/dia)
              lateInterest = dailyInterest * effectiveDaysOverdue
            } else if (dailyInterest > 0) {
              // Percentual ao dia (ex: 0.5% = 0.005)
              lateInterest = installment.amount * dailyInterest * effectiveDaysOverdue
            }
          }
        }
      }

      // Valor total com juros de mora (se houver)
      const totalWithLateFees = installment.amount + lateFee + lateInterest

      // Para pagamento de juros apenas, calcular valor dos juros da parcela
      let interestOnlyAmount = 0
      if (payment_type === "interest_only") {
        // Buscar configuração de juros do tenant
        const { data: lateFeeConfig } = await ctx.supabase
          .from("late_fee_config")
          .select("*")
          .eq("tenant_id", ctx.tenantId)
          .single()
        
        // Calcular dias até a data de pagamento
        const paymentDate = new Date(payment_date)
        const dueDate = new Date(installment.due_date)
        
        // Buscar próxima parcela para limitar dias
        const { data: nextInstallments } = await ctx.supabase
          .from("loan_installments")
          .select("due_date")
          .eq("loan_id", installment.loan.id)
          .gt("due_date", installment.due_date)
          .order("due_date", { ascending: true })
          .limit(1)
        
        const maxDays = nextInstallments && nextInstallments[0]
          ? Math.floor((new Date(nextInstallments[0].due_date).getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 30 // padrão 30 dias se não houver próxima
        
        // Calcular dias de atraso (limitados ao máximo)
        const daysDiff = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const effectiveDays = Math.max(1, Math.min(daysDiff, maxDays))
        
        // Calcular juros baseado na configuração
        if (lateFeeConfig) {
          // daily_interest pode ser:
          // - Valor fixo (ex: 10 = R$10 por dia)
          // - Percentual (ex: 0.01 = 0.01% ao dia)
          const dailyRate = lateFeeConfig.daily_interest || 0
          
          // Se daily_interest > 1, considera como valor fixo (R$ por dia)
          // Se daily_interest <= 1, considera como percentual
          if (dailyRate > 1) {
            // Valor fixo por dia (ex: R$ 15/dia)
            interestOnlyAmount = dailyRate * effectiveDays
          } else if (dailyRate > 0) {
            // Percentual diário (ex: 0.5% ao dia = 0.005)
            interestOnlyAmount = installment.amount * dailyRate * effectiveDays
          }
        }
        
        // Se não houver configuração, usar valor mínimo de R$ 1
        if (interestOnlyAmount < 1) {
          interestOnlyAmount = 1
        }
        
        // Se pagamento de juros apenas e config habilitada, empurrar parcelas futuras
        const { data: lateFeeConfigForPush } = await ctx.supabase
          .from("late_fee_config")
          .select("push_installments_on_interest_payment")
          .eq("tenant_id", ctx.tenantId)
          .single()
        
        if (lateFeeConfigForPush?.push_installments_on_interest_payment) {
          // Buscar parcelas futuras (não pagas, com vencimento após a data do pagamento)
          const paymentDateStr = payment_date.split('T')[0]
          const { data: futureInstallments } = await ctx.supabase
            .from("loan_installments")
            .select("id, due_date")
            .eq("loan_id", installment.loan_id)
            .gte("due_date", paymentDateStr)
            .neq("status", "paid")
            .order("due_date", { ascending: true })
          
          if (futureInstallments && futureInstallments.length > 0) {
            // Empurrar cada parcela pelos mesmos dias de atraso
            const daysToPush = effectiveDays
            
            for (const inst of futureInstallments) {
              const currentDueDate = new Date(inst.due_date)
              currentDueDate.setDate(currentDueDate.getDate() + daysToPush)
              
              await ctx.supabase
                .from("loan_installments")
                .update({ due_date: currentDueDate.toISOString().split('T')[0] })
                .eq("id", inst.id)
            }
          }
        }
        
        // Don't require minimum amount - allow any payment amount
        // Users might want to do partial payments
      } else {
        // Allow any payment amount - no minimum validation
        // This allows partial payments and corrections
      }

      // Determina status do pagamento (considerando juros de mora)
      let newStatus: string
      
      if (payment_type === "interest_only") {
        // Pagamento de juros apenas mantém como partial
        newStatus = "partial"
      } else {
        const isFullPayment = amount >= totalWithLateFees
        newStatus = isFullPayment ? "paid" : "partial"
      }
      
      const paidAmount = installment.paid_amount || 0
      const newPaidAmount = paidAmount + amount

      // Iniciar transação manual - salvar estado original para rollback
      const originalInstallmentStatus = installment.status
      const originalInstallmentPaidAmount = installment.paid_amount || 0
      const originalInstallmentPaidDate = installment.paid_date
      const originalLoanPaidAmount = installment.loan.paid_amount || 0
      const originalLoanPaidInstallments = installment.loan.paid_installments || 0

      // Fix timezone: store date as YYYY-MM-DD without time to avoid timezone shifts
      // The database stores in local timezone, so just pass the date string
      const paidDateForDB = payment_date.split('T')[0]  // Extract just YYYY-MM-DD
      
      // Atualiza a parcela
      const { error: updateError } = await ctx.supabase
        .from("loan_installments")
        .update({
          status: newStatus,
          paid_amount: newPaidAmount,
          paid_date: paidDateForDB,
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
          payment_method: method,
          amount,
          payment_date: new Date(payment_date).toISOString().split('T')[0],
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
      
      // Para interest_only, não conta como parcela paga
      const isFullPayment = payment_type !== "interest_only" && newStatus === "paid"
      const newPaidInstallments = isFullPayment 
        ? (loan.paid_installments || 0) + 1 
        : loan.paid_installments

      // Determina status do loan
      let newLoanStatus = loan.status
      const wasLoanPaidOff = newLoanStatus !== "paid" && newPaidInstallments >= loan.installments
      if (newPaidInstallments >= loan.installments) {
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
          description: `Pagamento de R$ ${amount.toFixed(2)} ${isFullPayment ? '(quitação)' : ''} - Parcela ${installment.installment_number}/${loan.installments}`,
          metadata: { 
            loan_id: loan.id, 
            installment_id, 
            amount,
            payment_method: method,
            is_full_payment: isFullPayment,
          },
        })
      } catch {
        // Silently ignore if table doesn't exist
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
        // Don't block payment if cash register fails
        console.error("Erro ao registrar transação de caixa:", cashError)
      }

      // Create notification for payment received
      await Notifications.paymentReceived(
        ctx.supabase,
        ctx.tenantId!,
        customerName,
        amount
      )

      // Create notification for loan paid off
      if (wasLoanPaidOff) {
        await Notifications.loanPaidOff(
          ctx.supabase,
          ctx.tenantId!,
          customerName,
          loan.total_amount || 0
        )
      }

      return { 
        success: true, 
        installment_id,
        new_status: newStatus,
        loan_status: newLoanStatus,
      }
    }),

  // Atualiza um pagamento
  update: protectedProcedure
    .input(
      z.object({
        installment_id: z.string(),
        amount: z.number().positive(),
        payment_date: z.string(),
        method: z.enum(["cash", "pix", "boleto", "card", "transfer"]),
        notes: z.string().min(0).max(150, "Máximo de 150 caracteres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { installment_id, amount, payment_date, method, notes } = input

      // Buscar a parcela atual
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select(`
          *,
          loan:loans(id, customer_id, tenant_id, paid_amount, remaining_amount, paid_installments, installments, total_amount, status)
        `)
        .eq("id", installment_id)
        .single()

      if (instError || !installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parcela não encontrada",
        })
      }

      // Validar tenant
      if (installment.loan.tenant_id !== ctx.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        })
      }

      // Buscar transação de pagamento existente
      const { data: existingTransaction, error: transError } = await ctx.supabase
        .from("payment_transactions")
        .select("*")
        .eq("installment_id", installment_id)
        .eq("status", "completed")
        .single()

      if (transError || !existingTransaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transação de pagamento não encontrada",
        })
      }

      // Calcular diferença de valor (usar valor direto, não diferença)
      const newPaidAmount = amount // novo valor em cents
      
      // Validar que não excede o valor da parcela
      if (newPaidAmount > installment.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor não pode exceder R$ ${(installment.amount / 100).toLocaleString('pt-BR')}`,
        })
      }
      
      const newStatus = newPaidAmount >= installment.amount ? "paid" : (newPaidAmount > 0 ? "partial" : "pending")

      // Atualizar transação
      const { error: updateTransError } = await ctx.supabase
        .from("payment_transactions")
        .update({
          amount,
          payment_method: method,
          notes,
        })
        .eq("id", existingTransaction.id)

      if (updateTransError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao atualizar transação: ${updateTransError.message}`,
        })
      }

      // Atualizar parcela (usar valor direto)
      const { error: updateInstError } = await ctx.supabase
        .from("loan_installments")
        .update({
          paid_amount: newPaidAmount,
          paid_date: payment_date,
          status: newStatus,
        })
        .eq("id", installment_id)

      if (updateInstError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao atualizar parcela: ${updateInstError.message}`,
        })
      }

      // Atualizar loan (calcular baseado no novo paid_amount)
      const loan = installment.loan
      const oldPaidAmount = existingTransaction.amount // valor anterior em cents
      
      // Calcular nova diferença
      const newLoanPaidAmount = Math.max(0, (loan.paid_amount || 0) - oldPaidAmount + newPaidAmount)
      const newRemainingAmount = (loan.total_amount || 0) - newLoanPaidAmount
      
      // Contagem de parcelas pagas
      const wasOldPaid = oldPaidAmount >= installment.amount
      const isNewPaid = newStatus === "paid"
      let newPaidInstallments = loan.paid_installments || 0
      if (wasOldPaid && !isNewPaid) newPaidInstallments = Math.max(0, newPaidInstallments - 1)
      if (!wasOldPaid && isNewPaid) newPaidInstallments += 1

      const { error: updateLoanError } = await ctx.supabase
        .from("loans")
        .update({
          paid_amount: newLoanPaidAmount,
          remaining_amount: newRemainingAmount,
          paid_installments: newPaidInstallments,
          status: newRemainingAmount <= 0 ? "paid" : "active",
        })
        .eq("id", loan.id)

      if (updateLoanError) {
        console.error("Erro ao atualizar loan:", updateLoanError)
      }

      return { 
        success: true, 
        installment_id,
        new_status: newStatus,
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
          loan:loans(id, customer_id, tenant_id, paid_amount, remaining_amount, paid_installments, installments, status),
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
      } catch {
        // Silently ignore if table doesn't exist
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayToReceive = (todayResult.data || [])?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const todayCount = (todayResult.data || [])?.reduce((sum: number, loan: any) => {
      return sum + (loan.installments?.length || 0)
    }, 0) || 0
    const monthReceived = (monthResult.data || [])?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overdueAmount = (overdueResult.data || [])?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overdueCount = (overdueResult.data || [])?.reduce((sum: number, loan: any) => {
      return sum + (loan.installments?.length || 0)
    }, 0) || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcomingAmount = (upcomingResult.data || [])?.reduce((sum: number, loan: any) => {
      const installments = loan.installments || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return sum + installments.reduce((s: number, i: any) => s + Number(i.amount || 0), 0)
    }, 0) || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcomingCount = (upcomingResult.data || [])?.reduce((sum: number, loan: any) => {
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
