import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/client';
import { getStripe, tierFromPriceId, creditsForTier } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';

/**
 * Sync subscription status from Stripe
 *
 * POST /api/stripe/sync
 *
 * This manually syncs the user's subscription from Stripe to the database.
 * Useful when webhooks weren't configured or missed events.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();

    // Get user's Stripe customer ID
    const { data: balance } = await serverClient
      .from('credit_balances')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!balance?.stripe_customer_id) {
      return NextResponse.json({
        error: 'No Stripe customer found',
        message: 'User has not made any purchases yet'
      }, { status: 404 });
    }

    const stripe = getStripe();

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: balance.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - set to free tier
      await serverClient
        .from('credit_balances')
        .update({
          tier: 'free',
          stripe_subscription_status: 'none',
          monthly_credits: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        synced: true,
        tier: 'free',
        message: 'No active subscription found',
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const tier = priceId ? tierFromPriceId(priceId) : 'starter';
    const credits = tier ? creditsForTier(tier) : 500;

    // Update database with subscription info
    const { data: currentBalance } = await serverClient
      .from('credit_balances')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    // If balance is 0 or null, grant initial credits
    const shouldGrantCredits = !currentBalance?.balance || currentBalance.balance === 0;

    const updateData: Record<string, unknown> = {
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      tier: tier || 'starter',
      monthly_credits: credits,
      updated_at: new Date().toISOString(),
    };

    if (shouldGrantCredits) {
      updateData.balance = credits;
    }

    await serverClient
      .from('credit_balances')
      .update(updateData)
      .eq('user_id', user.id);

    return NextResponse.json({
      synced: true,
      tier: tier || 'starter',
      credits: credits,
      subscription_status: subscription.status,
      balance_updated: shouldGrantCredits,
      message: shouldGrantCredits
        ? `Subscription synced! Added ${credits} credits to your balance.`
        : 'Subscription synced! Balance unchanged (already had credits).',
    });
  } catch (error) {
    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription', details: String(error) },
      { status: 500 }
    );
  }
}
