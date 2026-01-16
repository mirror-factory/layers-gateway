import { NextRequest, NextResponse } from 'next/server';
import { generateText, createGateway } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, messages, maxTokens = 1024, systemPrompt } = body;

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

    // Generate text using AI SDK
    const result = await generateText({
      model: gateway(model),
      system: systemPrompt,
      messages: sdkMessages,
      maxOutputTokens: maxTokens,
    });

    // Extract usage (AI SDK may use different property names)
    const usage = result.usage as {
      promptTokens?: number;
      completionTokens?: number;
      prompt_tokens?: number;
      completion_tokens?: number;
    };
    const inputTokens = usage?.promptTokens ?? usage?.prompt_tokens ?? 0;
    const outputTokens = usage?.completionTokens ?? usage?.completion_tokens ?? 0;

    return NextResponse.json({
      text: result.text,
      model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
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
