'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, StopCircle, Trash2, RefreshCw, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AttachedImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

interface PromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onSend: (message: string, images?: AttachedImage[]) => void;
  onStop: () => void;
  onClear: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  hasMessages: boolean;
  disabled?: boolean;
  supportsVision?: boolean;
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
  supportsVision = true,
}: PromptEditorProps) {
  const [message, setMessage] = useState('');
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if ((message.trim() || attachedImages.length > 0) && !isLoading && !disabled) {
      onSend(message.trim(), attachedImages.length > 0 ? attachedImages : undefined);
      setMessage('');
      setAttachedImages([]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Process files into base64 data URLs
  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    for (const file of imageFiles) {
      // Skip if over 20MB
      if (file.size > 20 * 1024 * 1024) {
        console.warn(`Skipping ${file.name}: exceeds 20MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newImage: AttachedImage = {
          id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          dataUrl,
          name: file.name,
          size: file.size,
        };
        setAttachedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste (for clipboard images)
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
    if (imageItems.length === 0) return;

    e.preventDefault();

    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        processFiles([file]);
      }
    }
  };

  // Remove an attached image
  const removeImage = (id: string) => {
    setAttachedImages(prev => prev.filter(img => img.id !== id));
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

      {/* Image Previews */}
      {attachedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedImages.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg border border-border overflow-hidden"
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-20 w-20 object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                  onClick={() => removeImage(img.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[10px] text-white truncate">
                {formatFileSize(img.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Textarea
          ref={textareaRef}
          placeholder={supportsVision ? "Type your message or paste an image... (Shift+Enter for new line)" : "Type your message... (Shift+Enter for new line)"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={supportsVision ? handlePaste : undefined}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[60px] max-h-[200px] resize-none pr-28 text-sm',
            supportsVision && 'pl-12',
            isLoading && 'opacity-70'
          )}
        />

        {/* Image upload button */}
        {supportsVision && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="absolute left-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Attach image"
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
        )}

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
              disabled={(!message.trim() && attachedImages.length === 0) || disabled}
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
