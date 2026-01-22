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
    const stripe = getStripe();

    // First, check if user has a credit_balances row
    const { data: existingBalance } = await serverClient
      .from('credit_balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Find Stripe customer by user ID in metadata or by email
    let customerId = existingBalance?.stripe_customer_id;

    if (!customerId) {
      // Search for customer by metadata userId or email
      const customers = await stripe.customers.search({
        query: `metadata['userId']:'${user.id}' OR email:'${user.email}'`,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (!customerId) {
      // No Stripe customer found - ensure user has a free tier row
      if (!existingBalance) {
        await serverClient.from('credit_balances').insert({
          user_id: user.id,
          balance: 0,
          tier: 'free',
          monthly_credits: 0,
        });
      }

      return NextResponse.json({
        synced: true,
        tier: 'free',
        credits: 0,
        message: 'No Stripe customer found. Free tier set.',
      });
    }

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription - set to free tier
      const updateData = {
        user_id: user.id,
        stripe_customer_id: customerId,
        tier: 'free',
        stripe_subscription_status: 'none',
        monthly_credits: 0,
        updated_at: new Date().toISOString(),
      };

      if (existingBalance) {
        await serverClient
          .from('credit_balances')
          .update(updateData)
          .eq('user_id', user.id);
      } else {
        await serverClient
          .from('credit_balances')
          .insert({ ...updateData, balance: 0 });
      }

      return NextResponse.json({
        synced: true,
        tier: 'free',
        message: 'No active subscription found. Free tier set.',
      });
    }

    // Found active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    const tier = priceId ? tierFromPriceId(priceId) : 'pro';
    const credits = tier ? creditsForTier(tier) : 3000;

    // Determine if we should grant credits
    const currentBalance = existingBalance?.balance || 0;
    const shouldGrantCredits = currentBalance === 0;

    const updateData: Record<string, unknown> = {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      tier: tier || 'pro',
      monthly_credits: credits,
      updated_at: new Date().toISOString(),
    };

    if (shouldGrantCredits) {
      updateData.balance = credits;
    }

    if (existingBalance) {
      await serverClient
        .from('credit_balances')
        .update(updateData)
        .eq('user_id', user.id);
    } else {
      updateData.balance = credits; // Always grant credits for new row
      await serverClient
        .from('credit_balances')
        .insert(updateData);
    }

    const finalBalance = shouldGrantCredits || !existingBalance ? credits : currentBalance;

    return NextResponse.json({
      synced: true,
      tier: tier || 'pro',
      credits: finalBalance,
      monthly_credits: credits,
      subscription_status: subscription.status,
      balance_updated: shouldGrantCredits || !existingBalance,
      message: shouldGrantCredits || !existingBalance
        ? `Subscription synced! You now have ${credits} credits.`
        : `Subscription synced! Tier: ${tier}, Balance: ${currentBalance} credits.`,
    });
  } catch (error) {
    console.error('Stripe sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription', details: String(error) },
      { status: 500 }
    );
  }
}
