export type TwoFAMethod = 'totp' | 'backup_code' | 'sms'
export type TwoFAStatus = 'success' | 'failed' | 'attempted'
export type IncidentType = 'brute_force' | 'suspicious_login' | 'unusual_location' | 'impossible_travel' | 'concurrent_sessions' | 'failed_verification' | 'device_change'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface TwoFASecret {
  id: string
  user_id: string
  secret: string
  backup_codes: string[]
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface TwoFALog {
  id: string
  user_id: string
  method: TwoFAMethod
  status: TwoFAStatus
  ip_address: string
  user_agent: string
  error_message: string | null
  created_at: string
}

export interface SecurityIncident {
  id: string
  user_id: string | null
  incident_type: IncidentType
  severity: IncidentSeverity
  description: string
  ip_address: string
  location_data: Record<string, any> | null
  is_resolved: boolean
  resolved_at: string | null
  resolution_note: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface IPBlocklist {
  id: string
  ip_address: string
  blocked_reason: string
  is_permanent: boolean
  blocked_until: string | null
  blocked_by: string | null
  metadata: Record<string, any>
  created_at: string
}

export interface SessionSecurityLog {
  id: string
  session_id: string
  user_id: string
  event_type: 'created' | 'active' | 'suspicious_activity' | 'terminated' | 'concurrent_limit_exceeded'
  ip_address: string
  browser_fingerprint: string
  location_data: Record<string, any> | null
  reason: string | null
  created_at: string
}

export interface SetupTwoFAResponse {
  secret: string
  qr_code: string
  manual_entry_key: string
  backup_codes: string[]
}

export interface VerifyTwoFARequest {
  code: string
  method?: 'totp' | 'backup_code'
}

export interface SessionSecurityMetrics {
  total_active_sessions: number
  concurrent_sessions_limit: number
  devices_online: number
  last_activity: string
  unusual_activity_detected: boolean
}

export interface SecurityCheckResult {
  is_safe: boolean
  risk_score: number
  incidents: SecurityIncident[]
  recommendations: string[]
}
