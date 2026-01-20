'use client';

import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatNumber } from '@/lib/utils';
import {
  MODELS,
  getProviders,
  getModelsByProvider,
  PROVIDER_NAMES,
  CAPABILITY_INFO,
  type ModelDefinition,
  type Provider,
  type Capability,
} from '@/lib/models';
import {
  Eye,
  Wrench,
  FileJson,
  Zap,
  Brain,
  Monitor,
  FileText,
  ImageIcon,
} from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

// Icons for capabilities (only for those we want to display)
// Using Partial since we don't show icons for all capabilities
const CAPABILITY_ICONS: Partial<Record<Capability, React.ReactNode>> = {
  text: null, // Don't show icon for text
  vision: <Eye className="h-3 w-3" />,
  tools: <Wrench className="h-3 w-3" />,
  json: <FileJson className="h-3 w-3" />,
  stream: <Zap className="h-3 w-3" />,
  thinking: <Brain className="h-3 w-3" />,
  pdf: <FileText className="h-3 w-3" />,
  'image-gen': <ImageIcon className="h-3 w-3" />,
  cache: <Monitor className="h-3 w-3" />,
  web: <Wrench className="h-3 w-3" />,
  'audio-in': null,
  'video-in': null,
  embed: null,
};

function ModelOption({ model }: { model: ModelDefinition }) {
  const visibleCapabilities = model.capabilities.filter(
    (c) => c !== 'text' && c !== 'stream'
  );

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">{model.name}</span>
        <span className="text-xs text-muted-foreground">
          ${model.pricing.input}/${model.pricing.output}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatNumber(model.contextWindow)} ctx</span>
        {visibleCapabilities.length > 0 && (
          <div className="flex gap-1">
            {visibleCapabilities.slice(0, 3).map((cap) => (
              <TooltipProvider key={cap} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-muted-foreground hover:text-foreground">
                      {CAPABILITY_ICONS[cap]}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{CAPABILITY_INFO[cap].label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {visibleCapabilities.length > 3 && (
              <span>+{visibleCapabilities.length - 3}</span>
            )}
          </div>
        )}
        {model.reasoningOnly && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            Reasoning
          </Badge>
        )}
      </div>
    </div>
  );
}

export function ModelSelector({
  value,
  onValueChange,
  disabled,
}: ModelSelectorProps) {
  const providers = useMemo(() => getProviders(), []);

  const selectedModel = useMemo(
    () => MODELS.find((m) => m.id === value),
    [value]
  );

  return (
    <TooltipProvider>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a model">
            {selectedModel ? (
              <div className="flex items-center gap-2">
                <span>{selectedModel.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({PROVIDER_NAMES[selectedModel.provider]})
                </span>
              </div>
            ) : (
              'Select a model'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {providers.map((provider) => {
            const models = getModelsByProvider(provider);
            return (
              <SelectGroup key={provider}>
                <SelectLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {PROVIDER_NAMES[provider]}
                </SelectLabel>
                {models.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="cursor-pointer"
                  >
                    <ModelOption model={model} />
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </TooltipProvider>
  );
}

// Compact model info display for selected model
export function ModelInfo({ modelId }: { modelId: string }) {
  const model = useMemo(() => MODELS.find((m) => m.id === modelId), [modelId]);

  if (!model) return null;

  const visibleCapabilities = model.capabilities.filter(
    (c) => c !== 'text' && c !== 'stream'
  );

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{formatNumber(model.contextWindow)} tokens context</span>
        <span>|</span>
        <span>
          ${model.pricing.input}/M in · ${model.pricing.output}/M out
        </span>
        {visibleCapabilities.length > 0 && (
          <>
            <span>|</span>
            <div className="flex gap-1">
              {visibleCapabilities.map((cap) => (
                <Tooltip key={cap} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className="hover:text-foreground">
                      {CAPABILITY_ICONS[cap]}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{CAPABILITY_INFO[cap].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {CAPABILITY_INFO[cap].description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </>
        )}
        {model.reasoningOnly && (
          <Badge variant="outline" className="text-[10px]">
            Reasoning-only
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
