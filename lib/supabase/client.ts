import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

// Singleton pattern for server client
let serverClient: SupabaseClient | null = null;

/**
 * Create a Supabase server client with service role key (bypasses RLS)
 */
export function createServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  serverClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Hash an API key for secure storage/lookup
 * Uses SHA256 - in production, consider bcrypt or argon2 for additional security
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 * Format: lyr_live_<base64url-encoded-32-random-bytes>
 */
export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const prefix = 'lyr_live_';
  const randomPart = randomBytes(32).toString('base64url');
  const key = `${prefix}${randomPart}`;
  const hash = hashApiKey(key);
  return { key, prefix, hash };
}

// Database types (matching Supabase schema)
export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface CreditBalance {
  id: string;
  user_id: string;
  balance: number;
  tier: 'free' | 'starter' | 'pro' | 'team';
  monthly_credits: number;
  overage_rate: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id?: string;
  user_id: string;
  api_key_id: string | null;
  model_id: string;
  provider: string;
  request_type: 'chat' | 'completion' | 'embedding' | 'image';
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  credits_used: number;
  latency_ms?: number;
  status: 'success' | 'error' | 'rate_limited';
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}
