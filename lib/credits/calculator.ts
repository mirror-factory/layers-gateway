/**
 * Credit Calculator
 *
 * Core calculation logic for converting AI usage to credits.
 */

import { getModel, getModelSafe, type ModelId } from '../models/index';
import type { MarginConfig, CostBreakdown, ExternalCostInput } from './types';
import { DEFAULT_MARGIN_CONFIG } from './types';

/** Threshold for flagging cost discrepancies (5% difference) */
const DISCREPANCY_THRESHOLD_PERCENT = 5;

/**
 * Get the effective margin for a model
 */
export function getEffectiveMargin(
  modelId: string,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number {
  return config.modelOverrides[modelId] ?? config.defaultMarginPercent;
}

/**
 * Calculate raw cost in USD for a request
 *
 * @param modelId - The model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in USD
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
 * Calculate raw cost for any model ID (safe version)
 */
export function calculateCostSafe(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number | null {
  const model = getModelSafe(modelId);
  if (!model) return null;
  const inputCost = (inputTokens / 1000) * model.pricing.input;
  const outputCost = (outputTokens / 1000) * model.pricing.output;
  return inputCost + outputCost;
}

/**
 * Calculate credits for a request
 *
 * Formula: credits = (cost / $0.01) × (1 + marginPercent / 100)
 *
 * @param modelId - The model ID
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param config - Margin configuration
 * @returns Credits to charge
 */
export function calculateCredits(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number {
  const cost = calculateCost(modelId, inputTokens, outputTokens);
  const marginPercent = getEffectiveMargin(modelId, config);
  const credits = (cost / 0.01) * (1 + marginPercent / 100);
  return credits;
}

/**
 * Calculate credits (safe version for unknown model IDs)
 */
export function calculateCreditsSafe(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number | null {
  const cost = calculateCostSafe(modelId, inputTokens, outputTokens);
  if (cost === null) return null;
  const marginPercent = getEffectiveMargin(modelId, config);
  const credits = (cost / 0.01) * (1 + marginPercent / 100);
  return credits;
}

/**
 * Estimate credits before making a request (based on estimated token counts)
 */
export function estimateCredits(
  modelId: ModelId,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number {
  return calculateCredits(modelId, estimatedInputTokens, estimatedOutputTokens, config);
}

/**
 * Convert credits back to approximate USD value
 */
export function creditsToUsd(
  credits: number,
  marginPercent: number = DEFAULT_MARGIN_CONFIG.defaultMarginPercent
): number {
  // Reverse the formula: cost = credits × $0.01 / (1 + marginPercent / 100)
  return (credits * 0.01) / (1 + marginPercent / 100);
}

/**
 * Convert USD to credits at a given margin
 */
export function usdToCredits(
  usd: number,
  marginPercent: number = DEFAULT_MARGIN_CONFIG.defaultMarginPercent
): number {
  return (usd / 0.01) * (1 + marginPercent / 100);
}

/**
 * Calculate the profit margin in USD for a given credit charge
 */
export function calculateProfit(
  credits: number,
  costUsd: number
): number {
  // Revenue is credits × $0.01 (what we charge)
  const revenue = credits * 0.01;
  return revenue - costUsd;
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(
  credits: number,
  costUsd: number
): number {
  const revenue = credits * 0.01;
  if (revenue === 0) return 0;
  return ((revenue - costUsd) / revenue) * 100;
}

/**
 * Batch calculate credits for multiple requests
 */
export function calculateBatchCredits(
  requests: Array<{
    modelId: ModelId;
    inputTokens: number;
    outputTokens: number;
  }>,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number {
  return requests.reduce(
    (total, req) =>
      total + calculateCredits(req.modelId, req.inputTokens, req.outputTokens, config),
    0
  );
}

/**
 * Get a breakdown of cost and credits for a request
 */
export function getCostBreakdown(
  modelId: ModelId,
  inputTokens: number,
  outputTokens: number,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  marginPercent: number;
  credits: number;
  revenue: number;
  profit: number;
} {
  const model = getModel(modelId);
  const inputCost = (inputTokens / 1000) * model.pricing.input;
  const outputCost = (outputTokens / 1000) * model.pricing.output;
  const totalCost = inputCost + outputCost;
  const marginPercent = getEffectiveMargin(modelId, config);
  const credits = (totalCost / 0.01) * (1 + marginPercent / 100);
  const revenue = credits * 0.01;
  const profit = revenue - totalCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    marginPercent,
    credits,
    revenue,
    profit,
  };
}

/**
 * Calculate credits with external base cost and return full breakdown
 *
 * When an external system (like Mirror Factory) provides the base cost,
 * we use their cost for billing but validate against our own calculation.
 *
 * @param modelId - The model ID (for validation calculation)
 * @param inputTokens - Number of input tokens (for validation calculation)
 * @param outputTokens - Number of output tokens (for validation calculation)
 * @param externalCost - External cost input with base_cost_usd
 * @param config - Margin configuration
 * @returns Credits used and full cost breakdown
 */
export function calculateCreditsWithBreakdown(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  externalCost: ExternalCostInput | undefined,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): {
  credits: number;
  breakdown: CostBreakdown;
} {
  const marginPercent = getEffectiveMargin(modelId, config);

  // Calculate our own base cost for validation
  const ourBaseCost = calculateCostSafe(modelId, inputTokens, outputTokens);

  // Determine which base cost to use
  let baseCostUsd: number;
  let validation: 'ok' | 'warning' = 'ok';
  let validationDetails: CostBreakdown['validation_details'] | undefined;

  if (externalCost && externalCost.base_cost_usd !== undefined) {
    // Use external base cost
    baseCostUsd = externalCost.base_cost_usd;

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
          difference_percent: differencePercent,
        };
      }
    }
  } else {
    // No external cost provided, use our calculation
    if (ourBaseCost === null) {
      // Unknown model, use 0 (this shouldn't happen in production)
      baseCostUsd = 0;
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
    base_cost_usd: baseCostUsd,
    margin_percent: marginPercent,
    total_cost_usd: totalCostUsd,
    credits_before_margin: creditsBeforeMargin,
    margin_credits: marginCredits,
    validation,
    ...(validationDetails && { validation_details: validationDetails }),
  };

  return { credits, breakdown };
}
