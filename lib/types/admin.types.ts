// =====================================================
// Admin Types & Interfaces
// =====================================================

// Admin Roles
export type AdminRole = 'super_admin' | 'admin' | 'provider_manager' | 'viewer'

// Admin User
export interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  permissions: string[]
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

// Auth Provider Types
export type ProviderType = 'oauth' | 'oidc' | 'email' | 'sms' | 'sso'

export interface AuthProvider {
  id: string
  name: string
  type: ProviderType
  provider_key: string
  is_active: boolean
  is_configured: boolean
  config: Record<string, any>
  client_id?: string
  client_secret?: string
  redirect_uri?: string
  scopes?: string[]
  logo_url?: string
  description?: string
  login_count: number
  success_rate: number
  failure_count: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

// Provider Config for UI Form
export interface ProviderFormData {
  name: string
  type: ProviderType
  provider_key: string
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  logo_url?: string
  description?: string
  is_active: boolean
}

// Admin Audit Log
export interface AdminAuditLog {
  id: string
  admin_id?: string
  action: string
  resource_type: string
  resource_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed'
  error_message?: string
  created_at: string
}

// API Key
export interface ApiKey {
  id: string
  admin_id: string
  key_hash: string
  name: string
  description?: string
  scopes: string[]
  rate_limit_per_hour: number
  ip_whitelist?: string[]
  is_active: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
}

// API Key Create Request (with visible key)
export interface ApiKeyWithKey extends ApiKey {
  key: string
}

// Admin Settings
export interface AdminSetting {
  id: string
  setting_key: string
  setting_value: any
  description?: string
  is_system: boolean
  created_at: string
  updated_at: string
}

// Dashboard Statistics
export interface DashboardStats {
  total_users: number
  total_login_attempts: number
  successful_logins: number
  failed_logins: number
  active_sessions: number
  providers: {
    name: string
    type: ProviderType
    login_count: number
    success_rate: number
    is_active: boolean
  }[]
  recent_logins: {
    id: string
    email: string
    provider: string
    status: string
    created_at: string
  }[]
  login_trend: {
    date: string
    count: number
    successful: number
    failed: number
  }[]
}

// Filter Options for Tables
export interface ProviderFilters {
  type?: ProviderType
  is_active?: boolean
  search?: string
}

export interface AuditLogFilters {
  action?: string
  resource_type?: string
  status?: 'success' | 'failed'
  date_from?: string
  date_to?: string
  admin_id?: string
}

// Pagination
export interface PaginationParams {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}
