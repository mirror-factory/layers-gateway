# @layers/core

Core business logic for the Layers platform — credits, users, and authentication.

## Installation

```bash
pnpm add @layers/core
```

## Quick Start

```typescript
import { createClient } from '@supabase/supabase-js';
import { CreditsClient, UsersClient, AuthClient } from '@layers/core';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create clients
const credits = new CreditsClient(supabase);
const users = new UsersClient(supabase);
const auth = new AuthClient(supabase);
```

## Modules

### Credits

Unified credit management across all Mirror Factory products.

```typescript
import { CreditsClient } from '@layers/core/credits';

const credits = new CreditsClient(supabase);

// Check balance
const balance = await credits.getBalance('user-123');
if (balance.success) {
  console.log(`Available: ${balance.data.available} credits`);
}

// Deduct credits for AI usage
const result = await credits.deduct({
  userId: 'user-123',
  amount: 100,
  source: 'layers',
  model: 'claude-3-opus',
  tokens: { input: 1000, output: 500 },
});

// Add credits from purchase
await credits.add({
  userId: 'user-123',
  amount: 10000,
  type: 'purchase',
  stripePaymentIntentId: 'pi_xxx',
});
```

### Users

User profiles, preferences, and team management.

```typescript
import { UsersClient } from '@layers/core/users';

const users = new UsersClient(supabase);

// Get user profile
const profile = await users.getProfile('user-123');

// Update preferences
await users.update('user-123', {
  preferences: {
    theme: 'dark',
    defaultModel: 'claude-3-opus',
  },
});

// Get user's teams
const teams = await users.getTeams('user-123');
```

### Auth

Authentication utilities wrapping Supabase Auth.

```typescript
import { AuthClient } from '@layers/core/auth';

const auth = new AuthClient(supabase);

// Sign up
await auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'John Doe',
});

// Sign in
await auth.signIn({
  email: 'user@example.com',
  password: 'securepassword',
});

// OAuth
await auth.signInWithOAuth({ provider: 'google' });

// Magic link
await auth.signInWithMagicLink({ email: 'user@example.com' });
```

## Error Handling

All methods return a `Result` type for explicit error handling:

```typescript
const result = await credits.deduct({ ... });

if (result.success) {
  console.log('Transaction:', result.data);
} else {
  switch (result.error.code) {
    case 'INSUFFICIENT_CREDITS':
      // Prompt to purchase credits
      break;
    case 'USER_NOT_FOUND':
      // Handle missing user
      break;
    default:
      console.error(result.error.message);
  }
}
```

## Types

All types are exported for use in your application:

```typescript
import type {
  CreditBalance,
  CreditTransaction,
  User,
  UserProfile,
  AuthSession,
} from '@layers/core';
```

## See Also

- [MFDR-003](../../mirror-factory/process/decisions/MFDR-003-unified-credit-system.md) - Unified Credit System decision
- [Architecture Overview](../../docs/architecture/overview.md) - System architecture

---

*@layers/core • Mirror Factory • v0.1.0*
