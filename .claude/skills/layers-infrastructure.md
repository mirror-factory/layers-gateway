# Layers Infrastructure Guide

> Complete reference for the Layers AI Gateway ecosystem, including architecture, environment variables, testing, and deployments.

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    VERCEL DEPLOYMENTS                    │
                    │                                                          │
  User Request      │  ┌──────────────────┐      ┌──────────────────┐        │
       │            │  │    Playground    │      │       Docs       │        │
       │            │  │   (playground)   │      │     (layers)     │        │
       ▼            │  │ layers-playground│      │ layers-docs.app  │        │
┌─────────────┐     │  │    .vercel.app   │      │                  │        │
│   Client    │────►│  └────────┬─────────┘      └──────────────────┘        │
│ (Browser/   │     │           │                                            │
│  SDK/CLI)   │     │           ▼                                            │
└─────────────┘     │  ┌──────────────────┐                                  │
                    │  │       Web        │                                  │
                    │  │ (API + Dashboard)│                                  │
                    │  │ web-nine-sage-13 │                                  │
                    │  │   .vercel.app    │                                  │
                    │  └────────┬─────────┘                                  │
                    │           │                                            │
                    └───────────│────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│    Supabase     │   │   AI Gateway    │   │     Stripe      │
│   (Database)    │   │   (Vercel AI)   │   │   (Payments)    │
│                 │   │                 │   │                 │
│ - Users         │   │ - Anthropic     │   │ - Credits       │
│ - API Keys      │   │ - OpenAI        │   │ - Subscriptions │
│ - Usage Logs    │   │ - Google        │   │ - Webhooks      │
│ - Balances      │   │ - Perplexity    │   │                 │
│                 │   │ - Morph         │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Project Structure

```
layers-dev/
├── apps/
│   ├── web/                    # Main API + Dashboard (Next.js)
│   │   ├── app/
│   │   │   ├── api/v1/chat/   # Layers API endpoint
│   │   │   ├── api/keys/      # API key management
│   │   │   ├── api/usage/     # Usage tracking
│   │   │   ├── api/balance/   # Credit balance
│   │   │   ├── api/stripe/    # Stripe integration
│   │   │   └── dashboard/     # User dashboard
│   │   ├── lib/
│   │   │   ├── gateway/       # Vercel AI Gateway client
│   │   │   ├── middleware/    # Auth, credits, rate limits
│   │   │   └── supabase/      # Database clients
│   │   └── .env.local         # Environment variables
│   │
│   ├── playground/            # Interactive model tester
│   │   ├── app/
│   │   │   ├── api/chat/      # Proxy to Layers API
│   │   │   └── page.tsx       # Playground UI
│   │   ├── lib/
│   │   │   └── layers-client.ts
│   │   └── .env.production.local
│   │
│   └── docs/                  # Documentation site
│       └── .env.local
│
├── packages/@layers/
│   ├── models/                # Model registry + tests
│   │   ├── src/
│   │   │   ├── registry.ts    # All model definitions
│   │   │   └── helpers.ts     # Model utilities
│   │   └── __tests__/
│   │       └── integration/
│   │           ├── gateway.test.ts      # Tests gateway directly
│   │           └── layers-api.test.ts   # Tests Layers API layer
│   │
│   ├── core/                  # Shared utilities
│   ├── credits/               # Credit calculation
│   ├── hooks/                 # React hooks
│   └── ui/                    # UI components
│
└── .env                       # Root env (AI_GATEWAY_API_KEY)
```

---

## Vercel Deployments

| App | Vercel Project | Production URL | Local Port |
|-----|----------------|----------------|------------|
| **Web** (API) | `web` | https://web-nine-sage-13.vercel.app | 3006 |
| **Playground** | `playground` | https://layers-playground.vercel.app | 3000 |
| **Docs** | `layers` | https://layers-docs.vercel.app | 3001 |

### Public Tunnel URLs (Hustle Server)

When running locally, use Cloudflare tunnel URLs:

| Service | URL | Port |
|---------|-----|------|
| Playground | https://local.hustletogether.com | 3000 |
| Web API | https://backend.hustletogether.com | 5000 |
| Docs | https://preview.hustletogether.com | 4000 |

---

## Environment Variables

### Root `.env` (packages/@layers/models tests)

```bash
# Vercel AI Gateway - for running gateway.test.ts
AI_GATEWAY_API_KEY=vck_xxxxxxxxxxxxx
```

### apps/web `.env.local`

```bash
# AI Gateway (passed to Vercel AI SDK)
AI_GATEWAY_API_KEY=vck_xxxxxxxxxxxxx
# Or newer format:
VERCEL_AI_GATEWAY_KEY=vai_xxxxxxxxxxxxx

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://fenhyfxbapybmddvhcei.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Server-side only!

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### apps/playground `.env.production.local`

```bash
# Layers API Configuration
LAYERS_API_URL=https://web-nine-sage-13.vercel.app
LAYERS_API_KEY=lyr_live_xxxxx  # Your Layers API key
```

### apps/docs `.env.local`

```bash
VITE_SUPABASE_URL=https://fenhyfxbapybmddvhcei.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## The Two Test Files

### 1. `gateway.test.ts` - Tests Vercel AI Gateway Directly

**Location:** `packages/@layers/models/__tests__/integration/gateway.test.ts`

**Purpose:** Tests the raw Vercel AI Gateway capabilities without any Layers middleware.

**How it works:**
```typescript
import { createGateway, generateText } from 'ai';

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

// Direct call to AI Gateway
const { text } = await generateText({
  model: gateway('anthropic/claude-haiku-4.5'),
  prompt: 'Hello!',
});
```

**Run:**
```bash
cd packages/@layers/models
AI_GATEWAY_API_KEY=vck_xxx bun test gateway
```

**What it tests:**
- Provider connectivity (Anthropic, OpenAI, Google, Perplexity, Morph)
- Text generation
- Vision/multimodal
- Tools/function calling
- JSON mode
- Extended thinking
- Web search
- Streaming

---

### 2. `layers-api.test.ts` - Tests YOUR API Layer

**Location:** `packages/@layers/models/__tests__/integration/layers-api.test.ts`

**Purpose:** Tests the full Layers API stack including authentication, credits, and rate limiting.

**How it works:**
```typescript
// Calls YOUR API endpoint
const response = await fetch(`${LAYERS_API_URL}/api/v1/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LAYERS_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
});
```

**Run:**
```bash
cd packages/@layers/models
LAYERS_API_URL=https://web-nine-sage-13.vercel.app \
LAYERS_API_KEY=lyr_live_xxxxx \
bun test layers-api
```

**What it tests:**
- **Authentication**: API key validation, rejection of invalid keys
- **Credits**: Deduction, tracking, balance checks
- **Rate Limits**: Headers, enforcement
- **All capabilities**: Same as gateway tests, but through your API

---

## Supabase Configuration

**Project:** fenhyfxbapybmddvhcei

**Tables:**
- `users` - User accounts
- `api_keys` - Layers API keys (lyr_live_xxx format)
- `usage_logs` - Request tracking
- `balances` - Credit balances

**Getting an API Key:**

1. **Via Dashboard:** https://web-nine-sage-13.vercel.app/dashboard/api-keys
2. **Via Supabase SQL:**
   ```sql
   SELECT key_prefix || '...' as key, name, is_active
   FROM api_keys
   WHERE user_id = 'your-user-id'
   AND is_active = true;
   ```

---

## Request Flow

```
1. Client sends request to /api/v1/chat
   └─> Authorization: Bearer lyr_live_xxxxx

2. Auth middleware (lib/middleware/auth.ts)
   └─> Validates API key against Supabase
   └─> Returns user info, tier, balance

3. Rate limit middleware (lib/middleware/rate-limit.ts)
   └─> Checks requests per minute for user
   └─> Returns 429 if exceeded

4. Credits middleware (lib/middleware/credits.ts)
   └─> Estimates cost before request
   └─> Returns 402 if insufficient balance

5. Gateway client (lib/gateway/client.ts)
   └─> Calls Vercel AI Gateway with AI_GATEWAY_API_KEY
   └─> Converts OpenAI format to AI SDK format

6. Response processing
   └─> Calculate actual credits used
   └─> Deduct from balance
   └─> Log usage to Supabase
   └─> Return OpenAI-compatible response
```

---

## Demo Mode

When `SUPABASE_SERVICE_ROLE_KEY` is NOT set, the API runs in **demo mode**:

- Any `lyr_live_*` key is accepted
- No credit deduction
- No usage logging
- Useful for local testing without database

```bash
# Local dev with demo mode
cd apps/web && npm run dev
# API accepts any lyr_live_xxx key
```

---

## Common Commands

### Run Gateway Tests
```bash
cd /home/dev/repos/layers-dev/packages/@layers/models
AI_GATEWAY_API_KEY=vck_4scut4ubleBRZpHenKJBEMEK2oOSwVgn8NdBXAVkCEyUtr7GOv3plspc \
bun test gateway
```

### Run Layers API Tests
```bash
cd /home/dev/repos/layers-dev/packages/@layers/models
LAYERS_API_URL=https://web-nine-sage-13.vercel.app \
LAYERS_API_KEY=lyr_live_YOUR_KEY \
bun test layers-api
```

### Start Local Development
```bash
# Terminal 1: Web API (port 3006)
cd apps/web && npm run dev

# Terminal 2: Playground (port 3000)
cd apps/playground && npm run dev
```

### Check API Health
```bash
curl https://web-nine-sage-13.vercel.app/api/v1/chat
```

---

## Capabilities Matrix

| Capability | Gateway Test | Layers API Test | Notes |
|------------|--------------|-----------------|-------|
| Text | ✅ | ✅ | Basic completions |
| Streaming | ✅ | ✅ | SSE format |
| Vision | ✅ | ✅ | Base64 images |
| Tools | ✅ | ✅ | Function calling |
| JSON Mode | ✅ | ✅ | Structured output |
| Thinking | ✅ | ✅ | Claude extended thinking |
| Web Search | ✅ | ✅ | Perplexity models |
| Prompt Cache | ✅ | ✅ | Cache parameter |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/web/app/api/v1/chat/route.ts` | Main API endpoint |
| `apps/web/lib/gateway/client.ts` | Vercel AI Gateway client |
| `apps/web/lib/middleware/auth.ts` | API key validation |
| `apps/web/lib/middleware/credits.ts` | Credit calculation & deduction |
| `apps/web/lib/middleware/rate-limit.ts` | Rate limiting |
| `apps/web/lib/supabase/client.ts` | Supabase admin client |
| `packages/@layers/models/src/registry.ts` | Model definitions |

---

## Troubleshooting

### "AI Gateway not configured"
- Set `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_KEY`

### "Invalid API key" (401)
- Check key format: must be `lyr_live_xxxxx`
- Verify key exists in Supabase `api_keys` table
- Check `is_active = true`

### "Insufficient credits" (402)
- Check balance in dashboard
- Add credits via Stripe checkout

### "Rate limit exceeded" (429)
- Wait for reset (check X-RateLimit-Reset header)
- Upgrade tier for higher limits

### Tests skipping
- Check required env vars are set
- Tests use `.skipIf()` when config missing

---

**Version:** 1.0
**Last Updated:** January 17, 2026
**Project:** layers-dev
