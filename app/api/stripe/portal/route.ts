import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface PortalRequest {
  userId: string;
  returnUrl?: string;
}

/**
 * Create a Stripe Customer Portal session
 * Allows customers to manage their subscription, update payment methods, view invoices
 *
 * POST /api/stripe/portal
 *
 * Body:
 *   {
 *     "userId": "uuid",
 *     "returnUrl": "https://..." (optional)
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body: PortalRequest = await request.json();
    const { userId, returnUrl } = body;

    // Validate userId
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createServerClient();

    // Get user's Stripe customer ID
    const { data: balance, error } = await supabase
      .from('credit_balances')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !balance) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!balance.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. User has not made a purchase yet.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Determine return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    request.headers.get('origin') ||
                    'https://web-nine-sage-13.vercel.app';

    const finalReturnUrl = returnUrl || `${baseUrl}/dashboard`;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: balance.stripe_customer_id,
      return_url: finalReturnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session', details: String(error) },
      { status: 500 }
    );
  }
}
