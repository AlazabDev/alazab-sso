# CDN Caching Strategy

## Overview
Production caching strategy for optimal performance and security.

## Cache Rules

### 1. API Routes (No Cache)
```
Path: /api/*
Cache-Control: no-store, no-cache, must-revalidate
TTL: 0 seconds
Purpose: Ensure fresh auth data on every request
```

### 2. Authentication Pages (No Cache)
```
Path: /login, /signup, /auth/*
Cache-Control: no-store, no-cache, must-revalidate
TTL: 0 seconds
Purpose: Always show current auth state
```

### 3. Protected Routes (No Cache)
```
Path: /dashboard, /settings, /admin/*
Cache-Control: no-store, no-cache, must-revalidate
TTL: 0 seconds
Purpose: User-specific content must be fresh
```

### 4. Static Assets (Cache Forever)
```
Path: /_next/static/*
Cache-Control: public, max-age=31536000, immutable
TTL: 1 year
Purpose: Next.js content hash ensures updates
```

### 5. Public Pages (Moderate Cache)
```
Path: /, /about, /contact
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
TTL: 1 hour (with 1-day stale)
Purpose: Balance freshness and performance
```

## Vercel CDN Configuration

The CDN caching is configured in `next.config.mjs` with the following rules:

### Static Assets
- Cached indefinitely with immutable flag
- Hash-based cache busting
- No re-validation needed

### HTML Pages
- Dynamic pages: No caching
- Static pages: Cache with stale-while-revalidate
- Auth pages: Always fresh

### API Endpoints
- No caching
- Direct to serverless functions
- Suitable for real-time data

## Cache Purging

### Manual Purge
```bash
# Purge entire cache
vercel env pull production
vercel deploy --prod

# Purge specific path
# Available through Vercel dashboard
```

### Automatic Purge
- On deployment: Full cache clear
- On code changes: Affected paths only
- On-demand ISR: Per-route revalidation

## Performance Metrics

Monitor these metrics in Vercel Analytics:

- **Time to First Byte (TTFB)**: Target < 200ms
- **First Contentful Paint (FCP)**: Target < 1.5s
- **Largest Contentful Paint (LCP)**: Target < 2.5s
- **Cumulative Layout Shift (CLS)**: Target < 0.1

## ISR (Incremental Static Regeneration)

For dynamic content that doesn't need real-time updates:

```javascript
// Example: User profile page
export async function generateStaticParams() {
  return [{ id: 'user-1' }, { id: 'user-2' }]
}

export const revalidate = 60 // Revalidate every 60 seconds
```

## Security vs Performance Trade-off

| Route | Cache | Security | Reason |
|-------|-------|----------|--------|
| Auth pages | No | High | User state must be fresh |
| API routes | No | High | Real-time data critical |
| Dashboard | No | High | User-specific content |
| Public pages | Yes | Medium | Non-sensitive content |
| Static assets | Yes | High | Hash-based invalidation |

## Monitoring Cache Hit Rate

```javascript
// Monitor in logs/analytics
console.log('X-Cache header:', response.headers.get('X-Cache'))
// Hit: X-Cache: MISS, HIT, STALE
```

## Production Deployment Checklist

- [ ] Verify cache headers in response
- [ ] Test cache purging works
- [ ] Monitor cache hit rates
- [ ] Set up cache alerts
- [ ] Document cache invalidation process
- [ ] Test stale-while-revalidate behavior
