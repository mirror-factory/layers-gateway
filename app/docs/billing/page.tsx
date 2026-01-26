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
} from '@/components/docs';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Billing & Credits - Layers Docs',
  description: 'Complete guide to Layers billing - credits, margins, Stripe integration',
};

export default function BillingPage() {
  return (
    <div>
      <Heading level={1}>Billing & Credits</Heading>
      <P>
        Everything about how Layers billing works: the credit system, cost calculations,
        margins, Stripe subscriptions, and pricing synchronization.
      </P>

      <div className="rounded-lg border bg-muted/50 p-4 my-6">
        <p className="text-sm text-muted-foreground">
          <strong>Powered by Hustle Together AI SDK</strong> - All model pricing data is synced from the Hustle Together AI SDK every 24 hours. The SDK aggregates real-time pricing from all AI providers to ensure accurate cost calculations.
        </p>
      </div>

      <Heading level={2} id="credit-system">Credit System Overview</Heading>

      <P>
        Layers uses a unified credit system that abstracts away the complexity of different
        AI provider pricing models into a single balance.
      </P>

      <Callout type="info" title="Core Concept">
        <strong>1 credit = $0.01 USD worth of AI usage (before margin)</strong>
        <br />
        With the default 60% margin, each credit costs you ~$0.016.
      </Callout>

      <Heading level={2} id="token-counting">How Token Counting Works</Heading>

      <P>
        Understanding the separation between what the AI SDK provides and what Layers calculates
        is key to understanding your billing.
      </P>

      <Heading level={3}>The Flow</Heading>

      <div className="my-6 space-y-4">
        {/* Step 1 */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">You make API request</h4>
              <CodeBlock language="bash">
{`POST /api/v1/chat
{ "model": "claude-3-5-sonnet", "messages": [...] }`}
              </CodeBlock>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Step 2 */}
        <div className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold">2</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Hustle Together AI SDK processes request</h4>
              <p className="text-sm text-muted-foreground mb-2">Returns token counts only:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <InlineCode>prompt_tokens: 12</InlineCode></li>
                <li>• <InlineCode>completion_tokens: 8</InlineCode></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Step 3 */}
        <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Layers calculates costs <span className="text-primary">(YOUR BILLING)</span></h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary">→</span>
                  <span>Looks up model pricing from registry</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">→</span>
                  <div>
                    <div>Calculates base cost in USD</div>
                    <InlineCode className="text-xs">(12 × $3/1M) + (8 × $15/1M) = $0.00024</InlineCode>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">→</span>
                  <div>
                    <div>Applies 60% margin</div>
                    <InlineCode className="text-xs">$0.00024 × 1.6 = $0.000384</InlineCode>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">→</span>
                  <div>
                    <div>Converts to credits</div>
                    <InlineCode className="text-xs">$0.000384 / $0.01 = 0.0384 credits</InlineCode>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
        </div>

        {/* Step 4 */}
        <div className="rounded-lg border bg-green-500/5 border-green-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold">4</div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Response includes both</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">→</span>
                  <span>Standard <InlineCode>usage</InlineCode> field (SDK data)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">→</span>
                  <span><InlineCode>layers</InlineCode> field (your cost breakdown)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Heading level={3}>Complete API Response</Heading>

      <P>
        Every Layers API response includes both the standard OpenAI-compatible usage field
        and a detailed Layers cost breakdown:
      </P>

      <CodeBlock language="json">
{`{
  "id": "msg_01ABC123...",
  "model": "claude-3-5-sonnet-20241022",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "The capital of France is Paris."
    }
  ],
  "stop_reason": "end_turn",

  // Standard usage field (from Hustle Together AI SDK)
  "usage": {
    "prompt_tokens": 12,        // ← SDK provides this
    "completion_tokens": 8,      // ← SDK provides this
    "total_tokens": 20
  },

  // Layers cost breakdown (calculated by Layers)
  "layers": {
    "credits_used": 0.00048,     // ← Your actual charge
    "latency_ms": 847,
    "cost_breakdown": {
      "model": "claude-3-5-sonnet-20241022",
      "input_tokens": 12,        // ← Used for calculation
      "output_tokens": 8,         // ← Used for calculation
      "base_cost_usd": 0.0003,   // ← Calculated by Layers
      "margin_percent": 60,       // ← Your margin
      "margin_cost_usd": 0.00018, // ← Calculated by Layers
      "total_cost_usd": 0.00048,  // ← Calculated by Layers
      "credits": 0.00048          // ← What you pay
    }
  }
}`}
      </CodeBlock>

      <Callout type="success" title="Key Takeaway">
        <strong>The SDK only provides token counts.</strong> Layers does all the pricing math:
        <br />• Looks up model pricing (synced from Hustle Together AI)
        <br />• Calculates USD cost from tokens
        <br />• Applies your margin
        <br />• Converts to credits
        <br />• Provides transparent cost breakdown
      </Callout>

      <Heading level={2} id="cost-calculation">Cost Calculation</Heading>

      <Heading level={3}>The Formula</Heading>

      <CodeBlock language="text">
{`credits = (base_cost_usd / $0.01) × (1 + margin_percent / 100)

With the default 60% margin:
credits = (base_cost_usd / $0.01) × 1.60`}
      </CodeBlock>

      <Heading level={3}>Example Calculation</Heading>

      <P>
        Using Claude Sonnet 4.5 with 1,000 input tokens and 500 output tokens:
      </P>

      <Table>
        <Thead>
          <Tr>
            <Th>Component</Th>
            <Th>Calculation</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><strong>Input Cost</strong></Td>
            <Td>1,000 tokens × $3.00/1M</Td>
            <Td>$0.003</Td>
          </Tr>
          <Tr>
            <Td><strong>Output Cost</strong></Td>
            <Td>500 tokens × $15.00/1M</Td>
            <Td>$0.0075</Td>
          </Tr>
          <Tr>
            <Td><strong>Base Cost</strong></Td>
            <Td>$0.003 + $0.0075</Td>
            <Td>$0.0105</Td>
          </Tr>
          <Tr>
            <Td><strong>Credits (before margin)</strong></Td>
            <Td>$0.0105 / $0.01</Td>
            <Td>1.05</Td>
          </Tr>
          <Tr>
            <Td><strong>Margin (60%)</strong></Td>
            <Td>1.05 × 0.60</Td>
            <Td>0.63</Td>
          </Tr>
          <Tr>
            <Td><strong>Total Credits</strong></Td>
            <Td>1.05 + 0.63</Td>
            <Td><strong>1.68 credits</strong></Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="model-pricing">Model Pricing Reference</Heading>

      <Callout type="info" title="Dynamic Pricing">
        For current pricing on all 40 models, see the{' '}
        <Link href="/dashboard/pricing" className="text-primary hover:underline font-medium">
          Pricing Dashboard
        </Link>{' '}
        which pulls real-time data from the Hustle Together AI SDK. The examples below are for illustration.
      </Callout>

      <P>Example prices per <strong>1,000 tokens</strong>:</P>

      <Table>
        <Thead>
          <Tr>
            <Th>Model</Th>
            <Th>Provider</Th>
            <Th>Input USD</Th>
            <Th>Output USD</Th>
            <Th>Credits (60%)</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>GPT-4o Mini</Td>
            <Td>OpenAI</Td>
            <Td>$0.0001</Td>
            <Td>$0.0006</Td>
            <Td>~0.01</Td>
          </Tr>
          <Tr>
            <Td>Gemini 2.5 Flash</Td>
            <Td>Google</Td>
            <Td>$0.0003</Td>
            <Td>$0.0025</Td>
            <Td>~0.05</Td>
          </Tr>
          <Tr>
            <Td>Claude 4.5 Haiku</Td>
            <Td>Anthropic</Td>
            <Td>$0.001</Td>
            <Td>$0.005</Td>
            <Td>~0.10</Td>
          </Tr>
          <Tr>
            <Td>Claude 4.5 Sonnet</Td>
            <Td>Anthropic</Td>
            <Td>$0.003</Td>
            <Td>$0.015</Td>
            <Td>~0.29</Td>
          </Tr>
          <Tr>
            <Td>GPT-4o</Td>
            <Td>OpenAI</Td>
            <Td>$0.0025</Td>
            <Td>$0.01</Td>
            <Td>~0.20</Td>
          </Tr>
          <Tr>
            <Td>Claude 4.5 Opus</Td>
            <Td>Anthropic</Td>
            <Td>$0.005</Td>
            <Td>$0.025</Td>
            <Td>~0.48</Td>
          </Tr>
        </Tbody>
      </Table>

      <P>
        View live pricing at{' '}
        <Link href="/dashboard/pricing" className="text-primary hover:underline">
          /dashboard/pricing
        </Link>.
      </P>

      <Heading level={2} id="margin-system">Margin System</Heading>

      <P>
        The margin is the markup Layers applies on top of base AI provider costs.
        The default margin is <strong>60%</strong>.
      </P>

      <Heading level={3}>Margin Breakdown in API Response</Heading>

      <P>Every API response includes both standard usage and a detailed Layers cost breakdown:</P>

      <CodeBlock language="json">
{`{
  // ... message content ...

  "usage": {
    "prompt_tokens": 1000,
    "completion_tokens": 500,
    "total_tokens": 1500
  },

  "layers": {
    "credits_used": 1.68,
    "latency_ms": 1243,
    "cost_breakdown": {
      "model": "claude-3-5-sonnet-20241022",
      "input_tokens": 1000,
      "output_tokens": 500,
      "base_cost_usd": 0.0105,
      "margin_percent": 60,
      "margin_cost_usd": 0.0063,
      "total_cost_usd": 0.0168,
      "credits": 1.68
    }
  }
}`}
      </CodeBlock>

      <Heading level={3}>Credit-to-Cost Quick Reference</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Base Cost (USD)</Th>
            <Th>Credits @ 60% margin</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr><Td>$0.001</Td><Td>0.16 credits</Td></Tr>
          <Tr><Td>$0.005</Td><Td>0.80 credits</Td></Tr>
          <Tr><Td>$0.01</Td><Td>1.60 credits</Td></Tr>
          <Tr><Td>$0.05</Td><Td>8.00 credits</Td></Tr>
          <Tr><Td>$0.10</Td><Td>16.00 credits</Td></Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="subscription-tiers">Subscription Tiers</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Tier</Th>
            <Th>Monthly Price</Th>
            <Th>Credits</Th>
            <Th>Rate Limit</Th>
            <Th>Overage</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><strong>Free</strong></Td>
            <Td>$0</Td>
            <Td>50</Td>
            <Td>10/min</Td>
            <Td>N/A</Td>
          </Tr>
          <Tr>
            <Td><strong>Starter</strong></Td>
            <Td>$20/mo</Td>
            <Td>500</Td>
            <Td>60/min</Td>
            <Td>$0.05/credit</Td>
          </Tr>
          <Tr>
            <Td><strong>Pro</strong></Td>
            <Td>$100/mo</Td>
            <Td>3,000</Td>
            <Td>300/min</Td>
            <Td>$0.04/credit</Td>
          </Tr>
          <Tr>
            <Td><strong>Team</strong></Td>
            <Td>$200/mo</Td>
            <Td>7,500</Td>
            <Td>1,000/min</Td>
            <Td>$0.033/credit</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={3}>What Can You Do With Credits?</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Credits</Th>
            <Th>Approximate Usage</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>50 (Free)</Td>
            <Td>~15 Claude Haiku conversations</Td>
          </Tr>
          <Tr>
            <Td>500 (Starter)</Td>
            <Td>~100 GPT-4o queries or ~160 Gemini Flash</Td>
          </Tr>
          <Tr>
            <Td>3,000 (Pro)</Td>
            <Td>~600 Claude Sonnet or ~1,000 GPT-4o</Td>
          </Tr>
          <Tr>
            <Td>7,500 (Team)</Td>
            <Td>~1,500 Claude Sonnet or ~2,500 GPT-4o</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="stripe-integration">Stripe Integration</Heading>

      <P>Layers uses Stripe for all subscription management and billing.</P>

      <Heading level={3}>Subscription Flow</Heading>

      <div className="my-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Dashboard Checkout */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border bg-card p-4 w-40 text-center">
              <div className="font-semibold">Dashboard</div>
              <div className="text-sm text-muted-foreground">Checkout</div>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground" />

          {/* Stripe Checkout */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border bg-blue-500/10 border-blue-500/20 p-4 w-40 text-center">
              <div className="font-semibold">Stripe</div>
              <div className="text-sm text-muted-foreground">Checkout</div>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 mt-2" />
            <div className="rounded-lg border bg-green-500/10 border-green-500/20 p-3 w-40 text-center mt-2">
              <div className="text-sm font-medium">Payment</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-muted-foreground" />

          {/* Webhook Handler */}
          <div className="flex flex-col items-center">
            <div className="rounded-lg border bg-primary/10 border-primary/20 p-4 w-40 text-center">
              <div className="font-semibold">Webhook</div>
              <div className="text-sm text-muted-foreground">Handler</div>
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 mt-2" />
            <div className="rounded-lg border bg-primary/10 border-primary/20 p-3 w-40 text-center mt-2">
              <div className="text-sm font-medium">Update</div>
              <div className="text-xs text-muted-foreground">Credits</div>
            </div>
          </div>
        </div>
      </div>

      <Heading level={3}>Webhook Events</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Event</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><InlineCode>checkout.session.completed</InlineCode></Td>
            <Td>Create subscription, link customer</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>customer.subscription.created</InlineCode></Td>
            <Td>Grant initial credits</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>customer.subscription.updated</InlineCode></Td>
            <Td>Update tier (upgrade/downgrade)</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>customer.subscription.deleted</InlineCode></Td>
            <Td>Revert to free tier</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>invoice.paid</InlineCode></Td>
            <Td>Add monthly credits</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="pricing-sync">Pricing Sync</Heading>

      <P>
        Layers automatically syncs pricing from Hustle Together AI to ensure costs
        match the latest rates:
      </P>

      <CodeBlock language="text">
{`Source: https://ai.hustletogether.com/api/pricing
Frequency: Daily sync via GitHub Actions
Cache: 24-hour in-memory cache
Models: 40 total (19 language, 21 image/multimodal)
Providers: 6 (Anthropic, OpenAI, Google, Perplexity, Morph, BFL, Recraft)`}
      </CodeBlock>

      <Callout type="info">
        For current pricing on all models, see the{' '}
        <Link href="/dashboard/pricing" className="text-primary hover:underline">
          Pricing Dashboard
        </Link>{' '}
        which displays real-time data from the Hustle Together AI SDK.
      </Callout>

      <Heading level={3}>Pricing API Endpoints</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Endpoint</Th>
            <Th>Method</Th>
            <Th>Purpose</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><InlineCode>/api/v1/pricing</InlineCode></Td>
            <Td>GET</Td>
            <Td>View current pricing and sync status</Td>
          </Tr>
          <Tr>
            <Td><InlineCode>/api/v1/pricing</InlineCode></Td>
            <Td>POST</Td>
            <Td>Force refresh from Hustle Together AI</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="credit-deduction-flow">Credit Deduction Flow</Heading>

      <div className="my-6 rounded-lg border p-6 bg-gradient-to-b from-muted/30 to-muted/10">
        <h3 className="text-lg font-semibold mb-4 text-center">Request Flow</h3>
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-sm">1</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Pre-Flight Estimate</h4>
                <div className="text-sm space-y-1">
                  <div><InlineCode>estimateCredits(model, max_tokens)</InlineCode></div>
                  <div className="text-muted-foreground">→ Check user balance ≥ estimate</div>
                  <div className="text-muted-foreground">→ Return 402 if insufficient</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">2</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">AI Gateway Call</h4>
                <div className="text-sm space-y-1">
                  <div className="text-muted-foreground">→ Call AI provider</div>
                  <div className="text-muted-foreground">→ Get actual token usage</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">3</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Actual Calculation</h4>
                <div className="text-sm">
                  <InlineCode className="text-xs">
                    calculateCreditsWithBreakdown(model, input_tokens, output_tokens)
                  </InlineCode>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
          </div>

          {/* Step 4 */}
          <div className="rounded-lg border bg-green-500/10 border-green-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-white font-bold text-sm">4</div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Deduction & Logging</h4>
                <div className="text-sm space-y-1">
                  <div><InlineCode>deductCredits(userId, credits)</InlineCode></div>
                  <div><InlineCode>logUsage(userId, model, tokens, credits)</InlineCode></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Heading level={2} id="external-cost-validation">External Cost Validation</Heading>

      <P>
        If you calculate your own base costs, you can pass them to Layers for validation:
      </P>

      <CodeBlock language="json">
{`{
  "model": "anthropic/claude-sonnet-4.5",
  "messages": [...],
  "mirror_factory": {
    "base_cost_usd": 0.0105
  }
}`}
      </CodeBlock>

      <P>
        Layers validates your cost against its own calculation and flags discrepancies
        {'>'}5% as warnings.
      </P>

      <Heading level={2} id="next-steps">Next Steps</Heading>

      <div className="grid gap-2 mt-4">
        {[
          { href: '/docs/architecture', title: 'Architecture', desc: 'How the gateway works' },
          { href: '/docs/api', title: 'API Reference', desc: 'Full endpoint documentation' },
          { href: '/dashboard/pricing', title: 'Pricing Dashboard', desc: 'View live pricing' },
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
