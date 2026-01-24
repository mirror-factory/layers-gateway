# Layers Authentication Guide

Complete documentation for authentication in Layers, covering both user authentication (dashboard access) and API authentication (programmatic access).

---

## Overview

Layers uses two authentication systems:

| System | Purpose | Method |
|--------|---------|--------|
| **User Authentication** | Access dashboard, manage keys, billing | Supabase Auth (Email/Password, Google OAuth) |
| **API Authentication** | Make API requests | API Keys (`lyr_live_*`, `lyr_test_*`) |

---

## User Authentication (Dashboard)

### Sign Up Options

Users can create a Layers account using:

1. **Email & Password** - Traditional signup with email confirmation
2. **Google OAuth** - One-click signup with Google account

### Email & Password Flow

1. User enters email and password on `/signup`
2. Supabase Auth creates the user account
3. Confirmation email sent to user
4. User clicks confirmation link
5. User redirected to dashboard

### Google OAuth Flow

1. User clicks "Continue with Google" on `/login` or `/signup`
2. Redirect to Google OAuth consent screen
3. User authorizes Layers to access basic profile info
4. Google redirects to `/auth/callback` with authorization code
5. Server exchanges code for session tokens
6. Session cookies set on response
7. User redirected to dashboard

### Authentication Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js App │────▶│  Supabase   │
│  (Client)   │◀────│  (Server)    │◀────│    Auth     │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       │    Cookies        │    JWT Tokens
       └───────────────────┘
```

**Key Components:**

| Component | File | Purpose |
|-----------|------|---------|
| Browser Client | `lib/supabase/browser.ts` | Client-side Supabase for auth UI |
| Server Client | `lib/supabase/server.ts` | Server-side Supabase for protected routes |
| Middleware | `lib/supabase/middleware.ts` | Session refresh, route protection |
| OAuth Callback | `app/auth/callback/route.ts` | Exchange OAuth code for session |

### Session Management

Sessions are managed using HTTP-only cookies via `@supabase/ssr`:

- **Cookie Name**: `sb-{project-ref}-auth-token`
- **Storage**: HTTP-only, secure, SameSite=Lax
- **Refresh**: Automatic via middleware on each request
- **Expiry**: Configurable (default: 1 week, refreshable)

### Protected Routes

Routes under `/dashboard/*` require authentication:

```typescript
// Middleware checks for valid session
const protectedPaths = ['/dashboard'];

if (isProtectedPath && !user) {
  // Redirect to login with return URL
  redirect('/login?redirectTo=/dashboard');
}
```

### Security Best Practices Implemented

1. **Server-Side Session Validation**
   - Always use `supabase.auth.getUser()` on server, never trust client session
   - JWT validated against Supabase Auth server on each request

2. **HTTP-Only Cookies**
   - Session tokens stored in HTTP-only cookies
   - Not accessible via JavaScript (XSS protection)

3. **PKCE Flow for OAuth**
   - Code verifier stored securely during OAuth flow
   - Prevents authorization code interception attacks

4. **Secure Cookie Attributes**
   - `Secure`: Only sent over HTTPS (production)
   - `SameSite=Lax`: CSRF protection
   - `HttpOnly`: No JavaScript access

5. **Automatic Session Refresh**
   - Middleware refreshes tokens before expiry
   - Seamless user experience without re-login

---

## API Authentication (Programmatic Access)

### API Key Format

```
lyr_live_sk_1a2b3c4d5e6f7890...
lyr_test_sk_1a2b3c4d5e6f7890...
```

| Prefix | Environment | Billing |
|--------|-------------|---------|
| `lyr_live_` | Production | Deducts credits |
| `lyr_test_` | Testing | Limited, no billing |

### Using API Keys

Include your API key in the `Authorization` header:

```bash
curl -X POST https://layers.hustletogether.com/api/v1/chat \
  -H "Authorization: Bearer lyr_live_sk_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model": "anthropic/claude-sonnet-4.5", "messages": [{"role": "user", "content": "Hello"}]}'
```

### API Key Security

1. **Hashed Storage** - Keys are hashed before storage (we can't see your full key)
2. **Server-Side Only** - Never expose keys in client-side code
3. **Environment Variables** - Store in `.env`, never commit to git
4. **Key Rotation** - Generate new keys and revoke old ones if compromised

### Rate Limiting

Rate limits are applied per API key based on subscription tier:

| Tier | Requests/Minute |
|------|-----------------|
| Free | 10 |
| Starter | 60 |
| Pro | 300 |
| Team | 1,000 |

---

## Implementation Details

### OAuth Callback Handler

The OAuth callback (`/auth/callback`) handles the code-to-session exchange:

```typescript
// app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');

  // Create response first to attach cookies
  const response = NextResponse.redirect(redirectUrl);

  // Create Supabase client with cookie handlers
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Exchange code for session (triggers setAll)
  await supabase.auth.exchangeCodeForSession(code);

  return response;
}
```

### Middleware Session Refresh

The middleware refreshes sessions on every request:

```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        // Set on both request (for downstream) and response (for browser)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // This refreshes the session if needed
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

### Browser Client Setup

```typescript
// lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from Server Component (read-only)
        }
      },
    },
  });
}
```

---

## Troubleshooting

### OAuth Login Not Working

**Symptoms:** User authenticates with Google but gets redirected back to login.

**Common Causes:**

1. **Supabase Redirect URLs** - Ensure `https://yourdomain.com/auth/callback` is in Supabase Auth settings
2. **Google OAuth Credentials** - Verify Client ID and Secret are correct in Supabase
3. **Cookie Domain Mismatch** - Ensure cookies are set for the correct domain
4. **Missing Environment Variables** - Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Debug Steps:**

1. Check browser Network tab for Set-Cookie headers on `/auth/callback` response
2. Check server logs for `[OAuth Callback]` messages
3. Verify Supabase dashboard shows the user was created

### Session Not Persisting

**Symptoms:** User logs in but appears logged out on page refresh.

**Common Causes:**

1. **Cookies not being set** - Check Set-Cookie headers in response
2. **Middleware not running** - Verify middleware.ts is configured correctly
3. **Cookie blocked** - Third-party cookie settings in browser

### API Key Authentication Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Missing Authorization header` | No header sent | Add `Authorization: Bearer {key}` |
| `Invalid API key format` | Wrong prefix | Use `lyr_live_` or `lyr_test_` |
| `Invalid API key` | Key not found | Check key is correct |
| `API key is deactivated` | Key disabled | Reactivate or create new key |

---

## Configuration Checklist

### Supabase Dashboard Settings

- [ ] **Site URL**: `https://layers.hustletogether.com`
- [ ] **Redirect URLs**: Include `https://layers.hustletogether.com/auth/callback`
- [ ] **Google OAuth**: Client ID and Secret configured
- [ ] **Email Templates**: Confirm signup template uses `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional: Service role for admin operations
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Google Cloud Console

- [ ] **OAuth 2.0 Client** created
- [ ] **Authorized redirect URIs**: `https://{project-ref}.supabase.co/auth/v1/callback`
- [ ] **Authorized JavaScript origins**: Your app domain

---

## Security Recommendations

1. **Never log sensitive tokens** - Access tokens, refresh tokens, API keys
2. **Use environment variables** - Never hardcode credentials
3. **Implement rate limiting** - Protect against brute force
4. **Monitor auth logs** - Detect suspicious activity
5. **Rotate keys regularly** - API keys and OAuth secrets
6. **Use HTTPS everywhere** - Secure cookie transmission
7. **Validate on server** - Never trust client-side auth state

---

## Related Documentation

- [Getting Started](/docs/getting-started) - Quick setup guide
- [API Reference](/docs/api/reference) - Full API documentation
- [Credit System](/docs/credits) - Understand billing
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official Supabase documentation
