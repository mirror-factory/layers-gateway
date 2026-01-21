/**
 * AI Model Registry for Layers Platform
 *
 * Contains all supported models across providers with capabilities and pricing.
 */

// Types
export type {
  Provider,
  Capability,
  ModelType,
  ModelPricing,
  ModelDefinition,
  ModelRegistry,
  ModelFilterOptions,
} from './types';

// Registry
export {
  MODEL_REGISTRY,
  MODEL_IDS,
  MODEL_COUNT,
  MODELS_BY_PROVIDER,
  PROVIDER_MODEL_COUNTS,
  REASONING_ONLY_MODELS,
  IMAGE_GEN_MODELS,
} from './registry';
export type { ModelId } from './registry';

// Helpers
export {
  getModel,
  getModelSafe,
  isValidModelId,
  getAllModels,
  getModelsByProvider,
  getModelsWithCapability,
  getModelsWithCapabilities,
  getModelsWithAnyCapability,
  filterModels,
  getProviders,
  getAllCapabilities,
  calculateCost,
  calculateCredits,
  getCheapestModel,
  getLargestContextModel,
  sortModels,
} from './helpers';
