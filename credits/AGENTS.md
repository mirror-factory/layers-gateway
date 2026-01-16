# Credits System - Long-term Memory

## MCP Servers Required

### Supabase MCP
```bash
claude mcp add supabase --transport http https://mcp.supabase.com/mcp
```

**Tools:**
- `list_projects` - See projects
- `create_project` - Create new project
- `apply_migration` - Schema changes (tracked)
- `execute_sql` - Run queries
- `list_tables` - Verify schema
- `generate_typescript_types` - Create types
- `search_docs` - Documentation lookup

### Context7 MCP
Already configured. Use for Vercel AI SDK and Supabase client docs.

---

## Key References

### MFDR-006 Core Decisions
- **Pricing model:** Subscription + overage (Option A)
- **1 credit = $0.01 at cost** (before margin)
- **Default margin:** 60%
- **Margin formula:** `credits = (baseCost / 0.01) * (1 + marginPercent / 100)`

### Database Tables (from MFDR-006)

**Phase 0 - Base:**
1. `public.profiles` - User profile extending auth.users

**Phase 1 - Credits:**
1. `credit_balances` - User balance, plan type, auto-refill settings
2. `credit_transactions` - Immutable ledger of all credit changes
3. `credit_reservations` - In-flight request holds
4. `credit_rates` - Per-model base costs
5. `margin_config` - Global margin settings
6. `margin_audit_log` - Margin change history

### Credit Flow
```
1. Auth: Verify user session (Supabase Auth)
2. Balance check: credits.getBalance(userId)
3. Estimate: calculateCredits(model, estimatedTokens)
4. Reserve: credits.reserve(userId, estimate)
5. Call AI SDK with telemetry
6. On finish: Get actual usage from response
7. Deduct: credits.deduct(userId, actual, reservationId)
8. Release: credits.release(reservationId, unused)
```

---

## Verified Working Patterns

### Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';

// Server-side (with service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Client-side (with anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### AI SDK Usage Capture
```typescript
const result = await streamText({
  model: gateway('anthropic/claude-sonnet-4.5'),
  messages,
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'ditto',
    metadata: { userId, reservationId },
  },
  onFinish: async ({ usage }) => {
    // usage.promptTokens, usage.completionTokens, usage.totalTokens
    const actualCredits = calculateCredits(model, usage);
    await credits.deduct(userId, actualCredits, reservationId);
  },
});
```

### RLS Policy Pattern
```sql
-- Enable RLS on table
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;

-- User can only see own data
CREATE POLICY "Users can view own balance"
  ON credit_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can see all
CREATE POLICY "Admins can view all balances"
  ON credit_balances FOR SELECT
  USING (is_admin());
```

### Admin Role Check
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Research Log

### @RALPH:RESEARCH [topic] - [date]
*Add research findings here as you work*

---

## Known Considerations

### From MFDR-006
- Reservation timeout: 5 minutes default
- Auto-release cron: Clean up expired reservations
- Two credit sources: `plan_credits` (reset monthly) vs `addon_credits` (roll over)
- Deduct from plan_credits first, then addon_credits

### Supabase Specifics
- `auth.users` is managed by Supabase Auth
- Use `public.profiles` for custom user data
- Service role key bypasses RLS (use carefully)
- Apply migrations via MCP for tracking

### Edge Cases to Handle
- Concurrent requests from same user
- AI call fails after reservation
- User upgrades plan mid-month
- Negative balance prevention
- Reservation expiry cleanup
