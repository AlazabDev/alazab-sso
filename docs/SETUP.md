# Production SSO System - Setup Guide

This document provides complete setup instructions for the production-ready Single Sign-On (SSO) system.

## Quick Start

### 1. Database Schema Setup

The database schema is defined in `supabase/schema.sql`. To apply it:

#### Option A: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy and paste the entire contents of `supabase/schema.sql`
5. Click "Run"

#### Option B: Using Supabase CLI (if installed)

```bash
supabase db push
```

### 2. Environment Variables

All required environment variables are automatically available if Supabase is connected:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. OAuth Provider Configuration

Configure your OAuth providers:

1. Google OAuth
2. Apple OAuth
3. Facebook OAuth
4. GitHub OAuth
5. Microsoft Entra ID (Azure AD)

See `docs/OAUTH_SETUP.md` for detailed instructions.

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Development Server

```bash
pnpm dev
```

Navigate to `http://localhost:3000` to test.

## Project Structure

```
/app
  /api/auth              # Authentication API routes
    /signin              # Email/password sign-in
    /signup              # Email/password sign-up
    /signout             # Sign-out
  /auth/callback         # OAuth callback handler
  /dashboard             # Protected dashboard page
  /settings              # User settings & account management
  /login                 # Login page
  /signup                # Sign-up page

/lib
  /auth
    /context.tsx         # Auth provider & useAuth hook
    /providers.ts        # OAuth provider functions
  /supabase
    /client.ts           # Client-side Supabase instance
    /server.ts           # Server-side Supabase instance

/components/auth
  /multi-provider-login.tsx   # Multi-provider login form
  /signup-form.tsx            # Sign-up form

/supabase
  /schema.sql            # Database schema with RLS policies

/docs
  /SETUP.md              # This file
  /OAUTH_SETUP.md        # OAuth provider configuration guide
```

## Core Features

### 1. **Multi-Provider Authentication**
- Google, Apple, Facebook, GitHub OAuth
- Email/password authentication
- Microsoft Entra ID for enterprise

### 2. **User Management**
- Automatic profile creation
- Account linking (multiple OAuth providers to one user)
- User type classification (employee/partner/customer)
- Language preferences (English/Arabic with RTL support)

### 3. **Security**
- Row Level Security (RLS) on all tables
- Secure JWT token management
- HTTP-only session cookies
- PKCE OAuth flow
- Login audit trail
- Rate limiting ready

### 4. **Session Management**
- Multi-device session tracking
- Session expiry management
- Device information logging
- Session invalidation on sign-out

### 5. **API Routes**
All routes require authentication except login/signup:

**Auth Routes:**
- `POST /api/auth/signin` - Email/password sign-in
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signout` - Sign out
- `GET /auth/callback` - OAuth callback

**User Routes:**
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/accounts` - List linked accounts
- `DELETE /api/user/accounts?provider=google` - Unlink account

## Database Schema

### Tables

1. **user_profiles** - User account information
   - user_id, email, full_name, avatar_url, user_type
   - language_preference, is_active, last_login_at

2. **oauth_accounts** - Linked OAuth accounts
   - user_id, provider, provider_user_id, provider_email
   - access_token, refresh_token, token_expires_at

3. **sessions** - User session tracking
   - user_id, session_token, device_info, ip_address
   - last_activity_at, expires_at

4. **login_audit** - Login attempt tracking
   - user_id, email, provider, login_method
   - status, failure_reason, ip_address

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Automatic timestamp updates with triggers
- Automatic profile creation on user signup

## Authentication Flow

### OAuth Flow
1. User clicks provider button on login page
2. Redirected to provider's login/consent screen
3. Provider redirects to `/auth/callback` with code
4. Code is exchanged for session
5. User profile created automatically
6. Redirected to `/dashboard`

### Email/Password Flow
1. User enters email and password
2. `POST /api/auth/signin` validates credentials
3. Session is created
4. Login audit logged
5. Redirected to `/dashboard`

## Development Tips

### Testing OAuth Locally
1. OAuth providers may not allow `http://localhost:3000`
2. Use tunneling tools like `ngrok` or `localtunnel`
3. Update redirect URLs in provider settings
4. Example: `https://abc123.ngrok.io/auth/callback`

### Database Debugging
- View data in Supabase Dashboard → Table Editor
- Check logs in Supabase Dashboard → Logs
- Test RLS policies in SQL Editor

### API Testing
Use tools like Postman or `curl`:

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","fullName":"Test User"}'

# Sign in
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get profile
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <access_token>"
```

## Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "Production SSO system"
git push origin main
```

### 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com)
2. Import repository
3. Add environment variables (from Supabase)
4. Deploy

### 3. Update OAuth Redirect URLs
For each provider, add:
```
https://<your-vercel-domain>/auth/callback
```

### 4. Verify Deployment
1. Test login at `https://<your-vercel-domain>/login`
2. Check logs in Vercel Dashboard
3. Monitor errors in Supabase Dashboard

## Monitoring & Analytics

### Login Audit Logs
Track all login attempts:

```sql
SELECT * FROM login_audit 
ORDER BY created_at DESC 
LIMIT 100;
```

### User Statistics
```sql
SELECT user_type, COUNT(*) as count 
FROM user_profiles 
GROUP BY user_type;
```

### Session Management
```sql
SELECT user_id, COUNT(*) as active_sessions 
FROM sessions 
WHERE is_active = true 
GROUP BY user_id;
```

## Troubleshooting

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check network connectivity
- Verify RLS policies are not blocking queries

### OAuth Callback Errors
- Redirect URI must exactly match provider configuration
- Check browser console for error messages
- Verify provider credentials are correct

### User Profile Not Created
- Check RLS policies on `user_profiles` table
- Verify `handle_new_user` trigger exists
- Check Supabase logs for errors

## Next Steps

1. Configure all OAuth providers (see `OAUTH_SETUP.md`)
2. Test authentication flows locally
3. Set up monitoring and alerting
4. Deploy to production
5. Monitor login audit logs
6. Implement custom branding/styling

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review OAuth provider guides
3. Check application logs in Supabase/Vercel dashboards
