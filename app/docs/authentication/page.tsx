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
import { Lock, Key, Shield } from 'lucide-react';

export const metadata = {
  title: 'Authentication - Layers Documentation',
  description: 'Complete documentation for authentication in Layers, covering both user authentication and API authentication',
};

export default function AuthenticationPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Security</span>
        </div>
        <Heading level={1}>Authentication Guide</Heading>
        <P>
          Complete documentation for authentication in Layers, covering both user authentication
          (dashboard access) and API authentication (programmatic access).
        </P>
      </div>

      <Heading level={2} id="overview">Overview</Heading>

      <P>Layers uses two authentication systems:</P>

      <Table>
        <Thead>
          <Tr>
            <Th>System</Th>
            <Th>Purpose</Th>
            <Th>Method</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><strong>User Authentication</strong></Td>
            <Td>Access dashboard, manage keys, billing</Td>
            <Td>Supabase Auth (Email/Password, Google OAuth)</Td>
          </Tr>
          <Tr>
            <Td><strong>API Authentication</strong></Td>
            <Td>Make API requests</Td>
            <Td>API Keys (lyr_live_*, lyr_test_*)</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="user-auth">User Authentication (Dashboard)</Heading>

      <Heading level={3} id="signup-options">Sign Up Options</Heading>

      <P>Users can create a Layers account using:</P>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li><strong>Email & Password</strong> - Traditional signup with email confirmation</li>
        <li><strong>Google OAuth</strong> - One-click signup with Google account</li>
      </ol>

      <Heading level={3} id="email-flow">Email & Password Flow</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>User enters email and password on [/signup](/signup)</li>
        <li>Supabase Auth creates the user account</li>
        <li>Confirmation email sent to user via Resend (transactional email service)</li>
        <li>User clicks confirmation link</li>
        <li>User redirected to dashboard</li>
      </ol>

      <Callout type="info" title="Email Delivery">
        Layers uses <strong>Resend</strong> for all transactional emails including signup confirmations,
        password resets, and magic links. Resend is integrated with Supabase Auth for reliable email delivery.
      </Callout>

      <Heading level={3} id="oauth-flow">Google OAuth Flow</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>User clicks "Continue with Google" on [/login](/login) or [/signup](/signup)</li>
        <li>Redirect to Google OAuth consent screen</li>
        <li>User authorizes Layers to access basic profile info</li>
        <li>Google redirects to `/auth/callback` with authorization code</li>
        <li>Server exchanges code for session tokens</li>
        <li>Session cookies set on response</li>
        <li>User redirected to dashboard</li>
      </ol>

      <Heading level={3} id="auth-architecture">Authentication Architecture</Heading>

      <div className="my-8 p-6 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-foreground bg-background flex items-center justify-center">
              <span className="text-sm font-medium text-center">Browser<br/>(Client)</span>
            </div>
          </div>

          <div className="text-2xl text-muted-foreground">→</div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-primary bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-center">Next.js App<br/>(Server)</span>
            </div>
          </div>

          <div className="text-2xl text-muted-foreground">→</div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-foreground bg-background flex items-center justify-center">
              <span className="text-sm font-medium text-center">Supabase<br/>Auth</span>
            </div>
          </div>
        </div>
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Cookies ← → JWT Tokens
        </div>
      </div>

      <P><strong>Key Components:</strong></P>

      <Table>
        <Thead>
          <Tr>
            <Th>Component</Th>
            <Th>File</Th>
            <Th>Purpose</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Browser Client</Td>
            <Td>[lib/supabase/browser.ts](lib/supabase/browser.ts)</Td>
            <Td>Client-side Supabase for auth UI</Td>
          </Tr>
          <Tr>
            <Td>Server Client</Td>
            <Td>[lib/supabase/server.ts](lib/supabase/server.ts)</Td>
            <Td>Server-side Supabase for protected routes</Td>
          </Tr>
          <Tr>
            <Td>Middleware</Td>
            <Td>[lib/supabase/middleware.ts](lib/supabase/middleware.ts)</Td>
            <Td>Session refresh, route protection</Td>
          </Tr>
          <Tr>
            <Td>OAuth Callback</Td>
            <Td>[app/auth/callback/route.ts](app/auth/callback/route.ts)</Td>
            <Td>Exchange OAuth code for session</Td>
          </Tr>
          <Tr>
            <Td>Email Delivery</Td>
            <Td>Resend (via Supabase)</Td>
            <Td>Transactional emails (confirmations, password resets)</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={3} id="session-management">Session Management</Heading>

      <P>Sessions are managed using HTTP-only cookies via @supabase/ssr:</P>

      <ul className="list-disc list-inside space-y-2 my-4 ml-4">
        <li><strong>Cookie Name:</strong> sb-{'{project-ref}'}-auth-token</li>
        <li><strong>Storage:</strong> HTTP-only, secure, SameSite=Lax</li>
        <li><strong>Refresh:</strong> Automatic via middleware on each request</li>
        <li><strong>Expiry:</strong> Configurable (default: 1 week, refreshable)</li>
      </ul>

      <Heading level={3} id="protected-routes">Protected Routes</Heading>

      <P>Routes under /dashboard/* require authentication:</P>

      <CodeBlock language="typescript">
{`// Middleware checks for valid session
const protectedPaths = ['/dashboard'];

if (isProtectedPath && !user) {
  // Redirect to login with return URL
  redirect('/login?redirectTo=/dashboard');
}`}
      </CodeBlock>

      <Heading level={3} id="security-practices">Security Best Practices Implemented</Heading>

      <div className="space-y-4 my-6">
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Server-Side Session Validation
          </h4>
          <p className="text-sm text-muted-foreground">
            Always use supabase.auth.getUser() on server, never trust client session.
            JWT validated against Supabase Auth server on each request.
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            HTTP-Only Cookies
          </h4>
          <p className="text-sm text-muted-foreground">
            Session tokens stored in HTTP-only cookies, not accessible via JavaScript (XSS protection).
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            PKCE Flow for OAuth
          </h4>
          <p className="text-sm text-muted-foreground">
            Code verifier stored securely during OAuth flow to prevent authorization code interception attacks.
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Secure Cookie Attributes
          </h4>
          <p className="text-sm text-muted-foreground">
            Secure (HTTPS only in production), SameSite=Lax (CSRF protection), HttpOnly (no JavaScript access).
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Automatic Session Refresh
          </h4>
          <p className="text-sm text-muted-foreground">
            Middleware refreshes tokens before expiry for seamless user experience without re-login.
          </p>
        </div>
      </div>

      <Heading level={2} id="api-auth">API Authentication (Programmatic Access)</Heading>

      <Heading level={3} id="api-key-format">API Key Format</Heading>

      <CodeBlock language="text">
{`lyr_live_sk_1a2b3c4d5e6f7890...
lyr_test_sk_1a2b3c4d5e6f7890...`}
      </CodeBlock>

      <Table>
        <Thead>
          <Tr>
            <Th>Prefix</Th>
            <Th>Environment</Th>
            <Th>Billing</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>lyr_live_</Td>
            <Td>Production</Td>
            <Td>Deducts credits</Td>
          </Tr>
          <Tr>
            <Td>lyr_test_</Td>
            <Td>Testing</Td>
            <Td>Limited, no billing</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={3} id="using-api-keys">Using API Keys</Heading>

      <P>Include your API key in the Authorization header:</P>

      <CodeBlock language="bash">
{`curl -X POST https://layers.hustletogether.com/api/v1/chat \\
  -H "Authorization: Bearer lyr_live_sk_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "anthropic/claude-sonnet-4.5", "messages": [{"role": "user", "content": "Hello"}]}'`}
      </CodeBlock>

      <Heading level={3} id="api-key-security">API Key Security</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li><strong>Hashed Storage</strong> - Keys are hashed before storage (we can't see your full key)</li>
        <li><strong>Server-Side Only</strong> - Never expose keys in client-side code</li>
        <li><strong>Environment Variables</strong> - Store in .env, never commit to git</li>
        <li><strong>Key Rotation</strong> - Generate new keys and revoke old ones if compromised</li>
      </ol>

      <Heading level={3} id="rate-limiting">Rate Limiting</Heading>

      <P>Rate limits are applied per API key based on subscription tier:</P>

      <Table>
        <Thead>
          <Tr>
            <Th>Tier</Th>
            <Th>Requests/Minute</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Free</Td>
            <Td>10</Td>
          </Tr>
          <Tr>
            <Td>Starter</Td>
            <Td>60</Td>
          </Tr>
          <Tr>
            <Td>Pro</Td>
            <Td>300</Td>
          </Tr>
          <Tr>
            <Td>Team</Td>
            <Td>1,000</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="troubleshooting">Troubleshooting</Heading>

      <Heading level={3} id="oauth-issues">OAuth Login Not Working</Heading>

      <P><strong>Symptoms:</strong> User authenticates with Google but gets redirected back to login.</P>

      <P><strong>Common Causes:</strong></P>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li><strong>Supabase Redirect URLs</strong> - Ensure https://yourdomain.com/auth/callback is in Supabase Auth settings</li>
        <li><strong>Google OAuth Credentials</strong> - Verify Client ID and Secret are correct in Supabase</li>
        <li><strong>Cookie Domain Mismatch</strong> - Ensure cookies are set for the correct domain</li>
        <li><strong>Missing Environment Variables</strong> - Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
      </ol>

      <P><strong>Debug Steps:</strong></P>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li>Check browser Network tab for Set-Cookie headers on /auth/callback response</li>
        <li>Check server logs for [OAuth Callback] messages</li>
        <li>Verify Supabase dashboard shows the user was created</li>
      </ol>

      <Heading level={3} id="session-issues">Session Not Persisting</Heading>

      <P><strong>Symptoms:</strong> User logs in but appears logged out on page refresh.</P>

      <P><strong>Common Causes:</strong></P>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li><strong>Cookies not being set</strong> - Check Set-Cookie headers in response</li>
        <li><strong>Middleware not running</strong> - Verify middleware.ts is configured correctly</li>
        <li><strong>Cookie blocked</strong> - Third-party cookie settings in browser</li>
      </ol>

      <Heading level={3} id="api-key-errors">API Key Authentication Errors</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Error</Th>
            <Th>Cause</Th>
            <Th>Fix</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Missing Authorization header</Td>
            <Td>No header sent</Td>
            <Td>Add Authorization: Bearer {'{key}'}</Td>
          </Tr>
          <Tr>
            <Td>Invalid API key format</Td>
            <Td>Wrong prefix</Td>
            <Td>Use lyr_live_ or lyr_test_</Td>
          </Tr>
          <Tr>
            <Td>Invalid API key</Td>
            <Td>Key not found</Td>
            <Td>Check key is correct</Td>
          </Tr>
          <Tr>
            <Td>API key is deactivated</Td>
            <Td>Key disabled</Td>
            <Td>Reactivate or create new key</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="configuration">Configuration Checklist</Heading>

      <Heading level={3} id="supabase-settings">Supabase Dashboard Settings</Heading>

      <ul className="space-y-2 my-4">
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Site URL:</strong> https://layers.hustletogether.com</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Redirect URLs:</strong> Include https://layers.hustletogether.com/auth/callback</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Google OAuth:</strong> Client ID and Secret configured</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Email Provider:</strong> Resend configured in Auth → Email settings</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Email Templates:</strong> Confirm signup template uses correct token hash format</span>
        </li>
      </ul>

      <Heading level={3} id="env-variables">Environment Variables</Heading>

      <CodeBlock language="bash">
{`# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional: Service role for admin operations
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Resend (configured in Supabase dashboard)
# No additional environment variables needed - configured via Supabase Auth settings`}
      </CodeBlock>

      <Heading level={3} id="google-console">Google Cloud Console</Heading>

      <ul className="space-y-2 my-4">
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>OAuth 2.0 Client</strong> created</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Authorized redirect URIs:</strong> https://{'{project-ref}'}.supabase.co/auth/v1/callback</span>
        </li>
        <li className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" />
          <span><strong>Authorized JavaScript origins:</strong> Your app domain</span>
        </li>
      </ul>

      <Heading level={2} id="security-recommendations">Security Recommendations</Heading>

      <ol className="list-decimal list-inside space-y-2 my-4">
        <li><strong>Never log sensitive tokens</strong> - Access tokens, refresh tokens, API keys</li>
        <li><strong>Use environment variables</strong> - Never hardcode credentials</li>
        <li><strong>Implement rate limiting</strong> - Protect against brute force</li>
        <li><strong>Monitor auth logs</strong> - Detect suspicious activity</li>
        <li><strong>Rotate keys regularly</strong> - API keys and OAuth secrets</li>
        <li><strong>Use HTTPS everywhere</strong> - Secure cookie transmission</li>
        <li><strong>Validate on server</strong> - Never trust client-side auth state</li>
      </ol>

      <Callout type="info" title="Related Documentation">
        <ul className="space-y-1">
          <li>
            <Link href="/docs/getting-started" className="text-primary hover:underline">
              Getting Started
            </Link>{' '}
            - Quick setup guide
          </li>
          <li>
            <Link href="/docs/billing" className="text-primary hover:underline">
              Billing & Credits
            </Link>{' '}
            - Understand billing
          </li>
          <li>
            <a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Supabase Auth Docs ↗
            </a>{' '}
            - Official Supabase documentation
          </li>
        </ul>
      </Callout>
    </div>
  );
}
