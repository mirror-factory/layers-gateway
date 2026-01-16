import { NextRequest } from 'next/server';
import { streamText, createGateway } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, messages, systemPrompt, maxTokens = 1024 } = body;

    // Validate required fields
    if (!model) {
      return new Response(JSON.stringify({ error: 'Model is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!prompt && !messages) {
      return new Response(JSON.stringify({ error: 'Either prompt or messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create gateway instance (SDK handles the correct URL internally)
    const gateway = createGateway({ apiKey });

    // Build messages for AI SDK format
    const sdkMessages = messages
      ? messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))
      : prompt
        ? [{ role: 'user' as const, content: prompt }]
        : [];

    // Stream text using AI SDK
    const result = streamText({
      model: gateway(model),
      system: systemPrompt,
      messages: sdkMessages,
      maxOutputTokens: maxTokens,
    });

    // Convert the async iterator to a ReadableStream of plain text
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          console.error('Stream processing error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Playground stream API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
