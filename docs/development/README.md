# Development Guide

Local development setup and workflows for Layers.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (optional, for local services)

## Setup

```bash
# Clone repository
git clone https://github.com/your-org/layers-dev.git
cd layers-dev

# Install dependencies
pnpm install

# Copy environment file
cp apps/web/.env.example apps/web/.env.local

# Start development server
cd apps/web && pnpm dev
```

## Development Server

The dev server runs on port 3700:

```bash
# From apps/web
pnpm dev

# Or from root
pnpm dev --filter=@layers/web
```

Access at: http://localhost:3700

## Package Development

When working on packages:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@layers/models

# Watch mode
pnpm dev --filter=@layers/models
```

## Monorepo Commands

```bash
# Install dependencies
pnpm install

# Build all
pnpm build

# Test all
pnpm test

# Type check all
pnpm typecheck

# Lint all
pnpm lint
```

## Workspace Structure

```
layers-dev/
├── apps/
│   └── web/              # Next.js application
├── packages/@layers/
│   ├── models/           # AI model registry
│   └── credits/          # Credit calculation
├── docs/                 # Developer documentation
├── turbo.json            # Turborepo config
└── pnpm-workspace.yaml   # Workspace definition
```

## Hot Reloading

- Next.js pages and components hot reload automatically
- Package changes require rebuild (watch mode helps)
- Restart server if environment variables change

## Debugging

```bash
# Enable verbose logging
DEBUG=layers:* pnpm dev

# Next.js debug mode
NODE_OPTIONS='--inspect' pnpm dev
```

## VS Code Setup

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

Settings:
```json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "editor.formatOnSave": true
}
```
