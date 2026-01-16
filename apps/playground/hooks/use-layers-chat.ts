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
} from '@/lib/layers-client';

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
  sendMessage: (content: string) => Promise<void>;
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

  const buildMessagesPayload = useCallback(
    (currentMessages: Message[], newContent?: string): ChatMessage[] => {
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
          payload.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      // Add new user message if provided
      if (newContent) {
        payload.push({
          role: 'user',
          content: newContent,
        });
      }

      return payload;
    },
    [settings.systemPrompt]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
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
        const messagesPayload = buildMessagesPayload(messages, content);

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
    [messages, settings, isLoading, buildMessagesPayload]
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

    // Remove all messages after (and including) the last user message
    setMessages((prev) => prev.slice(0, lastUserIndex));

    // Resend the message
    await sendMessage(lastUserMessage.content);
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
