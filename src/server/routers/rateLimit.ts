import { z } from "zod"
import { router, protectedProcedure, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// In-memory rate limiting (for production, use Redis)
// Using a simple token bucket algorithm

interface RateLimitConfig {
  windowMs: number // Window in milliseconds
  maxRequests: number // Max requests per window
}

// In-memory store (reset on restart - use Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configuration per endpoint type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Critical endpoints - stricter limits
  auth: { windowMs: 60000, maxRequests: 10 }, // 10 per minute
  payment: { windowMs: 60000, maxRequests: 30 }, // 30 per minute
  mutation: { windowMs: 60000, maxRequests: 60 }, // 60 mutations per minute
  
  // Read endpoints - more lenient
  list: { windowMs: 60000, maxRequests: 120 }, // 120 per minute
  get: { windowMs: 60000, maxRequests: 180 }, // 180 per minute
  
  // Search - expensive operations
  search: { windowMs: 60000, maxRequests: 20 }, // 20 searches per minute
  
  // Default
  default: { windowMs: 60000, maxRequests: 100 }, // 100 per minute
}

// Clean old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Check rate limit for a key
 * @param key - Unique identifier (user ID + endpoint type)
 * @param limitType - Type of endpoint
 * @returns true if allowed, false if exceeded
 */
function checkRateLimit(key: string, limitType: string): boolean {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return true
  }
  
  // Check if within limit
  if (current.count >= config.maxRequests) {
    return false
  }
  
  // Increment count
  current.count++
  return true
}

/**
 * Get rate limit info for response headers
 */
function getRateLimitInfo(key: string, limitType: string) {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < Date.now()) {
    return { remaining: config.maxRequests, reset: Date.now() + config.windowMs }
  }
  
  return {
    remaining: Math.max(0, config.maxRequests - current.count),
    reset: current.resetTime,
  }
}

// Rate limiting middleware helper
export function getRateLimitKey(userId: string | null, ip: string, endpoint: string): string {
  const identifier = userId || ip
  return `${identifier}:${endpoint}`
}

export function validateRateLimit(
  userId: string | null,
  ip: string,
  endpoint: string,
  limitType: string
): void {
  const key = getRateLimitKey(userId, ip, endpoint)
  
  if (!checkRateLimit(key, limitType)) {
    const info = getRateLimitInfo(key, limitType)
    const retryAfter = Math.ceil((info.reset - Date.now()) / 1000)
    
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Limite de requisições excedido. Tente novamente em alguns segundos.",
      cause: {
        retryAfter,
        limit: RATE_LIMITS[limitType]?.maxRequests || 100,
      },
    })
  }
}

// Get rate limit headers for response
export function getRateLimitHeaders(limitType: string, userId: string | null, ip: string) {
  const key = getRateLimitKey(userId, ip, limitType)
  const info = getRateLimitInfo(key, limitType)
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default
  
  return {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": info.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(info.reset / 1000).toString(),
  }
}

// Rate Limiting Router - for admin to view rate limit status
export const rateLimitRouter = router({
  // Get current rate limit status for tenant
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx
    
    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant não encontrado",
      })
    }
    
    // Get stats from store
    const now = Date.now()
    let totalRequests = 0
    let activeKeys = 0
    
    for (const [key, value] of rateLimitStore.entries()) {
      if (key.startsWith(tenantId)) {
        activeKeys++
        if (value.resetTime >= now) {
          totalRequests += value.count
        }
      }
    }
    
    return {
      activeEndpoints: activeKeys,
      totalRequestsInWindow: totalRequests,
      configuredLimits: RATE_LIMITS,
    }
  }),

  // Reset rate limits for a user (admin action)
  resetUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const keysToDelete: string[] = []
      
      for (const key of rateLimitStore.keys()) {
        if (key.startsWith(input.userId)) {
          keysToDelete.push(key)
        }
      }
      
      keysToDelete.forEach((key) => rateLimitStore.delete(key))
      
      return { reset: keysToDelete.length }
    }),
})