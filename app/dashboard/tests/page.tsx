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
  TEST_FILES,
  TEST_CATEGORIES,
  ALL_TESTS,
  getTestsByFile,
  getTestsByCategory,
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
  FileCode,
  BookOpen,
  Layers,
  FlaskConical,
} from 'lucide-react';
import { useState } from 'react';

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

function FileCard({
  file,
  stats,
  isSelected,
  onClick,
}: {
  file: typeof TEST_FILES[number];
  stats: { pass: number; fail: number; skip: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  const passRate = stats.pass + stats.fail > 0
    ? Math.round((stats.pass / (stats.pass + stats.fail)) * 100)
    : 100;

  return (
    <button
      onClick={onClick}
      className={`text-left w-full p-4 rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-medium">{file.name}</span>
        <span className="text-xs text-muted-foreground">{file.testCount} tests</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{file.description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${passRate}%` }}
          />
        </div>
        <span className="text-xs font-medium">{passRate}%</span>
      </div>
      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
        <span className="text-green-600 dark:text-green-400">{stats.pass} pass</span>
        {stats.fail > 0 && (
          <span className="text-red-600 dark:text-red-400">{stats.fail} fail</span>
        )}
        {stats.skip > 0 && <span className="text-gray-500">{stats.skip} skip</span>}
      </div>
    </button>
  );
}

export default function TestDashboardPage() {
  const summary = getTestSummary();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'by-file' | 'by-category'>('by-file');

  const selectedTests = selectedFile
    ? getTestsByFile(selectedFile)
    : ALL_TESTS;

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
            <Link href="/dashboard/tests/docs">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </Link>
            <Link href="/dashboard/tests/runner">
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Run Tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All passing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Test Files</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{TEST_FILES.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Test suites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{TEST_CATEGORIES.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Capability areas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.total > 0
                  ? Math.round((summary.pass / summary.total) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pass}/{summary.total} passing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test File Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Test Files</CardTitle>
                <CardDescription>
                  Click a file to filter tests, or view all {summary.total} tests
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'by-file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('by-file')}
                >
                  By File
                </Button>
                <Button
                  variant={viewMode === 'by-category' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('by-category')}
                >
                  By Category
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEST_FILES.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  stats={summary.byFile[file.id]}
                  isSelected={selectedFile === file.id}
                  onClick={() =>
                    setSelectedFile(selectedFile === file.id ? null : file.id)
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedFile
                ? `${TEST_FILES.find((f) => f.id === selectedFile)?.name} (${selectedTests.length} tests)`
                : `All Tests (${summary.total})`}
            </CardTitle>
            <CardDescription>
              {selectedFile
                ? TEST_FILES.find((f) => f.id === selectedFile)?.description
                : 'Complete test coverage for Layers API and Gateway'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === 'by-file' ? (
              <div className="space-y-1">
                {selectedTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {test.name}
                        </span>
                        {test.providers && test.providers.length > 0 && (
                          <div className="flex gap-1">
                            {test.providers.map((p) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded bg-muted text-xs"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {test.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-xs text-muted-foreground capitalize">
                        {test.category}
                      </span>
                      <StatusBadge status={test.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {TEST_CATEGORIES.map((category) => {
                  const tests = getTestsByCategory(category.id).filter((t) =>
                    selectedFile ? t.file === selectedFile : true
                  );
                  if (tests.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h3 className="text-lg font-semibold mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                      <div className="space-y-1">
                        {tests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {test.name}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {test.file}
                                </span>
                              </div>
                            </div>
                            <StatusBadge status={test.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <code>{`# All unit tests (helpers + registry)
bun test helpers registry

# Gateway integration tests (direct to Vercel AI Gateway)
AI_GATEWAY_API_KEY=xxx bun test gateway

# API integration tests (through Layers API)
LAYERS_API_URL=https://web-nine-sage-13.vercel.app \\
LAYERS_API_KEY=lyr_live_xxx \\
bun test layers-api

# Quick smoke tests
bun test layers-api-quick

# Image generation tests
bun test image-generation`}</code>
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                Tests are located in{' '}
                <code className="bg-muted px-1 rounded">
                  packages/@layers/models/__tests__/
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
