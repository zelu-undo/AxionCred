import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

// Search result types
const SearchResultType = z.object({
  type: z.enum(["customer", "loan", "installment", "user"]),
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  status: z.string().optional(),
  url: z.string(),
})

export type SearchResult = z.infer<typeof SearchResultType>

// Global search router
export const globalSearchRouter = router({
  // Main search endpoint - searches across all entities
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        types: z
          .array(z.enum(["customer", "loan", "installment", "user"]))
          .optional()
          .default(["customer", "loan", "installment"]),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { query, types, limit } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const results: SearchResult[] = []
      const normalizedQuery = query.toLowerCase().trim()

      // Search customers
      if (types.includes("customer")) {
        const { data: customers, error: customerError } = await ctx.supabase
          .from("customers")
          .select("id, name, document, phone, status, email")
          .eq("tenant_id", tenantId)
          .or(
            `name.ilike.%${normalizedQuery}%,phone.ilike.%${normalizedQuery}%,document.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`
          )
          .limit(limit)

        if (!customerError && customers) {
          customers.forEach((c) => {
            results.push({
              type: "customer",
              id: c.id,
              title: c.name,
              subtitle: c.document
                ? `CPF: ${c.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`
                : c.phone || "",
              status: c.status,
              url: `/customers/${c.id}`,
            })
          })
        }
      }

      // Search loans
      if (types.includes("loan")) {
        const { data: loans, error: loanError } = await ctx.supabase
          .from("loans")
          .select(
            "id, amount, total_amount, status, customer_id, customers(name, document)"
          )
          .eq("tenant_id", tenantId)
          .limit(limit * 2)

        if (!loanError && loans) {
          const filteredLoans = loans.filter(
            (l) =>
              l.id.toLowerCase().includes(normalizedQuery) ||
              (l.customers && Array.isArray(l.customers) && l.customers[0]?.name?.toLowerCase().includes(normalizedQuery))
          )

          filteredLoans.slice(0, limit).forEach((l) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customers = l.customers as any
            const customerName = Array.isArray(customers) ? customers[0]?.name : customers?.name
            const customerDoc = Array.isArray(customers) ? customers[0]?.document : customers?.document
            results.push({
              type: "loan",
              id: l.id,
              title: `Empréstimo R$ ${l.total_amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`,
              subtitle: customerName
                ? `${customerName} - ${customerDoc || "sem doc"}`
                : "",
              status: l.status,
              url: `/loans/${l.id}`,
            })
          })
        }
      }

      // Search installments
      if (types.includes("installment")) {
        const { data: installments, error: installmentError } = await ctx.supabase
          .from("loan_installments")
          .select(
            "id, installment_number, amount, due_date, status, loan_id, loans(id, customer_id, customers(name))"
          )
          .eq("tenant_id", tenantId)
          .limit(limit * 2)

        if (!installmentError && installments) {
          const filteredInstallments = installments.filter(
            (i) =>
              i.installment_number.toString().includes(normalizedQuery) ||
              (i.loans && Array.isArray(i.loans) && i.loans[0]?.customers?.[0]?.name?.toLowerCase().includes(normalizedQuery))
          )

          filteredInstallments.slice(0, limit).forEach((i) => {
            const dueDate = new Date(i.due_date)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const loans = i.loans as any
            const loanCustomer = Array.isArray(loans) ? loans[0]?.customers?.[0] : loans?.customers
            results.push({
              type: "installment",
              id: i.id,
              title: `Parcela #${i.installment_number} - R$ ${i.amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}`,
              subtitle: loanCustomer
                ? `${loanCustomer.name} - Vence ${dueDate.toLocaleDateString("pt-BR")}`
                : "",
              status: i.status,
              url: `/loans/${i.loan_id}`,
            })
          })
        }
      }

      // Search users (staff)
      if (types.includes("user")) {
        const { data: users, error: userError } = await ctx.supabase
          .from("users")
          .select("id, name, email, role")
          .eq("tenant_id", tenantId)
          .or(`name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
          .limit(limit)

        if (!userError && users) {
          users.forEach((u) => {
            results.push({
              type: "user",
              id: u.id,
              title: u.name,
              subtitle: u.email,
              status: u.role,
              url: `/settings/staff`,
            })
          })
        }
      }

      // Sort by relevance (exact match first, then by type)
      results.sort((a, b) => {
        const aExact = a.title.toLowerCase().includes(normalizedQuery) ? 1 : 0
        const bExact = b.title.toLowerCase().includes(normalizedQuery) ? 1 : 0
        return bExact - aExact
      })

      return {
        results: results.slice(0, limit * types.length),
        total: results.length,
        query: normalizedQuery,
      }
    }),

  // Quick search - returns just IDs and types for autocomplete
  quickSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(50),
        limit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { query, limit } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      const normalizedQuery = query.toLowerCase().trim()
      const suggestions: { type: string; id: string; label: string }[] = []

      // Search customers for autocomplete
      const { data: customers } = await ctx.supabase
        .from("customers")
        .select("id, name, document")
        .eq("tenant_id", tenantId)
        .ilike("name", `%${normalizedQuery}%`)
        .limit(limit)

      if (customers) {
        customers.forEach((c) => {
          suggestions.push({
            type: "customer",
            id: c.id,
            label: c.name,
          })
        })
      }

      return { suggestions }
    }),

  // Advanced search with filters
  advancedSearch: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        type: z.enum(["customer", "loan", "installment"]).optional(),
        status: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const {
        query,
        type,
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        limit,
        offset,
      } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Build dynamic query based on type
      if (type === "customer" || !type) {
        let customerQuery = ctx.supabase
          .from("customers")
          .select("*", { count: "exact" })
          .eq("tenant_id", tenantId)

        if (query) {
          customerQuery = customerQuery.or(
            `name.ilike.%${query}%,document.ilike.%${query}%,phone.ilike.%${query}%`
          )
        }
        if (status) {
          customerQuery = customerQuery.eq("status", status)
        }
        if (dateFrom) {
          customerQuery = customerQuery.gte("created_at", dateFrom)
        }
        if (dateTo) {
          customerQuery = customerQuery.lte("created_at", dateTo)
        }

        const { data: customers, count: customerCount } = await customerQuery
          .range(offset, offset + limit - 1)

        return {
          type: "customer",
          results: customers || [],
          total: customerCount || 0,
        }
      }

      if (type === "loan" || !type) {
        let loanQuery = ctx.supabase
          .from("loans")
          .select(
            "*, customer:customers(id, name, document)",
            { count: "exact" }
          )
          .eq("tenant_id", tenantId)

        if (query) {
          loanQuery = loanQuery.or(`id.ilike.%${query}%`)
        }
        if (status) {
          loanQuery = loanQuery.eq("status", status)
        }
        if (minAmount) {
          loanQuery = loanQuery.gte("amount", minAmount)
        }
        if (maxAmount) {
          loanQuery = loanQuery.lte("amount", maxAmount)
        }
        if (dateFrom) {
          loanQuery = loanQuery.gte("created_at", dateFrom)
        }
        if (dateTo) {
          loanQuery = loanQuery.lte("created_at", dateTo)
        }

        const { data: loans, count: loanCount } = await loanQuery
          .range(offset, offset + limit - 1)

        return {
          type: "loan",
          results: loans || [],
          total: loanCount || 0,
        }
      }

      if (type === "installment" || !type) {
        let installmentQuery = ctx.supabase
          .from("loan_installments")
          .select(
            "*, loan:loans(id, customer:customers(id, name))",
            { count: "exact" }
          )
          .eq("tenant_id", tenantId)

        if (status) {
          installmentQuery = installmentQuery.eq("status", status)
        }
        if (minAmount) {
          installmentQuery = installmentQuery.gte("amount", minAmount)
        }
        if (maxAmount) {
          installmentQuery = installmentQuery.lte("amount", maxAmount)
        }
        if (dateFrom) {
          installmentQuery = installmentQuery.gte("due_date", dateFrom)
        }
        if (dateTo) {
          installmentQuery = installmentQuery.lte("due_date", dateTo)
        }

        const { data: installments, count: installmentCount } =
          await installmentQuery.range(offset, offset + limit - 1)

        return {
          type: "installment",
          results: installments || [],
          total: installmentCount || 0,
        }
      }

      return { results: [], total: 0 }
    }),
})