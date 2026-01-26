# Layers Gateway Security Best Practices

**Last Updated:** 2026-01-25
**Status:** Active - Production Reference

This document describes the security architecture and best practices implemented in the Layers API Gateway. Use this as the authoritative reference for security controls.

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication](#authentication)
3. [Authorization & Data Isolation](#authorization--data-isolation)
4. [API Security](#api-security)
5. [Cryptography](#cryptography)
6. [Security Headers](#security-headers)
7. [Logging & Monitoring](#logging--monitoring)
8. [Compliance](#compliance)
9. [Incident Response](#incident-response)
10. [Maintenance Checklist](#maintenance-checklist)

---

## Security Architecture

### Defense in Depth

Layers implements multiple security layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: CORS & Security Headers (middleware.ts)           │
│  - Origin allowlist                                          │
│  - CSP with nonces                                           │
│  - HSTS, X-Frame-Options                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Rate Limiting (lib/middleware/rate-limit.ts)      │
│  - Per-user rate limits                                      │
│  - Tier-based limits (free: 10, pro: 300/min)               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Authentication (lib/middleware/auth.ts)           │
│  - API key validation (lyr_live_xxx)                         │
│  - OAuth 2.1 with PKCE (Supabase Auth)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Input Validation (app/api/v1/chat/route.ts)       │
│  - Message length limits (100k chars)                        │
│  - Array size limits (100 messages)                          │
│  - Credit caps ($1.00/request)                               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Row Level Security (Supabase RLS)                 │
│  - User data isolation at database level                     │
│  - Service role for backend operations                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### API Key Authentication

**File:** `lib/middleware/auth.ts`

API keys are the primary authentication method for API access:

- **Format:** `lyr_live_<base64url-encoded-32-random-bytes>`
- **Storage:** SHA256 hash stored in database (Argon2 migration planned)
- **Validation:** Full key validation including expiration and active status

```typescript
// API key validation flow
1. Extract key from Authorization: Bearer header
2. Validate format (must start with lyr_live_)
3. Hash and lookup in database
4. Check is_active and expires_at
5. Fetch user's credit balance and tier
```

### OAuth Authentication

**Files:** `app/auth/callback/route.ts`, `lib/supabase/middleware.ts`

User authentication uses Supabase Auth with OAuth 2.1:

- **Provider:** Google OAuth
- **PKCE:** Mandatory for all OAuth flows
- **Session:** HTTP-only cookies with secure flags

### Test Mode (Development Only)

**SECURITY:** Test mode is disabled in production:

```typescript
// lib/middleware/auth.ts
function isTestMode(headers?: Headers): boolean {
  // NEVER allow test mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  // ... development-only checks
}
```

**Requirements for test mode:**
- `NODE_ENV !== 'production'`
- `LAYERS_TEST_SECRET` environment variable set
- Matching `X-Layers-Test-Mode` header

---

## Authorization & Data Isolation

### Row Level Security (RLS)

All user data tables have RLS enabled with appropriate policies:

| Table | RLS | Key Policies |
|-------|-----|--------------|
| `profiles` | ✓ | Users can view/update own profile |
| `api_keys` | ✓ | Users can CRUD own keys; service role has full access |
| `credit_balances` | ✓ | Users can view own balance; service role can update |
| `usage_logs` | ✓ | Users can view own logs; service role can insert |
| `notes` | ✓ | Users can CRUD own notes |
| `folders` | ✓ | Users can CRUD own folders |
| `tags` | ✓ | Users can CRUD own tags |
| `note_tags` | ✓ | Users can manage tags on own notes |
| `ai_usage` | ✓ | Users can view/insert own AI usage |
| `session_analytics` | ✓ | Users can manage own sessions |

**Service Role Access:**

The backend uses a service role key for administrative operations. Service role policies allow full access:

```sql
-- Example: Service role can read/update credit_balances
CREATE POLICY "Service role can read credit_balances"
  ON credit_balances FOR SELECT USING (true);

CREATE POLICY "Service role can update credit_balances"
  ON credit_balances FOR UPDATE USING (true);
```

### Performance Indexes

Indexes exist on `user_id` columns for RLS performance:

- `idx_api_keys_user_id` on `api_keys(user_id)`
- `idx_api_keys_key_hash` on `api_keys(key_hash)`

---

## API Security

### CORS Configuration

**File:** `lib/cors/config.ts`

Origin allowlist prevents unauthorized cross-origin requests:

```typescript
// Allowed origins
- https://layers.hustletogether.com
- https://hustletogether.com
- http://localhost:3700 (development only)
```

All API routes include CORS headers via `getCorsHeaders()`.

### Rate Limiting

**File:** `lib/middleware/rate-limit.ts`

Tier-based rate limits:

| Tier | Requests/Minute |
|------|-----------------|
| Free | 10 |
| Starter | 60 |
| Pro | 300 |
| Team | 1000 |

### Input Validation

**Files:** `app/api/v1/chat/route.ts`, `app/api/v1/image/route.ts`

| Limit | Value | Purpose |
|-------|-------|---------|
| Max message length | 100,000 chars | Prevent DoS |
| Max messages array | 100 | Prevent memory exhaustion |
| Max credits/request | 100 (~$1.00) | Cost protection |
| Max prompt length (image) | 10,000 chars | Reasonable limit |
| Max images/request | 4 | Cost protection |

### Error Handling

**SECURITY:** Errors return request IDs, not stack traces:

```typescript
// Bad (exposes internal details)
return { error: 'Internal error', details: String(error) };

// Good (provides reference without exposure)
const requestId = crypto.randomUUID();
console.error('[API Error]', { requestId, error, userId });
return { error: 'Internal server error', request_id: requestId };
```

---

## Cryptography

### API Key Hashing

**Current:** SHA256 (migration to Argon2id planned)

```typescript
// lib/supabase/client.ts
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
```

**Planned Migration:**
```typescript
// Argon2id with OWASP recommended settings
import argon2 from 'argon2';

export async function hashApiKey(key: string): Promise<string> {
  return argon2.hash(key, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}
```

### Key Generation

```typescript
// lib/supabase/client.ts
const randomPart = randomBytes(32).toString('base64url');
const key = `lyr_live_${randomPart}`;
```

---

## Security Headers

**File:** `middleware.ts`

### Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'nonce-{random}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
frame-ancestors 'none';
upgrade-insecure-requests;
```

### Other Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable dangerous APIs |

---

## Logging & Monitoring

### What We Log

- Authentication attempts (success/failure with user ID)
- API requests (model, tokens, latency, credits)
- Rate limit violations
- Webhook events (Stripe)
- Errors with request IDs

### What We Don't Log (GDPR)

- Email addresses (use user IDs instead)
- Stack traces (use request IDs)
- Raw API keys (only hashes)
- Full request bodies with PII

### Log Example

```typescript
// Good logging
console.log('[OAuth Callback]', {
  success: true,
  userId: data?.user?.id,  // ID, not email
  hasSession: true,
});

// Error logging with request ID
console.error('[API Error]', {
  requestId: 'abc-123',
  userId: 'user-456',
  error: error.message,  // Message only, not stack
});
```

---

## Compliance

### GDPR (EU Users)

- **Data Minimization:** Only collect necessary data
- **Right to Access:** Users can view their data in dashboard
- **Right to Deletion:** Account deletion removes all user data
- **PII Protection:** No PII in logs

### PCI DSS (Payments)

- **Status:** Compliant via Stripe
- All payment processing handled by Stripe (PCI Level 1)
- No credit card data stored in our systems
- Webhook signature verification for all Stripe events

---

## Incident Response

### If API Keys Are Compromised

1. **Immediate:** Deactivate affected keys in database
2. **Investigate:** Check usage logs for unauthorized access
3. **Notify:** Alert affected users
4. **Rotate:** Generate new keys for affected users

### If Database Is Compromised

1. **Immediate:** Rotate `SUPABASE_SERVICE_ROLE_KEY`
2. **Investigate:** Review audit logs
3. **Reset:** Force password reset for all users
4. **Rotate:** Regenerate all API keys
5. **Report:** GDPR breach notification within 72 hours if applicable

### Security Contact

Email: alfonso@mirrorfactory.dev
For responsible disclosure of security vulnerabilities.

---

## Maintenance Checklist

### Monthly

- [ ] Review and rotate API keys if needed
- [ ] Check for dependency vulnerabilities (`pnpm audit`)
- [ ] Review rate limit violations for anomalies
- [ ] Check Supabase security advisors

### Quarterly

- [ ] Rotate `STRIPE_WEBHOOK_SECRET`
- [ ] Review and update CORS origins
- [ ] Security header audit (securityheaders.com)
- [ ] Review RLS policies

### Annually

- [ ] Penetration testing
- [ ] Security architecture review
- [ ] Compliance audit (if applicable)
- [ ] Disaster recovery testing

---

## Environment Variables

### Critical Secrets

| Variable | Risk Level | Description |
|----------|------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | CRITICAL | Full database access |
| `AI_GATEWAY_API_KEY` | CRITICAL | AI provider access |
| `STRIPE_SECRET_KEY` | CRITICAL | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | HIGH | Webhook verification |
| `LAYERS_TEST_SECRET` | HIGH | Test mode access (dev only) |

### Security Rules

- Never commit `.env` files
- Use different keys for dev/staging/prod
- Store in encrypted Vercel environment variables
- Rotate quarterly at minimum

---

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Stripe Webhook Security](https://docs.stripe.com/webhooks/signature)
