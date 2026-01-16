/**
 * AI Model Registry for Layers Platform
 *
 * Contains all 24 supported models across 5 providers.
 * Data sourced from Vercel AI Gateway testing (134/134 tests passing).
 *
 * Removed providers (gateway issues, unnecessary for MVP):
 * - xAI/Grok (9 models) - vision bugs via gateway
 * - DeepSeek (7 models) - no JSON schema support
 *
 * Removed model types (gateway incompatible):
 * - Embeddings (4) - gateway returns LanguageModel, not EmbeddingModel
 * - Imagen (3) - requires separate API, not generateText
 *
 * @see /home/dev/repos/mirror-factory/docs/RALPH-REGISTRY.md
 * @see https://ai-gateway.vercel.sh/v1/models
 */

import type { ModelDefinition, ModelRegistry } from './types';

/**
 * Complete model registry with all supported models
 *
 * Last Updated: 2026-01-14
 * Models: 24 across 5 providers
 * - Anthropic: 3
 * - OpenAI: 9
 * - Google: 7
 * - Perplexity: 3
 * - Morph: 2
 */
export const MODEL_REGISTRY: ModelRegistry = {
  // ============================================================================
  // ANTHROPIC (3 models) - Claude 4.5 series
  // All capabilities verified via gateway testing
  // ============================================================================

  'anthropic/claude-haiku-4.5': {
    id: 'anthropic/claude-haiku-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Haiku',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream', 'cache'],
    contextWindow: 200_000,
    pricing: { input: 0.001, output: 0.005 },
    released: '2025-10',
    notes: 'Fast, affordable. Best for quick tasks.',
  },

  'anthropic/claude-sonnet-4.5': {
    id: 'anthropic/claude-sonnet-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Sonnet',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream', 'cache', 'thinking'],
    contextWindow: 200_000,
    pricing: { input: 0.003, output: 0.015 },
    released: '2025-09',
    notes: 'Best coding model. Extended thinking available.',
  },

  'anthropic/claude-opus-4.5': {
    id: 'anthropic/claude-opus-4.5',
    provider: 'anthropic',
    name: 'Claude 4.5 Opus',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream', 'cache', 'thinking'],
    contextWindow: 200_000,
    pricing: { input: 0.005, output: 0.025 },
    released: '2025-11',
    notes: 'Latest flagship. Maximum capability.',
  },

  // ============================================================================
  // OPENAI (12 models) - GPT-4o, GPT-5.x, o-series
  // Note: GPT-5 base models (gpt-5, mini, nano, pro) removed - no gateway response
  // Note: gpt-5.1-codex-max removed - intermittent failures
  // Note: Embeddings removed - gateway incompatible
  // ============================================================================

  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream'],
    contextWindow: 128_000,
    pricing: { input: 0.0025, output: 0.01 },
    released: '2024-05',
    notes: 'Multimodal flagship. Great all-rounder.',
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream'],
    contextWindow: 128_000,
    pricing: { input: 0.0001, output: 0.0006 },
    released: '2024-07',
    notes: 'Fast and affordable. Good for simple tasks.',
  },

  'openai/gpt-5-chat': {
    id: 'openai/gpt-5-chat',
    provider: 'openai',
    name: 'GPT-5 Chat',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream'],
    contextWindow: 128_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-08',
    notes: 'Chat-optimized GPT-5 variant.',
  },

  'openai/gpt-5-codex': {
    id: 'openai/gpt-5-codex',
    provider: 'openai',
    name: 'GPT-5 Codex',
    type: 'language',
    capabilities: ['tools', 'json', 'stream'],
    contextWindow: 400_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-08',
    notes: 'Code-focused. Use tools/json, not plain text prompts.',
  },

  'openai/gpt-5.1-codex': {
    id: 'openai/gpt-5.1-codex',
    provider: 'openai',
    name: 'GPT-5.1 Codex',
    type: 'language',
    capabilities: ['tools', 'json', 'stream'],
    contextWindow: 400_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-11',
    notes: 'Updated Codex. Best for code generation.',
  },

  'openai/gpt-5.1-codex-mini': {
    id: 'openai/gpt-5.1-codex-mini',
    provider: 'openai',
    name: 'GPT-5.1 Codex Mini',
    type: 'language',
    capabilities: ['tools', 'json', 'stream'],
    contextWindow: 400_000,
    pricing: { input: 0.0003, output: 0.002 },
    released: '2025-11',
    notes: 'Fast Codex for simple code tasks.',
  },

  'openai/gpt-5.1-instant': {
    id: 'openai/gpt-5.1-instant',
    provider: 'openai',
    name: 'GPT-5.1 Instant',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream'],
    contextWindow: 128_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-11',
    notes: 'Low latency. Best for real-time applications.',
  },

  'openai/gpt-5.1-thinking': {
    id: 'openai/gpt-5.1-thinking',
    provider: 'openai',
    name: 'GPT-5.1 Thinking',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'stream', 'thinking'],
    contextWindow: 400_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-11',
    notes: 'Reasoning mode. Use for complex problems.',
  },

  // Note: o3, o3-mini, o4-mini removed - OpenAI reasoning models not needed for MVP
  // Use gpt-5.1-thinking for reasoning needs instead

  // ============================================================================
  // GOOGLE (8 models) - Gemini 2.5+, 3.x
  // Note: Imagen models removed - require separate API
  // Note: Embeddings removed - gateway incompatible
  // Note: stream capability unreliable via gateway (returns 1 chunk)
  // ============================================================================

  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    type: 'language',
    capabilities: ['text', 'vision', 'audio-in', 'video-in', 'tools', 'json'],
    contextWindow: 1_000_000,
    pricing: { input: 0.0003, output: 0.0025 },
    released: '2025-03',
    notes: 'Fast multimodal. 1M context. Stream unreliable via gateway.',
  },

  'google/gemini-2.5-flash-lite': {
    id: 'google/gemini-2.5-flash-lite',
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite',
    type: 'language',
    capabilities: ['text', 'vision', 'json'],
    contextWindow: 1_000_000,
    pricing: { input: 0.0001, output: 0.0004 },
    released: '2025-03',
    notes: 'Lightest Gemini. Maximum affordability.',
  },

  'google/gemini-2.5-flash-image': {
    id: 'google/gemini-2.5-flash-image',
    provider: 'google',
    name: 'Gemini 2.5 Flash Image',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'image-gen'],
    contextWindow: 1_000_000,
    pricing: { input: 0.0003, output: 0.0025 },
    released: '2025-03',
    notes: 'Image generation via responseModalities. Native multimodal output.',
  },

  'google/gemini-2.5-pro': {
    id: 'google/gemini-2.5-pro',
    provider: 'google',
    name: 'Gemini 2.5 Pro',
    type: 'language',
    capabilities: ['text', 'vision', 'audio-in', 'video-in', 'pdf', 'tools', 'json', 'thinking'],
    contextWindow: 1_000_000,
    pricing: { input: 0.0013, output: 0.01 },
    released: '2025-03',
    notes: 'Most capable 2.5. Native PDF, thinking mode.',
  },

  'google/gemini-3-flash': {
    id: 'google/gemini-3-flash',
    provider: 'google',
    name: 'Gemini 3 Flash',
    type: 'language',
    capabilities: ['vision', 'audio-in', 'video-in', 'tools', 'json'],
    contextWindow: 1_000_000,
    pricing: { input: 0.0005, output: 0.003 },
    released: '2025-12',
    notes: 'Default in Gemini app. Text intermittent via gateway.',
  },

  'google/gemini-3-pro-preview': {
    id: 'google/gemini-3-pro-preview',
    provider: 'google',
    name: 'Gemini 3 Pro Preview',
    type: 'language',
    capabilities: ['text', 'audio-in', 'video-in', 'pdf', 'tools', 'json', 'thinking'],
    contextWindow: 1_000_000,
    pricing: { input: 0.002, output: 0.012 },
    released: '2025-12',
    notes: 'Preview flagship. Vision unreliable via gateway.',
  },

  'google/gemini-3-pro-image': {
    id: 'google/gemini-3-pro-image',
    provider: 'google',
    name: 'Gemini 3 Pro Image',
    type: 'language',
    capabilities: ['text', 'vision', 'tools', 'json', 'image-gen'],
    contextWindow: 65_000,
    pricing: { input: 0.002, output: 0.12 },
    released: '2025-12',
    notes: 'Image generation. Higher output cost for image tokens.',
  },

  // ============================================================================
  // PERPLEXITY (2 models) - Sonar search
  // Note: sonar-reasoning deprecated, merged into sonar-reasoning-pro
  // Note: text capability unreliable - returns clarifications not answers
  // ============================================================================

  'perplexity/sonar': {
    id: 'perplexity/sonar',
    provider: 'perplexity',
    name: 'Sonar',
    type: 'language',
    capabilities: ['web', 'json', 'stream'],
    contextWindow: 127_000,
    pricing: { input: 0.001, output: 0.001 },
    released: '2025-02',
    notes: 'Web search. May return clarifications instead of direct text.',
  },

  'perplexity/sonar-pro': {
    id: 'perplexity/sonar-pro',
    provider: 'perplexity',
    name: 'Sonar Pro',
    type: 'language',
    capabilities: ['web', 'json', 'stream'],
    contextWindow: 200_000,
    pricing: { input: 0.003, output: 0.015 },
    released: '2025-02',
    notes: 'Better search. Larger context for complex queries.',
  },

  'perplexity/sonar-reasoning-pro': {
    id: 'perplexity/sonar-reasoning-pro',
    provider: 'perplexity',
    name: 'Sonar Reasoning Pro',
    type: 'language',
    capabilities: ['web', 'thinking'],
    contextWindow: 127_000,
    pricing: { input: 0.002, output: 0.008 },
    released: '2025-02',
    notes: 'Reasoning + web search. Best for research questions.',
    reasoningOnly: true,
  },

  // ============================================================================
  // MORPH (2 models) - Fast editing
  // Simple text-only models, reliable via gateway
  // ============================================================================

  'morph/morph-v3-fast': {
    id: 'morph/morph-v3-fast',
    provider: 'morph',
    name: 'Morph V3 Fast',
    type: 'language',
    capabilities: ['text', 'stream'],
    contextWindow: 81_000,
    pricing: { input: 0.0008, output: 0.0012 },
    released: '2025-07',
    notes: 'Fast editing. Good for quick text transformations.',
  },

  'morph/morph-v3-large': {
    id: 'morph/morph-v3-large',
    provider: 'morph',
    name: 'Morph V3 Large',
    type: 'language',
    capabilities: ['text', 'stream'],
    contextWindow: 81_000,
    pricing: { input: 0.0009, output: 0.0019 },
    released: '2025-07',
    notes: '10,500 tokens/sec. Fastest output generation.',
  },
} as const;

/**
 * All model IDs as a union type
 */
export type ModelId = keyof typeof MODEL_REGISTRY;

/**
 * Array of all model IDs
 */
export const MODEL_IDS = Object.keys(MODEL_REGISTRY) as ModelId[];

/**
 * Total number of models
 */
export const MODEL_COUNT = MODEL_IDS.length;

/**
 * Models grouped by provider
 */
export const MODELS_BY_PROVIDER = {
  anthropic: MODEL_IDS.filter(id => MODEL_REGISTRY[id].provider === 'anthropic'),
  openai: MODEL_IDS.filter(id => MODEL_REGISTRY[id].provider === 'openai'),
  google: MODEL_IDS.filter(id => MODEL_REGISTRY[id].provider === 'google'),
  perplexity: MODEL_IDS.filter(id => MODEL_REGISTRY[id].provider === 'perplexity'),
  morph: MODEL_IDS.filter(id => MODEL_REGISTRY[id].provider === 'morph'),
} as const;

/**
 * Count of models per provider
 */
export const PROVIDER_MODEL_COUNTS = {
  anthropic: MODELS_BY_PROVIDER.anthropic.length,
  openai: MODELS_BY_PROVIDER.openai.length,
  google: MODELS_BY_PROVIDER.google.length,
  perplexity: MODELS_BY_PROVIDER.perplexity.length,
  morph: MODELS_BY_PROVIDER.morph.length,
} as const;

/**
 * Reasoning-only models (need special handling)
 */
export const REASONING_ONLY_MODELS = MODEL_IDS.filter(
  id => MODEL_REGISTRY[id].reasoningOnly === true
);

/**
 * Models with image generation capability
 */
export const IMAGE_GEN_MODELS = MODEL_IDS.filter(
  id => MODEL_REGISTRY[id].capabilities.includes('image-gen')
);
