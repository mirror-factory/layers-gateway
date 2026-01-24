import { NextResponse } from 'next/server';
import { getPricing, refreshPricing, getPricingMetadata } from '@/lib/pricing';

/**
 * Pricing Sync API
 *
 * GET /api/v1/pricing - Get current pricing data and sync status
 * POST /api/v1/pricing/refresh - Force refresh pricing from Hustle Together AI
 */

/**
 * Get current pricing and sync status
 */
export async function GET() {
  const pricing = await getPricing();
  const metadata = getPricingMetadata(); // Get metadata AFTER pricing is fetched

  return NextResponse.json({
    status: pricing ? 'synced' : 'using_fallback',
    metadata: {
      source: metadata.source,
      version: metadata.version,
      cached_at: metadata.cachedAt?.toISOString() || null,
      cache_age_ms: metadata.cacheAge,
      model_count: metadata.modelCount,
    },
    models: pricing?.models || null,
  });
}

/**
 * Force refresh pricing from Hustle Together AI
 */
export async function POST() {
  const success = await refreshPricing();
  const metadata = getPricingMetadata();

  if (success) {
    return NextResponse.json({
      status: 'refreshed',
      message: 'Pricing synced successfully from Hustle Together AI',
      metadata: {
        source: metadata.source,
        version: metadata.version,
        cached_at: metadata.cachedAt?.toISOString(),
        model_count: metadata.modelCount,
      },
    });
  }

  return NextResponse.json(
    {
      status: 'error',
      message: 'Failed to refresh pricing from Hustle Together AI',
      fallback: 'Using hardcoded pricing as fallback',
    },
    { status: 503 }
  );
}
