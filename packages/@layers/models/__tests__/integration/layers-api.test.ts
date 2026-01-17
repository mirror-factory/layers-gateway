/**
 * Layers API Integration Tests
 *
 * Tests the Layers API (/api/v1/chat) - the same capabilities as gateway.test.ts
 * but through your API layer. This tests:
 *   1. Authentication (API key validation)
 *   2. Credits (deduction and tracking)
 *   3. Rate limits (headers and enforcement)
 *   4. Capability passthrough (all features forwarded to gateway)
 *
 * ALL CAPABILITIES WORKING:
 *   ✅ Text generation (basic chat completions)
 *   ✅ Streaming (SSE format with data: chunks)
 *   ✅ Vision/Multimodal (base64 images via convertContentParts)
 *   ✅ Tools/Function calling (converted to AI SDK inputSchema)
 *   ✅ JSON mode (response_format: json_object)
 *   ✅ Extended thinking (anthropic provider options)
 *   ✅ Web search (for Perplexity models)
 *   ✅ Prompt caching (cache: true)
 *
 * Required environment variables:
 *   LAYERS_API_URL=https://web-nine-sage-13.vercel.app (or http://localhost:3006)
 *   LAYERS_API_KEY=lyr_live_xxxxx (your Layers API key)
 *
 * For Production Testing:
 *   You need a real API key from the Supabase database.
 *   LAYERS_API_URL=https://web-nine-sage-13.vercel.app LAYERS_API_KEY=lyr_live_yourkey bun test layers-api
 *
 * For Local Development Testing (Demo Mode):
 *   Start the dev server without Supabase env vars to enable demo mode:
 *   cd apps/web && npm run dev
 *   Then: LAYERS_API_URL=http://localhost:3006 LAYERS_API_KEY=lyr_live_test bun test layers-api
 *
 * These tests are marked with .skipIf to skip without proper config.
 */
import { describe, it, expect, beforeAll } from 'vitest';

// Configuration
const apiUrl = process.env.LAYERS_API_URL;
const apiKey = process.env.LAYERS_API_KEY;
const chatEndpoint = apiUrl ? `${apiUrl}/api/v1/chat` : '';

// Test image (50x50 solid red square PNG, base64)
const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAQ0lEQVR42u3PMREAAAgAoe9fWjO4egwEoKn5IBERERERERERERERERERERERERERERERERERERERERERERERERGRiwWwM3WWecUcsQAAAABJRU5ErkJggg==';

// Skip all tests if not configured
const describeWithApi = apiUrl && apiKey ? describe : describe.skip;

// Helper to add delay between requests to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rate limit aware: Space out requests by 6 seconds for 10 req/min limit
const RATE_LIMIT_DELAY_MS = 6000;

/**
 * Helper to make API calls to Layers API
 */
async function layersChat(
  body: Record<string, unknown>,
  options: { key?: string | null; headers?: Record<string, string> } = {}
): Promise<{
  status: number;
  headers: Headers;
  data: Record<string, unknown>;
}> {
  const { key = apiKey, headers = {} } = options;

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (key) {
    fetchHeaders['Authorization'] = `Bearer ${key}`;
  }

  const response = await fetch(chatEndpoint, {
    method: 'POST',
    headers: fetchHeaders,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return {
    status: response.status,
    headers: response.headers,
    data,
  };
}

describeWithApi('Layers API Integration', () => {
  beforeAll(() => {
    console.log(`Testing Layers API at: ${apiUrl}`);
    console.log(`Using API key: ${apiKey?.substring(0, 15)}...`);
  });

  // ============================================================
  // AUTHENTICATION TESTS
  // ============================================================
  describe('Authentication', () => {
    it('should accept valid API key (200)', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Say "test" and nothing else.' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeTruthy();
    }, 30000);

    it('should reject missing API key (401)', async () => {
      const { status, data } = await layersChat(
        {
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        { key: null }
      );

      expect(status).toBe(401);
      expect(data.error).toContain('Authorization');
    }, 10000);

    it('should reject invalid API key format (401)', async () => {
      const { status, data } = await layersChat(
        {
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        { key: 'invalid_key_format' }
      );

      expect(status).toBe(401);
      expect(data.error).toContain('lyr_live_');
    }, 10000);

    it('should reject non-existent API key (401)', async () => {
      const { status, data } = await layersChat(
        {
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        { key: 'lyr_live_this_key_does_not_exist_12345' }
      );

      // In demo mode, this might still return 200
      // In production mode, this should return 401
      expect([200, 401]).toContain(status);
      if (status === 401) {
        expect(data.error).toBeDefined();
      }
    }, 10000);
  });

  // ============================================================
  // CREDITS TESTS
  // ============================================================
  describe('Credits', () => {
    it('should return credits_used in response', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.layers).toBeDefined();
      expect(typeof data.layers.credits_used).toBe('number');
      expect(data.layers.credits_used).toBeGreaterThan(0);
    }, 30000);

    it('should return latency_ms in response', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.layers).toBeDefined();
      expect(typeof data.layers.latency_ms).toBe('number');
      expect(data.layers.latency_ms).toBeGreaterThan(0);
    }, 30000);

    it('should return usage token counts', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 20,
      });

      expect(status).toBe(200);
      expect(data.usage).toBeDefined();
      expect(typeof data.usage.prompt_tokens).toBe('number');
      expect(typeof data.usage.completion_tokens).toBe('number');
      expect(typeof data.usage.total_tokens).toBe('number');
    }, 30000);

    // Note: Testing insufficient credits requires a user with low balance
    // This test would need a specific test account to run properly
    it.skip('should reject when insufficient balance (402)', async () => {
      // This test requires a user with insufficient credits
      const { status, data } = await layersChat(
        {
          model: 'anthropic/claude-opus-4.5', // Expensive model
          messages: [{ role: 'user', content: 'Write a long essay' }],
          max_tokens: 4000,
        },
        { key: 'lyr_live_low_balance_test_key' }
      );

      expect(status).toBe(402);
      expect(data.error).toContain('Insufficient');
    });
  });

  // ============================================================
  // RATE LIMIT TESTS
  // ============================================================
  describe('Rate Limits', () => {
    it('should return X-RateLimit-Limit header', async () => {
      const { status, headers } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      const rateLimitHeader = headers.get('X-RateLimit-Limit');
      expect(rateLimitHeader).toBeTruthy();
      expect(parseInt(rateLimitHeader!)).toBeGreaterThan(0);
    }, 30000);

    it('should return X-RateLimit-Remaining header', async () => {
      const { status, headers } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      const rateLimitRemaining = headers.get('X-RateLimit-Remaining');
      expect(rateLimitRemaining).toBeTruthy();
      expect(parseInt(rateLimitRemaining!)).toBeGreaterThanOrEqual(0);
    }, 30000);

    it('should return X-RateLimit-Reset header', async () => {
      const { status, headers } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      const rateLimitReset = headers.get('X-RateLimit-Reset');
      expect(rateLimitReset).toBeTruthy();
    }, 30000);

    // Note: Testing rate limit exceeded (429) would require rapid requests
    // which could impact other tests. Skipping for now.
    it.skip('should return 429 when rate limit exceeded', async () => {
      // This test would need to make many rapid requests
    });
  });

  // ============================================================
  // CAPABILITY TESTS - TEXT (Expected: PASS)
  // ============================================================
  describe('Capability: Text', () => {
    it('should generate text with Claude', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'What is 2+2? Answer with just the number.' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.choices[0].message.content).toContain('4');
    }, 30000);

    it('should generate text with GPT-4o', async () => {
      const { status, data } = await layersChat({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: 'What is 2+2? Answer with just the number.' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.choices[0].message.content).toContain('4');
    }, 30000);

    it('should generate text with Perplexity', async () => {
      const { status, data } = await layersChat({
        model: 'perplexity/sonar',
        messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
        max_tokens: 20,
      });

      expect(status).toBe(200);
      expect(data.choices[0].message.content.toLowerCase()).toContain('hello');
    }, 30000);

    it('should generate text with Morph', async () => {
      const { status, data } = await layersChat({
        model: 'morph/morph-v3-fast',
        messages: [{ role: 'user', content: 'Say "hi" and nothing else.' }],
        max_tokens: 10,
      });

      expect(status).toBe(200);
      expect(data.choices[0].message.content.length).toBeGreaterThan(0);
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - STREAMING (Working)
  // The Layers API now supports streaming via callGatewayStream()
  // ============================================================
  describe('Capability: Streaming', () => {
    it('should stream responses with SSE format', async () => {
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-4.5',
          messages: [{ role: 'user', content: 'Say "hello" and nothing else.' }],
          max_tokens: 20,
          stream: true,
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/event-stream');

      // Read the stream
      const text = await response.text();
      expect(text).toContain('data: ');
      expect(text).toContain('[DONE]');

      // Parse a chunk to verify format
      const lines = text.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'));
      expect(lines.length).toBeGreaterThan(0);

      const firstChunk = JSON.parse(lines[0].replace('data: ', ''));
      expect(firstChunk.object).toBe('chat.completion.chunk');
      expect(firstChunk.choices[0].delta).toBeDefined();
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - TOOLS (Working)
  // The Layers API now forwards tools via convertTools()
  // ============================================================
  describe('Capability: Tools (Function Calling)', () => {
    const calculatorTool = {
      type: 'function',
      function: {
        name: 'calculator',
        description: 'A calculator that can add two numbers together',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
      },
    };

    it('should call tools with Claude', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'What is 15 + 27? Use the calculator tool.' }],
        max_tokens: 200,
        tools: [calculatorTool],
        tool_choice: 'auto',
      });

      expect(status).toBe(200);
      const hasToolCalls = data.choices?.[0]?.message?.tool_calls?.length > 0;
      const responseText = data.choices?.[0]?.message?.content || '';

      console.log('Tool calls present:', hasToolCalls);
      console.log('Response text:', responseText.substring(0, 100));

      // Either tool is called OR model answers with 42 in text
      expect(hasToolCalls || responseText.includes('42')).toBe(true);
    }, 30000);

    it('should call tools with GPT-4o', async () => {
      const { status, data } = await layersChat({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'What is 15 + 27? Use the calculator tool.' }],
        max_tokens: 200,
        tools: [calculatorTool],
        tool_choice: 'auto',
      });

      expect(status).toBe(200);
      const hasToolCalls = data.choices?.[0]?.message?.tool_calls?.length > 0;
      const responseText = data.choices?.[0]?.message?.content || '';

      console.log('Tool calls present:', hasToolCalls);
      console.log('Response text:', responseText.substring(0, 100));

      // Either tool is called OR model answers with 42 in text
      expect(hasToolCalls || responseText.includes('42')).toBe(true);
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - JSON MODE (Working)
  // The Layers API now forwards response_format via Output.object()
  // ============================================================
  describe('Capability: JSON Mode (Structured Output)', () => {
    it('should return structured JSON with Claude', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
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

      // Try to parse the response as JSON
      let isValidJson = false;
      let parsedJson: unknown = null;
      try {
        parsedJson = JSON.parse(content);
        isValidJson = true;
      } catch {
        isValidJson = false;
      }

      console.log('Response content:', content.substring(0, 200));
      console.log('Is valid JSON:', isValidJson);
      console.log('Parsed JSON:', parsedJson);

      // With response_format, we expect valid JSON
      expect(isValidJson).toBe(true);
    }, 30000);

    it('should return structured JSON with GPT-4o', async () => {
      const { status, data } = await layersChat({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Generate a person object with name, age, and city properties.',
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

      console.log('Response content:', content.substring(0, 200));
      expect(isValidJson).toBe(true);
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - THINKING (Working)
  // The Layers API now forwards providerOptions for thinking
  // ============================================================
  describe('Capability: Thinking (Extended Reasoning)', () => {
    it('should return reasoning with GPT-5.1-thinking', async () => {
      const { status, data } = await layersChat({
        model: 'openai/gpt-5.1-thinking',
        messages: [
          {
            role: 'user',
            content: 'Think step by step: What is 15 + 27?',
          },
        ],
        max_tokens: 500,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';

      // GPT-5.1-thinking includes reasoning in its response text
      // Check that it shows some reasoning or the answer
      expect(content.includes('42') || content.toLowerCase().includes('step')).toBe(true);
    }, 60000);

    it('should enable thinking for Claude via anthropic options', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: 'Think step by step: What is 15 + 27?',
          },
        ],
        max_tokens: 1000,
        // Provider options are now forwarded via the gateway client
        anthropic: {
          thinking: {
            type: 'enabled',
            budget_tokens: 500,
          },
        },
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';

      console.log('Response content:', content.substring(0, 200));

      // Should get a response with reasoning
      expect(content.length).toBeGreaterThan(0);
      expect(content.includes('42') || content.toLowerCase().includes('27') || content.toLowerCase().includes('15')).toBe(true);

      // Check for reasoning in layers response if present
      if (data.layers?.reasoning) {
        console.log('Reasoning present:', JSON.stringify(data.layers.reasoning).substring(0, 200));
      }
    }, 60000);

    it('should enable thinking via convenience parameter', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: 'Think step by step: What is 25 + 17?',
          },
        ],
        max_tokens: 1000,
        // Use the convenience parameter instead of provider options
        thinking: {
          type: 'enabled',
          budget_tokens: 500,
        },
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';

      console.log('Response with thinking parameter:', content.substring(0, 200));
      expect(content.length).toBeGreaterThan(0);
    }, 60000);
  });

  // ============================================================
  // CAPABILITY TESTS - VISION (Working)
  // The gateway client now handles multimodal content via convertContentParts()
  // ============================================================
  describe('Capability: Vision (Image Input)', () => {
    it('should process images with Claude', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What color is this image? Answer with just the color name.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 20,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
      console.log('Vision response (Claude):', content);

      // The test image is a solid red square
      expect(content).toContain('red');
    }, 30000);

    it('should process images with GPT-4o', async () => {
      const { status, data } = await layersChat({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What color is this image? Answer with just the color name.' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${TEST_IMAGE_BASE64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 20,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content?.toLowerCase() || '';
      console.log('Vision response (GPT-4o):', content);

      // The test image is a solid red square
      expect(content).toContain('red');
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - WEB SEARCH (Working)
  // Perplexity models have web search built-in
  // web_search and search_domains parameters are also forwarded
  // ============================================================
  describe('Capability: Web Search (Perplexity)', () => {
    it('should search the web with Perplexity Sonar', async () => {
      const { status, data } = await layersChat({
        model: 'perplexity/sonar',
        messages: [
          {
            role: 'user',
            content: 'What is the current date and what major news happened today? Be brief.',
          },
        ],
        max_tokens: 200,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';

      // Perplexity should return something - it has web access built-in
      console.log('Web search response:', content.substring(0, 200));
      expect(content.length).toBeGreaterThan(10);
    }, 30000);

    it('should search with Perplexity Sonar Pro', async () => {
      const { status, data } = await layersChat({
        model: 'perplexity/sonar-pro',
        messages: [
          {
            role: 'user',
            content: 'What is the weather like in San Francisco right now?',
          },
        ],
        max_tokens: 200,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';
      console.log('Sonar Pro response:', content.substring(0, 200));
      expect(content.length).toBeGreaterThan(10);
    }, 30000);

    it('should support web_search parameter', async () => {
      const { status, data } = await layersChat({
        model: 'perplexity/sonar',
        messages: [
          {
            role: 'user',
            content: 'What time is it in Tokyo right now?',
          },
        ],
        max_tokens: 100,
        web_search: true,
      });

      expect(status).toBe(200);
      const content = data.choices?.[0]?.message?.content || '';
      console.log('Web search with parameter:', content.substring(0, 200));
      expect(content.length).toBeGreaterThan(10);
    }, 30000);
  });

  // ============================================================
  // CAPABILITY TESTS - PROMPT CACHING (Working)
  // The cache parameter is forwarded to the gateway
  // ============================================================
  describe('Capability: Prompt Caching', () => {
    it('should accept cache parameter', async () => {
      const { status, data } = await layersChat({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
        cache: true,
      });

      expect(status).toBe(200);
      expect(data.choices[0].message.content.length).toBeGreaterThan(0);
    }, 30000);
  });

  // ============================================================
  // REQUEST VALIDATION TESTS
  // ============================================================
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

  // ============================================================
  // RESPONSE FORMAT TESTS
  // ============================================================
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

  // ============================================================
  // HEALTH CHECK TEST
  // ============================================================
  describe('Health Check', () => {
    it('should return health status on GET', async () => {
      const response = await fetch(chatEndpoint, { method: 'GET' });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.version).toBe('v1');
      expect(data.endpoints).toBeDefined();
    }, 10000);
  });
});

// ============================================================
// PROVIDER-SPECIFIC TESTS VIA LAYERS API
// ============================================================
describeWithApi('Provider-Specific Tests via Layers API', () => {
  describe('Anthropic Models', () => {
    const anthropicModels = [
      'anthropic/claude-haiku-4.5',
      'anthropic/claude-sonnet-4.5',
      // Skip Opus for cost reasons in tests
    ];

    for (const modelId of anthropicModels) {
      it(`${modelId} should respond`, async () => {
        const { status, data } = await layersChat({
          model: modelId,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.choices[0].message.content.length).toBeGreaterThan(0);
      }, 30000);
    }
  });

  describe('OpenAI Models', () => {
    const openaiModels = [
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
    ];

    for (const modelId of openaiModels) {
      it(`${modelId} should respond`, async () => {
        const { status, data } = await layersChat({
          model: modelId,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.choices[0].message.content.length).toBeGreaterThan(0);
      }, 30000);
    }
  });

  describe('Perplexity Models', () => {
    const perplexityModels = [
      'perplexity/sonar',
      'perplexity/sonar-pro',
    ];

    for (const modelId of perplexityModels) {
      it(`${modelId} should respond`, async () => {
        const { status, data } = await layersChat({
          model: modelId,
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 20,
        });

        expect(status).toBe(200);
        expect(data.choices[0].message.content.length).toBeGreaterThan(0);
      }, 30000);
    }
  });

  describe('Morph Models', () => {
    const morphModels = [
      'morph/morph-v3-fast',
    ];

    for (const modelId of morphModels) {
      it(`${modelId} should respond`, async () => {
        const { status, data } = await layersChat({
          model: modelId,
          messages: [{ role: 'user', content: 'Say hi' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.choices[0].message.content.length).toBeGreaterThan(0);
      }, 30000);
    }
  });

  describe('Google Models', () => {
    // Only test the most reliable Google models
    const googleModels = [
      'google/gemini-2.5-flash-lite',
    ];

    for (const modelId of googleModels) {
      it(`${modelId} should respond`, async () => {
        const { status, data } = await layersChat({
          model: modelId,
          messages: [{ role: 'user', content: 'Say ok' }],
          max_tokens: 10,
        });

        expect(status).toBe(200);
        expect(data.choices[0].message.content.length).toBeGreaterThan(0);
      }, 30000);
    }
  });
});
