# Environment Variables

Required environment variables for Layers.

## Setup

Copy the example file and edit:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## Required Variables

### Supabase (Database & Auth)

```bash
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# Supabase anon key (public, safe for client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase service role key (secret, server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### AI Gateway

```bash
# Vercel AI Gateway API key
AI_GATEWAY_API_KEY=vck_xxx
```

### Stripe (Billing)

```bash
# Stripe secret key
STRIPE_SECRET_KEY=sk_test_xxx

# Stripe webhook secret
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe publishable key (public)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Application URLs

```bash
# Public app URL
NEXT_PUBLIC_APP_URL=https://layers.hustletogether.com

# Internal API URL (for server-side calls)
LAYERS_API_URL=http://localhost:3700
```

## Optional Variables

```bash
# Enable debug logging
DEBUG=layers:*

# Node environment
NODE_ENV=development
```

## Database Setup

### Tables Required

1. **api_keys** - User API keys
2. **credit_balances** - User credits
3. **usage_logs** - Request logs
4. **profiles** - User profiles

### RPC Functions Required

```sql
-- Atomic credit deduction
CREATE FUNCTION deduct_credits(user_id UUID, amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  UPDATE credit_balances
  SET balance = balance - amount
  WHERE id = user_id AND balance >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  RETURN (SELECT balance FROM credit_balances WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Add credits
CREATE FUNCTION add_credits(user_id UUID, amount NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
  UPDATE credit_balances
  SET balance = balance + amount
  WHERE id = user_id;

  RETURN (SELECT balance FROM credit_balances WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Check sufficient credits
CREATE FUNCTION has_sufficient_credits(user_id UUID, required NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT balance >= required FROM credit_balances WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;
```

## Vercel Deployment

When deploying to Vercel, add all environment variables in the project settings.

Use different values for:
- **Development** (local)
- **Preview** (PR deployments)
- **Production** (main branch)

## Security Notes

1. **Never commit .env files** - They're in .gitignore
2. **Use test keys locally** - `sk_test_`, `lyr_test_`
3. **Rotate keys periodically** - Especially after team changes
4. **Limit service role key** - Only use server-side
