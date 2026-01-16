import { NextRequest } from 'next/server';

// Vercel AI Gateway endpoint
const GATEWAY_URL = 'https://gateway.vercel.ai/v1/chat/completions';

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

    // Build messages array with optional system prompt
    const chatMessages: Array<{ role: string; content: string }> = [];

    if (messages) {
      chatMessages.push(...messages);
    } else {
      if (systemPrompt) {
        chatMessages.push({ role: 'system', content: systemPrompt });
      }
      chatMessages.push({ role: 'user', content: prompt });
    }

    // Make streaming request to Vercel AI Gateway
    const response = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Gateway error: ${response.status}`, details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
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
