# @layers/models

AI model registry package for Layers.

## Overview

This package contains the complete registry of AI models supported by Layers, including:
- Model definitions with capabilities
- Pricing information (per 1M tokens)
- Context window sizes
- Helper functions for querying models

## Installation

```bash
# Workspace package (already linked)
pnpm add @layers/models
```

## Usage

```typescript
import {
  getModel,
  getModelsByProvider,
  getModelsWithCapability,
  filterModels,
  calculateCredits,
} from '@layers/models';

// Get a specific model
const claude = getModel('anthropic/claude-sonnet-4.5');
console.log(claude.capabilities); // ['text', 'vision', 'tools', ...]

// Find all models with vision
const visionModels = getModelsWithCapability('vision');

// Find cheapest model with tools + json
const cheapest = filterModels({
  capabilities: ['tools', 'json'],
}).sort((a, b) => a.pricing.input - b.pricing.input)[0];

// Calculate credits for usage
const credits = calculateCredits('anthropic/claude-sonnet-4.5', 2000, 1000);
// => ~3.4 credits at 60% margin
```

## API Reference

### Types

```typescript
type Provider = 'anthropic' | 'openai' | 'google' | 'perplexity' | 'morph';

type Capability =
  | 'text'
  | 'vision'
  | 'tools'
  | 'json'
  | 'stream'
  | 'thinking'
  | 'cache'
  | 'pdf'
  | 'audio-in'
  | 'video-in'
  | 'web'
  | 'embed'
  | 'image-gen';

interface ModelDefinition {
  id: string;
  name: string;
  provider: Provider;
  capabilities: Capability[];
  contextWindow: number;
  pricing: {
    input: number;  // per 1M tokens
    output: number; // per 1M tokens
  };
}
```

### Functions

| Function | Description |
|----------|-------------|
| `getModel(id)` | Get model by ID (throws if not found) |
| `getModelSafe(id)` | Get model by ID (returns undefined) |
| `isValidModelId(id)` | Check if model ID exists |
| `getAllModels()` | Get array of all models |
| `getModelsByProvider(provider)` | Get models by provider |
| `getModelsWithCapability(cap)` | Get models with capability |
| `filterModels(options)` | Advanced filtering |
| `calculateCredits(id, input, output)` | Calculate credit cost |

### Constants

| Constant | Description |
|----------|-------------|
| `MODEL_REGISTRY` | Full registry object |
| `MODEL_IDS` | Array of all model IDs |
| `MODEL_COUNT` | Total number of models |

## Model Data Source

Model data is sourced from Vercel AI Gateway and includes:
- Official model names and IDs
- Up-to-date pricing
- Capability flags

## Adding New Models

1. Update `src/registry.ts` with new model definition
2. Run tests to verify
3. Build package

```typescript
// In registry.ts
'provider/new-model': {
  id: 'provider/new-model',
  name: 'New Model',
  provider: 'provider',
  capabilities: ['text', 'tools'],
  contextWindow: 128000,
  pricing: { input: 1.0, output: 2.0 },
},
```

## Testing

```bash
cd packages/@layers/models
pnpm test
```

See [Testing Guide](../development/testing.md) for integration tests.
