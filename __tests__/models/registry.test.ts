/**
 * Registry Unit Tests
 *
 * Tests the model registry data integrity and structure.
 * No API calls - pure unit tests.
 */
import { describe, it, expect } from 'vitest';
import {
  MODEL_REGISTRY,
  MODEL_IDS,
  MODEL_COUNT,
  MODELS_BY_PROVIDER,
  PROVIDER_MODEL_COUNTS,
  REASONING_ONLY_MODELS,
  IMAGE_GEN_MODELS,
} from '@/lib/models/registry';
import type { ModelDefinition, Capability, Provider } from '@/lib/models/types';

describe('MODEL_REGISTRY', () => {
  it('should contain 23 models', () => {
    expect(MODEL_COUNT).toBe(23);
    expect(MODEL_IDS.length).toBe(23);
    expect(Object.keys(MODEL_REGISTRY).length).toBe(23);
  });

  it('should have models from 5 providers', () => {
    const providers = new Set(MODEL_IDS.map((id) => MODEL_REGISTRY[id].provider));
    expect(providers.size).toBe(5);
    expect(providers).toContain('anthropic');
    expect(providers).toContain('openai');
    expect(providers).toContain('google');
    expect(providers).toContain('perplexity');
    expect(providers).toContain('morph');
  });

  it('should have correct provider counts', () => {
    expect(PROVIDER_MODEL_COUNTS.anthropic).toBe(3);
    expect(PROVIDER_MODEL_COUNTS.openai).toBe(8); // o3 removed
    expect(PROVIDER_MODEL_COUNTS.google).toBe(7);
    expect(PROVIDER_MODEL_COUNTS.perplexity).toBe(3);
    expect(PROVIDER_MODEL_COUNTS.morph).toBe(2);
  });

  it('should have all required fields for each model', () => {
    for (const id of MODEL_IDS) {
      const model = MODEL_REGISTRY[id];
      expect(model.id).toBe(id);
      expect(model.provider).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.type).toBe('language'); // All are language models now
      expect(Array.isArray(model.capabilities)).toBe(true);
      expect(model.capabilities.length).toBeGreaterThan(0);
      expect(model.contextWindow).toBeGreaterThan(0);
      expect(model.pricing.input).toBeGreaterThanOrEqual(0);
      expect(model.pricing.output).toBeGreaterThanOrEqual(0);
      expect(model.released).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('should have model IDs matching provider/model format', () => {
    for (const id of MODEL_IDS) {
      const model = MODEL_REGISTRY[id];
      expect(id).toMatch(/^[a-z]+\//);
      expect(id.startsWith(`${model.provider}/`)).toBe(true);
    }
  });
});

describe('MODELS_BY_PROVIDER', () => {
  it('should correctly group Anthropic models', () => {
    expect(MODELS_BY_PROVIDER.anthropic).toHaveLength(3);
    expect(MODELS_BY_PROVIDER.anthropic).toContain('anthropic/claude-haiku-4.5');
    expect(MODELS_BY_PROVIDER.anthropic).toContain('anthropic/claude-sonnet-4.5');
    expect(MODELS_BY_PROVIDER.anthropic).toContain('anthropic/claude-opus-4.5');
  });

  it('should correctly group OpenAI models', () => {
    expect(MODELS_BY_PROVIDER.openai).toHaveLength(8); // o3 removed
    expect(MODELS_BY_PROVIDER.openai).toContain('openai/gpt-4o');
    expect(MODELS_BY_PROVIDER.openai).toContain('openai/gpt-4o-mini');
    expect(MODELS_BY_PROVIDER.openai).toContain('openai/gpt-5.1-thinking');
  });

  it('should correctly group Google models', () => {
    expect(MODELS_BY_PROVIDER.google).toHaveLength(7);
    expect(MODELS_BY_PROVIDER.google).toContain('google/gemini-2.5-flash');
    expect(MODELS_BY_PROVIDER.google).toContain('google/gemini-3-flash');
  });

  it('should correctly group Perplexity models', () => {
    expect(MODELS_BY_PROVIDER.perplexity).toHaveLength(3);
    expect(MODELS_BY_PROVIDER.perplexity).toContain('perplexity/sonar');
    expect(MODELS_BY_PROVIDER.perplexity).toContain('perplexity/sonar-pro');
    expect(MODELS_BY_PROVIDER.perplexity).toContain('perplexity/sonar-reasoning-pro');
  });

  it('should correctly group Morph models', () => {
    expect(MODELS_BY_PROVIDER.morph).toHaveLength(2);
    expect(MODELS_BY_PROVIDER.morph).toContain('morph/morph-v3-fast');
    expect(MODELS_BY_PROVIDER.morph).toContain('morph/morph-v3-large');
  });
});

describe('Special Model Categories', () => {
  it('should identify reasoning-only models', () => {
    // o3 removed - only perplexity has a reasoning-only model now
    expect(REASONING_ONLY_MODELS).toContain('perplexity/sonar-reasoning-pro');
    expect(REASONING_ONLY_MODELS.length).toBe(1);
    // These should NOT be in reasoning-only (they support other capabilities)
    expect(REASONING_ONLY_MODELS).not.toContain('anthropic/claude-sonnet-4.5');
    expect(REASONING_ONLY_MODELS).not.toContain('openai/gpt-5.1-thinking');
  });

  it('should identify image generation models', () => {
    expect(IMAGE_GEN_MODELS).toContain('google/gemini-2.5-flash-image');
    expect(IMAGE_GEN_MODELS).toContain('google/gemini-3-pro-image');
    expect(IMAGE_GEN_MODELS.length).toBe(2);
  });
});

describe('Model Capabilities', () => {
  const expectedCapabilities: Record<string, Capability[]> = {
    'anthropic/claude-haiku-4.5': ['text', 'vision', 'tools', 'json', 'stream', 'cache'],
    'anthropic/claude-sonnet-4.5': ['text', 'vision', 'tools', 'json', 'stream', 'cache', 'thinking'],
    'openai/gpt-4o': ['text', 'vision', 'tools', 'json', 'stream'],
    'openai/gpt-5.1-thinking': ['text', 'vision', 'tools', 'json', 'stream', 'thinking'],
    'google/gemini-2.5-flash': ['text', 'vision', 'audio-in', 'video-in', 'tools', 'json'],
    'perplexity/sonar': ['web', 'json', 'stream'],
    'morph/morph-v3-fast': ['text', 'stream'],
  };

  for (const [modelId, caps] of Object.entries(expectedCapabilities)) {
    it(`should have correct capabilities for ${modelId}`, () => {
      const model = MODEL_REGISTRY[modelId as keyof typeof MODEL_REGISTRY];
      for (const cap of caps) {
        expect(model.capabilities).toContain(cap);
      }
    });
  }
});

describe('Model Pricing', () => {
  it('should have Anthropic Haiku as cheapest Anthropic model', () => {
    const haiku = MODEL_REGISTRY['anthropic/claude-haiku-4.5'];
    const sonnet = MODEL_REGISTRY['anthropic/claude-sonnet-4.5'];
    const opus = MODEL_REGISTRY['anthropic/claude-opus-4.5'];

    expect(haiku.pricing.input).toBeLessThan(sonnet.pricing.input);
    expect(haiku.pricing.input).toBeLessThan(opus.pricing.input);
  });

  it('should have GPT-4o-mini as cheapest OpenAI chat model', () => {
    const mini = MODEL_REGISTRY['openai/gpt-4o-mini'];
    const gpt4o = MODEL_REGISTRY['openai/gpt-4o'];

    expect(mini.pricing.input).toBeLessThan(gpt4o.pricing.input);
    expect(mini.pricing.output).toBeLessThan(gpt4o.pricing.output);
  });

  it('should have Google models priced below $0.005 per 1K input tokens', () => {
    for (const id of MODELS_BY_PROVIDER.google) {
      const model = MODEL_REGISTRY[id];
      expect(model.pricing.input).toBeLessThan(0.005);
    }
  });
});

describe('Context Windows', () => {
  it('should have Google models with 1M+ context', () => {
    const googleModelsWithLargeContext = MODELS_BY_PROVIDER.google.filter((id) => {
      const model = MODEL_REGISTRY[id];
      return model.contextWindow >= 1_000_000;
    });
    // Most Google models should have 1M context
    expect(googleModelsWithLargeContext.length).toBeGreaterThanOrEqual(5);
  });

  it('should have Anthropic models with 200K context', () => {
    for (const id of MODELS_BY_PROVIDER.anthropic) {
      const model = MODEL_REGISTRY[id];
      expect(model.contextWindow).toBe(200_000);
    }
  });

  it('should have OpenAI Codex models with large context', () => {
    const codex = MODEL_REGISTRY['openai/gpt-5-codex'];
    expect(codex.contextWindow).toBe(400_000);
  });
});
