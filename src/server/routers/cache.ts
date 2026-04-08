import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// Simple in-memory cache (for production, use Redis)
// Key format: "tenant:cacheKey"
// Value: { data: any, expiresAt: number }

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cacheStore = new Map<string, CacheEntry<unknown>>()

// Configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes
  
  // Per-endpoint TTL overrides
  LIST_TTL: 60, // 1 minute for list queries
  GET_TTL: 300, // 5 minutes for single item queries
  DASHBOARD_TTL: 30, // 30 seconds for dashboard
  SEARCH_TTL: 60, // 1 minute for search results
  
  // Max cache size (entries)
  MAX_SIZE: 1000,
}

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cacheStore.entries()) {
    if (value.expiresAt < now) {
      cacheStore.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Get cache key for tenant
 */
function getCacheKey(tenantId: string, key: string): string {
  return `${tenantId}:${key}`
}

/**
 * Get value from cache
 */
function getFromCache<T>(tenantId: string, key: string): T | null {
  const fullKey = getCacheKey(tenantId, key)
  const entry = cacheStore.get(fullKey)
  
  if (!entry) return null
  
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(fullKey)
    return null
  }
  
  return entry.data as T
}

/**
 * Set value in cache
 */
function setInCache<T>(tenantId: string, key: string, data: T, ttlSeconds: number): void {
  // Enforce max size
  if (cacheStore.size >= CACHE_CONFIG.MAX_SIZE) {
    // Remove oldest entries (first 10%)
    const keysToDelete = Array.from(cacheStore.keys()).slice(0, Math.floor(CACHE_CONFIG.MAX_SIZE * 0.1))
    keysToDelete.forEach((k) => cacheStore.delete(k))
  }
  
  const fullKey = getCacheKey(tenantId, key)
  cacheStore.set(fullKey, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Invalidate cache for tenant
 */
function invalidateCache(tenantId: string, pattern?: string): number {
  let deleted = 0
  
  for (const key of cacheStore.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      if (!pattern || key.includes(pattern)) {
        cacheStore.delete(key)
        deleted++
      }
    }
  }
  
  return deleted
}

// Cache Router - for managing cache
export const cacheRouter = router({
  // Get cache stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx
    
    if (!tenantId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant não encontrado",
      })
    }
    
    const now = Date.now()
    let tenantEntries = 0
    let expiredEntries = 0
    
    for (const [key, value] of cacheStore.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        tenantEntries++
        if (value.expiresAt < now) {
          expiredEntries++
        }
      }
    }
    
    return {
      totalEntries: cacheStore.size,
      tenantEntries,
      expiredEntries,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      config: CACHE_CONFIG,
    }
  }),

  // Invalidate cache for tenant
  invalidate: protectedProcedure
    .input(
      z.object({
        pattern: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx
      
      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }
      
      const deleted = invalidateCache(tenantId, input.pattern)
      
      return { deleted }
    }),

  // Preload data for better UX (prefetch common queries)
  preload: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        data: z.any(),
        ttl: z.number().min(10).max(3600).optional().default(CACHE_CONFIG.DEFAULT_TTL),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx
      
      if (!tenantId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant não encontrado",
        })
      }
      
      setInCache(tenantId, input.key, input.data, input.ttl)
      
      return { success: true }
    }),
})

// Export cache helpers for use in other routers
export const cacheHelpers = {
  get: getFromCache,
  set: setInCache,
  invalidate: invalidateCache,
  config: CACHE_CONFIG,
  getTTL: (type: string): number => {
    const ttlMap: Record<string, number> = {
      list: CACHE_CONFIG.LIST_TTL,
      get: CACHE_CONFIG.GET_TTL,
      dashboard: CACHE_CONFIG.DASHBOARD_TTL,
      search: CACHE_CONFIG.SEARCH_TTL,
    }
    return ttlMap[type] || CACHE_CONFIG.DEFAULT_TTL
  },
}