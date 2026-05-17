/**
 * In-memory rate limiter for development/small deployments
 * For production at scale, use Redis or similar
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
}

export type RateLimitType = keyof typeof RATE_LIMITS

export function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = `${type}:${identifier}`
  const now = Date.now()
  const limit = RATE_LIMITS[type]

  let entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key)
    entry = undefined
  }

  // Initialize new entry if needed
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + limit.windowMs,
    }
  }

  entry.count++

  const allowed = entry.count <= limit.maxAttempts
  const remaining = Math.max(0, limit.maxAttempts - entry.count)
  const resetTime = entry.resetTime

  rateLimitStore.set(key, entry)

  return {
    allowed,
    remaining,
    resetTime,
  }
}

export function resetRateLimit(identifier: string, type: RateLimitType = 'api') {
  const key = `${type}:${identifier}`
  rateLimitStore.delete(key)
}

export function getRateLimitStatus(identifier: string, type: RateLimitType = 'api') {
  const key = `${type}:${identifier}`
  const entry = rateLimitStore.get(key)
  const limit = RATE_LIMITS[type]

  if (!entry || Date.now() > entry.resetTime) {
    return {
      count: 0,
      remaining: limit.maxAttempts,
      resetTime: Date.now() + limit.windowMs,
    }
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit.maxAttempts - entry.count),
    resetTime: entry.resetTime,
  }
}
