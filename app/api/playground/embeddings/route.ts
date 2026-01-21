import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmbeddingRequest = await request.json();

    // Get API key from env
    const apiKey = process.env.LAYERS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: 'API key not configured', code: 'api_key_missing' } },
        { status: 500 }
      );
    }

    // Use internal API or env var
    const apiUrl = process.env.LAYERS_API_URL || '';

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: body.model,
      input: body.input,
    };

    if (body.encoding_format) {
      requestBody.encoding_format = body.encoding_format;
    }

    if (body.dimensions) {
      requestBody.dimensions = body.dimensions;
    }

    // Make request to Layers API
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/embeddings` : `${request.nextUrl.origin}/api/v1/embeddings`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: { message: 'Unknown error', code: 'unknown' }
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'internal_error' } },
      { status: 500 }
    );
  }
}
