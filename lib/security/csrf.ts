import crypto from 'crypto'

/**
 * CSRF Token generation and validation
 * In production, consider using specialized libraries like `csrf` or `csurf`
 */

const CSRF_TOKENS = new Map<string, { token: string; createdAt: number; expiresAt: number }>()
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  const now = Date.now()

  // Store token with expiration
  CSRF_TOKENS.set(sessionId, {
    token,
    createdAt: now,
    expiresAt: now + CSRF_TOKEN_EXPIRY,
  })

  // Clean up expired tokens (simple cleanup)
  if (CSRF_TOKENS.size > 1000) {
    for (const [key, value] of CSRF_TOKENS.entries()) {
      if (now > value.expiresAt) {
        CSRF_TOKENS.delete(key)
      }
    }
  }

  return token
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = CSRF_TOKENS.get(sessionId)

  if (!stored) {
    return false
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    CSRF_TOKENS.delete(sessionId)
    return false
  }

  // Validate token using constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  )
}

/**
 * Invalidate a CSRF token (after use)
 */
export function invalidateCSRFToken(sessionId: string): void {
  CSRF_TOKENS.delete(sessionId)
}

/**
 * Get a valid CSRF token for a session, generating one if needed
 */
export function getOrGenerateCSRFToken(sessionId: string): string {
  const existing = CSRF_TOKENS.get(sessionId)

  if (existing && Date.now() <= existing.expiresAt) {
    return existing.token
  }

  return generateCSRFToken(sessionId)
}
