'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import {
  CreditCard,
  BarChart3,
  Code,
  ArrowRight,
  Shield,
  Globe,
  Layers as LayersIcon,
  CheckCircle2,
  Sparkles,
  Terminal,
  Zap,
  Lock,
  Activity,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Check for reduced motion preference
function usePrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const problemSolutionRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const quickStartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Hero animations
      const heroTl = gsap.timeline();
      heroTl
        .fromTo('[data-hero="badge"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
        .fromTo('[data-hero="title"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.3')
        .fromTo('[data-hero="subtitle"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .fromTo('[data-hero="cta"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .fromTo('[data-hero="code"]', { opacity: 0, y: 30, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }, '-=0.3');

      // Floating blobs animation
      gsap.to('.blob-1', {
        x: 30,
        y: -20,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.blob-2', {
        x: -20,
        y: 30,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Problem/Solution cards
      ScrollTrigger.create({
        trigger: problemSolutionRef.current,
        start: 'top 80%',
        onEnter: () => {
          gsap.fromTo(
            '[data-animate="problem-solution"] > *',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power3.out' }
          );
        },
        once: true,
      });

      // Benefits cards
      ScrollTrigger.create({
        trigger: benefitsRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo(
            '[data-animate="benefit-card"]',
            { opacity: 0, y: 50, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
          );
        },
        once: true,
      });

      // Pricing cards
      ScrollTrigger.create({
        trigger: pricingRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo(
            '[data-animate="pricing-card"]',
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
          );
        },
        once: true,
      });

      // Comparison table
      ScrollTrigger.create({
        trigger: comparisonRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo(
            '[data-animate="comparison"]',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
          );
        },
        once: true,
      });

      // Quick start section
      ScrollTrigger.create({
        trigger: quickStartRef.current,
        start: 'top 75%',
        onEnter: () => {
          gsap.fromTo(
            '[data-animate="quickstart"]',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
          );
        },
        once: true,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <UnifiedNav variant="default" />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative py-20 md:py-28 overflow-hidden"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-dot-pattern opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-mint-50/50 via-background to-background dark:from-mint-950/20 dark:via-background dark:to-background" />

        {/* Animated blobs */}
        <div className="blob-1 absolute top-20 left-[10%] w-72 h-72 bg-mint-200/30 dark:bg-mint-500/10 rounded-full blur-3xl" />
        <div className="blob-2 absolute bottom-20 right-[10%] w-96 h-96 bg-mint-300/20 dark:bg-mint-600/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 text-center">
          <Badge
            data-hero="badge"
            variant="outline"
            className="mb-6 border-mint-300 bg-mint-50/80 text-mint-700 dark:border-mint-700 dark:bg-mint-950/50 dark:text-mint-300 backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3 mr-1.5" aria-hidden="true" />
            One API for Every AI Model
          </Badge>

          <h1
            data-hero="title"
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          >
            One Gateway,
            <br />
            <span className="text-gradient-mint">All AI Models</span>
          </h1>

          <p
            data-hero="subtitle"
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            Access 40 models from 6 providers through a single OpenAI-compatible API.
            Built-in auth, credits, rate limiting, and real-time analytics.
          </p>

          <div
            data-hero="cta"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button size="lg" asChild className="text-lg px-8 h-12 glow-mint">
              <Link href="/signup">
                Start Free with 50 Credits
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 h-12 border-mint-200 hover:border-mint-400 hover:bg-mint-50 dark:border-mint-800 dark:hover:border-mint-600 dark:hover:bg-mint-950/50">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>

          {/* Code Preview */}
          <div data-hero="code" className="max-w-2xl mx-auto">
            <div className="code-block p-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">request.js</span>
              </div>
              <pre className="text-sm overflow-x-auto">
                <code className="text-zinc-300">
                  <span className="text-violet-400">const</span> response = <span className="text-violet-400">await</span> <span className="text-blue-400">fetch</span>(
                  <span className="text-emerald-400">&apos;https://api.layers.dev/v1/chat&apos;</span>, {`{\n`}
                  {'  '}headers: {`{\n`}
                  {'    '}<span className="text-amber-300">&apos;Authorization&apos;</span>: <span className="text-emerald-400">&apos;Bearer lyr_live_...&apos;</span>,{'\n'}
                  {'  '}{`},\n`}
                  {'  '}body: <span className="text-blue-400">JSON</span>.<span className="text-yellow-300">stringify</span>({`{\n`}
                  {'    '}<span className="text-amber-300">model</span>: <span className="text-emerald-400">&quot;anthropic/claude-sonnet-4.5&quot;</span>, <span className="text-zinc-500">// Change anytime</span>
                  {'\n  '}{`})`}
                  {`\n});`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section ref={problemSolutionRef} className="py-16 md:py-24 bg-background relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="container relative mx-auto px-4">
          <div data-animate="problem-solution" className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Problem Box */}
            <Card className="card-hover border-2 border-red-200/50 bg-gradient-to-br from-red-50/80 to-orange-50/50 dark:border-red-900/30 dark:from-red-950/40 dark:to-orange-950/20 shadow-xl">
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-3 border-red-300 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950/50">
                  The Problem
                </Badge>
                <CardTitle className="text-2xl md:text-3xl">
                  Managing Multiple AI Providers Is Complex
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {[
                    'Different SDKs for each provider (Anthropic, OpenAI, Google)',
                    'Separate API keys and authentication methods',
                    'Scattered billing across multiple services',
                    'No unified analytics or usage tracking',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-red-500 dark:text-red-400 mt-0.5 font-bold" aria-hidden="true">✗</span>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Solution Box */}
            <Card className="card-hover border-2 border-mint-300 bg-gradient-to-br from-mint-50/80 to-emerald-50/50 dark:border-mint-700/50 dark:from-mint-950/40 dark:to-emerald-950/20 shadow-xl dark:glow-mint">
              <CardHeader>
                <Badge className="w-fit mb-3 bg-mint-600 hover:bg-mint-700 text-white dark:bg-mint-500 dark:hover:bg-mint-600">
                  The Solution
                </Badge>
                <CardTitle className="text-2xl md:text-3xl">
                  One Gateway, All AI Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {[
                    'Single OpenAI-compatible API for all providers',
                    'One API key for everything (lyr_live_*)',
                    'Unified credit system with transparent pricing',
                    'Complete usage analytics in one dashboard',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-mint-600 dark:text-mint-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mint-50/30 via-mint-100/20 to-background dark:from-mint-950/30 dark:via-mint-900/10 dark:to-background" />
        <div className="absolute inset-0 bg-dot-pattern opacity-40" />

        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Developers Choose Layers</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Production-ready infrastructure that scales with your application
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Code,
                title: 'Switch Models in One Line',
                description: 'No vendor lock-in. Change from Claude to GPT-4o by updating a single parameter. Perfect for A/B testing and cost optimization.',
              },
              {
                icon: CreditCard,
                title: 'Pay Only for What You Use',
                description: 'Transparent credit system with real-time tracking. No hidden fees, no minimum commitments. Start free with 50 credits.',
              },
              {
                icon: Shield,
                title: 'Production-Ready from Day One',
                description: 'Built-in authentication, rate limiting, and error handling. Deploy with confidence knowing the infrastructure is battle-tested.',
              },
              {
                icon: BarChart3,
                title: 'Complete Usage Visibility',
                description: 'Real-time analytics showing costs, tokens, and performance per model. Understand exactly where your budget goes.',
              },
              {
                icon: Globe,
                title: 'OpenAI-Compatible API',
                description: 'Drop-in replacement for OpenAI SDK. Migrate existing applications by changing only the base URL and API key.',
              },
              {
                icon: LayersIcon,
                title: '40 Models, 6 Providers',
                description: 'Access models from Anthropic, OpenAI, Google, Perplexity, and more. Always up-to-date with new releases.',
              },
            ].map((benefit, i) => (
              <Card
                key={i}
                data-animate="benefit-card"
                className="card-hover group border-mint-100 dark:border-mint-900/30 bg-card/80 backdrop-blur-sm hover:border-mint-300 dark:hover:border-mint-700 transition-all duration-300"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-mint-100 dark:bg-mint-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="h-6 w-6 text-mint-600 dark:text-mint-400" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-16 md:py-24 bg-background relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, scale as you grow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { name: 'Free', price: 0, credits: 50, rate: '10 req/min', features: ['All models'], highlight: false },
              { name: 'Starter', price: 20, credits: 500, rate: '60 req/min', features: ['Advanced analytics'], highlight: false },
              { name: 'Pro', price: 100, credits: 3000, rate: '300 req/min', features: ['Priority support'], highlight: true, badge: 'Most Popular' },
              { name: 'Team', price: 200, credits: 7500, rate: '1,000 req/min', features: ['24/7 support + SLA'], highlight: false },
            ].map((plan, i) => (
              <Card
                key={i}
                data-animate="pricing-card"
                className={`card-hover relative ${
                  plan.highlight
                    ? 'border-2 border-mint-400 dark:border-mint-400 bg-gradient-to-b from-mint-100 to-mint-50 dark:from-mint-950 dark:to-mint-900 shadow-xl dark:shadow-mint-500/30'
                    : 'border-mint-100 dark:border-mint-900/30 hover:border-mint-300 dark:hover:border-mint-700'
                }`}
              >
                <CardHeader>
                  {plan.badge && (
                    <Badge className="w-fit mb-2 bg-mint-600 text-white dark:bg-mint-500">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground tabular-nums">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`text-center py-3 rounded-lg ${
                    plan.highlight
                      ? 'bg-mint-200/70 dark:bg-mint-800'
                      : 'bg-mint-100/50 dark:bg-mint-900/30'
                  }`}>
                    <p className="text-xl font-bold tabular-nums">{plan.credits.toLocaleString()} credits</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-mint-600 dark:text-mint-400" aria-hidden="true" />
                      <span>{plan.rate}</span>
                    </li>
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-mint-600 dark:text-mint-400" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full ${
                      plan.highlight
                        ? 'bg-mint-600 hover:bg-mint-700 text-white dark:bg-mint-500 dark:hover:bg-mint-600'
                        : ''
                    }`}
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    <Link href="/signup">{plan.price === 0 ? 'Start Free' : 'Get Started'}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/pricing"
              className="text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300 font-medium animated-underline inline-flex items-center gap-1"
            >
              View detailed pricing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section ref={comparisonRef} className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-mint-50/20 to-background dark:from-background dark:via-mint-950/20 dark:to-background" />

        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Layers?</h2>
            <p className="text-xl text-muted-foreground">
              Compare the traditional approach to the Layers advantage
            </p>
          </div>

          <div data-animate="comparison" className="max-w-4xl mx-auto overflow-x-auto">
            <div className="glass rounded-xl border border-mint-200 dark:border-mint-800/50 p-1 shadow-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-mint-200/50 dark:border-mint-800/30">
                    <th className="text-left py-4 px-4 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 font-medium text-muted-foreground">Direct Provider APIs</th>
                    <th className="text-center py-4 px-4 font-medium bg-mint-100/50 dark:bg-mint-900/30 rounded-t-lg">Layers</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Multi-Provider Access', direct: 'Multiple SDKs', layers: true },
                    { feature: 'Unified Authentication', direct: 'Separate keys', layers: true },
                    { feature: 'Consolidated Billing', direct: 'Multiple invoices', layers: true },
                    { feature: 'Usage Analytics', direct: 'Scattered dashboards', layers: true },
                    { feature: 'Rate Limiting', direct: 'Manual implementation', layers: true },
                    { feature: 'Switch Models', direct: 'Code changes required', layers: 'One parameter' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-mint-200/30 dark:border-mint-800/20 last:border-b-0">
                      <td className="py-4 px-4 font-medium">{row.feature}</td>
                      <td className="text-center py-4 px-4 text-muted-foreground">{row.direct}</td>
                      <td className="text-center py-4 px-4 bg-mint-100/30 dark:bg-mint-900/20">
                        {row.layers === true ? (
                          <CheckCircle2 className="h-5 w-5 mx-auto text-mint-600 dark:text-mint-400" aria-hidden="true" />
                        ) : (
                          <span className="font-medium text-mint-700 dark:text-mint-300">{row.layers}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section ref={quickStartRef} className="py-16 md:py-24 bg-background relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="container relative mx-auto px-4">
          <div data-animate="quickstart" className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Quick Start</h2>
              <p className="text-xl text-muted-foreground">
                Get up and running in less than 5 minutes
              </p>
            </div>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6 bg-mint-100/50 dark:bg-mint-950/30 p-1 rounded-lg">
                {['cURL', 'Node.js', 'Python', 'TypeScript'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase().replace('.', '')}
                    className="data-[state=active]:bg-mint-600 data-[state=active]:text-white dark:data-[state=active]:bg-mint-500 rounded-md transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {[
                {
                  value: 'curl',
                  title: 'cURL Example',
                  icon: Terminal,
                  code: `curl -X POST https://api.layers.dev/v1/chat \\
  -H "Authorization: Bearer lyr_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
                },
                {
                  value: 'nodejs',
                  title: 'Node.js Example',
                  icon: Code,
                  code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.layers.dev/v1',
  apiKey: 'lyr_live_YOUR_API_KEY',
});

const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);`,
                },
                {
                  value: 'python',
                  title: 'Python Example',
                  icon: Code,
                  code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.layers.dev/v1",
    api_key="lyr_live_YOUR_API_KEY"
)

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4.5",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`,
                },
                {
                  value: 'typescript',
                  title: 'TypeScript Example',
                  icon: Code,
                  code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.layers.dev/v1',
  apiKey: process.env.LAYERS_API_KEY!,
});

const response = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0]?.message.content);`,
                },
              ].map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <Card className="border-mint-200 dark:border-mint-800/50 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <tab.icon className="h-5 w-5 text-mint-600 dark:text-mint-400" aria-hidden="true" />
                        {tab.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="code-block p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code className="text-zinc-300">{tab.code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mint-100/50 via-mint-200/30 to-mint-100/50 dark:from-mint-950/50 dark:via-mint-900/20 dark:to-mint-950/50" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />

        <div className="container relative mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Simplify Your AI Stack?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join developers who&apos;ve consolidated their AI infrastructure with Layers.
            Start with 50 free credits today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-lg px-8 h-12 glow-mint">
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 h-12 border-mint-300 hover:border-mint-500 hover:bg-mint-50 dark:border-mint-700 dark:hover:border-mint-500 dark:hover:bg-mint-950/50">
              <Link href="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-mint-600 dark:bg-mint-500 flex items-center justify-center">
                  <LayersIcon className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span className="font-serif text-xl font-bold">Layers</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Unified AI Gateway for accessing 40 models from 6 providers through one API.
              </p>
            </div>

            {/* Links */}
            {[
              {
                title: 'Product',
                links: [
                  { href: '/pricing', label: 'Pricing' },
                  { href: '/docs', label: 'Documentation' },
                  { href: '/dashboard', label: 'Dashboard' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { href: '/docs/getting-started', label: 'About' },
                  { href: 'https://github.com/hustletogether/layers', label: 'GitHub', external: true },
                ],
              },
              {
                title: 'Support',
                links: [
                  { href: '/docs/authentication', label: 'API Reference' },
                  { href: '/docs/billing', label: 'Billing & Credits' },
                ],
              },
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-3">{section.title}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="section-divider mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2026 Layers by Mirror Factory. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link href="/docs" className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                Terms
              </Link>
              <Link href="/docs" className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
