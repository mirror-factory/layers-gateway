# Testing

Test suites and how to run them.

## Test Overview

| Suite | Location | Purpose |
|-------|----------|---------|
| Unit tests | `packages/@layers/*/` | Package unit tests |
| Integration tests | `packages/@layers/models/__tests__/integration/` | Full API tests |

## Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test --filter=@layers/models
pnpm test --filter=@layers/credits

# Watch mode
pnpm test -- --watch
```

## Integration Tests

The main integration test file tests all models with their capabilities:

```bash
cd packages/@layers/models
pnpm test
```

### Filtering Tests

Use environment variables to run specific tests:

```bash
# Test one provider
FILTER_PROVIDER=anthropic pnpm test

# Test one capability
FILTER_CAPABILITY=vision pnpm test

# Combine filters
FILTER_PROVIDER=openai FILTER_CAPABILITY=tools pnpm test
```

### Available Providers

- `anthropic`
- `openai`
- `google`
- `perplexity`
- `morph`

### Available Capabilities

- `text`
- `vision`
- `tools`
- `json`
- `stream`
- `thinking`
- `pdf`
- `audio-in`
- `video-in`
- `web`

## Test Mode Header

Integration tests use a special header to bypass auth:

```typescript
const headers = {
  'X-Layers-Test-Mode': 'layers-integration-test-2026',
};
```

This allows testing without real API keys or credits.

## Web Test Runner

A browser-based test runner is available at:

https://layers.hustletogether.com/dashboard/tests/runner

Features:
- Run all tests or filter by provider/capability
- Real-time streaming results
- Save/export results

## Writing Tests

Tests use Vitest:

```typescript
import { describe, it, expect } from 'vitest';
import { getModel } from '@layers/models';

describe('getModel', () => {
  it('returns model by ID', () => {
    const model = getModel('anthropic/claude-sonnet-4.5');
    expect(model).toBeDefined();
    expect(model.provider).toBe('anthropic');
  });
});
```

## Coverage

```bash
pnpm test -- --coverage
```

Coverage reports are generated in `coverage/` directory.

## CI/CD

Tests run automatically on:
- Pull requests
- Push to main branch
- Manual workflow dispatch

See `.github/workflows/` for CI configuration.
