import { createClient } from '@/lib/supabase/server'

/**
 * Session Management utilities
 * Handles session creation, validation, and cleanup
 */

export interface SessionData {
  userId: string
  userEmail: string
  lastActivity: Date
  deviceInfo?: {
    userAgent?: string
    ipAddress?: string
    platform?: string
  }
  isRemembered: boolean
}

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Create a new session in the database
 */
export async function createSession(
  userId: string,
  userEmail: string,
  deviceInfo?: {
    userAgent?: string
    ipAddress?: string
  }
) {
  const supabase = await createClient()

  const sessionToken = require('crypto').randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS)

  const { error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      device_info: {
        user_agent: deviceInfo?.userAgent,
        ip_address: deviceInfo?.ipAddress,
      },
      ip_address: deviceInfo?.ipAddress,
      user_agent: deviceInfo?.userAgent,
      last_activity_at: now,
      expires_at: expiresAt,
      is_active: true,
    })

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return sessionToken
}

/**
 * Validate an existing session
 */
export async function validateSession(sessionToken: string) {
  const supabase = await createClient()
  const now = new Date()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, user_id, expires_at, last_activity_at, is_active')
    .eq('session_token', sessionToken)
    .single()

  if (error || !session) {
    return null
  }

  // Check expiration
  if (new Date(session.expires_at) < now) {
    await invalidateSession(sessionToken)
    return null
  }

  // Check inactivity timeout
  const lastActivity = new Date(session.last_activity_at)
  if (now.getTime() - lastActivity.getTime() > INACTIVITY_TIMEOUT_MS) {
    await invalidateSession(sessionToken)
    return null
  }

  // Check if active
  if (!session.is_active) {
    return null
  }

  return session
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionToken: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      last_activity_at: new Date(),
    })
    .eq('session_token', sessionToken)

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`)
  }
}

/**
 * Invalidate a session
 */
export async function invalidateSession(sessionToken: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      is_active: false,
    })
    .eq('session_token', sessionToken)

  if (error) {
    console.error(`Failed to invalidate session: ${error.message}`)
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId: string) {
  const supabase = await createClient()
  const now = new Date()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, device_info, created_at, last_activity_at, expires_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', now.toISOString())
    .order('last_activity_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get sessions: ${error.message}`)
  }

  return sessions
}

/**
 * Invalidate all sessions for a user (force sign out everywhere)
 */
export async function invalidateAllUserSessions(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      is_active: false,
    })
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to invalidate sessions: ${error.message}`)
  }
}

/**
 * Invalidate a specific session for a user
 */
export async function invalidateUserSession(userId: string, sessionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      is_active: false,
    })
    .eq('id', sessionId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to invalidate session: ${error.message}`)
  }
}

/**
 * Clean up expired sessions (should run periodically)
 */
export async function cleanupExpiredSessions() {
  const supabase = await createClient()
  const now = new Date()

  const { error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', now.toISOString())

  if (error) {
    console.error(`Failed to cleanup sessions: ${error.message}`)
  }
}
