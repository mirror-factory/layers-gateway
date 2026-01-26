import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

interface MarginConfig {
  globalMarginPercent: number;
  modelOverrides: Record<string, number>;
}

/**
 * GET /api/margin-config
 * Get the user's margin configuration
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serverClient = createServerClient();

    // Fetch margin config for user
    const { data, error } = await serverClient
      .from('margin_configs')
      .select('global_margin_percent, model_overrides')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no config exists, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          globalMarginPercent: 60,
          modelOverrides: {},
        });
      }

      console.error('Error fetching margin config:', error);
      return NextResponse.json(
        { error: 'Failed to fetch margin config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      globalMarginPercent: data.global_margin_percent,
      modelOverrides: data.model_overrides || {},
    });
  } catch (error) {
    console.error('Error in GET /api/margin-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/margin-config
 * Save the user's margin configuration
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: MarginConfig = await request.json();

    // Validate input
    if (typeof body.globalMarginPercent !== 'number') {
      return NextResponse.json(
        { error: 'globalMarginPercent must be a number' },
        { status: 400 }
      );
    }

    if (body.globalMarginPercent < 0 || body.globalMarginPercent > 200) {
      return NextResponse.json(
        { error: 'globalMarginPercent must be between 0 and 200' },
        { status: 400 }
      );
    }

    if (typeof body.modelOverrides !== 'object') {
      return NextResponse.json(
        { error: 'modelOverrides must be an object' },
        { status: 400 }
      );
    }

    // Validate model overrides
    for (const [modelId, marginPercent] of Object.entries(body.modelOverrides)) {
      if (typeof marginPercent !== 'number' || marginPercent < 0 || marginPercent > 200) {
        return NextResponse.json(
          { error: `Invalid margin for model ${modelId}: must be a number between 0 and 200` },
          { status: 400 }
        );
      }
    }

    const serverClient = createServerClient();

    // Upsert margin config
    const { data, error } = await serverClient
      .from('margin_configs')
      .upsert(
        {
          user_id: user.id,
          global_margin_percent: body.globalMarginPercent,
          model_overrides: body.modelOverrides,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving margin config:', error);
      return NextResponse.json(
        { error: 'Failed to save margin config' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        globalMarginPercent: data.global_margin_percent,
        modelOverrides: data.model_overrides,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/margin-config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
