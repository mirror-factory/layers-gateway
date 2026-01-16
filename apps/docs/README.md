# @layers/docs

Unified documentation site for the Layers platform.

## What's Here

```
apps/docs/
├── content/
│   ├── docs/           # Manual documentation (guides, concepts)
│   ├── api/            # Auto-generated API reference (TypeDoc)
│   └── components/     # Component docs with Storybook embeds
├── components/
│   ├── ModelPlayground.tsx    # Interactive AI model testing
│   ├── StorybookEmbed.tsx     # Embeds Storybook stories
│   ├── CoverageBadge.tsx      # Test coverage indicator
│   └── TestStatusBadge.tsx    # CI pass/fail indicator
├── public/
│   ├── storybook/      # Built Storybook (CI publishes here)
│   └── coverage/       # Coverage reports (CI publishes here)
└── app/                # Next.js App Router pages
```

## Development

```bash
# Start docs dev server
bun run dev

# Generate API docs from TypeDoc
bun run docs:generate

# Generate coverage page
bun run docs:coverage
```

## Architecture

Based on [MFDR-008](../../../mirror-factory/process/decisions/MFDR-008-documentation-strategy.md):

- **Fumadocs** - Documentation framework (Next.js native)
- **TypeDoc** - API reference generation from TypeScript
- **Storybook** - Component library (embedded from @layers/ui)
- **Coverage** - Test status aggregated from CI

## What Users See

| Route | Content |
|-------|---------|
| `/` | Landing page |
| `/docs/*` | Guides and concepts |
| `/api/*` | Auto-generated API reference |
| `/components/*` | Interactive component library |
| `/playground` | AI model testing playground |
| `/status` | Test coverage dashboard |

## Related MFDRs

- **MFDR-008:** Documentation Strategy (Fumadocs + TypeDoc)
- **MFDR-010:** Testing Strategy (Vitest + Storybook + Playwright)
