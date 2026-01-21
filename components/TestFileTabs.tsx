'use client';

import { cn } from '@/lib/utils';
import { FileCode, ChevronRight } from 'lucide-react';

interface TestFile {
  id: string;
  name: string;
  description: string;
  testCount: number;
}

interface TestFileTabsProps {
  files: TestFile[];
  selectedFile: string | null;
  onSelect: (fileId: string | null) => void;
  testCounts?: Record<string, { pass: number; fail: number; running: number }>;
  className?: string;
}

export function TestFileTabs({
  files,
  selectedFile,
  onSelect,
  testCounts,
  className,
}: TestFileTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* All Tests Tab */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
          'hover:border-primary/50 hover:bg-muted/50',
          selectedFile === null
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border bg-background'
        )}
      >
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">All Tests</span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {files.reduce((sum, f) => sum + f.testCount, 0)}
        </span>
      </button>

      <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />

      {/* File Tabs */}
      {files.map((file) => {
        const counts = testCounts?.[file.id];
        const isRunning = counts && counts.running > 0;
        const hasFailed = counts && counts.fail > 0;
        const allPassed = counts && counts.pass === file.testCount;

        return (
          <button
            key={file.id}
            onClick={() => onSelect(file.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all',
              'hover:border-primary/50 hover:bg-muted/50',
              selectedFile === file.id
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background',
              isRunning && 'animate-pulse',
              hasFailed && 'border-red-500/50',
              allPassed && 'border-green-500/50'
            )}
          >
            <span className="font-mono text-sm">{file.name.replace('.test.ts', '')}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                hasFailed
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : allPassed
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {counts
                ? `${counts.pass}/${file.testCount}`
                : file.testCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TestFileTabs;
