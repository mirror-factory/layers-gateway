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
pnpm dev

# Access at http://localhost:3700
```

---

## Project Structure

```
layers-dev/
├── app/                    # Next.js App Router
│   ├── api/v1/             # Public API endpoints
│   ├── docs/               # Fumadocs documentation
│   └── dashboard/          # User dashboard
├── components/             # React components
├── content/docs/           # MDX documentation
├── lib/
│   ├── models/             # AI model registry (24 models)
│   ├── credits/            # Credit calculation
│   ├── gateway/            # Vercel AI Gateway client
│   ├── middleware/         # Auth, credits, rate-limit
│   └── supabase/           # Database client
├── __tests__/              # Test files
├── docs/                   # Developer documentation
└── package.json
```

---

## Documentation

### Developer Docs (`/docs/`)

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Development setup |
| [Architecture](docs/architecture.md) | System design |
| [API Reference](docs/api/) | Authentication, endpoints, credits |
| [Development Guide](docs/development/) | Testing, environment |

### Public Docs (Fumadocs)

Live at https://layers.hustletogether.com/docs

---

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run tests
pnpm test:unit        # Unit tests only
pnpm typecheck        # Type checking
pnpm lint             # Linting
```

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_GATEWAY_API_KEY=vck_...
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## URLs

| Service | URL |
|---------|-----|
| Production | https://layers.hustletogether.com |
| Local Dev | http://localhost:3700 |
| Docs | https://layers.hustletogether.com/docs |
| Dashboard | https://layers.hustletogether.com/dashboard |

---

*Part of Mirror Factory R&D*
