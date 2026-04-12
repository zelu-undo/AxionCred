import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"
import { createClient } from "@supabase/supabase-js"

// Function to send invite email via Vercel API route
async function sendInviteEmail(email: string, inviteToken: string, tenantName: string, role: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://axioncred.vercel.app'}/api/send-invite-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        inviteToken,
        tenantName,
        role,
      }),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error("Error sending invite email:", result.error)
      return false
    }
    
    console.log("Invite email sent successfully to:", email)
    return true
  } catch (error) {
    console.error("Error sending invite email:", error)
    return false
  }
}

// Router para gerenciamento de convites
export const invitesRouter = router({
  // Listar convites do tenant
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending", "accepted", "expired"]).optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx
      const { status, search, limit, offset } = input

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Empresa não encontrada",
        })
      }

      let query = ctx.supabase
        .from("invites")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && status !== "all") {
        query = query.eq("status", status)
      }

      if (search) {
        query = query.or(`email.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return data || []
    }),

  // Criar convite
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["owner", "admin", "manager", "operator", "viewer"]).default("operator"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userRole } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Empresa não encontrada",
        })
      }

      // Only owner and admin can invite
      if (!userRole || !["owner", "admin"].includes(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas proprietários e administradores podem convidar",
        })
      }

      // Check if email already has a user in this tenant
      const { data: existingUser } = await ctx.supabase
        .from("users")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", input.email)
        .maybeSingle()

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este email já está associado a esta empresa",
        })
      }

      // Check if there's already a pending invite
      const { data: existingInvite } = await ctx.supabase
        .from("invites")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("email", input.email)
        .eq("status", "pending")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle()

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Já existe um convite pendente para este email",
        })
      }

      // Create invite (expires in 7 days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Generate invite token
      const inviteToken = crypto.randomUUID()

      const { data, error } = await ctx.supabase
        .from("invites")
        .insert({
          tenant_id: tenantId,
          email: input.email,
          role: input.role,
          invited_by: ctx.userId,
          status: "pending",
          expires_at: expiresAt.toISOString(),
          token: inviteToken,
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Send invite email (async, don't wait)
      const tenantName = (await ctx.supabase.from("tenants").select("name").eq("id", tenantId).single()).data?.name || 'Empresa'
      sendInviteEmail(input.email, inviteToken, tenantName, input.role)

      return data
    }),

  // Cancelar convite
  cancel: protectedProcedure
    .input(z.object({ invite_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userRole } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Empresa não encontrada",
        })
      }

      // Only owner can cancel
      if (userRole !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas proprietários podem cancelar convites",
        })
      }

      // Verify invite belongs to this tenant
      const { data: invite } = await ctx.supabase
        .from("invites")
        .select("id")
        .eq("id", input.invite_id)
        .eq("tenant_id", tenantId)
        .single()

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Convite não encontrado",
        })
      }

      const { error } = await ctx.supabase
        .from("invites")
        .delete()
        .eq("id", input.invite_id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Reenviar convite
  resend: protectedProcedure
    .input(z.object({ invite_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userRole } = ctx

      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Empresa não encontrada",
        })
      }

      // Only owner and admin can resend
      if (!userRole || !["owner", "admin"].includes(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas proprietários e administradores podem reenviar convites",
        })
      }

      // Get existing invite
      const { data: invite } = await ctx.supabase
        .from("invites")
        .select("*")
        .eq("id", input.invite_id)
        .eq("tenant_id", tenantId)
        .single()

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Convite não encontrado",
        })
      }

      // Update expiration (7 more days)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await ctx.supabase
        .from("invites")
        .update({
          expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .eq("id", input.invite_id)

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        })
      }

      // Send invite email
      const tenantName = (await ctx.supabase.from("tenants").select("name").eq("id", tenantId).single()).data?.name || 'Empresa'
      const inviteToken = invite.token || crypto.randomUUID()
      sendInviteEmail(invite.email, inviteToken, tenantName, invite.role)

      return { success: true }
    }),
})