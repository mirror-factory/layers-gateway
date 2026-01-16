# @layers/models

AI model registry with capabilities and pricing for the Layers platform.

## Overview

This package contains a complete registry of 54 AI models across 7 providers, sourced from the Vercel AI Gateway API. It provides:

- **Type-safe model definitions** with capabilities, pricing, and metadata
- **Helper functions** for filtering, querying, and cost calculation
- **Credit calculation** with configurable margins

## Installation

```bash
pnpm add @layers/models
```

## Usage

### Get a Model

```typescript
import { getModel, getModelSafe } from '@layers/models';

// Get a model (throws if not found)
const claude = getModel('anthropic/claude-sonnet-4.5');
console.log(claude.name); // "Claude 4.5 Sonnet"
console.log(claude.capabilities); // ['text', 'vision', 'tools', 'json', 'stream', 'cache', 'thinking']

// Safe version (returns undefined if not found)
const model = getModelSafe('invalid-id'); // undefined
```

### Filter Models

```typescript
import {
  getModelsByProvider,
  getModelsWithCapability,
  getModelsWithCapabilities,
  filterModels,
} from '@layers/models';

// All Anthropic models
const anthropicModels = getModelsByProvider('anthropic');

// All models with vision capability
const visionModels = getModelsWithCapability('vision');

// Models with BOTH tools AND json
const toolModels = getModelsWithCapabilities(['tools', 'json']);

// Complex filtering
const budgetVisionModels = filterModels({
  provider: ['openai', 'google'],
  capabilities: ['vision', 'tools'],
  maxInputPrice: 0.005,
  minContextWindow: 100_000,
});
```

### Calculate Costs and Credits

```typescript
import { calculateCost, calculateCredits } from '@layers/models';

// Calculate raw cost
const cost = calculateCost('anthropic/claude-sonnet-4.5', 2000, 1000);
// => $0.021

// Calculate credits (with margin)
const credits = calculateCredits('anthropic/claude-sonnet-4.5', 2000, 1000, 60);
// => 3.36 credits

// Default margin is 60%
const creditsDefault = calculateCredits('anthropic/claude-sonnet-4.5', 2000, 1000);
// => 3.36 credits
```

### Find Best Model

```typescript
import { getCheapestModel, getLargestContextModel, sortModels } from '@layers/models';

// Cheapest model with specific capabilities
const cheapest = getCheapestModel(['tools', 'json', 'stream']);

// Model with largest context window
const largest = getLargestContextModel(); // Any provider
const largestGoogle = getLargestContextModel('google'); // Google only

// Sort by price
const byPrice = sortModels(visionModels, 'price', 'asc');
```

## Providers

| Provider | Models | Primary Use |
|----------|--------|-------------|
| Anthropic | 3 | Chat, coding, vision |
| OpenAI | 18 | Chat, reasoning, embeddings |
| Google | 11 | Multimodal, long context |
| xAI | 9 | Chat, coding |
| DeepSeek | 7 | Budget reasoning |
| Perplexity | 4 | Web search |
| Morph | 2 | Fast editing |

## Capabilities

| Capability | Description |
|------------|-------------|
| `text` | Text generation |
| `vision` | Image input |
| `pdf` | Native PDF input |
| `audio-in` | Audio input |
| `video-in` | Video input |
| `tools` | Function calling |
| `web` | Built-in web search |
| `image-gen` | Image generation |
| `json` | Structured output |
| `stream` | Streaming responses |
| `cache` | Prompt caching |
| `thinking` | Extended reasoning |
| `embed` | Text embeddings |

## Types

```typescript
import type {
  ModelId,
  ModelDefinition,
  Provider,
  Capability,
  ModelFilterOptions,
} from '@layers/models';
```

## Related

- [Model Registry](../../docs/models/MODEL-REGISTRY.md) - Human-readable documentation
- [MFDR-006](../../process/decisions/MFDR-006-credits-implementation.md) - Credit system architecture
- [Vercel AI Gateway](https://ai-gateway.vercel.sh) - API source
