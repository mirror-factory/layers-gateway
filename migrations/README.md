# Database Migrations

This directory contains SQL migrations for the Layers Gateway database.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of the migration file
4. Paste into the SQL Editor
5. Click **Run** to execute

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Apply migration
supabase db push

# Or run specific file
psql -h your-db-host -U postgres -d postgres -f migrations/001_create_margin_configs.sql
```

### Option 3: Direct Database Connection

Using `psql` or any PostgreSQL client:

```bash
psql "your-connection-string" -f migrations/001_create_margin_configs.sql
```

## Migration List

### 001_create_margin_configs.sql

**Purpose**: Adds margin configuration persistence for users

**What it does**:
- Creates `margin_configs` table with user-specific margin settings
- Stores global margin percentage (default 60%)
- Stores per-model margin overrides as JSONB
- Implements Row Level Security (RLS) policies
- Creates indexes for performance
- Adds auto-update trigger for `updated_at` column

**Table Schema**:
```sql
CREATE TABLE margin_configs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (references auth.users),
  global_margin_percent NUMERIC NOT NULL DEFAULT 60,
  model_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only read/write their own margin configs
- No access to other users' configurations

## Verification

After running the migration, verify it was successful:

```sql
-- Check table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'margin_configs';

-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'margin_configs';

-- Test insert (should work for authenticated user)
INSERT INTO margin_configs (user_id, global_margin_percent, model_overrides)
VALUES (auth.uid(), 60, '{"claude-3-5-sonnet": 65}'::jsonb);
```

## Rollback

If you need to rollback the migration:

```sql
-- Drop the table (this will cascade to indexes, triggers, policies)
DROP TABLE IF EXISTS public.margin_configs CASCADE;

-- Drop the update function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

## Related Files

- **API Endpoint**: `/app/api/margin-config/route.ts` - Handles saving/loading configs
- **UI Component**: `/app/dashboard/pricing/page.tsx` - Pricing dashboard with save button
- **Types**: `/lib/credits/types.ts` - MarginConfig interface

## Notes

- The `model_overrides` field uses JSONB for flexible storage
- Each user can have only one margin config (UNIQUE constraint on user_id)
- Automatic timestamp updates via trigger
- All security handled via RLS policies
