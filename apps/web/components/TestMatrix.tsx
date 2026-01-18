'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  HelpCircle,
  Play,
  AlertCircle,
} from 'lucide-react';
import type { TestCase, TestStatus } from '@/lib/test-capabilities';
import type { TestRunStatus } from '@/lib/test-runner';

interface TestMatrixProps {
  tests: TestCase[];
  categories: Array<{ id: string; name: string; description: string }>;
  runStatus: Record<string, TestRunStatus>;
  onRunCategory: (categoryId: string) => void;
  onRunTest: (testId: string) => void;
  isRunning: boolean;
  selectedCategory?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
  className?: string;
}

function StatusIcon({ status }: { status: TestStatus | TestRunStatus }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'skip':
      return <MinusCircle className="h-4 w-4 text-gray-400" />;
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'pending':
    default:
      return <HelpCircle className="h-4 w-4 text-gray-300" />;
  }
}

function StatusBadge({ status }: { status: TestStatus | TestRunStatus }) {
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';

  switch (status) {
    case 'pass':
      return (
        <span className={cn(baseClasses, 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400')}>
          <CheckCircle2 className="h-3 w-3" />
          Pass
        </span>
      );
    case 'fail':
      return (
        <span className={cn(baseClasses, 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400')}>
          <XCircle className="h-3 w-3" />
          Fail
        </span>
      );
    case 'skip':
      return (
        <span className={cn(baseClasses, 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400')}>
          <MinusCircle className="h-3 w-3" />
          Skip
        </span>
      );
    case 'running':
      return (
        <span className={cn(baseClasses, 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400')}>
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </span>
      );
    case 'error':
      return (
        <span className={cn(baseClasses, 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400')}>
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={cn(baseClasses, 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500')}>
          <HelpCircle className="h-3 w-3" />
          Pending
        </span>
      );
  }
}

export function TestMatrix({
  tests,
  categories,
  runStatus,
  onRunCategory,
  onRunTest,
  isRunning,
  selectedCategory,
  onSelectCategory,
  className,
}: TestMatrixProps) {
  // Group tests by category
  const testsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = tests.filter((t) => t.category === category.id);
    return acc;
  }, {} as Record<string, TestCase[]>);

  // Calculate category stats
  const categoryStats = categories.reduce((acc, category) => {
    const categoryTests = testsByCategory[category.id] || [];
    const pass = categoryTests.filter((t) => runStatus[t.id] === 'pass').length;
    const fail = categoryTests.filter((t) => runStatus[t.id] === 'fail').length;
    const running = categoryTests.filter((t) => runStatus[t.id] === 'running').length;
    acc[category.id] = { pass, fail, running, total: categoryTests.length };
    return acc;
  }, {} as Record<string, { pass: number; fail: number; running: number; total: number }>);

  // Filter categories with tests
  const activeCategories = categories.filter((c) => testsByCategory[c.id]?.length > 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCategories.map((category) => {
          const stats = categoryStats[category.id];
          const isSelected = selectedCategory === category.id;
          const isActive = stats.running > 0;
          const allPassed = stats.pass === stats.total && stats.total > 0;
          const hasFailed = stats.fail > 0;

          return (
            <div
              key={category.id}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                isSelected && 'border-primary bg-primary/5',
                !isSelected && 'border-border hover:border-primary/50',
                isActive && 'border-blue-500/50 animate-pulse',
                hasFailed && !isSelected && 'border-red-500/30',
                allPassed && !isSelected && 'border-green-500/30'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={() => onSelectCategory?.(isSelected ? null : category.id)}
                  className="text-left flex-1"
                >
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRunCategory(category.id)}
                  disabled={isRunning}
                  className="h-8 w-8 p-0"
                >
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full flex">
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(stats.pass / stats.total) * 100}%` }}
                  />
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(stats.fail / stats.total) * 100}%` }}
                  />
                  <div
                    className="bg-blue-500 transition-all animate-pulse"
                    style={{ width: `${(stats.running / stats.total) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-2 text-xs">
                <span className="text-green-600 dark:text-green-400">{stats.pass} pass</span>
                {stats.fail > 0 && (
                  <span className="text-red-600 dark:text-red-400">{stats.fail} fail</span>
                )}
                {stats.running > 0 && (
                  <span className="text-blue-600 dark:text-blue-400">{stats.running} running</span>
                )}
                <span className="text-muted-foreground ml-auto">{stats.total} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Category Tests */}
      {selectedCategory && testsByCategory[selectedCategory] && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">
            {categories.find((c) => c.id === selectedCategory)?.name} Tests
          </h3>
          <div className="space-y-2">
            {testsByCategory[selectedCategory].map((test) => {
              const status = runStatus[test.id] || test.status;

              return (
                <div
                  key={test.id}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <StatusIcon status={status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{test.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{test.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{test.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {test.providers && test.providers.length > 0 && (
                      <div className="flex gap-1">
                        {test.providers.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded bg-muted text-xs capitalize"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    <StatusBadge status={status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRunTest(test.id)}
                      disabled={isRunning}
                      className="h-7 w-7 p-0"
                    >
                      {status === 'running' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TestMatrix;
