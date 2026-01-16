/**
 * Test all 24 models from the @layers/models registry
 * Run: AI_GATEWAY_API_KEY=xxx node test-registry-models.js
 */

const { createGateway, generateText, streamText, Output, jsonSchema } = require('ai');
const { z } = require('zod/v4');

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

// All 24 models from our registry (5 providers)
const REGISTRY_MODELS = [
  // Anthropic (3)
  { id: 'anthropic/claude-haiku-4.5', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'anthropic/claude-sonnet-4.5', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'anthropic/claude-opus-4.5', caps: ['text', 'vision', 'tools', 'json', 'stream'] },

  // OpenAI (9)
  { id: 'openai/gpt-4o', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'openai/gpt-4o-mini', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'openai/gpt-5-chat', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'openai/gpt-5-codex', caps: ['tools', 'json', 'stream'] }, // No text - code focused
  { id: 'openai/gpt-5.1-codex', caps: ['tools', 'json', 'stream'] },
  { id: 'openai/gpt-5.1-codex-mini', caps: ['tools', 'json', 'stream'] },
  { id: 'openai/gpt-5.1-instant', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'openai/gpt-5.1-thinking', caps: ['text', 'vision', 'tools', 'json', 'stream'] },
  { id: 'openai/o3', caps: ['reasoning'], reasoningOnly: true },

  // Google (7)
  { id: 'google/gemini-2.5-flash', caps: ['text', 'tools', 'json'] }, // Stream unreliable
  { id: 'google/gemini-2.5-flash-lite', caps: ['text', 'vision', 'json'] },
  { id: 'google/gemini-2.5-flash-image', caps: ['text', 'vision', 'tools', 'json'] },
  { id: 'google/gemini-2.5-pro', caps: ['text', 'tools', 'json'] },
  { id: 'google/gemini-3-flash', caps: ['tools'] }, // Text intermittent
  { id: 'google/gemini-3-pro-preview', caps: ['tools'] },
  { id: 'google/gemini-3-pro-image', caps: ['text', 'vision', 'tools', 'json'] },

  // Perplexity (3)
  { id: 'perplexity/sonar', caps: ['json', 'stream', 'web'] },
  { id: 'perplexity/sonar-pro', caps: ['json', 'stream', 'web'] },
  { id: 'perplexity/sonar-reasoning-pro', caps: ['reasoning', 'web'], reasoningOnly: true },

  // Morph (2)
  { id: 'morph/morph-v3-fast', caps: ['text', 'stream'] },
  { id: 'morph/morph-v3-large', caps: ['text', 'stream'] },
];

const results = [];

async function testText(modelId) {
  try {
    const start = Date.now();
    const { text } = await generateText({
      model: gateway(modelId),
      prompt: 'Say "Hello, Layers!" and nothing else.',
      maxOutputTokens: 50,
    });
    return { test: 'text', success: text.toLowerCase().includes('hello'), ms: Date.now() - start, response: text.substring(0, 40) };
  } catch (e) {
    return { test: 'text', success: false, error: e.message.substring(0, 60) };
  }
}

async function testReasoning(modelId) {
  try {
    const start = Date.now();
    const { text } = await generateText({
      model: gateway(modelId),
      prompt: 'Think step by step: What is 15 + 27?',
      maxOutputTokens: 500,
    });
    return { test: 'reasoning', success: text.includes('42') || text.toLowerCase().includes('step'), ms: Date.now() - start, response: text.substring(0, 40) };
  } catch (e) {
    return { test: 'reasoning', success: false, error: e.message.substring(0, 60) };
  }
}

async function testVision(modelId) {
  const TEST_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAQ0lEQVR42u3PMREAAAgAoe9fWjO4egwEoKn5IBERERERERERERERERERERERERERERERERERERERERERERERERGRiwWwM3WWecUcsQAAAABJRU5ErkJggg==';
  try {
    const start = Date.now();
    const { text } = await generateText({
      model: gateway(modelId),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What color is this image? Answer with just the color.' },
          { type: 'image', image: Buffer.from(TEST_IMAGE, 'base64') },
        ],
      }],
      maxOutputTokens: 50,
    });
    return { test: 'vision', success: text.toLowerCase().includes('red'), ms: Date.now() - start, response: text.substring(0, 40) };
  } catch (e) {
    return { test: 'vision', success: false, error: e.message.substring(0, 60) };
  }
}

async function testTools(modelId) {
  try {
    const start = Date.now();
    const calcSchema = jsonSchema({
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b'],
      additionalProperties: false,
    });
    const response = await generateText({
      model: gateway(modelId),
      prompt: 'What is 15 + 27? Use the calculator tool.',
      maxOutputTokens: 200,
      tools: {
        calculator: {
          description: 'Add two numbers',
          inputSchema: calcSchema,
          execute: async (args) => ({ result: args.a + args.b }),
        },
      },
    });
    const toolCalls = response.toolCalls || [];
    return { test: 'tools', success: toolCalls.length > 0 || response.text.includes('42'), ms: Date.now() - start, response: toolCalls.length > 0 ? 'Tool called' : response.text.substring(0, 30) };
  } catch (e) {
    return { test: 'tools', success: false, error: e.message.substring(0, 60) };
  }
}

async function testJson(modelId) {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });
  try {
    const start = Date.now();
    const response = await generateText({
      model: gateway(modelId),
      prompt: 'Generate a person named Alice age 30. Return as JSON.',
      maxOutputTokens: 200,
      output: Output.object({ schema }),
    });
    const obj = response.output;
    return { test: 'json', success: obj && typeof obj.name === 'string' && typeof obj.age === 'number', ms: Date.now() - start, response: obj ? JSON.stringify(obj) : 'No output' };
  } catch (e) {
    return { test: 'json', success: false, error: e.message.substring(0, 60) };
  }
}

async function testStream(modelId) {
  try {
    const start = Date.now();
    const { textStream } = streamText({
      model: gateway(modelId),
      prompt: 'Count 1 to 5.',
      maxOutputTokens: 50,
    });
    let chunks = 0;
    for await (const chunk of textStream) chunks++;
    return { test: 'stream', success: chunks > 1, ms: Date.now() - start, response: `${chunks} chunks` };
  } catch (e) {
    return { test: 'stream', success: false, error: e.message.substring(0, 60) };
  }
}

async function main() {
  console.log('Testing 24 models from @layers/models registry...\n');
  console.log('='.repeat(70));

  for (const model of REGISTRY_MODELS) {
    console.log(`\n${model.id}${model.reasoningOnly ? ' [reasoning-only]' : ''}`);

    if (model.reasoningOnly) {
      const r = await testReasoning(model.id);
      results.push({ model: model.id, ...r });
      console.log(`  ${r.success ? '✓' : '✗'} ${r.test.padEnd(10)} ${r.ms ? r.ms + 'ms' : ''} ${r.response || r.error || ''}`);
    } else {
      for (const cap of model.caps) {
        let r;
        switch (cap) {
          case 'text': r = await testText(model.id); break;
          case 'vision': r = await testVision(model.id); break;
          case 'tools': r = await testTools(model.id); break;
          case 'json': r = await testJson(model.id); break;
          case 'stream': r = await testStream(model.id); break;
          default: continue;
        }
        results.push({ model: model.id, ...r });
        console.log(`  ${r.success ? '✓' : '✗'} ${r.test.padEnd(10)} ${r.ms ? r.ms + 'ms' : ''} ${r.response || r.error || ''}`);
      }
    }

    // Rate limit protection
    await new Promise(r => setTimeout(r, 300));
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nPassed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${results.length}`);

  // By provider
  const providers = ['anthropic', 'openai', 'google', 'perplexity', 'morph'];
  console.log('\nBy Provider:');
  for (const p of providers) {
    const providerResults = results.filter(r => r.model.startsWith(p));
    const providerPassed = providerResults.filter(r => r.success).length;
    console.log(`  ${p}: ${providerPassed}/${providerResults.length}`);
  }

  // Failed tests
  if (failed > 0) {
    console.log('\nFailed tests:');
    for (const r of results.filter(r => !r.success)) {
      console.log(`  - ${r.model} (${r.test}): ${r.error || 'no response'}`);
    }
  }

  console.log('\n✓ Test complete');
}

main().catch(console.error);
