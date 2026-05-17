# Security Implementation Guide

This document outlines the security measures implemented in the production SSO system.

## Security Architecture

### 1. Authentication Security

#### OAuth 2.0 PKCE Flow
- **PKCE (Proof Key for Code Exchange)** is used for OAuth providers
- Prevents authorization code interception attacks
- Automatically handled by Supabase Auth

#### JWT Token Management
- Tokens are issued by Supabase Auth
- Stored in secure HTTP-only cookies
- Automatically validated on protected routes

#### Session Management
- All sessions are stored in the database
- Sessions have expiration times (24 hours default)
- Inactivity timeout (30 minutes default)
- Session invalidation on sign out

### 2. Database Security

#### Row Level Security (RLS)
Every table has RLS policies enabled:

**user_profiles table:**
- Users can view/update only their own profile
- Service role can view all profiles for admin features

**oauth_accounts table:**
- Users can only access their own linked accounts
- Account linking is protected per user

**sessions table:**
- Users can only view/manage their own sessions
- Prevents session hijacking between users

**login_audit table:**
- Users can only view their own login history
- Service role can insert audit records

#### Data Encryption
- Sensitive tokens stored encrypted in database
- OAuth access/refresh tokens stored securely
- Password hashing handled by Supabase Auth (bcrypt)

### 3. API Security

#### Rate Limiting
Implemented for the following endpoints:
- **Login**: 5 attempts per 15 minutes per IP/email
- **Sign up**: 3 attempts per hour per IP
- **API calls**: 100 requests per minute per IP
- **Password reset**: 3 attempts per hour per email

Rate limiting is done in-memory. For production at scale, consider:
- Redis for distributed rate limiting
- API Gateway rate limiting
- DDoS protection service

#### CSRF Protection
- CSRF tokens generated for sensitive operations
- Token validation on state-changing requests
- HTTP-only cookie flag prevents JavaScript access

#### Request Validation
- All inputs validated before processing
- Email format validation
- Password strength requirements
- Type validation using TypeScript

### 4. HTTP Security Headers

Implemented via middleware:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

These headers prevent:
- **Clickjacking**: Frame embedding attacks
- **MIME-type sniffing**: Content-type attacks
- **XSS attacks**: Cross-site scripting
- **Referrer leakage**: Sensitive URL disclosure

### 5. Middleware Protection

#### Route Protection
- Protected routes redirect unauthenticated users to `/login`
- Public routes: `/login`, `/signup`, `/auth/callback`
- API routes are protected by Supabase Auth

#### Session Validation
- User session validated on every request
- Expired/inactive sessions automatically invalidated
- Suspicious activity flagged in audit logs

### 6. Authentication Flow Security

#### OAuth Flow Security
1. Authorization code obtained from provider
2. Code immediately exchanged for session (no storage)
3. Session verified with Supabase
4. User profile created automatically
5. Login audit logged

#### Email/Password Flow Security
1. Credentials sent over HTTPS
2. Password validated server-side
3. Bcrypt hashing (Supabase Auth)
4. Session created upon success
5. Failed attempts logged and rate-limited

### 7. Data Protection

#### In Transit
- HTTPS/TLS for all communications
- HTTP-only cookies prevent XSS token theft
- Secure flag on all cookies

#### At Rest
- Database encryption at Supabase level
- Sensitive fields encrypted
- Backups encrypted and secured

#### Audit Logging
All authentication events logged:
- Successful logins
- Failed attempts
- Account changes
- Session creation/termination
- Provider unlinking

## Implementation Details

### Rate Limiting Implementation

Located in `lib/security/rate-limiter.ts`:

```typescript
const rateLimit = checkRateLimit('identifier', 'login')
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Too many attempts' },
    { status: 429 }
  )
}
```

Customizable rate limits:
- Modify `RATE_LIMITS` object for different thresholds
- Use Redis adapter for distributed systems

### CSRF Protection Implementation

Located in `lib/security/csrf.ts`:

```typescript
const token = generateCSRFToken(sessionId)
// Validate on form submission
const isValid = validateCSRFToken(sessionId, token)
```

### Session Management Implementation

Located in `lib/security/session.ts`:

```typescript
await createSession(userId, email, deviceInfo)
const valid = await validateSession(sessionToken)
await invalidateSession(sessionToken)
```

## Security Checklist

### Development

- [ ] Enable HTTPS in development (use ngrok/localhost tunneling)
- [ ] Use environment variables for all secrets
- [ ] Never commit API keys to version control
- [ ] Test OAuth flow with rate limiting
- [ ] Verify RLS policies block unauthorized access

### Before Production

- [ ] Enable HTTPS everywhere
- [ ] Configure all OAuth providers with production URLs
- [ ] Set strong password requirements (already done)
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Review and adjust rate limiting thresholds
- [ ] Enable Supabase project backup
- [ ] Configure custom domain with SSL
- [ ] Set up WAF (Web Application Firewall)

### Ongoing Monitoring

- [ ] Monitor login audit logs for suspicious patterns
- [ ] Track failed login attempts
- [ ] Alert on unusual activity (location change, new device, etc.)
- [ ] Review session activity regularly
- [ ] Audit API access patterns
- [ ] Monitor rate limit triggers

## Common Security Vulnerabilities & Mitigations

### SQL Injection
**Status: Protected**
- Using parameterized queries via Supabase client
- Input validation on all endpoints
- No raw SQL construction

### Cross-Site Scripting (XSS)
**Status: Protected**
- React escapes JSX content by default
- HTTP-only cookies prevent token theft
- CSP headers can be added for additional protection

### Cross-Site Request Forgery (CSRF)
**Status: Protected**
- CSRF token validation implemented
- SameSite cookie attribute enforced
- State-changing operations protected

### Brute Force Attacks
**Status: Protected**
- Rate limiting on login attempts
- Account lockout possible (can be added)
- Exponential backoff for failed attempts

### Session Hijacking
**Status: Protected**
- HTTP-only cookies prevent JavaScript access
- Session stored in database with user binding
- Device fingerprinting possible (can be added)

### Man-in-the-Middle (MITM)
**Status: Protected**
- HTTPS/TLS encryption
- Secure cookies with Secure flag
- HSTS headers recommended (add to production)

## OAuth Provider Security

Each provider has security requirements:

### Google
- Client secret should not be exposed to client
- Use server-side OAuth code exchange
- Verify token signatures

### Apple
- Private key file must be kept secure
- Token verification required
- Monitor revoked tokens

### Facebook
- App secret must be kept private
- Implement CSRF token validation
- Use HTTPS for all callbacks

### GitHub
- Client secret must not be exposed
- Verify webhook signatures if using
- Use HTTPS for OAuth callback

### Azure AD
- Client secret protected in environment variables
- Implement token validation
- Monitor for suspicious sign-ins

## Recommended Additional Security Measures

### For Production

1. **Web Application Firewall (WAF)**
   - Use Vercel's WAF or Cloudflare
   - Protect against common attacks
   - Log suspicious requests

2. **DDoS Protection**
   - Use CDN with DDoS protection
   - Configure rate limiting at edge
   - Monitor traffic patterns

3. **Intrusion Detection**
   - Monitor for brute force attempts
   - Alert on unusual activity
   - Block IPs after threshold

4. **Security Scanning**
   - Regular vulnerability scanning
   - OWASP ZAP testing
   - Dependency vulnerability checks

5. **Compliance**
   - GDPR compliance for EU users
   - CCPA compliance for California users
   - SOC 2 certification if B2B

### For Enhanced Security

1. **Multi-Factor Authentication (MFA)**
   - TOTP-based 2FA
   - SMS-based 2FA
   - Recovery codes

2. **Device Fingerprinting**
   - Track device changes
   - Flag new devices
   - Require verification

3. **Geo-fencing**
   - Detect unusual locations
   - Alert on location changes
   - Restrict access by region

4. **Behavioral Analytics**
   - Detect unusual patterns
   - Flag suspicious activity
   - Adaptive authentication

## Incident Response

### If Breach Detected

1. **Immediate Actions**
   - Invalidate all user sessions
   - Force password reset
   - Notify affected users
   - Review audit logs

2. **Investigation**
   - Identify affected users
   - Determine scope of compromise
   - Review suspicious activities
   - Check for unauthorized access

3. **Communication**
   - Notify users of incident
   - Provide remediation steps
   - Offer identity protection
   - Maintain transparency

4. **Prevention**
   - Patch vulnerabilities
   - Update security policies
   - Increase monitoring
   - Implement additional controls

## Regular Security Tasks

### Weekly
- Review login audit logs
- Check for rate limit triggers
- Monitor error logs

### Monthly
- Review active sessions
- Audit user accounts
- Check security headers

### Quarterly
- Security vulnerability assessment
- Dependency updates
- Rate limiting threshold review

### Annually
- Full security audit
- Penetration testing
- Compliance review

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security Best Practices](https://nextjs.org/docs/basic-features/security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## Questions?

For security questions or to report vulnerabilities:
1. Review this document first
2. Check Supabase documentation
3. Consult OWASP guidelines
4. Follow responsible disclosure process
