# Production SSO System - Complete Implementation

A comprehensive, production-ready Single Sign-On (SSO) platform built with Next.js 15, React 19, Supabase, and TypeScript. Supports multiple OAuth providers (Google, Apple, Facebook, GitHub, Microsoft Entra ID) with enterprise features, bilingual support (English/Arabic), and production-grade security.

## Features

### Authentication
- **Multiple OAuth Providers**: Google, Apple, Facebook, GitHub, Microsoft Entra ID
- **Email/Password Authentication**: Secure email-based sign-up and login
- **Automatic Profile Creation**: User profiles created automatically on first login
- **Account Linking**: Link multiple OAuth providers to one account
- **Session Management**: Multi-device session tracking with expiration

### Security
- **Row Level Security (RLS)**: Database-level access control
- **Rate Limiting**: Protect against brute force attacks
- **CSRF Protection**: Token-based CSRF defense
- **Secure Session Storage**: HTTP-only cookies with secure flags
- **Audit Logging**: Complete login attempt history
- **Password Security**: Bcrypt hashing via Supabase Auth
- **Security Headers**: MIME-type sniffing, XSS, and clickjacking protection

### User Management
- **User Profiles**: Store user information and preferences
- **Account Linking**: Connect multiple authentication methods
- **Session Management**: View and manage active sessions
- **Settings Dashboard**: User profile and account management
- **Device Tracking**: Track login devices and locations

### Internationalization
- **Bilingual Support**: English and Arabic with full RTL support
- **Automatic Language Detection**: Detects user's browser language
- **Language Persistence**: Saves user language preference
- **Responsive to RTL**: Flexible layouts adapt to text direction
- **Easy to Extend**: Add new languages in minutes

### Developer Experience
- **TypeScript**: Full type safety
- **Modern Stack**: Next.js 15, React 19, Supabase
- **Well Documented**: Comprehensive guides and examples
- **API Endpoints**: RESTful API for all operations
- **Database Migrations**: SQL schema with RLS policies
- **Environment Configuration**: Easy-to-use environment variables

## Project Structure

```
/app
  /api
    /auth                    # Authentication endpoints
      /signin                # Email/password sign-in
      /signup                # User registration
      /signout               # Sign-out
    /user                    # User management endpoints
      /profile               # User profile
      /accounts              # Linked accounts
  /auth
    /callback                # OAuth callback handler
  /login                      # Login page
  /signup                     # Sign-up page
  /dashboard                  # Protected dashboard
  /settings                   # Account settings

/lib
  /auth
    /context.tsx            # Auth context & hooks
    /providers.ts           # OAuth provider functions
  /supabase
    /client.ts              # Browser client
    /server.ts              # Server client
  /security
    /rate-limiter.ts        # Rate limiting
    /csrf.ts                # CSRF protection
    /session.ts             # Session management
  /i18n
    /context.tsx            # Language provider
    /translations.ts        # Translation utilities

/components
  /auth
    /multi-provider-login.tsx   # Multi-provider login
    /signup-form.tsx            # Sign-up form
  /language-switcher.tsx        # Language selector

/locales
  /en.json                  # English translations
  /ar.json                  # Arabic translations

/supabase
  /schema.sql               # Database schema with RLS

/docs
  /SETUP.md                 # Setup instructions
  /OAUTH_SETUP.md           # OAuth configuration
  /OAUTH_CHECKLIST.md       # Setup checklist
  /SECURITY.md              # Security documentation
  /BILINGUAL.md             # i18n guide
```

## Quick Start

### 1. Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- OAuth provider credentials (Google, Apple, etc.)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Database Schema
Run the SQL schema in Supabase SQL Editor:
```bash
# Open supabase/schema.sql and run in Supabase dashboard
# Or use Supabase CLI:
supabase db push
```

### 5. Configure OAuth Providers
Follow `docs/OAUTH_SETUP.md` to configure:
- Google OAuth
- Apple OAuth
- Facebook OAuth
- GitHub OAuth
- Microsoft Entra ID

### 6. Start Development Server
```bash
pnpm dev
```

Navigate to `http://localhost:3000/login`

## Core Components

### Authentication Context
Provides user state and authentication functions:
```typescript
const { user, session, isLoading, signOut } = useAuth()
```

### Language Context
Manages application language and RTL support:
```typescript
const { language, setLanguage, direction, isRTL } = useLanguage()
```

### Translation Hook
Access translations in any component:
```typescript
const { t } = useTranslation()
const text = t('auth.signIn')
```

## API Routes

### Authentication
- `POST /api/auth/signin` - Email/password login
- `POST /api/auth/signup` - Register new account
- `POST /api/auth/signout` - Sign out user
- `GET /auth/callback` - OAuth callback

### User Management
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/accounts` - List linked accounts
- `DELETE /api/user/accounts?provider=google` - Unlink account

## Database Schema

### Tables
- **user_profiles**: User information and preferences
- **oauth_accounts**: Linked OAuth provider accounts
- **sessions**: Active user sessions
- **login_audit**: Login attempt history

All tables have Row Level Security (RLS) policies enabled.

## Security Features

### Implemented
- OAuth 2.0 PKCE flow
- Secure JWT token management
- HTTP-only cookies
- CSRF token validation
- Rate limiting (5 login attempts per 15 minutes)
- Audit logging
- Password hashing (bcrypt)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Session expiration (24 hours)
- Inactivity timeout (30 minutes)

### Recommended for Production
- Web Application Firewall (WAF)
- DDoS protection
- Multi-factor authentication (MFA)
- Device fingerprinting
- Geo-fencing
- Behavioral analytics

See `docs/SECURITY.md` for detailed security information.

## Internationalization

### Supported Languages
- English (en)
- العربية - Arabic (ar) with RTL support

### Adding Languages
1. Create `locales/xx.json` with translations
2. Update `lib/i18n/translations.ts` type
3. Add to `getAvailableLanguages()`

See `docs/BILINGUAL.md` for complete i18n guide.

## Configuration

### OAuth Providers
Configure each provider in Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable desired provider
3. Add credentials
4. Set redirect URIs

### Rate Limiting
Customize in `lib/security/rate-limiter.ts`:
```typescript
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  signup: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },
  // ...
}
```

### Session Duration
Modify in `lib/security/session.ts`:
```typescript
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
```

## Deployment

### Vercel
```bash
# Push to GitHub
git add .
git commit -m "Production SSO system"
git push origin main

# Import in Vercel Dashboard
# Add environment variables
# Deploy
```

### Update OAuth Redirect URIs
For production, update all OAuth providers with:
```
https://<your-domain>/auth/callback
```

## Monitoring & Analytics

### Login Audit Logs
View all login attempts:
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

### Active Sessions
```sql
SELECT user_id, COUNT(*) as active_sessions 
FROM sessions 
WHERE is_active = true 
GROUP BY user_id;
```

## Troubleshooting

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and API keys
- Check network connectivity
- Review RLS policies

### OAuth Not Working
- Verify redirect URIs match provider settings
- Check credentials are correct
- Ensure provider app is approved
- Review browser console for errors

### User Profile Not Created
- Verify database schema is applied
- Check `handle_new_user` trigger exists
- Review Supabase logs

### Language Not Changing
- Check `localStorage` is enabled
- Verify `LanguageProvider` wraps app
- Check browser console for errors

## Performance

- First Load JS: ~195 KB
- All routes cached/optimized
- Database queries indexed
- No external font loading
- Bundle size optimized
- Edge caching ready

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is provided as-is for educational and development purposes.

## Documentation

- **[SETUP.md](docs/SETUP.md)** - Complete setup instructions
- **[OAUTH_SETUP.md](docs/OAUTH_SETUP.md)** - OAuth provider configuration
- **[OAUTH_CHECKLIST.md](docs/OAUTH_CHECKLIST.md)** - Configuration checklist
- **[SECURITY.md](docs/SECURITY.md)** - Security implementation details
- **[BILINGUAL.md](docs/BILINGUAL.md)** - Internationalization guide

## Next Steps

1. Configure OAuth providers (see `docs/OAUTH_SETUP.md`)
2. Test authentication flows locally
3. Deploy to production
4. Set up monitoring and alerting
5. Configure advanced security features
6. Customize branding and styling

## Support

For issues or questions:
1. Check relevant documentation
2. Review Supabase docs: https://supabase.com/docs
3. Check Next.js docs: https://nextjs.org/docs
4. Review source code comments

## Key Files

- `middleware.ts` - Session validation and route protection
- `supabase/schema.sql` - Database structure
- `lib/auth/context.tsx` - Authentication state management
- `lib/security/session.ts` - Session management
- `lib/i18n/context.tsx` - Language and i18n management
- `app/api/auth/*` - Authentication API routes
- `components/auth/*` - Auth UI components

---

**Built with:** Next.js 15, React 19, Supabase, TypeScript, Tailwind CSS

**Status:** Production Ready
# Quick Start Guide - SSO System

## 1. Local Development (5 minutes)

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.entra.local .env.local
# Edit .env.local with your local OAuth secrets

# Run dev server
pnpm dev

# Visit http://localhost:3000
```

## 2. Test OAuth Flow (2 minutes per provider)

1. Click provider button on login page
2. Complete OAuth consent
3. Verify you're logged in
4. Check audit logs: `/admin/audit-logs`

## 3. Production Deployment (30 minutes)

### Step 1: Configure
```bash
# Copy production template
cp .env.production .env.production.local

# Fill in all secrets:
# - OAuth client IDs/secrets
# - SESSION_ENCRYPTION_KEY
# - JWT_SECRET
# - Database URL
```

### Step 2: Deploy
```bash
# Commit and push
git add .
git commit -m "Production deployment"
git push

# Deploy to Vercel
vercel --prod
```

### Step 3: Verify
1. Visit production domain
2. Test each OAuth provider
3. Check `/admin/audit-logs`
4. Monitor for 24 hours

## 4. Environment Variables Checklist

### Required OAuth
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_ENTRA_CLIENT_ID`
- [ ] `ENTRA_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_APPLE_CLIENT_ID`
- [ ] `APPLE_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_FACEBOOK_CLIENT_ID`
- [ ] `FACEBOOK_CLIENT_SECRET`

### Required Security
- [ ] `SESSION_ENCRYPTION_KEY` (32 bytes hex)
- [ ] `JWT_SECRET` (random string)

### Required URLs
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_APP_URL` (production domain)
- [ ] `NEXT_PUBLIC_ENTRA_AUTHORITY`
- [ ] `NEXT_PUBLIC_ENTRA_REDIRECT_URI`

## 5. API Endpoints

### Authentication
- `POST /api/auth/signin` - Email login
- `POST /api/auth/signup` - Register
- `POST /api/auth/signout` - Logout
- `POST /api/auth/refresh-token` - Refresh
- `GET /auth/callback` - OAuth callback
- `POST /api/auth/entra/callback` - Entra callback

### User Management
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/accounts` - List accounts
- `POST /api/user/accounts/link` - Link provider
- `POST /api/user/accounts/unlink` - Unlink provider

### Admin
- `GET /api/admin/audit-logs` - Get audit logs

## 6. Key Files

### Authentication
- `lib/auth/context.tsx` - Auth provider
- `lib/auth/providers.ts` - OAuth functions
- `lib/auth/entra-service.ts` - Entra integration
- `lib/auth/token-refresh.ts` - Token refresh logic

### Security
- `lib/security/token-rotation.ts` - Token rotation
- `lib/security/session-encryption.ts` - Encryption
- `lib/security/replay-protection.ts` - Replay protection

### Monitoring
- `lib/monitoring/auth-monitor.ts` - Event tracking
- `app/admin/audit-logs/page.tsx` - Dashboard

### Database
- `supabase/schema.sql` - Database schema

## 7. Troubleshooting

### OAuth Not Working
1. Check client ID/secret
2. Verify redirect URI
3. Check console for errors
4. Review auth logs

### Session Not Persisting
1. Verify SESSION_ENCRYPTION_KEY
2. Check cookie settings
3. Review session validation
4. Check browser console

### Token Refresh Failing
1. Verify refresh token in DB
2. Check provider API status
3. Review error logs
4. Check token expiry

### Database Issues
1. Check Supabase connection
2. Verify service role key
3. Run migrations
4. Check RLS policies

## 8. Monitoring

### View Logs
```bash
# Local
pnpm dev  # Check console

# Production
vercel logs

# Database
supabase logs
```

### Check Metrics
Visit `/admin/audit-logs` to see:
- Login success rate
- Provider usage
- Session metrics
- Suspicious activity

## 9. Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Check code quality

# Database
supabase db push      # Push schema changes
supabase db pull      # Pull schema from DB
supabase db reset     # Reset local DB

# Vercel
vercel env pull       # Pull env vars
vercel logs           # View logs
vercel rollback       # Rollback deployment
```

## 10. Emergency Contacts

| Role | Contact |
|------|---------|
| Lead Engineer | [Name] |
| On-Call | [Name] |
| Security | [Name] |
| Database | [Name] |

---

**Pro Tip**: Keep `DEPLOYMENT_CHECKLIST.md` open during deployment!

For detailed docs, see:
- `DEPLOYMENT_SUMMARY.md` - Full overview
- `PRODUCTION_DEPLOYMENT.md` - Detailed guide
- `docs/SECURITY.md` - Security details
- `docs/OAUTH_SETUP.md` - OAuth configuration
