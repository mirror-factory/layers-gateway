# Layers

> Human-AI coordination platform for knowledge workers

Layers helps people manage context across fragmented tools, shifting from "context drowning" to "context authoring."

## Quick Start

```bash
# Clone the repository
git clone https://github.com/CrazySwami/layers-dev.git
cd layers-dev

# Install dependencies
pnpm install

# Start development
pnpm dev
```

## Documentation

| Resource | Description |
|----------|-------------|
| [Getting Started](./docs/setup/getting-started.md) | Development environment setup |
| [Architecture](./docs/architecture/overview.md) | System design and patterns |
| [API Reference](./docs/api/) | Auto-generated TypeDoc |
| [Component Library](./docs/components/) | Storybook component docs |
| [Decision Records](../mirror-factory/process/decisions/) | Architecture decisions (MFDRs) |

## Repository Structure

```
layers-dev/
├── apps/
│   ├── web/                 # Main Next.js application
│   └── docs/                # Docusaurus documentation site
├── packages/
│   ├── @layers/core/        # Core business logic
│   ├── @layers/ui/          # React component library
│   ├── @layers/hooks/       # Custom React hooks
│   └── @layers/ai/          # AI gateway integration
├── docs/
│   ├── registry/            # Documentation registry
│   ├── architecture/        # System documentation
│   ├── setup/               # Setup guides
│   └── api/                 # Auto-generated API docs
└── turbo.json               # Turborepo configuration
```

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **UI**: shadcn/ui + Tailwind CSS
- **Monorepo**: Turborepo + pnpm
- **Database**: Supabase (PostgreSQL)
- **AI**: Vercel AI SDK + LiteLLM
- **Testing**: Vitest + Playwright

## Development

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev --filter web

# Run tests
pnpm test

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Related Repositories

| Repository | Purpose |
|------------|---------|
| [mirror-factory](../mirror-factory/) | R&D documentation, decisions, experiments |

## License

Private - Mirror Factory R&D

---

*Part of the Mirror Factory platform • 2026*
