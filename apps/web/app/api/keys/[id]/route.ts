import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();

    // Verify the key belongs to the user
    const { data: key } = await serverClient
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!key) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 });
    }

    // Delete the key
    const { error } = await serverClient
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting key:', error);
      return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/keys/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
