import { generateText, createGateway } from 'ai';

async function test() {
  const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
  const result = await generateText({
    model: gateway('openai/gpt-4o-mini'),
    messages: [{ role: 'user', content: 'Say hi' }],
    maxTokens: 10,
  });

  console.log('=== result.response methods/properties ===');
  console.log('result.response:', typeof result.response);

  if (result.response) {
    console.log('result.response keys:', Object.keys(result.response));
    console.log('result.response.toJSON:', typeof (result.response as any).toJSON);
    console.log('result.response.rawResponse:', typeof (result.response as any).rawResponse);

    // Try toJSON if it exists
    if (typeof (result.response as any).toJSON === 'function') {
      console.log('\n=== result.response.toJSON() ===');
      console.log(JSON.stringify((result.response as any).toJSON(), null, 2));
    }
  }

  // Check if there's a rawResponse property
  console.log('\n=== result.rawResponse ===');
  console.log(typeof (result as any).rawResponse);

  // Check response.body in detail
  console.log('\n=== result.response.body (full) ===');
  console.log(JSON.stringify((result as any).response?.body, null, 2));
}

test().catch(console.error);
