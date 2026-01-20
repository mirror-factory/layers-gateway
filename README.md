# Layers

> AI Gateway platform with unified access to multiple providers

**Live:** https://layers.hustletogether.com

Layers provides a single OpenAI-compatible API for accessing Anthropic, OpenAI, Google, Perplexity, and Morph models with built-in authentication, credit management, rate limiting, and usage tracking.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server (port 3700)
cd apps/web && pnpm dev

# Access at https://layers.hustletogether.com (or http://localhost:3700)
```

---

## Documentation Index

### Project Documentation

| File | Description |
|------|-------------|
| [README.md](README.md) | This file - project overview and quick start |
| [CLAUDE.md](CLAUDE.md) | Claude Code instructions and working style |
| [docs/](docs/) | Developer documentation (internal) |

### Developer Documentation (`/docs/`)

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Development setup, prerequisites |
| [Architecture](docs/architecture.md) | System design, request flow, providers |
| [API Reference](docs/api/) | Authentication, endpoints, credits |
| [Development Guide](docs/development/) | Testing, environment variables |
| [Package Docs](docs/packages/) | @layers/models, @layers/credits |

### Package Documentation

| Package | README | Description |
|---------|--------|-------------|
| `@layers/models` | [README](packages/@layers/models/README.md) | AI model registry (54 models, 7 providers) |
| `@layers/credits` | [README](packages/@layers/credits/README.md) | Credit calculation with margin config |

### Test Documentation

| File | Description |
|------|-------------|
| [Testing Guide](docs/development/testing.md) | How to run tests |
| [packages/@layers/models/__tests__/README.md](packages/@layers/models/__tests__/README.md) | Integration test guide |

### Online Documentation (Fumadocs)

Available at https://layers.hustletogether.com/docs

| Section | Path | Topics |
|---------|------|--------|
| **Getting Started** | `/docs` | Overview, quickstart, authentication |
| **API Reference** | `/docs/api` | Endpoints, request/response formats |
| **Models** | `/docs/models` | All 24 models with capabilities & pricing |
| **Credits** | `/docs/credits` | Pricing, billing, usage tracking |
| **Architecture** | `/docs/architecture` | System design and flow |
| **Playground** | `/docs/playground` | Interactive testing guide |
| **Testing** | `/docs/testing` | Test suites and coverage |

### MDX Content Structure

```
apps/web/content/docs/
├── index.mdx                    # Docs home
├── getting-started.mdx          # Quick start guide
├── authentication.mdx           # API key management
├── credits.mdx                  # Credit system
├── architecture.mdx             # System design
├── playground.mdx               # Playground guide
├── models.mdx                   # Models overview
├── api/
│   ├── index.mdx               # API overview
│   └── reference.mdx           # Full API reference
├── models/
│   ├── anthropic/              # Claude models (3 models)
│   ├── openai/                 # GPT models (8 models)
│   ├── google/                 # Gemini models (5 models)
│   ├── perplexity/             # Sonar models (3 models)
│   ├── morph/                  # Morph models (2 models)
│   └── image-generation/       # Image models (12 models)
└── testing/
    ├── unit-tests/             # Registry & helper tests
    ├── gateway-tests/          # Provider integration tests
    ├── api-tests/              # Full API tests
    └── image-tests/            # Image generation tests
```

---

## URLs

| Service | URL |
|---------|-----|
| **Live App** | https://layers.hustletogether.com |
| **Playground** | https://layers.hustletogether.com/playground |
| **Docs** | https://layers.hustletogether.com/docs |
| **Dashboard** | https://layers.hustletogether.com/dashboard |
| **Test Runner** | https://layers.hustletogether.com/dashboard/tests/runner |
| **API** | https://layers.hustletogether.com/api/v1/chat |

---

## Features

- **OpenAI-compatible API** - Drop-in replacement for OpenAI SDK
- **5 Providers** - Anthropic, OpenAI, Google, Perplexity, Morph
- **24+ Models** - Full model registry with capabilities, pricing, context windows
- **Interactive Playground** - Test models with streaming, vision, tools, and more
- **Credit System** - Pay-as-you-go with 60% margin
- **Rate Limiting** - Tier-based rate limits per API key
- **Usage Tracking** - Full usage logs and analytics
- **Web Test Runner** - Run 141 integration tests from the browser

---

## Project Structure

```
layers-dev/
├── apps/
│   └── web/                    # Single unified Next.js application
│       ├── app/
│       │   ├── api/v1/         # Layers API (chat, image)
│       │   ├── api/playground/ # Playground proxy API
│       │   ├── api/tests/      # Test runner API
│       │   ├── docs/           # Documentation (Fumadocs)
│       │   ├── playground/     # Interactive API playground
│       │   └── dashboard/      # User dashboard + test runner
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   └── playground/     # Playground components
│       ├── content/docs/       # MDX documentation (80+ files)
│       └── lib/
│           ├── gateway/        # Vercel AI SDK gateway client
│           ├── middleware/     # Auth, credits, rate-limit
│           └── test-runner.ts  # Test execution engine
├── packages/@layers/
│   ├── models/                 # AI model registry
│   ├── credits/                # Credit calculation
│   ├── core/                   # Shared utilities
│   └── ui/                     # Shared UI
└── turbo.json
```

---

## Development Commands

```bash
# Development
cd apps/web && pnpm dev         # Start on port 3700

# Testing
pnpm test                              # All tests
pnpm test --filter=@layers/models      # Specific package

# Integration tests (with filtering)
cd packages/@layers/models
FILTER_PROVIDER=anthropic pnpm test    # Test one provider
FILTER_CAPABILITY=vision pnpm test     # Test one capability

# Build
pnpm build
pnpm typecheck
pnpm lint
```

---

## API Usage

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://layers.hustletogether.com/api/v1',
  apiKey: 'lyr_live_...',
});

const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

---

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/docs/*` | Documentation |
| `/playground` | Interactive API testing |
| `/dashboard` | User dashboard, API keys, billing |
| `/dashboard/tests/runner` | Web-based test runner |
| `/api/v1/chat` | Chat completions (OpenAI-compatible) |
| `/api/v1/image` | Image generation |

---

## Environment Variables

```bash
# Required
AI_GATEWAY_API_KEY=vck_...           # Vercel AI Gateway key

# Supabase (for user auth & API keys)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx

# App URLs
NEXT_PUBLIC_APP_URL=https://layers.hustletogether.com
LAYERS_API_URL=http://localhost:3700
```

---

## Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `api_keys` | User API keys (hashed) |
| `credit_balances` | User credits, tiers, Stripe IDs |
| `usage_logs` | Request logs with tokens, cost, latency |
| `profiles` | User profiles |

**RPC Functions:**
- `deduct_credits(user_id, amount)` - Atomic credit deduction
- `add_credits(user_id, amount)` - Add credits
- `has_sufficient_credits(user_id, required)` - Check balance

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **UI** | shadcn/ui + Tailwind CSS |
| **Monorepo** | Turborepo + pnpm |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Vercel AI SDK Gateway |
| **Docs** | Fumadocs |
| **Testing** | Vitest + Web Test Runner |

---

## Related

- **Mirror Factory** (`/home/dev/repos/mirror-factory/`) - Strategy & decision records
- **Sprint Tracking** - `mirror-factory/sprints/`
- **Skills** - `/home/dev/.claude/skills/`

---

*Part of Mirror Factory R&D • 2026*
