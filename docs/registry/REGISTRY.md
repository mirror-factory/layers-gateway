# Documentation Registry

> Central registry tracking all documentation across the Layers ecosystem

**Last Updated**: 2026-01-14
**Registry Version**: 1.0

---

## How This Registry Works

Every document in the Layers ecosystem is tracked here with:
- **Unique ID**: For cross-referencing
- **Status**: Current state of the document
- **Owner**: Who maintains it
- **Last Updated**: When it was last modified
- **Description**: What the document covers

### Document Statuses

| Status | Badge | Meaning |
|--------|-------|---------|
| `active` | ![Active](https://img.shields.io/badge/status-active-success) | Current, maintained, reliable |
| `draft` | ![Draft](https://img.shields.io/badge/status-draft-yellow) | In progress, may be incomplete |
| `review` | ![Review](https://img.shields.io/badge/status-review-blue) | Complete, awaiting review |
| `deprecated` | ![Deprecated](https://img.shields.io/badge/status-deprecated-orange) | Being phased out |
| `archived` | ![Archived](https://img.shields.io/badge/status-archived-lightgrey) | Historical reference only |

---

## Layers-Dev Documentation

### Architecture Documents

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `ARCH-001` | [Architecture Overview](../architecture/overview.md) | `draft` | Alfonso | 2026-01-11 | High-level system architecture and design principles |
| `ARCH-002` | [Data Model](../architecture/data-model.md) | `planned` | — | — | Database schema and entity relationships |
| `ARCH-003` | [AI Pipeline](../architecture/ai-pipeline.md) | `planned` | — | — | AI request flow and credit management |

### Setup Guides

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `SETUP-001` | [Getting Started](../setup/getting-started.md) | `draft` | Alfonso | 2026-01-11 | Development environment setup |
| `SETUP-002` | [Environment Variables](../setup/env-variables.md) | `planned` | — | — | Required environment configuration |
| `SETUP-003` | [Database Setup](../setup/database.md) | `planned` | — | — | Supabase configuration |

### AI Gateway Testing

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `TEST-001` | [Gateway Test Registry](../../REGISTRY.md) | `active` | Claude | 2026-01-14 | RALPH-style test registry for AI Gateway |
| `TEST-002` | [Hand-off Document](../HANDOFF-vercel-ai-gateway-testing.md) | `active` | Claude | 2026-01-14 | Complete hand-off for gateway testing work |
| `TEST-003` | test-providers-fixed.ts | `active` | Claude | 2026-01-14 | 40 working models, 134 tests |

### API Documentation

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `API-001` | [API Overview](../api/README.md) | `planned` | — | — | REST API endpoints overview |
| `API-002` | TypeDoc Reference | `auto` | — | — | Auto-generated from source code |

### Component Documentation

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `COMP-001` | [Component Catalog](../components/README.md) | `planned` | — | — | UI component library overview |
| `COMP-002` | Storybook | `auto` | — | — | Interactive component documentation |

---

## Mirror-Factory Documentation

### Foundation

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `MF-FND-001` | [R&D Direction](../../mirror-factory/foundation/mirror-factory-rnd-direction.md) | `active` | Alfonso | 2026-01-06 | Mission, hypothesis, and strategic direction |
| `MF-FND-002` | [R&D Measurement](../../mirror-factory/foundation/mirror-factory-rnd-measurement.md) | `active` | Alfonso | 2026-01-06 | KPIs, success criteria, and quarterly targets |

### Decision Records (MFDRs)

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `MFDR-001` | [Repository Architecture](../../mirror-factory/process/decisions/MFDR-001-Repository-Architecture.md) | `active` | Alfonso | 2026-01-09 | Hybrid monorepo with NPM distribution decision |
| `MFDR-002` | [Sandbox Infrastructure](../../mirror-factory/process/decisions/MFDR-002-sandbox-infrastructure.md) | `active` | Alfonso | 2026-01-11 | E2B.dev for AI code execution |
| `MFDR-003` | [Unified Credit System](../../mirror-factory/process/decisions/MFDR-003-unified-credit-system.md) | `active` | Alfonso | 2026-01-11 | LiteLLM + Stripe for AI credits |

### Technical Specifications

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `MF-SPEC-001` | [Technology Stack](../../mirror-factory/process/decisions/MF-Technology-Stack-Decisions-v2.md) | `active` | Alfonso | 2026-01 | Complete technology choices with rationale |
| `MF-SPEC-002` | [Layers Product Spec](../../mirror-factory/process/decisions/Layers-Infrastructure-Human-AI-Coordination-v3.md) | `active` | Alfonso | 2026-01 | Comprehensive product specification (80 Q&As) |

### Templates

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `MF-TPL-001` | [MFDR Template](../../mirror-factory/process/mfdr-template.md) | `active` | Alfonso | 2026-01-06 | Template for decision records |
| `MF-TPL-002` | [Experiment Worksheet](../../mirror-factory/process/experiment-worksheet-template.md) | `active` | Alfonso | 2026-01-06 | Template for experiments |

### Skills

| ID | Document | Status | Owner | Updated | Description |
|----|----------|--------|-------|---------|-------------|
| `MF-SKL-001` | [MCP Setup Guide](../../mirror-factory/skills/MCP-SETUP.md) | `active` | Alfonso | 2026-01-08 | MCP server authentication setup |
| `MF-SKL-002` | [MFDR Reviewer](../../mirror-factory/skills/mfdr-reviewer/SKILL.md) | `active` | Claude | 2026-01-11 | Skill for reviewing decision records |
| `MF-SKL-003` | [Context7](../../mirror-factory/skills/context7.md) | `active` | Alfonso | 2026-01-08 | Library documentation via MCP |

---

## Pending MFDRs (Need Creation)

Based on Technology Stack document, these decisions need formal MFDRs:

| Priority | Topic | Dependencies |
|----------|-------|--------------|
| High | Database & Auth (Supabase) | None |
| High | AI Infrastructure (Vercel AI SDK) | MFDR-003 |
| Medium | Frontend Stack (Next.js + shadcn) | MFDR-001 |
| Medium | Cross-Platform Strategy | None |
| Medium | Real-Time Collaboration (Yjs) | Database MFDR |
| Medium | Testing Strategy | None |
| Low | MCP Integration Strategy | All core MFDRs |

---

## Documentation Changelog

| Date | Document | Change | Author |
|------|----------|--------|--------|
| 2026-01-14 | TEST-001, TEST-002, TEST-003 | Added AI Gateway testing documentation | Claude |
| 2026-01-11 | Registry | Created documentation registry | Claude |
| 2026-01-11 | MFDR-002, MFDR-003 | Added hypothesis sections, competitor analysis | Claude |
| 2026-01-11 | All MFDRs | Fixed numbering, renamed files | Claude |
| 2026-01-11 | MFDR Reviewer | Created skill for reviewing MFDRs | Claude |
| 2026-01-09 | MFDR-001 | Created Repository Architecture decision | Alfonso |
| 2026-01-08 | Skills | Added MCP skill documentation | Alfonso |
| 2026-01-07 | MFDRs | Created Sandbox and Credits decisions | Alfonso |
| 2026-01-06 | Foundation | Created R&D Direction and Measurement | Alfonso |

---

## Registry Statistics

| Category | Count | Active | Draft | Planned |
|----------|-------|--------|-------|---------|
| Architecture | 3 | 0 | 1 | 2 |
| Setup Guides | 3 | 0 | 1 | 2 |
| AI Gateway Testing | 3 | 3 | 0 | 0 |
| API Docs | 2 | 0 | 0 | 2 |
| Components | 2 | 0 | 0 | 2 |
| Foundation | 2 | 2 | 0 | 0 |
| MFDRs | 3 | 3 | 0 | 0 |
| Specs | 2 | 2 | 0 | 0 |
| Templates | 2 | 2 | 0 | 0 |
| Skills | 3 | 3 | 0 | 0 |
| **Total** | **25** | **15** | **2** | **8** |

---

## Maintenance

### Adding New Documents

1. Create the document in appropriate location
2. Add entry to this registry with unique ID
3. Set initial status (`draft` for new docs)
4. Add to changelog

### Updating Documents

1. Update the document content
2. Update `Updated` date in registry
3. Add entry to changelog
4. Update status if needed

### Deprecating Documents

1. Change status to `deprecated`
2. Add deprecation notice to document header
3. Link to replacement document
4. Add to changelog

---

*Documentation Registry • Layers-Dev • v1.0*
