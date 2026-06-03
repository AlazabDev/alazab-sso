// Phase 1: User Experience Types

// Activity Log Types
export type ActivityActionType = 'login' | 'logout' | 'settings_change' | 'device_add' | 'device_remove' | 'password_change' | 'profile_update';
export type ActivityStatus = 'success' | 'failed';

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  action_type: ActivityActionType;
  resource_type?: string;
  resource_id?: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, any>;
  status: ActivityStatus;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Device Types
export type DeviceType = 'web' | 'mobile' | 'desktop' | 'tablet';

export interface UserDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type?: DeviceType;
  device_os?: string;
  browser_name?: string;
  browser_version?: string;
  ip_address?: string;
  user_agent?: string;
  is_trusted: boolean;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

// Notification Types
export type NotificationType = 'login' | 'security' | 'account' | 'admin' | 'system';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  sent_via: NotificationChannel[];
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  login_notifications: boolean;
  security_notifications: boolean;
  account_notifications: boolean;
  admin_notifications: boolean;
  system_notifications: boolean;
  email_login: boolean;
  email_security: boolean;
  email_account: boolean;
  email_admin: boolean;
  email_system: boolean;
  push_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

// Activity Filter Options
export interface ActivityFilterOptions {
  user_id?: string;
  action_type?: ActivityActionType;
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  offset?: number;
}

// Pagination
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
