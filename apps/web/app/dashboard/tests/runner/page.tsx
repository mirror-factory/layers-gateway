'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  TEST_FILES,
  TEST_CATEGORIES,
  ALL_TESTS,
  getTestsByFile,
  getTestsByCategory,
} from '@/lib/test-capabilities';
import type { TestRunResult, TestRunStatus } from '@/lib/test-runner';
import { TestFileTabs } from '@/components/TestFileTabs';
import { TestMatrix } from '@/components/TestMatrix';
import { TestOutput } from '@/components/TestOutput';
import {
  Zap,
  ArrowLeft,
  Play,
  StopCircle,
  Settings,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
  FlaskConical,
} from 'lucide-react';

export default function TestRunnerPage() {
  // State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestRunResult[]>([]);
  const [runStatus, setRunStatus] = useState<Record<string, TestRunStatus>>({});
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Abort controller for canceling runs
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get filtered tests based on selection
  const filteredTests = selectedFile
    ? getTestsByFile(selectedFile)
    : ALL_TESTS;

  // Get filtered categories based on file selection
  const filteredCategories = selectedFile
    ? TEST_CATEGORIES.filter((c) =>
        filteredTests.some((t) => t.category === c.id)
      )
    : TEST_CATEGORIES;

  // Calculate summary
  const summary = {
    pass: Object.values(runStatus).filter((s) => s === 'pass').length,
    fail: Object.values(runStatus).filter((s) => s === 'fail').length,
    skip: Object.values(runStatus).filter((s) => s === 'skip').length,
    error: Object.values(runStatus).filter((s) => s === 'error').length,
    running: Object.values(runStatus).filter((s) => s === 'running').length,
    total: filteredTests.length,
  };

  // Test counts for file tabs
  const testCounts = TEST_FILES.reduce((acc, file) => {
    const fileTests = getTestsByFile(file.id);
    acc[file.id] = {
      pass: fileTests.filter((t) => runStatus[t.id] === 'pass').length,
      fail: fileTests.filter((t) => runStatus[t.id] === 'fail').length,
      running: fileTests.filter((t) => runStatus[t.id] === 'running').length,
    };
    return acc;
  }, {} as Record<string, { pass: number; fail: number; running: number }>);

  // Run tests with SSE streaming
  const runTests = useCallback(
    async (mode: 'all' | 'file' | 'category' | 'single', target?: string) => {
      if (isRunning) return;

      setIsRunning(true);
      abortControllerRef.current = new AbortController();

      // Mark tests as pending
      const testsToRun =
        mode === 'all'
          ? filteredTests
          : mode === 'file'
          ? getTestsByFile(target!)
          : mode === 'category'
          ? getTestsByCategory(target!)
          : ALL_TESTS.filter((t) => t.id === target);

      const newRunStatus = { ...runStatus };
      testsToRun.forEach((t) => {
        newRunStatus[t.id] = 'running';
      });
      setRunStatus(newRunStatus);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers['X-Layers-API-Key'] = apiKey;
        }

        const response = await fetch('/api/tests/run', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            mode,
            target,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);

              if (eventType && eventData) {
                try {
                  const data = JSON.parse(eventData);

                  if (eventType === 'test-result') {
                    const result = data as TestRunResult;
                    setResults((prev) => [...prev, result]);
                    setRunStatus((prev) => ({
                      ...prev,
                      [result.testId]: result.status as TestRunStatus,
                    }));
                  } else if (eventType === 'complete') {
                    // Run complete
                  } else if (eventType === 'error') {
                    console.error('Test runner error:', data.message);
                  }
                } catch {
                  // Ignore parse errors
                }
              }

              eventType = '';
              eventData = '';
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Run was cancelled
        } else {
          console.error('Test run error:', error);
        }
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [isRunning, apiKey, filteredTests, runStatus]
  );

  // Cancel running tests
  const cancelRun = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    setResults([]);
    setRunStatus({});
  }, []);

  // Handle run all
  const handleRunAll = useCallback(() => {
    if (selectedFile) {
      runTests('file', selectedFile);
    } else {
      runTests('all');
    }
  }, [runTests, selectedFile]);

  // Handle run category
  const handleRunCategory = useCallback(
    (categoryId: string) => {
      runTests('category', categoryId);
    },
    [runTests]
  );

  // Handle run single test
  const handleRunTest = useCallback(
    (testId: string) => {
      runTests('single', testId);
    },
    [runTests]
  );

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/tests">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Test Status
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Test Runner</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Run Controls */}
            {isRunning ? (
              <Button variant="destructive" size="sm" onClick={cancelRun}>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={handleRunAll}>
                <Play className="h-4 w-4 mr-2" />
                Run {selectedFile ? 'File' : 'All'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Link href="/docs/testing">
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t bg-muted/50 px-4 py-3">
            <div className="container mx-auto flex items-center gap-4">
              <label className="text-sm font-medium">API Key:</label>
              <Input
                type="password"
                placeholder="lyr_live_xxxxx (optional, uses env if not set)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="max-w-md"
              />
              <span className="text-xs text-muted-foreground">
                Provide your Layers API key to run integration tests
              </span>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Test Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.pass}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.fail}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-gray-500">{summary.skip}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.running}</div>
                  <div className="text-xs text-muted-foreground">Running</div>
                </CardContent>
              </Card>
            </div>

            {/* File Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Test Files</CardTitle>
                <CardDescription>
                  Select a file to filter tests, or run all 141 tests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestFileTabs
                  files={[...TEST_FILES]}
                  selectedFile={selectedFile}
                  onSelect={setSelectedFile}
                  testCounts={testCounts}
                />
              </CardContent>
            </Card>

            {/* Test Matrix */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Test Categories</CardTitle>
                    <CardDescription>
                      Click a category to view tests, or run all tests in a category
                    </CardDescription>
                  </div>
                  {isRunning && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running tests...
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <TestMatrix
                  tests={filteredTests}
                  categories={[...filteredCategories]}
                  runStatus={runStatus}
                  onRunCategory={handleRunCategory}
                  onRunTest={handleRunTest}
                  isRunning={isRunning}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 h-[calc(100vh-8rem)]">
              <CardContent className="h-full p-4">
                <TestOutput
                  results={results}
                  isRunning={isRunning}
                  onClear={clearResults}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
