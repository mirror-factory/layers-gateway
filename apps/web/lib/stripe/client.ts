import Stripe from 'stripe';

// Singleton Stripe client
let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance
 */
export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2025-01-27.acacia',
    typescript: true,
  });

  return stripeClient;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}

/**
 * Pricing tiers configuration
 * Map tier names to credits and Stripe price IDs
 */
export const PRICING_TIERS = {
  starter: {
    name: 'Starter',
    credits: 500,
    monthlyPrice: 20,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || '',
  },
  pro: {
    name: 'Pro',
    credits: 3000,
    monthlyPrice: 100,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
  team: {
    name: 'Team',
    credits: 7500,
    monthlyPrice: 200,
    priceId: process.env.STRIPE_TEAM_PRICE_ID || '',
  },
} as const;

export type TierName = keyof typeof PRICING_TIERS;

/**
 * Get tier details by name
 */
export function getTier(tier: TierName) {
  return PRICING_TIERS[tier];
}

/**
 * Credits to tier mapping (for subscription events)
 */
export function creditsForTier(tier: string): number {
  switch (tier.toLowerCase()) {
    case 'starter':
      return 500;
    case 'pro':
      return 3000;
    case 'team':
      return 7500;
    default:
      return 0;
  }
}

/**
 * Get tier from Stripe price ID
 */
export function tierFromPriceId(priceId: string): TierName | null {
  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    if (config.priceId === priceId) {
      return tier as TierName;
    }
  }
  return null;
}
