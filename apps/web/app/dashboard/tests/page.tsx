'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TEST_CATEGORIES,
  TEST_CAPABILITIES,
  getCapabilitiesByCategory,
  getTestSummary,
  type TestStatus,
} from '@/lib/test-capabilities';
import {
  Zap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  Server,
  Globe,
  FileCode,
  BookOpen,
} from 'lucide-react';

function StatusBadge({ status }: { status: TestStatus }) {
  switch (status) {
    case 'pass':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Pass
        </span>
      );
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          Fail
        </span>
      );
    case 'skip':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <MinusCircle className="h-3 w-3" />
          Skip
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <HelpCircle className="h-3 w-3" />
          Unknown
        </span>
      );
  }
}

function SummaryCard({
  title,
  icon: Icon,
  pass,
  fail,
  skip,
}: {
  title: string;
  icon: React.ElementType;
  pass: number;
  fail: number;
  skip: number;
}) {
  const total = pass + fail + skip;
  const passRate = total > 0 ? Math.round((pass / (pass + fail)) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {pass}/{pass + fail}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({passRate}%)
          </span>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{pass} pass</span>
          <span className="text-red-600 dark:text-red-400">{fail} fail</span>
          <span className="text-gray-500">{skip} skip</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TestDashboardPage() {
  const summary = getTestSummary();

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Test Status</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/docs">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Gateway Tests"
            icon={Server}
            pass={summary.gateway.pass}
            fail={summary.gateway.fail}
            skip={summary.gateway.skip}
          />
          <SummaryCard
            title="API Tests"
            icon={Globe}
            pass={summary.api.pass}
            fail={summary.api.fail}
            skip={summary.api.skip}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Capabilities</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Across {TEST_CATEGORIES.length} categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Capability Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Capability Matrix</CardTitle>
            <CardDescription>
              Test coverage for Gateway (direct) and API (with auth/credits) paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {TEST_CATEGORIES.map((category) => {
                const capabilities = getCapabilitiesByCategory(category.id);
                if (capabilities.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Capability</th>
                            <th className="text-left py-2 px-3 font-medium">Description</th>
                            <th className="text-center py-2 px-3 font-medium">Gateway</th>
                            <th className="text-center py-2 px-3 font-medium">API</th>
                            <th className="text-left py-2 px-3 font-medium">Providers</th>
                          </tr>
                        </thead>
                        <tbody>
                          {capabilities.map((cap) => (
                            <tr key={cap.id} className="border-b last:border-0">
                              <td className="py-3 px-3 font-medium">{cap.name}</td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {cap.description}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <StatusBadge status={cap.gateway} />
                              </td>
                              <td className="py-3 px-3 text-center">
                                <StatusBadge status={cap.api} />
                              </td>
                              <td className="py-3 px-3">
                                {cap.providers ? (
                                  <div className="flex flex-wrap gap-1">
                                    {cap.providers.map((p) => (
                                      <span
                                        key={p}
                                        className="px-2 py-0.5 rounded bg-muted text-xs"
                                      >
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Run Tests CTA */}
        <Card>
          <CardHeader>
            <CardTitle>Run Tests</CardTitle>
            <CardDescription>
              Execute the test suite to verify all capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{`# Gateway tests (direct to Vercel AI Gateway)
AI_GATEWAY_API_KEY=xxx bun test gateway

# API tests (through Layers API)
LAYERS_API_URL=https://web-nine-sage-13.vercel.app \\
LAYERS_API_KEY=lyr_live_xxx \\
bun test layers-api`}</code>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Tests are located in{' '}
                <code className="bg-muted px-1 rounded">
                  packages/@layers/models/__tests__/integration/
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
