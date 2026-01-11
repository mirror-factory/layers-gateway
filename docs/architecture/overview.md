# Layers Architecture Overview

> System design and architectural patterns for the Layers platform

**Status**: Draft
**Last Updated**: 2026-01-11
**Owner**: Alfonso

---

## High-Level Architecture

Layers is a human-AI coordination platform built on a hybrid monorepo architecture (MFDR-001).

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│   Web App        │    Mobile App      │     Desktop App         │
│   (Next.js)      │    (Capacitor)     │     (Tauri)             │
└────────┬─────────┴────────┬───────────┴─────────┬───────────────┘
         │                  │                     │
         └──────────────────┼─────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     API Gateway Layer                            │
├─────────────────────────────────────────────────────────────────┤
│   Vercel Edge    │    Rate Limiting    │    Authentication      │
│   Functions      │    (Redis)          │    (Supabase Auth)     │
└────────┬─────────┴────────┬────────────┴─────────┬──────────────┘
         │                  │                      │
         └──────────────────┼──────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Core Services Layer                           │
├─────────────────────────────────────────────────────────────────┤
│   MF Credits     │    AI Gateway       │    Context Engine      │
│   (@layers/core) │    (LiteLLM)        │    (RAG + Yjs)         │
└────────┬─────────┴────────┬────────────┴─────────┬──────────────┘
         │                  │                      │
         └──────────────────┼──────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Data & Execution Layer                        │
├─────────────────────────────────────────────────────────────────┤
│   Supabase       │    E2B Sandbox      │    Vector Store        │
│   (PostgreSQL)   │    (Firecracker)    │    (pgvector)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Architecture

Following MFDR-001's hybrid monorepo with NPM distribution:

```
layers-dev/
├── packages/
│   ├── @layers/core           # Core business logic
│   │   ├── credits/           # Credit management
│   │   ├── users/             # User & team management
│   │   └── auth/              # Authentication utilities
│   │
│   ├── @layers/ui             # React component library
│   │   ├── primitives/        # Base components (Button, Input)
│   │   ├── patterns/          # Compound components (Card, Modal)
│   │   └── layouts/           # Page layouts
│   │
│   ├── @layers/hooks          # Custom React hooks
│   │   ├── use-credits/       # Credit balance hooks
│   │   ├── use-ai/            # AI request hooks
│   │   └── use-realtime/      # Real-time sync hooks
│   │
│   └── @layers/ai             # AI gateway integration
│       ├── gateway/           # LiteLLM client
│       ├── tools/             # AI tool definitions
│       └── sandbox/           # E2B integration
│
└── apps/
    ├── web/                   # Main Layers web application
    └── docs/                  # Documentation site
```

---

## Key Decisions

| Decision | Choice | Reference |
|----------|--------|-----------|
| Repository Structure | Hybrid Monorepo | MFDR-001 |
| Code Execution | E2B.dev Sandbox | MFDR-002 |
| AI Credits | LiteLLM + PostgreSQL | MFDR-003 |
| Frontend Framework | Next.js 14+ | Tech Stack v2 |
| Database | Supabase (PostgreSQL) | Tech Stack v2 |
| Real-time Sync | Yjs + Supabase Realtime | Tech Stack v2 |

---

## Data Flow

### AI Request Flow (Credits)

```
1. User initiates AI request
   │
   ▼
2. @layers/hooks/use-ai checks credit balance
   │
   ▼
3. If sufficient credits → Route to LiteLLM proxy
   │
   ▼
4. LiteLLM routes to provider (Claude, GPT, Gemini)
   │
   ▼
5. Response streams back to client
   │
   ▼
6. @layers/core/credits decrements balance
   │
   ▼
7. Balance syncs across all connected apps
```

### Code Execution Flow (Sandbox)

```
1. AI generates code snippet
   │
   ▼
2. @layers/ai/sandbox creates E2B sandbox
   │
   ▼
3. Code executes in Firecracker microVM
   │
   ▼
4. Results stream back (stdout, files, etc.)
   │
   ▼
5. Sandbox destroyed after timeout
```

---

## Cross-Cutting Concerns

### Authentication
- Supabase Auth with Row Level Security (RLS)
- JWT tokens for API authentication
- Social providers (Google, GitHub, Microsoft)

### Observability
- Vercel Analytics for web performance
- Sentry for error tracking
- Custom logging to Supabase for audit trail

### Security
- All AI code execution isolated in E2B sandboxes
- No secrets exposed to client
- HTTPS everywhere, origin certificates on tunnel

---

## See Also

- [Data Model](./data-model.md) - Database schema
- [AI Pipeline](./ai-pipeline.md) - AI request flow details
- [MFDR-001](../../mirror-factory/process/decisions/MFDR-001-Repository-Architecture.md) - Repository decision
- [Tech Stack](../../mirror-factory/process/decisions/MF-Technology-Stack-Decisions-v2.md) - All technology choices

---

*Architecture Overview • Layers-Dev • Draft v0.1*
