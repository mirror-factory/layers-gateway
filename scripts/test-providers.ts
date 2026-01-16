#!/usr/bin/env npx tsx
/**
 * Comprehensive Provider Test Script
 *
 * Tests all AI providers through Vercel AI Gateway using the built-in gateway() function.
 * Single API key routes to all providers.
 *
 * Usage:
 *   AI_GATEWAY_API_KEY=vck_xxx npx tsx scripts/test-providers.ts
 *
 *   # Test specific provider
 *   npx tsx scripts/test-providers.ts --provider anthropic
 *
 *   # Test specific model
 *   npx tsx scripts/test-providers.ts --model claude-sonnet-4
 */

import { generateText, streamText, Output, createGateway, jsonSchema } from 'ai';
import { z } from 'zod/v4';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

// Test image (50x50 solid red square PNG, base64)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAQ0lEQVR42u3PMREAAAgAoe9fWjO4egwEoKn5IBERERERERERERERERERERERERERERERERERERERERERERERERGRiwWwM3WWecUcsQAAAABJRU5ErkJggg==';

// Model definitions with their capabilities
interface ModelDef {
  id: string; // Gateway format: provider/model-name
  provider: string;
  name: string;
  type: 'language' | 'embedding' | 'image';
  capabilities: {
    text?: boolean;
    vision?: boolean;
    tools?: boolean;
    json?: boolean;
    stream?: boolean;
    embed?: boolean;
    reasoning?: boolean;
    web?: boolean;
  };
}

// ============================================================================
// ALL 54 MODELS - Organized by Provider
// ============================================================================
// Based on MODEL-REGISTRY.md - Last updated: 2026-01-14
// ============================================================================

const TEST_MODELS: ModelDef[] = [
  // ============================================================================
  // ANTHROPIC (3 models)
  // ============================================================================
  {
    id: 'anthropic/claude-haiku-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Haiku',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Sonnet',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'anthropic/claude-opus-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Opus',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },

  // ============================================================================
  // OPENAI - Chat Models (13 models)
  // ============================================================================
  {
    id: 'openai/gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5',
    provider: 'openai',
    name: 'GPT-5',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'openai/gpt-5-mini',
    provider: 'openai',
    name: 'GPT-5 Mini',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5-nano',
    provider: 'openai',
    name: 'GPT-5 Nano',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5-chat',
    provider: 'openai',
    name: 'GPT-5 Chat',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5-codex',
    provider: 'openai',
    name: 'GPT-5 Codex',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5-pro',
    provider: 'openai',
    name: 'GPT-5 Pro',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'openai/gpt-5.1-codex',
    provider: 'openai',
    name: 'GPT-5.1 Codex',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5.1-codex-max',
    provider: 'openai',
    name: 'GPT-5.1 Codex Max',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5.1-codex-mini',
    provider: 'openai',
    name: 'GPT-5.1 Codex Mini',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5.1-instant',
    provider: 'openai',
    name: 'GPT-5.1 Instant',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'openai/gpt-5.1-thinking',
    provider: 'openai',
    name: 'GPT-5.1 Thinking',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },

  // ============================================================================
  // OPENAI - Reasoning Models (3 models)
  // ============================================================================
  {
    id: 'openai/o3',
    provider: 'openai',
    name: 'o3',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, reasoning: true },
  },
  {
    id: 'openai/o3-mini',
    provider: 'openai',
    name: 'o3 Mini',
    type: 'language',
    capabilities: { text: true, reasoning: true },
  },
  {
    id: 'openai/o4-mini',
    provider: 'openai',
    name: 'o4 Mini',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, reasoning: true },
  },

  // ============================================================================
  // OPENAI - Embeddings (2 models)
  // ============================================================================
  {
    id: 'openai/text-embedding-3-small',
    provider: 'openai',
    name: 'Text Embedding 3 Small',
    type: 'embedding',
    capabilities: { embed: true },
  },
  {
    id: 'openai/text-embedding-3-large',
    provider: 'openai',
    name: 'Text Embedding 3 Large',
    type: 'embedding',
    capabilities: { embed: true },
  },

  // ============================================================================
  // GOOGLE - Chat Models (6 models)
  // ============================================================================
  {
    id: 'google/gemini-2.5-flash',
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite',
    type: 'language',
    capabilities: { text: true, vision: true, json: true, stream: true },
  },
  {
    id: 'google/gemini-2.5-pro',
    provider: 'google',
    name: 'Gemini 2.5 Pro',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'google/gemini-3-flash',
    provider: 'google',
    name: 'Gemini 3 Flash',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'google/gemini-3-pro-preview',
    provider: 'google',
    name: 'Gemini 3 Pro Preview',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'google/gemini-3-pro-image',
    provider: 'google',
    name: 'Gemini 3 Pro Image',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },

  // ============================================================================
  // GOOGLE - Image Generation (3 models)
  // ============================================================================
  {
    id: 'google/imagen-4.0-fast-generate-001',
    provider: 'google',
    name: 'Imagen 4.0 Fast',
    type: 'image',
    capabilities: {},
  },
  {
    id: 'google/imagen-4.0-generate-001',
    provider: 'google',
    name: 'Imagen 4.0',
    type: 'image',
    capabilities: {},
  },
  {
    id: 'google/imagen-4.0-ultra-generate-001',
    provider: 'google',
    name: 'Imagen 4.0 Ultra',
    type: 'image',
    capabilities: {},
  },

  // ============================================================================
  // GOOGLE - Embeddings (2 models)
  // ============================================================================
  {
    id: 'google/text-embedding-005',
    provider: 'google',
    name: 'Text Embedding 005',
    type: 'embedding',
    capabilities: { embed: true },
  },
  {
    id: 'google/text-multilingual-embedding-002',
    provider: 'google',
    name: 'Multilingual Embedding 002',
    type: 'embedding',
    capabilities: { embed: true },
  },

  // ============================================================================
  // xAI (9 models)
  // ============================================================================
  {
    id: 'xai/grok-3',
    provider: 'xai',
    name: 'Grok 3',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-3-mini',
    provider: 'xai',
    name: 'Grok 3 Mini',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-3-fast',
    provider: 'xai',
    name: 'Grok 3 Fast',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-3-mini-fast',
    provider: 'xai',
    name: 'Grok 3 Mini Fast',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-4',
    provider: 'xai',
    name: 'Grok 4',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'xai/grok-4-fast-non-reasoning',
    provider: 'xai',
    name: 'Grok 4 Fast',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-4-fast-reasoning',
    provider: 'xai',
    name: 'Grok 4 Fast Reasoning',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'xai/grok-4.1-fast-non-reasoning',
    provider: 'xai',
    name: 'Grok 4.1 Fast',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true },
  },
  {
    id: 'xai/grok-4.1-fast-reasoning',
    provider: 'xai',
    name: 'Grok 4.1 Fast Reasoning',
    type: 'language',
    capabilities: { text: true, vision: true, tools: true, json: true, stream: true, reasoning: true },
  },

  // ============================================================================
  // DEEPSEEK (7 models)
  // ============================================================================
  {
    id: 'deepseek/deepseek-v3',
    provider: 'deepseek',
    name: 'DeepSeek V3',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true },
  },
  {
    id: 'deepseek/deepseek-v3.1',
    provider: 'deepseek',
    name: 'DeepSeek V3.1',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'deepseek/deepseek-v3.1-terminus',
    provider: 'deepseek',
    name: 'DeepSeek V3.1 Terminus',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'deepseek/deepseek-v3.2',
    provider: 'deepseek',
    name: 'DeepSeek V3.2',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'deepseek/deepseek-v3.2-exp',
    provider: 'deepseek',
    name: 'DeepSeek V3.2 Exp',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'deepseek/deepseek-v3.2-thinking',
    provider: 'deepseek',
    name: 'DeepSeek V3.2 Thinking',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },
  {
    id: 'deepseek/deepseek-r1',
    provider: 'deepseek',
    name: 'DeepSeek R1',
    type: 'language',
    capabilities: { text: true, tools: true, json: true, stream: true, reasoning: true },
  },

  // ============================================================================
  // PERPLEXITY (4 models) - Web search optimized
  // ============================================================================
  {
    id: 'perplexity/sonar',
    provider: 'perplexity',
    name: 'Sonar',
    type: 'language',
    capabilities: { text: true, json: true, stream: true, web: true },
  },
  {
    id: 'perplexity/sonar-pro',
    provider: 'perplexity',
    name: 'Sonar Pro',
    type: 'language',
    capabilities: { text: true, json: true, stream: true, web: true },
  },
  {
    id: 'perplexity/sonar-reasoning',
    provider: 'perplexity',
    name: 'Sonar Reasoning',
    type: 'language',
    capabilities: { text: true, json: true, stream: true, web: true, reasoning: true },
  },
  {
    id: 'perplexity/sonar-reasoning-pro',
    provider: 'perplexity',
    name: 'Sonar Reasoning Pro',
    type: 'language',
    capabilities: { text: true, json: true, stream: true, web: true, reasoning: true },
  },

  // ============================================================================
  // MORPH (2 models) - Fast editing
  // ============================================================================
  {
    id: 'morph/morph-v3-fast',
    provider: 'morph',
    name: 'Morph V3 Fast',
    type: 'language',
    capabilities: { text: true, stream: true },
  },
  {
    id: 'morph/morph-v3-large',
    provider: 'morph',
    name: 'Morph V3 Large',
    type: 'language',
    capabilities: { text: true, stream: true },
  },
];

// Create gateway instance
let gatewayInstance: ReturnType<typeof createGateway>;

function getGateway() {
  if (!gatewayInstance) {
    gatewayInstance = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
    });
  }
  return gatewayInstance;
}

interface TestResult {
  model: string;
  modelId: string;
  test: string;
  success: boolean;
  latencyMs?: number;
  response?: string;
  error?: string;
}

const results: TestResult[] = [];

// Test basic text generation
async function testText(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'text',
    success: false,
  };

  try {
    const startTime = Date.now();
    const { text } = await generateText({
      model: getGateway()(modelDef.id),
      prompt: 'Say "Hello, Layers!" and nothing else.',
      maxOutputTokens: 50,
    });
    result.latencyMs = Date.now() - startTime;
    result.success = text.toLowerCase().includes('hello');
    result.response = text.substring(0, 60);
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Test vision (image input)
async function testVision(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'vision',
    success: false,
  };

  try {
    const startTime = Date.now();
    const { text } = await generateText({
      model: getGateway()(modelDef.id),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What color is this pixel? Answer with just the color name.' },
            {
              type: 'image',
              image: Buffer.from(TEST_IMAGE_BASE64, 'base64'),
            },
          ],
        },
      ],
      maxOutputTokens: 50,
    });
    result.latencyMs = Date.now() - startTime;
    result.success = text.toLowerCase().includes('red');
    result.response = text.substring(0, 60);
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Test tool calling
async function testTools(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'tools',
    success: false,
  };

  try {
    const startTime = Date.now();
    // Use jsonSchema with explicit type: 'object' for tool parameters
    const calcSchema = jsonSchema<{ a: number; b: number }>({
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number to add' },
        b: { type: 'number', description: 'Second number to add' },
      },
      required: ['a', 'b'],
      additionalProperties: false,
    });
    const response = await generateText({
      model: getGateway()(modelDef.id),
      prompt: 'What is 15 + 27? Use the calculator tool to compute this.',
      maxOutputTokens: 200,
      tools: {
        calculator: {
          description: 'A calculator that can add two numbers together',
          inputSchema: calcSchema,
          execute: async (args: { a: number; b: number }) => ({ result: args.a + args.b }),
        },
      },
    });
    result.latencyMs = Date.now() - startTime;
    const toolCalls = response.toolCalls || [];
    result.success = toolCalls.length > 0 || response.text.includes('42');
    result.response = toolCalls.length > 0
      ? `Tool called: calculator`
      : response.text.substring(0, 60);
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Test structured output (JSON)
async function testJson(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'json',
    success: false,
  };

  const personSchema = z.object({
    name: z.string(),
    age: z.number(),
    city: z.string(),
  });

  try {
    const startTime = Date.now();
    const response = await generateText({
      model: getGateway()(modelDef.id),
      prompt: 'Generate a fictional person with name "Alice", age 30, from "New York". Return as JSON.',
      maxOutputTokens: 200,
      output: Output.object({ schema: personSchema }),
    });
    result.latencyMs = Date.now() - startTime;
    const obj = response.output as { name: string; age: number; city: string } | undefined;
    // Success if we got a valid object with the right shape (may not match exact values)
    result.success = obj !== undefined && typeof obj.name === 'string' && typeof obj.age === 'number' && typeof obj.city === 'string';
    result.response = obj ? JSON.stringify(obj) : response.text.substring(0, 60);
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Test embeddings
// Note: Embedding models need special handling through their provider SDKs
// The gateway() function returns a language model, not an embedding model
async function testEmbed(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'embed',
    success: false,
  };

  try {
    const startTime = Date.now();
    // Embeddings through gateway need raw API call since SDK expects EmbeddingModel
    // For now, mark as skipped - embeddings require direct provider SDK
    result.latencyMs = Date.now() - startTime;
    result.success = false;
    result.response = 'Skipped: Use @ai-sdk/openai or @ai-sdk/google directly';
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Test streaming
async function testStream(modelDef: ModelDef): Promise<TestResult> {
  const result: TestResult = {
    model: modelDef.name,
    modelId: modelDef.id,
    test: 'stream',
    success: false,
  };

  try {
    const startTime = Date.now();
    const { textStream } = streamText({
      model: getGateway()(modelDef.id),
      prompt: 'Count from 1 to 5, one number per line.',
      maxOutputTokens: 50,
    });

    let chunks = 0;
    let text = '';
    for await (const chunk of textStream) {
      chunks++;
      text += chunk;
    }
    result.latencyMs = Date.now() - startTime;
    result.success = chunks > 1;
    result.response = `${chunks} chunks: ${text.substring(0, 40).replace(/\n/g, ' ')}`;
  } catch (error) {
    result.error = error instanceof Error ? error.message.substring(0, 100) : String(error);
  }

  return result;
}

// Print result
function printResult(result: TestResult) {
  const status = result.success
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;

  const latency = result.latencyMs
    ? `${colors.dim}${result.latencyMs}ms${colors.reset}`
    : '';

  console.log(`  ${status} ${result.test.padEnd(8)} ${latency}`);

  if (result.error) {
    console.log(`    ${colors.red}${result.error}${colors.reset}`);
  } else if (result.response) {
    console.log(`    ${colors.dim}${result.response}${colors.reset}`);
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.bold}Test Summary${colors.reset}`);
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`\n  ${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset} ${failed}`);
  console.log(`  ${colors.blue}Total:${colors.reset}  ${total}`);

  // Group by test type
  const byTest: Record<string, { passed: number; failed: number }> = {};
  for (const result of results) {
    if (!byTest[result.test]) {
      byTest[result.test] = { passed: 0, failed: 0 };
    }
    if (result.success) {
      byTest[result.test].passed++;
    } else {
      byTest[result.test].failed++;
    }
  }

  console.log(`\n${colors.bold}By Capability:${colors.reset}`);
  for (const [test, counts] of Object.entries(byTest)) {
    const status = counts.failed === 0
      ? colors.green
      : counts.passed === 0
        ? colors.red
        : colors.yellow;
    console.log(
      `  ${status}${test}:${colors.reset} ${counts.passed}/${counts.passed + counts.failed} passed`
    );
  }

  // Group by provider
  const byProvider: Record<string, { passed: number; failed: number }> = {};
  for (const result of results) {
    const provider = result.modelId.split('/')[0];
    if (!byProvider[provider]) {
      byProvider[provider] = { passed: 0, failed: 0 };
    }
    if (result.success) {
      byProvider[provider].passed++;
    } else {
      byProvider[provider].failed++;
    }
  }

  console.log(`\n${colors.bold}By Provider:${colors.reset}`);
  for (const [provider, counts] of Object.entries(byProvider)) {
    const status = counts.failed === 0
      ? colors.green
      : counts.passed === 0
        ? colors.red
        : colors.yellow;
    console.log(
      `  ${status}${provider}:${colors.reset} ${counts.passed}/${counts.passed + counts.failed} passed`
    );
  }

  if (failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    for (const result of results.filter((r) => !r.success)) {
      console.log(`  - ${result.modelId} (${result.test}): ${result.error?.substring(0, 60) || 'no response'}`);
    }
  }
}

async function main() {
  console.log(`${colors.bold}Vercel AI Gateway - Provider Tests${colors.reset}`);
  console.log('='.repeat(70));

  // Check API key
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    console.error(`\n${colors.red}Error: AI_GATEWAY_API_KEY not set${colors.reset}`);
    console.log('\nSet the environment variable:');
    console.log('  AI_GATEWAY_API_KEY=vck_xxx npx tsx scripts/test-providers.ts');
    process.exit(1);
  }

  console.log(`\n${colors.green}✓${colors.reset} AI Gateway API key configured`);

  // Parse arguments
  const args = process.argv.slice(2);
  let filterProvider: string | null = null;
  let filterModel: string | null = null;
  let filterCapability: string | null = null;
  let filterType: 'language' | 'embedding' | 'image' | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && args[i + 1]) {
      filterProvider = args[i + 1];
      i++;
    } else if (args[i] === '--model' && args[i + 1]) {
      filterModel = args[i + 1];
      i++;
    } else if (args[i] === '--capability' && args[i + 1]) {
      filterCapability = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      filterType = args[i + 1] as 'language' | 'embedding' | 'image';
      i++;
    } else if (args[i] === '--help') {
      console.log(`
${colors.bold}Vercel AI Gateway - Provider Tests${colors.reset}

Usage: npx tsx scripts/test-providers.ts [options]

Options:
  --provider <name>     Filter by provider (anthropic, openai, google, xai, deepseek, perplexity, morph)
  --model <name>        Filter by model name or ID
  --capability <name>   Filter by capability (text, vision, tools, json, stream, embed, reasoning, web)
  --type <type>         Filter by model type (language, embedding, image)
  --help                Show this help message

Examples:
  npx tsx scripts/test-providers.ts --provider anthropic
  npx tsx scripts/test-providers.ts --capability vision
  npx tsx scripts/test-providers.ts --type embedding
  npx tsx scripts/test-providers.ts --provider openai --capability reasoning
`);
      process.exit(0);
    }
  }

  // Filter models
  let modelsToTest = TEST_MODELS;

  if (filterProvider) {
    modelsToTest = modelsToTest.filter((m) => m.provider === filterProvider);
  }
  if (filterModel) {
    modelsToTest = modelsToTest.filter((m) =>
      m.id.includes(filterModel) || m.name.toLowerCase().includes(filterModel.toLowerCase())
    );
  }
  if (filterCapability) {
    modelsToTest = modelsToTest.filter((m) => {
      const cap = filterCapability as keyof ModelDef['capabilities'];
      return m.capabilities[cap] === true;
    });
  }
  if (filterType) {
    modelsToTest = modelsToTest.filter((m) => m.type === filterType);
  }

  if (modelsToTest.length === 0) {
    console.error(`\n${colors.red}Error: No models to test${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.bold}Testing ${modelsToTest.length} models...${colors.reset}\n`);

  // Run tests
  for (const modelDef of modelsToTest) {
    console.log(`${colors.cyan}${modelDef.name}${colors.reset} (${modelDef.id})`);

    // Text test
    if (modelDef.capabilities.text) {
      const r = await testText(modelDef);
      results.push(r);
      printResult(r);
    }

    // Vision test
    if (modelDef.capabilities.vision) {
      const r = await testVision(modelDef);
      results.push(r);
      printResult(r);
    }

    // Tools test
    if (modelDef.capabilities.tools) {
      const r = await testTools(modelDef);
      results.push(r);
      printResult(r);
    }

    // JSON test
    if (modelDef.capabilities.json) {
      const r = await testJson(modelDef);
      results.push(r);
      printResult(r);
    }

    // Stream test
    if (modelDef.capabilities.stream) {
      const r = await testStream(modelDef);
      results.push(r);
      printResult(r);
    }

    // Embed test (for embedding models)
    if (modelDef.capabilities.embed) {
      const r = await testEmbed(modelDef);
      results.push(r);
      printResult(r);
    }

    console.log('');

    // Small delay between models to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  printSummary();

  const failedCount = results.filter((r) => !r.success).length;
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
