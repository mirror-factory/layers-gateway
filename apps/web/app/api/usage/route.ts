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

    // Get start of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all-time stats
    const { data: totalStats, error: totalError } = await serverClient
      .from('usage_logs')
      .select('credits_used')
      .eq('user_id', user.id);

    // Get this month's stats
    const { data: monthStats, error: monthError } = await serverClient
      .from('usage_logs')
      .select('credits_used')
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth);

    if (totalError || monthError) {
      console.error('Error fetching usage:', totalError || monthError);
      // Return zeros if tables don't exist yet
      return NextResponse.json({
        total_requests: 0,
        total_credits_used: 0,
        this_month_requests: 0,
        this_month_credits: 0,
      });
    }

    const totalRequests = totalStats?.length || 0;
    const totalCredits = totalStats?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;
    const monthRequests = monthStats?.length || 0;
    const monthCredits = monthStats?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;

    return NextResponse.json({
      total_requests: totalRequests,
      total_credits_used: totalCredits,
      this_month_requests: monthRequests,
      this_month_credits: monthCredits,
    });
  } catch (error) {
    console.error('Error in GET /api/usage:', error);
    return NextResponse.json({
      total_requests: 0,
      total_credits_used: 0,
      this_month_requests: 0,
      this_month_credits: 0,
    });
  }
}
