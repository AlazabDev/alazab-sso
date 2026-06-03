'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/client'
import type { AuthProvider, ProviderFormData, ProviderFilters, PaginationParams, PaginatedResponse } from '@/lib/types/admin.types'

// =====================================================
// PROVIDER CRUD FUNCTIONS
// =====================================================

export async function getProvider(id: string): Promise<AuthProvider | null> {
  try {
    const { data, error } = await supabase
      .from('auth_providers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[v0] Error fetching provider:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in getProvider:', error)
    return null
  }
}

export async function getProviderByKey(providerKey: string): Promise<AuthProvider | null> {
  try {
    const { data, error } = await supabase
      .from('auth_providers')
      .select('*')
      .eq('provider_key', providerKey)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[v0] Error fetching provider by key:', error)
    }

    return data || null
  } catch (error) {
    console.error('[v0] Exception in getProviderByKey:', error)
    return null
  }
}

export async function getAllProviders(
  filters?: ProviderFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<AuthProvider>> {
  try {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc' } = params || {}
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase.from('auth_providers').select('*', { count: 'exact' })

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,provider_key.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    const { data, error, count } = await query
      .order(sort_by as any, { ascending: sort_order === 'asc' })
      .range(from, to)

    if (error) {
      console.error('[v0] Error fetching providers:', error)
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
    console.error('[v0] Exception in getAllProviders:', error)
    return { data: [], total: 0, page: 1, limit: 10, has_more: false }
  }
}

export async function createProvider(formData: ProviderFormData): Promise<AuthProvider | null> {
  try {
    // Check if provider_key already exists
    const existing = await getProviderByKey(formData.provider_key)
    if (existing) {
      throw new Error('Provider key already exists')
    }

    const { data, error } = await supabase
      .from('auth_providers')
      .insert({
        name: formData.name,
        type: formData.type,
        provider_key: formData.provider_key,
        client_id: formData.client_id,
        client_secret: formData.client_secret,
        redirect_uri: formData.redirect_uri,
        scopes: formData.scopes,
        logo_url: formData.logo_url,
        description: formData.description,
        is_active: formData.is_active,
        is_configured: true,
        config: {
          created_via_admin: true,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating provider:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in createProvider:', error)
    return null
  }
}

export async function updateProvider(id: string, formData: Partial<ProviderFormData>): Promise<AuthProvider | null> {
  try {
    const updateData: any = {}

    if (formData.name) updateData.name = formData.name
    if (formData.client_id) updateData.client_id = formData.client_id
    if (formData.client_secret) updateData.client_secret = formData.client_secret
    if (formData.redirect_uri) updateData.redirect_uri = formData.redirect_uri
    if (formData.scopes) updateData.scopes = formData.scopes
    if (formData.logo_url) updateData.logo_url = formData.logo_url
    if (formData.description) updateData.description = formData.description
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active

    const { data, error } = await supabase
      .from('auth_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating provider:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in updateProvider:', error)
    return null
  }
}

export async function deleteProvider(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('auth_providers').delete().eq('id', id)

    if (error) {
      console.error('[v0] Error deleting provider:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Exception in deleteProvider:', error)
    return false
  }
}

export async function toggleProviderStatus(id: string, isActive: boolean): Promise<AuthProvider | null> {
  try {
    const { data, error } = await supabase
      .from('auth_providers')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error toggling provider status:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[v0] Exception in toggleProviderStatus:', error)
    return null
  }
}

// =====================================================
// PROVIDER STATISTICS
// =====================================================

export async function getProviderStats(providerId: string) {
  try {
    // Get total logins
    const { count: totalLogins } = await supabase
      .from('login_audit')
      .select('*', { count: 'exact', head: true })
      .eq('provider', providerId)

    // Get successful logins
    const { count: successfulLogins } = await supabase
      .from('login_audit')
      .select('*', { count: 'exact', head: true })
      .eq('provider', providerId)
      .eq('status', 'success')

    // Get failed logins
    const { count: failedLogins } = await supabase
      .from('login_audit')
      .select('*', { count: 'exact', head: true })
      .eq('provider', providerId)
      .eq('status', 'failed')

    const successRate = totalLogins ? ((successfulLogins || 0) / totalLogins) * 100 : 0

    return {
      total_logins: totalLogins || 0,
      successful_logins: successfulLogins || 0,
      failed_logins: failedLogins || 0,
      success_rate: parseFloat(successRate.toFixed(2)),
    }
  } catch (error) {
    console.error('[v0] Exception in getProviderStats:', error)
    return {
      total_logins: 0,
      successful_logins: 0,
      failed_logins: 0,
      success_rate: 0,
    }
  }
}

// =====================================================
// PROVIDER SECRET MANAGEMENT
// =====================================================

export async function rotateProviderSecret(id: string, newClientSecret: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auth_providers')
      .update({
        client_secret: newClientSecret,
        config: supabase.rpc('jsonb_set', {
          target: { config: { secret_rotated_at: new Date().toISOString() } },
        }),
      })
      .eq('id', id)

    if (error) {
      console.error('[v0] Error rotating provider secret:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[v0] Exception in rotateProviderSecret:', error)
    return false
  }
}

export async function getActiveProviders(): Promise<AuthProvider[]> {
  try {
    const { data, error } = await supabase
      .from('auth_providers')
      .select('*')
      .eq('is_active', true)
      .eq('is_configured', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching active providers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Exception in getActiveProviders:', error)
    return []
  }
}
