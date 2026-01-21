import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/docs-source';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, TestTube } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'Layers Docs',
        children: (
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/tests">
              <Button variant="ghost" size="sm">
                <TestTube className="h-4 w-4 mr-2" />
                Tests
              </Button>
            </Link>
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
