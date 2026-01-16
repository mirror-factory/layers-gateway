/**
 * AI Model Types for Layers Platform
 *
 * These types define the structure of our model registry,
 * capabilities, and pricing information.
 */

/**
 * Supported AI providers through Vercel AI Gateway
 *
 * Note: xAI and DeepSeek removed - gateway issues, unnecessary for MVP
 * See RALPH-REGISTRY.md vercel-ai-testing for details
 */
export type Provider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'perplexity'
  | 'morph';

/**
 * Model capabilities
 */
export type Capability =
  | 'text'        // Text generation
  | 'vision'      // Image input
  | 'pdf'         // Native PDF input
  | 'audio-in'    // Audio input
  | 'video-in'    // Video input
  | 'tools'       // Function calling / tool use
  | 'web'         // Built-in web search
  | 'image-gen'   // Image generation
  | 'json'        // Structured JSON output
  | 'stream'      // Streaming responses
  | 'cache'       // Prompt caching
  | 'thinking'    // Extended thinking / reasoning
  | 'embed';      // Text embeddings

/**
 * Model type classification
 */
export type ModelType = 'language' | 'embedding' | 'image';

/**
 * Pricing information (per 1K tokens)
 */
export interface ModelPricing {
  /** Input cost per 1K tokens in USD */
  input: number;
  /** Output cost per 1K tokens in USD (0 for embeddings) */
  output: number;
}

/**
 * Complete model definition
 */
export interface ModelDefinition {
  /** Full model ID as used in Vercel AI Gateway (e.g., "anthropic/claude-sonnet-4.5") */
  id: string;
  /** Provider name */
  provider: Provider;
  /** Human-readable display name */
  name: string;
  /** Model type */
  type: ModelType;
  /** List of capabilities */
  capabilities: Capability[];
  /** Context window size in tokens */
  contextWindow: number;
  /** Pricing per 1K tokens */
  pricing: ModelPricing;
  /** Release date (YYYY-MM) */
  released: string;
  /** Optional notes about the model */
  notes?: string;
  /**
   * If true, this is a pure reasoning model (o3, o3-mini, o4-mini, sonar-reasoning-pro)
   * These models need special handling - only reasoning capability tests apply
   */
  reasoningOnly?: boolean;
}

/**
 * Model registry type (all models keyed by ID)
 */
export type ModelRegistry = Record<string, ModelDefinition>;

/**
 * Filter options for querying models
 */
export interface ModelFilterOptions {
  /** Filter by provider */
  provider?: Provider | Provider[];
  /** Filter by capabilities (models must have ALL specified capabilities) */
  capabilities?: Capability[];
  /** Filter by capabilities (models must have ANY of the specified capabilities) */
  capabilitiesAny?: Capability[];
  /** Filter by model type */
  type?: ModelType;
  /** Minimum context window size */
  minContextWindow?: number;
  /** Maximum input price per 1K tokens */
  maxInputPrice?: number;
  /** Maximum output price per 1K tokens */
  maxOutputPrice?: number;
}
