/**
 * Pricing Sync - Hustle Together AI Integration
 *
 * Fetches current model pricing from Hustle Together AI's pricing API.
 * This ensures Layers stays in sync with Vercel AI Gateway pricing.
 *
 * Source: https://ai.hustletogether.com/api/pricing
 * Sync frequency: Daily (cached for 24 hours)
 */

const PRICING_API_URL = process.env.HUSTLE_TOGETHER_PRICING_API_URL
  || 'https://ai.hustletogether.com/api/pricing';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PricingResponse {
  version: string;
  source: string;
  currency: string;
  units: {
    language_models: string;
    image_models: string;
  };
  model_count: {
    total: number;
    language: number;
    image: number;
  };
  models: Record<string, { input: number; output: number; image?: number }>;
}

interface CachedPricing {
  data: PricingResponse;
  fetchedAt: number;
}

// In-memory cache for pricing data
let cachedPricing: CachedPricing | null = null;

/**
 * Check if cached pricing is still valid
 */
function isCacheValid(): boolean {
  if (!cachedPricing) return false;
  const age = Date.now() - cachedPricing.fetchedAt;
  return age < CACHE_TTL_MS;
}

/**
 * Fetch pricing from Hustle Together AI API
 */
export async function fetchPricing(): Promise<PricingResponse | null> {
  try {
    const response = await fetch(PRICING_API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Layers-API/1.5.0',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`Pricing API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json() as PricingResponse;

    // Validate response structure
    if (!data.models || typeof data.models !== 'object') {
      console.error('Invalid pricing response: missing models');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch pricing from Hustle Together AI:', error);
    return null;
  }
}

/**
 * Get pricing, using cache if valid or fetching fresh data
 */
export async function getPricing(): Promise<PricingResponse | null> {
  // Return cached data if still valid
  if (isCacheValid() && cachedPricing) {
    return cachedPricing.data;
  }

  // Fetch fresh pricing
  const pricing = await fetchPricing();

  if (pricing) {
    cachedPricing = {
      data: pricing,
      fetchedAt: Date.now(),
    };
    console.log(`✅ Synced ${pricing.model_count.total} models from Hustle Together AI (${pricing.version})`);
  }

  return pricing;
}

/**
 * Get cached pricing synchronously (may return stale data or null)
 * Use this when you can't await, with fallback to hardcoded pricing
 */
export function getCachedPricing(): PricingResponse | null {
  return cachedPricing?.data || null;
}

/**
 * Force refresh pricing cache
 */
export async function refreshPricing(): Promise<boolean> {
  const pricing = await fetchPricing();

  if (pricing) {
    cachedPricing = {
      data: pricing,
      fetchedAt: Date.now(),
    };
    console.log(`✅ Refreshed pricing: ${pricing.model_count.total} models (${pricing.version})`);
    return true;
  }

  return false;
}

/**
 * Get model pricing from synced data or return null
 */
export function getSyncedModelPricing(
  modelId: string
): { input: number; output: number } | null {
  const pricing = getCachedPricing();
  if (!pricing) return null;

  const model = pricing.models[modelId];
  if (!model) return null;

  return {
    input: model.input,
    output: model.output,
  };
}

/**
 * Initialize pricing sync on startup
 * Call this early in the app lifecycle
 */
export async function initializePricingSync(): Promise<void> {
  console.log('🔄 Initializing pricing sync from Hustle Together AI...');
  await getPricing();
}

/**
 * Get pricing metadata
 */
export function getPricingMetadata(): {
  source: string;
  version: string | null;
  cachedAt: Date | null;
  cacheAge: number | null;
  modelCount: number | null;
} {
  const pricing = getCachedPricing();

  return {
    source: PRICING_API_URL,
    version: pricing?.version || null,
    cachedAt: cachedPricing ? new Date(cachedPricing.fetchedAt) : null,
    cacheAge: cachedPricing ? Date.now() - cachedPricing.fetchedAt : null,
    modelCount: pricing?.model_count.total || null,
  };
}
