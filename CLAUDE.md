# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Layers is an AI Gateway platform that provides unified access to multiple AI providers (Anthropic, OpenAI, Google, Perplexity, Morph) with built-in credit management, rate limiting, and usage tracking. Part of Mirror Factory R&D.

## Development Commands

```bash
# Install dependencies
bun install          # or pnpm install

# Development
bun dev              # Start all apps (web on 3006, docs on 3001)
bun dev --filter=@layers/web     # Start web app only
bun dev --filter=@layers/docs    # Start docs only

# Testing
bun test                              # Run all tests via Turborepo
bun test --filter=@layers/models      # Test specific package
cd packages/@layers/models && bun test --watch  # Watch mode for package

# Build & Type Check
bun build            # Build all packages
bun typecheck        # Type check all packages
bun lint             # Lint all packages

# Documentation
bun docs:generate    # Generate TypeDoc API docs
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/
  web/                    # Next.js 14 - Main API Gateway application
    app/api/v1/chat/      # OpenAI-compatible chat endpoint
    app/api/keys/         # API key management
    app/api/stripe/       # Billing integration
    lib/gateway/          # Vercel AI SDK gateway client
    lib/middleware/       # Auth, credits, rate-limit middleware

  docs/                   # Fumadocs documentation site

packages/@layers/
  models/                 # AI model registry (24 models, 5 providers)
  credits/                # Credit calculation with margin config
  core/                   # Shared utilities (placeholder)
  ui/                     # React component library (placeholder)
  hooks/                  # React hooks (placeholder)
```

### Key Architectural Patterns

**AI Gateway Flow** ([apps/web/app/api/v1/chat/route.ts](apps/web/app/api/v1/chat/route.ts)):
1. Authenticate via `lyr_live_*` or `lyr_test_*` API key
2. Check rate limits (tier-based)
3. Pre-flight credit check (estimate)
4. Route to Vercel AI Gateway ([apps/web/lib/gateway/client.ts](apps/web/lib/gateway/client.ts))
5. Calculate actual credits used
6. Log usage and deduct credits

**Model Registry** ([packages/@layers/models/src/registry.ts](packages/@layers/models/src/registry.ts)):
- 24 models across 5 providers with capabilities, pricing, context windows
- Helper functions for filtering by capability (`vision`, `tools`, `json`, `thinking`, etc.)

**Credit System** ([packages/@layers/credits/src/calculator.ts](packages/@layers/credits/src/calculator.ts)):
- Cost calculation with configurable margin (default 60%)
- Per-model overrides supported
- 1 credit = $0.01 USD

### Database (Supabase)

Tables: `users`, `api_keys`, `credit_transactions`, `usage_logs`
- Auth handled via Supabase SSR ([apps/web/lib/supabase/](apps/web/lib/supabase/))
- Credits stored in `users.credit_balance`

### Testing Strategy

- **Unit tests**: Vitest in `packages/@layers/*/` (e.g., `__tests__/*.test.ts`)
- **Integration tests**: Live API calls in `packages/@layers/models/__tests__/integration/`
- Tests use `vitest` with TypeScript, no special config needed

## Environment Variables

Required for `apps/web`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VERCEL_AI_GATEWAY_KEY=vai_...
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

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

## Dev Server URLs

| Port | URL | Service |
|------|-----|---------|
| 3006 | https://local.hustletogether.com | Web app |
| 3001 | https://local2.hustletogether.com | Docs |

## Related Repositories

- **mirror-factory** (`/home/dev/repos/mirror-factory/`): Strategy, MFDRs (architecture decisions), sprint tracking
- Decision records: `mirror-factory/process/decisions/`
