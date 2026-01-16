import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICING_TIERS, TierName } from '@/lib/stripe/client';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface CheckoutRequest {
  tier: TierName;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Create a Stripe Checkout session for purchasing a subscription
 *
 * POST /api/stripe/checkout
 *
 * Body:
 *   {
 *     "tier": "starter" | "pro" | "team",
 *     "userId": "uuid",
 *     "successUrl": "https://...", (optional)
 *     "cancelUrl": "https://..."   (optional)
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { tier, userId, successUrl, cancelUrl } = body;

    // Validate tier
    if (!tier || !PRICING_TIERS[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be one of: starter, pro, team' },
        { status: 400 }
      );
    }

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const tierConfig = PRICING_TIERS[tier];

    // Check if price ID is configured
    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${tier} tier. Set STRIPE_${tier.toUpperCase()}_PRICE_ID env var.` },
        { status: 500 }
      );
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId: string | undefined;

    if (isSupabaseConfigured()) {
      const supabase = createServerClient();

      // Check if user already has a Stripe customer ID
      const { data: balance } = await supabase
        .from('credit_balances')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .single();

      if (balance?.stripe_customer_id) {
        customerId = balance.stripe_customer_id;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          metadata: {
            userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to database
        await supabase
          .from('credit_balances')
          .update({ stripe_customer_id: customer.id })
          .eq('user_id', userId);
      }
    }

    // Determine URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://web-nine-sage-13.vercel.app';

    const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/pricing`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        userId,
        tier,
      },
      subscription_data: {
        metadata: {
          userId,
          tier,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: String(error) },
      { status: 500 }
    );
  }
}
