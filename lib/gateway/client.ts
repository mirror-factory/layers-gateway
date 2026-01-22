import { createGateway, generateText, streamText, Output, jsonSchema } from 'ai';
import { z } from 'zod';

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
 * Convert OpenAI-style content parts to AI SDK format
 */
function convertContentParts(content: string | ContentPart[]): string | Array<{ type: string; text?: string; image?: unknown }> {
  if (typeof content === 'string') {
    return content;
  }

  return content.map(part => {
    if (part.type === 'text') {
      return { type: 'text', text: (part as TextContentPart).text };
    }
    if (part.type === 'image_url') {
      const imgPart = part as ImageContentPart;
      const url = imgPart.image_url?.url || '';
      // Handle data URLs (base64)
      if (url.startsWith('data:')) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          return {
            type: 'image',
            image: Buffer.from(matches[2], 'base64'),
            mimeType: matches[1],
          };
        }
      }
      // Handle regular URLs
      return { type: 'image', image: new URL(url) };
    }
    if (part.type === 'image') {
      const imgPart = part as ImageContentPart;
      return { type: 'image', image: imgPart.image };
    }
    // Pass through unknown types
    return part;
  });
}

/**
 * Convert OpenAI-style tools to AI SDK format
 * AI SDK uses `inputSchema` (not `parameters`) and requires additionalProperties: false
 */
function convertTools(tools: ToolDefinition[]): Record<string, { description?: string; inputSchema: unknown }> {
  const sdkTools: Record<string, { description?: string; inputSchema: unknown }> = {};

  for (const tool of tools) {
    if (tool.type === 'function' && tool.function) {
      // Ensure the parameters have the required structure for AI SDK
      const params = tool.function.parameters || {};
      const schema = {
        type: 'object',
        properties: params.properties || {},
        required: params.required || [],
        additionalProperties: false, // Required by AI SDK
      };

      sdkTools[tool.function.name] = {
        description: tool.function.description,
        inputSchema: jsonSchema(schema),
      };
    }
  }

  return sdkTools;
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

    // Convert messages to AI SDK format, properly handling multimodal content
    const convertedMessages = otherMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'tool',
      content: convertContentParts(m.content),
      ...(m.tool_call_id && { toolCallId: m.tool_call_id }),
    }));

    // Build generateText options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generateOptions: any = {
      model: gateway(request.model),
      system: systemPrompt,
      messages: convertedMessages,
      maxOutputTokens: request.max_tokens || 1024,
      temperature: request.temperature,
    };

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      generateOptions.tools = convertTools(request.tools);

      // Convert tool_choice
      if (request.tool_choice) {
        if (typeof request.tool_choice === 'string') {
          generateOptions.toolChoice = request.tool_choice;
        } else if (request.tool_choice.type === 'function') {
          generateOptions.toolChoice = {
            type: 'tool',
            toolName: request.tool_choice.function.name,
          };
        }
      }
    }

    // Add JSON mode if requested
    if (request.response_format?.type === 'json_object') {
      // Use Output.object with a permissive schema for JSON mode
      generateOptions.output = Output.object({
        schema: z.record(z.string(), z.unknown()),
      });
    }

    // Add provider-specific options
    const providerOptions: Record<string, unknown> = {};
    if (request.anthropic) {
      providerOptions.anthropic = request.anthropic;
    }
    if (request.openai) {
      providerOptions.openai = request.openai;
    }
    if (request.google) {
      providerOptions.google = request.google;
    }
    if (Object.keys(providerOptions).length > 0) {
      generateOptions.providerOptions = providerOptions;
    }

    // Use generateText for non-streaming
    const result = await generateText(generateOptions);

    // Build response in OpenAI-compatible format
    // Debug: Log the full result structure to understand token extraction
    console.log('[Gateway] Full result keys:', Object.keys(result));
    console.log('[Gateway] result.usage:', JSON.stringify(result.usage, null, 2));

    // The AI SDK returns usage with camelCase properties
    // Cast to any to access properties that may not be in the type definition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usageData = result.usage as any;
    const promptTokens = usageData?.promptTokens ?? usageData?.prompt_tokens ?? 0;
    const completionTokens = usageData?.completionTokens ?? usageData?.completion_tokens ?? 0;

    console.log('[Gateway] Extracted tokens - prompt:', promptTokens, 'completion:', completionTokens);

    // Extract tool calls if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolCalls = result.toolCalls?.map((tc: any, i: number) => ({
      id: `call_${Date.now()}_${i}`,
      type: 'function' as const,
      function: {
        name: tc.toolName,
        arguments: JSON.stringify(tc.args || {}),
      },
    }));

    // Handle JSON mode response
    let responseText = result.text;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (request.response_format?.type === 'json_object' && (result as any).output) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseText = JSON.stringify((result as any).output);
    }

    const response: GatewayResponse = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      text: responseText,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
      ...(toolCalls && toolCalls.length > 0 && { tool_calls: toolCalls }),
      ...(result.reasoning && { reasoning: result.reasoning }),
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
 * Returns SSE-formatted stream compatible with OpenAI streaming format
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

    // Convert messages to AI SDK format, properly handling multimodal content
    const convertedMessages = otherMessages.map(m => ({
      role: m.role as 'user' | 'assistant' | 'tool',
      content: convertContentParts(m.content),
      ...(m.tool_call_id && { toolCallId: m.tool_call_id }),
    }));

    // Build streamText options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streamOptions: any = {
      model: gateway(request.model),
      system: systemPrompt,
      messages: convertedMessages,
      maxOutputTokens: request.max_tokens || 1024,
      temperature: request.temperature,
    };

    // Add tools if provided
    if (request.tools && request.tools.length > 0) {
      streamOptions.tools = convertTools(request.tools);

      if (request.tool_choice) {
        if (typeof request.tool_choice === 'string') {
          streamOptions.toolChoice = request.tool_choice;
        } else if (request.tool_choice.type === 'function') {
          streamOptions.toolChoice = {
            type: 'tool',
            toolName: request.tool_choice.function.name,
          };
        }
      }
    }

    // Add provider-specific options
    const providerOptions: Record<string, unknown> = {};
    if (request.anthropic) providerOptions.anthropic = request.anthropic;
    if (request.openai) providerOptions.openai = request.openai;
    if (request.google) providerOptions.google = request.google;
    if (Object.keys(providerOptions).length > 0) {
      streamOptions.providerOptions = providerOptions;
    }

    // Use streamText for streaming
    const result = streamText(streamOptions);

    // Convert to SSE format compatible with OpenAI streaming
    const responseId = `chatcmpl-${Date.now()}`;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.textStream) {
            // Format as SSE event in OpenAI format
            const sseData = {
              id: responseId,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [{
                index: 0,
                delta: { content: chunk },
                finish_reason: null,
              }],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
          }
          // Send final chunk with finish_reason
          const finalData = {
            id: responseId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: request.model,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop',
            }],
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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
