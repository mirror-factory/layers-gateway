import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import { Check, Zap, CreditCard, BarChart3, Shield } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    credits: '50',
    popular: false,
    features: [
      '50 credits included',
      '10 requests per minute',
      'Access to all 40 models',
      'OpenAI-compatible API',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    name: 'Starter',
    price: '$20',
    credits: '500',
    popular: false,
    features: [
      '500 credits per month',
      '60 requests per minute',
      'Access to all 40 models',
      'OpenAI-compatible API',
      'Advanced analytics',
      'Email support',
      'Usage alerts',
    ],
  },
  {
    name: 'Pro',
    price: '$100',
    credits: '3,000',
    popular: true,
    features: [
      '3,000 credits per month',
      '300 requests per minute',
      'Access to all 40 models',
      'OpenAI-compatible API',
      'Advanced analytics',
      'Priority email support',
      'Usage alerts',
      'Custom rate limits',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Team',
    price: '$200',
    credits: '7,500',
    popular: false,
    features: [
      '7,500 credits per month',
      '1,000 requests per minute',
      'Access to all 40 models',
      'OpenAI-compatible API',
      'Advanced analytics',
      '24/7 priority support',
      'Usage alerts',
      'Custom rate limits',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <UnifiedNav variant="default" />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="outline" className="mb-4">
          Transparent Pricing
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
          Pay only for what you use
        </p>
        <p className="text-sm text-muted-foreground">
          1 credit = $0.016 USD (60% default margin)
        </p>
      </section>

      {/* Pricing Tiers */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.popular ? 'border-2 border-primary shadow-xl lg:scale-105' : ''}
            >
              <CardHeader>
                {tier.popular && (
                  <Badge className="w-fit mb-2">Most Popular</Badge>
                )}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{tier.credits}</p>
                  <p className="text-xs text-muted-foreground">credits included</p>
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Feature</th>
                <th className="text-center py-4 px-4">Free</th>
                <th className="text-center py-4 px-4">Starter</th>
                <th className="text-center py-4 px-4 bg-primary/5">Pro</th>
                <th className="text-center py-4 px-4">Team</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4">Monthly Credits</td>
                <td className="text-center py-3 px-4">50</td>
                <td className="text-center py-3 px-4">500</td>
                <td className="text-center py-3 px-4 bg-primary/5">3,000</td>
                <td className="text-center py-3 px-4">7,500</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Rate Limit</td>
                <td className="text-center py-3 px-4">10/min</td>
                <td className="text-center py-3 px-4">60/min</td>
                <td className="text-center py-3 px-4 bg-primary/5">300/min</td>
                <td className="text-center py-3 px-4">1,000/min</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Model Access</td>
                <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                <td className="text-center py-3 px-4 bg-primary/5"><Check className="h-5 w-5 mx-auto text-primary" /></td>
                <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">API Keys</td>
                <td className="text-center py-3 px-4">2</td>
                <td className="text-center py-3 px-4">5</td>
                <td className="text-center py-3 px-4 bg-primary/5">20</td>
                <td className="text-center py-3 px-4">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Analytics</td>
                <td className="text-center py-3 px-4">Basic</td>
                <td className="text-center py-3 px-4">Advanced</td>
                <td className="text-center py-3 px-4 bg-primary/5">Advanced</td>
                <td className="text-center py-3 px-4">Advanced</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">Support</td>
                <td className="text-center py-3 px-4">Community</td>
                <td className="text-center py-3 px-4">Email</td>
                <td className="text-center py-3 px-4 bg-primary/5">Priority</td>
                <td className="text-center py-3 px-4">24/7</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4">SLA</td>
                <td className="text-center py-3 px-4">-</td>
                <td className="text-center py-3 px-4">-</td>
                <td className="text-center py-3 px-4 bg-primary/5">-</td>
                <td className="text-center py-3 px-4"><Check className="h-5 w-5 mx-auto text-primary" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How Credits Work */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">How Credits Work</h2>
          <p className="text-center text-muted-foreground mb-12">
            Credits are our unified currency for all AI models. Each model consumes credits based on usage.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Per-Token Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Credits are consumed based on input and output tokens. Different models have different rates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Simple Conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  1 credit = $0.016 USD with our default 60% margin. You can customize your margin in the dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor credit usage in real-time through your dashboard with detailed breakdowns per model.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Example Costs</CardTitle>
              <CardDescription>Approximate credit usage for common models</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Claude Sonnet 4.5</span>
                <span className="text-muted-foreground">~5 credits per 1,000 tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">GPT-4o</span>
                <span className="text-muted-foreground">~4 credits per 1,000 tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">GPT-4o-mini</span>
                <span className="text-muted-foreground">~0.3 credits per 1,000 tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Gemini 2.5 Flash</span>
                <span className="text-muted-foreground">~0.2 credits per 1,000 tokens</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                For detailed pricing on all 40 models, visit the{' '}
                <Link href="/dashboard/pricing" className="text-primary hover:underline">
                  Pricing Dashboard
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do credits work?</AccordionTrigger>
              <AccordionContent>
                Credits are our unified currency across all AI providers. Each API call consumes credits based on the model used and the number of tokens processed (both input and output). With a 60% default margin, 1 credit equals $0.016 USD. You can customize your margin percentage in the dashboard to adjust your pricing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What happens when I run out of credits?</AccordionTrigger>
              <AccordionContent>
                When your credit balance reaches zero, API requests will be rejected with a 402 Payment Required error. You can purchase additional credits or upgrade to a higher tier at any time. Free tier users can upgrade to a paid plan to get more credits immediately.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Can I upgrade or downgrade my plan?</AccordionTrigger>
              <AccordionContent>
                Yes, you can upgrade or downgrade your plan at any time from your dashboard. When upgrading, you'll receive the new credit allocation immediately. When downgrading, the change will take effect at the start of your next billing cycle, and you'll keep your current credits until then.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Which models are available?</AccordionTrigger>
              <AccordionContent>
                We support 40 models across 6 providers: Anthropic (Claude Haiku/Sonnet/Opus 4.5), OpenAI (GPT-4o, GPT-4o-mini, o1, o3-mini), Google (Gemini 2.0/2.5 Flash/Pro), Perplexity (Sonar, Sonar Pro, Sonar Reasoning Pro), Morph (reasoning models), and image generation models from BFL and Recraft. All models are accessible through a single OpenAI-compatible API.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Is there a free tier?</AccordionTrigger>
              <AccordionContent>
                Yes! Our Free tier includes 50 credits with access to all 40 models, 10 requests per minute, and basic analytics. It's perfect for testing and small projects. No credit card required to get started.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Do you offer enterprise pricing?</AccordionTrigger>
              <AccordionContent>
                For enterprise needs with custom credit allocations, dedicated infrastructure, or special rate limits, please contact us at enterprise@layers.hustletogether.com. We can create custom plans tailored to your organization's requirements.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major credit cards (Visa, Mastercard, American Express, Discover) through Stripe. Subscriptions are billed monthly on the date you sign up. Enterprise customers can arrange for invoicing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>Can I customize the margin percentage?</AccordionTrigger>
              <AccordionContent>
                Yes! In your dashboard's pricing page, you can set a custom margin percentage (0-200%) that determines how credits convert to USD. This allows you to adjust your pricing strategy based on your business needs. The default margin is 60% (1 credit = $0.016 USD).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build with AI?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with 50 free credits. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs">Read Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-serif font-medium">Layers</span>
            <p>&copy; 2026 Layers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
