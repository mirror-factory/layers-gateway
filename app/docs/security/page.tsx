import Link from 'next/link';
import {
  Heading,
  P,
  Callout,
  CodeBlock,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@/components/docs';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const metadata = {
  title: 'Security - Layers Documentation',
  description: 'Security best practices, known concerns, and hardening recommendations for the Layers API Gateway',
};

export default function SecurityPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Security</span>
        </div>
        <Heading level={1}>Security Guide</Heading>
        <P>
          Comprehensive security documentation for the Layers API Gateway, including implemented
          protections, known concerns, and hardening recommendations for production deployments.
        </P>
      </div>

      <Callout type="warning" title="Living Document">
        This security guide is maintained as a living document. As new security concerns are
        discovered or mitigations are implemented, this page will be updated. Last updated: 2026-01-24.
      </Callout>

      <Heading level={2} id="overview">Security Architecture Overview</Heading>

      <P>
        Layers implements a multi-layered security approach across authentication, authorization,
        rate limiting, and cost controls. However, as an API gateway handling sensitive operations
        and billing, ongoing security hardening is critical.
      </P>

      <div className="space-y-4 my-6">
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            What We Do Well
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>API keys hashed before storage (SHA256)</li>
            <li>Stripe webhook signature verification</li>
            <li>Tier-based rate limiting</li>
            <li>Pre-flight credit checks</li>
            <li>Session cookies with httpOnly, secure, SameSite=Lax</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg border bg-card border-yellow-500/50">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Areas Needing Attention
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>Service role key bypasses Row Level Security (RLS)</li>
            <li>Test mode authentication bypass with weak defaults</li>
            <li>No CORS restrictions on API endpoints</li>
            <li>PII (emails) logged in production</li>
            <li>No request size limits</li>
          </ul>
        </div>
      </div>

      <Heading level={2} id="critical-concerns">Critical Security Concerns</Heading>

      <Heading level={3} id="rls-bypass">1. Row Level Security (RLS) Bypass</Heading>

      <Callout type="danger" title="High Priority">
        The Supabase service role key bypasses all Row Level Security policies. This means
        application code is the <strong>only</strong> protection preventing users from accessing
        other users&apos; data.
      </Callout>

      <P><strong>Current State:</strong></P>
      <CodeBlock language="typescript">
{`// lib/supabase/client.ts:8
// Create a Supabase server client with service role key (bypasses RLS)
export function createServerClient(): SupabaseClient {
  serverClient = createClient(url, serviceKey, { /* ... */ });
  return serverClient;
}`}
      </CodeBlock>

      <P><strong>Risk:</strong></P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>A bug in user_id filtering could expose all user data</li>
        <li>SQL injection vulnerabilities become critical</li>
        <li>No defense-in-depth if authorization logic fails</li>
      </ul>

      <P><strong>Mitigation Steps:</strong></P>
      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>
          <strong>Enable RLS on all tables:</strong>
          <CodeBlock language="sql">
{`-- In Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;`}
          </CodeBlock>
        </li>
        <li>
          <strong>Create policies for each table:</strong>
          <CodeBlock language="sql">
{`-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON credit_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON credit_balances FOR UPDATE
  USING (auth.uid() = user_id);`}
          </CodeBlock>
        </li>
        <li>
          <strong>Audit all queries:</strong> Search codebase for database queries and verify each
          includes proper user_id filtering
        </li>
        <li>
          <strong>Use anon key where possible:</strong> For read operations, consider using the
          anon key instead of service role
        </li>
      </ol>

      <Heading level={3} id="test-mode">2. Test Mode Authentication Bypass</Heading>

      <Callout type="danger" title="High Priority">
        Test mode uses a hardcoded default secret that&apos;s visible in the source code. If deployed
        without proper configuration, this could allow complete authentication bypass.
      </Callout>

      <P><strong>Current State:</strong></P>
      <CodeBlock language="typescript">
{`// lib/middleware/auth.ts:6
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET || 'layers-integration-test-2026';

// Anyone who sends this header bypasses auth:
// X-Layers-Test-Mode: layers-integration-test-2026`}
      </CodeBlock>

      <P><strong>Risk:</strong></P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>Public GitHub repo exposes the default secret</li>
        <li>Attackers can bypass all authentication and rate limiting</li>
        <li>Could be used to drain credits or access user data</li>
      </ul>

      <P><strong>Mitigation Steps:</strong></P>
      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>
          <strong>Remove hardcoded default:</strong>
          <CodeBlock language="typescript">
{`// Require the environment variable
const TEST_MODE_SECRET = process.env.LAYERS_TEST_SECRET;
if (!TEST_MODE_SECRET) {
  throw new Error('LAYERS_TEST_SECRET required for test mode');
}`}
          </CodeBlock>
        </li>
        <li>
          <strong>Disable in production:</strong>
          <CodeBlock language="typescript">
{`function isTestMode(headers?: Headers): boolean {
  // Never allow test mode in production
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  // ... rest of test mode checks
}`}
          </CodeBlock>
        </li>
        <li>
          <strong>Use cryptographically random secret:</strong> Generate with{' '}
          <code>openssl rand -base64 48</code>
        </li>
        <li>
          <strong>Consider IP allowlisting:</strong> Only allow test mode from specific IPs (CI servers)
        </li>
      </ol>

      <Heading level={3} id="cors">3. Missing CORS Configuration</Heading>

      <P><strong>Current State:</strong></P>
      <P>API endpoints under /api/v1/* have no CORS restrictions. Any website can call your API.</P>

      <P><strong>Risk:</strong></P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>If a user&apos;s API key leaks (e.g., committed to GitHub), any site can use it</li>
        <li>Malicious sites could make requests on behalf of users</li>
        <li>Cross-origin attacks become easier</li>
      </ul>

      <P><strong>Mitigation Steps:</strong></P>
      <CodeBlock language="typescript">
{`// In app/api/v1/chat/route.ts (and other endpoints)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://layers.hustletogether.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Add to response headers in POST handler
headers: {
  ...getRateLimitHeaders(rateLimitResult),
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://layers.hustletogether.com',
}`}
      </CodeBlock>

      <Heading level={2} id="medium-concerns">Medium Priority Concerns</Heading>

      <Heading level={3} id="logging-pii">4. Logging Sensitive Data</Heading>

      <P><strong>Found in:</strong></P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>
          [app/auth/callback/route.ts:51](app/auth/callback/route.ts#L51) - Logs user emails
        </li>
        <li>
          [app/api/v1/chat/route.ts:357](app/api/v1/chat/route.ts#L357) - Exposes error details to users
        </li>
      </ul>

      <P><strong>Risk:</strong></P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>GDPR/privacy violations</li>
        <li>Stack traces might leak implementation details</li>
        <li>Logs become a security liability if breached</li>
      </ul>

      <P><strong>Mitigation:</strong></P>
      <CodeBlock language="typescript">
{`// Bad - logs PII
console.log('[OAuth] User:', data?.user?.email);

// Good - logs anonymized ID
console.log('[OAuth] User authenticated:', data?.user?.id);

// Bad - exposes details to user
return NextResponse.json(
  { error: 'Internal server error', details: String(error) },
  { status: 500 }
);

// Good - generic message, detailed server log
console.error('[API Error]', error);
return NextResponse.json(
  { error: 'Internal server error', request_id: requestId },
  { status: 500 }
);`}
      </CodeBlock>

      <Heading level={3} id="sha256">5. SHA256 for API Key Hashing</Heading>

      <P>
        While better than plain text, SHA256 is not ideal for hashing secrets due to its speed
        (enables rainbow table attacks).
      </P>

      <P><strong>Current State:</strong></P>
      <CodeBlock language="typescript">
{`// lib/supabase/client.ts:46
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}`}
      </CodeBlock>

      <P><strong>Recommendation:</strong></P>
      <CodeBlock language="typescript">
{`import bcrypt from 'bcrypt';

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 12); // 12 rounds = good balance
}

// Note: This makes key lookups slower, but more secure
// Consider caching valid keys in Redis for performance`}
      </CodeBlock>

      <Heading level={3} id="demo-mode">6. Demo Mode Fallback</Heading>

      <P>
        If Supabase isn&apos;t configured, auth middleware returns a mock user. This could accidentally
        run in production.
      </P>

      <P><strong>Mitigation:</strong></P>
      <CodeBlock language="typescript">
{`if (!isSupabaseConfigured()) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase must be configured in production');
  }
  // Demo mode only for local dev
  console.warn('Running in demo mode - dev only');
  return mockUser;
}`}
      </CodeBlock>

      <Heading level={2} id="low-concerns">Lower Priority Improvements</Heading>

      <Heading level={3} id="request-limits">7. Request Size Limits</Heading>

      <P>Add body size limits to prevent abuse:</P>
      <CodeBlock language="javascript">
{`// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};`}
      </CodeBlock>

      <Heading level={3} id="input-sanitization">8. Input Sanitization</Heading>

      <P>Consider adding:</P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>Maximum message length (e.g., 100,000 chars)</li>
        <li>Maximum messages array length (e.g., 100 messages)</li>
        <li>Content filtering for known attack patterns</li>
        <li>Rate limiting on specific model + user combinations</li>
      </ul>

      <Heading level={3} id="cost-controls">9. Maximum Spend Limits</Heading>

      <CodeBlock language="typescript">
{`const MAX_CREDITS_PER_REQUEST = 100;  // ~$1.00
const MAX_CREDITS_PER_HOUR = 1000;     // ~$10.00

if (estimated > MAX_CREDITS_PER_REQUEST) {
  return NextResponse.json(
    {
      error: 'Request exceeds maximum cost',
      max_credits: MAX_CREDITS_PER_REQUEST,
      estimated_credits: estimated
    },
    { status: 400 }
  );
}`}
      </CodeBlock>

      <Heading level={2} id="environment-vars">Environment Variable Security</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Variable</Th>
            <Th>Risk Level</Th>
            <Th>If Compromised</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>SUPABASE_SERVICE_ROLE_KEY</Td>
            <Td><span className="text-red-500 font-bold">Critical</span></Td>
            <Td>Full database access, can read/write all data</Td>
          </Tr>
          <Tr>
            <Td>AI_GATEWAY_API_KEY</Td>
            <Td><span className="text-red-500 font-bold">Critical</span></Td>
            <Td>Can make expensive AI requests on your account</Td>
          </Tr>
          <Tr>
            <Td>STRIPE_SECRET_KEY</Td>
            <Td><span className="text-red-500 font-bold">Critical</span></Td>
            <Td>Can charge customers, access payment info</Td>
          </Tr>
          <Tr>
            <Td>STRIPE_WEBHOOK_SECRET</Td>
            <Td><span className="text-orange-500 font-bold">High</span></Td>
            <Td>Can forge billing webhooks</Td>
          </Tr>
          <Tr>
            <Td>LAYERS_TEST_SECRET</Td>
            <Td><span className="text-orange-500 font-bold">High</span></Td>
            <Td>Bypass authentication completely</Td>
          </Tr>
          <Tr>
            <Td>NEXT_PUBLIC_SUPABASE_ANON_KEY</Td>
            <Td><span className="text-yellow-500 font-bold">Medium</span></Td>
            <Td>Limited by RLS, but could abuse rate limits</Td>
          </Tr>
        </Tbody>
      </Table>

      <P className="mt-4"><strong>Best Practices:</strong></P>
      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>Never commit .env files to git</li>
        <li>Use Vercel&apos;s encrypted environment variables</li>
        <li>Different keys for dev/staging/production</li>
        <li>Rotate keys regularly (quarterly minimum)</li>
        <li>Monitor for leaked keys using GitHub secret scanning</li>
        <li>Store production secrets in a password manager (1Password, Bitwarden)</li>
      </ol>

      <Heading level={2} id="monitoring">Security Monitoring & Alerts</Heading>

      <Heading level={3} id="anomaly-detection">Implement Anomaly Detection</Heading>

      <P>Monitor for suspicious patterns:</P>

      <Table>
        <Thead>
          <Tr>
            <Th>Pattern</Th>
            <Th>Threshold</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Usage spike</Td>
            <Td>10x normal hourly usage</Td>
            <Td>Alert admin, temporary rate limit</Td>
          </Tr>
          <Tr>
            <Td>Failed auth attempts</Td>
            <Td>50 from same IP in 5 min</Td>
            <Td>Block IP temporarily</Td>
          </Tr>
          <Tr>
            <Td>Rapid key creation</Td>
            <Td>5+ keys in 1 hour</Td>
            <Td>Flag account for review</Td>
          </Tr>
          <Tr>
            <Td>Credit refund abuse</Td>
            <Td>Multiple refunds same user</Td>
            <Td>Manual review required</Td>
          </Tr>
          <Tr>
            <Td>High-cost models</Td>
            <Td>Opus/O1 &gt; $100/day</Td>
            <Td>Alert user and admin</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={3} id="audit-logging">Audit Logging</Heading>

      <P>Log security-relevant events to a separate audit table:</P>

      <CodeBlock language="sql">
{`CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'key_created', 'tier_changed', 'auth_failed', etc.
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  severity TEXT -- 'info', 'warning', 'critical'
);`}
      </CodeBlock>

      <P>Events to log:</P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>API key creation/deletion</li>
        <li>Failed authentication attempts</li>
        <li>Credit purchases and refunds</li>
        <li>Subscription tier changes</li>
        <li>Rate limit violations</li>
        <li>Unusually expensive requests</li>
      </ul>

      <Heading level={2} id="checklist">Security Hardening Checklist</Heading>

      <div className="space-y-3 my-6">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Enable RLS on all tables</strong>
            <p className="text-sm text-muted-foreground">Create policies for user_id filtering</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Remove test mode default secret</strong>
            <p className="text-sm text-muted-foreground">Require LAYERS_TEST_SECRET env var</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Disable test mode in production</strong>
            <p className="text-sm text-muted-foreground">Check NODE_ENV before allowing bypass</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Add CORS configuration</strong>
            <p className="text-sm text-muted-foreground">Restrict origins to your domains</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Remove PII from logs</strong>
            <p className="text-sm text-muted-foreground">Use user IDs instead of emails</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Disable demo mode in production</strong>
            <p className="text-sm text-muted-foreground">Throw error if Supabase not configured</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Audit all database queries</strong>
            <p className="text-sm text-muted-foreground">Verify user_id filtering on every query</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Add request size limits</strong>
            <p className="text-sm text-muted-foreground">Set 1MB limit in Next.js config</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Implement max spend limits</strong>
            <p className="text-sm text-muted-foreground">Prevent &gt;$1 per request, &gt;$10 per hour</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Upgrade to bcrypt for API keys</strong>
            <p className="text-sm text-muted-foreground">Better than SHA256 for secret hashing</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Set up anomaly detection</strong>
            <p className="text-sm text-muted-foreground">Alert on 10x usage spikes</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Implement audit logging</strong>
            <p className="text-sm text-muted-foreground">Track key creation, auth failures, tier changes</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Rotate all secrets</strong>
            <p className="text-sm text-muted-foreground">New keys for LAYERS_TEST_SECRET, webhooks</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Enable GitHub secret scanning</strong>
            <p className="text-sm text-muted-foreground">Detect accidental key commits</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" />
          <div>
            <strong>Set up Dependabot</strong>
            <p className="text-sm text-muted-foreground">Auto-update vulnerable dependencies</p>
          </div>
        </div>
      </div>

      <Heading level={2} id="incident-response">Incident Response Plan</Heading>

      <Heading level={3} id="leaked-key">If an API Key Leaks</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>Immediately deactivate the key in dashboard</li>
        <li>Check usage_logs for unauthorized usage</li>
        <li>Notify affected user</li>
        <li>Review how the leak occurred (committed to git, public logs, etc.)</li>
        <li>Generate replacement key for user</li>
        <li>If in git history: use BFG Repo Cleaner to remove from history</li>
      </ol>

      <Heading level={3} id="data-breach">If Database Access Compromised</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>Immediately rotate SUPABASE_SERVICE_ROLE_KEY</li>
        <li>Force logout all users (invalidate sessions)</li>
        <li>Audit database for unauthorized changes</li>
        <li>Check usage_logs for anomalous activity</li>
        <li>Notify affected users per GDPR requirements</li>
        <li>Review and strengthen RLS policies</li>
        <li>Enable database audit logging</li>
        <li>Consider incident response service (e.g., Stripe incident response)</li>
      </ol>

      <Heading level={3} id="billing-abuse">If Billing Abuse Detected</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>Temporarily suspend affected API keys</li>
        <li>Contact user via email</li>
        <li>Review usage_logs for patterns</li>
        <li>Implement stricter rate limits for account</li>
        <li>Consider refund policy (case-by-case)</li>
        <li>Update anomaly detection to catch similar patterns</li>
      </ol>

      <Heading level={2} id="compliance">Compliance Considerations</Heading>

      <Heading level={3} id="gdpr">GDPR (EU Users)</Heading>

      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li><strong>Right to access:</strong> Users can export their data via dashboard</li>
        <li><strong>Right to deletion:</strong> Delete user accounts and all associated data</li>
        <li><strong>Data minimization:</strong> Only collect necessary data (email, usage)</li>
        <li><strong>Breach notification:</strong> Must notify within 72 hours of discovery</li>
        <li><strong>Logging PII:</strong> Remove emails from production logs</li>
      </ul>

      <Heading level={3} id="pci">PCI DSS (Credit Cards)</Heading>

      <P>
        Layers uses Stripe for payment processing, which is PCI Level 1 certified. We never handle
        raw credit card data. Stripe handles all card storage and processing.
      </P>

      <Heading level={3} id="soc2">SOC 2 (Enterprise Customers)</Heading>

      <P>If targeting enterprise customers, consider SOC 2 Type II certification:</P>
      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li>Implement all items in security checklist</li>
        <li>Document security policies and procedures</li>
        <li>Regular penetration testing</li>
        <li>Vendor risk assessments (Anthropic, OpenAI, Supabase, Stripe)</li>
        <li>Incident response procedures</li>
        <li>Employee security training</li>
      </ul>

      <Heading level={2} id="resources">Additional Resources</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Resource</Th>
            <Th>Link</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>OWASP Top 10</Td>
            <Td>
              <a
                href="https://owasp.org/www-project-top-ten/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                owasp.org/top-ten ↗
              </a>
            </Td>
          </Tr>
          <Tr>
            <Td>Supabase Security</Td>
            <Td>
              <a
                href="https://supabase.com/docs/guides/platform/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                supabase.com/docs/security ↗
              </a>
            </Td>
          </Tr>
          <Tr>
            <Td>Next.js Security Headers</Td>
            <Td>
              <a
                href="https://nextjs.org/docs/app/api-reference/next-config-js/headers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                nextjs.org/docs/headers ↗
              </a>
            </Td>
          </Tr>
          <Tr>
            <Td>Stripe Security</Td>
            <Td>
              <a
                href="https://stripe.com/docs/security/guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                stripe.com/docs/security ↗
              </a>
            </Td>
          </Tr>
          <Tr>
            <Td>GDPR Compliance</Td>
            <Td>
              <a
                href="https://gdpr.eu/checklist/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                gdpr.eu/checklist ↗
              </a>
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <Callout type="info" title="Related Documentation">
        <ul className="space-y-1">
          <li>
            <Link href="/docs/authentication" className="text-primary hover:underline">
              Authentication Guide
            </Link>{' '}
            - User and API authentication
          </li>
          <li>
            <Link href="/docs/architecture" className="text-primary hover:underline">
              Architecture Overview
            </Link>{' '}
            - System design and components
          </li>
          <li>
            <Link href="/docs/billing" className="text-primary hover:underline">
              Billing & Credits
            </Link>{' '}
            - Credit system and fraud prevention
          </li>
        </ul>
      </Callout>

      <div className="mt-12 p-6 rounded-lg border bg-muted/30">
        <P className="text-sm text-muted-foreground mb-0">
          <strong>Questions or security concerns?</strong> Please email{' '}
          <a href="mailto:alfonso@mirrorfactory.dev" className="text-primary hover:underline">
            alfonso@mirrorfactory.dev
          </a>{' '}
          for responsible disclosure of security vulnerabilities.
        </P>
      </div>
    </div>
  );
}
