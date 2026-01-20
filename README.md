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
pnpm dev --filter=@layers/web -- -p 3700

# Access at https://layers.hustletogether.com (or http://localhost:3700)
```

---

## URLs

| Service | URL |
|---------|-----|
| **Live App** | https://layers.hustletogether.com |
| **Playground** | https://layers.hustletogether.com/playground |
| **Docs** | https://layers.hustletogether.com/docs |
| **Dashboard** | https://layers.hustletogether.com/dashboard |
| **API** | https://layers.hustletogether.com/api/v1/chat |

---

## Features

- **OpenAI-compatible API** - Drop-in replacement for OpenAI SDK
- **5 Providers** - Anthropic, OpenAI, Google, Perplexity, Morph
- **24 Models** - Full model registry with capabilities, pricing, context windows
- **Interactive Playground** - Test models with streaming, vision, tools, and more
- **Credit System** - Pay-as-you-go with configurable margins
- **Rate Limiting** - Tier-based rate limits per API key
- **Usage Tracking** - Full usage logs and analytics

---

## Project Structure

```
layers-dev/
├── apps/
│   └── web/                    # Single unified Next.js application
│       ├── app/
│       │   ├── api/v1/         # Layers API (chat, image)
│       │   ├── api/playground/ # Playground proxy API
│       │   ├── docs/           # Documentation (Fumadocs)
│       │   ├── playground/     # Interactive API playground
│       │   └── dashboard/      # User dashboard
│       ├── components/
│       │   ├── ui/             # shadcn components
│       │   └── playground/     # Playground components
│       ├── content/docs/       # MDX documentation
│       └── lib/
│           ├── gateway/        # Vercel AI SDK gateway client
│           └── middleware/     # Auth, credits, rate-limit
├── packages/@layers/
│   ├── models/                 # AI model registry
│   └── credits/                # Credit calculation
└── turbo.json
```

---

## Development Commands

```bash
# Development
pnpm dev --filter=@layers/web -- -p 3700

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
| `/api/v1/chat` | Chat completions (OpenAI-compatible) |
| `/api/v1/image` | Image generation |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Gateway
VERCEL_AI_GATEWAY_KEY=vai_...

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Playground
LAYERS_API_KEY=lyr_live_...
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **UI** | shadcn/ui + Tailwind CSS |
| **Monorepo** | Turborepo + pnpm |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Vercel AI SDK |
| **Docs** | Fumadocs |
| **Testing** | Vitest |

---

## Related

- **Mirror Factory** (`/home/dev/repos/mirror-factory/`) - Strategy & decision records
- **Sprint Tracking** - `mirror-factory/sprints/`
- **Skills** - `/home/dev/.claude/skills/`

---

*Part of Mirror Factory R&D • 2026*
