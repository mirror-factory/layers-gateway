/**
 * Test Capabilities Registry
 *
 * Static data extracted from integration test files:
 * - packages/@layers/models/__tests__/integration/gateway.test.ts
 * - packages/@layers/models/__tests__/integration/layers-api.test.ts
 *
 * This provides a capability matrix for the test status dashboard.
 */

export type TestStatus = 'pass' | 'fail' | 'skip' | 'unknown';

export interface TestCapability {
  id: string;
  name: string;
  description: string;
  category: string;
  gateway: TestStatus;
  api: TestStatus;
  providers?: string[];
}

export const TEST_CATEGORIES = [
  { id: 'connectivity', name: 'Connectivity', description: 'Provider connection tests' },
  { id: 'auth', name: 'Authentication', description: 'API key validation' },
  { id: 'credits', name: 'Credits', description: 'Usage tracking and billing' },
  { id: 'rate-limits', name: 'Rate Limits', description: 'Request throttling' },
  { id: 'text', name: 'Text Generation', description: 'Basic chat completions' },
  { id: 'vision', name: 'Vision', description: 'Image input processing' },
  { id: 'tools', name: 'Tools', description: 'Function calling' },
  { id: 'json', name: 'JSON Mode', description: 'Structured output' },
  { id: 'streaming', name: 'Streaming', description: 'Real-time token streaming' },
  { id: 'thinking', name: 'Thinking', description: 'Extended reasoning' },
  { id: 'web-search', name: 'Web Search', description: 'Internet access (Perplexity)' },
  { id: 'caching', name: 'Caching', description: 'Prompt caching' },
] as const;

export const TEST_CAPABILITIES: TestCapability[] = [
  // ============================================================
  // CONNECTIVITY (5 Gateway, 0 API - API tests connectivity implicitly)
  // ============================================================
  {
    id: 'conn-anthropic',
    name: 'Anthropic',
    description: 'Connect via claude-haiku-4.5',
    category: 'connectivity',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'conn-openai',
    name: 'OpenAI',
    description: 'Connect via gpt-4o-mini',
    category: 'connectivity',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },
  {
    id: 'conn-google',
    name: 'Google',
    description: 'Connect via gemini-2.5-flash-lite',
    category: 'connectivity',
    gateway: 'pass',
    api: 'pass',
    providers: ['google'],
  },
  {
    id: 'conn-perplexity',
    name: 'Perplexity',
    description: 'Connect via sonar',
    category: 'connectivity',
    gateway: 'pass',
    api: 'pass',
    providers: ['perplexity'],
  },
  {
    id: 'conn-morph',
    name: 'Morph',
    description: 'Connect via morph-v3-fast',
    category: 'connectivity',
    gateway: 'pass',
    api: 'pass',
    providers: ['morph'],
  },

  // ============================================================
  // AUTHENTICATION (0 Gateway, 4 API)
  // ============================================================
  {
    id: 'auth-valid',
    name: 'Valid API Key',
    description: 'Accept valid lyr_live_xxx keys',
    category: 'auth',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'auth-missing',
    name: 'Missing Key',
    description: 'Reject requests without Authorization header',
    category: 'auth',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'auth-invalid-format',
    name: 'Invalid Format',
    description: 'Reject keys without lyr_live_ prefix',
    category: 'auth',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'auth-nonexistent',
    name: 'Non-existent Key',
    description: 'Reject keys not in database',
    category: 'auth',
    gateway: 'skip',
    api: 'pass',
  },

  // ============================================================
  // CREDITS (0 Gateway, 3 API)
  // ============================================================
  {
    id: 'credits-used',
    name: 'Credits Used',
    description: 'Return credits_used in response.layers',
    category: 'credits',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'credits-latency',
    name: 'Latency Tracking',
    description: 'Return latency_ms in response.layers',
    category: 'credits',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'credits-tokens',
    name: 'Token Counts',
    description: 'Return prompt/completion/total token counts',
    category: 'credits',
    gateway: 'skip',
    api: 'pass',
  },

  // ============================================================
  // RATE LIMITS (0 Gateway, 3 API)
  // ============================================================
  {
    id: 'rate-limit',
    name: 'X-RateLimit-Limit',
    description: 'Return rate limit in headers',
    category: 'rate-limits',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'rate-remaining',
    name: 'X-RateLimit-Remaining',
    description: 'Return remaining requests in headers',
    category: 'rate-limits',
    gateway: 'skip',
    api: 'pass',
  },
  {
    id: 'rate-reset',
    name: 'X-RateLimit-Reset',
    description: 'Return reset timestamp in headers',
    category: 'rate-limits',
    gateway: 'skip',
    api: 'pass',
  },

  // ============================================================
  // TEXT GENERATION (1 Gateway, 4 API)
  // ============================================================
  {
    id: 'text-claude',
    name: 'Claude Text',
    description: 'Generate text with claude-haiku-4.5',
    category: 'text',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'text-gpt',
    name: 'GPT-4o Text',
    description: 'Generate text with gpt-4o-mini',
    category: 'text',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },
  {
    id: 'text-perplexity',
    name: 'Perplexity Text',
    description: 'Generate text with sonar',
    category: 'text',
    gateway: 'pass',
    api: 'pass',
    providers: ['perplexity'],
  },
  {
    id: 'text-morph',
    name: 'Morph Text',
    description: 'Generate text with morph-v3-fast',
    category: 'text',
    gateway: 'pass',
    api: 'pass',
    providers: ['morph'],
  },

  // ============================================================
  // VISION (2 Gateway, 2 API)
  // ============================================================
  {
    id: 'vision-claude',
    name: 'Claude Vision',
    description: 'Process images with Claude',
    category: 'vision',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'vision-gpt',
    name: 'GPT-4o Vision',
    description: 'Process images with GPT-4o',
    category: 'vision',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },

  // ============================================================
  // TOOLS (2 Gateway, 2 API)
  // ============================================================
  {
    id: 'tools-claude',
    name: 'Claude Tools',
    description: 'Function calling with Claude',
    category: 'tools',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'tools-gpt',
    name: 'GPT-4o Tools',
    description: 'Function calling with GPT-4o',
    category: 'tools',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },

  // ============================================================
  // JSON MODE (2 Gateway, 2 API)
  // ============================================================
  {
    id: 'json-claude',
    name: 'Claude JSON',
    description: 'Structured output with Claude',
    category: 'json',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'json-gpt',
    name: 'GPT-4o JSON',
    description: 'Structured output with GPT-4o',
    category: 'json',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },

  // ============================================================
  // STREAMING (2 Gateway, 1 API)
  // ============================================================
  {
    id: 'stream-claude',
    name: 'Claude Streaming',
    description: 'Stream responses from Claude',
    category: 'streaming',
    gateway: 'pass',
    api: 'pass',
    providers: ['anthropic'],
  },
  {
    id: 'stream-gpt',
    name: 'GPT-4o Streaming',
    description: 'Stream responses from GPT-4o',
    category: 'streaming',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },

  // ============================================================
  // THINKING (2 Gateway, 3 API)
  // ============================================================
  {
    id: 'thinking-gpt5',
    name: 'GPT-5.1 Thinking',
    description: 'Reasoning with GPT-5.1-thinking',
    category: 'thinking',
    gateway: 'pass',
    api: 'pass',
    providers: ['openai'],
  },
  {
    id: 'thinking-perplexity',
    name: 'Perplexity Reasoning',
    description: 'Reasoning with sonar-reasoning-pro',
    category: 'thinking',
    gateway: 'pass',
    api: 'pass',
    providers: ['perplexity'],
  },
  {
    id: 'thinking-claude',
    name: 'Claude Thinking',
    description: 'Extended thinking with anthropic options',
    category: 'thinking',
    gateway: 'skip',
    api: 'pass',
    providers: ['anthropic'],
  },

  // ============================================================
  // WEB SEARCH (1 Gateway, 3 API)
  // ============================================================
  {
    id: 'web-sonar',
    name: 'Sonar Search',
    description: 'Web search with Perplexity Sonar',
    category: 'web-search',
    gateway: 'pass',
    api: 'pass',
    providers: ['perplexity'],
  },
  {
    id: 'web-sonar-pro',
    name: 'Sonar Pro Search',
    description: 'Web search with Perplexity Sonar Pro',
    category: 'web-search',
    gateway: 'skip',
    api: 'pass',
    providers: ['perplexity'],
  },
  {
    id: 'web-search-param',
    name: 'web_search Parameter',
    description: 'Enable search via parameter',
    category: 'web-search',
    gateway: 'skip',
    api: 'pass',
    providers: ['perplexity'],
  },

  // ============================================================
  // CACHING (0 Gateway, 1 API)
  // ============================================================
  {
    id: 'cache-prompt',
    name: 'Prompt Caching',
    description: 'Cache parameter forwarded to gateway',
    category: 'caching',
    gateway: 'skip',
    api: 'pass',
    providers: ['anthropic'],
  },
];

// Helper functions
export function getCapabilitiesByCategory(category: string): TestCapability[] {
  return TEST_CAPABILITIES.filter((cap) => cap.category === category);
}

export function countByStatus(status: TestStatus, type: 'gateway' | 'api'): number {
  return TEST_CAPABILITIES.filter((cap) => cap[type] === status).length;
}

export function getTestSummary() {
  return {
    gateway: {
      pass: countByStatus('pass', 'gateway'),
      fail: countByStatus('fail', 'gateway'),
      skip: countByStatus('skip', 'gateway'),
    },
    api: {
      pass: countByStatus('pass', 'api'),
      fail: countByStatus('fail', 'api'),
      skip: countByStatus('skip', 'api'),
    },
    total: TEST_CAPABILITIES.length,
  };
}
