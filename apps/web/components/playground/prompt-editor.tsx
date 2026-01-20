'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send,
  StopCircle,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  FileText,
  Music,
  Video,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AttachedFileType = 'image' | 'pdf' | 'audio' | 'video';

export interface AttachedFile {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
  type: AttachedFileType;
  mimeType: string;
}

// Legacy interface for backwards compatibility
export interface AttachedImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

interface PromptEditorProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onSend: (message: string, images?: AttachedImage[], files?: AttachedFile[]) => void;
  onStop: () => void;
  onClear: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  hasMessages: boolean;
  disabled?: boolean;
  supportsVision?: boolean;
  supportsPdf?: boolean;
  supportsAudio?: boolean;
  supportsVideo?: boolean;
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
  supportsPdf = false,
  supportsAudio = false,
  supportsVideo = false,
}: PromptEditorProps) {
  const [message, setMessage] = useState('');
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if any file type is supported
  const supportsFiles = supportsVision || supportsPdf || supportsAudio || supportsVideo;

  // Build accept string for file input
  const getAcceptTypes = (): string => {
    const types: string[] = [];
    if (supportsVision) types.push('image/*');
    if (supportsPdf) types.push('application/pdf');
    if (supportsAudio) types.push('audio/*');
    if (supportsVideo) types.push('video/*');
    return types.join(',');
  };

  // Get file type category from mime type
  const getFileType = (mimeType: string): AttachedFileType => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'image'; // default
  };

  // Get file icon for display
  const getFileIcon = (type: AttachedFileType) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'audio': return Music;
      case 'video': return Video;
      default: return ImagePlus;
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    const hasContent = message.trim() || attachedImages.length > 0 || attachedFiles.length > 0;
    if (hasContent && !isLoading && !disabled) {
      onSend(
        message.trim(),
        attachedImages.length > 0 ? attachedImages : undefined,
        attachedFiles.length > 0 ? attachedFiles : undefined
      );
      setMessage('');
      setAttachedImages([]);
      setAttachedFiles([]);
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

  // Check if file type is supported
  const isFileTypeSupported = (file: File): boolean => {
    if (file.type.startsWith('image/')) return supportsVision;
    if (file.type === 'application/pdf') return supportsPdf;
    if (file.type.startsWith('audio/')) return supportsAudio;
    if (file.type.startsWith('video/')) return supportsVideo;
    return false;
  };

  // Get max file size for type
  const getMaxFileSize = (type: AttachedFileType): number => {
    switch (type) {
      case 'video': return 100 * 1024 * 1024; // 100MB for video
      case 'audio': return 50 * 1024 * 1024;  // 50MB for audio
      case 'pdf': return 50 * 1024 * 1024;    // 50MB for PDF
      default: return 20 * 1024 * 1024;       // 20MB for images
    }
  };

  // Process files into base64 data URLs
  const processFiles = async (files: File[]) => {
    for (const file of files) {
      // Check if file type is supported
      if (!isFileTypeSupported(file)) {
        console.warn(`Skipping ${file.name}: unsupported file type ${file.type}`);
        continue;
      }

      const fileType = getFileType(file.type);
      const maxSize = getMaxFileSize(fileType);

      // Skip if over size limit
      if (file.size > maxSize) {
        console.warn(`Skipping ${file.name}: exceeds ${maxSize / (1024 * 1024)}MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        // For images, also add to attachedImages for backwards compatibility
        if (fileType === 'image') {
          const newImage: AttachedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            dataUrl,
            name: file.name,
            size: file.size,
          };
          setAttachedImages(prev => [...prev, newImage]);
        } else {
          // For other file types, add to attachedFiles
          const newFile: AttachedFile = {
            id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            dataUrl,
            name: file.name,
            size: file.size,
            type: fileType,
            mimeType: file.type,
          };
          setAttachedFiles(prev => [...prev, newFile]);
        }
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

  // Remove an attached file
  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
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

      {/* Other File Previews (PDF, Audio, Video) */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="relative group flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2"
              >
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium truncate max-w-[150px]">{file.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {file.type.toUpperCase()} · {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Input */}
      <div className="relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptTypes()}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Textarea
          ref={textareaRef}
          placeholder={supportsFiles
            ? "Type your message or attach files... (Shift+Enter for new line)"
            : "Type your message... (Shift+Enter for new line)"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={supportsVision ? handlePaste : undefined}
          disabled={disabled || isLoading}
          className={cn(
            'min-h-[60px] max-h-[200px] resize-none pr-28 text-sm',
            supportsFiles && 'pl-12',
            isLoading && 'opacity-70'
          )}
        />

        {/* File upload button */}
        {supportsFiles && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="absolute left-2 bottom-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            title={`Attach files (${[
              supportsVision && 'images',
              supportsPdf && 'PDF',
              supportsAudio && 'audio',
              supportsVideo && 'video',
            ].filter(Boolean).join(', ')})`}
          >
            <Paperclip className="h-4 w-4" />
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
              disabled={(!message.trim() && attachedImages.length === 0 && attachedFiles.length === 0) || disabled}
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
