'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { Notification, NotificationPreferences } from '@/lib/types/phase1.types'

/**
 * Send notification to user
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  options?: {
    notificationType?: 'login' | 'security' | 'account' | 'admin' | 'system'
    actionUrl?: string
    sentVia?: ('in_app' | 'email' | 'push' | 'sms')[]
    metadata?: Record<string, any>
    expiresAt?: Date
  }
) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: options?.notificationType || 'system',
        title,
        message,
        action_url: options?.actionUrl,
        sent_via: options?.sentVia || ['in_app'],
        metadata: options?.metadata,
        expires_at: options?.expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Send via email if configured
    if (options?.sentVia?.includes('email')) {
      await sendEmailNotification(userId, title, message)
    }

    return data
  } catch (error) {
    console.error('[Notification Service] Error sending notification:', error)
    throw error
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
    isRead?: boolean
  }
): Promise<{ data: Notification[]; total: number }> {
  try {
    const supabase = getSupabaseAdminClient()
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (options?.isRead !== undefined) {
      query = query.eq('is_read', options.isRead)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('[Notification Service] Error fetching notifications:', error)
    throw error
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Notification Service] Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[Notification Service] Error marking all as read:', error)
    throw error
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[Notification Service] Error deleting notification:', error)
    throw error
  }
}

/**
 * Get or create notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  try {
    const supabase = getSupabaseAdminClient()

    let { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found, create default preferences
      const defaultPrefs = {
        user_id: userId,
        login_notifications: true,
        security_notifications: true,
        account_notifications: true,
        admin_notifications: false,
        system_notifications: true,
        email_login: true,
        email_security: true,
        email_account: false,
        email_admin: false,
        email_system: false,
        push_enabled: false,
      }

      const { data: newData, error: createError } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single()

      if (createError) throw createError
      return newData
    }

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Notification Service] Error getting preferences:', error)
    throw error
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Notification Service] Error updating preferences:', error)
    throw error
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient()

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('[Notification Service] Error getting unread count:', error)
    throw error
  }
}

/**
 * Send email notification (placeholder)
 */
async function sendEmailNotification(userId: string, title: string, message: string) {
  try {
    // This is a placeholder for email sending logic
    // In production, this would integrate with SendGrid, Mailgun, etc.
    console.log(`[Email] Sending to user ${userId}: ${title}`)
  } catch (error) {
    console.error('[Notification Service] Error sending email:', error)
  }
}
