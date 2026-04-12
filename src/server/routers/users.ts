import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { Notifications } from "@/lib/notifications"

// Permission templates (system-defined)
const SYSTEM_PERMISSIONS = {
  dashboard: ["dashboard.view", "dashboard.edit"],
  customers: ["customers.view", "customers.edit", "customers.delete"],
  loans: ["loans.view", "loans.create", "loans.edit", "loans.delete"],
  collections: ["collections.view", "collections.edit"],
  settings: ["settings.view", "settings.edit"],
  users: ["users.view", "users.create", "users.edit", "users.delete"],
}

// User and permissions router
export const usersRouter = router({
  // List all users in tenant
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        is_active: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, is_active, limit, offset } = input

      let query = ctx.supabase
        .from("users")
        .select("*", { count: "exact" })
        .eq("tenant_id", ctx.tenantId!)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
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

  // Get user by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select(`
          *,
          user_roles(role:roles(*))
        `)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)
        .single()

      if (error) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
      }

      return data
    }),

  // Create user
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(6),
        role: z.enum(["owner", "admin", "manager", "operator", "viewer"]),
        avatar_url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, password, role, avatar_url } = input

      // Check if email already exists
      const { data: existing } = await ctx.supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single()

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este e-mail já está em uso",
        })
      }

      // Create user
      const { data, error } = await ctx.supabase
        .from("users")
        .insert({
          tenant_id: ctx.tenantId,
          email,
          name,
          password_hash: password,
          role,
          avatar_url,
          is_active: true, // New users are active by default
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      // Create notification for new user added
      await Notifications.newUser(
        ctx.supabase,
        ctx.tenantId!,
        name,
        role
      )

      return data
    }),

  // Update user
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        role: z.enum(["owner", "admin", "manager", "operator", "viewer"]).optional(),
        avatar_url: z.string().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Prevent changing role TO owner if there's already an owner
      if (updates.role === "owner") {
        const { data: existingOwner } = await ctx.supabase
          .from("users")
          .select("id")
          .eq("tenant_id", ctx.tenantId!)
          .eq("role", "owner")
          .neq("id", id)
          .maybeSingle()
        
        if (existingOwner) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Esta empresa já possui um proprietário. Transfira a propriedade primeiro antes de atribuir outro proprietário."
          })
        }
      }

      // Prevent changing role FROM owner
      if (updates.role && updates.role !== "owner") {
        const { data: user } = await ctx.supabase
          .from("users")
          .select("role")
          .eq("id", id)
          .single()

        if (user?.role === "owner") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível alterar a função do proprietário. Transfira a propriedade primeiro."
          })
        }
      }

      // Prevent deactivating owner
      if (updates.is_active === false) {
        const { data: user } = await ctx.supabase
          .from("users")
          .select("role")
          .eq("id", id)
          .single()

        if (user?.role === "owner") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível desativar o proprietário",
          })
        }
      }

      const { data, error } = await ctx.supabase
        .from("users")
        .update(updates)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Delete user
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is owner
      const { data: user } = await ctx.supabase
        .from("users")
        .select("role")
        .eq("id", input.id)
        .single()

      if (user?.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível excluir o proprietário",
        })
      }

      const { error } = await ctx.supabase
        .from("users")
        .delete()
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        current_password: z.string(),
        new_password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // In production: verify current password hash
      const { data: user } = await ctx.supabase
        .from("users")
        .select("password_hash")
        .eq("id", input.id)
        .single()

      if (!user || user.password_hash !== input.current_password) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Senha atual incorreta",
        })
      }

      const { error } = await ctx.supabase
        .from("users")
        .update({ password_hash: input.new_password })
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("users")
      .select(`
        *,
        user_roles(role:roles(*))
      `)
      .eq("id", ctx.userId!)
      .single()

    if (error) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" })
    }

    return data
  }),

  // Get available roles
  listRoles: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("roles")
      .select("*")
      .eq("tenant_id", ctx.tenantId!)
      .order("name", { ascending: true })

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return { roles: data || [] }
  }),

  // Create custom role
  createRole: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("roles")
        .insert({
          tenant_id: ctx.tenantId,
          name: input.name,
          permissions: input.permissions,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Update role
  updateRole: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        permissions: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const { data, error } = await ctx.supabase
        .from("roles")
        .update(updates)
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Delete role
  deleteRole: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if role is in use
      const { data: inUse } = await ctx.supabase
        .from("user_roles")
        .select("id")
        .eq("role_id", input.id)
        .limit(1)
        .single()

      if (inUse) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta função está em uso por usuários",
        })
      }

      const { error } = await ctx.supabase
        .from("roles")
        .delete()
        .eq("tenant_id", ctx.tenantId!)
        .eq("id", input.id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Assign role to user
  assignRole: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        role_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("user_roles")
        .insert({
          user_id: input.user_id,
          role_id: input.role_id,
          assigned_by: ctx.userId,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return data
    }),

  // Remove role from user
  removeRole: protectedProcedure
    .input(
      z.object({
        user_id: z.string(),
        role_id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", input.user_id)
        .eq("role_id", input.role_id)

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
      }

      return { success: true }
    }),

  // Get permission templates
  getPermissionTemplates: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("permission_templates")
      .select("*")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true })

    if (error) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })
    }

    return data || []
  }),

  // Check user permission
  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: user } = await ctx.supabase
        .from("users")
        .select("role, user_roles(role:roles(permissions))")
        .eq("id", ctx.userId!)
        .single()

      if (!user) return false

      // Owner has all permissions
      if (user.role === "owner") return true

      // Check role permissions
      const userRoles = user.user_roles as any[]
      for (const ur of userRoles) {
        const permissions = ur.role?.permissions as string[]
        if (permissions?.includes("*") || permissions?.includes(input.permission)) {
          return true
        }
      }

      return false
    }),

  // Transfer ownership to another user
  transferOwnership: protectedProcedure
    .input(z.object({ newOwnerId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx

      // Check if current user is owner
      const { data: currentOwner } = await ctx.supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .eq("tenant_id", tenantId)
        .single()

      if (currentOwner?.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o proprietário pode transferir a propriedade"
        })
      }

      // Check if new owner exists in same tenant
      const { data: newOwner } = await ctx.supabase
        .from("users")
        .select("id, role")
        .eq("id", input.newOwnerId)
        .eq("tenant_id", tenantId)
        .single()

      if (!newOwner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado nesta empresa"
        })
      }

      // Transfer ownership: change current owner to admin, new user to owner
      await ctx.supabase
        .from("users")
        .update({ role: "admin" })
        .eq("id", userId)
        .eq("tenant_id", tenantId)

      await ctx.supabase
        .from("users")
        .update({ role: "owner" })
        .eq("id", input.newOwnerId)
        .eq("tenant_id", tenantId)

      return { success: true, message: "Propriedade transferida com sucesso!" }
    }),
})
