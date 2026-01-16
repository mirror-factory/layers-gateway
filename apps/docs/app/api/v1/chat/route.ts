import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, hashApiKey, calculateCredits } from '@/lib/supabase';

// Vercel AI Gateway endpoint
const GATEWAY_URL = 'https://gateway.vercel.ai/v1/chat/completions';

interface ChatRequest {
  model: string;
  messages: Array<{ role: string; content: string | Array<unknown> }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * Layers API - Chat Completions
 *
 * POST /api/v1/chat
 *
 * Headers:
 *   Authorization: Bearer lk_live_xxxxx (your Layers API key)
 *
 * Body (OpenAI-compatible):
 *   {
 *     "model": "anthropic/claude-sonnet-4.5",
 *     "messages": [{ "role": "user", "content": "Hello!" }],
 *     "max_tokens": 1024
 *   }
 *
 * Responses:
 *   200: Successful response with text and usage
 *   401: Invalid or missing API key
 *   402: Insufficient credits
 *   500: Server error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let apiKeyId: string | null = null;

  try {
    // 1. Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer lk_live_xxxxx' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    if (!apiKey.startsWith('lk_live_')) {
      return NextResponse.json(
        { error: 'Invalid API key format. Keys start with lk_live_' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: ChatRequest = await request.json();
    const { model, messages, max_tokens = 1024, temperature, stream = false } = body;

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // 3. Validate API key and get user
    const serviceKeyConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceKeyConfigured) {
      const supabase = createServerClient();
      const keyHash = hashApiKey(apiKey);

      // Look up API key
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('id, user_id, is_active, expires_at')
        .eq('key_hash', keyHash)
        .single();

      if (keyError || !keyData) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }

      if (!keyData.is_active) {
        return NextResponse.json(
          { error: 'API key is deactivated' },
          { status: 401 }
        );
      }

      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'API key has expired' },
          { status: 401 }
        );
      }

      userId = keyData.user_id;
      apiKeyId = keyData.id;

      // Update last_used_at
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyId);

      // 4. Check credit balance
      const { data: balance, error: balanceError } = await supabase
        .from('credit_balances')
        .select('balance, tier')
        .eq('user_id', userId)
        .single();

      if (balanceError || !balance) {
        return NextResponse.json(
          { error: 'User account not found' },
          { status: 401 }
        );
      }

      // Estimate credits (rough estimate before actual usage)
      const estimatedCredits = 5; // Conservative estimate

      if (balance.balance < estimatedCredits) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            balance: parseFloat(balance.balance),
            required: estimatedCredits,
          },
          { status: 402 }
        );
      }
    } else {
      // Service key not configured - use demo mode
      console.warn('SUPABASE_SERVICE_ROLE_KEY not configured - running in demo mode');
    }

    // 5. Proxy to Vercel AI Gateway
    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    if (!gatewayKey) {
      return NextResponse.json(
        { error: 'Gateway not configured' },
        { status: 500 }
      );
    }

    const gatewayBody: Record<string, unknown> = {
      model,
      messages,
      max_tokens,
    };

    if (temperature !== undefined) {
      gatewayBody.temperature = temperature;
    }

    // TODO: Implement streaming support
    if (stream) {
      return NextResponse.json(
        { error: 'Streaming not yet implemented' },
        { status: 501 }
      );
    }

    const gatewayResponse = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!gatewayResponse.ok) {
      const errorText = await gatewayResponse.text();
      console.error('Gateway error:', gatewayResponse.status, errorText);
      return NextResponse.json(
        { error: `Provider error: ${gatewayResponse.status}`, details: errorText },
        { status: gatewayResponse.status }
      );
    }

    const gatewayData = await gatewayResponse.json();
    const latencyMs = Date.now() - startTime;

    // 6. Calculate usage and credits
    const usage = gatewayData.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const creditsUsed = calculateCredits(model, inputTokens, outputTokens);

    // Extract provider from model ID
    const provider = model.split('/')[0] || 'unknown';

    // 7. Log usage and deduct credits (if service key configured)
    if (serviceKeyConfigured && userId) {
      const supabase = createServerClient();

      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: userId,
        api_key_id: apiKeyId,
        model_id: model,
        provider,
        request_type: 'chat',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: creditsUsed / 160, // Convert credits back to USD (approx)
        credits_used: creditsUsed,
        latency_ms: latencyMs,
        status: 'success',
      });

      // Deduct credits
      await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: creditsUsed,
      });
    }

    // 8. Return response
    const text = gatewayData.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      id: gatewayData.id,
      object: 'chat.completion',
      created: gatewayData.created,
      model: gatewayData.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: text,
          },
          finish_reason: gatewayData.choices?.[0]?.finish_reason || 'stop',
        },
      ],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        credits_used: creditsUsed,
      },
    });
  } catch (error) {
    console.error('Layers API error:', error);

    // Log failed request if possible
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServerClient();
        await supabase.from('usage_logs').insert({
          user_id: userId,
          api_key_id: apiKeyId,
          model_id: 'unknown',
          provider: 'unknown',
          request_type: 'chat',
          status: 'error',
          error_message: String(error),
          latency_ms: Date.now() - startTime,
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'v1',
    endpoints: {
      chat: 'POST /api/v1/chat',
    },
    docs: 'https://preview.hustletogether.com/docs',
  });
}
