# Layers Gateway Security Implementation Guide

**Last Updated:** 2026-01-25
**Status:** Living Document - Updated with 2026 Industry Research

## Executive Summary

This document consolidates all security concerns, industry research, and implementation recommendations for the Layers API Gateway. Use this as the master reference for security hardening.

### Critical Industry Context (2026)

- **99% of organizations** experienced an API security incident in the past year ([Qodex.ai 2026 Report](https://qodex.ai/blog/15-api-security-best-practices-to-secure-your-apis-in-2026))
- **Critical vulnerabilities** discovered in React Server Components (CVE-2025-55182, CVE-2025-66478) - CVSS 10.0 ([Next.js Security Update](https://nextjs.org/blog/security-update-2025-12-11))
- **OAuth 2.1** now mandatory with PKCE for all clients ([OAuth 2.1 Spec](https://oauth.net/2.1/))
- **Argon2** is now the gold standard for password/API key hashing, replacing bcrypt ([OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html))

---

## Table of Contents

1. [Critical Security Concerns](#critical-security-concerns)
2. [Industry Best Practices Research](#industry-best-practices-research)
3. [Implementation Guide](#implementation-guide)
4. [Database Security (RLS)](#database-security-rls)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Security](#api-security)
7. [Monitoring & Detection](#monitoring--detection)
8. [Compliance](#compliance)
9. [Implementation Timeline](#implementation-timeline)
10. [Sources & References](#sources--references)

---

## Critical Security Concerns

### 1. Row Level Security (RLS) Bypass ⚠️ CRITICAL

**Current State:**
```typescript
// lib/supabase/client.ts:8
// Create a Supabase server client with service role key (bypasses RLS)
export function createServerClient(): SupabaseClient {
  serverClient = createClient(url, serviceKey, { /* ... */ });
  return serverClient;
}
```

**Risk:** Service role key bypasses ALL Row Level Security policies. Application code is the ONLY protection preventing users from accessing other users' data.

**Supabase Official Documentation States:**
> "RLS must always be enabled on any tables stored in an exposed schema. Any table without RLS enabled in the public schema will be accessible to the public using the anon role."
> — [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

**Performance Best Practice:**
> "Make sure you've added indexes on any columns used within the Policies. This can provide over 100x performance improvements on large tables."
> — [Supabase RLS Performance Guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

**Implementation:**

```sql
-- 1. Enable RLS on ALL tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for user-specific data
CREATE POLICY "Users can view own credit balance"
  ON credit_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Service role policies (for admin operations)
CREATE POLICY "Service role has full access to credit_balances"
  ON credit_balances
  USING (auth.jwt()->>'role' = 'service_role');

-- 4. Add indexes for performance (CRITICAL for RLS performance)
CREATE INDEX idx_credit_balances_user_id ON credit_balances(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);

-- 5. Create composite indexes for common queries
CREATE INDEX idx_usage_logs_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_keys_user_active ON api_keys(user_id, is_active);
```

**Efficient Query Patterns:**

Supabase RLS performance guide recommends:
> "When querying with team/join tables, use efficient query patterns: `team_id in (select team_id from team_user where user_id = auth.uid())` is much faster than `auth.uid() in (select user_id from team_user where team_user.team_id = table.team_id)`"

**Testing RLS Policies:**

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-here"}';

-- This should only return rows for this user
SELECT * FROM credit_balances;

-- Reset
RESET ROLE;
```

**Files to Audit:**
- `app/api/v1/chat/route.ts:252-270` - Usage logging
- `app/api/webhooks/stripe/route.ts:114-124` - Credit balance updates
- All database queries in `lib/middleware/credits.ts`

---

### 2. Test Mode Authentication Bypass ⚠️ CRITICAL

**Current State:**
```typescript
// lib/middleware/auth.ts:5
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET || 'layers-integration-test-2026';
```

**Risk:**
- Hardcoded default secret visible in public GitHub repo
- Anyone can bypass authentication with `X-Layers-Test-Mode: layers-integration-test-2026`
- Could access all user data and drain credits

**Fixed Implementation:**

```typescript
// lib/middleware/auth.ts
// Remove hardcoded default - require environment variable
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET;

if (!TEST_MODE_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  LAYERS_TEST_SECRET not set - test mode disabled');
}

function isTestMode(headers?: Headers): boolean {
  // NEVER allow test mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Check environment variables (for CI/test environments)
  if (process.env.NODE_ENV === 'test' ||
      process.env.LAYERS_TEST_MODE === 'true' ||
      process.env.CI === 'true') {
    return true;
  }

  // Check for test header only if secret is configured
  if (headers && TEST_MODE_SECRET) {
    const testHeader = headers.get('X-Layers-Test-Mode');
    if (testHeader === TEST_MODE_SECRET) {
      return true;
    }
  }

  return false;
}
```

**Generate Secure Secret:**
```bash
# Generate cryptographically secure random secret
openssl rand -base64 48
# Output: 3xK9mP2qR8sL5nB7vC4dF6gH1jK0mN9pQ2rS5tU8vW1xY4zA7bC3dE6fG9hJ2k
```

**Environment Variable Setup:**
```bash
# .env.local (never commit)
LAYERS_TEST_SECRET=3xK9mP2qR8sL5nB7vC4dF6gH1jK0mN9pQ2rS5tU8vW1xY4zA7bC3dE6fG9hJ2k

# .env.production (never allow test mode)
# Do not set LAYERS_TEST_SECRET in production
```

**Additional Security - IP Allowlisting (Optional):**
```typescript
const ALLOWED_TEST_IPS = process.env.ALLOWED_TEST_IPS?.split(',') || [];

function isTestMode(headers?: Headers, ip?: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;

  // Only allow test mode from specific IPs (CI servers)
  if (ip && ALLOWED_TEST_IPS.length > 0 && !ALLOWED_TEST_IPS.includes(ip)) {
    console.warn(`Test mode blocked from unauthorized IP: ${ip}`);
    return false;
  }

  // ... rest of logic
}
```

---

### 3. Missing CORS Configuration ⚠️ HIGH

**Current State:** No CORS restrictions. Any website can call your API.

**OWASP/Security Research:**

> "Allowing all origins (*) without proper authorization can expose sensitive data to malicious websites."
> — [Stack Hawk CORS Guide](https://www.stackhawk.com/blog/what-is-cors/)

> "Ditch the wildcard (*) in production, especially with credentials, and be specific about who gets access to your API."
> — [Mastering CORS with RESTful APIs](https://dev.to/mahmud-r-farhan/mastering-cors-with-restful-apis-configuration-best-practices-fixes-3d4n)

> "When using credentials, you cannot use the wildcard for origins and must specify exact origins to prevent credential exposure."
> — [CORS Security Best Practices](https://www.aikido.dev/blog/cors-security-beyond-basic-configuration)

**Implementation:**

```typescript
// lib/cors/config.ts
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://layers.hustletogether.com',
  'https://hustletogether.com',
  'https://www.hustletogether.com',
];

// Local development
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3700');
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin', // Prevent cache poisoning
  };
}

export function isOriginAllowed(origin: string | null): boolean {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}
```

**Apply to API Routes:**

```typescript
// app/api/v1/chat/route.ts

import { getCorsHeaders } from '@/lib/cors/config';

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  // ... existing code ...

  return NextResponse.json(
    { /* response */ },
    {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        ...getCorsHeaders(request.headers.get('origin')),
      },
    }
  );
}
```

**Environment Variables:**
```bash
# Production
ALLOWED_ORIGINS=https://layers.hustletogether.com,https://hustletogether.com

# Staging
ALLOWED_ORIGINS=https://staging.layers.hustletogether.com,https://layers.hustletogether.com
```

---

### 4. PII in Production Logs ⚠️ MEDIUM (GDPR Risk)

**Current Issues:**

```typescript
// app/auth/callback/route.ts:51 ❌ BAD
console.log('[OAuth Callback] Code exchange result:', {
  user: data?.user?.email,  // GDPR violation - logging PII
});

// app/api/v1/chat/route.ts:357 ❌ BAD
return NextResponse.json(
  { error: 'Internal server error', details: String(error) },  // Exposes stack traces
  { status: 500 }
);
```

**Fixed Implementation:**

```typescript
// app/auth/callback/route.ts:51 ✅ GOOD
console.log('[OAuth Callback] Code exchange result:', {
  success: !error,
  error: error?.message,
  hasSession: !!data?.session,
  userId: data?.user?.id, // Use ID, not email
});

// app/api/v1/chat/route.ts:357 ✅ GOOD
const requestId = crypto.randomUUID();
console.error('[API Error]', { requestId, error, userId, stack: error.stack });

return NextResponse.json(
  {
    error: 'Internal server error',
    request_id: requestId,  // For support reference
  },
  { status: 500 }
);
```

**Logging Best Practices:**

```typescript
// lib/logging/sanitize.ts
export function sanitizeLogData(data: any): any {
  const PII_FIELDS = ['email', 'phone', 'address', 'ssn', 'ip_address'];

  if (typeof data !== 'object' || data === null) return data;

  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (PII_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Usage
console.log('[User Action]', sanitizeLogData(userData));
```

---

### 5. API Key Hashing (SHA256 → Argon2) ⚠️ MEDIUM

**Current Implementation:**
```typescript
// lib/supabase/client.ts:46
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
```

**OWASP Recommendation (2026):**

> "Use Argon2id with a minimum configuration of 19 MiB of memory, an iteration count of 2, and 1 degree of parallelism."
> — [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

**Why Argon2 Over bcrypt:**

> "Argon2 is the gold standard for password hashing in 2025... specifically designed to maximize resistance against modern attack methods including GPU, ASIC, and side-channel attacks."
> — [Password Hashing Guide 2025](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/)

**Implementation:**

```typescript
// lib/supabase/client.ts
import argon2 from 'argon2';

/**
 * Hash an API key using Argon2id (OWASP recommended 2026)
 * Much more secure than SHA256 against rainbow table attacks
 *
 * Configuration:
 * - Algorithm: Argon2id (resistant to GPU and side-channel attacks)
 * - Memory: 19 MiB (OWASP minimum)
 * - Iterations: 2 (OWASP minimum)
 * - Parallelism: 1 (single-threaded for API keys)
 */
export async function hashApiKey(key: string): Promise<string> {
  return argon2.hash(key, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB in KiB
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, key);
  } catch {
    return false;
  }
}

/**
 * Generate a new API key with secure random bytes
 * Format: lyr_live_<base64url-encoded-44-random-bytes>
 */
export async function generateApiKey(): Promise<{
  key: string;
  prefix: string;
  hash: string
}> {
  const prefix = 'lyr_live_';
  const randomPart = randomBytes(44).toString('base64url'); // 44 bytes = ~59 chars
  const key = `${prefix}${randomPart}`;
  const hash = await hashApiKey(key);

  return { key, prefix, hash };
}
```

**Install Dependencies:**
```bash
pnpm add argon2
```

**Migration Strategy:**

```typescript
// Gradual migration - support both during transition
export async function verifyApiKeyLegacy(key: string, hash: string): Promise<boolean> {
  // Try Argon2 first (new hashes)
  if (hash.startsWith('$argon2')) {
    return verifyApiKey(key, hash);
  }

  // Fall back to SHA256 (old hashes)
  const sha256Hash = createHash('sha256').update(key).digest('hex');
  return sha256Hash === hash;
}

// Upgrade hash on successful login
export async function upgradeHashIfNeeded(keyId: string, key: string, currentHash: string) {
  if (!currentHash.startsWith('$argon2')) {
    const newHash = await hashApiKey(key);
    await supabase
      .from('api_keys')
      .update({ key_hash: newHash })
      .eq('id', keyId);
  }
}
```

---

## Industry Best Practices Research

### API Gateway Security (OWASP 2026)

**Source:** [OWASP Secure API Gateway Blueprint](https://owasp.org/www-project-secure-api-gateway-blueprint/)

Key practices:
1. **Centralized Security Controls** - Gateway should terminate every request, centralizing auth, rate limits, schema validation
2. **WAF Integration** - Define rules for SQLi/XSS using OWASP CRS
3. **TLS Configuration** - No TLS 1.0/1.1, only 1.2+ with strong ciphers
4. **Bot Protection** - Detect and block automated attacks
5. **Schema Validation** - Validate request/response schemas

### Next.js Security (2026)

**Critical CVEs Discovered:**

- **CVE-2025-55182** (React RSC) - CVSS 10.0, Remote Code Execution
- **CVE-2025-66478** (Next.js) - Critical RCE vulnerability
- **Fixed:** January 13, 2026 update

**Source:** [Next.js Security Update](https://nextjs.org/blog/security-update-2025-12-11)

**Production Checklist:**

From [Next.js Production Guide](https://nextjs.org/docs/app/guides/production-checklist):

1. **Content Security Policy** - Protect against XSS, clickjacking, code injection
2. **Environment Variables** - Add `.env.*` to `.gitignore`, only prefix public vars with `NEXT_PUBLIC_`
3. **Data Tainting** - Prevent sensitive data exposure to client
4. **Server Actions Security** - Ensure users are authorized to call Server Actions

**Security Headers:**

From [Next.js Security Headers Guide](https://nextjs.org/docs/app/guides/content-security-policy):

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Content Security Policy with nonces
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"
    } 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}
```

**Important:**
> "'unsafe-eval' should not be included in production environment, but should be added only when it is not a production environment."
> — [Next.js CSP Guide](https://nextjs.org/docs/app/guides/content-security-policy)

### OAuth 2.1 Security (2026)

**Source:** [OAuth 2.1 Features for 2026](https://rgutierrez2004.medium.com/oauth-2-1-features-you-cant-ignore-in-2026-a15f852cb723)

**Key Changes:**
- **PKCE Mandatory** - Required for ALL clients (public + confidential)
- **Implicit Grant Removed** - Too risky, use Authorization Code + PKCE
- **ROPC Removed** - Resource Owner Password Credentials deprecated
- **Exact Match Redirect URIs** - No wildcards or partial matches

**Security Benefits:**

> "PKCE protects against authorization code interception attacks, especially in cases where the code could be intercepted during redirect handling or in misconfigured environments."
> — [OAuth 2.0 Security Best Practices](https://medium.com/@basakerdogan/oauth-2-0-security-best-practices-from-authorization-code-to-pkce-beccdbe7ec35)

**Implementation (Supabase handles this):**

Your current Supabase Auth implementation already uses PKCE. Verify:

```typescript
// Verify PKCE in OAuth callback
console.log('[OAuth] Security check:', {
  hasPKCE: !!searchParams.get('code_verifier'),
  hasState: !!searchParams.get('state'), // CSRF protection
  redirectUriMatch: true, // Supabase validates
});
```

### Rate Limiting & DDoS Protection

**Source:** [API Rate Limiting Strategies](https://www.apisec.ai/blog/api-rate-limiting-strategies-preventing)

**Recommended Algorithms:**
1. **Token Bucket** - For burst tolerance
2. **Sliding Window** - For accuracy
3. **Leaky Bucket** - For predictable rates

**Best Practices:**

> "Implement dynamic limits that tighten during detected attacks and relax during normal operation."
> — [5 Tips for API Security Against DDoS](https://api7.ai/blog/5-tips-for-enhancing-api-security)

**Implementation:**

```typescript
// lib/middleware/rate-limit.ts

interface RateLimiter {
  algorithm: 'token-bucket' | 'sliding-window' | 'leaky-bucket';
  limit: number;
  window: number; // milliseconds
}

// Adaptive rate limiting
export function getAdaptiveLimit(userId: string, tier: TierName): number {
  const baseLimits = {
    free: 10,
    starter: 60,
    pro: 300,
    team: 1000,
  };

  const baseLimit = baseLimits[tier];

  // Check for anomalies
  const recentErrors = getRecentErrorCount(userId, 3600_000); // Last hour
  const suspiciousActivity = recentErrors > baseLimit * 0.5;

  if (suspiciousActivity) {
    console.warn(`[Rate Limit] Reduced limit for suspicious user: ${userId}`);
    return Math.floor(baseLimit * 0.5); // 50% reduction
  }

  return baseLimit;
}

// IP-based rate limiting (unauthenticated)
export function checkIpRateLimit(ip: string): RateLimitResult {
  const MAX_REQUESTS_PER_IP = 100;
  const WINDOW_MS = 60_000; // 1 minute

  const key = `ip:${ip}`;
  const now = Date.now();

  // Sliding window implementation
  const requests = getRecentRequests(key, WINDOW_MS);

  if (requests.length >= MAX_REQUESTS_PER_IP) {
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_IP,
      remaining: 0,
      resetAt: requests[0].timestamp + WINDOW_MS,
    };
  }

  addRequest(key, now);

  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_IP,
    remaining: MAX_REQUESTS_PER_IP - requests.length - 1,
    resetAt: now + WINDOW_MS,
  };
}
```

### Stripe Webhook Security

**Source:** [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)

**Critical Requirements:**

> "Never trust incoming webhooks without verifying the signature, as anyone can send a POST request to your endpoint."
> — [Stripe Webhook Security](https://docs.stripe.com/webhooks/signature)

**Best Practices:**

1. **Signature Verification** - Always verify `stripe-signature` header
2. **Idempotency** - Store processed event IDs to prevent duplicates
3. **Replay Attack Prevention** - Check timestamp tolerance (default 5 min)
4. **HTTPS Required** - Webhooks only work with valid TLS certificates
5. **Quick Response** - Return 2xx within 5 seconds

**Enhanced Implementation:**

```typescript
// app/api/webhooks/stripe/route.ts

const processedEvents = new Map<string, number>(); // Use Redis in production

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify signature
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Check for duplicate/replay (idempotency)
  const eventTimestamp = event.created * 1000;
  const now = Date.now();

  if (now - eventTimestamp > 300_000) { // 5 minutes
    console.warn('[Webhook] Event too old, possible replay:', event.id);
    return NextResponse.json({ error: 'Event too old' }, { status: 400 });
  }

  if (processedEvents.has(event.id)) {
    console.log('[Webhook] Event already processed:', event.id);
    return NextResponse.json({ received: true }); // Acknowledge
  }

  // Process event asynchronously to return quickly
  processEventAsync(event).catch(err => {
    console.error('[Webhook] Processing error:', err);
  });

  // Mark as processed
  processedEvents.set(event.id, now);

  // Return success within 5 seconds (Stripe requirement)
  return NextResponse.json({ received: true });
}

async function processEventAsync(event: Stripe.Event) {
  // Store in database first for durability
  await supabase.from('processed_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
  });

  // Process based on event type
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    // ... other event types
  }
}
```

**Cleanup Old Events (Prevent Memory Leak):**

```typescript
// Run periodically (cron job)
setInterval(() => {
  const oneHourAgo = Date.now() - 3600_000;
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (timestamp < oneHourAgo) {
      processedEvents.delete(eventId);
    }
  }
}, 600_000); // Every 10 minutes
```

---

## Implementation Guide

### Phase 1: Critical Fixes (Week 1)

**Priority: CRITICAL - Do Immediately**

**Checklist:**
- [ ] Enable RLS on all tables
- [ ] Create RLS policies for each table
- [ ] Add indexes on `user_id` columns
- [ ] Test RLS policies with different users
- [ ] Remove hardcoded `TEST_MODE_SECRET` default
- [ ] Generate secure test secret (`openssl rand -base64 48`)
- [ ] Disable test mode in production
- [ ] Implement CORS with origin allowlist
- [ ] Add CORS OPTIONS handler
- [ ] Remove PII from all logs (email → user ID)
- [ ] Disable demo mode in production

**Files to Modify:**
1. `lib/middleware/auth.ts` - Test mode fix
2. `lib/cors/config.ts` - CORS configuration
3. `app/api/v1/chat/route.ts` - Apply CORS
4. `app/api/v1/image/route.ts` - Apply CORS
5. `app/auth/callback/route.ts` - Remove email logging
6. Database - RLS policies and indexes

**SQL Script:**
```sql
-- Phase 1: Critical Security Fixes
-- Run this in Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create user policies
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "api_keys_select_own" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_balances_select_own" ON credit_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_logs_select_own" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_transactions_select_own" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- 3. Create service role policies (admin access)
CREATE POLICY "service_role_all_users" ON users
  USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role_all_api_keys" ON api_keys
  USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role_all_credit_balances" ON credit_balances
  USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role_all_usage_logs" ON usage_logs
  USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role_all_credit_transactions" ON credit_transactions
  USING (auth.jwt()->>'role' = 'service_role');

-- 4. Add performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_balances_user_id
  ON credit_balances(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_id
  ON api_keys(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_logs_user_id
  ON usage_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user_id
  ON credit_transactions(user_id);

-- 5. Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_logs_user_created
  ON usage_logs(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_keys_user_active
  ON api_keys(user_id, is_active);

-- 6. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
-- Should return 0 rows
```

### Phase 2: Security Headers & Hashing (Week 2)

**Priority: HIGH**

**Checklist:**
- [ ] Install Argon2 (`pnpm add argon2`)
- [ ] Implement Argon2 hashing for API keys
- [ ] Create migration for existing hashes
- [ ] Add CSP headers via middleware
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Set request body size limit (1MB)
- [ ] Test CSP with nonces in production

**Implementation:**

```typescript
// middleware.ts (root of project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"
    } 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data: https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Body Size Limit:**

```javascript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

### Phase 3: Rate Limiting & Input Validation (Week 3)

**Priority: HIGH**

**Checklist:**
- [ ] Implement IP-based rate limiting
- [ ] Add adaptive rate limiting
- [ ] Add max credits per request ($1.00)
- [ ] Add max credits per hour ($10.00)
- [ ] Add message length validation (100k chars)
- [ ] Add messages array size limit (100 messages)
- [ ] Add anomaly detection

**Implementation:**

```typescript
// app/api/v1/chat/route.ts

// Add at top of file
const MAX_MESSAGE_LENGTH = 100_000; // 100k characters
const MAX_MESSAGES_ARRAY = 100;
const MAX_CREDITS_PER_REQUEST = 100; // ~$1.00 USD
const MAX_CREDITS_PER_HOUR = 1000; // ~$10.00 USD

export async function POST(request: NextRequest) {
  // ... existing auth code ...

  // 2.5 Check IP-based rate limit (before auth)
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const ipRateLimit = checkIpRateLimit(ip);
  if (!ipRateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests from this IP' },
      { status: 429, headers: getRateLimitHeaders(ipRateLimit) }
    );
  }

  // 3. Parse and validate request
  const body: ChatRequest = await request.json();

  // Validate message length
  if (messages.some(m => m.content && m.content.length > MAX_MESSAGE_LENGTH)) {
    return NextResponse.json(
      {
        error: 'Message content exceeds maximum length',
        max_length: MAX_MESSAGE_LENGTH
      },
      { status: 400 }
    );
  }

  // Validate messages array size
  if (messages.length > MAX_MESSAGES_ARRAY) {
    return NextResponse.json(
      {
        error: 'Too many messages in conversation',
        max_messages: MAX_MESSAGES_ARRAY
      },
      { status: 400 }
    );
  }

  // 4. Pre-flight credit check with limits
  const estimated = estimateCredits(model, max_tokens);

  // Check per-request limit
  if (estimated > MAX_CREDITS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: 'Request exceeds maximum cost per request',
        max_credits: MAX_CREDITS_PER_REQUEST,
        estimated_credits: estimated,
        estimated_usd: creditsToUsd(estimated),
      },
      { status: 400 }
    );
  }

  // Check hourly limit
  const hourlyUsage = await getHourlyCreditsUsed(userId);
  if (hourlyUsage + estimated > MAX_CREDITS_PER_HOUR) {
    return NextResponse.json(
      {
        error: 'Hourly credit limit exceeded',
        max_credits_per_hour: MAX_CREDITS_PER_HOUR,
        current_usage: hourlyUsage,
        estimated_request: estimated,
      },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

### Phase 4: Monitoring & Audit Logging (Week 4)

**Priority: MEDIUM**

**Checklist:**
- [ ] Create audit_logs table
- [ ] Implement audit logging functions
- [ ] Add anomaly detection
- [ ] Set up alerts for suspicious activity
- [ ] Create monitoring dashboard
- [ ] Document incident response procedures

**Database Schema:**

```sql
-- Audit Logging Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity)
  WHERE severity IN ('warning', 'critical');
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);

-- Processed webhook events (idempotency)
CREATE TABLE processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_processed_webhooks_event_id ON processed_webhook_events(event_id);
CREATE INDEX idx_processed_webhooks_processed_at ON processed_webhook_events(processed_at DESC);
```

**Audit Logging Implementation:**

```typescript
// lib/audit/logger.ts

export enum AuditEventType {
  API_KEY_CREATED = 'api_key_created',
  API_KEY_DELETED = 'api_key_deleted',
  AUTH_FAILED = 'auth_failed',
  CREDIT_PURCHASED = 'credit_purchased',
  CREDIT_REFUNDED = 'credit_refunded',
  TIER_CHANGED = 'tier_changed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  USAGE_SPIKE = 'usage_spike_detected',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

interface AuditLogEntry {
  user_id?: string;
  event_type: AuditEventType;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: AuditSeverity;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  const supabase = createServerClient();

  const { error } = await supabase.from('audit_logs').insert({
    user_id: entry.user_id,
    event_type: entry.event_type,
    ip_address: entry.ip_address,
    user_agent: entry.user_agent,
    metadata: entry.metadata,
    severity: entry.severity,
  });

  if (error) {
    console.error('[Audit] Failed to log event:', error);
  }

  // Send alert for critical events
  if (entry.severity === AuditSeverity.CRITICAL) {
    await sendSecurityAlert(entry);
  }
}

// Usage examples
await logAudit({
  user_id: userId,
  event_type: AuditEventType.API_KEY_CREATED,
  ip_address: request.headers.get('x-forwarded-for'),
  user_agent: request.headers.get('user-agent'),
  metadata: { key_id: newKey.id },
  severity: AuditSeverity.INFO,
});

await logAudit({
  event_type: AuditEventType.AUTH_FAILED,
  ip_address: ip,
  metadata: { attempts: failedAttempts },
  severity: failedAttempts > 10 ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
});
```

**Anomaly Detection:**

```typescript
// lib/security/anomaly-detection.ts

export async function detectAnomalies(userId: string): Promise<{
  detected: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  // 1. Check usage spike (10x normal)
  const hourlyUsage = await getHourlyCreditsUsed(userId);
  const normalUsage = await getAverageHourlyUsage(userId);

  if (hourlyUsage > normalUsage * 10) {
    reasons.push(`Usage spike: ${hourlyUsage} credits vs normal ${normalUsage}`);

    await logAudit({
      user_id: userId,
      event_type: AuditEventType.USAGE_SPIKE,
      metadata: { hourlyUsage, normalUsage },
      severity: AuditSeverity.WARNING,
    });
  }

  // 2. Check rapid key creation
  const recentKeys = await getKeysCreatedInLastHour(userId);
  if (recentKeys > 5) {
    reasons.push(`Rapid key creation: ${recentKeys} in last hour`);
  }

  // 3. Check for multiple refunds
  const recentRefunds = await getRefundsInLastWeek(userId);
  if (recentRefunds > 2) {
    reasons.push(`Multiple refunds: ${recentRefunds} in last week`);
  }

  // 4. Check failed auth attempts
  const failedAttempts = await getFailedAuthAttemptsInLastHour(userId);
  if (failedAttempts > 20) {
    reasons.push(`Excessive auth failures: ${failedAttempts}`);
  }

  if (reasons.length > 0) {
    await logAudit({
      user_id: userId,
      event_type: AuditEventType.SUSPICIOUS_ACTIVITY,
      metadata: { reasons },
      severity: reasons.length > 2 ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
    });
  }

  return {
    detected: reasons.length > 0,
    reasons,
  };
}
```

---

## Complete Implementation Timeline

### Week 1: Critical Security Fixes
**Days 1-2: Database Security (RLS)**
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Add performance indexes
- [ ] Test policies with different users

**Days 3-4: Authentication & CORS**
- [ ] Fix test mode bypass vulnerability
- [ ] Implement CORS configuration
- [ ] Remove PII from logs

**Day 5: Testing & Verification**
- [ ] Audit all database queries
- [ ] Test RLS policies
- [ ] Test CORS from different origins
- [ ] Verify no PII in logs

### Week 2: Security Headers & Hashing
**Days 1-2: Argon2 Migration**
- [ ] Install argon2 package
- [ ] Implement hashing functions
- [ ] Create migration strategy
- [ ] Test with new and old hashes

**Days 3-4: Security Headers**
- [ ] Create middleware with CSP
- [ ] Add security headers
- [ ] Configure nonces
- [ ] Test CSP in production

**Day 5: Body Size & Testing**
- [ ] Add request size limits
- [ ] Test all endpoints
- [ ] Monitor for CSP violations

### Week 3: Rate Limiting & Validation
**Days 1-2: Enhanced Rate Limiting**
- [ ] Implement IP-based rate limiting
- [ ] Add adaptive rate limiting
- [ ] Test rate limit scenarios

**Days 3-4: Input Validation & Cost Controls**
- [ ] Add message length validation
- [ ] Add array size validation
- [ ] Implement max credits per request
- [ ] Implement max credits per hour

**Day 5: Testing**
- [ ] Test all validation rules
- [ ] Test cost controls
- [ ] Load testing

### Week 4: Monitoring & Audit Logging
**Days 1-2: Audit Logging**
- [ ] Create audit_logs table
- [ ] Implement audit functions
- [ ] Add audit logs to critical operations

**Days 3-4: Anomaly Detection**
- [ ] Implement anomaly detection
- [ ] Set up alerts
- [ ] Create monitoring dashboard

**Day 5: Documentation & Training**
- [ ] Document incident response
- [ ] Create security runbook
- [ ] Team security training

---

## Environment Variables Security

### Critical Secrets

| Variable | Risk | If Compromised |
|----------|------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 CRITICAL | Full database access |
| `AI_GATEWAY_API_KEY` | 🔴 CRITICAL | Expensive AI requests |
| `STRIPE_SECRET_KEY` | 🔴 CRITICAL | Can charge customers |
| `STRIPE_WEBHOOK_SECRET` | 🟠 HIGH | Can forge webhooks |
| `LAYERS_TEST_SECRET` | 🟠 HIGH | Bypass authentication |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🟡 MEDIUM | Limited by RLS |

### Secret Management Checklist

- [ ] Never commit `.env` files to git
- [ ] Add `.env*` to `.gitignore`
- [ ] Use Vercel encrypted environment variables
- [ ] Different keys for dev/staging/production
- [ ] Rotate keys quarterly (at minimum)
- [ ] Monitor for leaked keys (GitHub secret scanning)
- [ ] Store in password manager (1Password, Bitwarden)
- [ ] Document key rotation procedures
- [ ] Use different Supabase projects for dev/prod
- [ ] Enable GitHub Dependabot

---

## Compliance Considerations

### GDPR (EU Users)

**Requirements:**
- Right to access - Users can export data
- Right to deletion - Delete accounts completely
- Data minimization - Only collect necessary data
- Breach notification - Within 72 hours
- Logging PII - Remove from production logs

**Implementation:**

```typescript
// User data export
export async function exportUserData(userId: string) {
  const supabase = createServerClient();

  const [apiKeys, usage, transactions] = await Promise.all([
    supabase.from('api_keys').select('*').eq('user_id', userId),
    supabase.from('usage_logs').select('*').eq('user_id', userId),
    supabase.from('credit_transactions').select('*').eq('user_id', userId),
  ]);

  return {
    api_keys: apiKeys.data,
    usage_logs: usage.data,
    transactions: transactions.data,
  };
}

// User data deletion
export async function deleteUserData(userId: string) {
  const supabase = createServerClient();

  // Cascade deletes handled by database foreign keys
  await supabase.from('users').delete().eq('id', userId);

  await logAudit({
    user_id: userId,
    event_type: 'user_deleted',
    severity: AuditSeverity.INFO,
  });
}
```

### PCI DSS (Credit Cards)

**Current State:** ✅ COMPLIANT

Layers uses Stripe for all payment processing (PCI Level 1 certified). We never handle raw credit card data.

**Best Practices:**
- All payment data flows through Stripe
- No card numbers stored in our database
- Stripe Elements for card input
- Webhooks for payment status

### SOC 2 Type II (Enterprise Customers)

**If Targeting Enterprise:**

1. **Security Controls**
   - Implement all items in this document
   - Document security policies
   - Regular penetration testing
   - Vendor risk assessments

2. **Access Controls**
   - Principle of least privilege
   - MFA for admin access
   - Audit logs for all access

3. **Change Management**
   - Code review process
   - Deployment procedures
   - Rollback capabilities

4. **Incident Response**
   - Documented procedures
   - 24/7 on-call rotation
   - Post-mortem process

---

## Sources & References

### API Gateway Security
- [OWASP Secure API Gateway Blueprint](https://owasp.org/www-project-secure-api-gateway-blueprint/)
- [API Gateway Security Best Practices 2026](https://www.practical-devsecops.com/api-gateway-security-best-practices/)
- [15 API Security Best Practices for 2026](https://qodex.ai/blog/15-api-security-best-practices-to-secure-your-apis-in-2026)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

### Next.js Security
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js Security Checklist](https://blog.arcjet.com/next-js-security-checklist/)
- [Next.js Security Update December 2025](https://nextjs.org/blog/security-update-2025-12-11)

### Supabase Security
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Securing Your Supabase API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Auth Token Security](https://supabase.com/docs/guides/auth/oauth-server/token-security)

### Authentication & Hashing
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Password Hashing Guide 2025: Argon2 vs Bcrypt](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/)
- [OAuth 2.1 Features for 2026](https://rgutierrez2004.medium.com/oauth-2-1-features-you-cant-ignore-in-2026-a15f852cb723)
- [OAuth 2.0 Security Best Practices](https://medium.com/@basakerdogan/oauth-2-0-security-best-practices-from-authorization-code-to-pkce-beccdbe7ec35)

### CORS & Rate Limiting
- [Mastering CORS with RESTful APIs](https://dev.to/mahmud-r-farhan/mastering-cors-with-restful-apis-configuration-best-practices-fixes-3d4n)
- [CORS Security Best Practices](https://www.stackhawk.com/blog/what-is-cors/)
- [CORS Security Beyond Basic Configuration](https://www.aikido.dev/blog/cors-security-beyond-basic-configuration)
- [API Rate Limiting Strategies](https://www.apisec.ai/blog/api-rate-limiting-strategies-preventing)
- [5 Tips for API Security Against DDoS](https://api7.ai/blog/5-tips-for-enhancing-api-security)

### Stripe & Webhooks
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Stripe Webhook Signature Verification](https://docs.stripe.com/webhooks/signature)
- [Handling Payment Webhooks Reliably](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Stripe Webhooks Implementation Guide](https://www.hooklistener.com/learn/stripe-webhooks-implementation)

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-24 | 1.0 | Initial security documentation |
| 2026-01-25 | 2.0 | Added industry research, implementation guide, complete sources |

---

**For Questions or Security Concerns:**
Email: alfonso@mirrorfactory.dev
For responsible disclosure of security vulnerabilities.
