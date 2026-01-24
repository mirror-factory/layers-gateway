import Link from 'next/link';
import {
  Heading,
  P,
  Callout,
  CodeBlock,
  FeatureCard,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@/components/docs';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ArrowRight, Layers } from 'lucide-react';

export const metadata = {
  title: 'Layers Documentation',
  description: 'Build AI-powered applications with the Layers API Gateway',
};

export default function DocsIndexPage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Documentation</span>
        </div>
        <Heading level={1}>Welcome to Layers</Heading>
        <P>
          Layers is an AI API Gateway that gives you unified access to 40 models
          from 6 providers (19 language models, 21 image models) through a single API key and credit balance.
        </P>
        <div className="rounded-lg border bg-muted/50 p-4 my-6">
          <p className="text-sm text-muted-foreground">
            <strong>Powered by Hustle Together AI SDK</strong> - Layers is built on top of the Hustle Together AI SDK, which provides the AI model registry (40 models from 6 providers), real-time pricing data, and routing infrastructure via Vercel AI Gateway. Layers adds credit management, authentication, rate limiting, and Stripe billing on top.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/docs/getting-started">
            <Button>
              Get Started
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <FeatureCard
          icon="key"
          title="One API Key"
          description="Access Anthropic, OpenAI, Google, Perplexity, and Morph with a single key."
        />
        <FeatureCard
          icon="credit-card"
          title="Unified Credits"
          description="One credit balance works across all providers. 1 credit = $0.01 USD."
        />
        <FeatureCard
          icon="zap"
          title="OpenAI Compatible"
          description="Drop-in replacement for OpenAI SDK. Works with Vercel AI SDK."
        />
        <FeatureCard
          icon="bar-chart"
          title="Usage Analytics"
          description="Real-time tracking of tokens, costs, and credits in your dashboard."
        />
      </div>

      <Heading level={2} id="quick-start">Quick Start</Heading>

      <P>
        Make your first API call in seconds. For the complete setup guide, see{' '}
        <Link href="/docs/getting-started" className="text-primary hover:underline font-medium">
          Getting Started
        </Link>.
      </P>

      <CodeBlock language="bash">
{`curl -X POST https://layers.hustletogether.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
      </CodeBlock>

      <Callout type="tip" title="Get your API key">
        Sign up at{' '}
        <Link href="/dashboard" className="text-primary hover:underline">
          layers.hustletogether.com/dashboard
        </Link>{' '}
        to create your API key.
      </Callout>

      <Heading level={2} id="how-it-works">How It Works</Heading>

      <P>
        Layers Gateway sits between your application and AI providers, automatically
        tracking usage, managing billing, and providing a unified interface.
      </P>

      <div className="my-6 p-6 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-foreground bg-background flex items-center justify-center">
              <span className="text-sm font-medium text-center">Your App</span>
            </div>
          </div>

          <div className="text-2xl text-muted-foreground">→</div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-primary bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-center">Layers<br/>Gateway</span>
            </div>
            <div className="text-xs text-muted-foreground text-center max-w-[140px]">
              Auth, Credits, Rate Limits
            </div>
          </div>

          <div className="text-2xl text-muted-foreground">→</div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-40 h-24 rounded-lg border-2 border-foreground bg-background flex items-center justify-center">
              <span className="text-sm font-medium text-center">Hustle Together<br/>AI SDK</span>
            </div>
            <div className="text-xs text-muted-foreground text-center max-w-[160px]">
              Models, Pricing, Routing
            </div>
          </div>

          <div className="text-2xl text-muted-foreground">→</div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-24 rounded-lg border-2 border-foreground bg-background flex items-center justify-center">
              <span className="text-sm font-medium text-center">AI Providers</span>
            </div>
          </div>
        </div>
      </div>

      <P>
        When you make a request through Layers, we authenticate you, check credits, then route to the Hustle Together AI SDK which handles model lookup and provider routing via Vercel AI Gateway.
      </P>

      <Heading level={2} id="supported-providers">Supported Providers</Heading>

      <Table>
        <Thead>
          <Tr>
            <Th>Provider</Th>
            <Th>Models</Th>
            <Th>Capabilities</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td><strong>Anthropic</strong></Td>
            <Td>Claude 4.5 (Haiku, Sonnet, Opus)</Td>
            <Td>Text, Vision, Tools, Extended Thinking</Td>
          </Tr>
          <Tr>
            <Td><strong>OpenAI</strong></Td>
            <Td>GPT-4o, GPT-4o Mini, GPT-5 (Chat, Codex, Thinking, Nano, Pro), GPT-5.1 variants</Td>
            <Td>Text, Vision, Tools, JSON Mode, Image Gen (GPT-5 series)</Td>
          </Tr>
          <Tr>
            <Td><strong>Google</strong></Td>
            <Td>Gemini 2.5 (Flash, Flash Lite, Flash Image, Pro), Gemini 3 (Flash, Pro Preview, Pro Image), Imagen 4.0 (Fast, Standard, Ultra)</Td>
            <Td>Text, Vision, Multimodal, Image Gen</Td>
          </Tr>
          <Tr>
            <Td><strong>Perplexity</strong></Td>
            <Td>Sonar, Sonar Pro, Sonar Reasoning Pro</Td>
            <Td>Web Search, Citations, Reasoning</Td>
          </Tr>
          <Tr>
            <Td><strong>Morph</strong></Td>
            <Td>V3 Fast, V3 Large</Td>
            <Td>Fast text generation</Td>
          </Tr>
          <Tr>
            <Td><strong>BFL (Black Forest Labs)</strong></Td>
            <Td>Flux 2 (Pro, Flex, Max, Klein 4B), Flux Kontext (Pro, Max), Flux Pro 1.1 (Standard, Ultra), Flux Pro 1.0 Fill</Td>
            <Td>Image generation, Inpainting</Td>
          </Tr>
          <Tr>
            <Td><strong>Recraft</strong></Td>
            <Td>Recraft V3, Recraft V2</Td>
            <Td>Image generation</Td>
          </Tr>
        </Tbody>
      </Table>

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

      <Heading level={2} id="guides">Guides</Heading>

      <div className="grid gap-2">
        {[
          { href: '/docs/getting-started', title: 'Getting Started', desc: 'Quick setup in under 5 minutes' },
          { href: '/docs/architecture', title: 'Gateway Architecture', desc: 'How Layers works under the hood' },
          { href: '/docs/billing', title: 'Billing & Credits', desc: 'Credit system, margins, and Stripe' },
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

      <Heading level={2} id="integration">For Mirror Factory / Hustle Together AI</Heading>

      <P>
        Layers is designed as the AI Gateway layer for the Hustle Together platform.
        When the Layers toggle is ON in your application, all AI requests route through
        Layers for automatic tracking and billing.
      </P>

      <Callout type="info">
        See{' '}
        <Link href="/docs/architecture" className="text-primary hover:underline">
          Gateway Architecture
        </Link>{' '}
        for detailed integration documentation.
      </Callout>
    </div>
  );
}
