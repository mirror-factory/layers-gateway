import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/middleware/auth';
import { checkBalance, deductCredits, logUsage, creditsToUsd } from '@/lib/middleware/credits';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';
import { parseProvider } from '@/lib/gateway/client';
import { experimental_generateImage as generateImage, createGateway } from 'ai';
import { getCorsHeaders, createCorsPreflightResponse } from '@/lib/cors/config';

// SECURITY: Input validation limits
const MAX_PROMPT_LENGTH = 10_000; // 10k characters for image prompts
const MAX_IMAGES_PER_REQUEST = 4; // Maximum images per request
const MAX_CREDITS_PER_IMAGE_REQUEST = 60; // ~$0.60 USD safety cap

interface ImageRequest {
  model: string;
  prompt: string;
  n?: number;
  aspect_ratio?: string;
  size?: string;
}

// Image model pricing (credits per image)
// Formula: credits = (cost_usd / $0.01) × 1.6 (60% margin)
const IMAGE_PRICING: Record<string, number> = {
  // BFL Flux models (per megapixel → estimate ~1MP per image)
  'bfl/flux-2-pro': 4.8,          // $0.03/MP
  'bfl/flux-2-flex': 9.6,         // $0.06/MP
  'bfl/flux-2-klein-4b': 2.24,    // $0.014/MP
  'bfl/flux-2-klein-9b': 2.40,    // $0.015/MP
  'bfl/flux-pro-1.1': 6.4,        // $0.04/img
  'bfl/flux-pro-1.1-ultra': 9.6,  // $0.06/img
  'bfl/flux-kontext-pro': 6.4,    // $0.04/img
  'bfl/flux-kontext-max': 12.8,   // $0.08/img
  // Google Imagen models (per image)
  'google/imagen-4.0-fast-generate-001': 3.2,   // $0.02/img
  'google/imagen-4.0-generate-001': 6.4,        // $0.04/img
  'google/imagen-4.0-ultra-generate-001': 12.8, // $0.08/img
};

/**
 * Calculate credits for image generation
 */
function calculateImageCredits(model: string, imageCount: number): number {
  const pricePerImage = IMAGE_PRICING[model] || 6.4; // Default to $0.04/img equivalent
  return pricePerImage * imageCount;
}

/**
 * Estimate credits before making a request
 */
function estimateImageCredits(model: string, requestedImages: number = 1): number {
  return calculateImageCredits(model, requestedImages);
}

/**
 * Get gateway API key
 */
function getGatewayKey(): string | null {
  return process.env.VERCEL_AI_GATEWAY_KEY || process.env.AI_GATEWAY_API_KEY || null;
}

/**
 * CORS preflight handler
 */
export async function OPTIONS(request: NextRequest) {
  return createCorsPreflightResponse(request.headers.get('origin'));
}

/**
 * Layers API - Image Generation
 *
 * POST /api/v1/image
 *
 * Headers:
 *   Authorization: Bearer lyr_live_xxxxx (your Layers API key)
 *
 * Body:
 *   {
 *     "model": "bfl/flux-2-pro",
 *     "prompt": "A red circle on white background",
 *     "n": 1,
 *     "aspect_ratio": "1:1"
 *   }
 *
 * Responses:
 *   200: Successful response with image data
 *   401: Invalid or missing API key
 *   402: Insufficient credits
 *   429: Rate limit exceeded
 *   500: Server error
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const startTime = Date.now();
  let userId: string | null = null;
  let apiKeyId: string | null = null;

  try {
    // 1. Authenticate
    const authResult = await validateApiKey(request.headers.get('authorization'), request.headers);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status, headers: corsHeaders }
      );
    }

    const { user } = authResult;
    userId = user.userId;
    apiKeyId = user.apiKeyId;

    // 2. Parse request body
    const body: ImageRequest = await request.json();
    const {
      model,
      prompt,
      n = 1,
      aspect_ratio = '1:1',
      size,
    } = body;

    // Validate required fields
    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400, headers: corsHeaders });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required and must be a non-empty string' },
        { status: 400, headers: corsHeaders }
      );
    }

    // SECURITY: Validate prompt length
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: 'Prompt exceeds maximum length',
          max_length: MAX_PROMPT_LENGTH,
          received_length: prompt.length,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // SECURITY: Validate number of images
    if (n > MAX_IMAGES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: 'Too many images requested',
          max_images: MAX_IMAGES_PER_REQUEST,
          requested: n,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Check rate limit
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
          headers: { ...getRateLimitHeaders(rateLimitResult), ...corsHeaders },
        }
      );
    }

    // 4. Pre-flight credit check
    const estimated = estimateImageCredits(model, n);

    // SECURITY: Per-request credit cap to prevent runaway costs
    if (estimated > MAX_CREDITS_PER_IMAGE_REQUEST) {
      return NextResponse.json(
        {
          error: 'Request exceeds maximum cost per request',
          max_credits: MAX_CREDITS_PER_IMAGE_REQUEST,
          estimated_credits: estimated,
          suggestion: 'Reduce number of images or use a more economical model',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const balanceCheck = checkBalance(user.balance, estimated);

    if (!balanceCheck.sufficient) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          balance: user.balance,
          estimated_required: estimated,
        },
        { status: 402, headers: corsHeaders }
      );
    }

    // 5. Check gateway key
    const gatewayKey = getGatewayKey();
    if (!gatewayKey) {
      return NextResponse.json(
        { error: 'AI Gateway not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 6. Call generateImage via gateway
    const gateway = createGateway({ apiKey: gatewayKey });

    // Convert size to aspect_ratio if provided
    let aspectRatio = aspect_ratio;
    if (size) {
      const [width, height] = size.split('x').map(Number);
      if (width && height) {
        // Simplify to common aspect ratios
        const ratio = width / height;
        if (ratio > 1.7) aspectRatio = '16:9';
        else if (ratio > 1.3) aspectRatio = '3:2';
        else if (ratio < 0.6) aspectRatio = '9:16';
        else if (ratio < 0.8) aspectRatio = '2:3';
        else aspectRatio = '1:1';
      }
    }

    const result = await generateImage({
      model: model,
      prompt: prompt,
      n: n,
      aspectRatio: aspectRatio as `${number}:${number}` | undefined,
    });

    const latencyMs = Date.now() - startTime;
    const imageCount = result.images.length;
    const creditsUsed = calculateImageCredits(model, imageCount);
    const provider = parseProvider(model);

    // 7. Log usage and deduct credits
    await Promise.all([
      logUsage({
        user_id: userId,
        api_key_id: apiKeyId,
        model_id: model,
        provider,
        request_type: 'image',
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: creditsToUsd(creditsUsed),
        credits_used: creditsUsed,
        latency_ms: latencyMs,
        status: 'success',
        metadata: { image_count: imageCount, aspect_ratio: aspectRatio },
      }),
      deductCredits(userId, creditsUsed),
    ]);

    // 8. Build response
    const imageData = result.images.map((img) => {
      if (img.base64) {
        return { b64_json: img.base64 };
      }
      if (img.uint8Array) {
        return { b64_json: Buffer.from(img.uint8Array).toString('base64') };
      }
      return {};
    });

    return NextResponse.json(
      {
        created: Math.floor(Date.now() / 1000),
        data: imageData,
        usage: {
          images: imageCount,
        },
        layers: {
          credits_used: creditsUsed,
          latency_ms: latencyMs,
        },
      },
      {
        headers: { ...getRateLimitHeaders(rateLimitResult), ...corsHeaders },
      }
    );
  } catch (error) {
    // SECURITY: Generate request ID for support, don't expose stack traces
    const requestId = crypto.randomUUID();
    console.error('[Image API Error]', { requestId, error, userId });

    // Log failed request
    if (userId) {
      try {
        await logUsage({
          user_id: userId,
          api_key_id: apiKeyId,
          model_id: 'unknown',
          provider: 'unknown',
          request_type: 'image',
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
      { error: 'Internal server error', request_id: requestId },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));

  return NextResponse.json(
    {
      status: 'ok',
      version: 'v1.0.0',
      endpoint: '/api/v1/image',
      supported_models: Object.keys(IMAGE_PRICING),
      docs: 'https://layers.hustletogether.com/docs',
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  );
}
