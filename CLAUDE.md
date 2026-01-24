# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Style

**Important:** Before taking action on any task:
1. Ask clarifying questions to understand the full scope
2. Explain what you understand and your reasoning
3. Offer options or approaches when multiple paths exist
4. Wait for explicit confirmation before implementing changes

Do not just start doing work in response to a request unless explicitly told to proceed. The goal is collaborative understanding, not just task execution.

## Project Overview

Layers is an AI Gateway platform that provides unified access to multiple AI providers (Anthropic, OpenAI, Google, Perplexity, Morph) with built-in credit management, rate limiting, and usage tracking. Part of Mirror Factory R&D.

**Live URL:** https://layers.hustletogether.com

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (port 3700)
pnpm dev

# Testing
pnpm test                              # Run all tests
pnpm test:unit                         # Unit tests only
pnpm test:integration                  # Integration tests only

# Integration tests with filtering
FILTER_PROVIDER=anthropic pnpm test    # Test one provider
FILTER_CAPABILITY=vision pnpm test     # Test one capability

# Build & Type Check
pnpm build            # Build for production
pnpm typecheck        # Type check
pnpm lint             # Lint
```

## Architecture

### Project Structure

```
layers-dev/
├── app/                        # Next.js App Router
│   ├── api/v1/                 # Layers API (chat, image)
│   ├── api/playground/         # Playground proxy API
│   ├── api/keys/               # API key management
│   ├── api/stripe/             # Billing integration
│   ├── docs/                   # Documentation pages (React)
│   ├── playground/             # Interactive API playground
│   └── dashboard/              # User dashboard
├── components/
│   ├── ui/                     # shadcn components
│   ├── docs/                   # Documentation components
│   ├── navigation/             # Unified navigation
│   └── playground/             # Playground components
├── hooks/                      # React hooks
├── lib/
│   ├── models/                 # AI model registry (40 models, 6 providers)
│   │   ├── registry.ts         # Model definitions
│   │   ├── types.ts            # Types
│   │   └── helpers.ts          # Helper functions
│   ├── credits/                # Credit calculation
│   │   ├── calculator.ts       # Calculation logic
│   │   └── types.ts            # Types
│   ├── gateway/                # Vercel AI SDK gateway client
│   ├── middleware/             # Auth, credits, rate-limit
│   └── supabase/               # Supabase client
├── __tests__/                  # Test files
│   └── models/                 # Model registry tests
├── docs/                       # Developer documentation
└── package.json
```

### Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/docs/*` | Documentation (Fumadocs) |
| `/playground` | Interactive API playground |
| `/dashboard` | User dashboard, API keys, billing |
| `/api/v1/chat` | OpenAI-compatible chat endpoint |
| `/api/v1/image` | Image generation endpoint |

### Key Architectural Patterns

**AI Gateway Flow** ([app/api/v1/chat/route.ts](app/api/v1/chat/route.ts)):
1. Authenticate via `lyr_live_*` or `lyr_test_*` API key
2. Check rate limits (tier-based)
3. Pre-flight credit check (estimate)
4. Route to Vercel AI Gateway ([lib/gateway/client.ts](lib/gateway/client.ts))
5. Calculate actual credits used
6. Log usage and deduct credits

**Model Registry** ([lib/models/registry.ts](lib/models/registry.ts)):
- 24 models across 5 providers with capabilities, pricing, context windows
- Helper functions for filtering by capability (`vision`, `tools`, `json`, `thinking`, etc.)

**Credit System** ([lib/credits/calculator.ts](lib/credits/calculator.ts)):
- Cost calculation with configurable margin (default 60%)
- Per-model overrides supported
- 1 credit = $0.01 USD

### Database (Supabase)

Tables: `users`, `api_keys`, `credit_transactions`, `usage_logs`
- Auth handled via Supabase SSR ([lib/supabase/](lib/supabase/))
- Credits stored in `users.credit_balance`

### Testing Strategy

- **Unit tests**: Vitest in `__tests__/models/` (e.g., `*.test.ts`)
- **Integration tests**: `__tests__/models/integration/layers-api.test.ts`
  - Single comprehensive test file (~123 tests)
  - Tests every model with all its supported capabilities
  - Filtering via `FILTER_PROVIDER` and `FILTER_CAPABILITY` env vars

## Environment Variables

Required:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_GATEWAY_API_KEY=vck_...
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
LAYERS_API_KEY=                # For playground
```

## URLs

| Service | URL |
|---------|-----|
| **Production** | https://layers.hustletogether.com |
| **Local Dev** | http://localhost:3700 |
| **Playground** | https://layers.hustletogether.com/playground |
| **Docs** | https://layers.hustletogether.com/docs |
| **Dashboard** | https://layers.hustletogether.com/dashboard |

## Multi-Session Coordination

This repo is worked on by multiple Claude sessions. **Update shared state after significant work:**

1. **Read before starting**: `/home/dev/repos/mirror-factory/CHECKPOINT.md`
2. **Update after completing**: Add results to CHECKPOINT.md and sprint file
3. **Sprint tracking**: `/home/dev/repos/mirror-factory/sprints/SPRINT-001.md`

## Useful Slash Commands

| Command | Purpose |
|---------|---------|
| `/sync` | Read what other sessions did |
| `/checkpoint` | Save your progress |
| `/standup` | Show done/doing/blocked |
| `/commit` | Create structured commit |

## Related Repositories

- **mirror-factory** (`/home/dev/repos/mirror-factory/`): Strategy, MFDRs (architecture decisions), sprint tracking
- Decision records: `mirror-factory/process/decisions/`
