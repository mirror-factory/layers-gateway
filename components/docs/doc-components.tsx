'use client';

import { cn } from '@/lib/utils';
import {
  Check,
  CheckCircle,
  Copy,
  Info,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Key,
  CreditCard,
  Zap,
  BarChart3,
  Layers,
  Shield,
  Globe,
  Database,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Icon lookup for FeatureCard (to avoid passing functions across server/client boundary)
const iconMap: Record<string, LucideIcon> = {
  key: Key,
  'credit-card': CreditCard,
  zap: Zap,
  'bar-chart': BarChart3,
  layers: Layers,
  shield: Shield,
  globe: Globe,
  database: Database,
};

// Code Block with syntax highlighting placeholder
export function CodeBlock({
  children,
  language,
  filename,
  showLineNumbers = false,
}: {
  children: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-lg border bg-muted/50 overflow-hidden my-4">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
          <span className="text-xs font-mono text-muted-foreground">{filename}</span>
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre className={cn(
          'overflow-x-auto p-4 text-sm font-mono',
          showLineNumbers && 'pl-12'
        )}>
          <code>{children}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

// Callout component
export function Callout({
  type = 'info',
  title,
  children,
}: {
  type?: 'info' | 'warning' | 'error' | 'tip' | 'success';
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    success: {
      bg: 'bg-green-500/10 border-green-500/20',
      icon: CheckCircle,
      iconColor: 'text-green-500',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      icon: Info,
      iconColor: 'text-blue-500',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/20',
      icon: AlertCircle,
      iconColor: 'text-red-500',
    },
    tip: {
      bg: 'bg-primary/10 border-primary/20',
      icon: Lightbulb,
      iconColor: 'text-primary',
    },
  };

  const style = styles[type] || styles.info;
  const Icon = style.icon;

  return (
    <div className={cn('rounded-lg border p-4 my-4', style.bg)}>
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', style.iconColor)} />
        <div className="flex-1">
          {title && <p className="font-medium mb-1">{title}</p>}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Section heading with anchor
export function Heading({
  level = 2,
  id,
  children,
}: {
  level?: 1 | 2 | 3 | 4;
  id?: string;
  children: React.ReactNode;
}) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizes = {
    1: 'text-4xl font-bold font-serif mb-4',
    2: 'text-2xl font-semibold font-serif mt-12 mb-4 pb-2 border-b',
    3: 'text-xl font-semibold mt-8 mb-3',
    4: 'text-lg font-medium mt-6 mb-2',
  };

  return (
    <Tag id={id} className={cn(sizes[level], 'scroll-mt-20')}>
      {id ? (
        <a href={`#${id}`} className="group">
          {children}
          <span className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground">#</span>
        </a>
      ) : (
        children
      )}
    </Tag>
  );
}

// Paragraph
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-7 mb-4">{children}</p>;
}

// List
export function List({
  ordered = false,
  children,
}: {
  ordered?: boolean;
  children: React.ReactNode;
}) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={cn(
      'my-4 ml-6 space-y-2 text-muted-foreground',
      ordered ? 'list-decimal' : 'list-disc'
    )}>
      {children}
    </Tag>
  );
}

// Table
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-muted/50 border-b">{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-muted-foreground">{children}</td>;
}

// Inline code
export function InlineCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code className={cn("px-1.5 py-0.5 rounded bg-muted font-mono text-sm", className)}>
      {children}
    </code>
  );
}

// API endpoint badge
export function Endpoint({
  method,
  path,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}) {
  const colors = {
    GET: 'bg-green-500/10 text-green-600 dark:text-green-400',
    POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    PUT: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400',
    PATCH: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="flex items-center gap-2 my-4 p-3 rounded-lg border bg-muted/30 font-mono text-sm">
      <span className={cn('px-2 py-1 rounded font-semibold text-xs', colors[method])}>
        {method}
      </span>
      <span className="text-foreground">{path}</span>
    </div>
  );
}

// Feature card - accepts icon name string to avoid server/client boundary issues
export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const Icon = iconMap[icon] || Layers;
  return (
    <div className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Step component for tutorials
export function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 my-6">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

// Diagram/flow component
export function Flow({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 p-6 rounded-lg border bg-muted/30 overflow-x-auto">
      <pre className="text-sm font-mono whitespace-pre text-center">{children}</pre>
    </div>
  );
}
