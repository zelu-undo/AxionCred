import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const loanRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        customerId: z.string().optional(),
        status: z.enum(["pending", "active", "paid", "cancelled", "renegotiated"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { customerId, status, search, limit, offset } = input

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

      if (search) {
        // Search by customer name (requires join via text search)
        query = query.or(`customer.name.ilike.%${search}%`)
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
        installments_count: z.number().positive().max(48),
        first_due_date: z.string(),
        notes: z.string().optional(),
        monthly_income: z.number().optional(),
        override_reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { customer_id, principal_amount, installments_count, first_due_date, notes, monthly_income, override_reason } = input

      // Get customer document
      const { data: customer, error: customerError } = await ctx.supabase
        .from("customers")
        .select("document, name")
        .eq("id", customer_id)
        .single()

      if (customerError || !customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        })
      }

      // ============================================
      // VALIDAÇÃO DE CRÉDITO
      // ============================================
      const document = customer.document?.replace(/\D/g, "") || ""
      
      if (document) {
        // Buscar configurações de crédito
        const { data: settings } = await ctx.supabase
          .from("credit_settings")
          .select("*")
          .eq("tenant_id", ctx.tenantId)
          .single()

        // Se houver configurações, fazer validação
        if (settings) {
          // Calcular caixa
          const { data: payments } = await ctx.supabase
            .from("payment_transactions")
            .select("amount")
            .eq("tenant_id", ctx.tenantId)
            .eq("status", "completed")

          const { data: loans } = await ctx.supabase
            .from("loans")
            .select("amount, status, customer_document")
            .eq("tenant_id", ctx.tenantId)
            .in("status", ["active", "overdue", "paid"])

          const totalReceived = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
          const totalDisbursed = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0

          const grossCash = totalReceived - totalDisbursed
          const availableCash = Math.max(0, grossCash)
          const usableCash = availableCash * ((settings.max_box_percentage || 80) / 100)

          // Buscar score do cliente
          const { data: scoreData } = await ctx.supabase.rpc("calculate_credit_score", {
            p_tenant_id: ctx.tenantId,
            p_customer_document: document,
          })

          const score = Array.isArray(scoreData) ? scoreData[0] : null
          const finalScore = score?.final_score || 500

          // Calcular limite do cliente
          const { data: limitData } = await ctx.supabase.rpc("calculate_client_credit_limit", {
            p_tenant_id: ctx.tenantId,
            p_customer_document: document,
            p_monthly_income: monthly_income || 0,
          })

          const clientLimit = Array.isArray(limitData) ? limitData[0] || 5000 : 5000
          const clientUsed = loans?.filter(l => l.customer_document === document).reduce((sum, l) => sum + (l.amount || 0), 0) || 0

          // Contar empréstimos ativos
          const activeLoansCount = loans?.filter(l => l.customer_document === document && ["active", "overdue"].includes(l.status)).length || 0

          // Verificações
          const boxCheck = principal_amount <= usableCash
          const clientLimitCheck = (clientUsed + principal_amount) <= clientLimit
          const scoreCheck = finalScore >= (settings.min_score_for_approval || 500)
          const maxLoansCheck = activeLoansCount < (settings.max_active_loans_per_customer || 5)

          let isBlocked = false
          let blockReason = ""
          let isWarning = false
          let warningMessage = ""

          // Verificar caixa
          if (!boxCheck) {
            if (settings.block_on_box_limit) {
              isBlocked = true
              blockReason = "Caixa insuficiente para este empréstimo"
            } else {
              isWarning = true
              warningMessage = "Valor excede caixa utilizável disponível"
            }
          }

          // Verificar limite do cliente
          if (!clientLimitCheck && settings.client_limit_mandatory && !isBlocked) {
            isBlocked = true
            blockReason = "Valor excede limite do cliente"
          } else if (!clientLimitCheck && !isBlocked) {
            isWarning = true
            warningMessage = isWarning ? isWarning + ", " + "Valor excede limite recomendado do cliente" : "Valor excede limite recomendado do cliente"
          }

          // Verificar score
          if (!scoreCheck && settings.block_on_low_score && !isBlocked) {
            isBlocked = true
            blockReason = "Score do cliente abaixo do mínimo configurado"
          } else if (!scoreCheck && !isBlocked) {
            isWarning = true
            warningMessage = isWarning ? isWarning + ", " + "Score do cliente abaixo do mínimo" : "Score do cliente abaixo do mínimo"
          }

          // Verificar número de empréstimos
          if (!maxLoansCheck && !isBlocked) {
            isBlocked = true
            blockReason = "Cliente atingiu número máximo de empréstimos ativos"
          }

          // Se não tem override_reason mas está bloqueado, rejeitar
          if (isBlocked && !override_reason) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: blockReason,
            })
          }

          // Se tem override_reason, registrar auditoria com override
          if (override_reason) {
            await ctx.supabase.from("credit_audit_log").insert({
              tenant_id: ctx.tenantId,
              customer_document: document,
              customer_name: customer.name,
              loan_id: null, // ainda não criado
              decision_type: "manual_override",
              decision_result: "approved",
              box_available: availableCash,
              box_utilizable: usableCash,
              requested_amount: principal_amount,
              client_limit: clientLimit,
              client_limit_used: clientUsed,
              customer_score: finalScore,
              customer_risk_level: score?.risk_level || "medium",
              active_loans_count: activeLoansCount,
              box_limit_check: boxCheck,
              client_limit_check: clientLimitCheck,
              score_check: scoreCheck,
              max_loans_check: maxLoansCheck,
              override_by: ctx.userId || "unknown",
              override_reason: override_reason,
            })
          } else {
            // Registrar aprovação normal
            await ctx.supabase.from("credit_audit_log").insert({
              tenant_id: ctx.tenantId,
              customer_document: document,
              customer_name: customer.name,
              loan_id: null,
              decision_type: isWarning ? "auto_approve_with_warning" : "auto_approve",
              decision_result: "approved",
              box_available: availableCash,
              box_utilizable: usableCash,
              requested_amount: principal_amount,
              client_limit: clientLimit,
              client_limit_used: clientUsed,
              customer_score: finalScore,
              customer_risk_level: score?.risk_level || "medium",
              active_loans_count: activeLoansCount,
              box_limit_check: boxCheck,
              client_limit_check: clientLimitCheck,
              score_check: scoreCheck,
              max_loans_check: maxLoansCheck,
            })
          }
        }
      }

      // Get interest rule automatically from business rules (mandatory)
      const { data: rule, error: ruleError } = await ctx.supabase
        .rpc("get_applicable_interest_rule", {
          p_tenant_id: ctx.tenantId,
          p_installments: installments_count,
        })

      if (ruleError || !rule || rule.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhuma regra de juros configurada para esta quantidade de parcelas. Configure as regras de juros primeiro.",
        })
      }

      const appliedRule = rule[0]
      const interest_rate = appliedRule.interest_rate
      const interest_type = appliedRule.interest_type

      // Get loan config for validation
      const { data: loanConfig } = await ctx.supabase
        .from("loan_config")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .single()

      // Validate amounts
      if (loanConfig) {
        if (principal_amount < loanConfig.min_amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Valor mínimo do empréstimo é R$ ${loanConfig.min_amount}`,
          })
        }
        if (principal_amount > loanConfig.max_amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Valor máximo do empréstimo é R$ ${loanConfig.max_amount}`,
          })
        }
        if (installments_count < loanConfig.min_installments) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mínimo de ${loanConfig.min_installments} parcelas`,
          })
        }
        if (installments_count > loanConfig.max_installments) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Máximo de ${loanConfig.max_installments} parcelas`,
          })
        }
      }

      // Calculate total amount with interest based on interest_type
      let total_amount: number
      let total_interest: number

      if (interest_rate === 0 || interest_type === "fixed") {
        // Fixed: taxa fixa aplicada sobre o valor total no ato
        // Para fixed, a taxa é aplicada uma única vez sobre o principal
        if (interest_type === "fixed") {
          total_interest = principal_amount * (interest_rate / 100)
          total_amount = principal_amount + total_interest
        } else {
          // Sem juros
          total_amount = principal_amount
        }
      } else if (interest_type === "weekly") {
        // Juros semanal (sistema Price com taxa semanal)
        const weeklyRate = interest_rate / 100 / 4.33 // ~52 semanas/ano
        const totalWeeks = installments_count * 4
        const factor = Math.pow(1 + weeklyRate, totalWeeks)
        total_amount = (principal_amount * weeklyRate * factor) / (factor - 1)
      } else {
        // monthly: sistema Price com taxa mensal
        const monthlyRate = interest_rate / 100
        const factor = Math.pow(1 + monthlyRate, installments_count)
        total_amount = (principal_amount * monthlyRate * factor) / (factor - 1)
      }

      // Arredondar valores para 2 casas decimais para evitar problemas de precisão
      total_amount = Math.round(total_amount * 100) / 100
      total_interest = Math.round((total_amount - principal_amount) * 100) / 100
      const installment_amount = Math.round((total_amount / installments_count) * 100) / 100

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
        description: `Empréstimo de R$ ${total_amount.toFixed(2)} criado com ${installments_count}x de R$ ${installment_amount.toFixed(2)}`,
        metadata: { loan_id: loan.id, amount: total_amount, interest_rate, interest_type },
      })

      // Create loan rule snapshot for contract immutability
      // This ensures the original rules remain unchanged even if business rules are updated
      await ctx.supabase.from("loan_rule_snapshots").insert({
        loan_id: loan.id,
        rule_id: appliedRule.id,
        principal_amount,
        interest_rate,
        interest_type,
        installments_count,
        total_amount,
        late_fee_percentage: appliedRule.late_fee_percentage,
        late_interest_type: appliedRule.late_interest_type,
        late_interest_percentage: appliedRule.late_interest_percentage,
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

      // Get installment with loan details
      const { data: installment, error: instError } = await ctx.supabase
        .from("loan_installments")
        .select("*, loan:loans(id, customer_id, tenant_id, principal_amount, total_amount, paid_amount, remaining_amount, installments_count, paid_installments, status)")
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

      // Verificar se parcela já está quitada
      if (installment.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta parcela já foi quitada",
        })
      }

      // Calcular juros de mora se parcela atrasada
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

      // Validate minimum amount (80% of installment + late fees)
      const minAmount = totalWithLateFees * 0.8
      if (amount < minAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Valor mínimo para pagamento é R$ ${minAmount.toFixed(2)}` +
            (isOverdue ? ` (inclui R$ ${(lateFee + lateInterest).toFixed(2)} de juros de mora)` : ""),
        })
      }

      const loan = installment.loan
      // Considerando juros de mora para quitação
      const isFullPayment = amount >= totalWithLateFees
      const newStatus = isFullPayment ? "paid" : "partial"
      const paidAmount = installment.paid_amount || 0
      const newPaidAmount = paidAmount + amount

      // Update installment
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

      // Create payment transaction
      await ctx.supabase.from("payment_transactions").insert({
        tenant_id: ctx.tenantId,
        loan_id: installment.loan_id,
        installment_id,
        method,
        amount,
        status: "completed",
      })

      // Update loan totals
      const newLoanPaidAmount = (loan.paid_amount || 0) + amount
      const newRemainingAmount = (loan.total_amount || 0) - newLoanPaidAmount
      const newPaidInstallments = isFullPayment 
        ? (loan.paid_installments || 0) + 1 
        : loan.paid_installments

      // Determine new loan status
      let newLoanStatus = loan.status
      if (newPaidInstallments >= loan.installments_count) {
        newLoanStatus = "paid"
      } else if (newPaidInstallments > 0) {
        newLoanStatus = "active"
      }

      // Update loan
      await ctx.supabase
        .from("loans")
        .update({
          paid_amount: newLoanPaidAmount,
          remaining_amount: Math.max(0, newRemainingAmount),
          paid_installments: newPaidInstallments,
          status: newLoanStatus,
        })
        .eq("id", loan.id)

      // Log event
      await ctx.supabase.from("customer_events").insert({
        customer_id: loan.customer_id,
        type: "payment_received",
        description: `Pagamento de R$ ${amount.toFixed(2)} ${isFullPayment ? '(quitação)' : ''} - Parcela ${installment.installment_number}/${loan.installments_count}`,
        metadata: { 
          loan_id: loan.id, 
          installment_id, 
          amount,
          is_full_payment: isFullPayment,
        },
      })

      return { 
        success: true,
        installment_status: newStatus,
        loan_status: newLoanStatus,
      }
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
    const today = new Date().toISOString().split("T")[0]
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startOfMonthStr = startOfMonth.toISOString()

    // Usar RPC para agregar dados em uma única query quando possível
    // Para máxima compatibilidade, fazer queries paralelas
    const [
      customerCountResult,
      activeLoansResult,
      loansSumResult,
      paymentsSumResult,
      overdueSumResult
    ] = await Promise.all([
      // Total customers
      ctx.supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId!),
      
      // Active loans count
      ctx.supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId!)
        .eq("status", "active"),
      
      // Total to receive (pending + active loans) - apenas selecting column para performance
      ctx.supabase
        .from("loans")
        .select("remaining_amount")
        .eq("tenant_id", ctx.tenantId!)
        .in("status", ["pending", "active"]),
      
      // Total received this month
      ctx.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId!)
        .eq("status", "completed")
        .gte("created_at", startOfMonthStr),
      
      // Overdue installments (pending ou late com vencimento < hoje)
      ctx.supabase
        .from("loan_installments")
        .select("amount")
        .lt("due_date", today)
        .in("status", ["pending", "late"])
    ])

    const totalCustomers = customerCountResult.count || 0
    const activeLoans = activeLoansResult.count || 0
    const totalToReceive = loansSumResult.data?.reduce((sum, l) => sum + Number(l.remaining_amount), 0) || 0
    const totalReceived = paymentsSumResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const overdueAmount = overdueSumResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const overdueCount = overdueSumResult.data?.length || 0

    return {
      total_customers: totalCustomers,
      active_loans: activeLoans,
      total_to_receive: totalToReceive,
      total_received: totalReceived,
      overdue_amount: overdueAmount,
      overdue_count: overdueCount,
    }
  }),
})
