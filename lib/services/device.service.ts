'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { UserDevice } from '@/lib/types/phase1.types'

/**
 * Register or update a device
 */
export async function registerDevice(
  userId: string,
  deviceName: string,
  options?: {
    deviceType?: 'web' | 'mobile' | 'desktop' | 'tablet'
    deviceOs?: string
    browserName?: string
    browserVersion?: string
    ipAddress?: string
    userAgent?: string
  }
) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_devices')
      .insert({
        user_id: userId,
        device_name: deviceName,
        device_type: options?.deviceType,
        device_os: options?.deviceOs,
        browser_name: options?.browserName,
        browser_version: options?.browserVersion,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        last_activity_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Device Service] Error registering device:', error)
    throw error
  }
}

/**
 * Get user devices
 */
export async function getUserDevices(userId: string): Promise<UserDevice[]> {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[Device Service] Error fetching user devices:', error)
    throw error
  }
}

/**
 * Get active devices (with recent activity)
 */
export async function getActiveDevices(userId: string, hoursBack: number = 24) {
  try {
    const supabase = getSupabaseAdminClient()
    const dateFrom = new Date()
    dateFrom.setHours(dateFrom.getHours() - hoursBack)

    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .gte('last_activity_at', dateFrom.toISOString())
      .order('last_activity_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[Device Service] Error fetching active devices:', error)
    throw error
  }
}

/**
 * Update device last activity
 */
export async function updateDeviceLastActivity(deviceId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_devices')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', deviceId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Device Service] Error updating device activity:', error)
    throw error
  }
}

/**
 * Mark device as trusted
 */
export async function trustDevice(deviceId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_devices')
      .update({ is_trusted: true })
      .eq('id', deviceId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Device Service] Error trusting device:', error)
    throw error
  }
}

/**
 * Revoke device trust
 */
export async function revokeDeviceTrust(deviceId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('user_devices')
      .update({ is_trusted: false })
      .eq('id', deviceId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('[Device Service] Error revoking device trust:', error)
    throw error
  }
}

/**
 * Delete device
 */
export async function deleteDevice(deviceId: string) {
  try {
    const supabase = getSupabaseAdminClient()

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('[Device Service] Error deleting device:', error)
    throw error
  }
}

/**
 * Get device count
 */
export async function getUserDeviceCount(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient()

    const { count, error } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('[Device Service] Error counting devices:', error)
    throw error
  }
}
