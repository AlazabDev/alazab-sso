'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { UserActivityLog, ActivityFilterOptions, PaginatedResponse } from '@/lib/types/phase1.types'

/**
 * Log user activity
 */
export async function logUserActivity(
  userId: string,
  action: string,
  actionType: string,
  options?: {
    resourceType?: string
    resourceId?: string
    description?: string
    ipAddress?: string
    userAgent?: string
    deviceInfo?: Record<string, any>
    status?: 'success' | 'failed'
    errorMessage?: string
    metadata?: Record<string, any>
  }
) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action,
        action_type: actionType,
        resource_type: options?.resourceType,
        resource_id: options?.resourceId,
        description: options?.description,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        device_info: options?.deviceInfo,
        status: options?.status || 'success',
        error_message: options?.errorMessage,
        metadata: options?.metadata,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Activity Service] Error logging activity:', error)
    throw error
  }
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  options?: ActivityFilterOptions
): Promise<PaginatedResponse<UserActivityLog>> {
  try {
    const supabase = getSupabaseAdminClient()
    const limit = options?.limit || 20
    const offset = options?.offset || 0

    let query = supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (options?.action_type) {
      query = query.eq('action_type', options.action_type)
    }

    if (options?.date_from) {
      query = query.gte('created_at', options.date_from.toISOString())
    }

    if (options?.date_to) {
      query = query.lte('created_at', options.date_to.toISOString())
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (offset + limit) < (count || 0),
    }
  } catch (error) {
    console.error('[Activity Service] Error fetching activity logs:', error)
    throw error
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(userId: string, limit: number = 10) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[Activity Service] Error fetching recent activities:', error)
    throw error
  }
}

/**
 * Get activity statistics
 */
export async function getActivityStatistics(userId: string, daysBack: number = 7) {
  try {
    const supabase = getSupabaseAdminClient()
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - daysBack)

    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('action_type, status')
      .eq('user_id', userId)
      .gte('created_at', dateFrom.toISOString())

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      successful: data?.filter(log => log.status === 'success').length || 0,
      failed: data?.filter(log => log.status === 'failed').length || 0,
      byType: {} as Record<string, number>,
    }

    data?.forEach(log => {
      stats.byType[log.action_type] = (stats.byType[log.action_type] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('[Activity Service] Error fetching activity statistics:', error)
    throw error
  }
}
