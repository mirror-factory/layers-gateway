/**
 * Credit System Types
 *
 * Types for managing AI usage credits, margins, and billing.
 */

import type { ModelId } from '../models/index';

/**
 * Margin configuration
 */
export interface MarginConfig {
  /** Default margin percentage applied to all models (e.g., 60 for 60%) */
  defaultMarginPercent: number;
  /** Per-model margin overrides (model ID -> margin percent) */
  modelOverrides: Record<string, number>;
}

/**
 * Default margin configuration
 */
export const DEFAULT_MARGIN_CONFIG: MarginConfig = {
  defaultMarginPercent: 60,
  modelOverrides: {},
};

/**
 * Usage record for a single AI request
 */
export interface UsageRecord {
  /** Unique ID for this usage record */
  id: string;
  /** User ID who made the request */
  userId: string;
  /** Model ID used */
  modelId: ModelId;
  /** Number of input tokens */
  inputTokens: number;
  /** Number of output tokens */
  outputTokens: number;
  /** Raw cost in USD */
  costUsd: number;
  /** Credits charged */
  creditsCharged: number;
  /** Margin percent applied */
  marginPercent: number;
  /** Timestamp */
  createdAt: Date;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Credit balance for a user
 */
export interface CreditBalance {
  /** User ID */
  userId: string;
  /** Current balance */
  balance: number;
  /** Total credits ever purchased */
  totalPurchased: number;
  /** Total credits ever used */
  totalUsed: number;
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Subscription tier
 */
export interface SubscriptionTier {
  /** Tier ID */
  id: string;
  /** Display name */
  name: string;
  /** Monthly price in USD */
  priceUsd: number;
  /** Monthly credit allocation */
  monthlyCredits: number;
  /** Whether overage is allowed */
  allowOverage: boolean;
  /** Overage rate (credits per dollar) */
  overageRate?: number;
}

/**
 * Predefined subscription tiers
 * Pricing aligned with industry standards (comparable to other LLM services)
 */
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    monthlyCredits: 50,
    allowOverage: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceUsd: 20,
    monthlyCredits: 500,
    allowOverage: true,
    overageRate: 20, // $0.05 per credit
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 100,
    monthlyCredits: 3000,
    allowOverage: true,
    overageRate: 25, // $0.04 per credit
  },
  {
    id: 'team',
    name: 'Team',
    priceUsd: 200,
    monthlyCredits: 7500,
    allowOverage: true,
    overageRate: 30, // $0.033 per credit
  },
];

/**
 * Credit transaction type
 */
export type TransactionType =
  | 'usage'        // AI usage deduction
  | 'purchase'     // Credit purchase
  | 'subscription' // Monthly subscription credit
  | 'refund'       // Credit refund
  | 'adjustment'   // Manual adjustment
  | 'bonus';       // Promotional bonus

/**
 * Credit transaction
 */
export interface CreditTransaction {
  /** Unique transaction ID */
  id: string;
  /** User ID */
  userId: string;
  /** Transaction type */
  type: TransactionType;
  /** Amount (positive for additions, negative for deductions) */
  amount: number;
  /** Balance after transaction */
  balanceAfter: number;
  /** Description */
  description: string;
  /** Related usage record ID (for usage transactions) */
  usageRecordId?: string;
  /** Timestamp */
  createdAt: Date;
}

/**
 * Result of checking if user can afford a request
 */
export interface AffordabilityCheck {
  /** Whether the user can afford the request */
  canAfford: boolean;
  /** Current balance */
  currentBalance: number;
  /** Estimated cost in credits */
  estimatedCredits: number;
  /** Balance after (if affordable) */
  balanceAfter?: number;
  /** Reason if not affordable */
  reason?: string;
}

/**
 * Cost breakdown for transparency
 * Used when external base cost is provided (e.g., from Mirror Factory)
 */
export interface CostBreakdown {
  /** Base cost in USD (from external source or calculated) */
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
 * Layers response metadata (added to API responses)
 */
export interface LayersResponseMetadata {
  /** Credits charged for this request */
  credits_used: number;
  /** Request latency in milliseconds */
  latency_ms: number;
  /** Reasoning content (for thinking models) */
  reasoning?: string;
  /** Cost breakdown (when external base cost provided) */
  cost_breakdown?: CostBreakdown;
}

/**
 * External cost input (from Mirror Factory)
 */
export interface ExternalCostInput {
  /** Base cost in USD calculated by the caller */
  base_cost_usd: number;
}
