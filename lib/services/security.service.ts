'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { SecurityIncident, IPBlocklist, IncidentType, IncidentSeverity } from '@/lib/types/security.types'

export async function createSecurityIncident(
  userId: string | null,
  incidentType: IncidentType,
  severity: IncidentSeverity,
  description: string,
  ipAddress: string,
  locationData: Record<string, any> | null = null
): Promise<SecurityIncident | null> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('security_incidents')
      .insert({
        user_id: userId,
        incident_type: incidentType,
        severity,
        description,
        ip_address: ipAddress,
        location_data: locationData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error creating security incident:', error)
    return null
  }
}

export async function getIncidentsByUser(userId: string, limit: number = 50): Promise<SecurityIncident[]> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('security_incidents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error getting incidents:', error)
    return []
  }
}

export async function getAllIncidents(limit: number = 100): Promise<SecurityIncident[]> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('security_incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error getting all incidents:', error)
    return []
  }
}

export async function resolveIncident(incidentId: string, note: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdminClient()
      .from('security_incidents')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      })
      .eq('id', incidentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error resolving incident:', error)
    return false
  }
}

export async function addToIPBlocklist(
  ipAddress: string,
  reason: string,
  isPermanent: boolean = false,
  blockedUntil: Date | null = null,
  blockedBy: string | null = null
): Promise<IPBlocklist | null> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('ip_blocklist')
      .insert({
        ip_address: ipAddress,
        blocked_reason: reason,
        is_permanent: isPermanent,
        blocked_until: blockedUntil?.toISOString() || null,
        blocked_by: blockedBy,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[v0] Error adding to blocklist:', error)
    return null
  }
}

export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('ip_blocklist')
      .select('id')
      .eq('ip_address', ipAddress)
      .or(`is_permanent.eq.true,blocked_until.gt.${new Date().toISOString()}`)
      .limit(1)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

export async function getIPBlocklist(limit: number = 100): Promise<IPBlocklist[]> {
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from('ip_blocklist')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[v0] Error getting blocklist:', error)
    return []
  }
}

export async function removeFromIPBlocklist(ipAddress: string): Promise<boolean> {
  try {
    const { error } = await getSupabaseAdminClient()
      .from('ip_blocklist')
      .delete()
      .eq('ip_address', ipAddress)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[v0] Error removing from blocklist:', error)
    return false
  }
}

export async function checkSuspiciousActivity(userId: string, currentIp: string): Promise<boolean> {
  try {
    // Check for multiple failed 2FA attempts
    const { count: failedAttempts, error: error1 } = await getSupabaseAdminClient()
      .from('two_fa_log')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 15 * 60000).toISOString()) // Last 15 minutes

    if (!error1 && failedAttempts && failedAttempts >= 5) {
      await createSecurityIncident(
        userId,
        'brute_force',
        'high',
        'Multiple failed 2FA attempts detected',
        currentIp
      )
      return true
    }

    // Check for impossible travel
    const { data: recentActivity, error: error2 } = await getSupabaseAdminClient()
      .from('user_activity_logs')
      .select('ip_address, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(2)

    if (!error2 && recentActivity && recentActivity.length >= 2) {
      const timeDiff = new Date(recentActivity[0].created_at).getTime() - new Date(recentActivity[1].created_at).getTime()
      // If last 2 logins are less than 5 minutes apart from different IPs
      if (timeDiff < 5 * 60000 && recentActivity[0].ip_address !== recentActivity[1].ip_address) {
        await createSecurityIncident(
          userId,
          'impossible_travel',
          'critical',
          'Suspicious activity: Login from different locations in short time',
          currentIp
        )
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[v0] Error checking suspicious activity:', error)
    return false
  }
}
