import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe, creditsForTier, tierFromPriceId, TierName } from '@/lib/stripe/client';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 *
 * Handles:
 * - checkout.session.completed: New subscription purchased
 * - customer.subscription.created: Subscription started
 * - customer.subscription.updated: Subscription changed (upgrade/downgrade)
 * - customer.subscription.deleted: Subscription cancelled
 * - invoice.paid: Recurring payment successful (credit renewal)
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed
 * Called when a customer completes the checkout process
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);

  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as TierName | undefined;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured');
    return;
  }

  const supabase = createServerClient();

  // Update user's Stripe customer ID if not already set
  await supabase
    .from('credit_balances')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: session.subscription as string,
      stripe_subscription_status: 'active',
      tier: tier || 'starter',
      monthly_credits: creditsForTier(tier || 'starter'),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log(`User ${userId} subscribed to ${tier} tier`);
}

/**
 * Handle customer.subscription.created
 * Called when a subscription is created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);

  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    // Try to find user by customer ID
    await updateUserByCustomerId(customerId, subscription);
    return;
  }

  if (!isSupabaseConfigured()) return;

  const supabase = createServerClient();
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;
  const credits = tier ? creditsForTier(tier) : 0;

  await supabase
    .from('credit_balances')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      tier: tier || 'starter',
      monthly_credits: credits,
      balance: credits, // Grant initial credits
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Handle customer.subscription.updated
 * Called when a subscription is modified (upgrade/downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!userId) {
    await updateUserByCustomerId(customerId, subscription);
    return;
  }

  if (!isSupabaseConfigured()) return;

  const supabase = createServerClient();
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;
  const credits = tier ? creditsForTier(tier) : 0;

  await supabase
    .from('credit_balances')
    .update({
      stripe_subscription_status: subscription.status,
      tier: tier || 'free',
      monthly_credits: credits,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

/**
 * Handle customer.subscription.deleted
 * Called when a subscription is cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  const userId = subscription.metadata?.userId;
  const customerId = subscription.customer as string;

  if (!isSupabaseConfigured()) return;

  const supabase = createServerClient();

  // Find user by subscription ID or customer ID
  let userQuery;
  if (userId) {
    userQuery = supabase
      .from('credit_balances')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_status: 'cancelled',
        tier: 'free',
        monthly_credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    userQuery = supabase
      .from('credit_balances')
      .update({
        stripe_subscription_id: null,
        stripe_subscription_status: 'cancelled',
        tier: 'free',
        monthly_credits: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId);
  }

  await userQuery;
  console.log(`Subscription cancelled for customer ${customerId}`);
}

/**
 * Handle invoice.paid
 * Called when a recurring payment succeeds (monthly credit renewal)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);

  // Only process subscription invoices
  // @ts-ignore - subscription exists on invoice for subscription invoices
  const subscriptionId = invoice.subscription as string | null;
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;

  if (!isSupabaseConfigured()) return;

  const supabase = createServerClient();

  // Get user by customer ID
  const { data: user } = await supabase
    .from('credit_balances')
    .select('user_id, tier, monthly_credits, balance')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  // Add monthly credits to balance
  const newBalance = parseFloat(String(user.balance)) + user.monthly_credits;

  await supabase
    .from('credit_balances')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.user_id);

  console.log(`Added ${user.monthly_credits} credits to user ${user.user_id}. New balance: ${newBalance}`);
}

/**
 * Helper: Update user by Stripe customer ID when userId not in metadata
 */
async function updateUserByCustomerId(customerId: string, subscription: Stripe.Subscription) {
  if (!isSupabaseConfigured()) return;

  const supabase = createServerClient();
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId ? tierFromPriceId(priceId) : null;
  const credits = tier ? creditsForTier(tier) : 0;

  await supabase
    .from('credit_balances')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      tier: tier || 'starter',
      monthly_credits: credits,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);
}
