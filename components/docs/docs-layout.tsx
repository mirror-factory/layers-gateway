'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Book,
  Layers,
  CreditCard,
  Key,
  Zap,
  Settings,
  Code2,
  TestTube,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  FileCode,
  Boxes,
  ArrowRight,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  items?: NavItem[];
}

const docsNav: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: Book,
  },
  {
    title: 'How It Works',
    href: '/docs/architecture',
    icon: Layers,
  },
  {
    title: 'Authentication',
    href: '/docs/authentication',
    icon: Key,
  },
  {
    title: 'Billing & Credits',
    href: '/docs/billing',
    icon: CreditCard,
  },
];

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasChildren = item.items && item.items.length > 0;
  const isParentActive = hasChildren && item.items?.some(child => pathname === child.href);
  const [isOpen, setIsOpen] = useState(isActive || isParentActive);
  const Icon = item.icon;

  return (
    <div>
      <Link
        href={item.href}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
          depth === 0 ? 'font-medium' : 'ml-4',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        {Icon && depth === 0 && <Icon className="h-4 w-4" />}
        {depth > 0 && <ChevronRight className="h-3 w-3" />}
        <span className="flex-1">{item.title}</span>
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-90'
            )}
          />
        )}
      </Link>
      {hasChildren && isOpen && (
        <div className="mt-1">
          {item.items?.map((child) => (
            <NavItemComponent key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <UnifiedNav variant="docs" />
        {/* Mobile menu button - overlay on top of nav */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute left-2 top-3 z-[60]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <ScrollArea className="h-full py-4 px-3">
            <div className="space-y-1">
              {docsNav.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-8 pt-4 border-t">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Resources
              </p>
              <Link
                href="https://github.com/hustletogether/layers"
                target="_blank"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              >
                <Code2 className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </ScrollArea>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
            {children}
          </div>
        </main>

        {/* Table of Contents (optional - can be added per page) */}
      </div>
    </div>
  );
}
