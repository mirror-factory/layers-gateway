import Link from 'next/link';
import {
  Heading,
  P,
  Callout,
  CodeBlock,
  Step,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  InlineCode,
} from '@/components/docs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Getting Started - Layers Docs',
  description: 'Start using Layers in under 5 minutes',
};

export default function GettingStartedPage() {
  return (
    <div>
      <Heading level={1}>Getting Started</Heading>
      <P>Get up and running with Layers in under 5 minutes.</P>

      <Callout type="tip" title="Ready to start?">
        Sign up at{' '}
        <Link href="/dashboard" className="text-primary hover:underline font-medium">
          layers.hustletogether.com/dashboard
        </Link>{' '}
        to get your API key.
      </Callout>

      <Heading level={2} id="what-is-layers">What is Layers?</Heading>

      <P>
        Layers is a unified AI API gateway that gives you access to 40 models (19 language, 21 image/multimodal)
        from 6 providers through a single API key and credit balance.
      </P>

      <div className="rounded-lg border bg-muted/50 p-4 my-6">
        <p className="text-sm text-muted-foreground">
          <strong>Powered by Hustle Together AI SDK</strong> - Layers is built on the Hustle Together AI SDK, which provides the model registry (40 models from 6 providers: Anthropic, OpenAI, Google, Perplexity, Morph, BFL, Recraft), real-time pricing data synced daily, and routing infrastructure via Vercel AI Gateway. Layers adds credit management, authentication, rate limiting, and Stripe billing.
        </p>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Challenge</Th>
            <Th>Layers Solution</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Managing multiple API keys</Td>
            <Td>One API key for all providers</Td>
          </Tr>
          <Tr>
            <Td>Different billing accounts</Td>
            <Td>Single credit balance</Td>
          </Tr>
          <Tr>
            <Td>Inconsistent APIs</Td>
            <Td>OpenAI-compatible format</Td>
          </Tr>
          <Tr>
            <Td>Rate limit management</Td>
            <Td>Unified rate limiting by tier</Td>
          </Tr>
          <Tr>
            <Td>Usage tracking</Td>
            <Td>Built-in analytics dashboard</Td>
          </Tr>
        </Tbody>
      </Table>

      <Heading level={2} id="quick-start">Quick Start</Heading>

      <Step number={1} title="Get Your API Key">
        <P>
          Sign up at{' '}
          <Link href="/dashboard" className="text-primary hover:underline">
            layers.hustletogether.com/dashboard
          </Link>{' '}
          to create your API key. Your key will look like:
        </P>
        <CodeBlock language="text">
{`lyr_live_sk_1234567890abcdef...`}
        </CodeBlock>
      </Step>

      <Step number={2} title="Make Your First Request">
        <P>Use cURL, TypeScript, or Python to make your first API call:</P>

        <Heading level={4}>cURL</Heading>
        <CodeBlock language="bash">
{`curl -X POST https://layers.hustletogether.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'`}
        </CodeBlock>

        <Heading level={4}>TypeScript</Heading>
        <CodeBlock language="typescript">
{`const response = await fetch('https://layers.hustletogether.com/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: JSON.stringify({
    model: 'anthropic/claude-sonnet-4.5',
    messages: [{ role: 'user', content: 'Say hello!' }],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);`}
        </CodeBlock>

        <Heading level={4}>Python</Heading>
        <CodeBlock language="python">
{`import requests

response = requests.post(
    'https://layers.hustletogether.com/api/v1/chat',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
    },
    json={
        'model': 'anthropic/claude-sonnet-4.5',
        'messages': [{'role': 'user', 'content': 'Say hello!'}]
    }
)

print(response.json()['choices'][0]['message']['content'])`}
        </CodeBlock>
      </Step>

      <Step number={3} title="Check the Response">
        <P>A successful response looks like:</P>
        <CodeBlock language="json">
{`{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "model": "anthropic/claude-sonnet-4.5",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 8,
    "total_tokens": 20
  },
  "layers": {
    "credits_used": 0.05,
    "latency_ms": 342,
    "cost_breakdown": {
      "base_cost_usd": 0.00031,
      "margin_percent": 60,
      "total_cost_usd": 0.0005
    }
  }
}`}
        </CodeBlock>
      </Step>

      <Heading level={2} id="try-different-models">Try Different Models</Heading>

      <P>Just change the <InlineCode>model</InlineCode> parameter:</P>

      <CodeBlock language="json">
{`// Fast and cheap
"model": "openai/gpt-4o-mini"

// Balanced performance
"model": "anthropic/claude-sonnet-4.5"

// Best quality
"model": "anthropic/claude-opus-4.5"

// Web search included
"model": "perplexity/sonar-pro"`}
      </CodeBlock>

      <P>
        See the{' '}
        <Link href="/docs/models" className="text-primary hover:underline">
          Model Selection Guide
        </Link>{' '}
        for all 24 models.
      </P>

      <Heading level={2} id="vercel-ai-sdk">Using with Vercel AI SDK</Heading>

      <P>
        If you're building with Next.js, use the Vercel AI SDK with Layers as an
        OpenAI-compatible provider:
      </P>

      <CodeBlock language="bash">
{`npm install ai @ai-sdk/openai`}
      </CodeBlock>

      <CodeBlock language="typescript" filename="lib/layers.ts">
{`import { createOpenAI } from '@ai-sdk/openai';

// Create Layers provider using OpenAI adapter
export const layers = createOpenAI({
  baseURL: 'https://layers.hustletogether.com/api/v1',
  apiKey: process.env.LAYERS_API_KEY,
});`}
      </CodeBlock>

      <CodeBlock language="typescript" filename="app/api/chat/route.ts">
{`import { generateText } from 'ai';
import { layers } from '@/lib/layers';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const { text } = await generateText({
    model: layers('anthropic/claude-sonnet-4.5'),
    prompt,
  });

  return Response.json({ text });
}`}
      </CodeBlock>

      <Callout type="info">
        For advanced AI SDK usage including streaming and custom fields, see{' '}
        <Link href="/docs/ai-sdk" className="text-primary hover:underline">
          AI SDK Integration
        </Link>.
      </Callout>

      <Heading level={2} id="subscription-tiers">Subscription Tiers</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Tier</Th>
            <Th>Price</Th>
            <Th>Credits</Th>
            <Th>Rate Limit</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><strong>Free</strong></Td>
            <Td>$0</Td>
            <Td>50/month</Td>
            <Td>10 req/min</Td>
          </Tr>
          <Tr>
            <Td><strong>Starter</strong></Td>
            <Td>$20/mo</Td>
            <Td>500/month</Td>
            <Td>60 req/min</Td>
          </Tr>
          <Tr>
            <Td><strong>Pro</strong></Td>
            <Td>$100/mo</Td>
            <Td>3,000/month</Td>
            <Td>300 req/min</Td>
          </Tr>
          <Tr>
            <Td><strong>Team</strong></Td>
            <Td>$200/mo</Td>
            <Td>7,500/month</Td>
            <Td>1,000 req/min</Td>
          </Tr>
        </Tbody>
      </Table>

      <P>
        See{' '}
        <Link href="/docs/billing" className="text-primary hover:underline">
          Billing & Credits
        </Link>{' '}
        for detailed pricing information.
      </P>

      <Heading level={2} id="next-steps">Next Steps</Heading>

      <div className="grid gap-2 mt-4">
        {[
          { href: '/docs/api', title: 'API Reference', desc: 'Full endpoint documentation' },
          { href: '/docs/models', title: 'Model Selection', desc: 'Choose the right model' },
          { href: '/docs/billing', title: 'Credit System', desc: 'Understand pricing' },
          { href: '/dashboard', title: 'Dashboard', desc: 'Manage API keys and billing' },
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
