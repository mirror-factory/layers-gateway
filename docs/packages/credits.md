# @layers/credits

Credit calculation package for Layers.

## Overview

This package handles credit calculation with configurable margins for the Layers billing system.

**1 credit = $0.01 USD**

## Installation

```bash
# Workspace package (already linked)
pnpm add @layers/credits
```

## Usage

```typescript
import { calculateCredits, CreditConfig } from '@layers/credits';

// Calculate credits with default margin (60%)
const credits = calculateCredits({
  modelId: 'anthropic/claude-sonnet-4.5',
  inputTokens: 2000,
  outputTokens: 1000,
});
// => 3.36 credits

// Custom margin
const customCredits = calculateCredits({
  modelId: 'anthropic/claude-sonnet-4.5',
  inputTokens: 2000,
  outputTokens: 1000,
  margin: 0.5, // 50% margin
});
```

## API Reference

### Functions

#### `calculateCredits(options)`

Calculate credits for a request.

```typescript
interface CalculateCreditsOptions {
  modelId: string;      // Model ID from registry
  inputTokens: number;  // Number of input tokens
  outputTokens: number; // Number of output tokens
  margin?: number;      // Margin (default: 0.6 = 60%)
}

function calculateCredits(options: CalculateCreditsOptions): number;
```

#### `calculateCost(options)`

Calculate raw cost (before margin).

```typescript
function calculateCost(options: {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
}): number;
```

#### `estimateCredits(options)`

Estimate credits for a request (pre-flight).

```typescript
function estimateCredits(options: {
  modelId: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  margin?: number;
}): number;
```

### Configuration

#### Default Margin

The default margin is 60% (1.6x multiplier).

```typescript
const DEFAULT_MARGIN = 0.6;
```

#### Per-Model Overrides

You can configure per-model margins:

```typescript
const MARGIN_OVERRIDES: Record<string, number> = {
  'anthropic/claude-opus-4.5': 0.5, // Lower margin for expensive model
  'google/gemini-2.0-flash': 0.7,   // Higher margin for cheap model
};
```

## Calculation Formula

```
rawCost = (inputTokens * inputPricePerMillion / 1_000_000)
        + (outputTokens * outputPricePerMillion / 1_000_000)

credits = rawCost * (1 + margin) * 100
```

### Example

```
Model: anthropic/claude-sonnet-4.5
Input price: $3.00/1M tokens
Output price: $15.00/1M tokens
Margin: 60%

Input: 2000 tokens, Output: 1000 tokens

rawCost = (2000 * 3.00 / 1M) + (1000 * 15.00 / 1M)
        = 0.006 + 0.015
        = $0.021

credits = 0.021 * 1.6 * 100
        = 3.36 credits
```

## Integration with Models Package

This package imports pricing from `@layers/models`:

```typescript
import { getModel } from '@layers/models';

const model = getModel(modelId);
const inputCost = inputTokens * model.pricing.input / 1_000_000;
const outputCost = outputTokens * model.pricing.output / 1_000_000;
```

## Testing

```bash
cd packages/@layers/credits
pnpm test
```

### Test Cases

- Verify margin calculation
- Per-model override application
- Edge cases (zero tokens, invalid models)
- Precision (rounding behavior)
