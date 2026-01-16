import { createGateway, generateText, streamText } from 'ai';

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface GatewayRequest {
  model: string;
  messages: GatewayMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface GatewayResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  text: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GatewayError {
  error: string;
  status: number;
  details?: string;
}

/**
 * Get the AI Gateway API key
 * Supports both vai_ (preferred) and vck_ formats
 */
function getGatewayKey(): string | null {
  // Prefer the dedicated gateway key
  return (
    process.env.VERCEL_AI_GATEWAY_KEY ||
    process.env.AI_GATEWAY_API_KEY ||
    null
  );
}

/**
 * Check if gateway is configured
 */
export function isGatewayConfigured(): boolean {
  return !!getGatewayKey();
}

/**
 * Send a chat completion request using Vercel AI SDK Gateway
 */
export async function callGateway(
  request: GatewayRequest
): Promise<{ success: true; data: GatewayResponse } | { success: false; error: GatewayError }> {
  const gatewayKey = getGatewayKey();

  if (!gatewayKey) {
    return {
      success: false,
      error: {
        error: 'AI Gateway not configured',
        status: 500,
        details: 'Set VERCEL_AI_GATEWAY_KEY (vai_...) or AI_GATEWAY_API_KEY environment variable',
      },
    };
  }

  try {
    // Create gateway instance
    const gateway = createGateway({ apiKey: gatewayKey });

    // Build prompt from messages
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const systemPrompt = systemMessages.length > 0
      ? systemMessages.map(m => typeof m.content === 'string' ? m.content : '').join('\n')
      : undefined;

    // Use generateText for non-streaming
    const result = await generateText({
      model: gateway(request.model),
      system: systemPrompt,
      messages: otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      maxOutputTokens: request.max_tokens || 1024,
      temperature: request.temperature,
    });

    // Build response in OpenAI-compatible format
    // Note: AI SDK returns usage with different property names depending on version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usage = result.usage as any;
    const promptTokens = usage?.promptTokens ?? usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completionTokens ?? usage?.completion_tokens ?? 0;

    const response: GatewayResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      text: result.text,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    };

    return { success: true, data: response };
  } catch (err) {
    console.error('Gateway error:', err);

    const errorMessage = err instanceof Error ? err.message : String(err);
    let status = 500;

    // Parse common error types
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      status = 401;
    } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      status = 404;
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      status = 429;
    }

    return {
      success: false,
      error: {
        error: 'AI Gateway request failed',
        status,
        details: errorMessage,
      },
    };
  }
}

/**
 * Send a streaming chat completion request using Vercel AI SDK Gateway
 */
export async function callGatewayStream(
  request: GatewayRequest
): Promise<{ success: true; stream: ReadableStream<Uint8Array> } | { success: false; error: GatewayError }> {
  const gatewayKey = getGatewayKey();

  if (!gatewayKey) {
    return {
      success: false,
      error: {
        error: 'AI Gateway not configured',
        status: 500,
        details: 'Set VERCEL_AI_GATEWAY_KEY (vai_...) or AI_GATEWAY_API_KEY environment variable',
      },
    };
  }

  try {
    // Create gateway instance
    const gateway = createGateway({ apiKey: gatewayKey });

    // Build prompt from messages
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const systemPrompt = systemMessages.length > 0
      ? systemMessages.map(m => typeof m.content === 'string' ? m.content : '').join('\n')
      : undefined;

    // Use streamText for streaming
    const result = streamText({
      model: gateway(request.model),
      system: systemPrompt,
      messages: otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      maxOutputTokens: request.max_tokens || 1024,
      temperature: request.temperature,
    });

    // Convert the async iterator to a ReadableStream
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return {
      success: true,
      stream,
    };
  } catch (err) {
    console.error('Gateway stream error:', err);

    const errorMessage = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      error: {
        error: 'AI Gateway streaming failed',
        status: 500,
        details: errorMessage,
      },
    };
  }
}

/**
 * Parse provider from model ID
 */
export function parseProvider(model: string): string {
  return model.split('/')[0] || 'unknown';
}
