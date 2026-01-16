import { createClient } from '@supabase/supabase-js';

// Supabase client for server-side operations
// Uses service role key to bypass RLS for API key validation
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Hash an API key for lookup (simple hash for demo - use bcrypt in production)
export function hashApiKey(key: string): string {
  // In production, use bcrypt or argon2
  // For now, we use a simple approach that matches what we store
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate a new API key
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const crypto = require('crypto');
  const prefix = 'lk_live_';
  const randomPart = crypto.randomBytes(32).toString('base64url');
  const key = `${prefix}${randomPart}`;
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

// Model pricing (credits per 1K tokens)
// Formula: credits = (cost_usd / $0.01) × 1.6 (60% margin)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  'anthropic/claude-haiku-4.5': { input: 0.16, output: 0.80 },
  'anthropic/claude-sonnet-4.5': { input: 0.48, output: 2.40 },
  'anthropic/claude-opus-4.5': { input: 2.40, output: 12.00 },
  // OpenAI
  'openai/gpt-4o': { input: 0.40, output: 1.60 },
  'openai/gpt-4o-mini': { input: 0.024, output: 0.096 },
  'openai/gpt-5-chat': { input: 0.80, output: 3.20 },
  'openai/gpt-5-codex': { input: 1.20, output: 4.80 },
  'openai/gpt-5.1-codex': { input: 1.60, output: 6.40 },
  'openai/gpt-5.1-codex-mini': { input: 0.80, output: 3.20 },
  'openai/gpt-5.1-instant': { input: 0.16, output: 0.64 },
  'openai/gpt-5.1-thinking': { input: 2.40, output: 9.60 },
  // Google
  'google/gemini-2.5-flash': { input: 0.012, output: 0.048 },
  'google/gemini-2.5-flash-lite': { input: 0.006, output: 0.024 },
  'google/gemini-2.5-pro': { input: 0.20, output: 0.80 },
  'google/gemini-3-flash': { input: 0.016, output: 0.064 },
  'google/gemini-3-pro-preview': { input: 0.40, output: 1.60 },
  // Perplexity
  'perplexity/sonar': { input: 0.16, output: 0.16 },
  'perplexity/sonar-pro': { input: 0.48, output: 0.24 },
  'perplexity/sonar-reasoning-pro': { input: 0.16, output: 0.80 },
  // Morph
  'morph/morph-v3-fast': { input: 0.08, output: 0.32 },
  'morph/morph-v3-large': { input: 0.16, output: 0.64 },
};

// Calculate credits used for a request
export function calculateCredits(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    // Default pricing for unknown models
    return ((inputTokens + outputTokens) / 1000) * 0.5;
  }
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}
