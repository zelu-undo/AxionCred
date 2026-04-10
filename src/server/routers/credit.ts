import { z } from "zod"
import { router, protectedProcedure, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const creditRouter = router({
  // 1. Obter configurações de crédito do tenant
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("credit_settings")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    return data
  }),

  // 2. Atualizar configurações de crédito
  updateSettings: protectedProcedure
    .input(
      z.object({
        max_box_percentage: z.number().min(1).max(100).optional(),
        block_on_box_limit: z.boolean().optional(),
        min_score_for_approval: z.number().min(0).max(1000).optional(),
        below_score_action: z.enum(["deny", "warn"]).optional(),
        block_on_low_score: z.boolean().optional(),
        // Pesos do score (cada owner configura)
        score_payment_weight: z.number().min(0).max(100).optional(),
        score_time_weight: z.number().min(0).max(100).optional(),
        score_default_weight: z.number().min(0).max(100).optional(),
        score_usage_weight: z.number().min(0).max(100).optional(),
        score_stability_weight: z.number().min(0).max(100).optional(),
        max_box_percentage_per_client: z.number().min(1).max(100).optional(),
        client_limit_mandatory: z.boolean().optional(),
        max_active_loans_per_customer: z.number().min(1).max(20).optional(),
        allow_refinancing: z.boolean().optional(),
        refinancing_strategy: z.enum(["pay_off", "add_balance"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("credit_settings")
        .upsert({
          tenant_id: ctx.tenantId,
          ...input,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id'
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data
    }),

  // 3. Obter caixa do tenant
  getCashFlow: protectedProcedure.query(async ({ ctx }) => {
    // Calcular caixa em tempo real usando cash_transactions
    const { data: cashIn } = await ctx.supabase
      .from("cash_transactions")
      .select("amount")
      .eq("tenant_id", ctx.tenantId)
      .eq("type", "in")
      .eq("status", "completed")

    const { data: cashOut } = await ctx.supabase
      .from("cash_transactions")
      .select("amount")
      .eq("tenant_id", ctx.tenantId)
      .eq("type", "out")
      .eq("status", "completed")

    const totalIn = cashIn?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const totalOut = cashOut?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

    const availableCash = totalIn - totalOut

    // Buscar configuração de %
    const { data: settings } = await ctx.supabase
      .from("credit_settings")
      .select("max_box_percentage")
      .eq("tenant_id", ctx.tenantId)
      .single()

    const maxPercentage = settings?.max_box_percentage || 80
    const usableCash = availableCash * (maxPercentage / 100)

    return {
      total_received: totalIn,
      total_disbursed: totalOut,
      gross_cash: availableCash,
      available_cash: availableCash,
      usable_cash: usableCash,
    }
  }),

  // 4. Obter score do cliente
  getCustomerScore: protectedProcedure
    .input(z.object({ document: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = input.document.replace(/\D/g, "")

      // Buscar cliente pelo documento
      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("id, created_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("document", document)
        .single()

      if (!customer) {
        return null
      }

      // Buscar dados do cliente
      const { data: loans } = await ctx.supabase
        .from("loans")
        .select("status, installments, created_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("customer_id", customer.id)

      // Calcular subscores
      const totalParcelas = loans?.reduce((sum, l) => sum + (l.installments || 0), 0) || 0
      const parcelasPagas = loans?.filter(l => l.status === "paid").reduce((sum, l) => sum + (l.installments || 0), 0) || 0
      const parcelasAtrasadas = loans?.filter(l => l.status === "late").length || 0
      const mesesCadastro = customer ? Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0
      const inadimplencias = loans?.filter(l => l.status === "late").length || 0  // Inadimplente = loan com status "late"
      const emprestimosAtivos = loans?.filter(l => ["active", "late"].includes(l.status)).length || 0
      const emprestimos30d = loans?.filter(l => {
        const created = new Date(l.created_at)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return created >= thirtyDaysAgo
      }).length || 0

      // 1. Score de Pagamento (peso 30%)
      let paymentScore = 500
      if (totalParcelas > 0) {
        paymentScore = Math.min(1000, Math.max(0,
          (parcelasPagas / totalParcelas * 1000) -
          (parcelasAtrasadas / totalParcelas * 300)
        ))
      }

      // 2. Score de Tempo (peso 25%)
      const timeScore = Math.min(1000, (mesesCadastro / 24 * 1000))

      // 3. Score de Inadimplência (peso 20%)
      const defaultScore = Math.max(0, 1000 - (inadimplencias * 250))

      // 4. Score de Uso de Crédito (peso 15%)
      let creditUsageScore = 1000
      if (emprestimosAtivos > 3) creditUsageScore -= (emprestimosAtivos - 3) * 100
      if (emprestimos30d > 3) creditUsageScore -= (emprestimos30d - 3) * 150
      creditUsageScore = Math.max(0, creditUsageScore)

      // 5. Score de Estabilidade (peso 10%)
      let stabilityScore = 500
      if (totalParcelas > 0) {
        stabilityScore = Math.max(0, 1000 - (
          Math.abs(parcelasPagas - parcelasAtrasadas) / totalParcelas * 500
        ))
      }

      // Score Final
      const finalScore = Math.round(
        (0.30 * paymentScore) +
        (0.25 * timeScore) +
        (0.20 * defaultScore) +
        (0.15 * creditUsageScore) +
        (0.10 * stabilityScore)
      )

      // Classificação de Risco
      let riskLevel = "medium"
      let riskFactor = 0.70
      if (finalScore >= 801) {
        riskLevel = "low"
        riskFactor = Math.min(1.0, 0.90 + (finalScore - 801) / 200)
      } else if (finalScore >= 601) {
        riskLevel = "medium"
        riskFactor = 0.70 + (finalScore - 601) / 200
      } else if (finalScore >= 301) {
        riskLevel = "high"
        riskFactor = 0.40 + (finalScore - 301) / 300
      } else {
        riskLevel = "very_high"
        riskFactor = Math.max(0.20, finalScore / 300 * 0.20)
      }

      return {
        final_score: finalScore,
        risk_level: riskLevel,
        risk_factor: Math.round(riskFactor * 100) / 100,
        payment_score: Math.round(paymentScore),
        time_score: Math.round(timeScore),
        default_score: Math.round(defaultScore),
        credit_usage_score: Math.round(creditUsageScore),
        stability_score: Math.round(stabilityScore),
        total_loans: loans?.length || 0,
        active_loans: emprestimosAtivos,
        months_as_customer: mesesCadastro,
      }
    }),

  // 5. Calcular limite do cliente
  getClientLimit: protectedProcedure
    .input(
      z.object({
        document: z.string(),
        monthly_income: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const document = input.document.replace(/\D/g, "")
      const monthlyIncome = input.monthly_income || 0

      // Buscar score
      const scoreResult = await ctx.supabase.rpc("calculate_credit_score", {
        p_tenant_id: ctx.tenantId,
        p_customer_document: document,
      })

      const scoreData = Array.isArray(scoreResult.data) ? scoreResult.data[0] : null
      const riskFactor = scoreData?.risk_factor || 0.70

      // Buscar configurações
      const { data: settings } = await ctx.supabase
        .from("credit_settings")
        .select("max_box_percentage_per_client")
        .eq("tenant_id", ctx.tenantId)
        .single()

      // Buscar caixa
      const cashFlow = await ctx.supabase.rpc("calculate_tenant_credit_cash", {
        p_tenant_id: ctx.tenantId,
      })
      const cashData = Array.isArray(cashFlow.data) ? cashFlow.data[0] : null
      const usableCash = cashData?.usable_cash || 0

      // Buscar uso atual
      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", ctx.tenantId)
        .eq("document", document)
        .single()

      const { data: loans } = customer ? await ctx.supabase
        .from("loans")
        .select("amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("customer_id", customer.id)
        .in("status", ["active", "overdue"])
      : { data: null }

      const currentUsed = loans?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0

      // Calcular limite
      const incomePercentage = 30 // 30% da renda
      const maxLimit = usableCash * ((settings?.max_box_percentage_per_client || 20) / 100)
      const limit = Math.min(monthlyIncome * incomePercentage / 100 * riskFactor, maxLimit)
      const finalLimit = Math.max(100, Math.round(limit))

      return {
        calculated_limit: finalLimit,
        current_used: currentUsed,
        available: Math.max(0, finalLimit - currentUsed),
        risk_factor: riskFactor,
      }
    }),

  // 6. Validar solicitação de empréstimo
  validateLoanRequest: protectedProcedure
    .input(
      z.object({
        customer_document: z.string(),
        amount: z.number().positive(),
        monthly_income: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = input.customer_document.replace(/\D/g, "")
      const amount = input.amount
      const monthlyIncome = input.monthly_income || 0

      // Buscar configurações
      const { data: settings } = await ctx.supabase
        .from("credit_settings")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .single()

      // Calcular caixa usando cash_transactions (sistema de gestão de caixa)
      const { data: cashIn } = await ctx.supabase
        .from("cash_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("type", "in")
        .eq("status", "completed")

      const { data: cashOut } = await ctx.supabase
        .from("cash_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("type", "out")
        .eq("status", "completed")

      const totalIn = cashIn?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalOut = cashOut?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const availableCash = totalIn - totalOut
      const usableCash = availableCash * ((settings?.max_box_percentage || 80) / 100)

      // Buscar loans do cliente para calcular limite - usando JOIN com customers
      const { data: loansWithCustomer } = await ctx.supabase
        .from("loans")
        .select(`
          amount,
          status,
          customer:customers!inner(document)
        `)
        .eq("tenant_id", ctx.tenantId)
        .in("status", ["active", "overdue"])

      // Filtrar loans pelo documento do cliente (normalizado)
      const clientUsed = loansWithCustomer?.reduce((sum: number, loan: any) => {
        const loanDoc = loan.customer?.document || ""
        const normalizedLoanDoc = loanDoc.replace ? loanDoc.replace(/\D/g, "") : ""
        if (normalizedLoanDoc === document) {
          return sum + (loan.amount || 0)
        }
        return sum
      }, 0) || 0

      // Contar empréstimos ativos
      const activeLoansCount = loansWithCustomer?.reduce((count: number, loan: any) => {
        const loanDoc = loan.customer?.document || ""
        const normalizedLoanDoc = loanDoc.replace ? loanDoc.replace(/\D/g, "") : ""
        if (normalizedLoanDoc === document) {
          return count + 1
        }
        return count
      }, 0) || 0

      // Buscar score
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
        p_monthly_income: monthlyIncome,
      })

      const clientLimit = Array.isArray(limitData) ? limitData[0] || 5000 : 5000

      // Verificações
      const boxCheck = amount <= usableCash
      const clientLimitCheck = (clientUsed + amount) <= clientLimit
      const scoreCheck = finalScore >= (settings?.min_score_for_approval || 500)
      const maxLoansCheck = activeLoansCount < (settings?.max_active_loans_per_customer || 5)

      // Decisão - caixa não bloqueia mais, apenas avisos
      let isValid = true
      let canOverride = true
      let message = "OK"
      const warnings: string[] = []

      // Caixa - apenas aviso (só mostra se tiver caixa cadastrado)
      const hasCashData = totalIn > 0 || totalOut > 0
      const isBoxPositive = availableCash > 0
      if (!boxCheck && hasCashData && !isBoxPositive) {
        warnings.push("Caixa negativo. Faça um aporte para continuar.")
      } else if (!boxCheck && hasCashData) {
        warnings.push("Valor excede caixa utilizável disponível")
      }

      // Cliente limite - pode bloquear
      if (!clientLimitCheck && settings?.client_limit_mandatory) {
        isValid = false
        canOverride = false
        message = "Bloqueado: Limite do cliente excedido"
      } else if (!clientLimitCheck) {
        warnings.push("Valor excede limite recomendado do cliente")
      }

      // Score - pode bloquear
      if (!scoreCheck && settings?.block_on_low_score) {
        isValid = false
        canOverride = false
        message = "Bloqueado: Score abaixo do mínimo"
      } else if (!scoreCheck) {
        warnings.push("Score abaixo do recomendado")
      }

      // Máximo empréstimos
      if (!maxLoansCheck) {
        isValid = false
        canOverride = false
        message = "Bloqueado: Número máximo de empréstimos ativos"
      }

      // Registrar auditoria
      await ctx.supabase.from("credit_audit_log").insert({
        tenant_id: ctx.tenantId,
        customer_document: document,
        decision_type: isValid ? "auto_approve" : "auto_deny",
        decision_result: isValid ? "approved" : "denied",
        box_available: availableCash,
        box_utilizable: usableCash,
        requested_amount: amount,
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

      return {
        is_valid: isValid,
        can_override: canOverride,
        message,
        warnings,
        box_available: availableCash,
        box_utilizable: usableCash,
        client_limit: clientLimit,
        client_limit_used: clientUsed,
        client_limit_available: Math.max(0, clientLimit - clientUsed),
        customer_score: finalScore,
        customer_risk_level: score?.risk_level || "medium",
        active_loans_count: activeLoansCount,
        checks: {
          box: boxCheck,
          client_limit: clientLimitCheck,
          score: scoreCheck,
          max_loans: maxLoansCheck,
        },
      }
    }),

  // 7. Listar histórico de auditoria
  getAuditLog: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("credit_audit_log")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data || []
    }),

  // 8. Pré-validar empréstimo (para UI em tempo real)
  validateLoan: protectedProcedure
    .input(
      z.object({
        customer_document: z.string(),
        amount: z.number().positive(),
        monthly_income: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const document = input.customer_document.replace(/\D/g, "")
      const amount = input.amount
      const monthlyIncome = input.monthly_income || 0

      // Buscar configurações
      const { data: settings } = await ctx.supabase
        .from("credit_settings")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .single()

      // Se não houver configurações, permitir tudo
      if (!settings) {
        return {
          is_valid: true,
          can_override: false,
          message: "Sistema sem configurações de crédito",
          box_available: null,
          box_utilizable: null,
          client_limit: null,
          client_limit_used: null,
          client_limit_available: null,
          customer_score: null,
          customer_risk_level: null,
          active_loans_count: 0,
          checks: {
            box: true,
            client_limit: true,
            score: true,
            max_loans: true,
          },
          warnings: [],
        }
      }

      // Calcular caixa usando cash_transactions
      const { data: cashIn } = await ctx.supabase
        .from("cash_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("type", "in")
        .eq("status", "completed")

      const { data: cashOut } = await ctx.supabase
        .from("cash_transactions")
        .select("amount")
        .eq("tenant_id", ctx.tenantId)
        .eq("type", "out")
        .eq("status", "completed")

      const totalIn = cashIn?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalOut = cashOut?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

      const availableCash = totalIn - totalOut
      const usableCash = availableCash * ((settings.max_box_percentage || 80) / 100)

      // Buscar configurações de peso do score
      const { data: settingsWithWeights } = await ctx.supabase
        .from("credit_settings")
        .select("score_payment_weight, score_time_weight, score_default_weight, score_usage_weight, score_stability_weight, max_box_percentage_per_client")
        .eq("tenant_id", ctx.tenantId)
        .single()

      // Usar pesos das configurações ou defaults
      const weights = {
        payment: settingsWithWeights?.score_payment_weight || 30,
        time: settingsWithWeights?.score_time_weight || 25,
        default: settingsWithWeights?.score_default_weight || 20,
        usage: settingsWithWeights?.score_usage_weight || 15,
        stability: settingsWithWeights?.score_stability_weight || 10,
      }
      
      // Buscar cliente pelo documento - agora incluindo loans ativos para limite
      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("id, created_at")
        .eq("tenant_id", ctx.tenantId)
        .eq("document", document)
        .single()

      // Buscar loans ativos do cliente para calcular limite_used
      let clientUsed = 0
      let activeLoansCount = 0
      
      if (customer) {
        const { data: customerLoans } = await ctx.supabase
          .from("loans")
          .select("amount, status")
          .eq("tenant_id", ctx.tenantId)
          .eq("customer_id", customer.id)
          .in("status", ["active", "late", "overdue"])

        clientUsed = customerLoans?.reduce((sum, loan) => sum + (loan.amount || 0), 0) || 0
        activeLoansCount = customerLoans?.length || 0
      }

      // Buscar todos os loans do cliente para calcular score
      let finalScore = 500
      let riskLevel = "medium"
      
      if (customer) {
        const { data: loans } = await ctx.supabase
          .from("loans")
          .select("status, installments, created_at")
          .eq("tenant_id", ctx.tenantId)
          .eq("customer_id", customer.id)

        // Calcular subscores
        const totalParcelas = loans?.reduce((sum, l) => sum + (l.installments || 0), 0) || 0
        const parcelasPagas = loans?.filter(l => l.status === "paid").reduce((sum, l) => sum + (l.installments || 0), 0) || 0
        const parcelasAtrasadas = loans?.filter(l => l.status === "late").length || 0
        const mesesCadastro = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
        const inadimplencias = parcelasAtrasadas
        const emprestimosAtivos = loans?.filter(l => ["active", "late"].includes(l.status)).length || 0
        const emprestimos30d = loans?.filter(l => {
          const created = new Date(l.created_at)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return created >= thirtyDaysAgo
        }).length || 0

        // 1. Score de Pagamento
        let paymentScore = 500
        if (totalParcelas > 0) {
          paymentScore = Math.min(1000, Math.max(0,
            (parcelasPagas / totalParcelas * 1000) -
            (parcelasAtrasadas / totalParcelas * 300)
          ))
        }

        // 2. Score de Tempo
        const timeScore = Math.min(1000, (mesesCadastro / 24 * 1000))

        // 3. Score de Inadimplência
        const defaultScore = Math.max(0, 1000 - (inadimplencias * 250))

        // 4. Score de Uso de Crédito
        let creditUsageScore = 1000
        if (emprestimosAtivos > 3) creditUsageScore -= (emprestimosAtivos - 3) * 100
        if (emprestimos30d > 3) creditUsageScore -= (emprestimos30d - 3) * 150
        creditUsageScore = Math.max(0, creditUsageScore)

        // 5. Score de Estabilidade
        let stabilityScore = 500
        if (totalParcelas > 0) {
          stabilityScore = Math.max(0, 1000 - (
            Math.abs(parcelasPagas - parcelasAtrasadas) / totalParcelas * 500
          ))
        }

        // Score Final com pesos configuráveis
        const totalWeight = weights.payment + weights.time + weights.default + weights.usage + weights.stability
        finalScore = Math.round(
          (weights.payment / totalWeight * paymentScore) +
          (weights.time / totalWeight * timeScore) +
          (weights.default / totalWeight * defaultScore) +
          (weights.usage / totalWeight * creditUsageScore) +
          (weights.stability / totalWeight * stabilityScore)
        )
      }

      // Classificação de Risco
      if (finalScore >= 801) riskLevel = "low"
      else if (finalScore >= 601) riskLevel = "medium"
      else if (finalScore >= 301) riskLevel = "high"
      else riskLevel = "very_high"

      // Calcular limite do cliente
      let clientLimit = 5000
      
      try {
        const { data: limitData } = await ctx.supabase.rpc("calculate_client_credit_limit", {
          p_tenant_id: ctx.tenantId,
          p_customer_document: document,
          p_monthly_income: monthlyIncome,
        })
        clientLimit = Array.isArray(limitData) ? (limitData[0]?.calculated_limit || 5000) : 5000
      } catch {
        // Fallback: calcular limite baseado na renda e caixa
        if (monthlyIncome > 0) {
          const maxPercentagePerClient = settingsWithWeights?.max_box_percentage_per_client || 20
          clientLimit = Math.min(monthlyIncome * 0.3, usableCash * (maxPercentagePerClient / 100))
          clientLimit = Math.max(500, Math.round(clientLimit))
        }
      }

      // Verificações
      const boxCheck = amount <= usableCash
      const clientLimitCheck = (clientUsed + amount) <= clientLimit
      const scoreCheck = finalScore >= (settings.min_score_for_approval || 500)
      const maxLoansCheck = activeLoansCount < (settings.max_active_loans_per_customer || 5)

      // Verificar bloqueios e warnings - caixa nunca bloqueia
      let isValid = true
      let canOverride = true
      let message = "OK"
      const warnings: string[] = []

      // Caixa - apenas aviso (só mostra se tiver caixa cadastrado)
      const hasCashData = totalIn > 0 || totalOut > 0
      const isBoxPositive = availableCash > 0
      if (!boxCheck && hasCashData && !isBoxPositive) {
        warnings.push("Caixa negativo. Faça um aporte para continuar.")
      } else if (!boxCheck && hasCashData) {
        warnings.push("Valor excede caixa utilizável disponível")
      }

      if (!clientLimitCheck) {
        if (settings.client_limit_mandatory && isValid) {
          isValid = false
          canOverride = false
          message = "Bloqueado: Limite do cliente excedido"
        } else if (isValid) {
          warnings.push("Valor excede limite recomendado do cliente")
        }
      }

      if (!scoreCheck) {
        if (settings.block_on_low_score && isValid) {
          isValid = false
          canOverride = false
          message = "Bloqueado: Score abaixo do mínimo"
        } else if (isValid) {
          warnings.push("Score abaixo do mínimo")
        }
      }

      if (!maxLoansCheck && isValid) {
        isValid = false
        canOverride = false
        message = "Bloqueado: Número máximo de empréstimos ativos"
      }

      return {
        is_valid: isValid,
        can_override: canOverride,
        message: isValid && warnings.length > 0 ? warnings.join(", ") : message,
        box_available: availableCash,
        box_utilizable: usableCash,
        client_limit: clientLimit,
        client_limit_used: clientUsed,
        client_limit_available: Math.max(0, clientLimit - clientUsed),
        customer_score: finalScore,
        customer_risk_level: riskLevel,
        active_loans_count: activeLoansCount,
        checks: {
          box: boxCheck,
          client_limit: clientLimitCheck,
          score: scoreCheck,
          max_loans: maxLoansCheck,
        },
        warnings,
      }
    }),

  // 9. Buscar notificações do usuário
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input

      // Get notifications for current user
      const { data: notifications, error } = await ctx.supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", ctx.tenantId)
        .eq("user_id", ctx.userId!)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Get unread count
      const { count: unreadCount } = await ctx.supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", ctx.tenantId)
        .eq("user_id", ctx.userId!)
        .eq("is_read", false)

      return {
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      }
    }),
})