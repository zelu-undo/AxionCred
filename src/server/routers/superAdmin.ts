import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Super Admin router - manages all tenants
export const superAdminRouter = router({
  // List all tenants (super admin only)
  listTenants: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        plan: z.string().optional(),
        is_active: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if super admin
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { search, plan, is_active, limit, offset } = input

      let query = ctx.supabase
        .from("tenants")
        .select(`
          *,
          users:users(count),
          customers:customers(count),
          loans:loans(count)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
      }

      if (plan) {
        query = query.eq("plan", plan)
      }

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { tenants: data || [], total: count || 0 }
    }),

  // Get tenant details
  getTenant: protectedProcedure
    .input(z.object({ tenant_id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get tenant
      const { data: tenant, error: tenantError } = await ctx.supabase
        .from("tenants")
        .select("*")
        .eq("id", input.tenant_id)
        .single()

      if (tenantError || !tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" })
      }

      // Get metrics
      const [
        { count: userCount },
        { count: customerCount },
        { count: activeLoansCount },
        { data: loanStats },
        { data: overdueStats },
      ] = await Promise.all([
        ctx.supabase.from("users").select("*", { count: "exact", head: true }).eq("tenant_id", input.tenant_id),
        ctx.supabase.from("customers").select("*", { count: "exact", head: true }).eq("tenant_id", input.tenant_id),
        ctx.supabase.from("loans").select("*", { count: "exact", head: true }).eq("tenant_id", input.tenant_id).eq("status", "active"),
        ctx.supabase
          .from("loans")
          .select("remaining_amount, status")
          .eq("tenant_id", input.tenant_id)
          .in("status", ["active", "pending"]),
        ctx.supabase
          .from("loan_installments")
          .select("amount, due_date")
          .eq("status", "late"),
      ])

      const totalReceivable = loanStats?.reduce((sum, l) => sum + Number(l.remaining_amount), 0) || 0
      const overdueAmount = overdueStats?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
      const defaultRate = customerCount ? ((overdueStats?.length || 0) / customerCount) * 100 : 0

      return {
        tenant,
        metrics: {
          user_count: userCount || 0,
          customer_count: customerCount || 0,
          active_loans: activeLoansCount || 0,
          total_receivable: totalReceivable,
          overdue_amount: overdueAmount,
          default_rate: defaultRate.toFixed(2),
        },
      }
    }),

  // Create tenant
  createTenant: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        plan: z.enum(["starter", "professional", "enterprise"]),
        settings: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      // Check if slug exists
      const { data: existing } = await ctx.supabase
        .from("tenants")
        .select("id")
        .eq("slug", input.slug)
        .single()

      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este slug já está em uso" })
      }

      const { data, error } = await ctx.supabase
        .from("tenants")
        .insert({
          name: input.name,
          slug: input.slug,
          plan: input.plan,
          settings: input.settings || {},
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Update tenant
  updateTenant: protectedProcedure
    .input(
      z.object({
        tenant_id: z.string(),
        name: z.string().min(1).optional(),
        plan: z.enum(["starter", "professional", "enterprise"]).optional(),
        settings: z.record(z.string(), z.any()).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { tenant_id, ...updates } = input

      const { data, error } = await ctx.supabase
        .from("tenants")
        .update(updates)
        .eq("id", tenant_id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Get global metrics
  getGlobalMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.userRole !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
    }

    const [
      { count: totalTenants },
      { count: totalCustomers },
      { count: totalLoans },
      { data: loanStats },
      { data: overdueData },
      { data: recentLoans },
    ] = await Promise.all([
      ctx.supabase.from("tenants").select("*", { count: "exact", head: true }),
      ctx.supabase.from("customers").select("*", { count: "exact", head: true }),
      ctx.supabase.from("loans").select("*", { count: "exact", head: true }),
      ctx.supabase.from("loans").select("status, remaining_amount"),
      ctx.supabase.from("loan_installments").select("amount, due_date").eq("status", "late"),
      ctx.supabase
        .from("loans")
        .select("created_at, status")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const totalReceivable = loanStats?.reduce((sum, l) => sum + Number(l.remaining_amount), 0) || 0
    const overdueAmount = overdueData?.reduce((sum, i) => sum + Number(i.amount), 0) || 0
    const activeLoans = loanStats?.filter((l) => l.status === "active" || l.status === "pending").length || 0

    // Calculate default rate by tenant - simplified query
    const { data: tenantStats } = await ctx.supabase
      .from("tenants")
      .select("id, name")

    const tenantDefaultRates = await Promise.all(
      (tenantStats || []).map(async (t) => {
        const { count: customerCount } = await ctx.supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", t.id)
          
        const { count: overdueCount } = await ctx.supabase
          .from("loan_installments")
          .select("*", { count: "exact", head: true })
          .eq("status", "late")
        
        return {
          name: t.name,
          rate: customerCount ? ((overdueCount || 0) / customerCount) * 100 : 0,
        }
      })
    )

    // Weekly trend
    const weeklyLoans = recentLoans?.length || 0
    const weeklyGrowth = 0 // Would compare with previous week

    return {
      total_tenants: totalTenants || 0,
      total_customers: totalCustomers || 0,
      total_loans: totalLoans || 0,
      active_loans: activeLoans,
      total_receivable: totalReceivable,
      overdue_amount: overdueAmount,
      default_rate: totalCustomers ? ((overdueData?.length || 0) / totalCustomers) * 100 : 0,
      weekly_loans: weeklyLoans,
      tenant_default_rates: tenantDefaultRates || [],
    }
  }),

  // Get feature flags for a tenant
  getTenantFeatures: protectedProcedure
    .input(z.object({ tenant_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("tenant_features")
        .select("*")
        .eq("tenant_id", input.tenant_id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data || []
    }),

  // Update tenant features
  updateTenantFeatures: protectedProcedure
    .input(
      z.object({
        tenant_id: z.string(),
        features: z.array(
          z.object({
            feature_name: z.string(),
            enabled: z.boolean(),
            limit_value: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const features = input.features.map((f) => ({
        tenant_id: input.tenant_id,
        ...f,
      }))

      const { error } = await ctx.supabase.from("tenant_features").upsert(features, {
        onConflict: "tenant_id,feature_name",
      })

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get available plans
  getPlans: protectedProcedure.query(async () => {
    return [
      {
        name: "starter",
        label: "Iniciante",
        price: 99,
        features: ["5 usuários", "100 clientes", "Empréstimos básicos"],
      },
      {
        name: "professional",
        label: "Profissional",
        price: 299,
        features: ["20 usuários", "Clientes ilimitados", "Notificações", "Relatórios"],
      },
      {
        name: "enterprise",
        label: "Empresarial",
        price: 999,
        features: ["Usuários ilimitados", "API", "White label", "Suporte dedicado"],
      },
    ]
  }),

  // ========== USER MANAGEMENT ==========

  // List all users (super admin only)
  listUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        tenant_id: z.string().optional(),
        role: z.string().optional(),
        is_active: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { search, tenant_id, role, is_active, limit, offset } = input

      let query = ctx.supabase
        .from("users")
        .select(`
          *,
          tenant:tenants(name, slug, plan)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      if (tenant_id) {
        query = query.eq("tenant_id", tenant_id)
      }

      if (role) {
        query = query.eq("role", role)
      }

      if (is_active !== undefined) {
        query = query.eq("is_active", is_active)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { users: data || [], total: count || 0 }
    }),

  // Get user details
  getUser: protectedProcedure
    .input(z.object({ user_id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { data: user, error: userError } = await ctx.supabase
        .from("users")
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq("id", input.user_id)
        .single()

      if (userError || !user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
      }

      // Get user stats
      const [
        { count: customerCount },
        { count: loanCount },
      ] = await Promise.all([
        ctx.supabase.from("customers").select("*", { count: "exact", head: true }).eq("created_by", input.user_id),
        ctx.supabase.from("loans").select("*", { count: "exact", head: true }).eq("created_by", input.user_id),
      ])

      return {
        ...user,
        stats: {
          customers_created: customerCount || 0,
          loans_created: loanCount || 0,
        }
      }
    }),

  // Update user (role, tenant, status)
  updateUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        role: z.string().optional(),
        tenant_id: z.string().nullable().optional(),
        is_active: z.boolean().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { user_id, ...updates } = input

      // Remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      )

      if (Object.keys(cleanUpdates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma atualização fornecida" })
      }

      const { data, error } = await ctx.supabase
        .from("users")
        .update(cleanUpdates)
        .eq("id", user_id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Delete user
  deleteUser: protectedProcedure
    .input(z.object({ user_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      // Check if user has data
      const [
        { count: customerCount },
        { count: loanCount },
      ] = await Promise.all([
        ctx.supabase.from("customers").select("*", { count: "exact", head: true }).eq("created_by", input.user_id),
        ctx.supabase.from("loans").select("*", { count: "exact", head: true }).eq("created_by", input.user_id),
      ])

      if ((customerCount || 0) > 0 || (loanCount || 0) > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Este usuário possui ${customerCount || 0} clientes e ${loanCount || 0} empréstimos cadastrados. Mova ou exclua esses dados antes de excluir o usuário.`
        })
      }

      const { error } = await ctx.supabase
        .from("users")
        .delete()
        .eq("id", input.user_id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get all tenants for assignment
  listTenantsForAssignment: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a super administradores" })
      }

      const { data, error } = await ctx.supabase
        .from("tenants")
        .select("id, name, slug, plan")
        .order("name")

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data || []
    }),
})
