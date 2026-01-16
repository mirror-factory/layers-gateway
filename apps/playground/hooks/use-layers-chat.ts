'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ChatMessage,
  ChatUsage,
  LayersMetadata,
  RateLimitInfo,
  chatStream,
  chat,
  StreamChunk,
  MessageContent,
  ImageContent,
  TextContent,
} from '@/lib/layers-client';
import type { AttachedImage } from '@/components/prompt-editor';

export interface ChatSettings {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  stream: boolean;
}

export interface Message extends ChatMessage {
  id: string;
  isStreaming?: boolean;
  usage?: ChatUsage;
  layers?: LayersMetadata;
  error?: string;
  timestamp: number;
  images?: AttachedImage[]; // Original images for display in UI
}

export interface UseLayersChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  rateLimitInfo: RateLimitInfo | null;
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
    totalCredits: number;
  };
  sendMessage: (content: string, images?: AttachedImage[]) => Promise<void>;
  clearMessages: () => void;
  stopGeneration: () => void;
  regenerateLast: () => Promise<void>;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useLayersChat(settings: ChatSettings): UseLayersChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [totalUsage, setTotalUsage] = useState({
    promptTokens: 0,
    completionTokens: 0,
    totalCredits: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Convert attached images to API format
  const buildImageContent = useCallback((images: AttachedImage[]): ImageContent[] => {
    return images.map(img => ({
      type: 'image_url' as const,
      image_url: {
        url: img.dataUrl,
        detail: 'auto' as const,
      },
    }));
  }, []);

  // Build multi-part content (text + images)
  const buildMultipartContent = useCallback(
    (text: string, images?: AttachedImage[]): MessageContent => {
      if (!images || images.length === 0) {
        return text;
      }

      const content: (TextContent | ImageContent)[] = [];

      // Add images first
      content.push(...buildImageContent(images));

      // Add text if present
      if (text.trim()) {
        content.push({
          type: 'text',
          text: text.trim(),
        });
      }

      return content;
    },
    [buildImageContent]
  );

  const buildMessagesPayload = useCallback(
    (currentMessages: Message[], newContent?: string, newImages?: AttachedImage[]): ChatMessage[] => {
      const payload: ChatMessage[] = [];

      // Add system prompt if set
      if (settings.systemPrompt.trim()) {
        payload.push({
          role: 'system',
          content: settings.systemPrompt,
        });
      }

      // Add conversation history
      for (const msg of currentMessages) {
        if (msg.role !== 'system') {
          // If message has images, rebuild multipart content
          if (msg.images && msg.images.length > 0) {
            const textContent = typeof msg.content === 'string'
              ? msg.content
              : msg.content.find((c): c is TextContent => c.type === 'text')?.text || '';
            payload.push({
              role: msg.role,
              content: buildMultipartContent(textContent, msg.images),
            });
          } else {
            payload.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // Add new user message if provided
      if (newContent || (newImages && newImages.length > 0)) {
        payload.push({
          role: 'user',
          content: buildMultipartContent(newContent || '', newImages),
        });
      }

      return payload;
    },
    [settings.systemPrompt, buildMultipartContent]
  );

  const sendMessage = useCallback(
    async (content: string, images?: AttachedImage[]) => {
      if ((!content.trim() && (!images || images.length === 0)) || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Build user message content
      const messageContent = buildMultipartContent(content.trim(), images);

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: messageContent,
        timestamp: Date.now(),
        images: images, // Store original images for UI display
      };

      // Add placeholder assistant message for streaming
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        isStreaming: true,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      try {
        const messagesPayload = buildMessagesPayload(messages, content, images);

        if (settings.stream) {
          // Streaming mode
          const { stream, rateLimitInfo: rateInfo } = await chatStream({
            model: settings.model,
            messages: messagesPayload,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            stream: true,
          });

          setRateLimitInfo(rateInfo);

          let fullContent = '';
          let finalUsage: ChatUsage | undefined;
          let finalLayers: LayersMetadata | undefined;

          for await (const chunk of stream) {
            // Check for abort
            if (abortControllerRef.current?.signal.aborted) {
              break;
            }

            // Extract content from chunk
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;

              // Update message with accumulated content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            }

            // Capture usage and layers data from final chunk
            if (chunk.usage) {
              finalUsage = chunk.usage;
            }
            if (chunk.layers) {
              finalLayers = chunk.layers;
            }
          }

          // Finalize the message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: fullContent,
                    isStreaming: false,
                    usage: finalUsage,
                    layers: finalLayers,
                  }
                : msg
            )
          );

          // Update total usage
          if (finalUsage && finalLayers) {
            setTotalUsage((prev) => ({
              promptTokens: prev.promptTokens + finalUsage!.prompt_tokens,
              completionTokens: prev.completionTokens + finalUsage!.completion_tokens,
              totalCredits: prev.totalCredits + finalLayers!.credits_used,
            }));
          }
        } else {
          // Non-streaming mode
          const response = await chat({
            model: settings.model,
            messages: messagesPayload,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature,
            stream: false,
          });

          const assistantContent = response.choices[0]?.message?.content || '';

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: assistantContent,
                    isStreaming: false,
                    usage: response.usage,
                    layers: response.layers,
                  }
                : msg
            )
          );

          // Update total usage
          if (response.usage && response.layers) {
            setTotalUsage((prev) => ({
              promptTokens: prev.promptTokens + response.usage.prompt_tokens,
              completionTokens: prev.completionTokens + response.usage.completion_tokens,
              totalCredits: prev.totalCredits + response.layers!.credits_used,
            }));
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);

        // Update assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: '',
                  isStreaming: false,
                  error: errorMessage,
                }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, settings, isLoading, buildMessagesPayload, buildMultipartContent]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setRateLimitInfo(null);
    setTotalUsage({
      promptTokens: 0,
      completionTokens: 0,
      totalCredits: 0,
    });
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);

      // Mark any streaming messages as complete
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    }
  }, []);

  const regenerateLast = useCallback(async () => {
    // Find the last user message
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[lastUserIndex];

    // Extract text content from the message
    const textContent = typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : lastUserMessage.content.find((c): c is TextContent => c.type === 'text')?.text || '';

    // Remove all messages after (and including) the last user message
    setMessages((prev) => prev.slice(0, lastUserIndex));

    // Resend the message with images if they were attached
    await sendMessage(textContent, lastUserMessage.images);
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    rateLimitInfo,
    totalUsage,
    sendMessage,
    clearMessages,
    stopGeneration,
    regenerateLast,
  };
}
