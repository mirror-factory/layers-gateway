# Layers-Dev - Claude Code Context

## Project Overview

Layers is a human-AI coordination platform that helps knowledge workers manage context across fragmented tools. It's the flagship product of Mirror Factory R&D.

**Vision**: Shift people from "context drowning" to "context authoring"—enabling them to direct work through unified personal context rather than fragmented tool-switching.

---

## Repository Relationship

```
mirror-factory/                    # R&D Documentation & Decisions
├── foundation/                    # Mission, direction, measurement
├── process/decisions/             # MFDRs (architecture decisions)
└── linked: layers-dev/            # ← This repository (implementation)

layers-dev/                        # Product Implementation
├── docs/                          # Product-specific documentation
├── apps/                          # Next.js applications
├── packages/                      # Shared packages
└── CLAUDE.md                      # You are here
```

**Key Link**: Decision records live in `mirror-factory/process/decisions/`. This repo implements those decisions.

---

## Tech Stack (from MFDR decisions)

| Layer | Technology | MFDR Reference |
|-------|------------|----------------|
| **Monorepo** | Turborepo + pnpm | MFDR-001 |
| **Sandbox** | E2B.dev (Firecracker) | MFDR-002 |
| **AI Credits** | LiteLLM + Stripe | MFDR-003 |
| **Frontend** | Next.js 14+ + shadcn/ui | Tech Stack v2 |
| **Database** | Supabase (PostgreSQL) | Tech Stack v2 |
| **Real-time** | Yjs + Supabase Realtime | Tech Stack v2 |
| **Mobile** | Capacitor | Tech Stack v2 |
| **Desktop** | Tauri 2.x | Tech Stack v2 |

---

## Quick Navigation

| Path | Purpose |
|------|---------|
| `/apps/web/` | Main Layers web application |
| `/apps/docs/` | Documentation site (Docusaurus) |
| `/packages/@layers/core/` | Core business logic |
| `/packages/@layers/ui/` | React component library |
| `/packages/@layers/hooks/` | Custom React hooks |
| `/packages/@layers/ai/` | AI gateway integration |
| `/docs/` | Product documentation |
| `/docs/registry/` | Documentation registry |

---

## Documentation System

This project uses a hybrid documentation approach:

### In-Code Documentation
- **TSDoc** for all public APIs and exports
- **Storybook** for component documentation
- **TypeDoc** generates API reference automatically

### External Documentation
- **ADRs** live in `mirror-factory/process/decisions/`
- **Product docs** live in `/docs/`
- **Registry** tracks all docs at `/docs/registry/REGISTRY.md`

### Documentation Status
| Status | Meaning |
|--------|---------|
| `active` | Current, maintained |
| `draft` | In progress |
| `review` | Awaiting review |
| `deprecated` | Being phased out |
| `archived` | Historical only |

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps in development
pnpm dev

# Start specific app
pnpm dev --filter web

# Run tests
pnpm test

# Build all packages
pnpm build

# Generate API docs
pnpm docs:generate

# Run Storybook
pnpm storybook
```

---

## Key Decisions Reference

Before implementing, check these decision records in `mirror-factory/`:

| Topic | MFDR | Key Points |
|-------|------|------------|
| Repository structure | MFDR-001 | Hybrid monorepo with NPM distribution |
| Code execution | MFDR-002 | E2B.dev for AI sandbox |
| Credits system | MFDR-003 | LiteLLM + custom layer |
| Tech stack | Tech Stack v2 | Full technology choices |
| Product spec | Layers-Infrastructure-v3 | 80 questions answered |

---

## Cross-Reference Links

- **R&D Direction**: `mirror-factory/foundation/mirror-factory-rnd-direction.md`
- **Measurement**: `mirror-factory/foundation/mirror-factory-rnd-measurement.md`
- **Decision Records**: `mirror-factory/process/decisions/`
- **Tech Stack**: `mirror-factory/process/decisions/MF-Technology-Stack-Decisions-v2.md`

---

*Layers-Dev • Mirror Factory R&D • 2026*
