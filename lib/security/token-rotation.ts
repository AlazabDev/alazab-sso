import crypto from 'crypto'

export interface TokenRotationConfig {
  refreshThreshold: number // seconds before expiry to rotate
  maxTokenAge: number // max age of access token
  rotationInterval: number // how often to check for rotation
}

export interface RotatedTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
  rotatedAt: Date
}

const defaultConfig: TokenRotationConfig = {
  refreshThreshold: 300, // 5 minutes before expiry
  maxTokenAge: 3600, // 1 hour
  rotationInterval: 60000, // check every minute
}

class TokenRotationManager {
  private config: TokenRotationConfig
  private tokenStore = new Map<string, RotatedTokens>()
  private rotationTimers = new Map<string, NodeJS.Timer>()

  constructor(config: Partial<TokenRotationConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  generateTokenPair(userId: string, expiresIn: number = 3600) {
    const accessToken = crypto.randomBytes(32).toString('hex')
    const refreshToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    const tokens: RotatedTokens = {
      accessToken,
      refreshToken,
      expiresAt,
      rotatedAt: new Date(),
    }

    this.tokenStore.set(userId, tokens)
    this.setupRotationTimer(userId)

    return tokens
  }

  shouldRotate(userId: string): boolean {
    const tokens = this.tokenStore.get(userId)
    if (!tokens) return false

    const now = new Date()
    const timeUntilExpiry =
      tokens.expiresAt.getTime() - now.getTime()
    const thresholdMs = this.config.refreshThreshold * 1000

    return timeUntilExpiry <= thresholdMs
  }

  rotateTokens(userId: string, expiresIn: number = 3600): RotatedTokens {
    const oldTokens = this.tokenStore.get(userId)

    if (!oldTokens) {
      throw new Error(`No tokens found for user ${userId}`)
    }

    const newTokens = this.generateTokenPair(userId, expiresIn)

    // Invalidate old tokens
    this.tokenStore.delete(userId)
    this.tokenStore.set(userId, newTokens)

    return newTokens
  }

  private setupRotationTimer(userId: string) {
    // Clear existing timer
    const existingTimer = this.rotationTimers.get(userId)
    if (existingTimer) clearInterval(existingTimer)

    // Set up new timer
    const timer = setInterval(() => {
      if (this.shouldRotate(userId)) {
        try {
          this.rotateTokens(userId)
          console.log(`[TokenRotation] Tokens rotated for user ${userId}`)
        } catch (error) {
          console.error(`[TokenRotation] Failed to rotate tokens for ${userId}:`, error)
        }
      }
    }, this.config.rotationInterval)

    this.rotationTimers.set(userId, timer)
  }

  getTokens(userId: string): RotatedTokens | undefined {
    return this.tokenStore.get(userId)
  }

  invalidateTokens(userId: string) {
    this.tokenStore.delete(userId)
    const timer = this.rotationTimers.get(userId)
    if (timer) {
      clearInterval(timer)
      this.rotationTimers.delete(userId)
    }
  }

  validateTokenAge(userId: string): boolean {
    const tokens = this.tokenStore.get(userId)
    if (!tokens) return false

    const tokenAge = Date.now() - tokens.rotatedAt.getTime()
    return tokenAge <= this.config.maxTokenAge * 1000
  }
}

export const tokenRotationManager = new TokenRotationManager()
