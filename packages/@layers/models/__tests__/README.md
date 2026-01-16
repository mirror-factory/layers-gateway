# @layers/models Tests

## Structure

```
__tests__/
├── registry.test.ts          # Unit: Registry data integrity
├── helpers.test.ts           # Unit: Helper functions
└── integration/
    └── gateway.test.ts       # Integration: Vercel AI Gateway
```

## Running Tests

### Unit Tests (no API key required)

```bash
# Run just unit tests
pnpm --filter=@layers/models test:unit

# Run in watch mode
pnpm --filter=@layers/models test:watch
```

### Integration Tests (requires API key)

```bash
# Set API key and run integration tests
AI_GATEWAY_API_KEY=xxx pnpm --filter=@layers/models test:integration

# Run all tests
AI_GATEWAY_API_KEY=xxx pnpm --filter=@layers/models test
```

### Using Turbo

```bash
# All packages
turbo test

# Just @layers/models
turbo test --filter=@layers/models
```

## Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| Registry | ~15 | Model count, providers, capabilities, pricing |
| Helpers | ~50 | All 15 helper functions with edge cases |
| Integration | ~25 | API calls to all 5 providers |

## CI Configuration

Integration tests skip automatically when `AI_GATEWAY_API_KEY` is not set.
Use `test:unit` script in CI for fast, reliable testing.

## Environment Variables

- `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key (for integration tests)
