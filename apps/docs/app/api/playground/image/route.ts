import { NextRequest, NextResponse } from 'next/server';
import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Aspect ratio to dimensions mapping
const ASPECT_RATIOS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1792, height: 1024 },
  '9:16': { width: 1024, height: 1792 },
  '4:3': { width: 1365, height: 1024 },
  '3:4': { width: 1024, height: 1365 },
  '21:9': { width: 2048, height: 878 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, aspectRatio = '1:1' } = body;

    // Validate required fields
    if (!model) {
      return NextResponse.json(
        { error: 'Model is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Get dimensions from aspect ratio
    const dimensions = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS['1:1'];

    // Create gateway provider
    const gateway = createOpenAI({
      baseURL: 'https://gateway.vercel.ai/v1',
      apiKey,
    });

    // Generate image using AI SDK
    const result = await generateImage({
      model: gateway.image(model),
      prompt,
      size: `${dimensions.width}x${dimensions.height}`,
    });

    // Return the generated image
    const image = result.image;

    return NextResponse.json({
      image: {
        base64: image.base64,
        mimeType: 'image/png',
      },
      model,
      dimensions,
    });
  } catch (error) {
    console.error('Image generation error:', error);

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: 'Image generation failed', details: errorMessage },
      { status: 500 }
    );
  }
}
