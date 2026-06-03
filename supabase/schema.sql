-- =====================================================
-- Production SSO System - Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  user_type TEXT CHECK (user_type IN ('employee', 'partner', 'customer')) DEFAULT 'customer',
  language_preference TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. OAUTH ACCOUNTS TABLE (Account Linking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.oauth_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  id_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- =====================================================
-- 3. SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. LOGIN AUDIT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.login_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
  email TEXT,
  provider TEXT,
  login_method TEXT CHECK (login_method IN ('oauth', 'email', 'sso')),
  ip_address INET,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'mfa_required')) DEFAULT 'success',
  failure_reason TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON public.oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON public.oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON public.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_login_audit_user_id ON public.login_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_created_at ON public.login_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_provider ON public.login_audit(provider);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_audit ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER PROFILES RLS
-- =====================================================
-- Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all profiles (for admin dashboard)
CREATE POLICY "Service role can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- OAUTH ACCOUNTS RLS
-- =====================================================
-- Users can view their own linked accounts
CREATE POLICY "Users can view their own linked accounts"
  ON public.oauth_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own linked accounts
CREATE POLICY "Users can manage their own linked accounts"
  ON public.oauth_accounts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SESSIONS RLS
-- =====================================================
-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions"
  ON public.sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- LOGIN AUDIT RLS
-- =====================================================
-- Users can view their own login audit logs
CREATE POLICY "Users can view their own login audit"
  ON public.login_audit
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit logs (from API)
CREATE POLICY "Service role can insert audit logs"
  ON public.login_audit
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.jwt()->>'role' = 'authenticated');

-- =====================================================
-- 7. TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_oauth_accounts_timestamp
  BEFORE UPDATE ON public.oauth_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sessions_timestamp
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- 8. AUTO-CREATE USER PROFILE ON NEW USER SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. ADMIN USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'provider_manager', 'viewer')) DEFAULT 'viewer',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. AUTH PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('oauth', 'oidc', 'email', 'sms', 'sso')),
  provider_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  is_configured BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  client_id TEXT,
  client_secret TEXT,
  redirect_uri TEXT,
  scopes TEXT[] DEFAULT '{}',
  logo_url TEXT,
  description TEXT,
  login_count BIGINT DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 100.00,
  failure_count BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. ADMIN AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.admin_users(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failed')) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. API KEYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_per_hour INT DEFAULT 1000,
  ip_whitelist TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 13. ADMIN SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 14. INDEXES FOR ADMIN TABLES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_providers_type ON public.auth_providers(type);
CREATE INDEX IF NOT EXISTS idx_auth_providers_is_active ON public.auth_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource ON public.admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_admin_id ON public.api_keys(admin_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(setting_key);

-- =====================================================
-- 15. RLS POLICIES FOR ADMIN TABLES
-- =====================================================

-- Admin Users RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view their own profile"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Super admin can view all admin users"
  ON public.admin_users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) OR auth.jwt()->>'role' = 'service_role');

-- Auth Providers RLS
ALTER TABLE public.auth_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active providers"
  ON public.auth_providers
  FOR SELECT
  USING (is_active = true OR auth.jwt()->>'role' = 'service_role' OR EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'provider_manager')
  ));

CREATE POLICY "Admins can manage providers"
  ON public.auth_providers
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR auth.jwt()->>'role' = 'service_role');

-- Admin Audit Logs RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'viewer')
  ) OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- API Keys RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (admin_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys
  FOR ALL
  USING (admin_id = auth.uid() OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (admin_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

-- Admin Settings RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings"
  ON public.admin_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ) OR auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 16. TRIGGERS FOR ADMIN TABLES
-- =====================================================
CREATE TRIGGER update_admin_users_timestamp
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_auth_providers_timestamp
  BEFORE UPDATE ON public.auth_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_api_keys_timestamp
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_admin_settings_timestamp
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- 17. USER ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_type TEXT CHECK (action_type IN ('login', 'logout', 'settings_change', 'device_add', 'device_remove', 'password_change', 'profile_update')) DEFAULT 'login',
  resource_type TEXT,
  resource_id TEXT,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  status TEXT CHECK (status IN ('success', 'failed')) DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 18. USER DEVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('web', 'mobile', 'desktop', 'tablet')),
  device_os TEXT,
  browser_name TEXT,
  browser_version TEXT,
  ip_address INET,
  user_agent TEXT,
  is_trusted BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 19. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('login', 'security', 'account', 'admin', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_via TEXT[] DEFAULT '{"in_app"}'::text[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 20. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  login_notifications BOOLEAN DEFAULT true,
  security_notifications BOOLEAN DEFAULT true,
  account_notifications BOOLEAN DEFAULT true,
  admin_notifications BOOLEAN DEFAULT false,
  system_notifications BOOLEAN DEFAULT true,
  email_login BOOLEAN DEFAULT true,
  email_security BOOLEAN DEFAULT true,
  email_account BOOLEAN DEFAULT false,
  email_admin BOOLEAN DEFAULT false,
  email_system BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 21. INDEXES FOR PHASE 1 TABLES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON public.user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_created_at ON public.user_devices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- 22. RLS POLICIES FOR PHASE 1 TABLES
-- =====================================================

-- User Activity Logs RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON public.user_activity_logs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert activity logs"
  ON public.user_activity_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- User Devices RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
  ON public.user_devices
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can manage their own devices"
  ON public.user_devices
  FOR ALL
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Notification Preferences RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can manage their own preferences"
  ON public.notification_preferences
  FOR ALL
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 23. TRIGGERS FOR PHASE 1 TABLES
-- =====================================================
CREATE TRIGGER update_user_devices_timestamp
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();
