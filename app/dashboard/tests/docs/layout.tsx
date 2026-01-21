'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Zap,
  BookOpen,
  Boxes,
  Plug,
  Server,
  Image,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'unit-tests',
    name: 'Unit Tests',
    description: 'Model helpers & registry',
    icon: Boxes,
    testCount: 67,
  },
  {
    id: 'gateway-tests',
    name: 'Gateway Tests',
    description: 'AI Gateway integration',
    icon: Plug,
    testCount: 18,
  },
  {
    id: 'api-tests',
    name: 'API Tests',
    description: 'Layers API endpoints',
    icon: Server,
    testCount: 48,
  },
  {
    id: 'image-tests',
    name: 'Image Tests',
    description: 'Image generation',
    icon: Image,
    testCount: 8,
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Test Documentation</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/tests/runner">
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Run Tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background min-h-[calc(100vh-65px)] p-4 hidden md:block">
          <nav className="space-y-2">
            <Link href="/dashboard/tests/docs">
              <div
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/dashboard/tests/docs'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                Overview
              </div>
            </Link>

            <div className="pt-4 pb-2">
              <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </div>
            </div>

            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = pathname === `/dashboard/tests/docs/${category.id}`;

              return (
                <Link
                  key={category.id}
                  href={`/dashboard/tests/docs/${category.id}`}
                >
                  <div
                    className={`px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      <div
                        className={`text-xs ${
                          isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}
                      >
                        {category.testCount} tests
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile navigation */}
        <div className="md:hidden border-b bg-background p-4 w-full">
          <div className="flex gap-2 overflow-x-auto">
            <Link href="/dashboard/tests/docs">
              <Button
                variant={pathname === '/dashboard/tests/docs' ? 'default' : 'outline'}
                size="sm"
              >
                Overview
              </Button>
            </Link>
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/dashboard/tests/docs/${category.id}`}
              >
                <Button
                  variant={
                    pathname === `/dashboard/tests/docs/${category.id}`
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                >
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
