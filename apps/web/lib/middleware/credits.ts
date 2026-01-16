import { createServerClient, isSupabaseConfigured, UsageLog } from '@/lib/supabase/client';

// Model pricing (credits per 1K tokens)
// Formula: credits = (cost_usd / $0.01) × 1.6 (60% margin)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
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

/**
 * Calculate credits for a request based on model and token usage
 */
export function calculateCredits(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    // Default pricing for unknown models (conservative)
    return ((inputTokens + outputTokens) / 1000) * 0.5;
  }
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

/**
 * Estimate credits before making a request (for pre-flight check)
 * Uses conservative estimate based on max_tokens
 */
export function estimateCredits(model: string, maxTokens: number = 1024): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return (maxTokens / 1000) * 0.5;
  }
  // Estimate: ~500 input tokens + max_tokens output
  const estimatedInput = 500;
  return (estimatedInput / 1000) * pricing.input + (maxTokens / 1000) * pricing.output;
}

/**
 * Check if user has sufficient credits for a request
 */
export function checkBalance(
  balance: number,
  estimatedCredits: number
): { sufficient: boolean; required: number } {
  return {
    sufficient: balance >= estimatedCredits,
    required: estimatedCredits,
  };
}

/**
 * Deduct credits from user balance
 */
export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Credits not deducted - Supabase not configured');
    return true;
  }

  const supabase = createServerClient();

  // Use the deduct_credits RPC function if it exists, otherwise update directly
  const { error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // Fallback to direct update if RPC doesn't exist
    console.warn('RPC deduct_credits failed, using direct update:', error.message);
    const { error: updateError } = await supabase
      .from('credit_balances')
      .update({
        balance: supabase.rpc('balance - $1', [amount]),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to deduct credits:', updateError);
      return false;
    }
  }

  return true;
}

/**
 * Log API usage to database
 */
export async function logUsage(log: UsageLog): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Usage not logged - Supabase not configured');
    return true;
  }

  const supabase = createServerClient();

  const { error } = await supabase.from('usage_logs').insert({
    user_id: log.user_id,
    api_key_id: log.api_key_id,
    model_id: log.model_id,
    provider: log.provider,
    request_type: log.request_type,
    input_tokens: log.input_tokens || 0,
    output_tokens: log.output_tokens || 0,
    cost_usd: log.cost_usd || 0,
    credits_used: log.credits_used,
    latency_ms: log.latency_ms || 0,
    status: log.status,
    error_message: log.error_message,
    metadata: log.metadata,
  });

  if (error) {
    console.error('Failed to log usage:', error);
    return false;
  }

  return true;
}

/**
 * Convert credits to estimated USD (for display)
 */
export function creditsToUsd(credits: number): number {
  // With 60% margin: credits = usd * 1.6 / 0.01
  // So: usd = credits * 0.01 / 1.6
  return credits * 0.00625;
}
