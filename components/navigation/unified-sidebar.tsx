'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  DollarSign,
  Settings,
  BookOpen,
  ChevronRight,
  Book,
  Layers,
  Key,
  CreditCard,
  Shield,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[];
}

interface CreditBalance {
  credits: number;
  tier: string;
}

interface UnifiedSidebarProps {
  className?: string;
}

export function UnifiedSidebar({ className }: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [docsExpanded, setDocsExpanded] = useState(pathname.startsWith('/docs'));
  const [balance, setBalance] = useState<CreditBalance | null>(null);

  // Fetch balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };

    fetchBalance();
  }, []);

  const mainNav: NavItemWithChildren[] = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Pricing & Credits',
      href: '/dashboard/pricing',
      icon: DollarSign,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
    {
      name: 'Documentation',
      href: '/docs',
      icon: BookOpen,
      children: [
        { name: 'Getting Started', href: '/docs/getting-started', icon: Book },
        { name: 'Architecture', href: '/docs/architecture', icon: Layers },
        { name: 'Authentication', href: '/docs/authentication', icon: Key },
        { name: 'Billing & Credits', href: '/docs/billing', icon: CreditCard },
        { name: 'Security', href: '/docs/security', icon: Shield },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleDocClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDocsExpanded(!docsExpanded);
  };

  return (
    <aside
      className={cn(
        'w-64 shrink-0 border-r bg-card flex flex-col min-h-[calc(100vh-3.5rem)]',
        className
      )}
    >
      <ScrollArea className="flex-1">
        {/* Credits Section */}
        {balance && (
          <div className="p-4 border-b border-border/50">
            <div className="rounded-lg bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Credits</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    balance.tier === 'pro'
                      ? 'bg-primary/20 text-primary'
                      : balance.tier === 'team'
                      ? 'bg-primary/30 text-primary'
                      : balance.tier === 'starter'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {(balance.tier || 'FREE').toUpperCase()}
                </span>
              </div>
              <div className="text-2xl font-semibold font-serif">
                {balance.credits?.toFixed(0) || '0'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isDocsItem = item.href === '/docs';

            return (
              <div key={item.name}>
                {isDocsItem ? (
                  <button
                    onClick={handleDocClick}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 transition-transform',
                        docsExpanded && 'rotate-90'
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )}

                {/* Child items (Documentation sub-items) */}
                {hasChildren && docsExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                            childActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
