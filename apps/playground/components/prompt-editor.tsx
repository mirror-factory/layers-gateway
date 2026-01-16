'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, StopCircle, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
  onClear: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  hasMessages: boolean;
  disabled?: boolean;
}

export function PromptEditor({
  systemPrompt,
  onSystemPromptChange,
  onSend,
  onStop,
  onClear,
  onRegenerate,
  isLoading,
  hasMessages,
  disabled,
}: PromptEditorProps) {
  const [message, setMessage] = useState('');
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {/* System Prompt (Collapsible) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSystemPromptExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span>System Prompt</span>
          {systemPrompt.trim() && !isSystemPromptExpanded && (
            <span className="text-xs text-muted-foreground">
              ({systemPrompt.length} chars)
            </span>
          )}
        </button>

        {isSystemPromptExpanded && (
          <Textarea
            id="system-prompt"
            placeholder="You are a helpful assistant..."
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            disabled={disabled}
            className="min-h-[80px] resize-y text-sm"
          />
        )}
      </div>

      {/* Message Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder="Type your message... (Shift+Enter for new line)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[60px] max-h-[200px] resize-none pr-24 text-sm',
            isLoading && 'opacity-70'
          )}
        />

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {isLoading ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              className="h-8 px-3"
            >
              <StopCircle className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className="h-8 px-3"
            >
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {hasMessages && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isLoading || disabled}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            disabled={isLoading}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
