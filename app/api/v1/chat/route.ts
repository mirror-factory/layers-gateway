import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, authErrorResponse } from '@/lib/middleware/auth';
import { calculateCredits, estimateCredits, checkBalance, deductCredits, logUsage, creditsToUsd, calculateCreditsWithBreakdown, type MirrorFactoryInput, type CostBreakdown } from '@/lib/middleware/credits';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';
import { callGateway, callGatewayStream, parseProvider, GatewayMessage, ToolDefinition } from '@/lib/gateway/client';

interface ChatRequest {
  model: string;
  messages: GatewayMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  // Tools support
  tools?: ToolDefinition[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  // JSON mode
  response_format?: { type: 'json_object' | 'text' };
  // Extended thinking (convenience parameter, converted to provider options)
  thinking?: { type: 'enabled'; budget_tokens: number };
  // Web search (for Perplexity models)
  web_search?: boolean;
  search_domains?: string[];
  // Prompt caching
  cache?: boolean;
  // Provider-specific options (for advanced usage)
  anthropic?: Record<string, unknown>;
  openai?: Record<string, unknown>;
  google?: Record<string, unknown>;
  // External cost input (from Mirror Factory)
  mirror_factory?: MirrorFactoryInput;
}

/**
 * Layers API - Chat Completions
 *
 * POST /api/v1/chat
 *
 * Headers:
 *   Authorization: Bearer lyr_live_xxxxx (your Layers API key)
 *
 * Body (OpenAI-compatible):
 *   {
 *     "model": "anthropic/claude-sonnet-4.5",
 *     "messages": [{ "role": "user", "content": "Hello!" }],
 *     "max_tokens": 1024,
 *     "temperature": 0.7
 *   }
 *
 * Responses:
 *   200: Successful response with text and usage
 *   401: Invalid or missing API key
 *   402: Insufficient credits
 *   429: Rate limit exceeded
 *   500: Server error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let userId: string | null = null;
  let apiKeyId: string | null = null;

  try {
    // 1. Authenticate (pass headers for test mode detection)
    const authResult = await validateApiKey(request.headers.get('authorization'), request.headers);
    if (!authResult.success) {
      return authErrorResponse(authResult);
    }

    const { user } = authResult;
    userId = user.userId;
    apiKeyId = user.apiKeyId;

    // 2. Parse request body
    const body: ChatRequest = await request.json();
    const {
      model,
      messages,
      max_tokens = 1024,
      temperature,
      stream = false,
      tools,
      tool_choice,
      response_format,
      thinking,
      web_search,
      search_domains,
      cache,
      anthropic: anthropicOptions,
      openai: openaiOptions,
      google: googleOptions,
      mirror_factory,
    } = body;

    // Validate mirror_factory.base_cost_usd if provided
    if (mirror_factory?.base_cost_usd !== undefined) {
      const baseCost = mirror_factory.base_cost_usd;
      if (typeof baseCost !== 'number' || isNaN(baseCost) || baseCost < 0) {
        return NextResponse.json(
          {
            error: 'Invalid mirror_factory.base_cost_usd',
            details: 'base_cost_usd must be a non-negative number',
          },
          { status: 400 }
        );
      }
    }

    // Validate required fields
    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // 3. Check rate limit (pass headers to detect test mode)
    const rateLimitResult = checkRateLimit(userId, user.tier, request.headers);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimitResult.limit,
          reset_at: new Date(rateLimitResult.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // 4. Pre-flight credit check
    const estimated = estimateCredits(model, max_tokens);
    const balanceCheck = checkBalance(user.balance, estimated);

    if (!balanceCheck.sufficient) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          balance: user.balance,
          estimated_required: estimated,
        },
        { status: 402 }
      );
    }

    // 5. Build gateway request with all parameters
    // Convert thinking to provider-specific options
    const anthropic = thinking?.type === 'enabled'
      ? { ...anthropicOptions, thinking: { type: 'enabled', budget_tokens: thinking.budget_tokens } }
      : anthropicOptions;

    const gatewayRequest = {
      model,
      messages,
      max_tokens,
      temperature,
      tools,
      tool_choice,
      response_format,
      anthropic,
      openai: openaiOptions,
      google: googleOptions,
      // Web search (for Perplexity)
      ...(web_search && { web_search }),
      ...(search_domains && { search_domains }),
      // Prompt caching
      ...(cache && { cache }),
    };

    // 6. Handle streaming
    if (stream) {
      const streamResult = await callGatewayStream(gatewayRequest);

      if (!streamResult.success) {
        await logUsage({
          user_id: userId,
          api_key_id: apiKeyId,
          model_id: model,
          provider: parseProvider(model),
          request_type: 'chat',
          status: 'error',
          error_message: streamResult.error.error,
          latency_ms: Date.now() - startTime,
          credits_used: 0,
        });

        return NextResponse.json(
          { error: streamResult.error.error, details: streamResult.error.details },
          { status: streamResult.error.status }
        );
      }

      // Return streaming response
      // Note: Credit deduction for streaming happens after the stream completes
      // For now, we estimate credits upfront
      const estimatedCredits = estimateCredits(model, max_tokens);

      return new Response(streamResult.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...getRateLimitHeaders(rateLimitResult),
          'X-Layers-Credits-Estimated': String(estimatedCredits),
        },
      });
    }

    // 7. Call AI Gateway (non-streaming)
    const gatewayResult = await callGateway(gatewayRequest);

    if (!gatewayResult.success) {
      // Log failed request
      await logUsage({
        user_id: userId,
        api_key_id: apiKeyId,
        model_id: model,
        provider: parseProvider(model),
        request_type: 'chat',
        status: 'error',
        error_message: gatewayResult.error.error,
        latency_ms: Date.now() - startTime,
        credits_used: 0,
      });

      return NextResponse.json(
        { error: gatewayResult.error.error, details: gatewayResult.error.details },
        { status: gatewayResult.error.status }
      );
    }

    const { data } = gatewayResult;
    const latencyMs = Date.now() - startTime;

    // 7. Calculate actual credits used (with breakdown if mirror_factory provided)
    const inputTokens = data.usage.prompt_tokens || 0;
    const outputTokens = data.usage.completion_tokens || 0;
    const { credits: creditsUsed, breakdown: costBreakdown } = calculateCreditsWithBreakdown(
      model,
      inputTokens,
      outputTokens,
      mirror_factory
    );
    const provider = parseProvider(model);

    // 8. Log usage and deduct credits
    await Promise.all([
      logUsage({
        user_id: userId,
        api_key_id: apiKeyId,
        model_id: model,
        provider,
        request_type: 'chat',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costBreakdown.base_cost_usd,
        credits_used: creditsUsed,
        latency_ms: latencyMs,
        status: 'success',
        metadata: {
          cost_breakdown: costBreakdown,
          ...(mirror_factory && { external_cost_source: 'mirror_factory' }),
        },
      }),
      deductCredits(userId, creditsUsed),
    ]);

    // 9. Build message response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageResponse: any = {
      role: 'assistant',
      content: data.text,
    };

    // Add tool_calls if present
    if (data.tool_calls && data.tool_calls.length > 0) {
      messageResponse.tool_calls = data.tool_calls;
      // When tool calls are present, content might be null
      if (!data.text) {
        messageResponse.content = null;
      }
    }

    // Determine finish_reason
    const finishReason = data.tool_calls && data.tool_calls.length > 0 ? 'tool_calls' : 'stop';

    // 10. Return OpenAI-compatible response
    // Include provider-specific fields like sources (Perplexity) at the top level
    return NextResponse.json(
      {
        id: data.id,
        object: 'chat.completion',
        created: data.created,
        model: data.model,
        choices: [
          {
            index: 0,
            message: messageResponse,
            finish_reason: finishReason,
          },
        ],
        usage: {
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
        },
        // Perplexity sources/citations (pass-through at top level for direct access)
        ...(data.sources && data.sources.length > 0 && { sources: data.sources }),
        // AI SDK compatible provider metadata (for createOpenAI consumers)
        ...(data.sources && data.sources.length > 0 && {
          experimental_providerMetadata: {
            perplexity: {
              sources: data.sources,
            },
          },
        }),
        // Layers-specific fields
        layers: {
          credits_used: creditsUsed,
          latency_ms: latencyMs,
          reasoning: data.reasoning || undefined,
          // Include cost breakdown for transparency
          cost_breakdown: costBreakdown,
        },
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  } catch (error) {
    console.error('Layers API error:', error);

    // Log failed request if we have user context
    if (userId) {
      try {
        await logUsage({
          user_id: userId,
          api_key_id: apiKeyId,
          model_id: 'unknown',
          provider: 'unknown',
          request_type: 'chat',
          status: 'error',
          error_message: String(error),
          latency_ms: Date.now() - startTime,
          credits_used: 0,
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

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'v1.6.0', // Added pricing sync from Hustle Together AI
    build: '2026-01-23T14:00:00Z',
    endpoints: {
      chat: 'POST /api/v1/chat',
      pricing: 'GET/POST /api/v1/pricing',
    },
    features: {
      cost_breakdown: true,
      mirror_factory_input: true,
      validation: true,
      pricing_sync: true,
    },
    docs: 'https://layers.hustletogether.com/docs',
    timestamp: new Date().toISOString(),
  });
}
