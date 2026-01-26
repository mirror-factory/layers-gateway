/**
 * CORS Configuration
 *
 * Implements origin allowlist for API security.
 * Prevents unauthorized cross-origin requests.
 *
 * @see https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny
 */

// Build allowed origins list from environment variable
const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];

// Default production origins
const DEFAULT_ORIGINS = [
  'https://layers.hustletogether.com',
  'https://hustletogether.com',
  'https://www.hustletogether.com',
];

// Combine environment origins with defaults
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ORIGINS,
  ...ALLOWED_ORIGINS_ENV,
]);

// Add local development origins (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.add('http://localhost:3000');
  ALLOWED_ORIGINS.add('http://localhost:3700');
  ALLOWED_ORIGINS.add('http://127.0.0.1:3000');
  ALLOWED_ORIGINS.add('http://127.0.0.1:3700');
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

/**
 * Get CORS headers for a request
 * @param origin - The Origin header from the request
 * @returns CORS headers object
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = isOriginAllowed(origin);

  // If origin is allowed, echo it back; otherwise use the primary production origin
  const allowedOrigin = isAllowed && origin ? origin : DEFAULT_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24 hours preflight cache
    'Vary': 'Origin', // Important: Prevents cache poisoning
  };
}

/**
 * Create a CORS preflight response
 * @param origin - The Origin header from the request
 * @returns Response for OPTIONS requests
 */
export function createCorsPreflightResponse(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Get list of allowed origins (for debugging/documentation)
 */
export function getAllowedOrigins(): string[] {
  return Array.from(ALLOWED_ORIGINS);
}
