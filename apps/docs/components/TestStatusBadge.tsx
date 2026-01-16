interface TestStatusBadgeProps {
  /** Package name, e.g., "@layers/models" */
  package: string;
  /** Test status */
  status?: 'passing' | 'failing' | 'pending' | 'unknown';
  /** Number of tests */
  testCount?: number;
}

/**
 * Displays test status badge for a package.
 *
 * Status is updated by CI after test runs.
 *
 * @example
 * ```tsx
 * <TestStatusBadge package="@layers/models" status="passing" testCount={42} />
 * ```
 */
export function TestStatusBadge({
  package: pkg,
  status = 'unknown',
  testCount
}: TestStatusBadgeProps) {
  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'passing':
        return 'bg-green-100 text-green-800';
      case 'failing':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'passing':
        return '✓';
      case 'failing':
        return '✗';
      case 'pending':
        return '○';
      default:
        return '?';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusStyle(status)}`}
    >
      <span>{getStatusIcon(status)}</span>
      <span>Tests: {status}</span>
      {testCount !== undefined && <span>({testCount})</span>}
    </span>
  );
}
