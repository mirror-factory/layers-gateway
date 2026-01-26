'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { createClient } from '@/lib/supabase/browser';
import { LogOut, Layers, Github } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedNavProps {
  variant?: 'default' | 'docs' | 'dashboard';
}

export function UnifiedNav({ variant = 'default' }: UnifiedNavProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navLinks = user ? [
    { href: '/docs', label: 'Docs' },
    { href: '/dashboard/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'Dashboard' },
  ] : [
    { href: '/docs', label: 'Docs' },
    { href: '/pricing', label: 'Pricing' },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:h-16 md:px-6">
      {/* Logo and tagline */}
      <div className="flex items-center gap-2 md:gap-3">
        <Link href="/" className="flex items-center gap-2 md:gap-3">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-bold md:text-2xl">Layers</span>
        </Link>
        <p className="hidden text-xs text-muted-foreground md:block">
          Unified AI Gateway
        </p>
      </div>

      {/* Center navigation links (desktop) */}
      <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                pathname.startsWith(link.href) && "bg-muted"
              )}
            >
              {link.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3">
        {!isLoading && (
          <>
            {user ? (
              <>
                {/* Logged in state */}
                <span className="hidden rounded-full bg-primary/10 px-2 py-1 font-mono text-xs text-primary sm:inline-block md:px-3">
                  {user.email}
                </span>
                <Link href="https://github.com/CrazySwami/layers-gateway" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="GitHub"
                  >
                    <Github className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                {/* Logged out state */}
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </>
        )}
        <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />
        <ThemeToggle />
      </div>
    </header>
  );
}
