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
        installments_count: z.number().positive().max(48),
        first_due_date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { customer_id, principal_amount, installments_count, first_due_date, notes } = input

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

      total_interest = total_amount - principal_amount
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

  recentLoans: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("loans")
      .select(`
        id,
        principal_amount,
        total_amount,
        installments_count,
        paid_installments,
        status,
        created_at,
        customer:customers(name)
      `)
      .eq("tenant_id", ctx.tenantId!)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    return data || []
  }),

  overdueCustomers: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0]

    // Get installments that are overdue
    const { data: installments, error } = await ctx.supabase
      .from("loan_installments")
      .select(`
        id,
        amount,
        due_date,
        status,
        loan:loans(
          id,
          customer_id,
          customer:customers(name)
        )
      `)
      .eq("status", "late")
      .lt("due_date", today)
      .limit(50)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    // Group by customer
    const customerMap = new Map()
    for (const inst of installments || []) {
      const customerId = inst.loan?.customer_id
      if (!customerId) continue

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer_id: customerId,
          customer_name: inst.loan?.customer?.name || "Unknown",
          overdue_amount: 0,
          overdue_count: 0,
        })
      }
      const customer = customerMap.get(customerId)
      customer.overdue_amount += Number(inst.amount)
      customer.overdue_count += 1
    }

    // Return top 5 overdue customers
    return Array.from(customerMap.values())
      .sort((a, b) => b.overdue_amount - a.overdue_amount)
      .slice(0, 5)
  }),

  loanStatusDistribution: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("loans")
      .select("status")
      .eq("tenant_id", ctx.tenantId!)

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    const distribution = {
      pending: 0,
      active: 0,
      paid: 0,
      cancelled: 0,
      renegotiated: 0,
    }

    for (const loan of data || []) {
      if (loan.status in distribution) {
        distribution[loan.status as keyof typeof distribution]++
      }
    }

    return distribution
  }),

  monthlyRevenue: protectedProcedure.query(async ({ ctx }) => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const { data, error } = await ctx.supabase
      .from("payment_transactions")
      .select("amount, created_at")
      .eq("tenant_id", ctx.tenantId!)
      .eq("status", "completed")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      months.push(key)
      monthlyRevenue[key] = 0
    }

    for (const payment of data || []) {
      const date = new Date(payment.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += Number(payment.amount)
      }
    }

    return months.map((month) => ({
      month,
      revenue: monthlyRevenue[month],
    }))
  }),

  monthlyNewData: protectedProcedure.query(async ({ ctx }) => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    // Get new customers per month
    const { data: customers, error: customerError } = await ctx.supabase
      .from("customers")
      .select("created_at")
      .eq("tenant_id", ctx.tenantId!)
      .gte("created_at", sixMonthsAgo.toISOString())

    if (customerError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: customerError.message,
      })
    }

    // Get new loans per month
    const { data: loans, error: loanError } = await ctx.supabase
      .from("loans")
      .select("created_at")
      .eq("tenant_id", ctx.tenantId!)
      .gte("created_at", sixMonthsAgo.toISOString())

    if (loanError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: loanError.message,
      })
    }

    // Generate last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      months.push({
        month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        customers: 0,
        loans: 0,
      })
    }

    // Count customers by month
    for (const c of customers || []) {
      const date = new Date(c.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthData = months.find((m) => m.month === key)
      if (monthData) monthData.customers++
    }

    // Count loans by month
    for (const l of loans || []) {
      const date = new Date(l.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthData = months.find((m) => m.month === key)
      if (monthData) monthData.loans++
    }

    return months
  }),
})
