# OAuth Provider Configuration Guide

This guide explains how to set up each OAuth provider for the SSO system.

## Prerequisites

You need to have a Supabase project set up. All OAuth providers are configured through the Supabase dashboard.

## Provider Setup Instructions

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=google`
   - `http://localhost:3000/auth/callback` (for development)
6. Copy the Client ID and Client Secret
7. In Supabase dashboard: Authentication → Providers → Google
   - Paste Client ID and Client Secret
   - Enable the provider

### 2. Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com)
2. Register a new App ID in Certificates, Identifiers & Profiles
3. Create a Service ID for your web application
4. Generate a private key for the Service ID
5. In Supabase dashboard: Authentication → Providers → Apple
   - Enter your Team ID, Service ID, and private key
   - Enable the provider

### 3. Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new App (type: Consumer)
3. Add Facebook Login product
4. Configure OAuth Redirect URIs:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=facebook`
   - `http://localhost:3000/auth/callback` (for development)
5. Copy App ID and App Secret
6. In Supabase dashboard: Authentication → Providers → Facebook
   - Paste App ID and App Secret
   - Enable the provider

### 4. GitHub OAuth

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=github`
   - `http://localhost:3000/auth/callback` (for development)
4. Copy Client ID and Client Secret
5. In Supabase dashboard: Authentication → Providers → GitHub
   - Paste Client ID and Client Secret
   - Enable the provider

### 5. Microsoft Entra ID (Azure AD)

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application in Azure AD
3. Configure Redirect URI:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=azure`
   - `http://localhost:3000/auth/callback` (for development)
4. Create a client secret in Certificates & secrets
5. Copy the Application (client) ID and client secret value
6. In Supabase dashboard: Authentication → Providers → Azure
   - Paste Application ID and client secret
   - Enable the provider

## Environment Variables

After configuring providers in Supabase, the following environment variables should already be set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Testing OAuth Flow

1. Start the development server: `pnpm dev`
2. Navigate to `http://localhost:3000/login`
3. Click on any provider button
4. You'll be redirected to the provider's login page
5. After authentication, you'll be redirected back to the app
6. Your profile will be created automatically in Supabase

## Callback URL Configuration

For production deployment to Vercel:

1. Your callback URL will be: `https://<your-vercel-domain>/auth/callback`
2. Add this to all OAuth provider configurations
3. Update `NEXT_PUBLIC_SITE_URL` environment variable if using custom redirect URLs

## User Creation & Profile

When a user authenticates with an OAuth provider:

1. A new user is created in Supabase Auth
2. The `handle_new_user` trigger automatically creates a user profile
3. OAuth account details are stored in the `oauth_accounts` table
4. Login audit log is recorded in `login_audit` table

## Troubleshooting

### "Invalid client ID" or "Client authentication failed"
- Verify credentials are correct
- Check that the provider is enabled in Supabase dashboard
- Ensure OAuth app is approved by provider (some require approval)

### Redirect URI mismatch
- Must exactly match provider's configured redirect URI
- Check for trailing slashes and protocols
- Use HTTPS for production, HTTP for local development

### User not created after login
- Check that database schema is properly created
- Verify RLS policies are not blocking inserts
- Check Supabase logs for errors

## Security Best Practices

1. **Never expose Client Secrets** - Keep them in environment variables, never commit to git
2. **Use HTTPS** - Always use HTTPS in production
3. **Verify Tokens** - All tokens are verified server-side
4. **PKCE Flow** - OAuth uses PKCE for enhanced security
5. **Rate Limiting** - Implement rate limiting on auth endpoints
6. **Session Security** - Sessions are stored in httpOnly cookies by default

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
