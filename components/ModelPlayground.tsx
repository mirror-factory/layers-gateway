'use client';

import { useState, useEffect } from 'react';

type Provider = 'anthropic' | 'openai' | 'google' | 'perplexity' | 'morph';
type ExportFormat = 'typescript' | 'curl' | 'python';
type PlaygroundMode = 'chat' | 'image';

interface ModelPlaygroundProps {
  /** Default AI provider */
  defaultProvider?: Provider;
  /** Default model */
  defaultModel?: string;
  /** Show only specific provider */
  singleProvider?: boolean;
  /** Default mode */
  defaultMode?: PlaygroundMode;
}

interface ModelInfo {
  id: string;
  name: string;
  context: string;
  inputPrice: number;  // per 1K tokens
  outputPrice: number; // per 1K tokens
}

interface ImageModelInfo {
  id: string;
  name: string;
  price: string;
  priceType: 'per-image' | 'per-mp';
}

// Model registry with pricing (per 1K tokens)
const MODEL_REGISTRY: Record<string, ModelInfo[]> = {
  anthropic: [
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude 4.5 Haiku', context: '200K', inputPrice: 0.001, outputPrice: 0.005 },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude 4.5 Sonnet', context: '200K', inputPrice: 0.003, outputPrice: 0.015 },
    { id: 'anthropic/claude-opus-4.5', name: 'Claude 4.5 Opus', context: '200K', inputPrice: 0.005, outputPrice: 0.025 },
  ],
  openai: [
    { id: 'openai/gpt-4o', name: 'GPT-4o', context: '128K', inputPrice: 0.0025, outputPrice: 0.01 },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', context: '128K', inputPrice: 0.0001, outputPrice: 0.0006 },
    { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat', context: '512K', inputPrice: 0.0013, outputPrice: 0.01 },
    { id: 'openai/gpt-5-codex', name: 'GPT-5 Codex', context: '512K', inputPrice: 0.0013, outputPrice: 0.01 },
    { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', context: '512K', inputPrice: 0.0013, outputPrice: 0.01 },
    { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', context: '512K', inputPrice: 0.0003, outputPrice: 0.002 },
    { id: 'openai/gpt-5.1-instant', name: 'GPT-5.1 Instant', context: '512K', inputPrice: 0.0013, outputPrice: 0.01 },
    { id: 'openai/gpt-5.1-thinking', name: 'GPT-5.1 Thinking', context: '512K', inputPrice: 0.0013, outputPrice: 0.01 },
  ],
  google: [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', context: '1M', inputPrice: 0.0003, outputPrice: 0.0025 },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', context: '1M', inputPrice: 0.0001, outputPrice: 0.0004 },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', context: '1M', inputPrice: 0.0013, outputPrice: 0.01 },
    { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', context: '1M', inputPrice: 0.0005, outputPrice: 0.003 },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', context: '1M', inputPrice: 0.002, outputPrice: 0.012 },
  ],
  perplexity: [
    { id: 'perplexity/sonar', name: 'Sonar', context: '127K', inputPrice: 0.001, outputPrice: 0.001 },
    { id: 'perplexity/sonar-pro', name: 'Sonar Pro', context: '200K', inputPrice: 0.003, outputPrice: 0.015 },
    { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', context: '127K', inputPrice: 0.002, outputPrice: 0.008 },
  ],
  morph: [
    { id: 'morph/morph-v3-fast', name: 'Morph v3 Fast', context: '81K', inputPrice: 0.0008, outputPrice: 0.0012 },
    { id: 'morph/morph-v3-large', name: 'Morph v3 Large', context: '81K', inputPrice: 0.0009, outputPrice: 0.0019 },
  ],
};

// Image models
const IMAGE_MODELS: ImageModelInfo[] = [
  { id: 'bfl/flux-2-pro', name: 'FLUX 2 Pro', price: '$0.03/MP', priceType: 'per-mp' },
  { id: 'bfl/flux-2-flex', name: 'FLUX 2 Flex', price: '$0.06/MP', priceType: 'per-mp' },
  { id: 'bfl/flux-2-klein-4b', name: 'FLUX 2 Klein 4B', price: '$0.014/MP', priceType: 'per-mp' },
  { id: 'bfl/flux-2-klein-9b', name: 'FLUX 2 Klein 9B', price: '$0.015/MP', priceType: 'per-mp' },
  { id: 'bfl/flux-pro-1.1', name: 'FLUX 1.1 Pro', price: '$0.04/img', priceType: 'per-image' },
  { id: 'bfl/flux-pro-1.1-ultra', name: 'FLUX 1.1 Pro Ultra', price: '$0.06/img', priceType: 'per-image' },
  { id: 'google/imagen-4.0-fast-generate-001', name: 'Imagen 4 Fast', price: '$0.02/img', priceType: 'per-image' },
  { id: 'google/imagen-4.0-ultra-generate-001', name: 'Imagen 4 Ultra', price: '$0.08/img', priceType: 'per-image' },
];

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'];

/**
 * Interactive AI model testing playground.
 *
 * Allows users to test different models directly in the documentation.
 * Supports TypeScript, cURL, and Python export formats.
 * Features: cost estimation, streaming, system prompts, image generation.
 */
export function ModelPlayground({
  defaultProvider = 'anthropic',
  defaultModel = 'anthropic/claude-sonnet-4.5',
  singleProvider = false,
  defaultMode = 'chat'
}: ModelPlaygroundProps) {
  const [mode, setMode] = useState<PlaygroundMode>(defaultMode);
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [model, setModel] = useState(defaultModel);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('typescript');
  const [copied, setCopied] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedSystemPrompt = localStorage.getItem('playground-system-prompt');
    if (savedSystemPrompt) setSystemPrompt(savedSystemPrompt);
    const savedStreaming = localStorage.getItem('playground-streaming');
    if (savedStreaming) setStreaming(savedStreaming === 'true');
  }, []);

  // Save system prompt
  useEffect(() => {
    localStorage.setItem('playground-system-prompt', systemPrompt);
  }, [systemPrompt]);

  const promptText = prompt || 'Your prompt here';
  const escapedPrompt = promptText.replace(/'/g, "\\'").replace(/\n/g, '\\n');

  // Get current model info for cost estimation
  const getCurrentModelInfo = (): ModelInfo | undefined => {
    return MODEL_REGISTRY[provider as keyof typeof MODEL_REGISTRY]?.find(m => m.id === model);
  };

  // Estimate cost based on prompt length (rough: 4 chars = 1 token)
  const estimateCost = () => {
    const modelInfo = getCurrentModelInfo();
    if (!modelInfo) return null;
    const inputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = 500; // Assume 500 output tokens
    const inputCost = (inputTokens / 1000) * modelInfo.inputPrice;
    const outputCost = (estimatedOutputTokens / 1000) * modelInfo.outputPrice;
    return { inputCost, outputCost, total: inputCost + outputCost };
  };

  // Calculate actual cost from usage
  const calculateActualCost = () => {
    if (!usage) return null;
    const modelInfo = getCurrentModelInfo();
    if (!modelInfo) return null;
    const inputCost = (usage.inputTokens / 1000) * modelInfo.inputPrice;
    const outputCost = (usage.outputTokens / 1000) * modelInfo.outputPrice;
    return { inputCost, outputCost, total: inputCost + outputCost };
  };

  // Generate TypeScript code example (Vercel AI SDK)
  const generateTypeScript = () => {
    if (mode === 'image') {
      return `import { experimental_generateImage as generateImage } from 'ai';

const result = await generateImage({
  model: '${imageModel}',
  prompt: '${escapedPrompt}',
  aspectRatio: '${aspectRatio}',
});

const image = result.images[0];
console.log(image.base64);`;
    }

    const hasSystemPrompt = systemPrompt.trim();
    if (hasSystemPrompt) {
      return `import { generateText, createGateway } from 'ai';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

const { text } = await generateText({
  model: gateway('${model}'),
  system: '${systemPrompt.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',
  prompt: '${escapedPrompt}',
});

console.log(text);`;
    }

    return `import { generateText, createGateway } from 'ai';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY
});

const { text } = await generateText({
  model: gateway('${model}'),
  prompt: '${escapedPrompt}',
});

console.log(text);`;
  };

  // Generate cURL command (Layers API)
  const generateCurl = () => {
    if (mode === 'image') {
      const jsonBody = JSON.stringify({
        model: imageModel,
        prompt: promptText,
        aspectRatio,
      }, null, 2);

      return `curl -X POST https://preview.hustletogether.com/api/v1/image \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_LAYERS_API_KEY" \\
  -d '${jsonBody.replace(/'/g, "'\\''")}'`;
    }

    const messages = systemPrompt.trim()
      ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: promptText }]
      : [{ role: 'user', content: promptText }];

    const jsonBody = JSON.stringify({
      model,
      messages,
      max_tokens: 1024
    }, null, 2);

    return `curl -X POST https://preview.hustletogether.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_LAYERS_API_KEY" \\
  -d '${jsonBody.replace(/'/g, "'\\''")}'`;
  };

  // Generate Python code (requests library)
  const generatePython = () => {
    if (mode === 'image') {
      return `import requests
import os

response = requests.post(
    "https://preview.hustletogether.com/api/v1/image",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ['LAYERS_API_KEY']}"
    },
    json={
        "model": "${imageModel}",
        "prompt": "${escapedPrompt}",
        "aspectRatio": "${aspectRatio}"
    }
)

data = response.json()
print(data["images"][0]["base64"])`;
    }

    const messagesStr = systemPrompt.trim()
      ? `[{"role": "system", "content": "${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"}, {"role": "user", "content": "${escapedPrompt}"}]`
      : `[{"role": "user", "content": "${escapedPrompt}"}]`;

    return `import requests
import os

response = requests.post(
    "https://preview.hustletogether.com/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ['LAYERS_API_KEY']}"
    },
    json={
        "model": "${model}",
        "messages": ${messagesStr},
        "max_tokens": 1024
    }
)

data = response.json()
print(data["choices"][0]["message"]["content"])`;
  };

  const getCodeExample = () => {
    switch (exportFormat) {
      case 'curl': return generateCurl();
      case 'python': return generatePython();
      default: return generateTypeScript();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeExample());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');
    setGeneratedImage(null);
    setUsage(null);

    try {
      if (mode === 'image') {
        // Image generation
        const res = await fetch('/api/playground/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: imageModel, prompt, aspectRatio })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `API error: ${res.status}`);
        }

        const data = await res.json();
        if (data.image) {
          setGeneratedImage(data.image);
        }
      } else if (streaming) {
        // Streaming text generation
        const res = await fetch('/api/playground/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, systemPrompt: systemPrompt || undefined })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `API error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let fullResponse = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullResponse += chunk;
            setResponse(fullResponse);
          }
        }
      } else {
        // Non-streaming text generation
        const res = await fetch('/api/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, systemPrompt: systemPrompt || undefined })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `API error: ${res.status}`);
        }

        const data = await res.json();
        setResponse(data.text || 'No response');
        if (data.usage) {
          setUsage(data.usage);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentModels = MODEL_REGISTRY[provider as keyof typeof MODEL_REGISTRY] || [];
  const estimatedCost = estimateCost();
  const actualCost = calculateActualCost();

  return (
    <div className="border rounded-lg p-4 space-y-4 not-prose">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">API Playground</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode(mode === 'chat' ? 'image' : 'chat')}
            className="text-sm px-2 py-1 rounded bg-muted hover:bg-muted/80"
          >
            {mode === 'chat' ? 'Image Mode' : 'Chat Mode'}
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        </div>
      </div>

      {mode === 'chat' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!singleProvider && (
              <div>
                <label className="block text-sm font-medium mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const p = e.target.value as Provider;
                    setProvider(p);
                    setModel(MODEL_REGISTRY[p][0].id);
                  }}
                  className="w-full p-2 border rounded bg-background"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="perplexity">Perplexity</option>
                  <option value="morph">Morph</option>
                </select>
              </div>
            )}
            <div className={singleProvider ? 'col-span-2' : ''}>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border rounded bg-background"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.context})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {showAdvanced ? '- Hide' : '+ Show'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-3 p-3 bg-muted/50 rounded">
                <div>
                  <label className="block text-sm font-medium mb-1">System Prompt</label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="w-full p-2 border rounded min-h-[60px] bg-background font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={streaming}
                    onChange={(e) => {
                      setStreaming(e.target.checked);
                      localStorage.setItem('playground-streaming', String(e.target.checked));
                    }}
                    className="rounded"
                  />
                  <label htmlFor="streaming" className="text-sm">Enable streaming</label>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Image Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Image Model</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full p-2 border rounded bg-background"
              >
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.price})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 border rounded bg-background"
              >
                {ASPECT_RATIOS.map((ratio) => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {mode === 'image' ? 'Image Prompt' : 'Prompt'}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'image'
            ? "Describe the image you want to generate..."
            : "Enter your prompt... (e.g., 'Explain quantum computing in simple terms')"
          }
          className="w-full p-2 border rounded min-h-[100px] bg-background font-mono text-sm"
        />
      </div>

      {/* Cost Estimation */}
      {mode === 'chat' && estimatedCost && prompt.trim() && (
        <div className="text-xs text-muted-foreground">
          Estimated cost: ~${estimatedCost.total.toFixed(4)}
          (${estimatedCost.inputCost.toFixed(5)} input + ~${estimatedCost.outputCost.toFixed(4)} output)
        </div>
      )}

      {showCode && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Generated Code</label>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setExportFormat('typescript')}
                className={`px-2 py-1 rounded ${exportFormat === 'typescript' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setExportFormat('curl')}
                className={`px-2 py-1 rounded ${exportFormat === 'curl' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              >
                cURL
              </button>
              <button
                onClick={() => setExportFormat('python')}
                className={`px-2 py-1 rounded ${exportFormat === 'python' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
              >
                Python
              </button>
            </div>
          </div>
          <pre className="p-3 bg-muted rounded text-sm overflow-x-auto max-h-[300px]">
            <code>{getCodeExample()}</code>
          </pre>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 hover:bg-primary/90"
        >
          {isLoading ? (mode === 'image' ? 'Generating...' : 'Running...') : (mode === 'image' ? 'Generate Image' : 'Try It')}
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 border rounded hover:bg-muted"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded border border-destructive/20">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && mode === 'chat' && (
        <div className="p-3 bg-muted rounded">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Response</label>
            {actualCost && (
              <span className="text-xs text-muted-foreground">
                Cost: ${actualCost.total.toFixed(4)} ({usage?.inputTokens} in / {usage?.outputTokens} out)
              </span>
            )}
          </div>
          <pre className="whitespace-pre-wrap text-sm">{response}</pre>
        </div>
      )}

      {generatedImage && mode === 'image' && (
        <div className="p-3 bg-muted rounded">
          <label className="block text-sm font-medium mb-2">Generated Image</label>
          <img
            src={`data:image/png;base64,${generatedImage}`}
            alt="Generated"
            className="max-w-full rounded border"
          />
          <a
            href={`data:image/png;base64,${generatedImage}`}
            download="generated-image.png"
            className="inline-block mt-2 text-sm text-primary hover:underline"
          >
            Download Image
          </a>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {mode === 'image'
          ? 'Image generation uses the Vercel AI Gateway experimental_generateImage API.'
          : 'TypeScript uses the Vercel AI SDK. cURL and Python use the Layers API directly.'}
      </p>
    </div>
  );
}
