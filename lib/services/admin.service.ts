'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { AdminUser, AdminAuditLog, AdminSetting, DashboardStats, PaginationParams, PaginatedResponse } from '@/lib/types/admin.types'

// =====================================================
// ADMIN USER FUNCTIONS
// =====================================================

export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching admin user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in getAdminUser:', error)
    return null
  }
}

export async function getAllAdminUsers(
  params?: PaginationParams
): Promise<PaginatedResponse<AdminUser>> {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = params || {}
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact' })
      .order(sort_by as any, { ascending: sort_order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('[v0] Error fetching admin users:', error)
      return { data: [], total: 0, page, limit, has_more: false }
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    }
  } catch (error) {
    console.error('[v0] Exception in getAllAdminUsers:', error)
    return { data: [], total: 0, page: 1, limit: 10, has_more: false }
  }
}

export async function updateAdminUser(
  userId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser | null> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating admin user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in updateAdminUser:', error)
    return null
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const adminUser = await getAdminUser(userId)
    return !!adminUser && adminUser.is_active
  } catch (error) {
    console.error('[v0] Exception in isUserAdmin:', error)
    return false
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const adminUser = await getAdminUser(userId)
    if (!adminUser || !adminUser.is_active) {
      return false
    }

    return adminUser.permissions.includes(permission) || adminUser.role === 'super_admin'
  } catch (error) {
    console.error('[v0] Exception in hasPermission:', error)
    return false
  }
}

// =====================================================
// AUDIT LOG FUNCTIONS
// =====================================================

export async function createAuditLog(
  adminId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string,
  changes?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
  status: 'success' | 'failed' = 'success',
  errorMessage?: string
): Promise<AdminAuditLog | null> {
  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        ip_address: ipAddress,
        user_agent: userAgent,
        status,
        error_message: errorMessage,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating audit log:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in createAuditLog:', error)
    return null
  }
}

export async function getAuditLogs(
  params?: PaginationParams & { admin_id?: string; action?: string }
): Promise<PaginatedResponse<AdminAuditLog>> {
  try {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', admin_id, action } = params || {}
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase.from('admin_audit_logs').select('*', { count: 'exact' })

    if (admin_id) {
      query = query.eq('admin_id', admin_id)
    }

    if (action) {
      query = query.eq('action', action)
    }

    const { data, error, count } = await query
      .order(sort_by as any, { ascending: sort_order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('[v0] Error fetching audit logs:', error)
      return { data: [], total: 0, page, limit, has_more: false }
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > to + 1,
    }
  } catch (error) {
    console.error('[v0] Exception in getAuditLogs:', error)
    return { data: [], total: 0, page: 1, limit: 20, has_more: false }
  }
}

// =====================================================
// SETTINGS FUNCTIONS
// =====================================================

export async function getSetting(settingKey: string): Promise<AdminSetting | null> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('setting_key', settingKey)
      .single()

    if (error) {
      console.error('[v0] Error fetching setting:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in getSetting:', error)
    return null
  }
}

export async function updateSetting(settingKey: string, value: any): Promise<AdminSetting | null> {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key: settingKey,
        setting_value: value,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating setting:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in updateSetting:', error)
    return null
  }
}

export async function getAllSettings(): Promise<AdminSetting[]> {
  try {
    const { data, error } = await supabase.from('admin_settings').select('*')

    if (error) {
      console.error('[v0] Error fetching settings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Exception in getAllSettings:', error)
    return []
  }
}

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // Get login statistics
    const { data: loginStats } = await supabase
      .from('login_audit')
      .select('status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const totalLoginAttempts = loginStats?.length || 0
    const successfulLogins = loginStats?.filter(l => l.status === 'success').length || 0
    const failedLogins = loginStats?.filter(l => l.status === 'failed').length || 0

    // Get active sessions
    const { count: activeSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    // Get provider statistics
    const { data: providers } = await supabase.from('auth_providers').select('*')

    // Get recent logins
    const { data: recentLogins } = await supabase
      .from('login_audit')
      .select('id, email, provider, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    // Get login trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const loginTrend = await Promise.all(
      last7Days.map(async (date) => {
        const { data } = await supabase
          .from('login_audit')
          .select('status')
          .gte('created_at', `${date}T00:00:00Z`)
          .lt('created_at', `${date}T23:59:59Z`)

        const successful = data?.filter(l => l.status === 'success').length || 0
        const failed = data?.filter(l => l.status === 'failed').length || 0

        return {
          date,
          count: data?.length || 0,
          successful,
          failed,
        }
      })
    )

    return {
      total_users: totalUsers || 0,
      total_login_attempts: totalLoginAttempts,
      successful_logins: successfulLogins,
      failed_logins: failedLogins,
      active_sessions: activeSessions || 0,
      providers:
        providers?.map(p => ({
          name: p.name,
          type: p.type,
          login_count: p.login_count,
          success_rate: p.success_rate,
          is_active: p.is_active,
        })) || [],
      recent_logins: recentLogins || [],
      login_trend: loginTrend,
    }
  } catch (error) {
    console.error('[v0] Exception in getDashboardStats:', error)
    return null
  }
}
