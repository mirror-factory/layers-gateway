/**
 * Model registry types and utilities
 *
 * Imports from local models module.
 *
 * DO NOT hardcode models here - use the registry instead.
 */

// Re-export types from local models
export type {
  Provider,
  Capability,
  ModelType,
  ModelPricing,
  ModelDefinition,
} from './models/index';

// Import registry and helpers from local models
import {
  MODEL_REGISTRY,
  MODEL_IDS,
  MODEL_COUNT,
  getModel,
  getModelSafe,
  getModelsByProvider,
  getModelsWithCapability,
  getProviders,
  getAllModels,
  type ModelId,
  type ModelDefinition,
  type Provider,
  type Capability,
} from './models/index';

// Re-export everything we need
export {
  MODEL_REGISTRY,
  MODEL_IDS,
  MODEL_COUNT,
  getModel,
  getModelSafe,
  getModelsByProvider,
  getModelsWithCapability,
  getProviders,
};

/**
 * Array of all models for the playground dropdown
 * Converted from registry object to array format
 */
export const MODELS: ModelDefinition[] = getAllModels();

/**
 * Filter models by criteria (playground-specific interface)
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
 * Provider display names (only active providers)
 */
export const PROVIDER_NAMES: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  perplexity: 'Perplexity',
  morph: 'Morph',
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
  stream: { label: 'Streaming', description: 'Token-by-token streaming' },
  thinking: { label: 'Extended Thinking', description: 'Visible reasoning process' },
  cache: { label: 'Caching', description: 'Prompt caching for efficiency' },
  pdf: { label: 'PDF', description: 'PDF document processing' },
  'audio-in': { label: 'Audio Input', description: 'Audio file processing' },
  'video-in': { label: 'Video Input', description: 'Video file processing' },
  web: { label: 'Web Search', description: 'Built-in web search capability' },
  embed: { label: 'Embeddings', description: 'Text embeddings generation' },
};
