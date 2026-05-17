import { authMonitor } from '@/lib/monitoring/auth-monitor'

export interface RefreshTokenResponse {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
  retryAfter?: number
}

const MAX_RETRY_ATTEMPTS = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 10000 // 10 seconds

class TokenRefreshManager {
  private refreshInProgress = new Map<string, Promise<RefreshTokenResponse>>()

  async refreshAccessToken(
    userId: string,
    refreshToken: string,
    provider: string
  ): Promise<RefreshTokenResponse> {
    // Deduplicate concurrent refresh requests
    const key = `${userId}:${provider}`
    if (this.refreshInProgress.has(key)) {
      return this.refreshInProgress.get(key)!
    }

    const promise = this.performTokenRefresh(userId, refreshToken, provider)
    this.refreshInProgress.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.refreshInProgress.delete(key)
    }
  }

  private async performTokenRefresh(
    userId: string,
    refreshToken: string,
    provider: string
  ): Promise<RefreshTokenResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            refreshToken,
            provider,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()

          // 401/403 errors are not retryable
          if (response.status === 401 || response.status === 403) {
            return {
              success: false,
              error: errorData.error || 'Unauthorized',
            }
          }

          throw new Error(errorData.error || 'Token refresh failed')
        }

        const data = await response.json()

        console.log(
          `[TokenRefresh] Successfully refreshed token for user ${userId}`
        )

        authMonitor.recordLoginAttempt({
          userId,
          email: '',
          provider,
          status: 'success',
          ipAddress: '',
          userAgent: '',
          timestamp: new Date(),
        })

        return {
          success: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        }
      } catch (error) {
        lastError = error as Error
        console.warn(
          `[TokenRefresh] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed:`,
          error
        )

        if (attempt < MAX_RETRY_ATTEMPTS) {
          const delay = this.calculateBackoffDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    console.error(
      `[TokenRefresh] All retry attempts failed for user ${userId}:`,
      lastError
    )

    authMonitor.recordLoginAttempt({
      userId,
      email: '',
      provider,
      status: 'failed',
      ipAddress: '',
      userAgent: '',
      timestamp: new Date(),
      errorMessage: lastError?.message,
    })

    return {
      success: false,
      error: lastError?.message || 'Token refresh failed after retries',
      retryAfter: MAX_RETRY_DELAY / 1000,
    }
  }

  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
    const delay = Math.min(exponentialDelay, MAX_RETRY_DELAY)
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * delay * 0.1
    return delay + jitter
  }

  async handleProviderFailover(
    userId: string,
    primaryProvider: string,
    fallbackProviders: string[]
  ): Promise<RefreshTokenResponse> {
    const providers = [primaryProvider, ...fallbackProviders]

    for (const provider of providers) {
      try {
        const response = await fetch('/api/auth/get-refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, provider }),
        })

        if (response.ok) {
          const { refreshToken } = await response.json()
          return this.refreshAccessToken(userId, refreshToken, provider)
        }
      } catch (error) {
        console.warn(
          `[TokenRefresh] Failover to provider ${provider} failed:`,
          error
        )
      }
    }

    return {
      success: false,
      error: 'All providers failed for token refresh',
    }
  }
}

export const tokenRefreshManager = new TokenRefreshManager()
