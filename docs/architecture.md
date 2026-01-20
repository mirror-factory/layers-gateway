# Architecture

System design and request flow for the Layers AI Gateway.

## Overview

Layers is an AI Gateway that provides unified access to multiple AI providers through an OpenAI-compatible API.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Client    │────▶│  Layers API │────▶│  AI Providers   │
│  (OpenAI    │     │  (Gateway)  │     │  - Anthropic    │
│   SDK)      │◀────│             │◀────│  - OpenAI       │
└─────────────┘     └─────────────┘     │  - Google       │
                                        │  - Perplexity   │
                                        │  - Morph        │
                                        └─────────────────┘
```

## Request Flow

1. **Authentication**: Validate `lyr_live_*` or `lyr_test_*` API key
2. **Rate Limiting**: Check tier-based rate limits
3. **Credit Check**: Verify sufficient credits (pre-flight estimate)
4. **Routing**: Forward to Vercel AI Gateway with model translation
5. **Response**: Stream or return complete response
6. **Usage Logging**: Log tokens, cost, latency
7. **Credit Deduction**: Calculate and deduct actual credits

## Key Components

### API Routes (`apps/web/app/api/v1/`)

| Route | Purpose |
|-------|---------|
| `/chat` | OpenAI-compatible chat completions |
| `/image` | Image generation |

### Middleware (`apps/web/lib/middleware/`)

- **auth.ts**: API key validation, user lookup
- **rate-limit.ts**: Tier-based rate limiting
- **credits.ts**: Credit estimation and deduction

### Gateway Client (`apps/web/lib/gateway/`)

- **client.ts**: Vercel AI Gateway integration
- Handles provider translation (Layers model ID → provider model)

## Model Registry

The `@layers/models` package contains:
- 54 models across 7 providers
- Capabilities: text, vision, tools, json, stream, thinking, etc.
- Pricing: input/output per 1M tokens (from Vercel AI Gateway)

## Database Schema

Tables in Supabase:
- **api_keys**: User API keys (hashed)
- **credit_balances**: User credits, tiers
- **usage_logs**: Request logs with tokens, cost, latency
- **profiles**: User profiles

RPC Functions:
- `deduct_credits(user_id, amount)`: Atomic credit deduction
- `add_credits(user_id, amount)`: Add credits
- `has_sufficient_credits(user_id, required)`: Check balance

## Two Keys System

1. **Layers API Key** (`lyr_live_*` / `lyr_test_*`)
   - Issued to users
   - Authenticates requests to Layers
   - Tied to user credits and rate limits

2. **Vercel AI Gateway Key** (`vck_*`)
   - Server-side only
   - Used by Layers to call providers
   - Never exposed to users

## Test Mode

For integration testing, use header:
```
X-Layers-Test-Mode: layers-integration-test-2026
```

This bypasses real auth and credits for testing.
