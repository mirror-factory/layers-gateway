import { NextResponse } from 'next/server';
import { createServerClient, hashApiKey, isSupabaseConfigured, ApiKey, CreditBalance } from '@/lib/supabase/client';

// Auth v2 - Test mode bypass for integration tests (2026-01-18)
// SECURITY: No hardcoded default - requires explicit environment variable
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET;

// Check if running in test mode
function isTestMode(headers?: Headers): boolean {
  // SECURITY: NEVER allow test mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  // Check environment variables (for CI/test environments)
  if (process.env.NODE_ENV === 'test' ||
      process.env.LAYERS_TEST_MODE === 'true' ||
      process.env.CI === 'true') {
    return true;
  }

  // Check for test header only if secret is explicitly configured
  if (headers && TEST_MODE_SECRET) {
    const testHeader = headers.get('X-Layers-Test-Mode');
    if (testHeader === TEST_MODE_SECRET) {
      return true;
    }
  }

  return false;
}

export interface AuthenticatedUser {
  userId: string;
  apiKeyId: string;
  tier: CreditBalance['tier'];
  balance: number;
}

export interface AuthResult {
  success: true;
  user: AuthenticatedUser;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

/**
 * Validate API key and return authenticated user info
 * @param authHeader - Authorization header value
 * @param headers - Full request headers (used for test mode detection)
 */
export async function validateApiKey(authHeader: string | null, headers?: Headers): Promise<AuthResult | AuthError> {
  // Test mode - bypass all validation for integration tests
  if (isTestMode(headers)) {
    console.log('Auth: Running in test mode - using test user');
    return {
      success: true,
      user: {
        userId: 'test-user',
        apiKeyId: 'test-key',
        tier: 'free',  // Tests should use getEffectiveTier for test tier rate limits
        balance: 1000,
      },
    };
  }

  // Check if auth header exists and has correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header. Use: Bearer lyr_live_xxxxx',
      status: 401,
    };
  }

  const apiKey = authHeader.substring(7);

  // Validate key format
  if (!apiKey.startsWith('lyr_live_')) {
    return {
      success: false,
      error: 'Invalid API key format. Keys must start with lyr_live_',
      status: 401,
    };
  }

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // SECURITY: Block demo mode in production
    if (process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: Supabase not configured in production');
      return {
        success: false,
        error: 'Service temporarily unavailable',
        status: 503,
      };
    }
    // Demo mode - only for development
    console.warn('SUPABASE not configured - running in demo mode (development only)');
    return {
      success: true,
      user: {
        userId: 'demo-user',
        apiKeyId: 'demo-key',
        tier: 'free',
        balance: 100,
      },
    };
  }

  const supabase = createServerClient();
  const keyHash = hashApiKey(apiKey);

  // Look up API key
  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (keyError || !keyData) {
    return {
      success: false,
      error: 'Invalid API key',
      status: 401,
    };
  }

  // Check if key is active
  if (!keyData.is_active) {
    return {
      success: false,
      error: 'API key is deactivated',
      status: 401,
    };
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return {
      success: false,
      error: 'API key has expired',
      status: 401,
    };
  }

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id)
    .then(() => {});

  // Get credit balance
  const { data: balance, error: balanceError } = await supabase
    .from('credit_balances')
    .select('balance, tier')
    .eq('user_id', keyData.user_id)
    .single();

  if (balanceError || !balance) {
    return {
      success: false,
      error: 'User account not found',
      status: 401,
    };
  }

  return {
    success: true,
    user: {
      userId: keyData.user_id,
      apiKeyId: keyData.id,
      tier: balance.tier as CreditBalance['tier'],
      balance: parseFloat(balance.balance),
    },
  };
}

/**
 * Helper to create error response
 */
export function authErrorResponse(result: AuthError): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
