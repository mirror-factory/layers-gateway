import { NextRequest, NextResponse } from 'next/server';

// Vercel AI Gateway endpoint
const GATEWAY_URL = 'https://gateway.vercel.ai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, messages, maxTokens = 1024 } = body;

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    if (!prompt && !messages) {
      return NextResponse.json(
        { error: 'Either prompt or messages is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build messages array with optional system prompt
    const { systemPrompt } = body;
    const chatMessages = messages || [];

    // Add system message if provided
    if (systemPrompt && !messages) {
      chatMessages.push({ role: 'system', content: systemPrompt });
    }

    // Add user prompt if using simple prompt mode
    if (prompt && !messages) {
      chatMessages.push({ role: 'user', content: prompt });
    }

    // Make request to Vercel AI Gateway
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway error:', response.status, errorText);
      return NextResponse.json(
        { error: `Gateway error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the response text
    const text = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return NextResponse.json({
      text,
      model: data.model,
      usage: {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
    });
  } catch (error) {
    console.error('Playground API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
