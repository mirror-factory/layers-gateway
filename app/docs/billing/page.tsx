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
  Flow,
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

      <P>All prices are per <strong>1,000 tokens</strong>:</P>

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

      <P>Every API response includes a full cost breakdown:</P>

      <CodeBlock language="json">
{`{
  "layers": {
    "credits_used": 1.68,
    "cost_breakdown": {
      "base_cost_usd": 0.0105,
      "margin_percent": 60,
      "total_cost_usd": 0.0168,
      "credits_before_margin": 1.05,
      "margin_credits": 0.63,
      "validation": "ok"
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

      <Flow>
{`┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Dashboard │ ──▶ │   Stripe    │ ──▶ │   Webhook   │
│   Checkout  │     │   Checkout  │     │   Handler   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Payment   │     │   Update    │
                    │   Complete  │     │   Credits   │
                    └─────────────┘     └─────────────┘`}
      </Flow>

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

      <Flow>
{`┌─────────────────────────────────────────────────────────────┐
│                       REQUEST FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PRE-FLIGHT ESTIMATE                                     │
│     └─▶ estimateCredits(model, max_tokens)                 │
│         └─▶ Check user balance >= estimate                  │
│         └─▶ Return 402 if insufficient                      │
│                                                             │
│  2. AI GATEWAY CALL                                         │
│     └─▶ Call AI provider                                   │
│         └─▶ Get actual token usage                          │
│                                                             │
│  3. ACTUAL CALCULATION                                      │
│     └─▶ calculateCreditsWithBreakdown(                     │
│             model, input_tokens, output_tokens              │
│         )                                                   │
│                                                             │
│  4. DEDUCTION & LOGGING                                     │
│     └─▶ deductCredits(userId, credits)                     │
│     └─▶ logUsage(userId, model, tokens, credits)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘`}
      </Flow>

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
