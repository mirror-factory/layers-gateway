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
  CreditCard,
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
  TrendingUp,
  Activity,
  LayoutDashboard,
  Settings,
  Code,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

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

interface ProviderStats {
  provider: string;
  requests: number;
  credits: number;
  tokens: number;
}

interface ModelStats {
  model: string;
  requests: number;
  credits: number;
  tokens: number;
}

interface DayStats {
  date: string;
  requests: number;
  credits: number;
  tokens: number;
}

interface RecentLog {
  id: string;
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  credits_used: number;
  latency_ms: number;
  status: string;
  created_at: string;
}

interface UsageStats {
  total_requests: number;
  total_credits_used: number;
  this_month_requests: number;
  this_month_credits: number;
  by_provider: ProviderStats[];
  by_model: ModelStats[];
  by_day: DayStats[];
  recent_logs: RecentLog[];
}

// Sidebar navigation items
const sidebarNav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, active: true },
  { name: 'API Keys', href: '/dashboard#keys', icon: Key },
  { name: 'Usage', href: '/dashboard#usage', icon: Activity },
  { name: 'Billing', href: '/dashboard#billing', icon: CreditCard },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
  { name: 'Playground', href: '/playground', icon: Code },
];

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
  const [activeSection, setActiveSection] = useState('overview');
  const router = useRouter();

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirectTo=/dashboard');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="font-serif text-lg font-semibold text-primary">L</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">Layers</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Docs
              </Button>
            </Link>
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden md:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-56 flex-col border-r border-border/50 bg-sidebar min-h-[calc(100vh-3.5rem)]">
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

          {/* Sidebar footer */}
          <div className="border-t border-border/50 p-4">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor your API usage and manage your account</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadData()}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Credit Balance</p>
                      <p className="text-2xl font-semibold font-serif mt-1">{balance?.credits?.toFixed(0) || '0'}</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">API Keys</p>
                      <p className="text-2xl font-semibold font-serif mt-1">{apiKeys.length}</p>
                      <p className="text-[10px] text-muted-foreground">{apiKeys.filter(k => k.is_active).length} active</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Requests</p>
                      <p className="text-2xl font-semibold font-serif mt-1">{usage?.this_month_requests?.toLocaleString() || '0'}</p>
                      <p className="text-[10px] text-muted-foreground">this month</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Credits Used</p>
                      <p className="text-2xl font-semibold font-serif mt-1">{usage?.this_month_credits?.toFixed(1) || '0'}</p>
                      <p className="text-[10px] text-muted-foreground">this month</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            {usage && (usage.by_day?.length > 0 || usage.by_model?.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Usage Trend - Takes 2 columns */}
                {usage.by_day?.length > 0 && (
                  <Card className="lg:col-span-2 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Usage Trend</CardTitle>
                      <CardDescription className="text-xs">Last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={usage.by_day}>
                            <defs>
                              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.75 0.12 166)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="oklch(0.75 0.12 166)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
                            />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Area
                              type="monotone"
                              dataKey="requests"
                              stroke="oklch(0.75 0.12 166)"
                              strokeWidth={2}
                              fill="url(#colorRequests)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Models - Compact */}
                {usage.by_model?.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top Models</CardTitle>
                      <CardDescription className="text-xs">By request count</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={usage.by_model.slice(0, 4)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis
                              dataKey="model"
                              type="category"
                              width={80}
                              tick={{ fontSize: 9 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => value.split('/').pop()?.slice(0, 12) || value}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar dataKey="requests" fill="oklch(0.75 0.12 166)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Recent Activity & API Keys side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Requests */}
              {usage?.recent_logs?.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                        View all <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {usage.recent_logs.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'success' ? 'bg-primary' : 'bg-destructive'}`} />
                            <div>
                              <p className="text-xs font-medium">{log.model.split('/').pop()}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {log.input_tokens + log.output_tokens} tokens
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{log.credits_used.toFixed(3)}</p>
                            <p className="text-[10px] text-muted-foreground">{log.latency_ms}ms</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* API Keys - Compact */}
              <Card className="border-border/50" id="keys">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                    <span className="text-xs text-muted-foreground">{apiKeys.length} keys</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Create new key - inline */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key name..."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button size="sm" className="h-8" onClick={createApiKey} disabled={isCreating || !newKeyName.trim()}>
                      {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>

                  {/* New key alert */}
                  {newKey && (
                    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                      <p className="text-xs font-medium mb-2">New key created - copy now!</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showKey ? 'text' : 'password'}
                          value={newKey}
                          readOnly
                          className="h-7 text-xs font-mono"
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowKey(!showKey)}>
                          {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyToClipboard(newKey, 'new')}>
                          {copiedId === 'new' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Key list */}
                  <div className="space-y-1">
                    {apiKeys.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No API keys yet</p>
                    ) : (
                      apiKeys.slice(0, 4).map((key) => (
                        <div key={key.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div>
                            <p className="text-xs font-medium">{key.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{key.prefix}...</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteApiKey(key.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Billing Section - Compact horizontal cards */}
            <Card className="border-border/50" id="billing">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Plans</CardTitle>
                    <CardDescription className="text-xs">Choose the plan that fits your needs</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {balance?.tier && balance.tier !== 'free' && (
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={openBillingPortal}>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={syncSubscription}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Starter */}
                  <div className={`p-4 rounded-lg border ${balance?.tier === 'starter' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">Starter</h3>
                      {balance?.tier === 'starter' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Current</span>}
                    </div>
                    <div className="mb-3">
                      <span className="text-xl font-semibold font-serif">$20</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>500 credits/month</li>
                      <li>All models</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => openCheckout('starter')} disabled={balance?.tier === 'starter'}>
                      {balance?.tier === 'starter' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>

                  {/* Pro */}
                  <div className={`p-4 rounded-lg border-2 ${balance?.tier === 'pro' ? 'border-primary bg-primary/5' : 'border-primary/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">Pro</h3>
                      <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Popular</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-xl font-semibold font-serif">$100</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>3,000 credits/month</li>
                      <li>Priority support</li>
                    </ul>
                    <Button size="sm" className="w-full h-7 text-xs" onClick={() => openCheckout('pro')} disabled={balance?.tier === 'pro'}>
                      {balance?.tier === 'pro' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>

                  {/* Team */}
                  <div className={`p-4 rounded-lg border ${balance?.tier === 'team' ? 'border-primary bg-primary/5' : 'border-border/50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">Team</h3>
                      {balance?.tier === 'team' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Current</span>}
                    </div>
                    <div className="mb-3">
                      <span className="text-xl font-semibold font-serif">$200</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>7,500 credits/month</li>
                      <li>Premium support</li>
                    </ul>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => openCheckout('team')} disabled={balance?.tier === 'team'}>
                      {balance?.tier === 'team' ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start - More compact */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs font-mono">
                  <code>{`curl -X POST https://layers.hustletogether.com/api/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "anthropic/claude-sonnet-4.5", "messages": [{"role": "user", "content": "Hello!"}]}'`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
