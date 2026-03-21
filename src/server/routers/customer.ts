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
    console.log("[customer] Event logging skipped:", type)
  }
}

// Validate Brazilian CPF
function validateCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.charAt(i - 1)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(10))) return false

  return true
}

// Validate Brazilian CEP
function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, "")
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP)
}

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
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        // Remove punctuation and accents for search
        const cleanSearch = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        
        if (cleanSearch.length > 0) {
          // Use lowercase for case-insensitive search
          query = query.or(`name.ilike.%${search}%,document.ilike.%${search.replace(/[^0-9]/g, '')}%`)
        }
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
        cep: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        credit_limit: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate CEP if provided
      if (input.cep && !validateCEP(input.cep)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CEP inválido. Deve ter 8 dígitos.",
        })
      }

      // Validate CPF if provided
      if (input.document) {
        const cleanDoc = input.document.replace(/\D/g, "")
        if (cleanDoc.length !== 11) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CPF deve ter 11 dígitos",
          })
        }
        // CPF validation
        if (!validateCPF(cleanDoc)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CPF inválido",
          })
        }
        input.document = cleanDoc
      }

      // Check for existing customer with same CPF
      const { data: existing } = await ctx.supabase
        .from("customers")
        .select("id, status, name, email, phone, address, cep, street, number, complement, neighborhood, city, state, notes")
        .eq("tenant_id", ctx.tenantId!)
        .eq("document", input.document || "")
        .in("status", ["active", "inactive", "blocked"])
        .limit(1)
        .single()

      if (existing) {
        // Customer already exists
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um cliente cadastrado com este CPF",
        })
      }

      const { data, error } = await ctx.supabase
        .from("customers")
        .insert({
          tenant_id: ctx.tenantId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          document: input.document,
          cep: input.cep,
          street: input.street,
          number: input.number,
          complement: input.complement,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          address: input.address,
          notes: input.notes,
          credit_limit: input.credit_limit,
          status: "active",
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Log event (safe - won't fail if table doesn't exist)
      await logCustomerEvent(ctx.supabase, data.id, "created", "Cliente cadastrado")

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
        cep: z.string().optional().nullable(),
        street: z.string().optional().nullable(),
        number: z.string().optional().nullable(),
        complement: z.string().optional().nullable(),
        neighborhood: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
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
        .select("name, email, phone, address, cep, street, number, complement, neighborhood, city, state, notes, status")
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
      if (current && data) {
        const changes: string[] = []
        if (current.name !== data.name) changes.push(`nome: "${current.name}" → "${data.name}"`)
        if (current.email !== data.email) changes.push(`e-mail: "${current.email || '-'}" → "${data.email || '-'}"`)
        if (current.phone !== data.phone) changes.push(`telefone: "${current.phone}" → "${data.phone}"`)
        if (current.address !== data.address) changes.push(`endereço alterado`)
        if (current.notes !== data.notes) changes.push(`observações alteradas`)
        if (current.status !== data.status) changes.push(`status: "${current.status}" → "${data.status}"`)

        if (changes.length > 0) {
          await logCustomerEvent(ctx.supabase, id, "updated", `Alterações: ${changes.join(", ")}`)
        }
      }

      return data
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Soft delete - mark as inactive
      const { error } = await ctx.supabase
        .from("customers")
        .update({ 
          status: "inactive",
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
      await logCustomerEvent(ctx.supabase, input.id, "deleted", "Cliente desativado")

      return { success: true }
    }),

  events: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const { data, error } = await ctx.supabase
          .from("customer_events")
          .select("*")
          .eq("customer_id", input.customerId)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          // Return empty array if table doesn't exist
          return []
        }

        return data || []
      } catch (e) {
        // Return empty array if table doesn't exist
        return []
      }
    }),
})
