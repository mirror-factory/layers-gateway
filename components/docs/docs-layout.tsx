'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedNav } from '@/components/navigation/unified-nav';
import { UnifiedSidebar } from '@/components/navigation/unified-sidebar';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
} from 'lucide-react';


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
            'fixed lg:sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-64 transition-transform lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <UnifiedSidebar />
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
