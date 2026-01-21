'use client';

import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn, formatNumber, formatCredits } from '@/lib/utils';
import { User, Bot, AlertCircle, Loader2, ImageIcon, Wrench, Code, Brain, ChevronDown, Globe, ExternalLink } from 'lucide-react';
import type { Message } from '@/hooks/use-layers-chat';
import type { TextContent, ToolCall, GeneratedImage, WebSearchCitation } from '@/lib/layers-client';

interface ResponseDisplayProps {
  messages: Message[];
  isLoading: boolean;
}

// Component to display a single tool call
function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  // Try to parse and format the arguments JSON
  let formattedArgs = toolCall.function.arguments;
  try {
    const parsed = JSON.parse(toolCall.function.arguments);
    formattedArgs = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep original if parsing fails
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">{toolCall.function.name}</span>
        <Badge variant="outline" className="text-[10px]">
          function
        </Badge>
      </div>
      <div className="rounded bg-background p-2 font-mono text-xs overflow-x-auto">
        <pre className="text-muted-foreground whitespace-pre-wrap">{formattedArgs}</pre>
      </div>
    </div>
  );
}

// Component to display extended thinking/reasoning
function ThinkingDisplay({ thinking }: { thinking: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinking) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Brain className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-amber-600 dark:text-amber-400">Extended Thinking</span>
        <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400">
          {isExpanded ? 'Hide' : 'Show'}
        </Badge>
      </button>
      {isExpanded && (
        <div className="mt-3 rounded bg-background p-3 text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
          <pre className="text-muted-foreground whitespace-pre-wrap font-mono">{thinking}</pre>
        </div>
      )}
    </div>
  );
}

// Component to display generated images
function GeneratedImagesDisplay({ images }: { images: GeneratedImage[] }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Generated Image{images.length > 1 ? 's' : ''}</span>
        <Badge variant="secondary" className="text-[10px]">
          {images.length}
        </Badge>
      </div>
      <div className="grid gap-3 grid-cols-1">
        {images.map((img, index) => {
          const imageSrc = img.url || (img.b64_json ? `data:image/png;base64,${img.b64_json}` : '');
          if (!imageSrc) return null;

          return (
            <div key={index} className="space-y-2">
              <div className="rounded-lg overflow-hidden border border-border bg-muted/50">
                <img
                  src={imageSrc}
                  alt={img.revised_prompt || `Generated image ${index + 1}`}
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
              {img.revised_prompt && (
                <p className="text-xs text-muted-foreground italic px-1">
                  Prompt: {img.revised_prompt}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component to display web search citations
function WebSearchCitationsDisplay({ citations }: { citations: WebSearchCitation[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  // Show up to 3 citations by default, rest in expanded view
  const visibleCitations = isExpanded ? citations : citations.slice(0, 3);
  const hiddenCount = citations.length - 3;

  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-blue-500" />
        <span className="font-medium text-blue-600 dark:text-blue-400">Web Sources</span>
        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 dark:text-blue-400">
          {citations.length} source{citations.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="space-y-2">
        {visibleCitations.map((citation, index) => (
          <a
            key={index}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 p-2 rounded bg-background hover:bg-muted/50 transition-colors group"
          >
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-foreground truncate">
                  {citation.title || new URL(citation.url).hostname}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {citation.snippet && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                  {citation.snippet}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
      {hiddenCount > 0 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Show {hiddenCount} more source{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
      {isExpanded && citations.length > 3 && (
        <button
          onClick={() => setIsExpanded(false)}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const hasError = !!message.error;

  // Extract text content from message (handles both string and multipart content)
  const textContent = typeof message.content === 'string'
    ? message.content
    : message.content.find((c): c is TextContent => c.type === 'text')?.text || '';

  // Get images from the message
  const images = message.images || [];

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
        {/* Images (if any) */}
        {images.length > 0 && (
          <div className={cn(
            'flex flex-wrap gap-2 mb-1',
            isUser ? 'justify-end' : 'justify-start'
          )}>
            {images.map((img) => (
              <div
                key={img.id}
                className="rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="max-h-40 max-w-[200px] object-cover"
                />
              </div>
            ))}
          </div>
        )}

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
              {textContent || (images.length > 0 ? <span className="text-muted-foreground italic">(image only)</span> : '')}
              {!textContent && !images.length && message.toolCalls?.length && (
                <span className="text-muted-foreground italic">(tool calls)</span>
              )}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-blink" />
              )}
            </div>
          )}
        </Card>

        {/* Tool calls display */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 w-full max-w-md">
            {message.toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Thinking/reasoning display */}
        {!isUser && message.thinking && (
          <div className="mt-2 w-full max-w-md">
            <ThinkingDisplay thinking={message.thinking} />
          </div>
        )}

        {/* Generated images display */}
        {!isUser && message.generatedImages && message.generatedImages.length > 0 && (
          <div className="mt-2 w-full max-w-lg">
            <GeneratedImagesDisplay images={message.generatedImages} />
          </div>
        )}

        {/* Web search citations display */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 w-full max-w-md">
            <WebSearchCitationsDisplay citations={message.citations} />
          </div>
        )}

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
