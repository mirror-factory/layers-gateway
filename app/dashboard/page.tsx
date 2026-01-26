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
  RefreshCw,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Download,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import { UnifiedSidebar } from '@/components/navigation/unified-sidebar';
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

// Mobile navigation items
const mobileNav = [
  { name: 'Overview', href: '/dashboard' },
  { name: 'Pricing & Credits', href: '/dashboard/pricing' },
  { name: 'Settings', href: '/dashboard/settings' },
  { name: 'Documentation', href: '/docs' },
];

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


export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const router = useRouter();

  const loadData = useCallback(async (retryCount = 0, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Retry up to 3 times with 500ms delay to handle OAuth cookie propagation
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadData(retryCount + 1, isManualRefresh);
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

    // Fetch 90 days of data so we can filter client-side
    const usageRes = await fetch('/api/usage?days=90');
    if (usageRes.ok) {
      const usageData = await usageRes.json();
      setUsage(usageData);
    }

    setLastUpdated(new Date());
    setIsLoading(false);
    setIsRefreshing(false);
  }, [router]);

  const handleManualRefresh = useCallback(() => {
    loadData(0, true);
  }, [loadData]);

  // Filter data based on selected filters
  const filteredUsage = usage ? (() => {
    // Calculate date cutoff based on time range
    const now = new Date();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoffDate = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Filter recent_logs based on provider, model, and time range
    const filteredRecentLogs = usage.recent_logs?.filter(log => {
      const logDate = log.created_at.split('T')[0];
      const matchesTimeRange = logDate >= cutoffDateStr;
      const matchesProvider = selectedProvider === 'all' || log.provider === selectedProvider;
      const matchesModel = selectedModel === 'all' || log.model === selectedModel;
      return matchesTimeRange && matchesProvider && matchesModel;
    }) || [];

    // Recalculate by_day from filtered logs
    const byDayMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of filteredRecentLogs) {
      const day = log.created_at.split('T')[0];
      const existing = byDayMap.get(day) || { requests: 0, credits: 0, tokens: 0 };
      byDayMap.set(day, {
        requests: existing.requests + 1,
        credits: existing.credits + log.credits_used,
        tokens: existing.tokens + log.input_tokens + log.output_tokens,
      });
    }
    const filteredByDay = Array.from(byDayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recalculate by_provider from filtered logs
    const byProviderMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of filteredRecentLogs) {
      const provider = log.provider || 'unknown';
      const existing = byProviderMap.get(provider) || { requests: 0, credits: 0, tokens: 0 };
      byProviderMap.set(provider, {
        requests: existing.requests + 1,
        credits: existing.credits + log.credits_used,
        tokens: existing.tokens + log.input_tokens + log.output_tokens,
      });
    }
    const filteredByProvider = Array.from(byProviderMap.entries()).map(([provider, stats]) => ({
      provider,
      ...stats,
    }));

    // Recalculate by_model from filtered logs
    const byModelMap = new Map<string, { requests: number; credits: number; tokens: number }>();
    for (const log of filteredRecentLogs) {
      const model = log.model || 'unknown';
      const existing = byModelMap.get(model) || { requests: 0, credits: 0, tokens: 0 };
      byModelMap.set(model, {
        requests: existing.requests + 1,
        credits: existing.credits + log.credits_used,
        tokens: existing.tokens + log.input_tokens + log.output_tokens,
      });
    }
    const filteredByModel = Array.from(byModelMap.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      ...usage,
      by_day: filteredByDay,
      by_provider: filteredByProvider,
      by_model: filteredByModel,
      recent_logs: filteredRecentLogs,
    };
  })() : null;

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 seconds
    const intervalId = setInterval(() => {
      loadData(0, false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  // Export filtered data to CSV
  const exportData = () => {
    if (!filteredUsage?.recent_logs) return;

    const csvContent = [
      ['Date', 'Time', 'Model', 'Provider', 'Input Tokens', 'Output Tokens', 'Credits', 'Latency (ms)', 'Status'].join(','),
      ...filteredUsage.recent_logs.map(log => [
        new Date(log.created_at).toLocaleDateString(),
        new Date(log.created_at).toLocaleTimeString(),
        log.model,
        log.provider,
        log.input_tokens,
        log.output_tokens,
        log.credits_used.toFixed(4),
        log.latency_ms,
        log.status,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layers-usage-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      <UnifiedNav variant="dashboard" />

      <div className="flex">
        {/* Sidebar */}
        <UnifiedSidebar className="hidden md:flex" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden border-b bg-card p-4">
            <Select value="/dashboard" onValueChange={(value) => router.push(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Navigate to..." />
              </SelectTrigger>
              <SelectContent>
                {mobileNav.map((item) => (
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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-serif font-semibold">Dashboard</h1>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                    <Activity className="h-3 w-3" />
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">Auto-refreshing every 5s</p>
                  {lastUpdated && (
                    <span className="text-xs text-muted-foreground">
                      · Last update: {new Date(lastUpdated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportData} disabled={!filteredUsage?.recent_logs?.length}>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Error Rate</p>
                      <p className="text-2xl font-semibold font-serif mt-1">
                        {filteredUsage?.recent_logs && filteredUsage.recent_logs.length > 0
                          ? ((filteredUsage.recent_logs.filter(log => log.status !== 'success').length / filteredUsage.recent_logs.length) * 100).toFixed(1)
                          : '0'}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {filteredUsage?.recent_logs?.filter(log => log.status !== 'success').length || 0} errors
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            {filteredUsage && (filteredUsage.by_day?.length > 0 || filteredUsage.by_model?.length > 0) && (
              <div className="flex flex-wrap items-center gap-3">
                <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {usage?.by_provider.map(p => (
                      <SelectItem key={p.provider} value={p.provider}>
                        {p.provider.charAt(0).toUpperCase() + p.provider.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All models" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All models</SelectItem>
                    {usage?.by_model
                      .sort((a, b) => a.model.localeCompare(b.model))
                      .map(m => (
                        <SelectItem key={m.model} value={m.model}>
                          {m.model.split('/').pop()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {(selectedProvider !== 'all' || selectedModel !== 'all' || timeRange !== '30d') && (
                  <>
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-md">
                      {filteredUsage?.recent_logs?.length || 0} requests
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider('all');
                        setSelectedModel('all');
                        setTimeRange('30d');
                      }}
                      className="text-xs"
                    >
                      Clear filters
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Charts Row */}
            {filteredUsage && (filteredUsage.by_day?.length > 0 || filteredUsage.by_model?.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Usage Trend - Takes 2 columns */}
                {filteredUsage.by_day?.length > 0 && (
                  <Card className="lg:col-span-2 border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Usage Trend</CardTitle>
                      <CardDescription className="text-xs">
                        Last {timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} days
                        {selectedProvider !== 'all' && ` • ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                        {selectedModel !== 'all' && ` • ${selectedModel.split('/').pop()}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredUsage.by_day}>
                            <defs>
                              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.75 0.12 166)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="oklch(0.75 0.12 166)" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.65 0.15 280)" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="oklch(0.65 0.15 280)" stopOpacity={0}/>
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
                            <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                              formatter={(value: any, name?: string) => [
                                name === 'requests' ? value : value.toFixed(2),
                                name === 'requests' ? 'Requests' : 'Credits'
                              ]}
                            />
                            <Area
                              yAxisId="left"
                              type="monotone"
                              dataKey="requests"
                              stroke="oklch(0.75 0.12 166)"
                              strokeWidth={2}
                              fill="url(#colorRequests)"
                            />
                            <Area
                              yAxisId="right"
                              type="monotone"
                              dataKey="credits"
                              stroke="oklch(0.65 0.15 280)"
                              strokeWidth={2}
                              fill="url(#colorCredits)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Models - Compact */}
                {filteredUsage.by_model?.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Top Models</CardTitle>
                      <CardDescription className="text-xs">By request count</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={filteredUsage.by_model.slice(0, 5)} layout="vertical">
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

            {/* Provider Breakdown & Cost Efficiency */}
            {filteredUsage && filteredUsage.by_provider?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Provider Breakdown */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">By Provider</CardTitle>
                    <CardDescription className="text-xs">
                      Cost and usage comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredUsage.by_provider.map((provider) => {
                        const total = filteredUsage.by_provider.reduce((sum, p) => sum + p.requests, 0);
                        const percentage = ((provider.requests / total) * 100).toFixed(1);

                        return (
                          <div key={provider.provider} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium capitalize">{provider.provider}</span>
                              <div className="text-right">
                                <span className="font-semibold">{provider.requests}</span>
                                <span className="text-muted-foreground text-xs ml-2">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{provider.credits.toFixed(2)} credits</span>
                              <span>•</span>
                              <span>{provider.tokens.toLocaleString()} tokens</span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Efficiency */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cost Efficiency</CardTitle>
                    <CardDescription className="text-xs">Credits per 1K tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredUsage.by_provider.map(p => ({
                          provider: p.provider,
                          efficiency: p.tokens > 0 ? ((p.credits / p.tokens) * 1000) : 0
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                          <XAxis
                            dataKey="provider"
                            tick={{ fontSize: 9 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1, 8)}
                          />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            formatter={(value: any) => [value.toFixed(4), 'Credits/1K tokens']}
                          />
                          <Bar dataKey="efficiency" fill="oklch(0.75 0.12 166)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Activity */}
            {filteredUsage?.recent_logs && filteredUsage.recent_logs.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">Recent Requests</CardTitle>
                      <CardDescription className="text-xs">
                        Latest API calls
                        {selectedProvider !== 'all' && ` • ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}`}
                        {selectedModel !== 'all' && ` • ${selectedModel.split('/').pop()}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {filteredUsage?.recent_logs?.slice(0, 8).map((log) => (
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
                              <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                log.latency_ms < 1000 ? 'bg-green-500/10 text-green-600' :
                                log.latency_ms < 3000 ? 'bg-yellow-500/10 text-yellow-600' :
                                'bg-red-500/10 text-red-600'
                              }`}>
                                {log.latency_ms < 1000 ? 'Fast' : log.latency_ms < 3000 ? 'Normal' : 'Slow'}
                              </span>
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
