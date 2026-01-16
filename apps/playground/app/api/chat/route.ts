import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Types for the request/response

// Image content for vision models
interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

// Text content
interface TextContent {
  type: 'text';
  text: string;
}

// Message content can be string or array of content parts (for vision)
type MessageContent = string | (TextContent | ImageContent)[];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

// Tool/Function definition
interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: Record<string, unknown>;
  };
}

// Response format for JSON/structured output
interface ResponseFormat {
  type: 'text' | 'json_object' | 'json_schema';
  json_schema?: {
    name: string;
    schema: Record<string, unknown>;
    strict?: boolean;
  };
}

// Extended thinking configuration
interface ThinkingConfig {
  type: 'enabled';
  budget_tokens: number;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  // Tools / Function calling
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  // Structured output
  response_format?: ResponseFormat;
  // Extended thinking
  thinking?: ThinkingConfig;
  // Web search
  web_search?: boolean;
  search_domains?: string[];
  // Prompt caching
  cache?: boolean;
}

/**
 * POST /api/chat
 *
 * Proxies chat requests to the Layers API with full middleware stack:
 * - Authentication (API key validation)
 * - Rate limiting (tier-based)
 * - Credit checking and deduction
 * - Gateway routing to AI providers
 *
 * Environment Variables:
 * - LAYERS_API_URL: Base URL for Layers API (e.g., https://api.layers.dev)
 * - LAYERS_API_KEY: API key for authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.model) {
      return NextResponse.json(
        { error: { message: 'model is required', code: 'missing_model' } },
        { status: 400 }
      );
    }

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: { message: 'messages array is required', code: 'missing_messages' } },
        { status: 400 }
      );
    }

    const apiUrl = process.env.LAYERS_API_URL || 'http://localhost:3006';
    const apiKey = process.env.LAYERS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: { message: 'Server configuration error: API key not set', code: 'server_error' } },
        { status: 500 }
      );
    }

    // Build the request body with all capability settings
    const requestBody: Record<string, unknown> = {
      model: body.model,
      messages: body.messages,
      max_tokens: body.max_tokens ?? 4096,
      temperature: body.temperature ?? 0.7,
      stream: body.stream ?? true,
    };

    // Add tools/function calling if provided
    if (body.tools && body.tools.length > 0) {
      requestBody.tools = body.tools;
      if (body.tool_choice) {
        requestBody.tool_choice = body.tool_choice;
      }
    }

    // Add response format for JSON/structured output
    if (body.response_format) {
      requestBody.response_format = body.response_format;
    }

    // Add extended thinking configuration
    if (body.thinking) {
      requestBody.thinking = body.thinking;
    }

    // Add web search settings
    if (body.web_search) {
      requestBody.web_search = body.web_search;
      if (body.search_domains && body.search_domains.length > 0) {
        requestBody.search_domains = body.search_domains;
      }
    }

    // Add prompt caching
    if (body.cache) {
      requestBody.cache = body.cache;
    }

    // Forward request to Layers API
    const response = await fetch(`${apiUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Extract rate limit headers from response
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');

    // Handle non-streaming response
    if (!body.stream) {
      const data = await response.json();

      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'X-RateLimit-Remaining': rateLimitRemaining || '',
          'X-RateLimit-Limit': rateLimitLimit || '',
          'X-RateLimit-Reset': rateLimitReset || '',
        },
      });
    }

    // Handle streaming response
    if (!response.body) {
      return NextResponse.json(
        { error: { message: 'No response body from API', code: 'no_response_body' } },
        { status: 502 }
      );
    }

    // Create a TransformStream to pass through the response
    const { readable, writable } = new TransformStream();

    // Pipe the response body to our writable stream
    response.body.pipeTo(writable).catch((error) => {
      console.error('Stream error:', error);
    });

    return new Response(readable, {
      status: response.status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-RateLimit-Remaining': rateLimitRemaining || '',
        'X-RateLimit-Limit': rateLimitLimit || '',
        'X-RateLimit-Reset': rateLimitReset || '',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
          code: 'internal_error'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 *
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Layers Playground Chat API',
    methods: ['POST'],
    version: '1.0.0',
  });
}
