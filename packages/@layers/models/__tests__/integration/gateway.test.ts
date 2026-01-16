/**
 * AI Gateway Integration Tests
 *
 * Tests actual API calls to Vercel AI Gateway for all providers.
 * Requires AI_GATEWAY_API_KEY environment variable.
 *
 * Run with: AI_GATEWAY_API_KEY=xxx bun test
 *
 * These tests are marked with .skipIf(!apiKey) so they'll skip in CI
 * without the API key configured.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { generateText, streamText, Output, jsonSchema } from 'ai';
import { createGateway } from 'ai';
import { z } from 'zod/v4';
import { MODEL_IDS, MODEL_REGISTRY } from '../../src/registry';
import { getModelsByProvider, getModelsWithCapability } from '../../src/helpers';

// API key check
const apiKey = process.env.AI_GATEWAY_API_KEY;
const gateway = apiKey
  ? createGateway({ apiKey })
  : null;

// Test image (50x50 solid red square PNG, base64)
const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAQ0lEQVR42u3PMREAAAgAoe9fWjO4egwEoKn5IBERERERERERERERERERERERERERERERERERERERERERERERERGRiwWwM3WWecUcsQAAAABJRU5ErkJggg==';

// Skip all tests if no API key
const describeWithApi = apiKey ? describe : describe.skip;

describeWithApi('Vercel AI Gateway Integration', () => {
  beforeAll(() => {
    if (!gateway) {
      console.warn('Skipping gateway tests - AI_GATEWAY_API_KEY not set');
    }
  });

  describe('Provider Connectivity', () => {
    // Test one model from each provider for basic connectivity
    // Note: gemini-2.5-flash has known gateway issues, use flash-lite instead
    const providerTestModels = [
      { provider: 'anthropic', model: 'anthropic/claude-haiku-4.5' },
      { provider: 'openai', model: 'openai/gpt-4o-mini' },
      { provider: 'google', model: 'google/gemini-2.5-flash-lite' },
      { provider: 'perplexity', model: 'perplexity/sonar' },
      { provider: 'morph', model: 'morph/morph-v3-fast' },
    ];

    for (const { provider, model } of providerTestModels) {
      it(`should connect to ${provider} via ${model}`, async () => {
        const { text } = await generateText({
          model: gateway!(model),
          prompt: 'Say "Hello" and nothing else.',
          maxOutputTokens: 20,
        });
        expect(text.toLowerCase()).toContain('hello');
      }, 30000);
    }
  });

  describe('Text Generation', () => {
    // Test text generation on models that support it
    const textModels = getModelsByProvider('anthropic').slice(0, 1);

    for (const model of textModels) {
      it(`should generate text with ${model.id}`, async () => {
        const { text } = await generateText({
          model: gateway!(model.id),
          prompt: 'What is 2+2? Answer with just the number.',
          maxOutputTokens: 10,
        });
        expect(text).toContain('4');
      }, 30000);
    }
  });

  describe('Vision Capability', () => {
    it('should process images with Claude', async () => {
      const { text } = await generateText({
        model: gateway!('anthropic/claude-haiku-4.5'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What color is this image? Answer with just the color name.' },
              {
                type: 'image',
                image: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
              },
            ],
          },
        ],
        maxOutputTokens: 20,
      });
      expect(text.toLowerCase()).toContain('red');
    }, 30000);

    it('should process images with GPT-4o', async () => {
      const { text } = await generateText({
        model: gateway!('openai/gpt-4o-mini'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What color is this image? Answer with just the color name.' },
              {
                type: 'image',
                image: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
              },
            ],
          },
        ],
        maxOutputTokens: 20,
      });
      expect(text.toLowerCase()).toContain('red');
    }, 30000);
  });

  describe('Tool Calling', () => {
    // Gateway requires explicit JSON Schema with type: 'object'
    const calculatorSchema = jsonSchema<{ a: number; b: number }>({
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number to add' },
        b: { type: 'number', description: 'Second number to add' },
      },
      required: ['a', 'b'],
      additionalProperties: false,
    });

    const calculatorTool = {
      calculator: {
        description: 'A calculator that can add two numbers together',
        inputSchema: calculatorSchema,
        execute: async (args: { a: number; b: number }) => ({ result: args.a + args.b }),
      },
    };

    it('should call tools with Claude', async () => {
      const response = await generateText({
        model: gateway!('anthropic/claude-haiku-4.5'),
        prompt: 'What is 15 + 27? Use the calculator tool.',
        maxOutputTokens: 200,
        tools: calculatorTool,
      });

      const toolCalls = response.toolCalls || [];
      expect(toolCalls.length > 0 || response.text.includes('42')).toBe(true);
    }, 30000);

    it('should call tools with GPT-4o', async () => {
      const response = await generateText({
        model: gateway!('openai/gpt-4o'),
        prompt: 'What is 15 + 27? Use the calculator tool.',
        maxOutputTokens: 200,
        tools: calculatorTool,
      });

      const toolCalls = response.toolCalls || [];
      expect(toolCalls.length > 0 || response.text.includes('42')).toBe(true);
    }, 30000);
  });

  describe('Structured Output (JSON)', () => {
    const personSchema = z.object({
      name: z.string(),
      age: z.number(),
      city: z.string(),
    });

    it('should return structured JSON with Claude', async () => {
      const response = await generateText({
        model: gateway!('anthropic/claude-haiku-4.5'),
        prompt: 'Generate a person named Alice, age 30, from New York. Return as JSON.',
        maxOutputTokens: 200,
        output: Output.object({ schema: personSchema }),
      });

      const obj = response.output as { name: string; age: number; city: string } | undefined;
      expect(obj).toBeDefined();
      expect(typeof obj?.name).toBe('string');
      expect(typeof obj?.age).toBe('number');
      expect(typeof obj?.city).toBe('string');
    }, 30000);

    it('should return structured JSON with GPT-4o', async () => {
      const response = await generateText({
        model: gateway!('openai/gpt-4o'),
        prompt: 'Generate a person named Bob, age 25, from Chicago. Return as JSON.',
        maxOutputTokens: 200,
        output: Output.object({ schema: personSchema }),
      });

      const obj = response.output as { name: string; age: number; city: string } | undefined;
      expect(obj).toBeDefined();
      expect(typeof obj?.name).toBe('string');
      expect(typeof obj?.age).toBe('number');
      expect(typeof obj?.city).toBe('string');
    }, 30000);
  });

  describe('Streaming', () => {
    it('should stream responses from Claude', async () => {
      const { textStream } = streamText({
        model: gateway!('anthropic/claude-haiku-4.5'),
        prompt: 'Count from 1 to 5.',
        maxOutputTokens: 50,
      });

      let chunks = 0;
      let text = '';
      for await (const chunk of textStream) {
        chunks++;
        text += chunk;
      }

      expect(chunks).toBeGreaterThan(1);
      expect(text).toBeTruthy();
    }, 30000);

    it('should stream responses from GPT-4o', async () => {
      const { textStream } = streamText({
        model: gateway!('openai/gpt-4o-mini'),
        prompt: 'Count from 1 to 5.',
        maxOutputTokens: 50,
      });

      let chunks = 0;
      let text = '';
      for await (const chunk of textStream) {
        chunks++;
        text += chunk;
      }

      expect(chunks).toBeGreaterThan(1);
      expect(text).toBeTruthy();
    }, 30000);
  });

  describe('Reasoning Models', () => {
    it('should reason with GPT-5.1 Thinking', async () => {
      const result = await generateText({
        model: gateway!('openai/gpt-5.1-thinking'),
        prompt: 'Think step by step: What is 15 + 27?',
        maxOutputTokens: 500,
      });

      // GPT-5.1-thinking returns reasoning in various formats
      expect(result.text.includes('42') || result.text.toLowerCase().includes('step')).toBe(true);

      // Log reasoning trace if present (may be array, object, or string)
      if (result.reasoning) {
        console.log('GPT-5.1 Reasoning type:', typeof result.reasoning);
        console.log('GPT-5.1 Reasoning:', JSON.stringify(result.reasoning).substring(0, 300));
      }
      if (result.reasoningText) {
        console.log('GPT-5.1 Reasoning text:', result.reasoningText.substring(0, 200));
      }
    }, 60000);

    it('should reason with Perplexity Sonar Reasoning Pro', async () => {
      const { text } = await generateText({
        model: gateway!('perplexity/sonar-reasoning-pro'),
        prompt: 'Think step by step: What is 15 + 27?',
        maxOutputTokens: 500,
      });

      // Perplexity may format response differently, just check we get a response
      expect(text.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Web Search (Perplexity)', () => {
    it('should search the web with Sonar', async () => {
      const { text } = await generateText({
        model: gateway!('perplexity/sonar'),
        prompt: 'What is the current weather in San Francisco? Keep it brief.',
        maxOutputTokens: 200,
      });

      // Should return something (might ask for clarification or give weather)
      expect(text.length).toBeGreaterThan(10);
    }, 30000);
  });

  describe('Morph Models (Fast Editing)', () => {
    it('should generate text with Morph V3 Fast', async () => {
      const { text } = await generateText({
        model: gateway!('morph/morph-v3-fast'),
        prompt: 'Rewrite this sentence: "The quick brown fox" - make it more formal.',
        maxOutputTokens: 100,
      });

      expect(text.length).toBeGreaterThan(10);
    }, 30000);

    it('should generate text with Morph V3 Large', async () => {
      const { text } = await generateText({
        model: gateway!('morph/morph-v3-large'),
        prompt: 'Summarize this in one sentence: AI is transforming how we work and live.',
        maxOutputTokens: 100,
      });

      expect(text.length).toBeGreaterThan(10);
    }, 30000);
  });
});

// Separate describe for provider-specific comprehensive tests
describeWithApi('Provider-Specific Comprehensive Tests', () => {
  describe('Anthropic Models', () => {
    const anthropicModels = getModelsByProvider('anthropic');

    for (const model of anthropicModels) {
      it(`${model.name} should respond to text prompt`, async () => {
        const { text } = await generateText({
          model: gateway!(model.id),
          prompt: 'Say "test passed" and nothing else.',
          maxOutputTokens: 20,
        });
        expect(text.toLowerCase()).toContain('test');
      }, 30000);
    }
  });

  describe('OpenAI Chat Models (with text capability)', () => {
    // Only test models known to work reliably via gateway
    // Skip: gpt-5.1-instant (intermittent empty responses)
    const reliableOpenAIModels = [
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'openai/gpt-5-chat',
      'openai/gpt-5.1-thinking',
    ];

    for (const modelId of reliableOpenAIModels) {
      const model = getModelsByProvider('openai').find((m) => m.id === modelId);
      if (!model) continue;

      it(`${model.name} should respond to text prompt`, async () => {
        const { text } = await generateText({
          model: gateway!(model.id),
          prompt: 'Say "test passed" and nothing else.',
          maxOutputTokens: 20,
        });
        expect(text.length).toBeGreaterThan(0);
      }, 30000);
    }
  });

  describe('Google Models', () => {
    // Many Google models have intermittent gateway issues with simple text prompts
    // Only test models known to work reliably for TEXT generation
    // Note: gemini-3-pro-image is primarily for image gen, can timeout on text
    const reliableGoogleModels = [
      'google/gemini-2.5-flash-lite',
      'google/gemini-2.5-flash-image',
    ];

    for (const modelId of reliableGoogleModels) {
      const model = getModelsByProvider('google').find((m) => m.id === modelId);
      if (!model) continue;

      it(`${model.name} should respond to text prompt`, async () => {
        const { text } = await generateText({
          model: gateway!(model.id),
          prompt: 'Say "test passed" and nothing else.',
          maxOutputTokens: 20,
        });
        expect(text.length).toBeGreaterThan(0);
      }, 30000);
    }
  });
});
