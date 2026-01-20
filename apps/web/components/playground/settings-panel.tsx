'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { ChatSettings } from '@/hooks/use-layers-chat';
import { MODELS } from '@/lib/models';
import { useMemo } from 'react';

interface SettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: Partial<ChatSettings>) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === settings.model),
    [settings.model]
  );

  // Check if streaming is supported
  const supportsStreaming = selectedModel?.capabilities.includes('stream') ?? true;
  const isReasoningModel = selectedModel?.reasoningOnly ?? false;

  // Auto-disable streaming for reasoning models
  const effectiveStream = supportsStreaming && !isReasoningModel ? settings.stream : false;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Max Tokens */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="max-tokens" className="text-sm font-medium">
                Max Tokens
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Maximum number of tokens to generate in the response. Higher
                    values allow for longer responses but cost more credits.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm text-muted-foreground">
              {settings.maxTokens.toLocaleString()}
            </span>
          </div>
          <Slider
            id="max-tokens"
            min={256}
            max={16384}
            step={256}
            value={[settings.maxTokens]}
            onValueChange={([value]) =>
              onSettingsChange({ maxTokens: value })
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>256</span>
            <span>16,384</span>
          </div>
        </div>

        <Separator />

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="temperature" className="text-sm font-medium">
                Temperature
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Controls randomness in the output. Lower values (0.0-0.3)
                    produce more focused, deterministic responses. Higher values
                    (0.7-1.0) produce more creative, varied responses.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-sm text-muted-foreground">
              {settings.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={1}
            step={0.05}
            value={[settings.temperature]}
            onValueChange={([value]) =>
              onSettingsChange({ temperature: value })
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precise (0.0)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>

        <Separator />

        {/* Streaming Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="streaming" className="text-sm font-medium">
              Streaming
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Enable token-by-token streaming for faster perceived response
                  times. Disable for full response at once.
                  {isReasoningModel && (
                    <span className="block mt-1 text-yellow-500">
                      Streaming is not available for reasoning models.
                    </span>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Switch
            id="streaming"
            checked={effectiveStream}
            onCheckedChange={(checked) =>
              onSettingsChange({ stream: checked })
            }
            disabled={!supportsStreaming || isReasoningModel}
          />
        </div>

        {isReasoningModel && (
          <p className="text-xs text-yellow-600 dark:text-yellow-500">
            Reasoning models like {selectedModel?.name} do not support streaming.
          </p>
        )}

        <Separator />

        {/* Model Pricing Info */}
        {selectedModel && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Pricing</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted rounded-md p-2">
                <div className="text-muted-foreground">Input</div>
                <div className="font-medium">
                  ${selectedModel.pricing.input}/M tokens
                </div>
              </div>
              <div className="bg-muted rounded-md p-2">
                <div className="text-muted-foreground">Output</div>
                <div className="font-medium">
                  ${selectedModel.pricing.output}/M tokens
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Layers adds a margin for infrastructure costs. Final credit cost
              may vary.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
