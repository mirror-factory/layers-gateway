'use client';

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatNumber, formatCredits } from '@/lib/utils';
import { User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import type { Message } from '@/hooks/use-layers-chat';

interface ResponseDisplayProps {
  messages: Message[];
  isLoading: boolean;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const hasError = !!message.error;

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <Card
          className={cn(
            'px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : hasError
              ? 'bg-destructive/10 border-destructive/50'
              : 'bg-muted'
          )}
        >
          {hasError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message.error}</span>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap">
              {message.content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-blink" />
              )}
            </div>
          )}
        </Card>

        {/* Metadata for assistant messages */}
        {!isUser && (message.usage || message.layers) && !hasError && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground px-1">
            {message.usage && (
              <>
                <span>
                  {formatNumber(message.usage.prompt_tokens)} in ·{' '}
                  {formatNumber(message.usage.completion_tokens)} out
                </span>
              </>
            )}
            {message.layers && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {formatCredits(message.layers.credits_used)} credits
                </Badge>
                <span>{message.layers.latency_ms}ms</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResponseDisplay({ messages, isLoading }: ResponseDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          Start a conversation
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
          Select a model and send a message to begin. Your conversation will use
          the Layers API with full authentication, rate limiting, and credit
          tracking.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}

// Usage summary component
interface UsageSummaryProps {
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalCredits: number;
  };
  rateLimitInfo: {
    remaining: number | null;
    limit: number | null;
    reset: number | null;
  } | null;
}

export function UsageSummary({ totalUsage, rateLimitInfo }: UsageSummaryProps) {
  const totalTokens = totalUsage.promptTokens + totalUsage.completionTokens;

  if (totalTokens === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-t pt-2">
      <div className="flex items-center gap-1">
        <span className="font-medium">Session:</span>
        <span>{formatNumber(totalTokens)} tokens</span>
        <span>·</span>
        <Badge variant="outline" className="text-[10px]">
          {formatCredits(totalUsage.totalCredits)} credits
        </Badge>
      </div>

      {rateLimitInfo && rateLimitInfo.remaining !== null && (
        <>
          <Separator orientation="vertical" className="h-3" />
          <div className="flex items-center gap-1">
            <span className="font-medium">Rate Limit:</span>
            <span>
              {rateLimitInfo.remaining}/{rateLimitInfo.limit} remaining
            </span>
          </div>
        </>
      )}
    </div>
  );
}
