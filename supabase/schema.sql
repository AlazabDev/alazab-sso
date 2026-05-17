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
