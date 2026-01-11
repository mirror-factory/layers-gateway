# Getting Started with Layers-Dev

> Development environment setup guide

**Status**: Draft
**Last Updated**: 2026-01-11
**Owner**: Alfonso

---

## Prerequisites

- **Node.js**: 20+ (LTS recommended)
- **pnpm**: 8+ (package manager)
- **Git**: For version control
- **Docker**: For local Supabase (optional)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/CrazySwami/layers-dev.git
cd layers-dev

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start development servers
pnpm dev
```

---

## Repository Structure

```
layers-dev/
├── apps/
│   ├── web/              # Main application (Next.js)
│   └── docs/             # Documentation site (Docusaurus)
├── packages/
│   ├── @layers/core/     # Core business logic
│   ├── @layers/ui/       # Component library
│   ├── @layers/hooks/    # React hooks
│   └── @layers/ai/       # AI integration
├── docs/                 # Project documentation
├── turbo.json           # Turborepo config
├── pnpm-workspace.yaml  # Workspace config
└── package.json         # Root package.json
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm dev --filter web` | Start only the web app |
| `pnpm build` | Build all packages and apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all code |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm storybook` | Start Storybook for components |

---

## Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AI Providers (via LiteLLM)
LITELLM_PROXY_URL=http://localhost:4000
ANTHROPIC_API_KEY=your-claude-key
OPENAI_API_KEY=your-openai-key

# E2B Sandbox
E2B_API_KEY=your-e2b-key

# Stripe (Credits)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

See [Environment Variables](./env-variables.md) for full reference.

---

## Next Steps

1. Review [Architecture Overview](../architecture/overview.md)
2. Explore [Component Library](../components/README.md)
3. Read relevant [Decision Records](../../mirror-factory/process/decisions/)

---

*Getting Started • Layers-Dev • Draft v0.1*
