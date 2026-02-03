// Content part types for multimodal messages
export interface TextContentPart {
  type: 'text';
  text: string;
}

export interface ImageContentPart {
  type: 'image_url' | 'image';
  image_url?: { url: string };
  image?: string; // base64 or URL
}

export type ContentPart = TextContentPart | ImageContentPart | { type: string; [key: string]: unknown };

export interface GatewayMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

// Tool definition (OpenAI format)
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: {
      type?: string;
      properties?: Record<string, unknown>;
      required?: string[];
      additionalProperties?: boolean;
      [key: string]: unknown;
    };
  };
}

export interface GatewayRequest {
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
  // Web search (for Perplexity models)
  web_search?: boolean;
  search_domains?: string[];
  // Prompt caching
  cache?: boolean;
  // Provider-specific options (for thinking, etc.)
  anthropic?: Record<string, unknown>;
  openai?: Record<string, unknown>;
  google?: Record<string, unknown>;
}

// Source/citation for Perplexity responses
export interface Source {
  type: 'source';
  sourceType: 'url';
  id: string;
  url: string;
  title?: string;
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
  // Tool calls in response
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  // Reasoning/thinking output
  reasoning?: unknown;
  // Perplexity sources/citations
  sources?: Source[];
  // Provider metadata (pass-through)
  provider_metadata?: Record<string, unknown>;
}

export interface GatewayError {
  error: string;
  status: number;
  details?: string;
}

/**
 * Get the Hustle AI SDK base URL
 */
function getHustleAIUrl(): string {
  return process.env.HUSTLE_AI_SDK_URL || 'https://ai.hustletogether.com';
}

/**
 * Get the Hustle AI SDK API key
 */
function getHustleAIKey(): string | null {
  return process.env.HUSTLE_AI_SDK_KEY || null;
}

/**
 * Check if Hustle AI SDK is configured
 */
export function isGatewayConfigured(): boolean {
  return !!getHustleAIKey();
}

/**
 * Send a chat completion request to Hustle AI SDK
 * @param request - Gateway request payload
 * @param path - API path to forward to (defaults to /api/v1/chat/completions)
 */
export async function callGateway(
  request: GatewayRequest,
  path: string = '/api/v1/chat/completions'
): Promise<{ success: true; data: GatewayResponse } | { success: false; error: GatewayError }> {
  const apiKey = getHustleAIKey();
  const baseUrl = getHustleAIUrl();

  if (!apiKey) {
    return {
      success: false,
      error: {
        error: 'Hustle AI SDK not configured',
        status: 500,
        details: 'Set HUSTLE_AI_SDK_KEY environment variable',
      },
    };
  }

  try {
    // Build request body - OpenAI-compatible
    const requestBody: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
    };

    // Add optional parameters
    if (request.max_tokens) requestBody.max_tokens = request.max_tokens;
    if (request.temperature !== undefined) requestBody.temperature = request.temperature;
    if (request.tools) requestBody.tools = request.tools;
    if (request.tool_choice) requestBody.tool_choice = request.tool_choice;
    if (request.response_format) requestBody.response_format = request.response_format;

    // Custom fields (pass-through)
    if (request.web_search) requestBody.web_search = request.web_search;
    if (request.search_domains) requestBody.search_domains = request.search_domains;
    if (request.cache) requestBody.cache = request.cache;
    if (request.anthropic) requestBody.anthropic = request.anthropic;
    if (request.openai) requestBody.openai = request.openai;
    if (request.google) requestBody.google = request.google;

    // HTTP POST to Hustle AI SDK (transparent path forwarding)
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          error: errorData.error?.message || 'Request failed',
          status: response.status,
          details: errorData.error?.type,
        },
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message || {};
    const usage = data.usage || {};

    return {
      success: true,
      data: {
        id: data.id,
        object: data.object,
        created: data.created,
        model: request.model,
        text: message.content || '',
        usage: {
          prompt_tokens: usage.prompt_tokens || 0,
          completion_tokens: usage.completion_tokens || 0,
          total_tokens: usage.total_tokens || 0,
        },
        ...(message.tool_calls && { tool_calls: message.tool_calls }),
        ...(data.reasoning && { reasoning: data.reasoning }),
        ...(data.sources && { sources: data.sources }),
        ...(data.experimental_providerMetadata && {
          provider_metadata: data.experimental_providerMetadata,
        }),
      },
    };
  } catch (err) {
    console.error('[Gateway] Error:', err);
    return {
      success: false,
      error: {
        error: 'Request failed',
        status: 500,
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

/**
 * Send a streaming chat completion request to Hustle AI SDK
 * Returns SSE-formatted stream compatible with OpenAI streaming format
 * @param request - Gateway request payload
 * @param path - API path to forward to (defaults to /api/v1/chat/completions)
 */
export async function callGatewayStream(
  request: GatewayRequest,
  path: string = '/api/v1/chat/completions'
): Promise<{ success: true; stream: ReadableStream<Uint8Array> } | { success: false; error: GatewayError }> {
  const apiKey = getHustleAIKey();
  const baseUrl = getHustleAIUrl();

  if (!apiKey) {
    return {
      success: false,
      error: {
        error: 'Hustle AI SDK not configured',
        status: 500,
        details: 'Set HUSTLE_AI_SDK_KEY environment variable',
      },
    };
  }

  try {
    const requestBody: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
      stream: true,
    };

    if (request.max_tokens) requestBody.max_tokens = request.max_tokens;
    if (request.temperature !== undefined) requestBody.temperature = request.temperature;
    if (request.tools) requestBody.tools = request.tools;
    if (request.tool_choice) requestBody.tool_choice = request.tool_choice;
    if (request.response_format) requestBody.response_format = request.response_format;

    // Custom fields (pass-through)
    if (request.web_search) requestBody.web_search = request.web_search;
    if (request.search_domains) requestBody.search_domains = request.search_domains;
    if (request.cache) requestBody.cache = request.cache;
    if (request.anthropic) requestBody.anthropic = request.anthropic;
    if (request.openai) requestBody.openai = request.openai;
    if (request.google) requestBody.google = request.google;

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          error: errorData.error?.message || 'Streaming failed',
          status: response.status,
        },
      };
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Return stream directly (SSE format)
    return {
      success: true,
      stream: response.body,
    };
  } catch (err) {
    console.error('[Gateway] Stream error:', err);
    return {
      success: false,
      error: {
        error: 'Streaming failed',
        status: 500,
        details: err instanceof Error ? err.message : String(err),
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
