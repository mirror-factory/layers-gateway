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
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  Loader2,
  LogOut,
  ExternalLink,
  Eye,
  EyeOff,
  BookOpen,
  RefreshCw,
  LayoutDashboard,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Sidebar navigation items
const sidebarNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, active: true },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
];

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirectTo=/dashboard/settings');
      return;
    }
    setUser(user);

    const keysRes = await fetch('/api/keys');
    if (keysRes.ok) {
      const keysData = await keysRes.json();
      setApiKeys(keysData.keys || []);
    }

    const balanceRes = await fetch('/api/balance');
    if (balanceRes.ok) {
      const balanceData = await balanceRes.json();
      setBalance(balanceData);
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

  const openBillingPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      window.location.href = data.url;
    }
  };

  const openCheckout = async (tier: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  const syncSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UnifiedNav variant="dashboard" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Bar */}
      <UnifiedNav variant="dashboard" />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card md:flex flex-col min-h-[calc(100vh-3.5rem)]">
          {/* Credits - at top */}
          <div className="p-4 border-b border-border/50">
            <div className="rounded-lg bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Credits</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  balance?.tier === 'pro' ? 'bg-primary/20 text-primary' :
                  balance?.tier === 'team' ? 'bg-primary/30 text-primary' :
                  balance?.tier === 'starter' ? 'bg-primary/15 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {(balance?.tier || 'FREE').toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-semibold font-serif">{balance?.credits?.toFixed(0) || '0'}</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sidebarNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden border-b bg-card p-4">
            <Select value="/dashboard/settings" onValueChange={(value) => router.push(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Navigate to..." />
              </SelectTrigger>
              <SelectContent>
                {sidebarNav.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Link href="/dashboard" className="hover:text-foreground flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Dashboard
                </Link>
                <span>/</span>
                <span>Settings</span>
              </div>
              <h1 className="text-2xl font-serif font-semibold">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your API keys and billing</p>
            </div>

            {/* API Keys Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif">API Keys</CardTitle>
                <CardDescription>Create and manage API keys for accessing the Layers API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create new key */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (e.g., Production, Development)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createApiKey()}
                  />
                  <Button onClick={createApiKey} disabled={isCreating || !newKeyName.trim()}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Key
                  </Button>
                </div>

                {/* New key alert */}
                {newKey && (
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">New API Key Created</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Copy this key now. You won't be able to see it again.</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type={showKey ? 'text' : 'password'}
                        value={newKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKey, 'new')}>
                        {copiedId === 'new' ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-3" onClick={() => setNewKey(null)}>
                      Done
                    </Button>
                  </div>
                )}

                {/* Key list */}
                <div className="space-y-2">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No API keys yet</p>
                      <p className="text-xs">Create one to get started</p>
                    </div>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{key.prefix}...</p>
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
                          className="text-muted-foreground hover:text-destructive"
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
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-serif">Billing & Plans</CardTitle>
                    <CardDescription>Manage your subscription and purchase credits</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {balance?.tier && balance.tier !== 'free' && (
                      <Button variant="outline" size="sm" onClick={openBillingPortal}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={syncSubscription}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Current Plan */}
                <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Plan</p>
                      <p className="text-xl font-serif font-semibold capitalize">{balance?.tier || 'Free'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Credit Balance</p>
                      <p className="text-xl font-serif font-semibold">{balance?.credits?.toFixed(0) || '0'}</p>
                    </div>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Starter */}
                  <div className={`p-5 rounded-lg border-2 transition-colors ${
                    balance?.tier === 'starter' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif font-semibold">Starter</h3>
                      {balance?.tier === 'starter' && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Current</span>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-serif font-semibold">$20</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        500 credits/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        All models
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        Standard rate limits
                      </li>
                    </ul>
                    <Button
                      variant={balance?.tier === 'starter' ? 'outline' : 'default'}
                      className="w-full"
                      onClick={() => openCheckout('starter')}
                      disabled={balance?.tier === 'starter'}
                    >
                      {balance?.tier === 'starter' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>

                  {/* Pro */}
                  <div className={`p-5 rounded-lg border-2 transition-colors ${
                    balance?.tier === 'pro' ? 'border-primary bg-primary/5' : 'border-primary/50 hover:border-primary'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif font-semibold">Pro</h3>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Popular</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-serif font-semibold">$100</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        3,000 credits/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        All models
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        Higher rate limits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        Priority support
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      onClick={() => openCheckout('pro')}
                      disabled={balance?.tier === 'pro'}
                    >
                      {balance?.tier === 'pro' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>

                  {/* Team */}
                  <div className={`p-5 rounded-lg border-2 transition-colors ${
                    balance?.tier === 'team' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-serif font-semibold">Team</h3>
                      {balance?.tier === 'team' && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Current</span>
                      )}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-serif font-semibold">$200</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        7,500 credits/month
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        All models
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        Highest rate limits
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        Premium support
                      </li>
                    </ul>
                    <Button
                      variant={balance?.tier === 'team' ? 'outline' : 'default'}
                      className="w-full"
                      onClick={() => openCheckout('team')}
                      disabled={balance?.tier === 'team'}
                    >
                      {balance?.tier === 'team' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Quick Start</CardTitle>
                <CardDescription>Get started with the Layers API</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  <code>{`curl -X POST https://layers.hustletogether.com/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
