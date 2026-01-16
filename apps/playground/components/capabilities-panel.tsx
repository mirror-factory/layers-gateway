'use client';

import { useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Info,
  Plus,
  Trash2,
  Wrench,
  FileJson,
  Brain,
  Globe,
  Database,
  Image as ImageIcon,
} from 'lucide-react';
import type { Capability } from '@layers/models';

// Tool definition for function calling
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: string; // JSON schema string
}

// Advanced settings for capabilities
export interface CapabilitySettings {
  // Tools (function calling)
  toolsEnabled: boolean;
  tools: ToolDefinition[];
  toolChoice: 'auto' | 'none' | 'required' | string;

  // JSON mode
  jsonMode: boolean;
  jsonSchema: string;

  // Thinking/reasoning
  thinkingEnabled: boolean;
  thinkingBudget: number; // max tokens for thinking

  // Web search (for Perplexity)
  webSearchEnabled: boolean;
  searchDomains: string[];

  // Prompt caching
  cacheEnabled: boolean;

  // Image generation settings
  imageGenEnabled: boolean;
  imageSize: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  imageQuality: 'standard' | 'hd';
  imageStyle: 'natural' | 'vivid';
}

interface CapabilitiesPanelProps {
  capabilities: Capability[];
  settings: CapabilitySettings;
  onSettingsChange: (settings: Partial<CapabilitySettings>) => void;
}

const DEFAULT_TOOL: ToolDefinition = {
  id: '',
  name: '',
  description: '',
  parameters: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
};

export function CapabilitiesPanel({
  capabilities,
  settings,
  onSettingsChange,
}: CapabilitiesPanelProps) {
  // Check what capabilities the model supports
  const supportsTools = capabilities.includes('tools');
  const supportsJson = capabilities.includes('json');
  const supportsThinking = capabilities.includes('thinking');
  const supportsWeb = capabilities.includes('web');
  const supportsCache = capabilities.includes('cache');
  const supportsImageGen = capabilities.includes('image-gen');

  // Add a new tool
  const addTool = useCallback(() => {
    const newTool: ToolDefinition = {
      ...DEFAULT_TOOL,
      id: `tool_${Date.now()}`,
      name: `function_${settings.tools.length + 1}`,
    };
    onSettingsChange({
      tools: [...settings.tools, newTool],
    });
  }, [settings.tools, onSettingsChange]);

  // Update a tool
  const updateTool = useCallback(
    (id: string, updates: Partial<ToolDefinition>) => {
      onSettingsChange({
        tools: settings.tools.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      });
    },
    [settings.tools, onSettingsChange]
  );

  // Remove a tool
  const removeTool = useCallback(
    (id: string) => {
      onSettingsChange({
        tools: settings.tools.filter((t) => t.id !== id),
      });
    },
    [settings.tools, onSettingsChange]
  );

  // Add search domain
  const addSearchDomain = useCallback(
    (domain: string) => {
      if (domain && !settings.searchDomains.includes(domain)) {
        onSettingsChange({
          searchDomains: [...settings.searchDomains, domain],
        });
      }
    },
    [settings.searchDomains, onSettingsChange]
  );

  // Remove search domain
  const removeSearchDomain = useCallback(
    (domain: string) => {
      onSettingsChange({
        searchDomains: settings.searchDomains.filter((d) => d !== domain),
      });
    },
    [settings.searchDomains, onSettingsChange]
  );

  return (
    <TooltipProvider>
      <ScrollArea className="h-full">
        <div className="space-y-4 pr-4">
          {/* Capability badges */}
          <div className="flex flex-wrap gap-1">
            {capabilities.map((cap) => (
              <Badge
                key={cap}
                variant="outline"
                className="text-[10px] capitalize"
              >
                {cap}
              </Badge>
            ))}
          </div>

          <Accordion type="multiple" className="w-full">
            {/* Tools / Function Calling */}
            {supportsTools && (
              <AccordionItem value="tools">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Function Calling
                    {settings.toolsEnabled && settings.tools.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {settings.tools.length} tool{settings.tools.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Enable Tools</Label>
                    <Switch
                      checked={settings.toolsEnabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ toolsEnabled: checked })
                      }
                    />
                  </div>

                  {settings.toolsEnabled && (
                    <>
                      <Separator />

                      {/* Tool choice */}
                      <div className="space-y-2">
                        <Label className="text-xs">Tool Choice</Label>
                        <div className="flex gap-1 flex-wrap">
                          {['auto', 'none', 'required'].map((choice) => (
                            <Button
                              key={choice}
                              size="sm"
                              variant={settings.toolChoice === choice ? 'default' : 'outline'}
                              onClick={() => onSettingsChange({ toolChoice: choice as any })}
                              className="text-xs h-7"
                            >
                              {choice}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Tool definitions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Tools</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addTool}
                            className="h-7 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Tool
                          </Button>
                        </div>

                        {settings.tools.map((tool) => (
                          <Card key={tool.id} className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Input
                                placeholder="function_name"
                                value={tool.name}
                                onChange={(e) =>
                                  updateTool(tool.id, { name: e.target.value })
                                }
                                className="h-7 text-xs font-mono"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeTool(tool.id)}
                                className="h-7 w-7 ml-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Description of what this tool does"
                              value={tool.description}
                              onChange={(e) =>
                                updateTool(tool.id, { description: e.target.value })
                              }
                              className="h-7 text-xs"
                            />
                            <Textarea
                              placeholder="JSON Schema for parameters"
                              value={tool.parameters}
                              onChange={(e) =>
                                updateTool(tool.id, { parameters: e.target.value })
                              }
                              className="text-xs font-mono min-h-[80px]"
                            />
                          </Card>
                        ))}

                        {settings.tools.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            No tools defined. Click "Add Tool" to create a function.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* JSON Mode */}
            {supportsJson && (
              <AccordionItem value="json">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Structured Output (JSON)
                    {settings.jsonMode && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">JSON Mode</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Forces the model to output valid JSON. Optionally provide a schema.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={settings.jsonMode}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ jsonMode: checked })
                      }
                    />
                  </div>

                  {settings.jsonMode && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">JSON Schema (optional)</Label>
                        <Textarea
                          placeholder='{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  }\n}'
                          value={settings.jsonSchema}
                          onChange={(e) =>
                            onSettingsChange({ jsonSchema: e.target.value })
                          }
                          className="text-xs font-mono min-h-[120px]"
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Thinking / Reasoning */}
            {supportsThinking && (
              <AccordionItem value="thinking">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Extended Thinking
                    {settings.thinkingEnabled && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {settings.thinkingBudget.toLocaleString()} tokens
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Enable Thinking</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Allows the model to "think" through complex problems before responding.
                            The thinking process is shown separately from the final answer.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={settings.thinkingEnabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ thinkingEnabled: checked })
                      }
                    />
                  </div>

                  {settings.thinkingEnabled && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Thinking Budget (tokens)</Label>
                        <Input
                          type="number"
                          min={1024}
                          max={32768}
                          step={1024}
                          value={settings.thinkingBudget}
                          onChange={(e) =>
                            onSettingsChange({ thinkingBudget: parseInt(e.target.value) || 8192 })
                          }
                          className="h-8 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Higher budget allows for deeper reasoning but costs more.
                        </p>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Web Search */}
            {supportsWeb && (
              <AccordionItem value="web">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Web Search
                    {settings.webSearchEnabled && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Enable Web Search</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Allows the model to search the web for current information.
                            Available with Perplexity models.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={settings.webSearchEnabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ webSearchEnabled: checked })
                      }
                    />
                  </div>

                  {settings.webSearchEnabled && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs">Restrict to Domains (optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="example.com"
                            className="h-7 text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addSearchDomain((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              const input = (e.target as HTMLElement).previousSibling as HTMLInputElement;
                              addSearchDomain(input.value);
                              input.value = '';
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {settings.searchDomains.map((domain) => (
                            <Badge
                              key={domain}
                              variant="secondary"
                              className="text-[10px] cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeSearchDomain(domain)}
                            >
                              {domain} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Prompt Caching */}
            {supportsCache && (
              <AccordionItem value="cache">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Prompt Caching
                    {settings.cacheEnabled && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Enable Caching</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            Caches the prompt prefix to reduce latency and cost on
                            follow-up requests with the same context.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={settings.cacheEnabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ cacheEnabled: checked })
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Image Generation Settings */}
            {supportsImageGen && (
              <AccordionItem value="image-gen">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image Generation
                    {settings.imageGenEnabled && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        {settings.imageSize}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Enable Image Output</Label>
                    <Switch
                      checked={settings.imageGenEnabled}
                      onCheckedChange={(checked) =>
                        onSettingsChange({ imageGenEnabled: checked })
                      }
                    />
                  </div>

                  {settings.imageGenEnabled && (
                    <>
                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-xs">Image Size</Label>
                        <div className="flex gap-1 flex-wrap">
                          {(['1024x1024', '1792x1024', '1024x1792'] as const).map((size) => (
                            <Button
                              key={size}
                              size="sm"
                              variant={settings.imageSize === size ? 'default' : 'outline'}
                              onClick={() => onSettingsChange({ imageSize: size })}
                              className="text-xs h-7"
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Quality</Label>
                        <div className="flex gap-1">
                          {(['standard', 'hd'] as const).map((quality) => (
                            <Button
                              key={quality}
                              size="sm"
                              variant={settings.imageQuality === quality ? 'default' : 'outline'}
                              onClick={() => onSettingsChange({ imageQuality: quality })}
                              className="text-xs h-7 capitalize"
                            >
                              {quality}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Style</Label>
                        <div className="flex gap-1">
                          {(['natural', 'vivid'] as const).map((style) => (
                            <Button
                              key={style}
                              size="sm"
                              variant={settings.imageStyle === style ? 'default' : 'outline'}
                              onClick={() => onSettingsChange({ imageStyle: style })}
                              className="text-xs h-7 capitalize"
                            >
                              {style}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          {/* No capabilities message */}
          {!supportsTools && !supportsJson && !supportsThinking && !supportsWeb && !supportsCache && !supportsImageGen && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No advanced capabilities available for this model.</p>
              <p className="text-xs mt-1">
                Try Claude, GPT-4o, or Gemini for function calling, JSON mode, and more.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}

// Default capability settings
export const DEFAULT_CAPABILITY_SETTINGS: CapabilitySettings = {
  toolsEnabled: false,
  tools: [],
  toolChoice: 'auto',
  jsonMode: false,
  jsonSchema: '',
  thinkingEnabled: false,
  thinkingBudget: 8192,
  webSearchEnabled: false,
  searchDomains: [],
  cacheEnabled: false,
  imageGenEnabled: false,
  imageSize: '1024x1024',
  imageQuality: 'standard',
  imageStyle: 'natural',
};
