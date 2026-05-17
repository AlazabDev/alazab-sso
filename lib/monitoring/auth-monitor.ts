export interface LoginEvent {
  id: string
  userId: string
  email: string
  provider: 'google' | 'apple' | 'facebook' | 'github' | 'entra' | 'email'
  status: 'success' | 'failed'
  ipAddress: string
  userAgent: string
  timestamp: Date
  errorMessage?: string
  duration?: number // milliseconds
}

export interface ProviderMetrics {
  provider: string
  totalAttempts: number
  successfulLogins: number
  failedLogins: number
  successRate: number
  averageLoginTime: number
  lastUsed: Date
}

export interface SessionMetrics {
  activeSessions: number
  totalSessions: number
  averageSessionDuration: number
  sessionsPerProvider: Record<string, number>
}

class AuthMonitor {
  private loginEvents: LoginEvent[] = []
  private sessionEvents: Map<string, Date> = new Map() // userId -> login time
  private maxEventHistory = 10000

  recordLoginAttempt(event: Omit<LoginEvent, 'id'>) {
    const loginEvent: LoginEvent = {
      ...event,
      id: `login-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.loginEvents.push(loginEvent)

    // Keep only recent events
    if (this.loginEvents.length > this.maxEventHistory) {
      this.loginEvents = this.loginEvents.slice(-this.maxEventHistory)
    }

    // Log successful logins
    if (event.status === 'success') {
      this.sessionEvents.set(event.userId, new Date())
      console.log(
        `[AuthMonitor] Login success: ${event.email} via ${event.provider}`
      )
    } else {
      console.warn(
        `[AuthMonitor] Login failed: ${event.email} via ${event.provider} - ${event.errorMessage}`
      )
    }
  }

  getLoginEvents(filters?: {
    userId?: string
    provider?: string
    status?: 'success' | 'failed'
    startDate?: Date
    endDate?: Date
    limit?: number
  }): LoginEvent[] {
    let events = [...this.loginEvents]

    if (filters) {
      if (filters.userId) {
        events = events.filter((e) => e.userId === filters.userId)
      }
      if (filters.provider) {
        events = events.filter((e) => e.provider === filters.provider)
      }
      if (filters.status) {
        events = events.filter((e) => e.status === filters.status)
      }
      if (filters.startDate) {
        events = events.filter((e) => e.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        events = events.filter((e) => e.timestamp <= filters.endDate!)
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    if (filters?.limit) {
      events = events.slice(0, filters.limit)
    }

    return events
  }

  getProviderMetrics(): ProviderMetrics[] {
    const providers = new Map<string, ProviderMetrics>()

    this.loginEvents.forEach((event) => {
      if (!providers.has(event.provider)) {
        providers.set(event.provider, {
          provider: event.provider,
          totalAttempts: 0,
          successfulLogins: 0,
          failedLogins: 0,
          successRate: 0,
          averageLoginTime: 0,
          lastUsed: event.timestamp,
        })
      }

      const metrics = providers.get(event.provider)!
      metrics.totalAttempts++
      metrics.lastUsed = event.timestamp

      if (event.status === 'success') {
        metrics.successfulLogins++
        if (event.duration) {
          metrics.averageLoginTime =
            (metrics.averageLoginTime * (metrics.successfulLogins - 1) +
              event.duration) /
            metrics.successfulLogins
        }
      } else {
        metrics.failedLogins++
      }

      metrics.successRate = (metrics.successfulLogins / metrics.totalAttempts) * 100
    })

    return Array.from(providers.values())
  }

  getSessionMetrics(): SessionMetrics {
    const now = new Date()
    const activeSessions = this.sessionEvents.size

    const sessionsPerProvider: Record<string, number> = {}
    let sessionDurations: number[] = []

    this.loginEvents
      .filter((e) => e.status === 'success')
      .forEach((event) => {
        if (!sessionsPerProvider[event.provider]) {
          sessionsPerProvider[event.provider] = 0
        }
        sessionsPerProvider[event.provider]++

        const duration = now.getTime() - event.timestamp.getTime()
        sessionDurations.push(duration)
      })

    const averageSessionDuration =
      sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) /
          sessionDurations.length
        : 0

    return {
      activeSessions,
      totalSessions: this.loginEvents.filter((e) => e.status === 'success')
        .length,
      averageSessionDuration,
      sessionsPerProvider,
    }
  }

  getUserLoginHistory(userId: string, limit: number = 50): LoginEvent[] {
    return this.getLoginEvents({ userId, limit })
  }

  detectSuspiciousActivity(threshold: number = 5): {
    ipAddress: string
    failedAttempts: number
    lastAttempt: Date
  }[] {
    const failuresByIp = new Map<
      string,
      { count: number; lastAttempt: Date }
    >()

    this.loginEvents
      .filter((e) => e.status === 'failed')
      .forEach((event) => {
        if (!failuresByIp.has(event.ipAddress)) {
          failuresByIp.set(event.ipAddress, {
            count: 0,
            lastAttempt: event.timestamp,
          })
        }

        const stats = failuresByIp.get(event.ipAddress)!
        stats.count++
        stats.lastAttempt = event.timestamp
      })

    return Array.from(failuresByIp.entries())
      .filter(([_, stats]) => stats.count >= threshold)
      .map(([ip, stats]) => ({
        ipAddress: ip,
        failedAttempts: stats.count,
        lastAttempt: stats.lastAttempt,
      }))
  }

  exportMetrics() {
    return {
      timestamp: new Date(),
      totalEvents: this.loginEvents.length,
      providerMetrics: this.getProviderMetrics(),
      sessionMetrics: this.getSessionMetrics(),
      suspiciousActivity: this.detectSuspiciousActivity(),
    }
  }
}

export const authMonitor = new AuthMonitor()
