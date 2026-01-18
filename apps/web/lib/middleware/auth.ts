import { NextResponse } from 'next/server';
import { createServerClient, hashApiKey, isSupabaseConfigured, ApiKey, CreditBalance } from '@/lib/supabase/client';

// Auth v2 - Test mode bypass for integration tests (2026-01-18)
// Test mode secret for integration tests (must match rate-limit.ts)
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET || 'layers-integration-test-2026';

// Check if running in test mode
function isTestMode(headers?: Headers): boolean {
  // Check environment variables
  if (process.env.NODE_ENV === 'test' ||
      process.env.LAYERS_TEST_MODE === 'true' ||
      process.env.CI === 'true') {
    return true;
  }

  // Check for test header (allows tests to bypass auth on deployed API)
  if (headers) {
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

  // Test mode - return test user for integration tests
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

  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    // Demo mode - return mock user
    console.warn('SUPABASE not configured - running in demo mode');
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
