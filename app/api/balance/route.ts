import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const { data: balance, error } = await serverClient
      .from('credit_balances')
      .select('balance, tier, monthly_credits, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching balance:', error);
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
    }

    // If no balance record, return free tier defaults
    if (!balance) {
      return NextResponse.json({
        credits: 0,
        tier: 'free',
        monthly_credits: 0,
        subscription_status: null,
      });
    }

    return NextResponse.json({
      credits: balance.balance,
      tier: balance.tier,
      monthly_credits: balance.monthly_credits,
      subscription_status: balance.subscription_status,
    });
  } catch (error) {
    console.error('Error in GET /api/balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
