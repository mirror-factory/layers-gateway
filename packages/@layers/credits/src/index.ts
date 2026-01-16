/**
 * @layers/credits
 *
 * Credit system for AI usage billing with configurable margins.
 *
 * @example
 * ```ts
 * import {
 *   calculateCredits,
 *   getCostBreakdown,
 *   estimateCredits,
 *   SUBSCRIPTION_TIERS,
 * } from '@layers/credits';
 *
 * // Calculate credits for a request
 * const credits = calculateCredits(
 *   'anthropic/claude-sonnet-4.5',
 *   2000, // input tokens
 *   1000, // output tokens
 * );
 * // => ~3.36 credits at default 60% margin
 *
 * // Get full cost breakdown
 * const breakdown = getCostBreakdown(
 *   'anthropic/claude-sonnet-4.5',
 *   2000,
 *   1000,
 * );
 * // => { inputCost, outputCost, totalCost, marginPercent, credits, revenue, profit }
 *
 * // With custom margin config
 * const customCredits = calculateCredits(
 *   'anthropic/claude-sonnet-4.5',
 *   2000,
 *   1000,
 *   { defaultMarginPercent: 40, modelOverrides: {} }
 * );
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  MarginConfig,
  UsageRecord,
  CreditBalance,
  SubscriptionTier,
  TransactionType,
  CreditTransaction,
  AffordabilityCheck,
} from './types';

// Constants
export {
  DEFAULT_MARGIN_CONFIG,
  SUBSCRIPTION_TIERS,
} from './types';

// Calculator
export {
  getEffectiveMargin,
  calculateCost,
  calculateCostSafe,
  calculateCredits,
  calculateCreditsSafe,
  estimateCredits,
  creditsToUsd,
  usdToCredits,
  calculateProfit,
  calculateProfitMargin,
  calculateBatchCredits,
  getCostBreakdown,
} from './calculator';
