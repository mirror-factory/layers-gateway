'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Zap,
  Key,
  CreditCard,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  LogOut,
  ExternalLink,
  BarChart3,
  Eye,
  EyeOff,
  BookOpen,
  TestTube,
} from 'lucide-react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface CreditBalance {
  credits: number;
  tier: string;
}

interface UsageStats {
  total_requests: number;
  total_credits_used: number;
  this_month_requests: number;
  this_month_credits: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirectTo=/dashboard');
      return;
    }
    setUser(user);

    // Load API keys
    const keysRes = await fetch('/api/keys');
    if (keysRes.ok) {
      const keysData = await keysRes.json();
      setApiKeys(keysData.keys || []);
    }

    // Load balance
    const balanceRes = await fetch('/api/balance');
    if (balanceRes.ok) {
      const balanceData = await balanceRes.json();
      setBalance(balanceData);
    }

    // Load usage
    const usageRes = await fetch('/api/usage');
    if (usageRes.ok) {
      const usageData = await usageRes.json();
      setUsage(usageData);
    }

    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setNewKeyName('');
        loadData();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    await fetch(`/api/keys/${keyId}`, { method: 'DELETE' });
    loadData();
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const openBillingPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
  };

  const openCheckout = async (tier: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Layers</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>
            <Link href="/dashboard/tests">
              <Button variant="ghost" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Tests
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balance?.credits?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">
                {balance?.tier || 'Free'} tier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apiKeys.length}</div>
              <p className="text-xs text-muted-foreground">
                {apiKeys.filter(k => k.is_active).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usage?.this_month_requests || 0}</div>
              <p className="text-xs text-muted-foreground">
                {usage?.this_month_credits?.toFixed(2) || '0.00'} credits used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* New Key Alert */}
        {newKey && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                New API Key Created
              </CardTitle>
              <CardDescription>
                Copy this key now. You won&apos;t be able to see it again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={newKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(newKey, 'new')}
                >
                  {copiedId === 'new' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button variant="outline" onClick={() => setNewKey(null)}>
                Done
              </Button>
            </CardContent>
          </Card>
        )}

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for accessing the Layers API
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create New Key */}
            <div className="flex gap-2">
              <Input
                placeholder="Key name (e.g., Production, Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createApiKey} disabled={isCreating || !newKeyName.trim()}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Key
              </Button>
            </div>

            {/* Key List */}
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No API keys yet. Create one to get started.
                </p>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.prefix}...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && (
                          <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteApiKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Plans</CardTitle>
            <CardDescription>
              Manage your subscription and purchase credits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Starter</CardTitle>
                  <CardDescription>For individuals and small projects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">$20</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li>500 credits/month</li>
                    <li>All models</li>
                    <li>Standard rate limits</li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openCheckout('starter')}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Pro</CardTitle>
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Popular
                    </span>
                  </div>
                  <CardDescription>For growing teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">$100</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li>3,000 credits/month</li>
                    <li>All models</li>
                    <li>Higher rate limits</li>
                    <li>Priority support</li>
                  </ul>
                  <Button className="w-full" onClick={() => openCheckout('pro')}>
                    Subscribe
                  </Button>
                </CardContent>
              </Card>

              {/* Team */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Team</CardTitle>
                  <CardDescription>For larger organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-3xl font-bold">$200</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li>7,500 credits/month</li>
                    <li>All models</li>
                    <li>Highest rate limits</li>
                    <li>Premium support</li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openCheckout('team')}
                  >
                    Subscribe
                  </Button>
                </CardContent>
              </Card>
            </div>

            {balance?.tier && balance.tier !== 'free' && (
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={openBillingPortal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with the Layers API in seconds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`curl -X POST https://api.layers.dev/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</code>
            </pre>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
