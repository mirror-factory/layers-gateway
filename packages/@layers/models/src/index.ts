/**
 * @layers/models
 *
 * AI model registry with capabilities and pricing for Layers platform.
 * Contains 54 models across 7 providers, sourced from Vercel AI Gateway.
 *
 * @example
 * ```ts
 * import {
 *   getModel,
 *   getModelsByProvider,
 *   getModelsWithCapability,
 *   filterModels,
 *   calculateCredits,
 * } from '@layers/models';
 *
 * // Get a specific model
 * const claude = getModel('anthropic/claude-sonnet-4.5');
 * console.log(claude.capabilities); // ['text', 'vision', 'tools', ...]
 *
 * // Find all models with vision
 * const visionModels = getModelsWithCapability('vision');
 *
 * // Find cheapest model with tools + json
 * const cheapest = filterModels({
 *   capabilities: ['tools', 'json'],
 * }).sort((a, b) => a.pricing.input - b.pricing.input)[0];
 *
 * // Calculate credits for usage
 * const credits = calculateCredits('anthropic/claude-sonnet-4.5', 2000, 1000);
 * // => ~3.4 credits at 60% margin
 * ```
 *
 * @packageDocumentation
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
  type ModelId,
} from './registry';

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
