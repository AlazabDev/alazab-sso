# OAuth Provider Configuration Checklist

This document provides a quick checklist for configuring OAuth providers.

## Pre-Setup Requirements

- [ ] Supabase project created and accessible
- [ ] Supabase project URL and API keys noted
- [ ] Administrator access to your domain/hosting
- [ ] Knowledge of your production domain (e.g., example.com)

## Google OAuth Configuration Checklist

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create or select a project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials (Web application type)
- [ ] Add Authorized Redirect URIs:
  - [ ] `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=google`
  - [ ] `http://localhost:3000/auth/callback` (development)
  - [ ] `https://<your-production-domain>/auth/callback` (production)
- [ ] Copy Client ID and Client Secret
- [ ] Go to Supabase Dashboard → Authentication → Providers → Google
- [ ] Enable the provider
- [ ] Paste Client ID and Client Secret
- [ ] Save configuration
- [ ] Test login with Google on `/login` page

## Apple OAuth Configuration Checklist

- [ ] Go to [Apple Developer](https://developer.apple.com/account)
- [ ] Sign in to your Apple Developer account
- [ ] Go to Certificates, Identifiers & Profiles
- [ ] Create a new App ID (if needed)
- [ ] Register a Services ID for your web app
- [ ] Configure the Services ID with:
  - [ ] Primary App ID selected
  - [ ] Website URLs added:
    - [ ] `https://<your-supabase-project>.supabase.co`
    - [ ] `https://<your-production-domain>` (if applicable)
- [ ] Generate a private key for the Services ID
- [ ] Download the private key file (.p8)
- [ ] Note your Team ID (find in Membership section)
- [ ] Go to Supabase Dashboard → Authentication → Providers → Apple
- [ ] Enable the provider
- [ ] Fill in:
  - [ ] Team ID
  - [ ] Service ID
  - [ ] Private key content (from .p8 file)
- [ ] Save configuration
- [ ] Test login with Apple on `/login` page

## Facebook OAuth Configuration Checklist

- [ ] Go to [Facebook Developers](https://developers.facebook.com)
- [ ] Create a new App (Consumer type)
- [ ] Add "Facebook Login" product to the app
- [ ] Go to Settings → Basic and note App ID and App Secret
- [ ] Go to Facebook Login → Settings
- [ ] Add Valid OAuth Redirect URIs:
  - [ ] `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=facebook`
  - [ ] `http://localhost:3000/auth/callback` (development)
  - [ ] `https://<your-production-domain>/auth/callback` (production)
- [ ] Set App Domains:
  - [ ] `localhost` (development)
  - [ ] Your production domain
- [ ] Go to Supabase Dashboard → Authentication → Providers → Facebook
- [ ] Enable the provider
- [ ] Paste App ID and App Secret
- [ ] Save configuration
- [ ] Test login with Facebook on `/login` page

## GitHub OAuth Configuration Checklist

- [ ] Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
- [ ] Click "New OAuth App"
- [ ] Fill in application details:
  - [ ] Application name
  - [ ] Homepage URL: `https://<your-production-domain>` or `http://localhost:3000` for dev
  - [ ] Authorization callback URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=github`
- [ ] Copy Client ID and Client Secret
- [ ] Go to Supabase Dashboard → Authentication → Providers → GitHub
- [ ] Enable the provider
- [ ] Paste Client ID and Client Secret
- [ ] Save configuration
- [ ] Test login with GitHub on `/login` page

## Microsoft Entra ID (Azure AD) Configuration Checklist

### First-Time Azure AD Setup

- [ ] Go to [Azure Portal](https://portal.azure.com)
- [ ] Create or use existing Azure subscription
- [ ] Navigate to Azure Active Directory
- [ ] Go to App registrations → New registration
- [ ] Register application with:
  - [ ] Name: Your app name
  - [ ] Supported account types: Select appropriate option
  - [ ] Redirect URI: Web - `https://<your-supabase-project>.supabase.co/auth/v1/callback?provider=azure`
- [ ] Click Register
- [ ] Go to Certificates & secrets
- [ ] Create a new client secret
- [ ] Copy client secret value (only visible once!)
- [ ] Go to Overview and note:
  - [ ] Application (client) ID
  - [ ] Directory (tenant) ID
- [ ] Go to API permissions
- [ ] Add permissions: Microsoft Graph → User.Read
- [ ] Grant admin consent if needed

### Supabase Configuration

- [ ] Go to Supabase Dashboard → Authentication → Providers → Azure
- [ ] Enable the provider
- [ ] Fill in:
  - [ ] Client ID (Application ID from Azure)
  - [ ] Client secret (value from Azure)
  - [ ] Tenant (Directory ID from Azure) - optional but recommended
- [ ] Save configuration
- [ ] Test login with Azure on `/login` page

### Additional Azure AD Configuration

- [ ] Add production redirect URI in Azure:
  - [ ] `https://<your-production-domain>/auth/callback`
- [ ] Configure Azure AD to allow external users if needed
- [ ] Set up user consent if required by organization

## Post-Configuration Steps

- [ ] All providers are enabled in Supabase dashboard
- [ ] All credentials are correctly entered
- [ ] All redirect URIs are registered with providers
- [ ] Test each OAuth provider on `/login` page:
  - [ ] Google
  - [ ] Apple
  - [ ] Facebook
  - [ ] GitHub
  - [ ] Azure AD (if configured)

## Production Deployment Checklist

Before deploying to production:

- [ ] All OAuth providers configured with production redirect URIs
- [ ] Production domain added to all providers
- [ ] Test all OAuth flows on production domain
- [ ] Monitor login audit logs for issues
- [ ] Set up error monitoring/alerts
- [ ] Review security settings for all providers

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Check exact URL in provider settings matches callback
   - Ensure no trailing slashes or protocol mismatches
   - For Supabase: Use exactly `https://<project>.supabase.co/auth/v1/callback?provider=<provider>`

2. **"Invalid client ID/secret"**
   - Verify credentials are copied completely (no extra spaces)
   - Check that provider app is not disabled
   - Some providers require app approval before use

3. **User not created in database**
   - Check RLS policies aren't blocking inserts
   - Verify database schema is properly created
   - Check Supabase logs for trigger errors

4. **Blank page after OAuth redirect**
   - Check browser console for JavaScript errors
   - Verify session is created correctly
   - Check that redirect URL matches configuration

## Quick Reference URLs

- **Supabase Dashboard**: `https://app.supabase.com`
- **Supabase Auth Providers**: `https://app.supabase.com/project/_/auth/providers`
- **Google Cloud Console**: `https://console.cloud.google.com`
- **Apple Developer**: `https://developer.apple.com/account`
- **Facebook Developers**: `https://developers.facebook.com`
- **GitHub OAuth Settings**: `https://github.com/settings/developers`
- **Azure Portal**: `https://portal.azure.com`

## Testing OAuth Flows Locally

If your OAuth provider doesn't allow `localhost` redirect URIs:

1. Use a tunneling service (ngrok, localtunnel, etc.)
2. Example with ngrok:
   ```bash
   ngrok http 3000
   # This gives you a URL like https://abc123.ngrok.io
   # Use this as your redirect URI
   ```
3. Update provider settings with the tunnel URL
4. Update `NEXT_PUBLIC_SITE_URL` in `.env.local`

## Need Help?

- Check `docs/OAUTH_SETUP.md` for detailed provider guides
- Review `docs/SETUP.md` for general setup instructions
- Check Supabase documentation: https://supabase.com/docs/guides/auth
