import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { z } from "zod"

export const adminRouter = router({
  // Get current user info
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // Get user from database
    const { data: user, error } = await ctx.supabase
      .from("users")
      .select("email, name, role")
      .eq("id", ctx.userId)
      .single()

    if (error || !user) {
      return {
        user: {
          email: null,
          role: ctx.userRole,
          name: null,
        }
      }
    }

    return {
      user: {
        email: user.email,
        role: user.role || ctx.userRole,
        name: user.name,
      }
    }
  }),

  // Get stats for super admin dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Only super_admin can see stats
    if (ctx.userRole !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas super administradores podem ver estatísticas",
      })
    }

    // Get total tenants
    const { count: totalTenants } = await ctx.supabase
      .from("tenants")
      .select("*", { count: 'exact', head: true })

    // Get total users
    const { count: totalUsers } = await ctx.supabase
      .from("users")
      .select("*", { count: 'exact', head: true })

    // Get all tenants and users to calculate orphans
    const { data: allTenants } = await ctx.supabase
      .from("tenants")
      .select("id")

    const { data: users } = await ctx.supabase
      .from("users")
      .select("tenant_id")
      .not("tenant_id", "is", null)

    const usedTenantIds = new Set(users?.map((u) => u.tenant_id).filter(Boolean) || [])
    const orphanedTenants = (allTenants || []).filter((t) => !usedTenantIds.has(t.id)).length

    return {
      totalTenants: totalTenants || 0,
      totalUsers: totalUsers || 0,
      orphanedTenants,
    }
  }),

  // Cleanup orphaned tenants (no users)
  cleanupOrphanedTenants: protectedProcedure
    .input(
      z.object({
        dryRun: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only super_admin can run cleanup
      if (ctx.userRole !== "super_admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas super administradores podem executar cleanup",
        })
      }

      // Get all tenants
      const { data: allTenants, error: tenantsError } = await ctx.supabase
        .from("tenants")
        .select("id, name, slug, plan, created_at")

      if (tenantsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: tenantsError.message,
        })
      }

      // Get all users with tenant_id
      const { data: users, error: usersError } = await ctx.supabase
        .from("users")
        .select("tenant_id")
        .not("tenant_id", "is", null)

      if (usersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: usersError.message,
        })
      }

      // Find tenant IDs that have users
      const usedTenantIds = new Set(users?.map((u) => u.tenant_id).filter(Boolean) || [])

      // Find orphaned tenants
      const orphans = (allTenants || []).filter((t) => !usedTenantIds.has(t.id))

      if (!orphans || orphans.length === 0) {
        return { deleted: 0, tenants: [], message: "Nenhuma empresa órfã encontrada" }
      }

      if (input.dryRun) {
        return {
          deleted: 0,
          tenants: orphans,
          message: `${orphans.length} empresa(s) seria(ão) deletada(s) em modo real`,
        }
      }

      // Delete orphaned tenants
      const ids = orphans.map((t) => t.id)
      const { error } = await ctx.supabase.from("tenants").delete().in("id", ids)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return {
        deleted: orphans.length,
        tenants: orphans,
        message: `${orphans.length} empresa(s) deletada(s)`,
      }
    }),
})