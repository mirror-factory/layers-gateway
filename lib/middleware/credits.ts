import { createServerClient, isSupabaseConfigured, UsageLog } from '@/lib/supabase/client';
import { getSyncedModelPricing } from '@/lib/pricing';

// Default margin percentage (60%)
const DEFAULT_MARGIN_PERCENT = 60;

// Threshold for flagging cost discrepancies (5% difference)
const DISCREPANCY_THRESHOLD_PERCENT = 5;

/**
 * Get model pricing from synced pricing ONLY
 * No fallback - relies entirely on Hustle Together AI pricing sync
 */
function getModelPricing(model: string): { input: number; output: number } | null {
  // Get synced pricing from Hustle Together AI
  const syncedPricing = getSyncedModelPricing(model);

  if (!syncedPricing) {
    console.error(`Pricing not available for model: ${model}. Ensure pricing is synced from Hustle Together AI.`);
  }

  return syncedPricing;
}


/**
 * Calculate credits for a request based on model and token usage
 * Uses ONLY synced pricing from Hustle Together AI (no fallback)
 */
export function calculateCredits(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getModelPricing(model);
  if (!pricing) {
    // No pricing available - this should trigger an error upstream
    // Conservative fallback to prevent system failure
    console.error(`PRICING UNAVAILABLE: ${model}. Check Hustle Together AI sync status.`);
    return ((inputTokens + outputTokens) / 1000) * 1.0; // Conservative estimate
  }
  // Calculate USD cost then convert to credits with margin
  const costUsd = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
  return (costUsd / 0.01) * (1 + DEFAULT_MARGIN_PERCENT / 100);
}

/**
 * Estimate credits before making a request (for pre-flight check)
 * Uses conservative estimate based on max_tokens
 * Relies on synced pricing from Hustle Together AI
 */
export function estimateCredits(model: string, maxTokens: number = 1024): number {
  const pricing = getModelPricing(model);
  if (!pricing) {
    console.error(`PRICING UNAVAILABLE: ${model}. Check Hustle Together AI sync status.`);
    return (maxTokens / 1000) * 1.0; // Conservative estimate
  }
  // Estimate: ~500 input tokens + max_tokens output
  const estimatedInput = 500;
  const costUsd = (estimatedInput / 1000) * pricing.input + (maxTokens / 1000) * pricing.output;
  return (costUsd / 0.01) * (1 + DEFAULT_MARGIN_PERCENT / 100);
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
  // Skip deduction for test users
  if (userId === 'test-user' || userId === 'demo-user') {
    console.log(`Credits not deducted for ${userId} (test/demo mode)`);
    return true;
  }

  if (!isSupabaseConfigured()) {
    console.warn('Credits not deducted - Supabase not configured');
    return true;
  }

  const supabase = createServerClient();

  // Use the deduct_credits RPC function if it exists
  const { error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // Fallback to direct update if RPC doesn't exist
    console.warn('RPC deduct_credits failed, using direct update:', error.message);

    // First get current balance
    const { data: current, error: fetchError } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (fetchError || !current) {
      console.error('Failed to fetch current balance:', fetchError);
      return false;
    }

    // Then update with new balance
    const newBalance = Math.max(0, parseFloat(current.balance) - amount);
    const { error: updateError } = await supabase
      .from('credit_balances')
      .update({
        balance: newBalance,
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
  // Skip logging for test users
  if (log.user_id === 'test-user' || log.user_id === 'demo-user') {
    console.log(`Usage not logged for ${log.user_id} (test/demo mode)`);
    return true;
  }

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

/**
 * External cost input from Mirror Factory
 */
export interface MirrorFactoryInput {
  base_cost_usd: number;
}

/**
 * Cost breakdown for transparency
 */
export interface CostBreakdown {
  /** Base cost in USD */
  base_cost_usd: number;
  /** Margin percentage applied */
  margin_percent: number;
  /** Total cost after margin */
  total_cost_usd: number;
  /** Credits before margin */
  credits_before_margin: number;
  /** Margin portion in credits */
  margin_credits: number;
  /** Validation status */
  validation: 'ok' | 'warning';
  /** Validation details if there's a discrepancy */
  validation_details?: {
    external_base_cost_usd: number;
    calculated_base_cost_usd: number;
    difference_usd: number;
    difference_percent: number;
  };
}

/**
 * Calculate base cost in USD for a request (before margin)
 */
export function calculateBaseCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const pricing = getModelPricing(model);
  if (!pricing) {
    return null;
  }
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

/**
 * Calculate credits with full breakdown
 *
 * When an external system (like Mirror Factory) provides the base cost,
 * we use their cost for billing but validate against our own calculation.
 */
export function calculateCreditsWithBreakdown(
  model: string,
  inputTokens: number,
  outputTokens: number,
  mirrorFactory?: MirrorFactoryInput,
  marginPercent: number = DEFAULT_MARGIN_PERCENT
): {
  credits: number;
  breakdown: CostBreakdown;
} {
  // Calculate our own base cost for validation
  const ourBaseCost = calculateBaseCost(model, inputTokens, outputTokens);

  // Determine which base cost to use
  let baseCostUsd: number;
  let validation: 'ok' | 'warning' = 'ok';
  let validationDetails: CostBreakdown['validation_details'] | undefined;

  if (mirrorFactory && mirrorFactory.base_cost_usd !== undefined) {
    // Use external base cost from Mirror Factory
    baseCostUsd = mirrorFactory.base_cost_usd;

    // Validate against our calculation
    if (ourBaseCost !== null) {
      const difference = Math.abs(baseCostUsd - ourBaseCost);
      const differencePercent = ourBaseCost > 0 ? (difference / ourBaseCost) * 100 : 0;

      if (differencePercent > DISCREPANCY_THRESHOLD_PERCENT) {
        validation = 'warning';
        validationDetails = {
          external_base_cost_usd: baseCostUsd,
          calculated_base_cost_usd: ourBaseCost,
          difference_usd: difference,
          difference_percent: Math.round(differencePercent * 100) / 100,
        };
      }
    }
  } else {
    // No external cost provided, use our calculation
    if (ourBaseCost === null) {
      // Unknown model, estimate conservatively
      baseCostUsd = ((inputTokens + outputTokens) / 1000) * 0.003;
    } else {
      baseCostUsd = ourBaseCost;
    }
  }

  // Apply margin
  const creditsBeforeMargin = baseCostUsd / 0.01;
  const marginMultiplier = 1 + marginPercent / 100;
  const credits = creditsBeforeMargin * marginMultiplier;
  const marginCredits = credits - creditsBeforeMargin;
  const totalCostUsd = baseCostUsd * marginMultiplier;

  const breakdown: CostBreakdown = {
    base_cost_usd: Math.round(baseCostUsd * 1000000) / 1000000, // 6 decimal places
    margin_percent: marginPercent,
    total_cost_usd: Math.round(totalCostUsd * 1000000) / 1000000,
    credits_before_margin: Math.round(creditsBeforeMargin * 1000) / 1000, // 3 decimal places
    margin_credits: Math.round(marginCredits * 1000) / 1000,
    validation,
    ...(validationDetails && { validation_details: validationDetails }),
  };

  return {
    credits: Math.round(credits * 1000) / 1000, // 3 decimal places
    breakdown,
  };
}
