# Credits System - Ralph Loop Instructions

## Mission

Implement the unified credit system per MFDR-006. Users see ONE credit balance across all AI features. Credits are calculated from provider costs + configurable margin.

## Key Documents

- **MFDR-006:** `/home/dev/repos/mirror-factory/process/decisions/MFDR-006-credits-implementation.md`
- **Pricing Data:** `/home/dev/repos/mirror-factory/process/decisions/VERCEL-AI-GATEWAY-PRICING.md`
- **Model Registry:** `/home/dev/repos/mirror-factory/docs/models/MODEL-REGISTRY.md`
- **Admin Dashboard:** MFDR-007 (depends on this)

## Environment

- **Location:** `/home/dev/repos/layers-dev/`
- **Package location:** `packages/credits/`
- **Database:** Supabase (schema in `supabase/migrations/`)
- **Tests:** `packages/credits/__tests__/`

---

## MCP Servers Available

### Supabase MCP (PRIMARY for database work)

The Supabase MCP allows you to create projects, run migrations, execute SQL, and manage the database directly.

**Setup (if not already done):**
```bash
claude mcp add supabase --transport http https://mcp.supabase.com/mcp
```

**Available Tools:**
| Tool | Use For |
|------|---------|
| `list_projects` | See existing Supabase projects |
| `create_project` | Create new project (if needed) |
| `apply_migration` | Run DDL (CREATE TABLE, etc.) |
| `execute_sql` | Run queries (SELECT, INSERT) |
| `list_tables` | Verify schema exists |
| `generate_typescript_types` | Create types from schema |
| `search_docs` | Look up Supabase documentation |

**Best Practice:** Use `apply_migration` for schema changes (tracked), `execute_sql` for data operations.

### Context7 MCP (for documentation)

Use Context7 for Vercel AI SDK, Supabase client, and other library documentation.

```
resolve-library-id: { "libraryName": "supabase" }
get-library-docs: { "context7CompatibleLibraryID": "/supabase/supabase", "topic": "auth" }
```

---

## Story Phases

### Phase 0: Infrastructure (Do First)

These stories set up Supabase and must complete before Phase 1:

1. **supabase-mcp-setup** - Configure Supabase MCP
2. **supabase-project-setup** - Create/connect project
3. **auth-providers-setup** - Enable email/OAuth login
4. **base-schema-setup** - Create profiles table + RLS

### Phase 1: Credits Implementation

Once Supabase is ready:

5. **credits-schema-setup** - Create 6 credit tables
6. **credits-package** - Build @layers/credits
7. **rate-calculation** - Implement margin formula
8. **seed-rates** - Insert model pricing
9. **reserve-flow** - Pre/post request handling
10. **gateway-integration** - Wrap AI calls
11. **balance-api** - REST endpoints
12. **insufficient-credits** - Error handling
13. **admin-margin-api** - Admin endpoints
14. **signup-credits-grant** - Auto-grant on signup

### Phase 2: Testing

15. **integration-tests** - Full flow tests

---

## Core Formula (from MFDR-006)

```typescript
// 1 credit ≈ $0.01 of AI cost at base
// With margin: credits = (baseCost / 0.01) * (1 + marginPercent / 100)

// Example: Claude Sonnet chat (2K in, 1K out)
// baseCost = $0.021
// marginPercent = 60%
// creditsAtCost = 2.1
// creditsWithMargin = 2.1 * 1.6 = 3.36 credits
```

---

## Research Protocol (MANDATORY)

Before implementing any feature:

1. **Supabase MCP** - Use `search_docs` for Supabase questions
2. **Context7 MCP** - Pull Vercel AI SDK docs
3. **Check MFDR-006** - Verify against the spec
4. **Document findings** - Add @RALPH:RESEARCH comments to AGENTS.md

---

## Story Workflow

For each story:
1. Read the acceptance criteria
2. Research any unfamiliar APIs (use MCPs)
3. Implement the feature
4. Write tests
5. Verify all acceptance criteria pass
6. Mark story `passes: true`
7. Update progress.txt

---

## Completion Criteria

All 15 stories pass. The system can:
1. Create Supabase project and schema via MCP
2. Authenticate users via Supabase Auth
3. Calculate credits for any working model
4. Reserve credits before AI calls
5. Deduct actual usage after calls
6. Handle errors gracefully
7. Provide balance/history APIs
8. Allow admin margin configuration
9. Grant credits on signup

---

## Do NOT

- Skip Phase 0 - everything depends on Supabase being set up
- Hardcode credentials - use environment variables
- Hardcode margin values - they must be configurable
- Forget to log transactions - audit trail is required
- Allow negative balances without proper handling
- Skip RLS policies - security is not optional
