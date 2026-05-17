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
