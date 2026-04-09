import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { randomBytes } from "crypto"

// Schema para convite
const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "manager", "collector", "analyst", "viewer"]),
  permissions: z.array(z.string()).optional(),
})

// Router para gerenciamento de equipe (convites)
export const teamRouter = router({
  // Listar membros da equipe (usuários do tenant)
  listMembers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        status: z.enum(["all", "active", "invited"]).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx
      const { search, role, status, limit, offset } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar usuários do tenant
      let query = ctx.supabase
        .from("users")
        .select(`
          id,
          email,
          name,
          phone,
          avatar_url,
          status,
          created_at,
          last_login_at,
          role:user_roles(
            id,
            name,
            permissions
          )
        `, { count: "exact" })
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset || 0, (offset || 0) + (limit || 50) - 1)

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      if (role && role !== "all") {
        query = query.eq("role_id", role)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar membros da equipe",
        })
      }

      return {
        members: data || [],
        total: count || 0,
      }
    }),

  // Convidar novo membro
  inviteMember: protectedProcedure
    .input(inviteSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId } = ctx
      const { email, name, role, permissions } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar role_id pelo nome
      const { data: roleData } = await ctx.supabase
        .from("user_roles")
        .select("id")
        .eq("name", role)
        .single()

      const roleId = roleData?.id

      // Criar token de convite
      const inviteToken = randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Criar usuário com status "invited"
      const { data: newUser, error: createError } = await ctx.supabase
        .from("users")
        .insert({
          tenant_id: tenantId,
          email: email.toLowerCase(),
          name,
          role_id: roleId,
          status: "invited",
          invited_by: userId,
          invite_token: inviteToken,
          invite_expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar convite",
        })
      }

      // Aqui você poderia enviar um email com o link de convite
      // Por enquanto, retornamos o token para desenvolvimento
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`

      return {
        success: true,
        user: newUser,
        inviteUrl, // Em produção, não retornar isso - enviar por email
        expiresAt: expiresAt.toISOString(),
      }
    }),

  // Cancelar convite
  cancelInvite: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Verificar se o convite pertence a este tenant
      const { data: existingUser } = await ctx.supabase
        .from("users")
        .select("id, tenant_id, status")
        .eq("id", input.userId)
        .eq("tenant_id", tenantId)
        .single()

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        })
      }

      // Deletar usuário convite
      const { error } = await ctx.supabase
        .from("users")
        .delete()
        .eq("id", input.userId)
        .eq("tenant_id", tenantId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao cancelar convite",
        })
      }

      return { success: true }
    }),

  // Atualizar membro (promover/demover, mudar role)
  updateMember: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["admin", "manager", "collector", "analyst", "viewer"]).optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { userId, role, name, phone, status } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Buscar role_id pelo nome
      let roleId = null
      if (role) {
        const { data: roleData } = await ctx.supabase
          .from("user_roles")
          .select("id")
          .eq("name", role)
          .single()
        roleId = roleData?.id
      }

      const updateData: Record<string, unknown> = {}
      if (roleId) updateData.role_id = roleId
      if (name) updateData.name = name
      if (phone) updateData.phone = phone
      if (status) updateData.status = status

      const { data, error } = await ctx.supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .eq("tenant_id", tenantId)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar membro",
        })
      }

      return { success: true, user: data }
    }),

  // Remover membro da equipe
  removeMember: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId: currentUserId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Não permitir remover a si mesmo
      if (input.userId === currentUserId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Você não pode remover a si mesmo",
        })
      }

      const { error } = await ctx.supabase
        .from("users")
        .delete()
        .eq("id", input.userId)
        .eq("tenant_id", tenantId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover membro",
        })
      }

      return { success: true }
    }),

  // Reenviar convite
  resendInvite: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }

      // Verificar se o usuário existe e está com convite pendente
      const { data: existingUser } = await ctx.supabase
        .from("users")
        .select("id, email, name, status, invite_expires_at")
        .eq("id", input.userId)
        .eq("tenant_id", tenantId)
        .single()

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        })
      }

      if (existingUser.status !== "invited") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Este usuário já ativou sua conta",
        })
      }

      // Gerar novo token
      const inviteToken = randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await ctx.supabase
        .from("users")
        .update({
          invite_token: inviteToken,
          invite_expires_at: expiresAt.toISOString(),
        })
        .eq("id", input.userId)
        .eq("tenant_id", tenantId)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao reenviar convite",
        })
      }

      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteToken}`

      return {
        success: true,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      }
    }),

  // Obter estatísticas da equipe
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx

    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant não encontrado",
      })
    }

    // Total de usuários
    const { count: total } = await ctx.supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)

    // Por status
    const { data: byStatus } = await ctx.supabase
      .from("users")
      .select("status")
      .eq("tenant_id", tenantId)

    const statusCounts = (byStatus || []).reduce(
      (acc, u) => {
        acc[u.status || "unknown"] = (acc[u.status || "unknown"] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    // Por role
    const { data: withRoles } = await ctx.supabase
      .from("users")
      .select(`
        id,
        role:user_roles(name)
      `)
      .eq("tenant_id", tenantId)

    const roleCounts = (withRoles || []).reduce(
      (acc, u) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const roles = u.role as any[]
        const roleName = roles && roles.length > 0 ? roles[0].name : "unknown"
        acc[roleName] = (acc[roleName] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: total || 0,
      byStatus: statusCounts,
      byRole: roleCounts,
    }
  }),
})