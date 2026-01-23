'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, DollarSign, Calculator, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ModelPricing {
  input: number;
  output: number;
  image?: number;
}

interface PricingData {
  status: string;
  metadata: {
    source: string;
    version: string | null;
    cached_at: string | null;
    cache_age_ms: number | null;
    model_count: number | null;
  };
  models: Record<string, ModelPricing> | null;
}

interface ModelWithCredits {
  id: string;
  provider: string;
  inputUsd: number;
  outputUsd: number;
  inputCredits: number;
  outputCredits: number;
  marginPercent: number;
}

const DEFAULT_MARGIN = 60;

export default function PricingDashboard() {
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marginPercent, setMarginPercent] = useState(DEFAULT_MARGIN);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/v1/pricing');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      const data = await response.json();
      setPricingData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const refreshPricing = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/v1/pricing', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to refresh pricing');
      await fetchPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  // Calculate credits from USD price
  const usdToCredits = (usdPer1K: number, margin: number): number => {
    return (usdPer1K / 0.01) * (1 + margin / 100);
  };

  // Format USD price
  const formatUsd = (usd: number): string => {
    if (usd === 0) return '$0';
    if (usd < 0.0001) return `$${usd.toFixed(6)}`;
    if (usd < 0.01) return `$${usd.toFixed(4)}`;
    return `$${usd.toFixed(3)}`;
  };

  // Format credits
  const formatCredits = (credits: number): string => {
    if (credits === 0) return '0';
    if (credits < 0.01) return credits.toFixed(4);
    if (credits < 1) return credits.toFixed(3);
    return credits.toFixed(2);
  };

  // Get provider from model ID
  const getProvider = (modelId: string): string => {
    return modelId.split('/')[0] || 'unknown';
  };

  // Get provider color
  const getProviderColor = (provider: string): string => {
    const colors: Record<string, string> = {
      anthropic: 'bg-orange-100 text-orange-800',
      openai: 'bg-green-100 text-green-800',
      google: 'bg-blue-100 text-blue-800',
      perplexity: 'bg-purple-100 text-purple-800',
      morph: 'bg-pink-100 text-pink-800',
      bfl: 'bg-yellow-100 text-yellow-800',
      fal: 'bg-cyan-100 text-cyan-800',
      recraft: 'bg-indigo-100 text-indigo-800',
    };
    return colors[provider] || 'bg-gray-100 text-gray-800';
  };

  // Process models into display format
  const processModels = (): ModelWithCredits[] => {
    if (!pricingData?.models) return [];

    return Object.entries(pricingData.models)
      .filter(([id]) => {
        if (!searchQuery) return true;
        return id.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map(([id, pricing]) => ({
        id,
        provider: getProvider(id),
        inputUsd: pricing.input,
        outputUsd: pricing.output,
        inputCredits: usdToCredits(pricing.input, marginPercent),
        outputCredits: usdToCredits(pricing.output, marginPercent),
        marginPercent,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const models = processModels();
  const providers = [...new Set(models.map(m => m.provider))];

  // Calculate summary stats
  const avgInputCredits = models.length > 0
    ? models.reduce((sum, m) => sum + m.inputCredits, 0) / models.length
    : 0;
  const avgOutputCredits = models.length > 0
    ? models.reduce((sum, m) => sum + m.outputCredits, 0) / models.length
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pricing & Credits</h1>
          <p className="text-muted-foreground">
            Manage margins and view model pricing
          </p>
        </div>
        <Button onClick={refreshPricing} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Pricing
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {pricingData?.status === 'synced' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Pricing Sync Status
          </CardTitle>
          <CardDescription>
            Pricing synced from Hustle Together AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Status</Label>
              <p className="font-medium">
                <Badge variant={pricingData?.status === 'synced' ? 'default' : 'secondary'}>
                  {pricingData?.status || 'unknown'}
                </Badge>
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Version</Label>
              <p className="font-medium font-mono text-sm">
                {pricingData?.metadata?.version?.slice(0, 19) || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Models</Label>
              <p className="font-medium">{pricingData?.metadata?.model_count || 0}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Cache Age</Label>
              <p className="font-medium">
                {pricingData?.metadata?.cache_age_ms
                  ? `${Math.round(pricingData.metadata.cache_age_ms / 1000 / 60)} min`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Margin Configuration
          </CardTitle>
          <CardDescription>
            Configure the profit margin applied to base costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="margin">Margin Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="margin"
                  type="number"
                  min="0"
                  max="200"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">
                <strong>Formula:</strong> credits = (base_cost_usd / $0.01) × {(1 + marginPercent / 100).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <strong>Example:</strong> $0.01 base cost = {formatCredits(usdToCredits(0.01, marginPercent))} credits
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Providers</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Input Credits/1K</p>
                <p className="text-2xl font-bold">{formatCredits(avgInputCredits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Output Credits/1K</p>
                <p className="text-2xl font-bold">{formatCredits(avgOutputCredits)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Pricing Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Pricing</CardTitle>
              <CardDescription>
                All models with USD cost and credit conversion (per 1K tokens)
              </CardDescription>
            </div>
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Input (USD)</TableHead>
                  <TableHead className="text-right">Output (USD)</TableHead>
                  <TableHead className="text-right">Input (Credits)</TableHead>
                  <TableHead className="text-right">Output (Credits)</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-mono text-sm">{model.id}</TableCell>
                    <TableCell>
                      <Badge className={getProviderColor(model.provider)}>
                        {model.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatUsd(model.inputUsd)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatUsd(model.outputUsd)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCredits(model.inputCredits)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCredits(model.outputCredits)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{model.marginPercent}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchQuery ? 'No models match your search' : 'No pricing data available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Credit Conversion Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Conversion Reference</CardTitle>
          <CardDescription>
            Quick reference for cost-to-credit conversion at {marginPercent}% margin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0.001, 0.005, 0.01, 0.05].map((usd) => (
              <div key={usd} className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Base Cost</p>
                <p className="text-lg font-bold">{formatUsd(usd)}/1K</p>
                <p className="text-sm text-muted-foreground mt-2">Credits</p>
                <p className="text-lg font-bold text-primary">
                  {formatCredits(usdToCredits(usd, marginPercent))}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
