import crypto from 'crypto'

export interface RequestContext {
  nonce: string
  timestamp: number
  ipAddress: string
  userAgent: string
}

class ReplayProtection {
  private processedNonces = new Map<string, number>()
  private nonceExpiry = 300000 // 5 minutes
  private cleanupInterval = 60000 // 1 minute

  constructor() {
    // Cleanup expired nonces periodically
    setInterval(() => this.cleanupExpiredNonces(), this.cleanupInterval)
  }

  generateNonce(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  createRequestContext(
    ipAddress: string,
    userAgent: string
  ): RequestContext {
    return {
      nonce: this.generateNonce(),
      timestamp: Date.now(),
      ipAddress,
      userAgent,
    }
  }

  validateNonce(nonce: string, context: RequestContext): boolean {
    const now = Date.now()
    const nonceTimestamp = this.processedNonces.get(nonce)

    // Check if nonce has been used
    if (nonceTimestamp !== undefined) {
      return false
    }

    // Check if nonce is fresh (within expiry window)
    if (now - context.timestamp > this.nonceExpiry) {
      return false
    }

    // Mark nonce as used
    this.processedNonces.set(nonce, now)
    return true
  }

  validateStateParam(state: string, storedState: string): boolean {
    if (!state || !storedState) {
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(state),
      Buffer.from(storedState)
    )
  }

  validateCallback(
    nonce: string,
    state: string,
    storedState: string,
    context: RequestContext
  ): { valid: boolean; reason?: string } {
    // Validate nonce
    if (!this.validateNonce(nonce, context)) {
      return { valid: false, reason: 'Invalid or expired nonce' }
    }

    // Validate state
    try {
      if (!this.validateStateParam(state, storedState)) {
        return { valid: false, reason: 'State parameter mismatch' }
      }
    } catch (error) {
      return { valid: false, reason: 'Invalid state validation' }
    }

    return { valid: true }
  }

  private cleanupExpiredNonces() {
    const now = Date.now()
    const expiredNonces: string[] = []

    this.processedNonces.forEach((timestamp, nonce) => {
      if (now - timestamp > this.nonceExpiry) {
        expiredNonces.push(nonce)
      }
    })

    expiredNonces.forEach((nonce) => {
      this.processedNonces.delete(nonce)
    })

    if (expiredNonces.length > 0) {
      console.log(`[ReplayProtection] Cleaned up ${expiredNonces.length} expired nonces`)
    }
  }
}

export const replayProtection = new ReplayProtection()
