/**
 * Layers API Comprehensive Integration Tests
 *
 * Single source of truth - tests EVERY model with ALL its capabilities.
 * Approximately 123 tests covering the full model × capability matrix.
 *
 * FILTERING OPTIONS:
 *   bun test layers-api                              # Full suite (~123 tests)
 *   FILTER_PROVIDER=anthropic bun test layers-api    # Anthropic only (20 tests)
 *   FILTER_PROVIDER=openai bun test layers-api       # OpenAI only (37 tests)
 *   FILTER_PROVIDER=google bun test layers-api       # Google only (28 tests)
 *   FILTER_PROVIDER=perplexity bun test layers-api   # Perplexity only (8 tests)
 *   FILTER_PROVIDER=morph bun test layers-api        # Morph only (4 tests)
 *   FILTER_CAPABILITY=vision bun test layers-api     # Vision tests only
 *   FILTER_CAPABILITY=thinking bun test layers-api   # Thinking tests only
 *   FILTER_CAPABILITY=tools bun test layers-api      # Tools tests only
 *
 * Required environment variables:
 *   LAYERS_API_URL=http://localhost:3006 (or production URL)
 *   LAYERS_API_KEY=lyr_live_xxxxx (your Layers API key)
 *
 * For Local Development Testing (Demo Mode):
 *   cd apps/web && npm run dev
 *   Then: LAYERS_API_URL=http://localhost:3006 LAYERS_API_KEY=lyr_live_test bun test layers-api
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MODEL_REGISTRY, MODEL_IDS, type ModelId } from '@/lib/models/registry';

// =============================================================================
// CONFIGURATION
// =============================================================================

const apiUrl = process.env.LAYERS_API_URL;
const apiKey = process.env.LAYERS_API_KEY;
const chatEndpoint = apiUrl ? `${apiUrl}/api/v1/chat` : '';
const imageEndpoint = apiUrl ? `${apiUrl}/api/v1/image` : '';

// Filtering
const filterProvider = process.env.FILTER_PROVIDER?.toLowerCase();
const filterCapability = process.env.FILTER_CAPABILITY?.toLowerCase();

// Test mode secret - bypasses rate limits
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET || 'layers-integration-test-2026';

// Test image (50x50 solid red square PNG, base64)
const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAQ0lEQVR42u3PMREAAAgAoe9fWjO4egwEoKn5IBERERERERERERERERERERERERERERERERERERERERERERERERGRiwWwM3WWecUcsQAAAABJRU5ErkJggg==';

// Skip all tests if not configured
const describeWithApi = apiUrl && apiKey ? describe : describe.skip;

// =============================================================================
// FILTERING HELPERS
// =============================================================================

/**
 * Check if we should skip this provider based on filter
 */
function skipProvider(provider: string): boolean {
  return !!filterProvider && filterProvider !== provider;
}

/**
 * Check if we should skip this capability based on filter
 */
function skipCapability(capability: string): boolean {
  return !!filterCapability && filterCapability !== capability;
}

/**
 * Get models for a provider (from registry)
 */
function getModelsForProvider(provider: string): ModelId[] {
  return MODEL_IDS.filter((id) => MODEL_REGISTRY[id].provider === provider);
}

/**
 * Check if a model has a specific capability
 */
function modelHasCapability(modelId: ModelId, capability: string): boolean {
  return MODEL_REGISTRY[modelId].capabilities.includes(capability as any);
}

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Helper to make API calls to Layers Chat API
 */
async function layersChat(
  body: Record<string, unknown>,
  options: { key?: string | null; skipTestHeader?: boolean } = {}
): Promise<{
  status: number;
  headers: Headers;
  data: any;
}> {
  const { key = apiKey, skipTestHeader = false } = options;

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipTestHeader) {
    fetchHeaders['X-Layers-Test-Mode'] = TEST_MODE_SECRET;
  }

  if (key) {
    fetchHeaders['Authorization'] = `Bearer ${key}`;
  }

  const response = await fetch(chatEndpoint, {
    method: 'POST',
    headers: fetchHeaders,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { status: response.status, headers: response.headers, data };
}

/**
 * Helper to make API calls to Layers Image API
 */
async function layersImage(
  body: Record<string, unknown>,
  options: { key?: string | null } = {}
): Promise<{
  status: number;
  headers: Headers;
  data: Record<string, unknown>;
}> {
  const { key = apiKey } = options;

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Layers-Test-Mode': TEST_MODE_SECRET,
  };

  if (key) {
    fetchHeaders['Authorization'] = `Bearer ${key}`;
  }

  const response = await fetch(imageEndpoint, {
    method: 'POST',
    headers: fetchHeaders,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { status: response.status, headers: response.headers, data };
}

// =============================================================================
// CAPABILITY TEST GENERATORS
// =============================================================================

/**
 * Generate a text capability test for a model
 */
function testText(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [{ role: 'user', content: 'What is 2+2? Answer with just the number.' }],
      max_tokens: 10,
    });

    expect(status).toBe(200);
    expect(data.choices?.[0]?.message?.content).toBeTruthy();
  };
}

/**
 * Generate a vision capability test for a model
 */
function testVision(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this image? Answer with just the color name.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${TEST_IMAGE_BASE64}` },
            },
          ],
        },
      ],
      max_tokens: 20,
    });

    expect(status).toBe(200);
    const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
    expect(content).toContain('red');
  };
}

/**
 * Generate a tools capability test for a model
 */
function testTools(modelId: ModelId) {
  return async () => {
    const calculatorTool = {
      type: 'function',
      function: {
        name: 'calculator',
        description: 'Add two numbers',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
        },
      },
    };

    const { status, data } = await layersChat({
      model: modelId,
      messages: [{ role: 'user', content: 'What is 15 + 27? Use the calculator tool.' }],
      max_tokens: 200,
      tools: [calculatorTool],
      tool_choice: 'auto',
    });

    expect(status).toBe(200);
    const hasToolCalls = data.choices?.[0]?.message?.tool_calls?.length > 0;
    const responseText = data.choices?.[0]?.message?.content || '';
    // Either tool is called OR model answers with 42
    expect(hasToolCalls || responseText.includes('42')).toBe(true);
  };
}

/**
 * Generate a JSON mode capability test for a model
 */
function testJson(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: 'Generate a person with name, age, city. Return ONLY valid JSON.',
        },
      ],
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    expect(status).toBe(200);
    const content = data.choices?.[0]?.message?.content || '';

    let isValidJson = false;
    try {
      JSON.parse(content);
      isValidJson = true;
    } catch {
      isValidJson = false;
    }

    expect(isValidJson).toBe(true);
  };
}

/**
 * Generate a streaming capability test for a model
 */
function testStream(modelId: ModelId) {
  return async () => {
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Layers-Test-Mode': TEST_MODE_SECRET,
    };

    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
        max_tokens: 20,
        stream: true,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const text = await response.text();
    expect(text).toContain('data: ');
    expect(text).toContain('[DONE]');
  };
}

/**
 * Generate a cache capability test for a model
 */
function testCache(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
      cache: true,
    });

    expect(status).toBe(200);
    expect(data.choices?.[0]?.message?.content).toBeTruthy();
  };
}

/**
 * Generate a thinking capability test for a model
 */
function testThinking(modelId: ModelId) {
  return async () => {
    const provider = MODEL_REGISTRY[modelId].provider;

    const body: Record<string, unknown> = {
      model: modelId,
      messages: [{ role: 'user', content: 'Think step by step: What is 15 + 27?' }],
      max_tokens: 500,
    };

    // Add provider-specific thinking options for Anthropic
    if (provider === 'anthropic') {
      body.thinking = { type: 'enabled', budget_tokens: 500 };
    }

    const { status, data } = await layersChat(body);

    expect(status).toBe(200);
    const content = data.choices?.[0]?.message?.content || '';
    // Should contain the answer or show reasoning
    expect(content.includes('42') || content.toLowerCase().includes('step')).toBe(true);
  };
}

/**
 * Generate a web search capability test for a model
 */
function testWeb(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [
        { role: 'user', content: 'What is the current weather in San Francisco? Be brief.' },
      ],
      max_tokens: 200,
    });

    expect(status).toBe(200);
    const content = data.choices?.[0]?.message?.content || '';
    // Should return something substantive from web search
    expect(content.length).toBeGreaterThan(10);
  };
}

/**
 * Generate an image-gen capability test for a model (via chat multimodal)
 */
function testImageGen(modelId: ModelId) {
  return async () => {
    const { status, data } = await layersChat({
      model: modelId,
      messages: [{ role: 'user', content: 'Generate a simple red circle on white background.' }],
      max_tokens: 100,
    });

    expect(status).toBe(200);
    // Multimodal models may return text, files, or both
    expect(data.choices?.[0]?.message?.content || (data as any).files?.length).toBeTruthy();
  };
}

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

describeWithApi('Layers API', () => {
  beforeAll(() => {
    console.log(`\nLayers API Comprehensive Integration Tests`);
    console.log(`URL: ${apiUrl}`);
    console.log(`Key: ${apiKey?.substring(0, 15)}...`);
    if (filterProvider) console.log(`Filter Provider: ${filterProvider}`);
    if (filterCapability) console.log(`Filter Capability: ${filterCapability}`);
    console.log('');
  });

  afterAll(() => {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUITE COMPLETE');
    console.log('='.repeat(60));
  });

  // ===========================================================================
  // INFRASTRUCTURE TESTS (14 tests)
  // ===========================================================================

  describe('Infrastructure', () => {
    describe('Health Check', () => {
      it('should return health status on GET', async () => {
        const response = await fetch(chatEndpoint, { method: 'GET' });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.version).toMatch(/^v\d/);
      }, 10000);
    });

    describe('Authentication', () => {
      it('should accept valid API key (200)', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Say "test"' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.choices).toBeDefined();
      }, 30000);

      it('should reject missing API key (401)', async () => {
        const { status, data } = await layersChat(
          { model: 'anthropic/claude-haiku-4.5', messages: [{ role: 'user', content: 'Hi' }] },
          { key: null }
        );

        expect(status).toBe(401);
        expect(data.error).toContain('Authorization');
      }, 10000);

      it('should reject invalid API key format (401)', async () => {
        const { status, data } = await layersChat(
          { model: 'anthropic/claude-haiku-4.5', messages: [{ role: 'user', content: 'Hi' }] },
          { key: 'invalid_key_format' }
        );

        expect(status).toBe(401);
        expect(data.error).toContain('lyr_live_');
      }, 10000);

      it('should reject non-existent API key (401 or 200 in demo)', async () => {
        const { status, data } = await layersChat(
          { model: 'anthropic/claude-haiku-4.5', messages: [{ role: 'user', content: 'Hi' }] },
          { key: 'lyr_live_this_key_does_not_exist_12345' }
        );

        // In demo mode returns 200, in production returns 401
        expect([200, 401]).toContain(status);
      }, 10000);
    });

    describe('Request Validation', () => {
      it('should reject missing model (400)', async () => {
        const { status, data } = await layersChat({
          messages: [{ role: 'user', content: 'Hello' }],
        });

        expect(status).toBe(400);
        expect(data.error).toContain('Model is required');
      }, 10000);

      it('should reject missing messages (400)', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
        });

        expect(status).toBe(400);
        expect(data.error).toContain('Messages');
      }, 10000);

      it('should reject empty messages array (400)', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [],
        });

        expect(status).toBe(400);
        expect(data.error).toContain('empty');
      }, 10000);
    });

    describe('Rate Limits', () => {
      it('should return X-RateLimit-Limit header', async () => {
        const { status, headers } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(headers.get('X-RateLimit-Limit')).toBeTruthy();
      }, 30000);

      it('should return X-RateLimit-Remaining header', async () => {
        const { status, headers } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(headers.get('X-RateLimit-Remaining')).toBeTruthy();
      }, 30000);

      it('should return X-RateLimit-Reset header', async () => {
        const { status, headers } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(headers.get('X-RateLimit-Reset')).toBeTruthy();
      }, 30000);
    });

    describe('Credits & Usage', () => {
      it('should return credits_used in response', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.layers).toBeDefined();
        expect(typeof data.layers.credits_used).toBe('number');
      }, 30000);

      it('should return latency_ms in response', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(typeof data.layers.latency_ms).toBe('number');
        expect(data.layers.latency_ms).toBeGreaterThan(0);
      }, 30000);

      it('should return token counts in usage', async () => {
        const { status, data } = await layersChat({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 20,
        });

        expect(status).toBe(200);
        expect(typeof data.usage.prompt_tokens).toBe('number');
        expect(typeof data.usage.completion_tokens).toBe('number');
        expect(typeof data.usage.total_tokens).toBe('number');
      }, 30000);
    });
  });

  // ===========================================================================
  // PROVIDER: ANTHROPIC (20 tests)
  // ===========================================================================

  describe.skipIf(skipProvider('anthropic'))('Provider: Anthropic', () => {
    // claude-haiku-4.5: text, vision, tools, json, stream, cache (6 tests)
    describe('claude-haiku-4.5', () => {
      const modelId = 'anthropic/claude-haiku-4.5' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('cache'))('cache: uses prompt caching', testCache(modelId), 30000);
    });

    // claude-sonnet-4.5: text, vision, tools, json, stream, cache, thinking (7 tests)
    describe('claude-sonnet-4.5', () => {
      const modelId = 'anthropic/claude-sonnet-4.5' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('cache'))('cache: uses prompt caching', testCache(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: uses extended reasoning', testThinking(modelId), 60000);
    });

    // claude-opus-4.5: text, vision, tools, json, stream, cache, thinking (7 tests)
    describe('claude-opus-4.5', () => {
      const modelId = 'anthropic/claude-opus-4.5' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('cache'))('cache: uses prompt caching', testCache(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: uses extended reasoning', testThinking(modelId), 60000);
    });
  });

  // ===========================================================================
  // PROVIDER: OPENAI (37 tests)
  // ===========================================================================

  describe.skipIf(skipProvider('openai'))('Provider: OpenAI', () => {
    // gpt-4o: text, vision, tools, json, stream (5 tests)
    describe('gpt-4o', () => {
      const modelId = 'openai/gpt-4o' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-4o-mini: text, vision, tools, json, stream (5 tests)
    describe('gpt-4o-mini', () => {
      const modelId = 'openai/gpt-4o-mini' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5-chat: text, vision, tools, json, stream (5 tests)
    describe('gpt-5-chat', () => {
      const modelId = 'openai/gpt-5-chat' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5-codex: tools, json, stream (NO text/vision) (3 tests)
    describe('gpt-5-codex', () => {
      const modelId = 'openai/gpt-5-codex' as ModelId;

      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5.1-codex: tools, json, stream (3 tests)
    describe('gpt-5.1-codex', () => {
      const modelId = 'openai/gpt-5.1-codex' as ModelId;

      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5.1-codex-mini: tools, json, stream (3 tests)
    describe('gpt-5.1-codex-mini', () => {
      const modelId = 'openai/gpt-5.1-codex-mini' as ModelId;

      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5.1-instant: text, vision, tools, json, stream (5 tests)
    describe('gpt-5.1-instant', () => {
      const modelId = 'openai/gpt-5.1-instant' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // gpt-5.1-thinking: text, vision, tools, json, stream, thinking (6 tests)
    describe('gpt-5.1-thinking', () => {
      const modelId = 'openai/gpt-5.1-thinking' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: uses reasoning mode', testThinking(modelId), 60000);
    });
  });

  // ===========================================================================
  // PROVIDER: GOOGLE (28 tests)
  // ===========================================================================

  describe.skipIf(skipProvider('google'))('Provider: Google', () => {
    // gemini-2.5-flash: text, vision, tools, json (4 tests)
    describe('gemini-2.5-flash', () => {
      const modelId = 'google/gemini-2.5-flash' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
    });

    // gemini-2.5-flash-lite: text, vision, json (NO tools) (3 tests)
    describe('gemini-2.5-flash-lite', () => {
      const modelId = 'google/gemini-2.5-flash-lite' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
    });

    // gemini-2.5-flash-image: text, vision, tools, json, image-gen (5 tests)
    describe('gemini-2.5-flash-image', () => {
      const modelId = 'google/gemini-2.5-flash-image' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('image-gen'))('image-gen: generates image from text', testImageGen(modelId), 120000);
    });

    // gemini-2.5-pro: text, vision, tools, json, thinking (5 tests)
    describe('gemini-2.5-pro', () => {
      const modelId = 'google/gemini-2.5-pro' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: uses extended reasoning', testThinking(modelId), 60000);
    });

    // gemini-3-flash: vision, tools, json (NO text) (3 tests)
    describe('gemini-3-flash', () => {
      const modelId = 'google/gemini-3-flash' as ModelId;

      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
    });

    // gemini-3-pro-preview: text, tools, json, thinking (NO vision) (4 tests)
    describe('gemini-3-pro-preview', () => {
      const modelId = 'google/gemini-3-pro-preview' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: uses extended reasoning', testThinking(modelId), 60000);
    });

    // gemini-3-pro-image: text, vision, tools, json, image-gen (5 tests)
    describe('gemini-3-pro-image', () => {
      const modelId = 'google/gemini-3-pro-image' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('vision'))('vision: processes image input', testVision(modelId), 30000);
      it.skipIf(skipCapability('tools'))('tools: calls calculator function', testTools(modelId), 30000);
      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('image-gen'))('image-gen: generates image from text', testImageGen(modelId), 120000);
    });
  });

  // ===========================================================================
  // PROVIDER: PERPLEXITY (8 tests)
  // ===========================================================================

  describe.skipIf(skipProvider('perplexity'))('Provider: Perplexity', () => {
    // sonar: json, stream, web (3 tests)
    describe('sonar', () => {
      const modelId = 'perplexity/sonar' as ModelId;

      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('web'))('web: performs web search', testWeb(modelId), 30000);
    });

    // sonar-pro: json, stream, web (3 tests)
    describe('sonar-pro', () => {
      const modelId = 'perplexity/sonar-pro' as ModelId;

      it.skipIf(skipCapability('json'))('json: returns structured output', testJson(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
      it.skipIf(skipCapability('web'))('web: performs web search', testWeb(modelId), 30000);
    });

    // sonar-reasoning-pro: web, thinking (2 tests)
    describe('sonar-reasoning-pro', () => {
      const modelId = 'perplexity/sonar-reasoning-pro' as ModelId;

      it.skipIf(skipCapability('web'))('web: performs web search', testWeb(modelId), 30000);
      it.skipIf(skipCapability('thinking'))('thinking: reasons through query', testThinking(modelId), 60000);
    });
  });

  // ===========================================================================
  // PROVIDER: MORPH (4 tests)
  // ===========================================================================

  describe.skipIf(skipProvider('morph'))('Provider: Morph', () => {
    // morph-v3-fast: text, stream (2 tests)
    describe('morph-v3-fast', () => {
      const modelId = 'morph/morph-v3-fast' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });

    // morph-v3-large: text, stream (2 tests)
    describe('morph-v3-large', () => {
      const modelId = 'morph/morph-v3-large' as ModelId;

      it.skipIf(skipCapability('text'))('text: generates text response', testText(modelId), 30000);
      it.skipIf(skipCapability('stream'))('stream: streams SSE chunks', testStream(modelId), 30000);
    });
  });

  // ===========================================================================
  // IMAGE GENERATION API (12 tests)
  // ===========================================================================

  describe.skipIf(filterProvider && !['bfl', 'google'].includes(filterProvider))('Image Generation API', () => {
    describe('BFL Flux Models', () => {
      const fluxModels = [
        'bfl/flux-2-pro',
        'bfl/flux-2-flex',
        'bfl/flux-pro-1.1',
        'bfl/flux-pro-1.1-ultra',
        'bfl/flux-kontext-pro',
        'bfl/flux-kontext-max',
      ];

      for (const modelId of fluxModels) {
        it.skipIf(skipCapability('image'))(`${modelId}: generates image`, async () => {
          const { status, data } = await layersImage({
            model: modelId,
            prompt: 'A simple red circle on white background',
            aspect_ratio: '1:1',
          });

          expect(status).toBe(200);
          expect(data.data).toBeDefined();
          expect((data.data as any[]).length).toBeGreaterThan(0);
        }, 120000);
      }
    });

    describe('Google Imagen Models', () => {
      const imagenModels = [
        'google/imagen-4.0-fast-generate-001',
        'google/imagen-4.0-ultra-generate-001',
      ];

      for (const modelId of imagenModels) {
        it.skipIf(skipCapability('image'))(`${modelId}: generates image`, async () => {
          const { status, data } = await layersImage({
            model: modelId,
            prompt: 'A simple blue square on white background',
            aspect_ratio: '1:1',
          });

          expect(status).toBe(200);
          expect(data.data).toBeDefined();
          expect((data.data as any[]).length).toBeGreaterThan(0);
        }, 120000);
      }
    });

    describe('Image Features', () => {
      it.skipIf(skipCapability('image'))('supports custom aspect ratio (16:9)', async () => {
        const { status, data } = await layersImage({
          model: 'bfl/flux-pro-1.1',
          prompt: 'A horizontal landscape with mountains',
          aspect_ratio: '16:9',
        });

        expect(status).toBe(200);
        expect(data.data).toBeDefined();
      }, 120000);

      it.skipIf(skipCapability('image'))('supports multiple images (n=2)', async () => {
        const { status, data } = await layersImage({
          model: 'google/imagen-4.0-fast-generate-001',
          prompt: 'A simple green triangle',
          n: 2,
          aspect_ratio: '1:1',
        });

        expect(status).toBe(200);
        // May return 1 or 2 depending on model limits
        expect((data.data as any[]).length).toBeGreaterThanOrEqual(1);
      }, 120000);
    });
  });

  // ===========================================================================
  // RESPONSE FORMAT VERIFICATION
  // ===========================================================================

  describe('Response Format (OpenAI-compatible)', () => {
    it('should return OpenAI-compatible response structure', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);

      // OpenAI-compatible fields
      expect(data.id).toBeTruthy();
      expect(data.object).toBe('chat.completion');
      expect(typeof data.created).toBe('number');
      expect(data.model).toBeTruthy();
      expect(Array.isArray(data.choices)).toBe(true);
      expect(data.choices[0].index).toBe(0);
      expect(data.choices[0].message.role).toBe('assistant');
      expect(data.choices[0].message.content).toBeTruthy();
      expect(data.choices[0].finish_reason).toBe('stop');
      expect(data.usage).toBeDefined();

      // Layers-specific fields
      expect(data.layers).toBeDefined();
      expect(typeof data.layers.credits_used).toBe('number');
      expect(typeof data.layers.latency_ms).toBe('number');
    }, 30000);
  });
});
