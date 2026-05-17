# Microsoft Entra ID Deployment Checklist

## Pre-Deployment (Local Testing)

### 1. Environment Setup
```bash
# Copy template
cp .env.entra.local .env.local

# Add your credentials
NEXT_PUBLIC_ENTRA_CLIENT_ID=your_client_id
ENTRA_CLIENT_SECRET=your_client_secret
```

### 2. Start Dev Server
```bash
pnpm dev
# Server runs on http://localhost:3000
```

### 3. Test Login Flow
1. Navigate to http://localhost:3000/login
2. Click "Microsoft Entra" button
3. Sign in with your Entra ID account
4. Verify redirect to /dashboard
5. Check user profile in settings
6. Test account linking with other providers

### 4. Test Logout Flow
1. Click "Sign Out" in dashboard
2. Verify redirect to login page
3. If Entra linked, verify Entra logout

### 5. Test Account Linking
1. Go to /settings
2. Link additional OAuth providers (Google, Apple, etc.)
3. Verify accounts appear in "Linked Accounts"
4. Test unlinking (keep at least one account)

## Production Deployment

### 1. Azure Portal Configuration

**Update Redirect URIs:**
1. Go to Azure Portal > App registrations > Your app
2. Select **Authentication**
3. Add production redirect URI:
   ```
   https://your-domain.com/api/auth/entra/callback
   ```
4. Keep dev URI for testing:
   ```
   http://localhost:3000/api/auth/entra/callback
   ```

### 2. Vercel Environment Variables

Go to Vercel project settings > Environment Variables

Add:
```
NEXT_PUBLIC_ENTRA_CLIENT_ID=your_production_client_id
ENTRA_CLIENT_SECRET=your_production_client_secret
```

Mark as:
- ✓ Production
- ✓ Preview
- ✓ Development

### 3. Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add Microsoft Entra ID integration"
git push origin main

# Or deploy directly
vercel --prod
```

### 4. Verify Production Deployment

1. Go to https://your-domain.com/login
2. Click "Microsoft Entra"
3. Complete login flow
4. Test in /settings
5. Test account linking
6. Test logout

### 5. Monitor

Check Vercel logs for any errors:
- https://vercel.com/your-team/your-project/logs

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /api/auth/signin` - Email login
- `POST /api/auth/signup` - Registration
- `GET /api/auth/entra/callback` - Entra callback handler
- `POST /api/auth/logout` - Logout (supports Entra)

### Account Management
- `GET /api/user/profile` - Get user profile
- `POST /api/user/accounts` - List linked accounts
- `POST /api/user/accounts/link` - Link new provider
- `POST /api/user/accounts/unlink` - Unlink provider

## Troubleshooting

### Redirect URI Mismatch
**Error:** `AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application.`

**Fix:**
1. Check exact URI in Azure Portal
2. Ensure no trailing slashes mismatch
3. Verify domain matches exactly

### Invalid Client Secret
**Error:** `invalid_client: Credentials provided in the request are invalid`

**Fix:**
1. Verify secret hasn't expired
2. Create new secret if needed
3. Copy value (not ID)
4. Update .env variables

### Token Verification Failed
**Error:** `Token verification failed: Token expired`

**Fix:**
1. Check local system time
2. Ensure token_expires_at is set correctly
3. Implement token refresh logic

### User Not Found
**Error:** User created in Entra but not in Supabase

**Fix:**
1. Check Supabase users table
2. Check accounts table linking
3. Verify RLS policies allow insertion
4. Check database logs

## Security Checklist

- ✓ ENTRA_CLIENT_SECRET only in server env vars (never in NEXT_PUBLIC_*)
- ✓ HTTPS only in production
- ✓ PKCE flow implemented for OAuth
- ✓ State parameter validated
- ✓ Token expiration checked
- ✓ Secure cookies (httpOnly, sameSite)
- ✓ Rate limiting on auth endpoints
- ✓ Session timeout configured

## Files Added for Entra Integration

```
lib/auth/
├── entra-config.ts          # Configuration
├── entra-service.ts         # OAuth2 service
└── providers.ts             # Updated with Entra

app/api/auth/
├── entra/callback/route.ts  # OAuth callback
└── logout/route.ts          # Logout handler

app/api/user/accounts/
├── link/route.ts            # Link account endpoint
└── unlink/route.ts          # Unlink account endpoint

lib/security/
└── session-validator.ts     # Session validation

components/
└── account-linking.tsx      # Account linking UI

docs/
├── ENTRA_INTEGRATION.md     # Setup guide
└── ENTRA_DEPLOYMENT.md      # This file
```

## Support

For issues:
1. Check Azure Portal app registration
2. Review Vercel logs
3. Check browser console for errors
4. Verify environment variables
5. Test with curl/Postman if needed
