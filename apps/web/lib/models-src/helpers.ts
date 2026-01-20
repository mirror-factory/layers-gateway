/**
 * Helper functions for querying and filtering the model registry
 */

import { MODEL_REGISTRY, MODEL_IDS, type ModelId } from './registry';
import type {
  Capability,
  ModelDefinition,
  ModelFilterOptions,
  Provider,
} from './types';

/**
 * Get a model definition by ID
 */
export function getModel(id: ModelId): ModelDefinition {
  return MODEL_REGISTRY[id];
}

/**
 * Get a model definition by ID (with undefined for invalid IDs)
 */
export function getModelSafe(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY[id as ModelId];
}

/**
 * Check if a model ID is valid
 */
export function isValidModelId(id: string): id is ModelId {
  return id in MODEL_REGISTRY;
}

/**
 * Get all models as an array
 */
export function getAllModels(): ModelDefinition[] {
  return MODEL_IDS.map((id) => MODEL_REGISTRY[id]);
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: Provider): ModelDefinition[] {
  return getAllModels().filter((m) => m.provider === provider);
}

/**
 * Get all models with a specific capability
 */
export function getModelsWithCapability(capability: Capability): ModelDefinition[] {
  return getAllModels().filter((m) => m.capabilities.includes(capability));
}

/**
 * Get all models with ALL specified capabilities
 */
export function getModelsWithCapabilities(capabilities: Capability[]): ModelDefinition[] {
  return getAllModels().filter((m) =>
    capabilities.every((cap) => m.capabilities.includes(cap))
  );
}

/**
 * Get all models with ANY of the specified capabilities
 */
export function getModelsWithAnyCapability(capabilities: Capability[]): ModelDefinition[] {
  return getAllModels().filter((m) =>
    capabilities.some((cap) => m.capabilities.includes(cap))
  );
}

/**
 * Filter models with multiple criteria
 */
export function filterModels(options: ModelFilterOptions): ModelDefinition[] {
  let models = getAllModels();

  // Filter by provider
  if (options.provider) {
    const providers = Array.isArray(options.provider)
      ? options.provider
      : [options.provider];
    models = models.filter((m) => providers.includes(m.provider));
  }

  // Filter by capabilities (ALL)
  if (options.capabilities?.length) {
    models = models.filter((m) =>
      options.capabilities!.every((cap) => m.capabilities.includes(cap))
    );
  }

  // Filter by capabilities (ANY)
  if (options.capabilitiesAny?.length) {
    models = models.filter((m) =>
      options.capabilitiesAny!.some((cap) => m.capabilities.includes(cap))
    );
  }

  // Filter by type
  if (options.type) {
    models = models.filter((m) => m.type === options.type);
  }

  // Filter by minimum context window
  if (options.minContextWindow) {
    models = models.filter((m) => m.contextWindow >= options.minContextWindow!);
  }

  // Filter by max input price
  if (options.maxInputPrice !== undefined) {
    models = models.filter((m) => m.pricing.input <= options.maxInputPrice!);
  }

  // Filter by max output price
  if (options.maxOutputPrice !== undefined) {
    models = models.filter((m) => m.pricing.output <= options.maxOutputPrice!);
  }

  return models;
}

/**
 * Get unique providers from all models
 */
export function getProviders(): Provider[] {
  const providers = new Set<Provider>();
  for (const model of getAllModels()) {
    providers.add(model.provider);
  }
  return Array.from(providers);
}

/**
 * Get unique capabilities across all models
 */
export function getAllCapabilities(): Capability[] {
  const capabilities = new Set<Capability>();
  for (const model of getAllModels()) {
    for (const cap of model.capabilities) {
      capabilities.add(cap);
    }
  }
  return Array.from(capabilities);
}

/**
 * Calculate cost for a given usage
 */
export function calculateCost(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModel(modelId);
  const inputCost = (inputTokens / 1000) * model.pricing.input;
  const outputCost = (outputTokens / 1000) * model.pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate credits for a given usage (at specified margin)
 *
 * @param modelId - The model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param marginPercent - Margin percentage (default 60%)
 * @returns Credits to charge
 */
export function calculateCredits(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number,
  marginPercent: number = 60
): number {
  const cost = calculateCost(modelId, inputTokens, outputTokens);
  const credits = (cost / 0.01) * (1 + marginPercent / 100);
  return credits;
}

/**
 * Get the cheapest model with specific capabilities
 */
export function getCheapestModel(capabilities: Capability[]): ModelDefinition | undefined {
  const models = getModelsWithCapabilities(capabilities);
  if (models.length === 0) return undefined;

  return models.reduce((cheapest, model) => {
    // Compare by combined input + output price (assuming equal token usage)
    const modelScore = model.pricing.input + model.pricing.output;
    const cheapestScore = cheapest.pricing.input + cheapest.pricing.output;
    return modelScore < cheapestScore ? model : cheapest;
  });
}

/**
 * Get the model with the largest context window
 */
export function getLargestContextModel(provider?: Provider): ModelDefinition | undefined {
  let models = getAllModels();
  if (provider) {
    models = models.filter((m) => m.provider === provider);
  }
  if (models.length === 0) return undefined;

  return models.reduce((largest, model) =>
    model.contextWindow > largest.contextWindow ? model : largest
  );
}

/**
 * Sort models by a specific criteria
 */
export function sortModels(
  models: ModelDefinition[],
  by: 'price' | 'context' | 'released' | 'name',
  direction: 'asc' | 'desc' = 'asc'
): ModelDefinition[] {
  const sorted = [...models];
  const multiplier = direction === 'asc' ? 1 : -1;

  switch (by) {
    case 'price':
      sorted.sort(
        (a, b) =>
          multiplier *
          (a.pricing.input + a.pricing.output - (b.pricing.input + b.pricing.output))
      );
      break;
    case 'context':
      sorted.sort((a, b) => multiplier * (a.contextWindow - b.contextWindow));
      break;
    case 'released':
      sorted.sort((a, b) => multiplier * a.released.localeCompare(b.released));
      break;
    case 'name':
      sorted.sort((a, b) => multiplier * a.name.localeCompare(b.name));
      break;
  }

  return sorted;
}
