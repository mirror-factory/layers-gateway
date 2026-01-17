import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient, generateApiKey } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();
    const { data: keys, error } = await serverClient
      .from('api_keys')
      .select('id, name, key_prefix, is_active, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching keys:', error);
      return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 });
    }

    return NextResponse.json({
      keys: keys?.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.key_prefix,
        is_active: k.is_active,
        created_at: k.created_at,
        last_used_at: k.last_used_at,
      })) || [],
    });
  } catch (error) {
    console.error('Error in GET /api/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = body.name || 'Untitled Key';

    // Generate new API key
    const { key, prefix, hash } = generateApiKey();

    const serverClient = createServerClient();
    const { error } = await serverClient
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_hash: hash,
        key_prefix: prefix,
        name,
        is_active: true,
      });

    if (error) {
      console.error('Error creating key:', error);
      return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
    }

    // Also ensure user has a credit balance record
    const { data: existingBalance } = await serverClient
      .from('credit_balances')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingBalance) {
      await serverClient
        .from('credit_balances')
        .insert({
          user_id: user.id,
          balance: 50, // Free tier starting credits
          tier: 'free',
          monthly_credits: 50,
        });
    }

    return NextResponse.json({ key, prefix });
  } catch (error) {
    console.error('Error in POST /api/keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
