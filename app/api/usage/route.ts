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

    // Get start of current month and last 30 days
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get all usage logs for the user
    const { data: allLogs, error: logsError } = await serverClient
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching usage logs:', logsError);
      return NextResponse.json({
        total_requests: 0,
        total_credits_used: 0,
        this_month_requests: 0,
        this_month_credits: 0,
        by_provider: [],
        by_model: [],
        by_day: [],
        recent_logs: [],
      });
    }

    const logs = allLogs || [];

    // Calculate totals
    const totalRequests = logs.length;
    const totalCredits = logs.reduce((sum, log) => sum + (log.credits_used || 0), 0);

    // This month's stats
    const monthLogs = logs.filter(log => log.created_at >= startOfMonth);
    const monthRequests = monthLogs.length;
    const monthCredits = monthLogs.reduce((sum, log) => sum + (log.credits_used || 0), 0);

    // Group by provider
    const byProviderMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of logs) {
      const provider = log.provider || 'unknown';
      const existing = byProviderMap.get(provider) || { requests: 0, credits: 0, tokens: 0 };
      byProviderMap.set(provider, {
        requests: existing.requests + 1,
        credits: existing.credits + (log.credits_used || 0),
        tokens: existing.tokens + (log.input_tokens || 0) + (log.output_tokens || 0),
      });
    }
    const byProvider = Array.from(byProviderMap.entries()).map(([provider, stats]) => ({
      provider,
      ...stats,
    }));

    // Group by model
    const byModelMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of logs) {
      const model = log.model_id || 'unknown';
      const existing = byModelMap.get(model) || { requests: 0, credits: 0, tokens: 0 };
      byModelMap.set(model, {
        requests: existing.requests + 1,
        credits: existing.credits + (log.credits_used || 0),
        tokens: existing.tokens + (log.input_tokens || 0) + (log.output_tokens || 0),
      });
    }
    const byModel = Array.from(byModelMap.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10); // Top 10 models

    // Group by day (last 30 days)
    const last30DaysLogs = logs.filter(log => log.created_at >= last30Days);
    const byDayMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of last30DaysLogs) {
      const day = log.created_at.split('T')[0]; // YYYY-MM-DD
      const existing = byDayMap.get(day) || { requests: 0, credits: 0, tokens: 0 };
      byDayMap.set(day, {
        requests: existing.requests + 1,
        credits: existing.credits + (log.credits_used || 0),
        tokens: existing.tokens + (log.input_tokens || 0) + (log.output_tokens || 0),
      });
    }
    const byDay = Array.from(byDayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent logs (last 20)
    const recentLogs = logs.slice(0, 20).map(log => ({
      id: log.id,
      model: log.model_id,
      provider: log.provider,
      input_tokens: log.input_tokens || 0,
      output_tokens: log.output_tokens || 0,
      credits_used: log.credits_used || 0,
      latency_ms: log.latency_ms || 0,
      status: log.status,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      total_requests: totalRequests,
      total_credits_used: totalCredits,
      this_month_requests: monthRequests,
      this_month_credits: monthCredits,
      by_provider: byProvider,
      by_model: byModel,
      by_day: byDay,
      recent_logs: recentLogs,
    });
  } catch (error) {
    console.error('Error in GET /api/usage:', error);
    return NextResponse.json({
      total_requests: 0,
      total_credits_used: 0,
      this_month_requests: 0,
      this_month_credits: 0,
      by_provider: [],
      by_model: [],
      by_day: [],
      recent_logs: [],
    });
  }
}
