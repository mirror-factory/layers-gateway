'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModelSelector, ModelInfo } from '@/components/model-selector';
import { PromptEditor, type AttachedImage } from '@/components/prompt-editor';
import { ResponseDisplay, UsageSummary } from '@/components/response-display';
import { SettingsPanel } from '@/components/settings-panel';
import { CapabilitiesPanel, DEFAULT_CAPABILITY_SETTINGS, type CapabilitySettings } from '@/components/capabilities-panel';
import { CodeExport } from '@/components/code-export';
import { EmbeddingsPanel } from '@/components/embeddings-panel';
import { useLayersChat, type ChatSettings } from '@/hooks/use-layers-chat';
import { ExternalLink, Github, Settings, Code, MessageSquare, Zap, Sparkles, Hash } from 'lucide-react';
import { getModelSafe, type Capability } from '@/lib/models-src';

const DEFAULT_SETTINGS: ChatSettings = {
  model: 'anthropic/claude-sonnet-4.5',
  maxTokens: 4096,
  temperature: 0.7,
  systemPrompt: '',
  stream: true,
};

export default function PlaygroundPage() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [capabilitySettings, setCapabilitySettings] = useState<CapabilitySettings>(DEFAULT_CAPABILITY_SETTINGS);
  const [rightPanelTab, setRightPanelTab] = useState<'settings' | 'capabilities' | 'code' | 'embeddings'>('settings');

  const {
    messages,
    isLoading,
    error,
    rateLimitInfo,
    totalUsage,
    sendMessage,
    clearMessages,
    stopGeneration,
    regenerateLast,
  } = useLayersChat(settings, capabilitySettings);

  // Get current model and its capabilities
  const currentModel = useMemo(() => getModelSafe(settings.model), [settings.model]);
  const modelCapabilities = useMemo<Capability[]>(
    () => (currentModel?.capabilities || []) as Capability[],
    [currentModel]
  );

  // Check if current model supports various input types
  const supportsVision = useMemo(() => {
    return modelCapabilities.includes('vision');
  }, [modelCapabilities]);

  const supportsPdf = useMemo(() => {
    return modelCapabilities.includes('pdf');
  }, [modelCapabilities]);

  const supportsAudio = useMemo(() => {
    return modelCapabilities.includes('audio-in');
  }, [modelCapabilities]);

  const supportsVideo = useMemo(() => {
    return modelCapabilities.includes('video-in');
  }, [modelCapabilities]);

  // Check if model has any advanced capabilities
  const hasAdvancedCapabilities = useMemo(() => {
    return ['tools', 'json', 'thinking', 'web', 'cache', 'image-gen'].some(cap =>
      modelCapabilities.includes(cap as Capability)
    );
  }, [modelCapabilities]);

  const handleSettingsChange = useCallback((partial: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleCapabilitySettingsChange = useCallback((partial: Partial<CapabilitySettings>) => {
    setCapabilitySettings((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Layers Playground</h1>
              </div>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://layers.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Docs
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://github.com/layers-dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Chat */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              {/* Model Selection */}
              <CardHeader className="pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversation
                  </CardTitle>
                </div>
                <div className="space-y-2">
                  <ModelSelector
                    value={settings.model}
                    onValueChange={(model) => handleSettingsChange({ model })}
                    disabled={isLoading}
                  />
                  <ModelInfo modelId={settings.model} />
                </div>
              </CardHeader>

              <Separator />

              {/* Chat Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ResponseDisplay messages={messages} isLoading={isLoading} />
              </CardContent>

              <Separator />

              {/* Input Area */}
              <CardContent className="pt-4">
                <PromptEditor
                  systemPrompt={settings.systemPrompt}
                  onSystemPromptChange={(systemPrompt) =>
                    handleSettingsChange({ systemPrompt })
                  }
                  onSend={sendMessage}
                  onStop={stopGeneration}
                  onClear={clearMessages}
                  onRegenerate={regenerateLast}
                  isLoading={isLoading}
                  hasMessages={messages.length > 0}
                  supportsVision={supportsVision}
                  supportsPdf={supportsPdf}
                  supportsAudio={supportsAudio}
                  supportsVideo={supportsVideo}
                />
              </CardContent>

              {/* Usage Summary */}
              {(totalUsage.totalCredits > 0 || rateLimitInfo) && (
                <CardContent className="pt-0">
                  <UsageSummary
                    totalUsage={totalUsage}
                    rateLimitInfo={rateLimitInfo}
                  />
                </CardContent>
              )}
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="mt-4 border-destructive/50 bg-destructive/10">
                <CardContent className="py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Settings & Code */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <Tabs
                value={rightPanelTab}
                onValueChange={(v) => setRightPanelTab(v as typeof rightPanelTab)}
                className="flex-1 flex flex-col"
              >
                <CardHeader className="pb-0">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="settings" className="text-xs px-2">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger value="capabilities" className="relative text-xs px-2">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Caps
                      {hasAdvancedCapabilities && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="embeddings" className="text-xs px-2">
                      <Hash className="h-4 w-4 mr-1" />
                      Embed
                    </TabsTrigger>
                    <TabsTrigger value="code" className="text-xs px-2">
                      <Code className="h-4 w-4 mr-1" />
                      Export
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto pt-4">
                  <TabsContent value="settings" className="mt-0 h-full">
                    <SettingsPanel
                      settings={settings}
                      onSettingsChange={handleSettingsChange}
                    />
                  </TabsContent>

                  <TabsContent value="capabilities" className="mt-0 h-full">
                    <CapabilitiesPanel
                      capabilities={modelCapabilities}
                      settings={capabilitySettings}
                      onSettingsChange={handleCapabilitySettingsChange}
                    />
                  </TabsContent>

                  <TabsContent value="embeddings" className="mt-0 h-full">
                    <EmbeddingsPanel />
                  </TabsContent>

                  <TabsContent value="code" className="mt-0 h-full">
                    <CodeExport settings={settings} messages={messages} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* API Info Card */}
            <Card className="mt-4">
              <CardContent className="py-4">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">How it works</p>
                  <p>
                    This playground uses the Layers API with full middleware:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Authentication via API key</li>
                    <li>Rate limiting (tier-based)</li>
                    <li>Credit checking & deduction</li>
                    <li>Gateway routing to providers</li>
                  </ul>
                  <p className="pt-2">
                    <a
                      href="https://layers.dev/docs/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Learn more about the API &rarr;
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>
              Built with{' '}
              <a
                href="https://layers.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Layers API
              </a>{' '}
              &middot; OpenAI-compatible endpoint
            </p>
            <p>
              <a
                href="https://github.com/layers-dev/playground"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                View source on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
