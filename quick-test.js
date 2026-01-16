const { createGateway, generateText } = require('ai');

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

// Test one model from each of the 5 providers in our registry
const testModels = [
  'anthropic/claude-haiku-4.5',
  'openai/gpt-4o-mini',
  'google/gemini-2.5-flash',
  'perplexity/sonar',
  'morph/morph-v3-fast'
];

async function testModel(modelId) {
  try {
    const start = Date.now();
    const result = await generateText({
      model: gateway(modelId),
      prompt: 'Say hello in one word',
      maxOutputTokens: 20
    });
    const ms = Date.now() - start;
    console.log('✓', modelId.padEnd(35), ms + 'ms', result.text.substring(0, 30));
    return true;
  } catch (e) {
    console.log('✗', modelId.padEnd(35), e.message.substring(0, 60));
    return false;
  }
}

async function main() {
  console.log('Testing 5 providers (one model each)...\n');
  let passed = 0;
  for (const m of testModels) {
    if (await testModel(m)) passed++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nResult:', passed + '/' + testModels.length, 'passed');
}

main();
