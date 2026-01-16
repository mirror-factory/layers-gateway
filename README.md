# Layers

> Human-AI coordination platform for knowledge workers

Layers helps people manage context across fragmented tools, shifting from "context drowning" to "context authoring."

---

## Session Startup Guide

**When you start a terminal session with Claude, use this checklist:**

### 1. Sync State (CRITICAL)

```bash
/sync
```

This reads what other sessions have done from `mirror-factory/CHECKPOINT.md` and the sprint file.

### 2. During/End of Session (CRITICAL)

```bash
/checkpoint
```

This saves your progress so other sessions can continue your work.

### 3. Quick Commands Reference

| Command | What It Does |
|---------|--------------|
| `/sync` | **Read state** - what other sessions did |
| `/checkpoint` | **Save state** - save your progress |
| `/standup` | Show done/doing/blocked from Linear |
| `/sprint-status` | Current sprint progress |
| `/sprint-plan` | View or plan sprints |
| `/e2e` | E2E testing with Playwright |
| `/storybook` | Component testing |
| `/docs generate` | Regenerate API docs |
| `/commit` | Create structured commit |

### 4. Start Development
```bash
cd /home/dev/repos/layers-dev
bun install                    # If needed
bun dev                        # Start dev server → https://local.hustletogether.com
```

---

## Quick Reference

### Project URLs

| Service | URL |
|---------|-----|
| Dev Server | https://local.hustletogether.com (port 3000) |
| Docs | https://local2.hustletogether.com (port 3001) |
| Storybook | http://localhost:6006 |
| Linear | https://linear.app |

### Key Directories

| Path | Purpose |
|------|---------|
| `/home/dev/repos/layers-dev/` | This codebase |
| `/home/dev/repos/mirror-factory/` | Strategy & decisions (MFDRs) |
| `/home/dev/repos/mirror-factory/sprints/` | Sprint tracking |
| `/home/dev/.claude/skills/` | All 70+ Claude skills |

---

## Development Commands

### Running the Project

```bash
# Install dependencies
bun install

# Start all apps (web + docs)
bun dev

# Start specific app
bun dev --filter=@layers/web
bun dev --filter=@layers/docs

# Build everything
bun build

# Type check
bun typecheck

# Lint
bun lint
```

### Testing

```bash
# Run all unit/integration tests
bun test

# Run tests for specific package
bun test --filter=@layers/models
bun test --filter=@layers/credits

# Run E2E tests (Playwright)
bun test:e2e

# Run Storybook component tests
bun storybook:test

# Run with coverage
bun test:coverage

# Watch mode
bun test --watch
```

### Documentation

```bash
# Start docs dev server
cd apps/docs && bun dev

# Generate API docs from TypeScript
bun docs:generate

# Build Storybook
bun storybook:build
```

### Using Turborepo

```bash
# Run task across ALL packages
turbo run test
turbo run build
turbo run lint

# Run task for specific package
turbo run test --filter=@layers/models

# See what would run (dry run)
turbo run build --dry-run

# Clear cache
turbo run build --force
```

---

## Sprint & Task Management

### Check Status

```bash
# Ask Claude for status
"/standup"           # Daily done/doing/blocked
"/sprint-status"     # Sprint progress

# Manual check
cat /home/dev/repos/mirror-factory/sprints/CURRENT-SPRINT.md
```

### Plan Work

```bash
# Ask Claude to plan
"/sprint-plan"                    # View current sprint
"/sprint-plan --new"              # Plan next sprint
"/sprint-plan --create"           # Create issues from list
```

### During Work

```bash
# When starting a task
"I'm starting work on [task name]"

# When blocked
"I'm blocked on [issue] because [reason]"

# When done
"I finished [task name], tests pass"
```

---

## Working with Claude (COO Mode)

Claude acts as your COO. Here's how to work together:

### Starting a Session

```
"What's our sprint status?"
# Claude will:
# 1. Read current sprint file
# 2. Check for blockers
# 3. Report progress
# 4. Ask what you want to focus on
```

### Delegating Complex Tasks

```
"Start a ralph loop for:
- Task: Implement credit deduction in @layers/credits
- Done when: `bun test packages/@layers/credits` passes
- Scope: packages/@layers/credits/src/**"
```

Ralph will run autonomously until tests pass, researching and fixing issues.

### Getting Reports

```
"Give me a status report"
# or
"/reporter"
```

---

## Skills Quick Reference

### Core Development

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `ralph` | "ralph", "run until done" | Simple autonomous dev loop |
| `ralph-enhanced` | "ralph loop", "work until passes" | Full loop with research + retry |
| `commit` | "/commit" | Structured git commits |
| `tdd` | "TDD", "red green refactor" | Test-driven development |

### Testing

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `testing-e2e` | "/e2e", "playwright" | E2E testing setup and running |
| `testing-storybook` | "/storybook" | Component testing with Storybook |

### Documentation

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `docs` | "/docs", "generate docs" | Fumadocs + TypeDoc generation |
| `mfdr-creator` | "create MFDR for [topic]" | New decision record |

### Sprint Management

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `linear` | "/standup", "/sprint-plan" | Linear + local sprint sync |
| `reporter` | "report", "status update" | Executive summaries |

### Research

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `context7` | "look up [library] docs" | Library documentation lookup |

### React/Next.js (Auto-Applied)

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `react-best-practices` | Any React work | Vercel's 40+ performance rules |

**React Best Practices are MANDATORY for all React/Next.js code.** Key rules:
- No sequential awaits (use `Promise.all()`)
- No barrel imports (use direct imports)
- Parallelize Server Components
- Narrow state scope

Full guide: `/home/dev/.claude/skills/react-best-practices/AGENTS.md`

---

## Architecture Overview

### Repository Structure

```
layers-dev/
├── apps/
│   ├── web/                  # Main Next.js application
│   ├── docs/                 # Fumadocs documentation site
│   └── admin/                # Admin dashboard (future)
├── packages/
│   └── @layers/
│       ├── models/           # AI model integration
│       ├── credits/          # Credit management
│       └── ui/               # React component library
├── typedoc.json              # API doc generation config
├── turbo.json                # Turborepo config
└── prd.json                  # Product requirements
```

### Key Decisions (MFDRs)

| MFDR | Decision | Outcome |
|------|----------|---------|
| 001 | Repository Architecture | Hybrid Monorepo (Turborepo + pnpm) |
| 002 | Sandbox Infrastructure | E2B.dev (microVMs) |
| 003 | Credit System | LiteLLM + Custom Layer |
| 008 | Documentation | Fumadocs + TypeDoc + Storybook |
| 010 | Testing | Vitest + Storybook + Playwright |

Full decisions: `/home/dev/repos/mirror-factory/process/decisions/`

### Test Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  Playwright (apps/web/e2e/)
                    └──────┬──────┘
                ┌──────────┴──────────┐
                │    Integration      │  Vitest (packages/*/__tests__/)
                └──────────┬──────────┘
         ┌─────────────────┴─────────────────┐
         │          Component                 │  Storybook (*.stories.tsx)
         └─────────────────┬─────────────────┘
    ┌──────────────────────┴──────────────────────┐
    │                   Unit                       │  Vitest (*.test.ts)
    └─────────────────────────────────────────────┘
```

---

## MCP Servers (Terminal Only)

These are available when running Claude in terminal:

| Server | Purpose | Example |
|--------|---------|---------|
| `linear` | Task management | Create issues, sync sprints |
| `context7` | Library docs | Look up React, Next.js docs |
| `github` | GitHub operations | PRs, issues |
| `supabase` | Database | Query, manage data |

**Note:** MCPs work in terminal Claude, not VS Code extension.

---

## Common Workflows

### Starting a New Feature

```bash
# 1. Check sprint status
"/sprint-status"

# 2. Create branch
git checkout -b feature/my-feature

# 3. Start dev server
bun dev

# 4. Write tests first (TDD)
"Let's use TDD for this feature"

# 5. Implement
# ... work ...

# 6. Run tests
bun test

# 7. Commit
"/commit"

# 8. Create PR
gh pr create
```

### Debugging a Failing Test

```bash
# 1. Run specific test
bun test packages/@layers/models/src/__tests__/failing.test.ts

# 2. If stuck, ask for ralph loop
"Start a ralph loop:
- Task: Fix the failing test in @layers/models
- Done when: `bun test --filter=@layers/models` passes
- Scope: packages/@layers/models/"
```

### Updating Documentation

```bash
# 1. Add TSDoc comments to code
# 2. Generate docs
bun docs:generate

# 3. Preview
cd apps/docs && bun dev

# 4. Check coverage
bun test:coverage
```

### End of Day

```bash
# 1. Run all tests
bun test

# 2. Commit work
"/commit"

# 3. Update sprint
"Update sprint: completed [tasks], blocked on [issues]"

# 4. Get summary
"/reporter"
```

---

## Troubleshooting

### "bun: command not found"
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Tests failing with type errors
```bash
bun typecheck
# Fix type errors, then retry tests
```

### Storybook not loading
```bash
bun storybook:build
# Check http://localhost:6006
```

### Port already in use
```bash
ss -tlnp | grep :3000
kill <PID>
```

### Claude doesn't know sprint status
```bash
# Make sure sprint files exist
ls /home/dev/repos/mirror-factory/sprints/
# If empty, create with "/sprint-plan --new"
```

---

## Related Resources

| Resource | Location |
|----------|----------|
| **Shared state (CHECKPOINT.md)** | `/home/dev/repos/mirror-factory/CHECKPOINT.md` |
| Sprint tracking | `/home/dev/repos/mirror-factory/sprints/` |
| Mirror Factory (decisions) | `/home/dev/repos/mirror-factory/` |
| All skills | `/home/dev/.claude/skills/` |
| Skills index | `/home/dev/.claude/skills/skills.md` |

---

## Multi-Session Coordination

This codebase is worked on by multiple Claude sessions (Terminal, VS Code, subagents). Sessions **cannot communicate directly** - shared files are the communication channel.

### Shared State Location

State files live in **mirror-factory**, not here:
```
/home/dev/repos/mirror-factory/CHECKPOINT.md   ← Test results, progress, next actions
/home/dev/repos/mirror-factory/sprints/        ← Sprint tasks and progress log
```

### Commands

| Command | When | What |
|---------|------|------|
| `/sync` | Start of session | Read what others did |
| `/checkpoint` | During/end of session | Save your progress |

### Permission Note

VS Code Server runs as **root**, Terminal runs as **dev**. Fix if you get permission errors:
```bash
chmod -R 777 /home/dev/repos/layers-dev/packages/
chmod -R 777 /home/dev/repos/layers-dev/apps/
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript 5+ |
| **UI** | shadcn/ui + Tailwind CSS |
| **Monorepo** | Turborepo + pnpm/bun |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Vercel AI SDK + LiteLLM |
| **Testing** | Vitest + Storybook + Playwright |
| **Docs** | Fumadocs + TypeDoc |

---

## License

Private - Mirror Factory R&D

---

*Part of the Mirror Factory platform • 2026*
*Last Updated: January 15, 2026*
