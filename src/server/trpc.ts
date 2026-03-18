import { initTRPC, TRPCError } from "@trpc/server"
import { ZodError } from "zod"
import { supabaseServer } from "./supabase"

export interface Context {
  supabase: ReturnType<typeof supabaseServer>
  userId?: string
  tenantId?: string
  userRole?: string
}

export const createContext = async (opts: {
  headers: Headers
}): Promise<Context> => {
  const supabase = supabaseServer(opts.headers.get("authorization") || "")
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenantId: string | undefined
  let userRole: string | undefined

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single()

    if (userData) {
      tenantId = userData.tenant_id
      userRole = userData.role
    }
  }

  return {
    supabase,
    userId: user?.id,
    tenantId,
    userRole,
  }
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.userId || !ctx.tenantId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      userRole: ctx.userRole,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)
