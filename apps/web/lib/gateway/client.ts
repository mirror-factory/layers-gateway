// Vercel AI Gateway endpoint
const GATEWAY_URL = 'https://gateway.vercel.ai/v1/chat/completions';

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
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
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
 * Send a chat completion request to Vercel AI Gateway
 */
export async function callGateway(
  request: GatewayRequest
): Promise<{ success: true; data: GatewayResponse } | { success: false; error: GatewayError }> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (!gatewayKey) {
    return {
      success: false,
      error: {
        error: 'AI Gateway not configured',
        status: 500,
        details: 'AI_GATEWAY_API_KEY environment variable is missing',
      },
    };
  }

  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    max_tokens: request.max_tokens || 1024,
  };

  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway error:', response.status, errorText);

      return {
        success: false,
        error: {
          error: `Provider error: ${response.status}`,
          status: response.status,
          details: errorText,
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data as GatewayResponse,
    };
  } catch (err) {
    console.error('Gateway fetch error:', err);
    return {
      success: false,
      error: {
        error: 'Failed to reach AI provider',
        status: 502,
        details: String(err),
      },
    };
  }
}

/**
 * Send a streaming chat completion request to Vercel AI Gateway
 */
export async function callGatewayStream(
  request: GatewayRequest
): Promise<{ success: true; stream: ReadableStream } | { success: false; error: GatewayError }> {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;

  if (!gatewayKey) {
    return {
      success: false,
      error: {
        error: 'AI Gateway not configured',
        status: 500,
        details: 'AI_GATEWAY_API_KEY environment variable is missing',
      },
    };
  }

  const body: Record<string, unknown> = {
    model: request.model,
    messages: request.messages,
    max_tokens: request.max_tokens || 1024,
    stream: true,
  };

  if (request.temperature !== undefined) {
    body.temperature = request.temperature;
  }

  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gatewayKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway stream error:', response.status, errorText);

      return {
        success: false,
        error: {
          error: `Provider error: ${response.status}`,
          status: response.status,
          details: errorText,
        },
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: {
          error: 'No response body',
          status: 500,
        },
      };
    }

    return {
      success: true,
      stream: response.body,
    };
  } catch (err) {
    console.error('Gateway stream fetch error:', err);
    return {
      success: false,
      error: {
        error: 'Failed to reach AI provider',
        status: 502,
        details: String(err),
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
