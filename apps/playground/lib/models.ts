/**
 * Model registry types and utilities
 *
 * Re-exports from @layers/models package for use in the playground
 */

// Types for model definitions
export type Provider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'xai'
  | 'deepseek'
  | 'meta'
  | 'mistral';

export type Capability =
  | 'text'
  | 'vision'
  | 'tools'
  | 'json'
  | 'image-gen'
  | 'streaming'
  | 'extended-thinking'
  | 'computer-use'
  | 'pdf';

export type ModelType = 'language' | 'embedding' | 'image';

export interface ModelPricing {
  input: number;   // Cost per 1M input tokens
  output: number;  // Cost per 1M output tokens
}

export interface ModelDefinition {
  id: string;
  provider: Provider;
  name: string;
  type: ModelType;
  capabilities: Capability[];
  contextWindow: number;
  pricing: ModelPricing;
  released: string;
  notes?: string;
  reasoningOnly?: boolean;
}

// Hardcoded model registry for the playground
// This matches what's in @layers/models package
export const MODELS: ModelDefinition[] = [
  // Anthropic Models
  {
    id: 'anthropic/claude-sonnet-4',
    provider: 'anthropic',
    name: 'Claude Sonnet 4',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming', 'computer-use', 'pdf'],
    contextWindow: 200_000,
    pricing: { input: 3, output: 15 },
    released: '2025-05',
  },
  {
    id: 'anthropic/claude-opus-4',
    provider: 'anthropic',
    name: 'Claude Opus 4',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming', 'computer-use', 'extended-thinking', 'pdf'],
    contextWindow: 200_000,
    pricing: { input: 15, output: 75 },
    released: '2025-05',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming', 'computer-use', 'pdf'],
    contextWindow: 200_000,
    pricing: { input: 3, output: 15 },
    released: '2024-06',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 200_000,
    pricing: { input: 0.8, output: 4 },
    released: '2024-10',
  },

  // OpenAI Models
  {
    id: 'openai/gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 2.5, output: 10 },
    released: '2024-05',
  },
  {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 0.15, output: 0.6 },
    released: '2024-07',
  },
  {
    id: 'openai/gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 10, output: 30 },
    released: '2024-04',
  },
  {
    id: 'openai/o1',
    provider: 'openai',
    name: 'o1',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json'],
    contextWindow: 200_000,
    pricing: { input: 15, output: 60 },
    released: '2024-12',
    notes: 'Reasoning model - streaming disabled',
    reasoningOnly: true,
  },
  {
    id: 'openai/o1-mini',
    provider: 'openai',
    name: 'o1 Mini',
    type: 'language',
    capabilities: ['text', 'tools', 'json'],
    contextWindow: 128_000,
    pricing: { input: 3, output: 12 },
    released: '2024-09',
    notes: 'Reasoning model - streaming disabled',
    reasoningOnly: true,
  },

  // Google Models
  {
    id: 'google/gemini-2.0-flash',
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 1_000_000,
    pricing: { input: 0.1, output: 0.4 },
    released: '2024-12',
  },
  {
    id: 'google/gemini-1.5-pro',
    provider: 'google',
    name: 'Gemini 1.5 Pro',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 2_000_000,
    pricing: { input: 1.25, output: 5 },
    released: '2024-05',
  },
  {
    id: 'google/gemini-1.5-flash',
    provider: 'google',
    name: 'Gemini 1.5 Flash',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 1_000_000,
    pricing: { input: 0.075, output: 0.3 },
    released: '2024-05',
  },

  // xAI Models
  {
    id: 'xai/grok-2',
    provider: 'xai',
    name: 'Grok 2',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 131_072,
    pricing: { input: 2, output: 10 },
    released: '2024-08',
  },
  {
    id: 'xai/grok-2-mini',
    provider: 'xai',
    name: 'Grok 2 Mini',
    type: 'language',
    capabilities: ['text', 'tools', 'json', 'streaming'],
    contextWindow: 131_072,
    pricing: { input: 0.2, output: 1 },
    released: '2024-08',
  },

  // DeepSeek Models
  {
    id: 'deepseek/deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    type: 'language',
    capabilities: ['text', 'tools', 'json', 'streaming'],
    contextWindow: 64_000,
    pricing: { input: 0.14, output: 0.28 },
    released: '2024-12',
  },
  {
    id: 'deepseek/deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek Reasoner',
    type: 'language',
    capabilities: ['text', 'tools', 'json'],
    contextWindow: 64_000,
    pricing: { input: 0.55, output: 2.19 },
    released: '2025-01',
    notes: 'Reasoning model - streaming disabled',
    reasoningOnly: true,
  },

  // Meta Models
  {
    id: 'meta/llama-3.3-70b',
    provider: 'meta',
    name: 'Llama 3.3 70B',
    type: 'language',
    capabilities: ['text', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 0.8, output: 0.8 },
    released: '2024-12',
  },
  {
    id: 'meta/llama-3.2-90b-vision',
    provider: 'meta',
    name: 'Llama 3.2 90B Vision',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 0.9, output: 0.9 },
    released: '2024-09',
  },

  // Mistral Models
  {
    id: 'mistral/mistral-large',
    provider: 'mistral',
    name: 'Mistral Large',
    type: 'language',
    capabilities: ['text', 'tools', 'json', 'streaming'],
    contextWindow: 128_000,
    pricing: { input: 2, output: 6 },
    released: '2024-07',
  },
  {
    id: 'mistral/mistral-small',
    provider: 'mistral',
    name: 'Mistral Small',
    type: 'language',
    capabilities: ['text', 'tools', 'json', 'streaming'],
    contextWindow: 32_000,
    pricing: { input: 0.2, output: 0.6 },
    released: '2024-09',
  },
];

/**
 * Get model by ID
 */
export function getModel(modelId: string): ModelDefinition | undefined {
  return MODELS.find((m) => m.id === modelId);
}

/**
 * Get all models for a provider
 */
export function getModelsByProvider(provider: Provider): ModelDefinition[] {
  return MODELS.filter((m) => m.provider === provider);
}

/**
 * Get models with a specific capability
 */
export function getModelsWithCapability(capability: Capability): ModelDefinition[] {
  return MODELS.filter((m) => m.capabilities.includes(capability));
}

/**
 * Filter models by criteria
 */
export function filterModels(filters: {
  provider?: Provider;
  capability?: Capability;
  maxInputPrice?: number;
  minContext?: number;
}): ModelDefinition[] {
  return MODELS.filter((m) => {
    if (filters.provider && m.provider !== filters.provider) return false;
    if (filters.capability && !m.capabilities.includes(filters.capability)) return false;
    if (filters.maxInputPrice && m.pricing.input > filters.maxInputPrice) return false;
    if (filters.minContext && m.contextWindow < filters.minContext) return false;
    return true;
  });
}

/**
 * Get unique providers from models
 */
export function getProviders(): Provider[] {
  return [...new Set(MODELS.map((m) => m.provider))];
}

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  meta: 'Meta',
  mistral: 'Mistral',
};

/**
 * Capability display names and descriptions
 */
export const CAPABILITY_INFO: Record<Capability, { label: string; description: string }> = {
  text: { label: 'Text', description: 'Text generation and understanding' },
  vision: { label: 'Vision', description: 'Image understanding and analysis' },
  tools: { label: 'Tools', description: 'Function calling / tool use' },
  json: { label: 'JSON', description: 'Structured JSON output' },
  'image-gen': { label: 'Image Gen', description: 'Image generation' },
  streaming: { label: 'Streaming', description: 'Token-by-token streaming' },
  'extended-thinking': { label: 'Extended Thinking', description: 'Visible reasoning process' },
  'computer-use': { label: 'Computer Use', description: 'Desktop automation' },
  pdf: { label: 'PDF', description: 'PDF document processing' },
};
