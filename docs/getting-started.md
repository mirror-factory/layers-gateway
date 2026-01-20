# Getting Started

Set up your Layers development environment.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase account (for database)
- Vercel AI Gateway access
- Stripe account (for billing)

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/layers-dev.git
cd layers-dev

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials
```

## Environment Variables

See [Environment Variables](development/environment.md) for the full list.

Required for basic development:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
AI_GATEWAY_API_KEY=vck_xxx
```

## Running the Dev Server

```bash
# Start on port 3700
cd apps/web && pnpm dev

# Or from root
pnpm dev --filter=@layers/web
```

Access at: http://localhost:3700

## Project Structure

```
layers-dev/
├── apps/web/           # Next.js application
├── packages/@layers/
│   ├── models/         # AI model registry
│   └── credits/        # Credit calculation
├── docs/               # Developer documentation (you are here)
└── turbo.json          # Monorepo configuration
```

## Next Steps

- Read the [Architecture](architecture.md) document
- Set up [Database tables](development/environment.md#database-setup)
- Run [Tests](development/testing.md)
