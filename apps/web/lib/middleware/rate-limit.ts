import { CreditBalance } from '@/lib/supabase/client';

// Rate limits by tier (requests per minute)
const RATE_LIMITS: Record<CreditBalance['tier'], number> = {
  free: 10,
  starter: 60,
  pro: 300,
  team: 1000,
};

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
 */
export function checkRateLimit(
  userId: string,
  tier: CreditBalance['tier']
): RateLimitResult {
  const limit = RATE_LIMITS[tier];
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
  return RATE_LIMITS[tier];
}
