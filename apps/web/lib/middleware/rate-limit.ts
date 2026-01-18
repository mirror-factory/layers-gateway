import { CreditBalance } from '@/lib/supabase/client';

// Extended tier type to include test tier
export type RateLimitTier = CreditBalance['tier'] | 'test';

// Rate limits by tier (requests per minute)
const RATE_LIMITS: Record<RateLimitTier, number> = {
  free: 10,
  starter: 60,
  pro: 300,
  team: 1000,
  test: 1000, // High limit for integration tests
};

// Secret for test mode bypass (should match what tests send)
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET || 'layers-integration-test-2026';

// Check if running in test mode
export function isTestMode(headers?: Headers): boolean {
  // Check environment variables
  if (process.env.NODE_ENV === 'test' ||
      process.env.LAYERS_TEST_MODE === 'true' ||
      process.env.CI === 'true') {
    return true;
  }

  // Check for test header (allows tests to bypass rate limits on deployed API)
  if (headers) {
    const testHeader = headers.get('X-Layers-Test-Mode');
    if (testHeader === TEST_MODE_SECRET) {
      return true;
    }
  }

  return false;
}

// Get effective tier (upgrades to test tier in test mode)
export function getEffectiveTier(tier: CreditBalance['tier'], headers?: Headers): RateLimitTier {
  if (isTestMode(headers)) {
    return 'test';
  }
  return tier;
}

// In-memory rate limit store
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Check if request is allowed under rate limit
 * @param userId - User ID for rate limit tracking
 * @param tier - User's subscription tier
 * @param headers - Request headers (optional, used to detect test mode)
 */
export function checkRateLimit(
  userId: string,
  tier: CreditBalance['tier'],
  headers?: Headers
): RateLimitResult {
  const effectiveTier = getEffectiveTier(tier, headers);
  const limit = RATE_LIMITS[effectiveTier];
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const key = `${userId}:${Math.floor(now / windowMs)}`;

  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return {
    allowed,
    remaining,
    limit,
    resetAt: entry.resetAt,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.floor(result.resetAt / 1000).toString(),
  };
}

/**
 * Get limit for a specific tier
 */
export function getTierLimit(tier: CreditBalance['tier']): number {
  const effectiveTier = getEffectiveTier(tier);
  return RATE_LIMITS[effectiveTier];
}
