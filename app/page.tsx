import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, CreditCard, BarChart3, Code, ArrowRight } from 'lucide-react';
import { UnifiedNav } from '@/components/navigation/unified-nav';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <UnifiedNav variant="default" />

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Unified AI Gateway
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          One API to access all major AI providers. Built-in authentication,
          credit management, rate limiting, and usage tracking.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#api">View API Docs</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Key className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">API Key Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Create and manage API keys with granular permissions and expiration settings.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Credit System</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pay-as-you-go pricing with monthly subscriptions. Track credits in real-time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor API usage, costs, and performance across all your applications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">OpenAI Compatible</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Drop-in replacement for OpenAI SDK. Works with any model from any provider.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Quick Start</h2>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>1. Get your API key</CardTitle>
              <CardDescription>
                Sign up and create an API key from your dashboard.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>2. Make your first request</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`curl -X POST https://api.layers.dev/v1/chat \\
  -H "Authorization: Bearer lyr_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Models</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Anthropic:</strong> claude-haiku-4.5, claude-sonnet-4.5, claude-opus-4.5</p>
              <p><strong>OpenAI:</strong> gpt-4o, gpt-4o-mini, o1, o1-mini, o3-mini</p>
              <p><strong>Google:</strong> gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash</p>
              <p><strong>Perplexity:</strong> sonar, sonar-pro, sonar-reasoning-pro</p>
              <p className="text-muted-foreground text-sm mt-4">
                And many more. Use the <code>provider/model</code> format.
              </p>
            </CardContent>
          </Card>
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
