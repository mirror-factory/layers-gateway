/**
 * Layers API Client
 *
 * A client library for interacting with the Layers API.
 * Handles both streaming and non-streaming chat completions.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LayersMetadata {
  credits_used: number;
  latency_ms: number;
  model: string;
  provider: string;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
  layers?: LayersMetadata;
}

export interface StreamDelta {
  role?: 'assistant';
  content?: string;
}

export interface StreamChoice {
  index: number;
  delta: StreamDelta;
  finish_reason: string | null;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
  usage?: ChatUsage;
  layers?: LayersMetadata;
}

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  reset: number | null;
}

export interface ChatStreamResult {
  stream: AsyncIterable<StreamChunk>;
  rateLimitInfo: RateLimitInfo;
}

export interface ApiError {
  message: string;
  code: string;
}

/**
 * Parse Server-Sent Events stream
 */
async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncIterable<StreamChunk> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');

    // Keep the last incomplete line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith(':')) continue;

      // Handle data lines
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);

        // Skip [DONE] marker
        if (data === '[DONE]') continue;

        try {
          const chunk = JSON.parse(data) as StreamChunk;
          yield chunk;
        } catch (e) {
          console.warn('Failed to parse SSE chunk:', data);
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim() && buffer.trim().startsWith('data: ')) {
    const data = buffer.trim().slice(6);
    if (data !== '[DONE]') {
      try {
        const chunk = JSON.parse(data) as StreamChunk;
        yield chunk;
      } catch (e) {
        console.warn('Failed to parse final SSE chunk:', data);
      }
    }
  }
}

/**
 * Send a chat request to the Layers API
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: 'Unknown error', code: 'unknown' }
    }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return response.json();
}

/**
 * Send a streaming chat request to the Layers API
 */
export async function chatStream(request: ChatRequest): Promise<ChatStreamResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: 'Unknown error', code: 'unknown' }
    }));
    throw new Error(error.error?.message || 'Request failed');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const rateLimitInfo: RateLimitInfo = {
    remaining: response.headers.get('X-RateLimit-Remaining')
      ? parseInt(response.headers.get('X-RateLimit-Remaining')!)
      : null,
    limit: response.headers.get('X-RateLimit-Limit')
      ? parseInt(response.headers.get('X-RateLimit-Limit')!)
      : null,
    reset: response.headers.get('X-RateLimit-Reset')
      ? parseInt(response.headers.get('X-RateLimit-Reset')!)
      : null,
  };

  const reader = response.body.getReader();
  const stream = parseSSEStream(reader);

  return { stream, rateLimitInfo };
}

/**
 * Estimate token count for a string (rough approximation)
 * Actual token count depends on the model's tokenizer
 */
export function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Calculate estimated cost for a request
 * Uses @layers/models pricing data
 */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  pricing: { input: number; output: number }
): number {
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}
