# @layers/credits

Credit system for AI usage billing with configurable margins.

## Overview

This package provides:

- **Credit calculation** from AI usage (tokens → credits)
- **Margin configuration** (global default + per-model overrides)
- **Cost breakdown** for transparency
- **Subscription tiers** with overage support

## Installation

```bash
pnpm add @layers/credits
```

## Core Concepts

### Credit Conversion

1 credit ≈ $0.01 of AI cost at our cost basis.

The formula is:

```
credits = (cost / $0.01) × (1 + marginPercent / 100)
```

At 60% default margin:
- $0.01 cost → 1.6 credits
- $0.10 cost → 16 credits
- $1.00 cost → 160 credits

### Margin Configuration

```typescript
interface MarginConfig {
  defaultMarginPercent: number;  // Applied to all models
  modelOverrides: Record<string, number>;  // Per-model overrides
}
```

## Usage

### Calculate Credits

```typescript
import { calculateCredits, calculateCost } from '@layers/credits';

// Calculate credits at default margin (60%)
const credits = calculateCredits(
  'anthropic/claude-sonnet-4.5',
  2000, // input tokens
  1000, // output tokens
);
// => 3.36 credits

// Get raw cost in USD
const cost = calculateCost(
  'anthropic/claude-sonnet-4.5',
  2000,
  1000,
);
// => $0.021
```

### Custom Margin

```typescript
import { calculateCredits } from '@layers/credits';

// Lower margin for cost-sensitive use case
const lowMarginCredits = calculateCredits(
  'anthropic/claude-sonnet-4.5',
  2000,
  1000,
  { defaultMarginPercent: 20, modelOverrides: {} }
);
// => 2.52 credits

// Pass-through (0% margin) for enterprise
const passThrough = calculateCredits(
  'anthropic/claude-sonnet-4.5',
  2000,
  1000,
  { defaultMarginPercent: 0, modelOverrides: {} }
);
// => 2.1 credits (raw cost / $0.01)
```

### Per-Model Overrides

```typescript
import { calculateCredits } from '@layers/credits';

const config = {
  defaultMarginPercent: 60,
  modelOverrides: {
    // Premium models get higher margin
    'anthropic/claude-opus-4.5': 80,
    // Budget models get lower margin
    'deepseek/deepseek-v3.2': 30,
  },
};

const opusCredits = calculateCredits('anthropic/claude-opus-4.5', 2000, 1000, config);
// Uses 80% margin

const deepseekCredits = calculateCredits('deepseek/deepseek-v3.2', 2000, 1000, config);
// Uses 30% margin
```

### Cost Breakdown

```typescript
import { getCostBreakdown } from '@layers/credits';

const breakdown = getCostBreakdown(
  'anthropic/claude-sonnet-4.5',
  2000,
  1000,
);

console.log(breakdown);
// {
//   inputCost: 0.006,      // $0.006 for input
//   outputCost: 0.015,     // $0.015 for output
//   totalCost: 0.021,      // $0.021 total
//   marginPercent: 60,     // 60% margin applied
//   credits: 3.36,         // Credits charged
//   revenue: 0.0336,       // Revenue from credits
//   profit: 0.0126,        // Profit (revenue - cost)
// }
```

### Subscription Tiers

```typescript
import { SUBSCRIPTION_TIERS } from '@layers/credits';

// Predefined tiers
const tiers = SUBSCRIPTION_TIERS;
// [
//   { id: 'free', name: 'Free', priceUsd: 0, monthlyCredits: 50, ... },
//   { id: 'starter', name: 'Starter', priceUsd: 20, monthlyCredits: 500, ... },
//   { id: 'pro', name: 'Pro', priceUsd: 100, monthlyCredits: 3000, ... },
//   { id: 'team', name: 'Team', priceUsd: 200, monthlyCredits: 7500, ... },
// ]
```

### Estimate Before Request

```typescript
import { estimateCredits } from '@layers/credits';

// Estimate cost before making request
const estimated = estimateCredits(
  'anthropic/claude-sonnet-4.5',
  5000, // estimated input
  2000, // estimated output
);

if (userBalance < estimated) {
  throw new Error('Insufficient credits');
}
```

## Types

```typescript
import type {
  MarginConfig,
  UsageRecord,
  CreditBalance,
  SubscriptionTier,
  CreditTransaction,
  AffordabilityCheck,
} from '@layers/credits';
```

## Related

- [@layers/models](../models/README.md) - Model registry with pricing
- [MFDR-006](../../process/decisions/MFDR-006-credits-implementation.md) - Credit system design
- [MFDR-007](../../process/decisions/MFDR-007-admin-dashboard.md) - Admin dashboard with margin controls
