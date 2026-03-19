import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const customerRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "blocked"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, status, limit, offset } = input

      let query = ctx.supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenantId!)
        .neq("status", "deleted") // Exclude soft-deleted customers
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.ilike("name", `%${search}%`)
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

      return { customers: data || [], total: count || 0 }
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente não encontrado",
        })
      }

      return data
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().min(1),
        document: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        credit_limit: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate CPF if document is provided
      if (input.document) {
        const { data: existing } = await ctx.supabase
          .from("customers")
          .select("id")
          .eq("tenant_id", ctx.tenantId!)
          .eq("document", input.document)
          .neq("status", "deleted")
          .limit(1)
          .single()

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Já existe um cliente cadastrado com este CPF",
          })
        }
      }

      const { data, error } = await ctx.supabase
        .from("customers")
        .insert({
          tenant_id: ctx.tenantId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          document: input.document,
          address: input.address,
          notes: input.notes,
          credit_limit: input.credit_limit,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Log event
      await ctx.supabase.from("customer_events").insert({
        customer_id: data.id,
        type: "created",
        description: "Cliente cadastrado",
      })

      return data
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().min(1).optional(),
        document: z.string().optional(),
        address: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        status: z.enum(["active", "inactive", "blocked"]).optional(),
        credit_limit: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Get current customer data for audit
      const { data: current } = await ctx.supabase
        .from("customers")
        .select("name, email, phone, address, notes, status")
        .eq("id", id)
        .single()

      const { data, error } = await ctx.supabase
        .from("customers")
        .update(updates)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Log changes for audit
      if (current) {
        const changes: string[] = []
        if (current.name !== data.name) changes.push(`nome: "${current.name}" → "${data.name}"`)
        if (current.email !== data.email) changes.push(`e-mail: "${current.email || '-'}" → "${data.email || '-'}"`)
        if (current.phone !== data.phone) changes.push(`telefone: "${current.phone}" → "${data.phone}"`)
        if (current.address !== data.address) changes.push(`endereço alterado`)
        if (current.notes !== data.notes) changes.push(`observações alteradas`)
        if (current.status !== data.status) changes.push(`status: "${current.status}" → "${data.status}"`)

        if (changes.length > 0) {
          await ctx.supabase.from("customer_events").insert({
            customer_id: id,
            type: "updated",
            description: `Alterações: ${changes.join(", ")}`,
          })
        }
      }

      return data
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete - mark as deleted but keep data for score sharing
      const { error } = await ctx.supabase
        .from("customers")
        .update({ 
          status: "deleted",
          deleted_at: new Date().toISOString(),
          // Clear personal data but keep CPF for score
          email: null,
          phone: null,
          address: null,
          notes: null,
          name: "[EXCLUÍDO]"
        })
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Log the deletion
      await ctx.supabase.from("customer_events").insert({
        customer_id: input.id,
        type: "deleted",
        description: "Cliente excluído (soft delete - dados mantidos para score)",
      })

      return { success: true }
    }),

  events: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("customer_events")
        .select("*")
        .eq("customer_id", input.customerId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data || []
    }),
})
