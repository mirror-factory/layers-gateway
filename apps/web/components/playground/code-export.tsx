'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSettings } from '@/hooks/use-layers-chat';
import type { Message } from '@/hooks/use-layers-chat';

interface CodeExportProps {
  settings: ChatSettings;
  messages: Message[];
}

type Language = 'typescript' | 'curl' | 'python';

function generateTypeScript(settings: ChatSettings, messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  const messagesArray = settings.systemPrompt
    ? [
        { role: 'system', content: settings.systemPrompt },
        ...userMessages.map((m) => ({ role: m.role, content: m.content })),
      ]
    : userMessages.map((m) => ({ role: m.role, content: m.content }));

  // If no messages, add a placeholder
  if (messagesArray.length === 0 || (messagesArray.length === 1 && messagesArray[0].role === 'system')) {
    messagesArray.push({ role: 'user', content: lastUserMessage?.content || 'Hello!' });
  }

  return `import { createClient } from '@layers/sdk';

const layers = createClient({
  apiKey: process.env.LAYERS_API_KEY!,
});

async function chat() {
  const response = await layers.chat.completions.create({
    model: '${settings.model}',
    messages: ${JSON.stringify(messagesArray, null, 2).split('\n').join('\n    ')},
    max_tokens: ${settings.maxTokens},
    temperature: ${settings.temperature},
    stream: ${settings.stream},
  });

  ${settings.stream ? `// Handle streaming response
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      process.stdout.write(content);
    }
  }` : `// Handle non-streaming response
  console.log(response.choices[0].message.content);
  console.log('Tokens:', response.usage);
  console.log('Credits:', response.layers.credits_used);`}
}

chat().catch(console.error);`;
}

function generateCurl(settings: ChatSettings, messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  const messagesArray = settings.systemPrompt
    ? [
        { role: 'system', content: settings.systemPrompt },
        ...userMessages.map((m) => ({ role: m.role, content: m.content })),
      ]
    : userMessages.map((m) => ({ role: m.role, content: m.content }));

  if (messagesArray.length === 0 || (messagesArray.length === 1 && messagesArray[0].role === 'system')) {
    messagesArray.push({ role: 'user', content: lastUserMessage?.content || 'Hello!' });
  }

  const body = {
    model: settings.model,
    messages: messagesArray,
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    stream: settings.stream,
  };

  return `curl https://api.layers.dev/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $LAYERS_API_KEY" \\
  -d '${JSON.stringify(body, null, 2).replace(/'/g, "\\'")}'`;
}

function generatePython(settings: ChatSettings, messages: Message[]): string {
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  const messagesArray = settings.systemPrompt
    ? [
        { role: 'system', content: settings.systemPrompt },
        ...userMessages.map((m) => ({ role: m.role, content: m.content })),
      ]
    : userMessages.map((m) => ({ role: m.role, content: m.content }));

  if (messagesArray.length === 0 || (messagesArray.length === 1 && messagesArray[0].role === 'system')) {
    messagesArray.push({ role: 'user', content: lastUserMessage?.content || 'Hello!' });
  }

  const messagesStr = JSON.stringify(messagesArray, null, 4)
    .replace(/"/g, "'")
    .replace(/\n/g, '\n    ');

  return `import os
from openai import OpenAI

# Layers API is OpenAI-compatible
client = OpenAI(
    api_key=os.environ.get("LAYERS_API_KEY"),
    base_url="https://api.layers.dev/api/v1"
)

response = client.chat.completions.create(
    model="${settings.model}",
    messages=${messagesStr},
    max_tokens=${settings.maxTokens},
    temperature=${settings.temperature},
    stream=${settings.stream ? 'True' : 'False'}
)

${settings.stream ? `# Handle streaming response
for chunk in response:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)` : `# Handle non-streaming response
print(response.choices[0].message.content)
print(f"Tokens: {response.usage}")
print(f"Credits: {response.layers.credits_used}")`}`;
}

export function CodeExport({ settings, messages }: CodeExportProps) {
  const [activeTab, setActiveTab] = useState<Language>('typescript');
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    switch (activeTab) {
      case 'typescript':
        return generateTypeScript(settings, messages);
      case 'curl':
        return generateCurl(settings, messages);
      case 'python':
        return generatePython(settings, messages);
    }
  }, [activeTab, settings, messages]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Export Code</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Language)}>
        <TabsList className="h-8">
          <TabsTrigger value="typescript" className="text-xs h-6 px-2">
            TypeScript
          </TabsTrigger>
          <TabsTrigger value="curl" className="text-xs h-6 px-2">
            cURL
          </TabsTrigger>
          <TabsTrigger value="python" className="text-xs h-6 px-2">
            Python
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-2">
          <ScrollArea className="h-[300px] rounded-md border bg-muted/50">
            <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
              <code>{code}</code>
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px]">
          OpenAI Compatible
        </Badge>
        <span>Works with any OpenAI SDK client</span>
      </div>
    </div>
  );
}
