'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
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
    href: '/docs',
    icon: Book,
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Quick Start', href: '/docs/getting-started' },
      { title: 'AI SDK Integration', href: '/docs/ai-sdk' },
    ],
  },
  {
    title: 'Architecture',
    href: '/docs/architecture',
    icon: Layers,
    items: [
      { title: 'Gateway Overview', href: '/docs/architecture' },
      { title: 'How It Works', href: '/docs/architecture/how-it-works' },
      { title: 'Request Flow', href: '/docs/architecture/request-flow' },
    ],
  },
  {
    title: 'Billing & Credits',
    href: '/docs/billing',
    icon: CreditCard,
    items: [
      { title: 'Credit System', href: '/docs/billing' },
      { title: 'Pricing', href: '/docs/billing/pricing' },
      { title: 'Subscriptions', href: '/docs/billing/subscriptions' },
    ],
  },
  {
    title: 'Authentication',
    href: '/docs/authentication',
    icon: Key,
  },
  {
    title: 'Models',
    href: '/docs/models',
    icon: Boxes,
    items: [
      { title: 'Overview', href: '/docs/models' },
      { title: 'Anthropic', href: '/docs/models/anthropic' },
      { title: 'OpenAI', href: '/docs/models/openai' },
      { title: 'Google', href: '/docs/models/google' },
      { title: 'Perplexity', href: '/docs/models/perplexity' },
    ],
  },
  {
    title: 'API Reference',
    href: '/docs/api',
    icon: FileCode,
    items: [
      { title: 'Overview', href: '/docs/api' },
      { title: 'Chat Completions', href: '/docs/api/chat' },
      { title: 'Streaming', href: '/docs/api/streaming' },
      { title: 'Tools & Functions', href: '/docs/api/tools' },
    ],
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 lg:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl">Layers</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            <Link href="/docs">
              <Button variant="ghost" size="sm">Docs</Button>
            </Link>
            <Link href="/docs/api">
              <Button variant="ghost" size="sm">API</Button>
            </Link>
            <Link href="/docs/models">
              <Button variant="ghost" size="sm">Models</Button>
            </Link>
            <Link href="/docs/billing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="hidden sm:flex">
                Get API Key
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
