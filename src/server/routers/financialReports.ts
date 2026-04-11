import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Financial Reports Router
export const financialReportsRouter = router({
  // Dashboard de fluxo de caixa
  cashFlowDashboard: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { startDate, endDate } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar receitas (pagamentos recebidos)
      const { data: payments, error: paymentsError } = await ctx.supabase
        .from("payment_transactions")
        .select("amount, payment_date, payment_method, loan_id")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)

      if (paymentsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar receitas",
        })
      }

      // Calcular total de receitas
      const totalRevenue = (payments || []).reduce(
        (sum, p) => sum + parseFloat(p.amount || 0),
        0
      )

      // Buscar despesas (empréstimos liberados = capital emprestado)
      const { data: loansDisbursed, error: loansError } = await ctx.supabase
        .from("loans")
        .select("amount, created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .gte("created_at", startDate)
        .lte("created_at", endDate)

      if (loansError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar despesas",
        })
      }

      const totalDisbursed = (loansDisbursed || []).reduce(
        (sum, l) => sum + parseFloat(l.amount || 0),
        0
      )

      // Calcular lucro (receita - despesas)
      const profit = totalRevenue - totalDisbursed

      return {
        totalRevenue,
        totalDisbursed,
        profit,
        profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
        transactionCount: payments?.length || 0,
        period: { startDate, endDate },
      }
    }),

  // Projeção de fluxo de caixa
  cashFlowProjection: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx

    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant não encontrado",
      })
    }

    // Buscar parcelas futuras (próximos 30/60/90 dias)
    const today = new Date()
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const next60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
    const next90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Parcelas próximos 30 dias
    const { data: next30 } = await ctx.supabase
      .from("loan_installments")
      .select("amount, due_date, status")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("due_date", today.toISOString().split("T")[0])
      .lte("due_date", next30Days.toISOString().split("T")[0])

    // Parcelas próximos 60 dias
    const { data: next60 } = await ctx.supabase
      .from("loan_installments")
      .select("amount, due_date, status")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("due_date", next30Days.toISOString().split("T")[0])
      .lte("due_date", next60Days.toISOString().split("T")[0])

    // Parcelas próximos 90 dias
    const { data: next90 } = await ctx.supabase
      .from("loan_installments")
      .select("amount, due_date, status")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .gte("due_date", next60Days.toISOString().split("T")[0])
      .lte("due_date", next90Days.toISOString().split("T")[0])

    const project30 = (next30 || []).reduce((sum, i) => sum + parseFloat(i.amount), 0)
    const project60 = (next60 || []).reduce((sum, i) => sum + parseFloat(i.amount), 0)
    const project90 = (next90 || []).reduce((sum, i) => sum + parseFloat(i.amount), 0)

    return {
      projection: {
        "30_days": project30,
        "60_days": project30 + project60,
        "90_days": project30 + project60 + project90,
      },
      installments: {
        next30: next30?.length || 0,
        next60: next60?.length || 0,
        next90: next90?.length || 0,
      },
    }
  }),

  // Relatório de inadimplência
  defaultRateReport: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        groupBy: z.enum(["month", "year"]).optional().default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { startDate, endDate, groupBy } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar total de parcelas no período
      const { data: allInstallments } = await ctx.supabase
        .from("loan_installments")
        .select("id, status, due_date, amount")
        .eq("tenant_id", tenantId)
        .gte("due_date", startDate)
        .lte("due_date", endDate)

      // Buscar parcelas atrasadas (status = late)
      const { data: lateInstallments } = await ctx.supabase
        .from("loan_installments")
        .select("id, status, due_date, amount")
        .eq("tenant_id", tenantId)
        .eq("status", "late")
        .gte("due_date", startDate)
        .lte("due_date", endDate)

      const total = allInstallments?.length || 0
      const late = lateInstallments?.length || 0
      const defaultRate = total > 0 ? (late / total) * 100 : 0

      // Calcular valor em atraso
      const lateAmount = (lateInstallments || []).reduce(
        (sum, i) => sum + parseFloat(i.amount),
        0
      )

      // Calcular valor total das parcelas
      const totalAmount = (allInstallments || []).reduce(
        (sum, i) => sum + parseFloat(i.amount),
        0
      )

      return {
        defaultRate: Math.round(defaultRate * 100) / 100,
        totalInstallments: total,
        lateInstallments: late,
        paidInstallments: total - late,
        lateAmount,
        totalAmount,
        percentageLate: Math.round((lateAmount / (totalAmount || 1)) * 100 * 100) / 100,
        period: { startDate, endDate, groupBy },
      }
    }),

  // Performance da equipe de cobrança
  collectionPerformance: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { startDate, endDate, userId } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar pagamentos no período
      let query = ctx.supabase
        .from("payment_transactions")
        .select("id, amount, payment_date, created_by, status")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("payment_date", startDate)
        .lte("payment_date", endDate)

      if (userId) {
        query = query.eq("created_by", userId)
      }

      const { data: payments, error } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar pagamentos",
        })
      }

      // Agrupar por usuário
      const userStats: Record<
        string,
        { count: number; total: number; lastPayment?: string }
      > = {}

      payments?.forEach((p) => {
        const userIdKey = p.created_by || "unknown"
        if (!userStats[userIdKey]) {
          userStats[userIdKey] = { count: 0, total: 0 }
        }
        userStats[userIdKey].count++
        userStats[userIdKey].total += parseFloat(p.amount)
      })

      // Buscar nomes dos usuários
      const userIds = Object.keys(userStats)
      const { data: users } = await ctx.supabase
        .from("users")
        .select("id, name")
        .in("id", userIds)

      const userMap: Record<string, string> = {}
      users?.forEach((u) => {
        userMap[u.id] = u.name
      })

      const performance = Object.entries(userStats).map(([id, stats]) => ({
        userId: id,
        userName: userMap[id] || "Desconhecido",
        collectionsCount: stats.count,
        totalCollected: Math.round(stats.total * 100) / 100,
        averagePerCollection:
          stats.count > 0
            ? Math.round((stats.total / stats.count) * 100) / 100
            : 0,
      }))

      // Totais gerais
      const totalCollected = (payments || []).reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      )

      return {
        performance,
        summary: {
          totalCollected: Math.round(totalCollected * 100) / 100,
          totalCollections: payments?.length || 0,
          averageCollection:
            payments?.length > 0
              ? Math.round((totalCollected / payments.length) * 100) / 100
              : 0,
        },
        period: { startDate, endDate },
      }
    }),

  // Resumo financeiro geral
  financialSummary: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx

    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant não encontrado",
      })
    }

    // Total de clientes ativos
    const { count: activeCustomers } = await ctx.supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active")

    // Total de empréstimos ativos
    const { data: activeLoans } = await ctx.supabase
      .from("loans")
      .select("id, total_amount, remaining_amount, paid_amount")
      .eq("tenant_id", tenantId)
      .eq("status", "active")

    const totalLoans = activeLoans?.length || 0
    const totalReceivable = (activeLoans || []).reduce(
      (sum, l) => sum + parseFloat(l.remaining_amount),
      0
    )
    const totalReceived = (activeLoans || []).reduce(
      (sum, l) => sum + parseFloat(l.paid_amount),
      0
    )

    // Parcelas atrasadas
    const { data: lateInstallments } = await ctx.supabase
      .from("loan_installments")
      .select("amount, status")
      .eq("tenant_id", tenantId)
      .eq("status", "late")

    const lateAmount = (lateInstallments || []).reduce(
      (sum, i) => sum + parseFloat(i.amount),
      0
    )

    return {
      customers: {
        active: activeCustomers || 0,
      },
      loans: {
        active: totalLoans,
        totalReceivable: Math.round(totalReceivable * 100) / 100,
        totalReceived: Math.round(totalReceived * 100) / 100,
        outstanding: Math.round((totalReceivable - totalReceived) * 100) / 100,
      },
      collections: {
        lateCount: lateInstallments?.length || 0,
        lateAmount: Math.round(lateAmount * 100) / 100,
        defaultRate:
          totalLoans > 0
            ? Math.round((lateInstallments?.length || 0) / totalLoans * 100 * 100) /
              100
            : 0,
      },
    }
  }),

  // Gráfico de evolução (para charts)
  evolutionChart: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).optional().default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { months } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const data = []
      const now = new Date()

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = date.toISOString().split("T")[0]
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
        const lastDayOfMonth = new Date(nextMonth.getTime() - 1)
        const monthEnd = lastDayOfMonth.toISOString().split("T")[0]

        // Receitas do mês
        const { data: payments } = await ctx.supabase
          .from("payment_transactions")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("payment_date", monthStart)
          .lte("payment_date", monthEnd)

        // Novas receitas do mês
        const { data: newLoans } = await ctx.supabase
          .from("loans")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("status", "active")
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd)

        const revenue = (payments || []).reduce(
          (sum, p) => sum + parseFloat(p.amount),
          0
        )
        const disbursed = (newLoans || []).reduce(
          (sum, l) => sum + parseFloat(l.amount),
          0
        )

        data.push({
          month: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          revenue: Math.round(revenue * 100) / 100,
          disbursed: Math.round(disbursed * 100) / 100,
          profit: Math.round((revenue - disbursed) * 100) / 100,
        })
      }

      return { chartData: data }
    }),
})