# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Set all environment variables in Vercel dashboard
- [ ] Verify `SESSION_ENCRYPTION_KEY` is strong and unique
- [ ] Confirm `JWT_SECRET` is generated and secure
- [ ] Update all OAuth redirect URIs to production domain
- [ ] Set `NEXT_PUBLIC_COOKIE_DOMAIN` to your domain
- [ ] Enable `NEXT_PUBLIC_COOKIE_SECURE=true`
- [ ] Set `NEXT_PUBLIC_COOKIE_SAMESITE=Strict`

### 2. OAuth Provider Configuration
#### Google
- [ ] Update OAuth consent screen with production details
- [ ] Add production domain to authorized JavaScript origins
- [ ] Update redirect URI: `https://yourdomain.com/api/auth/callback`
- [ ] Enable required scopes

#### Microsoft Entra ID
- [ ] Add production redirect URI: `https://yourdomain.com/api/auth/entra/callback`
- [ ] Update app registration URI
- [ ] Create client secret for production
- [ ] Configure API permissions

#### Apple
- [ ] Update App ID with production domain
- [ ] Create production certificate
- [ ] Update Service ID redirect URI

#### Facebook
- [ ] Update App Domains to production domain
- [ ] Configure Valid OAuth redirect URIs
- [ ] Set Privacy Policy URL

### 3. Database Setup
```sql
-- Run on production database
-- Create required tables (from supabase/schema.sql)
-- Enable Row Level Security
-- Create service role policies
-- Set up audit logging tables
```

### 4. Security Hardening
- [ ] Enable HTTPS enforcement
- [ ] Configure HSTS headers
- [ ] Set CSP (Content Security Policy) headers
- [ ] Enable X-Frame-Options
- [ ] Configure CORS properly
- [ ] Enable DDoS protection

### 5. SSL/TLS Configuration
- [ ] Obtain SSL certificate (auto-managed by Vercel)
- [ ] Enable HTTPS redirects
- [ ] Set HSTS header (min-age: 31536000)

### 6. Domain Configuration
- [ ] Update DNS records to point to Vercel
- [ ] Set up custom domain in Vercel
- [ ] Verify domain ownership
- [ ] Wait for SSL certificate generation

### 7. Monitoring & Logging
- [ ] Set up error tracking (Sentry)
- [ ] Configure audit logging
- [ ] Set up monitoring dashboard
- [ ] Configure alerts for suspicious activity
- [ ] Enable analytics collection

### 8. Performance Optimization
- [ ] Enable caching headers
- [ ] Configure CDN caching
- [ ] Set up image optimization
- [ ] Enable compression
- [ ] Configure cache invalidation strategy

### 9. Backup & Recovery
- [ ] Set up database backups
- [ ] Test backup restore procedure
- [ ] Configure automated backups
- [ ] Document recovery procedures

### 10. Testing
- [ ] Test all OAuth flows with production credentials
- [ ] Verify token refresh mechanism
- [ ] Test session encryption/decryption
- [ ] Verify audit logging
- [ ] Test rate limiting
- [ ] Verify error handling

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git status

# Tag the release
git tag -a v1.0.0-production -m "Production deployment"
git push origin v1.0.0-production
```

### 2. Deploy to Vercel
```bash
# Verify build locally first
npm run build

# Deploy to production
vercel --prod
```

### 3. Post-Deployment Verification
- [ ] Verify all environment variables are set
- [ ] Test login flow with each provider
- [ ] Check audit logs are being recorded
- [ ] Verify token rotation is working
- [ ] Test session encryption
- [ ] Monitor error logs

### 4. Production Monitoring
- [ ] Monitor auth success/failure rates
- [ ] Track provider-specific metrics
- [ ] Monitor session duration
- [ ] Alert on suspicious activity
- [ ] Track performance metrics

## Security Headers Configuration

Add to `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ]
    }
  ]
}
```

## Cookie Configuration

Ensure production cookies are configured:
- [ ] Secure flag set (HTTPS only)
- [ ] HttpOnly flag set (no JavaScript access)
- [ ] SameSite=Strict
- [ ] Domain set to production domain
- [ ] Path set to root /

## Rate Limiting

Production rate limits:
- Login attempts: 5 per 15 minutes per IP
- API endpoints: 100 per minute per user
- Password reset: 3 per hour per email
- Account creation: 10 per day per IP

## Monitoring Dashboard

Access audit logs and metrics at:
```
https://yourdomain.com/admin/audit-logs
```

## Rollback Procedure

If issues occur:

1. Revert to previous deployment:
```bash
vercel rollback
```

2. Investigate issues:
- Check error logs
- Review audit logs
- Verify environment variables

3. Fix and redeploy:
```bash
git revert <commit>
vercel --prod
```

## Support & Escalation

- **Critical Issues**: Contact security team
- **OAuth Issues**: Check provider dashboards
- **Database Issues**: Check Supabase status
- **Performance Issues**: Review Vercel analytics

## Maintenance Schedule

- Daily: Review audit logs
- Weekly: Check performance metrics
- Monthly: Review security settings
- Quarterly: Penetration testing
- Annually: Full security audit
