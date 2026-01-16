'use client';

import { useState } from 'react';

interface ModelPlaygroundProps {
  /** Default AI provider */
  defaultProvider?: 'anthropic' | 'openai' | 'google' | 'perplexity' | 'morph';
  /** Default model */
  defaultModel?: string;
  /** Show only specific provider */
  singleProvider?: boolean;
}

type ExportFormat = 'typescript' | 'curl' | 'python';

// Model registry matching packages/@layers/models/src/registry.ts
const MODEL_REGISTRY = {
  anthropic: [
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude 4.5 Haiku', context: '200K' },
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude 4.5 Sonnet', context: '200K' },
    { id: 'anthropic/claude-opus-4.5', name: 'Claude 4.5 Opus', context: '200K' },
  ],
  openai: [
    { id: 'openai/gpt-4o', name: 'GPT-4o', context: '128K' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', context: '128K' },
    { id: 'openai/gpt-5-chat', name: 'GPT-5 Chat', context: '512K' },
    { id: 'openai/gpt-5-codex', name: 'GPT-5 Codex', context: '512K' },
    { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', context: '512K' },
    { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', context: '512K' },
    { id: 'openai/gpt-5.1-instant', name: 'GPT-5.1 Instant', context: '512K' },
    { id: 'openai/gpt-5.1-thinking', name: 'GPT-5.1 Thinking', context: '512K' },
  ],
  google: [
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', context: '1M' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', context: '1M' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', context: '1M' },
    { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', context: '1M' },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', context: '1M' },
  ],
  perplexity: [
    { id: 'perplexity/sonar', name: 'Sonar', context: '128K' },
    { id: 'perplexity/sonar-pro', name: 'Sonar Pro', context: '200K' },
    { id: 'perplexity/sonar-reasoning-pro', name: 'Sonar Reasoning Pro', context: '128K' },
  ],
  morph: [
    { id: 'morph/morph-v3-fast', name: 'Morph v3 Fast', context: '128K' },
    { id: 'morph/morph-v3-large', name: 'Morph v3 Large', context: '128K' },
  ],
};

/**
 * Interactive AI model testing playground.
 *
 * Allows users to test different models directly in the documentation.
 * Supports TypeScript, cURL, and Python export formats.
 */
export function ModelPlayground({
  defaultProvider = 'anthropic',
  defaultModel = 'anthropic/claude-sonnet-4.5',
  singleProvider = false
}: ModelPlaygroundProps) {
  const [provider, setProvider] = useState(defaultProvider);
  const [model, setModel] = useState(defaultModel);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(true);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('typescript');
  const [copied, setCopied] = useState(false);

  const promptText = prompt || 'Your prompt here';
  const escapedPrompt = promptText.replace(/'/g, "\\'").replace(/\n/g, '\\n');

  // Generate TypeScript code example (Vercel AI SDK)
  const generateTypeScript = () => {
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
    const jsonBody = JSON.stringify({
      model,
      messages: [{ role: 'user', content: promptText }],
      max_tokens: 1024
    }, null, 2);

    return `curl -X POST https://preview.hustletogether.com/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_LAYERS_API_KEY" \\
  -d '${jsonBody.replace(/'/g, "'\\''")}'`;
  };

  // Generate Python code (requests library)
  const generatePython = () => {
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
        "messages": [{"role": "user", "content": "${escapedPrompt}"}],
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

    try {
      const res = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      let responseText = data.text || 'No response';
      if (data.usage) {
        responseText += `\n\n---\nTokens: ${data.usage.inputTokens} in / ${data.usage.outputTokens} out`;
      }
      setResponse(responseText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentModels = MODEL_REGISTRY[provider as keyof typeof MODEL_REGISTRY] || [];

  return (
    <div className="border rounded-lg p-4 space-y-4 not-prose">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">API Playground</h3>
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!singleProvider && (
          <div>
            <label className="block text-sm font-medium mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                const p = e.target.value as keyof typeof MODEL_REGISTRY;
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
                {m.name} ({m.context} context)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt... (e.g., 'Explain quantum computing in simple terms')"
          className="w-full p-2 border rounded min-h-[100px] bg-background font-mono text-sm"
        />
      </div>

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
          {isLoading ? 'Running...' : 'Try It'}
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

      {response && (
        <div className="p-3 bg-muted rounded">
          <label className="block text-sm font-medium mb-1">Response</label>
          <pre className="whitespace-pre-wrap text-sm">{response}</pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        TypeScript uses the Vercel AI SDK. cURL and Python use the Layers API directly.
      </p>
    </div>
  );
}
