'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { Button } from '@/components/ui/button';
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
  Loader2,
  LogOut,
  BookOpen,
  RefreshCw,
  TrendingUp,
  Activity,
  LayoutDashboard,
  Settings,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  { name: 'Pricing & Credits', href: '/dashboard/pricing', icon: DollarSign },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Documentation', href: '/docs', icon: BookOpen },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async (retryCount = 0) => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Retry up to 3 times with 500ms delay to handle OAuth cookie propagation
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadData(retryCount + 1);
      }
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
          {/* Logo and tagline */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" className="flex items-center">
              <span className="font-serif text-base font-bold md:text-lg">Layers</span>
            </Link>
            <p className="hidden text-xs text-muted-foreground md:block">
              Unified AI Gateway for all providers
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            <span className="hidden rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary sm:inline-block md:px-3">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <ThemeToggle />
          </div>
      </header>

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
            <Select value="/dashboard" onValueChange={(value) => router.push(value)}>
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

          <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor your API usage and performance</p>
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
                      <div className="h-[200px]">
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
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
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
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={usage.by_model.slice(0, 5)} layout="vertical">
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
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
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

            {/* Recent Activity */}
            {usage?.recent_logs && usage.recent_logs.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
                      <CardDescription className="text-xs">Latest API calls</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {usage?.recent_logs?.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-primary' : 'bg-destructive'}`} />
                          <div>
                            <p className="text-sm font-medium">{log.model.split('/').pop()}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.input_tokens + log.output_tokens} tokens · {log.latency_ms}ms
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{log.credits_used.toFixed(3)} credits</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/settings">
                <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">API Keys & Billing</p>
                        <p className="text-sm text-muted-foreground">Manage keys and subscription</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/pricing">
                <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Pricing & Credits</p>
                        <p className="text-sm text-muted-foreground">View model costs and margins</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
