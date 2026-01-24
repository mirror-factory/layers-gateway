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
  InlineCode,
  FeatureCard,
  Flow,
} from '@/components/docs';
import { Shield, Globe, Database, Key, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Gateway Architecture - Layers Docs',
  description: 'How Layers Gateway works and integrates with Hustle Together AI',
};

export default function ArchitecturePage() {
  return (
    <div>
      <Heading level={1}>Gateway Architecture</Heading>
      <P>
        Layers is an AI Gateway built on top of the Hustle Together AI SDK. It sits between
        your applications and AI providers, providing unified access, automatic billing,
        and usage tracking.
      </P>

      <div className="rounded-lg border bg-muted/50 p-4 my-6">
        <p className="text-sm text-muted-foreground">
          <strong>Powered by Hustle Together AI SDK</strong> - The Hustle Together AI SDK provides the model registry (40 models: 19 language, 21 image/multimodal from 6 providers), real-time pricing data synced daily from all providers, and Vercel AI Gateway integration. Layers wraps this with authentication, credit management, rate limiting, and Stripe billing.
        </p>
      </div>

      <Heading level={2} id="what-is-layers-gateway">What is Layers Gateway?</Heading>

      <P>
        Think of Layers as <strong>"npm for AI models"</strong> - one unified interface for all
        providers. Instead of managing separate API keys and tracking usage manually across
        Anthropic, OpenAI, Google, etc., Layers handles everything automatically.
      </P>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <FeatureCard
          icon="key"
          title="Unified API Key"
          description="One key for all providers - no more juggling multiple credentials."
        />
        <FeatureCard
          icon="bar-chart"
          title="Automatic Tracking"
          description="Every API call logs tokens, costs, and credits automatically."
        />
        <FeatureCard
          icon="database"
          title="Credit System"
          description="Transparent pricing - 1 credit = $0.01 USD across all providers."
        />
        <FeatureCard
          icon="shield"
          title="Centralized Enforcement"
          description="Rate limits, quotas, and billing enforced at the gateway level."
        />
      </div>

      <Heading level={2} id="multi-app-platform">Multi-App Platform Architecture</Heading>

      <P>
        Layers is designed for building a multi-application AI platform where users have
        one account across all your apps, with a single shared credit balance.
      </P>

      <div className="my-6 p-6 rounded-lg border bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-background border">
            <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Multiple Apps</p>
            <p className="text-xs text-muted-foreground">Build 3-4+ AI-powered apps</p>
          </div>
          <div className="p-4 rounded-lg bg-background border">
            <Key className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Single Account</p>
            <p className="text-xs text-muted-foreground">Users log in once</p>
          </div>
          <div className="p-4 rounded-lg bg-background border">
            <Database className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Shared Balance</p>
            <p className="text-xs text-muted-foreground">Credits work everywhere</p>
          </div>
          <div className="p-4 rounded-lg bg-background border">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium text-sm">Central Billing</p>
            <p className="text-xs text-muted-foreground">One place for limits</p>
          </div>
        </div>
      </div>

      <Callout type="info" title="Why Gateway Architecture?">
        The gateway pattern provides centralized enforcement. When a user hits their credit
        limit, ALL apps are blocked immediately. With client-side tracking, apps could bypass
        limits. The gateway ensures complete control and security.
      </Callout>

      <Heading level={2} id="request-flow">Request Flow</Heading>

      <P>
        When your application makes a request through Layers Gateway, here's what happens:
      </P>

      <div className="my-8 space-y-4">
        {/* Step 0: Your Application */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-lg border-2 border-foreground bg-background">
            <div className="font-medium text-center mb-2">YOUR APPLICATION</div>
            <div className="text-sm text-muted-foreground text-center">
              POST /api/v1/chat<br/>
              Authorization: Bearer lyr_live_xxx
            </div>
          </div>
          <div className="text-2xl my-2">↓</div>
        </div>

        {/* Layers Gateway Container */}
        <div className="w-full p-6 rounded-lg border-2 border-primary bg-primary/5">
          <div className="text-center font-bold text-lg mb-2">LAYERS GATEWAY</div>
          <div className="text-center text-sm text-muted-foreground mb-6">layers.hustletogether.com</div>

          <div className="space-y-4">
            {/* Step 1: Auth */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="font-medium mb-2">1. AUTH MIDDLEWARE</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Validate API key format (lyr_live_* or lyr_test_*)</li>
                <li>• Look up key in database</li>
                <li>• Return 401 if invalid/expired/revoked</li>
              </ul>
            </div>
            <div className="text-center text-2xl">↓</div>

            {/* Step 2: Rate Limit */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="font-medium mb-2">2. RATE LIMIT MIDDLEWARE</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check requests/minute by subscription tier</li>
                <li>• Free: 10/min, Starter: 60, Pro: 300, Team: 1000</li>
                <li>• Return 429 if exceeded</li>
              </ul>
            </div>
            <div className="text-center text-2xl">↓</div>

            {/* Step 3: Credit Pre-Check */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="font-medium mb-2">3. CREDIT PRE-CHECK</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Estimate cost based on model + max_tokens</li>
                <li>• Check user balance</li>
                <li>• Return 402 if insufficient credits</li>
              </ul>
            </div>
            <div className="text-center text-2xl">↓</div>

            {/* Step 4: Forward to SDK */}
            <div className="p-4 rounded-lg border bg-background">
              <div className="font-medium mb-2">4. FORWARD TO HUSTLE TOGETHER AI SDK</div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Route request to Hustle Together AI SDK</li>
                <li>• SDK handles model lookup and provider routing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center text-2xl">↓</div>

        {/* Hustle Together AI SDK */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-lg border-2 border-foreground bg-background">
            <div className="font-medium text-center mb-2">HUSTLE TOGETHER AI SDK</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Look up model in registry (40 models)</li>
              <li>• Get pricing data (synced daily)</li>
              <li>• Route via Vercel AI Gateway to provider:</li>
              <li className="ml-4">• anthropic/* → Anthropic API</li>
              <li className="ml-4">• openai/* → OpenAI API</li>
              <li className="ml-4">• google/* → Google AI API</li>
              <li className="ml-4">• perplexity/* → Perplexity API</li>
              <li className="ml-4">• morph/* → Morph API</li>
              <li className="ml-4">• bfl/* → Black Forest Labs (Flux)</li>
              <li className="ml-4">• recraft/* → Recraft API</li>
            </ul>
          </div>
          <div className="text-2xl my-2">↓</div>
        </div>

        {/* AI Providers */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md p-4 rounded-lg border-2 border-foreground bg-background">
            <div className="font-medium text-center mb-2">AI PROVIDERS (6 Total)</div>
            <div className="text-sm text-muted-foreground text-center">
              Anthropic, OpenAI, Google, Perplexity, Morph, BFL, Recraft
            </div>
          </div>
          <div className="text-2xl my-2">↓</div>
        </div>

        {/* Response Processing */}
        <div className="w-full p-6 rounded-lg border-2 border-primary bg-primary/5">
          <div className="p-4 rounded-lg border bg-background">
            <div className="font-medium mb-2">5. POST-PROCESSING (Layers)</div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Calculate actual credits used (via SDK pricing)</li>
              <li>• Deduct from user balance</li>
              <li>• Log usage to database</li>
              <li>• Return OpenAI-compatible response</li>
            </ul>
          </div>
        </div>
      </div>

      <Heading level={2} id="layers-toggle">The Layers Toggle</Heading>

      <P>
        In Hustle Together AI (and other apps), you'll see a "Use Layers Gateway" toggle.
        This controls whether requests route through Layers or directly to providers.
      </P>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        <div className="p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-10 rounded-full bg-muted-foreground/30 relative">
              <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-muted-foreground" />
            </div>
            <span className="font-medium">Toggle OFF</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            <strong>Request Flow:</strong> Your App → AI Gateway → AI Provider
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Direct provider calls</li>
            <li>• No usage tracking</li>
            <li>• Good for development/testing</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg border border-primary/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-10 rounded-full bg-primary relative">
              <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-background" />
            </div>
            <span className="font-medium text-primary">Toggle ON</span>
          </div>
          <p className="text-sm mb-2">
            <strong>Request Flow:</strong> Your App → <span className="text-primary">Layers</span> → AI Provider
          </p>
          <ul className="text-sm space-y-1">
            <li>• Automatic usage tracking</li>
            <li>• Credit billing</li>
            <li>• Centralized enforcement</li>
            <li>• Your brand visible to users</li>
          </ul>
        </div>
      </div>

      <Heading level={2} id="technical-implementation">Technical Implementation</Heading>

      <Heading level={3} id="provider-selection">Provider Selection</Heading>

      <P>
        When the toggle is ON, the app uses <InlineCode>getProvider()</InlineCode> to
        route requests through Layers:
      </P>

      <CodeBlock language="typescript" filename="lib/models/get-provider.ts">
{`import { createOpenAI } from '@ai-sdk/openai';

// Layers provider instance
const layers = createOpenAI({
  baseURL: 'https://layers.hustletogether.com/api/v1',
  apiKey: process.env.LAYERS_API_KEY,
});

export function getProvider(modelId: string, useLayers: boolean) {
  if (useLayers) {
    return layers.chat(modelId);  // → layers.hustletogether.com
  }
  return modelId;  // → Direct AI Gateway
}`}
      </CodeBlock>

      <CodeBlock language="typescript" filename="app/api/chat/route.ts">
{`import { generateText } from 'ai';
import { getProvider } from '@/lib/models/get-provider';

export async function POST(req: Request) {
  const { model, prompt, useLayers } = await req.json();

  const result = await generateText({
    model: getProvider(model, useLayers),
    prompt,
  });

  return Response.json({ text: result.text });
}`}
      </CodeBlock>

      <Heading level={3} id="layers-gateway-internals">Gateway Internals</Heading>

      <P>
        Inside Layers Gateway, requests are processed through middleware and routed to providers:
      </P>

      <CodeBlock language="typescript" filename="Layers Gateway: app/api/v1/chat/route.ts">
{`export async function POST(req: Request) {
  const body = await req.json();
  const apiKey = req.headers.get('Authorization');

  // 1. Authenticate
  const user = await validateApiKey(apiKey);

  // 2. Check rate limits
  const rateLimit = checkRateLimit(user.id, user.tier);
  if (!rateLimit.allowed) return rateLimit.response;

  // 3. Pre-check credits
  const estimated = estimateCredits(body.model, body.max_tokens);
  if (user.balance < estimated) return insufficientCredits();

  // 4. Call AI provider via SDK
  const result = await generateText({
    model: gateway(body.model),  // Routes based on prefix
    ...body
  });

  // 5. Calculate actual credits and deduct
  const { credits, breakdown } = calculateCreditsWithBreakdown(
    body.model,
    result.usage.promptTokens,
    result.usage.completionTokens
  );
  await deductCredits(user.id, credits);
  await logUsage({ user, model: body.model, credits, breakdown });

  // 6. Return response with Layers metadata
  return Response.json({
    ...result,
    layers: { credits_used: credits, cost_breakdown: breakdown }
  });
}`}
      </CodeBlock>

      <Heading level={2} id="pricing-sync">Pricing Sync</Heading>

      <P>
        Layers automatically syncs pricing from Hustle Together AI to ensure accurate
        cost calculations:
      </P>

      <CodeBlock language="typescript">
{`// Pricing is synced from Hustle Together AI
// Source: https://ai.hustletogether.com/api/pricing
// Frequency: Every 24 hours (cached)

// When calculating credits:
const syncedPricing = getSyncedModelPricing(model);
const baseCost = (inputTokens / 1000) * syncedPricing.input
               + (outputTokens / 1000) * syncedPricing.output;
const credits = (baseCost / 0.01) * (1 + marginPercent / 100);`}
      </CodeBlock>

      <Callout type="info">
        See{' '}
        <Link href="/docs/billing" className="text-primary hover:underline">
          Billing & Credits
        </Link>{' '}
        for full pricing documentation.
      </Callout>

      <Heading level={2} id="transparent-passthrough">Transparent Pass-Through</Heading>

      <P>
        Layers Gateway preserves all provider-specific response fields. This means features
        like Perplexity sources, Claude thinking blocks, and tool call arguments work
        identically whether you use Layers or direct provider calls.
      </P>

      <Table>
        <Thead>
          <Tr>
            <Th>Feature</Th>
            <Th>Direct API</Th>
            <Th>Layers Gateway</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Tool call arguments</Td>
            <Td>Passed through</Td>
            <Td>Passed through</Td>
          </Tr>
          <Tr>
            <Td>Perplexity sources/citations</Td>
            <Td>Passed through</Td>
            <Td>Passed through</Td>
          </Tr>
          <Tr>
            <Td>Extended thinking</Td>
            <Td>Passed through</Td>
            <Td>Passed through</Td>
          </Tr>
          <Tr>
            <Td>Token counts</Td>
            <Td>Passed through</Td>
            <Td>Passed through + credits</Td>
          </Tr>
          <Tr>
            <Td>Provider metadata</Td>
            <Td>Passed through</Td>
            <Td>Passed through</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="key-files">Key Implementation Files</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>File</Th>
            <Th>Purpose</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><InlineCode>lib/gateway/client.ts</InlineCode></Td>
            <Td>AI SDK wrapper, provider routing, response transformation</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>lib/middleware/auth.ts</InlineCode></Td>
            <Td>API key validation, user authentication</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>lib/middleware/credits.ts</InlineCode></Td>
            <Td>Credit calculation, deduction, usage logging</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>lib/middleware/rate-limit.ts</InlineCode></Td>
            <Td>Tier-based rate limiting</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>lib/pricing/sync.ts</InlineCode></Td>
            <Td>Pricing sync from Hustle Together AI</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>lib/models/registry.ts</InlineCode></Td>
            <Td>Model definitions with capabilities and pricing</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="branding">Your Brand, Your Infrastructure</Heading>

      <P>
        When using Layers Gateway, all AI requests flow through{' '}
        <InlineCode>layers.hustletogether.com</InlineCode>. This is YOUR infrastructure,
        YOUR brand.
      </P>

      <ul className="list-disc ml-6 space-y-2 text-muted-foreground my-4">
        <li><strong>Your API</strong> - Apps integrate with layers.hustletogether.com</li>
        <li><strong>Your Relationship</strong> - You own the customer relationship</li>
        <li><strong>Your Features</strong> - Add caching, fallbacks, rate limiting</li>
        <li><strong>Your Pricing</strong> - Set margins, offer volume discounts</li>
        <li><strong>Your Control</strong> - Swap providers without apps knowing</li>
      </ul>

      <Heading level={2} id="next-steps">Next Steps</Heading>

      <div className="grid gap-2 mt-4">
        {[
          { href: '/docs/getting-started', title: 'Getting Started', desc: 'Quick setup guide' },
          { href: '/docs/billing', title: 'Billing & Credits', desc: 'Credit system and margins' },
          { href: '/docs/api', title: 'API Reference', desc: 'Full endpoint documentation' },
          { href: '/dashboard', title: 'Dashboard', desc: 'Manage your Layers account' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
          >
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
