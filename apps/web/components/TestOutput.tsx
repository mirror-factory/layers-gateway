'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import type { TestRunResult } from '@/lib/test-runner';

interface TestOutputProps {
  results: TestRunResult[];
  isRunning: boolean;
  onClear: () => void;
  className?: string;
}

function StatusIcon({ status }: { status: string }) {
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
    default:
      return <MinusCircle className="h-4 w-4 text-gray-300" />;
  }
}

function TestResultCard({ result }: { result: TestRunResult }) {
  const [isExpanded, setIsExpanded] = useState(result.status === 'fail' || result.status === 'error');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const data = JSON.stringify(result, null, 2);
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors = {
    pass: 'border-l-green-500',
    fail: 'border-l-red-500',
    skip: 'border-l-gray-400',
    running: 'border-l-blue-500',
    error: 'border-l-orange-500',
    pending: 'border-l-gray-300',
  };

  return (
    <div
      className={cn(
        'border rounded-lg bg-background overflow-hidden border-l-4 transition-all',
        statusColors[result.status as keyof typeof statusColors] || statusColors.pending
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StatusIcon status={result.status} />
          <div className="text-left">
            <span className="font-medium text-sm">{result.testName}</span>
            <span className="text-xs text-muted-foreground ml-2">({result.testId})</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {result.duration}ms
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t p-3 space-y-3 bg-muted/20">
          {/* Error message */}
          {result.error && (
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{result.error}</p>
            </div>
          )}

          {/* Request */}
          {result.request && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Request</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-xs"
                >
                  {copied ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                <code className="text-foreground">
                  <span className="text-blue-600 dark:text-blue-400">{result.request.method}</span>
                  {' '}
                  <span className="text-green-600 dark:text-green-400">{result.request.url}</span>
                  {result.request.body && (
                    <>
                      {'\n\n'}
                      {JSON.stringify(result.request.body, null, 2)}
                    </>
                  )}
                </code>
              </pre>
            </div>
          )}

          {/* Response */}
          {result.response && (
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">
                Response ({result.response.status})
              </span>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-60">
                <code className="text-foreground">
                  {JSON.stringify(result.response.body, null, 2)}
                </code>
              </pre>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export function TestOutput({
  results,
  isRunning,
  onClear,
  className,
}: TestOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new results come in
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [results, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  // Calculate summary
  const summary = {
    pass: results.filter((r) => r.status === 'pass').length,
    fail: results.filter((r) => r.status === 'fail').length,
    skip: results.filter((r) => r.status === 'skip').length,
    error: results.filter((r) => r.status === 'error').length,
    running: results.filter((r) => r.status === 'running').length,
    total: results.length,
  };

  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b mb-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Test Output</h3>
          {isRunning && (
            <span className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Summary badges */}
          <div className="flex gap-2 text-xs">
            {summary.pass > 0 && (
              <span className="text-green-600 dark:text-green-400">{summary.pass} pass</span>
            )}
            {summary.fail > 0 && (
              <span className="text-red-600 dark:text-red-400">{summary.fail} fail</span>
            )}
            {summary.skip > 0 && (
              <span className="text-gray-500">{summary.skip} skip</span>
            )}
            {summary.error > 0 && (
              <span className="text-orange-600 dark:text-orange-400">{summary.error} error</span>
            )}
            {summary.total > 0 && (
              <span className="text-muted-foreground">
                {(totalDuration / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={results.length === 0}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Results List */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 pr-1"
      >
        {results.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No test results yet. Run some tests to see output.</p>
          </div>
        ) : (
          results.map((result, index) => (
            <TestResultCard key={`${result.testId}-${index}`} result={result} />
          ))
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && results.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAutoScroll(true);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-4 right-4 shadow-lg"
        >
          <ChevronDown className="h-4 w-4 mr-1" />
          Scroll to bottom
        </Button>
      )}
    </div>
  );
}

export default TestOutput;
