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
  
  const supabase = supabaseServer(token)
  
  // Try to get user from Supabase Auth
  let userId: string | undefined
  let tenantId: string | undefined
  let userRole: string | undefined

  if (token) {
    // Get user from Supabase using the session token
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      userId = user.id
      
      // Get user data from our users table
      try {
        const { data: userData } = await supabase
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
  // Allow requests if userId exists, even if tenantId is empty
  // This handles the case where user just logged in and tenant is being created
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  
  // If tenantId is empty, try to get from localStorage on client side
  // Note: This is a workaround - in production, tenantId should always be set after login
  const tenantId = ctx.tenantId || ""
  
  return next({
    ctx: {
      userId: ctx.userId,
      tenantId,
      userRole: ctx.userRole,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed)
