import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Guarantors router
export const guarantorsRouter = router({
  // List all guarantors
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const { data, error, count } = await ctx.supabase
        .from("guarantors")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar garantidores",
        })
      }

      return { guarantors: data || [], total: count || 0 }
    }),

  // Get single guarantor
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx

      const { data, error } = await ctx.supabase
        .from("guarantors")
        .select("*")
        .eq("id", input.id)
        .eq("tenant_id", tenantId)
        .single()

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Garantidor não encontrado",
        })
      }

      return data
    }),

  // Create guarantor
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      document: z.string().min(1),
      document_type: z.enum(["cpf", "cnpj"]),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      guarantee_type: z.enum(["property", "vehicle", "personal", "payroll"]),
      guarantee_value: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const { data, error } = await ctx.supabase
        .from("guarantors")
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          name: input.name,
          document: input.document.replace(/\D/g, ""),
          document_type: input.document_type,
          email: input.email,
          phone: input.phone,
          address: input.address,
          guarantee_type: input.guarantee_type,
          guarantee_value: input.guarantee_value,
          notes: input.notes,
          status: "active",
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar garantidor",
        })
      }

      return data
    }),

  // Update guarantor
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      guarantee_type: z.enum(["property", "vehicle", "personal", "payroll"]).optional(),
      guarantee_value: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { id, ...updates } = input

      const { data, error } = await ctx.supabase
        .from("guarantors")
        .update(updates)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar garantidor",
        })
      }

      return data
    }),

  // Delete guarantor
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx

      const { error } = await ctx.supabase
        .from("guarantors")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", tenantId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao excluir garantidor",
        })
      }

      return { success: true }
    }),

  // List guarantees for a loan
  listByLoan: protectedProcedure
    .input(z.object({ loanId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx

      const { data, error } = await ctx.supabase
        .from("loan_guarantees")
        .select(`
          *,
          guarantor:guarantors(*)
        `)
        .eq("loan_id", input.loanId)
        .eq("tenant_id", tenantId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar garantias",
        })
      }

      return { guarantees: data || [] }
    }),
})
