import { NextResponse } from 'next/server';
import { isSupabaseConfigured, createServerClient, hashApiKey } from '@/lib/supabase/client';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configured = isSupabaseConfigured();

  let dbTest = 'not attempted';
  let keyCount = 0;
  let balanceCount = 0;
  let usersWithKeys: Array<{ user_id: string; key_count: number; balance: number | null; tier: string | null }> = [];

  if (configured) {
    try {
      const supabase = createServerClient();

      // Count API keys
      const { error: keyError, count: keysTotal } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact' });

      if (keyError) {
        dbTest = `error: ${keyError.message}`;
      } else {
        dbTest = 'success';
        keyCount = keysTotal || 0;
      }

      // Count credit balances
      const { count: balancesTotal } = await supabase
        .from('credit_balances')
        .select('id', { count: 'exact' });
      balanceCount = balancesTotal || 0;

      // Get summary of users with keys and their balances
      const { data: keys } = await supabase
        .from('api_keys')
        .select('user_id');

      if (keys) {
        const userIds = [...new Set(keys.map(k => k.user_id))];

        for (const userId of userIds.slice(0, 5)) { // Limit to 5 users
          const { count: userKeyCount } = await supabase
            .from('api_keys')
            .select('id', { count: 'exact' })
            .eq('user_id', userId);

          const { data: balance } = await supabase
            .from('credit_balances')
            .select('balance, tier')
            .eq('user_id', userId)
            .single();

          usersWithKeys.push({
            user_id: userId.substring(0, 8) + '...',
            key_count: userKeyCount || 0,
            balance: balance?.balance ? parseFloat(balance.balance) : null,
            tier: balance?.tier || null,
          });
        }
      }
    } catch (e) {
      dbTest = `exception: ${String(e)}`;
    }
  }

  // Test hash function
  const testKey = 'lyr_live_test123456789abcdef';
  const hash = hashApiKey(testKey);

  return NextResponse.json({
    supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
    hasServiceKey,
    configured,
    dbTest,
    keyCount,
    balanceCount,
    usersWithKeys,
    testKeyHash: hash,
    expectedHash: '6c42d42ddd9507aace7a9a15eaf1bbd13b8c0ecd33af2f3ac85e4f0994006ace',
    hashMatch: hash === '6c42d42ddd9507aace7a9a15eaf1bbd13b8c0ecd33af2f3ac85e4f0994006ace',
  });
}
