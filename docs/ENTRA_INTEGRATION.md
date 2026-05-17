# Microsoft Entra ID Integration

## Quick Setup

### 1. Azure Portal Configuration

1. Go to [Azure Portal](https://portal.azure.com)
2. Select **Azure Active Directory**
3. Click **App registrations** → **New registration**
4. Fill in:
   - Name: Your App Name
   - Supported account types: Accounts in this organizational directory only
   - Redirect URI: Web → http://localhost:3000/api/auth/entra/callback
5. Click **Register**

### 2. Get Client ID and Secret

1. Copy **Application (client) ID** 
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Copy the **Value** (not ID)

### 3. Set Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_ENTRA_CLIENT_ID=your_client_id_here
ENTRA_CLIENT_SECRET=your_client_secret_here
```

### 4. Configure Redirect URIs

1. In Azure Portal, go to **Authentication**
2. Under Redirect URIs, add:
   - Development: `http://localhost:3000/api/auth/entra/callback`
   - Production: `https://your-domain.com/api/auth/entra/callback`
3. Save

### 5. Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission** → **Microsoft Graph**
3. Select **Delegated permissions**
4. Search and add:
   - `openid`
   - `profile`
   - `email`
   - `User.Read`
5. Click **Grant admin consent**

## Testing End-to-End

1. Start dev server: `pnpm dev`
2. Go to http://localhost:3000/login
3. Click "Microsoft Entra" button
4. You'll be redirected to Microsoft login
5. Sign in with your organizational account
6. You'll be redirected back to dashboard

## Architecture

- **entra-config.ts**: Configuration with tenant ID and endpoints
- **entra-service.ts**: OAuth2 token exchange and JWT verification
- **app/api/auth/entra/callback/route.ts**: Callback handler that exchanges code for token
- **lib/auth/providers.ts**: Integration with Supabase for user creation

## Token Flow

```
1. User clicks "Microsoft Entra" button
   ↓
2. Redirect to Microsoft login
   ↓
3. User authenticates
   ↓
4. Microsoft redirects to /api/auth/entra/callback with `code`
   ↓
5. Exchange code for access_token + id_token
   ↓
6. Verify and decode id_token (JWT)
   ↓
7. Create or update user in Supabase
   ↓
8. Link account in accounts table
   ↓
9. Create session and redirect to dashboard
```

## Troubleshooting

### "Invalid client secret"
- Verify ENTRA_CLIENT_SECRET is correct (not the client ID)
- Check that secret hasn't expired

### "Redirect URI mismatch"
- Ensure callback URL in code matches Azure Portal exactly
- Check for trailing slashes

### "Token verification failed"
- Verify tenant ID in configuration
- Check that id_token is valid JWT

### User not found in Supabase
- Check that account linking in callback route succeeded
- Verify Supabase database connection

## Account Linking with Other Providers

Users can link their Entra account with other OAuth providers in account settings.
