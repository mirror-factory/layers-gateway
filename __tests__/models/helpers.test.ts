/**
 * Helpers Unit Tests
 *
 * Tests all helper functions for querying and filtering the registry.
 * No API calls - pure unit tests.
 */
import { describe, it, expect } from 'vitest';
import {
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
} from '@/lib/models/helpers';
import { MODEL_COUNT } from '@/lib/models/registry';

describe('getModel', () => {
  it('should return a model by ID', () => {
    const model = getModel('anthropic/claude-sonnet-4.5');
    expect(model.name).toBe('Claude 4.5 Sonnet');
    expect(model.provider).toBe('anthropic');
  });

  it('should return correct capabilities', () => {
    const model = getModel('openai/gpt-4o');
    expect(model.capabilities).toContain('text');
    expect(model.capabilities).toContain('vision');
    expect(model.capabilities).toContain('tools');
  });
});

describe('getModelSafe', () => {
  it('should return undefined for invalid ID', () => {
    expect(getModelSafe('invalid/model')).toBeUndefined();
    expect(getModelSafe('not-a-model')).toBeUndefined();
  });

  it('should return model for valid ID', () => {
    const model = getModelSafe('anthropic/claude-haiku-4.5');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Claude 4.5 Haiku');
  });
});

describe('isValidModelId', () => {
  it('should return true for valid IDs', () => {
    expect(isValidModelId('anthropic/claude-sonnet-4.5')).toBe(true);
    expect(isValidModelId('openai/gpt-4o')).toBe(true);
    expect(isValidModelId('google/gemini-2.5-flash')).toBe(true);
    expect(isValidModelId('perplexity/sonar')).toBe(true);
    expect(isValidModelId('morph/morph-v3-fast')).toBe(true);
  });

  it('should return false for invalid IDs', () => {
    expect(isValidModelId('invalid')).toBe(false);
    expect(isValidModelId('openai/gpt-3')).toBe(false);
    expect(isValidModelId('anthropic/claude-1')).toBe(false);
    expect(isValidModelId('')).toBe(false);
  });
});

describe('getAllModels', () => {
  it('should return all 23 models', () => {
    const models = getAllModels();
    expect(models.length).toBe(MODEL_COUNT);
    expect(models.length).toBe(23); // o3 removed
  });

  it('should return ModelDefinition objects', () => {
    const models = getAllModels();
    for (const model of models) {
      expect(model).toHaveProperty('id');
      expect(model).toHaveProperty('provider');
      expect(model).toHaveProperty('name');
      expect(model).toHaveProperty('capabilities');
      expect(model).toHaveProperty('pricing');
    }
  });
});

describe('getModelsByProvider', () => {
  it('should return 3 Anthropic models', () => {
    const models = getModelsByProvider('anthropic');
    expect(models.length).toBe(3);
    expect(models.every((m) => m.provider === 'anthropic')).toBe(true);
  });

  it('should return 8 OpenAI models', () => {
    const models = getModelsByProvider('openai');
    expect(models.length).toBe(8); // o3 removed
  });

  it('should return 7 Google models', () => {
    const models = getModelsByProvider('google');
    expect(models.length).toBe(7);
  });

  it('should return 3 Perplexity models', () => {
    const models = getModelsByProvider('perplexity');
    expect(models.length).toBe(3);
  });

  it('should return 2 Morph models', () => {
    const models = getModelsByProvider('morph');
    expect(models.length).toBe(2);
  });
});

describe('getModelsWithCapability', () => {
  it('should return models with text capability', () => {
    const models = getModelsWithCapability('text');
    expect(models.length).toBeGreaterThan(10);
    expect(models.every((m) => m.capabilities.includes('text'))).toBe(true);
  });

  it('should return models with vision capability', () => {
    const models = getModelsWithCapability('vision');
    expect(models.length).toBeGreaterThan(5);
    expect(models.every((m) => m.capabilities.includes('vision'))).toBe(true);
  });

  it('should return models with web capability (Perplexity)', () => {
    const models = getModelsWithCapability('web');
    expect(models.length).toBe(3);
    expect(models.every((m) => m.provider === 'perplexity')).toBe(true);
  });

  it('should return models with thinking capability', () => {
    const models = getModelsWithCapability('thinking');
    expect(models.length).toBeGreaterThan(3);
    // Should include Claude Sonnet/Opus, OpenAI thinking models, etc.
    const hasAnthropic = models.some((m) => m.provider === 'anthropic');
    const hasOpenAI = models.some((m) => m.provider === 'openai');
    expect(hasAnthropic).toBe(true);
    expect(hasOpenAI).toBe(true);
  });
});

describe('getModelsWithCapabilities', () => {
  it('should return models with both text AND vision', () => {
    const models = getModelsWithCapabilities(['text', 'vision']);
    expect(models.length).toBeGreaterThan(5);
    expect(
      models.every((m) => m.capabilities.includes('text') && m.capabilities.includes('vision'))
    ).toBe(true);
  });

  it('should return models with text, tools, and json', () => {
    const models = getModelsWithCapabilities(['text', 'tools', 'json']);
    expect(models.length).toBeGreaterThan(3);
    for (const model of models) {
      expect(model.capabilities).toContain('text');
      expect(model.capabilities).toContain('tools');
      expect(model.capabilities).toContain('json');
    }
  });

  it('should return empty for impossible combination', () => {
    // No model has both 'web' (Perplexity only) and 'cache' (Anthropic only)
    const models = getModelsWithCapabilities(['web', 'cache']);
    expect(models.length).toBe(0);
  });
});

describe('getModelsWithAnyCapability', () => {
  it('should return models with thinking OR web', () => {
    const models = getModelsWithAnyCapability(['thinking', 'web']);
    expect(models.length).toBeGreaterThan(5);
    expect(
      models.every((m) => m.capabilities.includes('thinking') || m.capabilities.includes('web'))
    ).toBe(true);
  });

  it('should return more results than AND query', () => {
    const anyModels = getModelsWithAnyCapability(['vision', 'tools']);
    const allModels = getModelsWithCapabilities(['vision', 'tools']);
    expect(anyModels.length).toBeGreaterThanOrEqual(allModels.length);
  });
});

describe('filterModels', () => {
  it('should filter by single provider', () => {
    const models = filterModels({ provider: 'anthropic' });
    expect(models.length).toBe(3);
    expect(models.every((m) => m.provider === 'anthropic')).toBe(true);
  });

  it('should filter by multiple providers', () => {
    const models = filterModels({ provider: ['anthropic', 'openai'] });
    expect(models.length).toBe(11); // 3 + 8 (o3 removed)
    expect(models.every((m) => m.provider === 'anthropic' || m.provider === 'openai')).toBe(true);
  });

  it('should filter by capabilities (ALL)', () => {
    const models = filterModels({ capabilities: ['vision', 'tools'] });
    expect(models.length).toBeGreaterThan(3);
    for (const model of models) {
      expect(model.capabilities).toContain('vision');
      expect(model.capabilities).toContain('tools');
    }
  });

  it('should filter by capabilitiesAny', () => {
    const models = filterModels({ capabilitiesAny: ['web', 'cache'] });
    // Perplexity has web, Anthropic has cache
    expect(models.length).toBe(6); // 3 Perplexity + 3 Anthropic
  });

  it('should filter by minimum context window', () => {
    const models = filterModels({ minContextWindow: 500_000 });
    expect(models.length).toBeGreaterThan(3);
    expect(models.every((m) => m.contextWindow >= 500_000)).toBe(true);
  });

  it('should filter by max input price', () => {
    const models = filterModels({ maxInputPrice: 0.001 });
    expect(models.length).toBeGreaterThan(3);
    expect(models.every((m) => m.pricing.input <= 0.001)).toBe(true);
  });

  it('should combine multiple filters', () => {
    const models = filterModels({
      provider: 'anthropic',
      capabilities: ['vision'],
      maxInputPrice: 0.003,
    });
    // All 3 Anthropic models have vision, but only Haiku and Sonnet are under $0.003
    expect(models.length).toBe(2);
  });
});

describe('getProviders', () => {
  it('should return all 5 providers', () => {
    const providers = getProviders();
    expect(providers.length).toBe(5);
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('google');
    expect(providers).toContain('perplexity');
    expect(providers).toContain('morph');
  });
});

describe('getAllCapabilities', () => {
  it('should return all unique capabilities', () => {
    const caps = getAllCapabilities();
    expect(caps).toContain('text');
    expect(caps).toContain('vision');
    expect(caps).toContain('tools');
    expect(caps).toContain('json');
    expect(caps).toContain('stream');
    expect(caps).toContain('cache');
    expect(caps).toContain('thinking');
    expect(caps).toContain('web');
    expect(caps).toContain('image-gen');
    expect(caps).toContain('audio-in');
    expect(caps).toContain('video-in');
    expect(caps).toContain('pdf');
  });
});

describe('calculateCost', () => {
  it('should calculate cost correctly', () => {
    // Claude Haiku: $0.001 input, $0.005 output per 1K
    const cost = calculateCost('anthropic/claude-haiku-4.5', 1000, 1000);
    expect(cost).toBeCloseTo(0.006, 5);
  });

  it('should scale with token count', () => {
    const cost1k = calculateCost('anthropic/claude-haiku-4.5', 1000, 1000);
    const cost2k = calculateCost('anthropic/claude-haiku-4.5', 2000, 2000);
    expect(cost2k).toBeCloseTo(cost1k * 2, 5);
  });

  it('should handle zero output tokens', () => {
    const cost = calculateCost('anthropic/claude-haiku-4.5', 1000, 0);
    expect(cost).toBeCloseTo(0.001, 5);
  });
});

describe('calculateCredits', () => {
  it('should apply 60% margin by default', () => {
    // Cost for 1K in, 1K out on Haiku = $0.006
    // At 60% margin: 0.006 / 0.01 * 1.6 = 0.96 credits
    const credits = calculateCredits('anthropic/claude-haiku-4.5', 1000, 1000);
    expect(credits).toBeCloseTo(0.96, 2);
  });

  it('should apply custom margin', () => {
    // Cost = $0.006
    // At 100% margin: 0.006 / 0.01 * 2.0 = 1.2 credits
    const credits = calculateCredits('anthropic/claude-haiku-4.5', 1000, 1000, 100);
    expect(credits).toBeCloseTo(1.2, 2);
  });

  it('should work with zero margin', () => {
    // Cost = $0.006, at 0% margin = 0.6 credits
    const credits = calculateCredits('anthropic/claude-haiku-4.5', 1000, 1000, 0);
    expect(credits).toBeCloseTo(0.6, 2);
  });
});

describe('getCheapestModel', () => {
  it('should return cheapest model with text capability', () => {
    const cheapest = getCheapestModel(['text']);
    expect(cheapest).toBeDefined();
    // GPT-4o-mini or similar should be very cheap
    expect(cheapest!.pricing.input + cheapest!.pricing.output).toBeLessThan(0.002);
  });

  it('should return undefined for impossible requirements', () => {
    // No model has both web and cache
    const cheapest = getCheapestModel(['web', 'cache']);
    expect(cheapest).toBeUndefined();
  });

  it('should return cheapest vision model', () => {
    const cheapest = getCheapestModel(['vision']);
    expect(cheapest).toBeDefined();
    expect(cheapest!.capabilities).toContain('vision');
  });
});

describe('getLargestContextModel', () => {
  it('should return model with largest context', () => {
    const largest = getLargestContextModel();
    expect(largest).toBeDefined();
    expect(largest!.contextWindow).toBeGreaterThanOrEqual(1_000_000);
  });

  it('should filter by provider', () => {
    const largestAnthropic = getLargestContextModel('anthropic');
    expect(largestAnthropic).toBeDefined();
    expect(largestAnthropic!.provider).toBe('anthropic');
    expect(largestAnthropic!.contextWindow).toBe(200_000);
  });

  it('should return undefined for non-existent provider', () => {
    // @ts-expect-error Testing invalid provider
    const model = getLargestContextModel('invalid');
    expect(model).toBeUndefined();
  });
});

describe('sortModels', () => {
  it('should sort by price ascending', () => {
    const models = getAllModels();
    const sorted = sortModels(models, 'price', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      const prevPrice = sorted[i - 1].pricing.input + sorted[i - 1].pricing.output;
      const currPrice = sorted[i].pricing.input + sorted[i].pricing.output;
      expect(currPrice).toBeGreaterThanOrEqual(prevPrice);
    }
  });

  it('should sort by price descending', () => {
    const models = getAllModels();
    const sorted = sortModels(models, 'price', 'desc');
    for (let i = 1; i < sorted.length; i++) {
      const prevPrice = sorted[i - 1].pricing.input + sorted[i - 1].pricing.output;
      const currPrice = sorted[i].pricing.input + sorted[i].pricing.output;
      expect(currPrice).toBeLessThanOrEqual(prevPrice);
    }
  });

  it('should sort by context ascending', () => {
    const models = getAllModels();
    const sorted = sortModels(models, 'context', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].contextWindow).toBeGreaterThanOrEqual(sorted[i - 1].contextWindow);
    }
  });

  it('should sort by name', () => {
    const models = getAllModels();
    const sorted = sortModels(models, 'name', 'asc');
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].name.localeCompare(sorted[i - 1].name)).toBeGreaterThanOrEqual(0);
    }
  });

  it('should not mutate original array', () => {
    const models = getAllModels();
    const originalFirst = models[0].id;
    sortModels(models, 'price', 'desc');
    expect(models[0].id).toBe(originalFirst);
  });
});
