import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const cashRouter = router({
  // 1. Obter resumo do caixa
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.rpc("get_cash_summary", {
      p_tenant_id: ctx.tenantId,
    })

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    const result = Array.isArray(data) ? data[0] : data
    return result
  }),

  // 2. Obter saldo atual
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.rpc("get_cash_balance", {
      p_tenant_id: ctx.tenantId,
    })

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      })
    }

    return data
  }),

  // 3. Listar transações
  listTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        tipo: z.enum(["entrada", "saida"]).optional(),
        categoria: z
          .enum([
            "aporte",
            "pagamento_recebido",
            "emprestimo_liberado",
            "retirada",
            "ajuste",
          ])
          .optional(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("get_cash_transactions", {
        p_tenant_id: ctx.tenantId,
        p_limit: input.limit,
        p_offset: input.offset,
        p_tipo: input.tipo || null,
        p_categoria: input.categoria || null,
        p_data_inicio: input.dataInicio || null,
        p_data_fim: input.dataFim || null,
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data || []
    }),

  // 4. Registrar aporte (depósito)
  registerContribution: protectedProcedure
    .input(
      z.object({
        valor: z.number().positive("Valor deve ser positivo"),
        descricao: z.string().min(1, "Descrição obrigatória"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("register_cash_contribution", {
        p_tenant_id: ctx.tenantId,
        p_valor: input.valor,
        p_descricao: input.descricao,
        p_usuario_responsavel: ctx.userId || "unknown",
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data
    }),

  // 5. Registrar retirada (saque)
  registerWithdrawal: protectedProcedure
    .input(
      z.object({
        valor: z.number().positive("Valor deve ser positivo"),
        descricao: z.string().min(1, "Descrição obrigatória"),
        justificativa: z.string().min(1, "Justificativa obrigatória para retiradas"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("register_cash_withdrawal", {
        p_tenant_id: ctx.tenantId,
        p_valor: input.valor,
        p_descricao: input.descricao,
        p_usuario_responsavel: ctx.userId || "unknown",
        p_justificativa: input.justificativa,
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data
    }),

  // 6. Ajuste manual
  registerAdjustment: protectedProcedure
    .input(
      z.object({
        valor: z.number().positive("Valor deve ser positivo"),
        descricao: z.string().min(1, "Descrição obrigatória"),
        justificativa: z.string().min(1, "Justificativa obrigatória para ajustes"),
        positivo: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("register_cash_adjustment", {
        p_tenant_id: ctx.tenantId,
        p_valor: input.valor,
        p_descricao: input.descricao,
        p_usuario_responsavel: ctx.userId || "unknown",
        p_justificativa: input.justificativa,
        p_positivo: input.positivo,
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data
    }),

  // Get expenses by date range for financial reports
  getExpensesByPeriod: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("get_cash_transactions", {
        p_tenant_id: ctx.tenantId,
        p_limit: 1000,
        p_offset: 0,
        p_tipo: "saida",
        p_categoria: null,
        p_data_inicio: input.dateFrom || null,
        p_data_fim: input.dateTo || null,
      })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Sum all expenses
      const totalExpenses = (data || []).reduce((sum: number, tx: any) => {
        return sum + Number(tx.valor || 0);
      }, 0);

      return {
        total: totalExpenses,
        transactions: data || [],
      }
    }),
})
