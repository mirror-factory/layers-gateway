import { NextResponse } from 'next/server';
import { isSupabaseConfigured, createServerClient, hashApiKey } from '@/lib/supabase/client';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const configured = isSupabaseConfigured();

  let dbTest = 'not attempted';
  let keyCount = 0;

  if (configured) {
    try {
      const supabase = createServerClient();
      const { data, error, count } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact' });

      if (error) {
        dbTest = `error: ${error.message}`;
      } else {
        dbTest = 'success';
        keyCount = count || 0;
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
    testKeyHash: hash,
    expectedHash: '6c42d42ddd9507aace7a9a15eaf1bbd13b8c0ecd33af2f3ac85e4f0994006ace',
    hashMatch: hash === '6c42d42ddd9507aace7a9a15eaf1bbd13b8c0ecd33af2f3ac85e4f0994006ace',
  });
}
