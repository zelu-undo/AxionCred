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
  // Get the Authorization header (contains Supabase session token)
  const authHeader = opts.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  
  // Try to get user from Supabase Auth first to get tenantId
  const tempSupabase = supabaseServer(token)
  
  // Try to get user from Supabase Auth
  let userId: string | undefined
  let tenantId: string | undefined
  let userRole: string | undefined

  if (token) {
    // Get user from Supabase using the session token
    const { data: { user }, error } = await tempSupabase.auth.getUser()
    
    if (user && !error) {
      userId = user.id
      
      // Get user data from our users table
      try {
        const { data: userData } = await tempSupabase
          .from("users")
          .select("tenant_id, role")
          .eq("id", user.id)
          .single()

        if (userData) {
          tenantId = userData.tenant_id
          userRole = userData.role
        }
      } catch (e) {
        // Table might not exist
      }
    }
  }

  // Create supabase client WITH tenantId for RLS policies
  const supabase = supabaseServer(token, tenantId)

  return {
    supabase,
    userId,
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
