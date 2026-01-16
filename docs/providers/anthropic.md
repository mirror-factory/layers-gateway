# Anthropic (Claude)

Anthropic's Claude models through Vercel AI SDK.

## Installation

```bash
pnpm add @ai-sdk/anthropic
```

## Environment

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Models

| Model | ID | Context | Best For |
|-------|-----|---------|----------|
| Claude 4.5 Opus | `claude-opus-4-5-20250414` | 200K | Complex reasoning, research |
| Claude 4 Opus | `claude-opus-4-20250514` | 200K | Advanced tasks |
| Claude 4.5 Sonnet | `claude-sonnet-4-5-20250514` | 200K | Coding, general purpose |
| Claude 4 Sonnet | `claude-sonnet-4-20250514` | 200K | Balanced performance |
| Claude 3.7 Sonnet | `claude-3-7-sonnet-20250219` | 200K | Fast, capable |
| Claude 4.5 Haiku | `claude-haiku-4-5-20250514` | 200K | Fast, affordable |
| Claude 3.5 Sonnet | `claude-3-5-sonnet-20241022` | 200K | Legacy, stable |
| Claude 3 Haiku | `claude-3-haiku-20240307` | 200K | Budget option |

## Capabilities

| Feature | Support | Notes |
|---------|---------|-------|
| Text Generation | ✅ | All models |
| Vision | ✅ | All models |
| Tool Calling | ✅ | All models |
| Structured Output | ✅ | Via tool use |
| Streaming | ✅ | All models |
| PDF Input | ✅ | 3.5 Sonnet+ |
| Reasoning/Thinking | ✅ | Opus 4+, Sonnet 4+, 3.7 |
| Computer Use | ✅ | 3.5 Sonnet v2+ |
| Prompt Caching | ✅ | All models |

## Basic Usage

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

// Text generation
const { text } = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'Explain quantum computing',
  maxTokens: 1000,
});

// Streaming
const { textStream } = await streamText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'Write a short story',
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

## Vision (Image Input)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text } = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image',
          image: Buffer.from(base64Image, 'base64'),
          // Or: image: new URL('https://example.com/image.jpg'),
        },
      ],
    },
  ],
});
```

## PDF Input

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import fs from 'fs';

const { text } = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Summarize this document' },
        {
          type: 'file',
          data: fs.readFileSync('./document.pdf'),
          mimeType: 'application/pdf',
        },
      ],
    },
  ],
});
```

## Tool Calling

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const { text, toolCalls, toolResults } = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get current weather for a location',
      parameters: z.object({
        location: z.string().describe('City name'),
        unit: z.enum(['celsius', 'fahrenheit']).optional(),
      }),
      execute: async ({ location, unit = 'fahrenheit' }) => {
        // Implementation
        return { temperature: 72, condition: 'sunny', unit };
      },
    }),
  },
  maxSteps: 5, // Allow multiple tool calls
});
```

## Structured Output (JSON)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-5-20250514'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    summary: z.string(),
    topics: z.array(z.string()),
    sentiment: z.enum(['positive', 'negative', 'neutral']),
  }),
  prompt: 'Analyze this article and extract metadata...',
});
```

## Reasoning/Thinking Mode

Extended thinking for complex problems:

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'Solve this complex math problem step by step...',
  providerOptions: {
    anthropic: {
      thinking: {
        type: 'enabled',
        budgetTokens: 10000, // Max tokens for thinking
      },
    },
  },
});

// Access thinking content
console.log(result.reasoning); // The thinking process
console.log(result.text); // Final answer
```

### Effort Option (Claude Opus 4.5)

```typescript
const result = await generateText({
  model: anthropic('claude-opus-4-5-20250414'),
  prompt: 'Complex research task...',
  providerOptions: {
    anthropic: {
      effort: 'high', // 'low' | 'medium' | 'high'
    },
  },
});
```

## Computer Use

Control computer interfaces (desktop automation):

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'Open the browser and search for AI news',
  tools: {
    computer: anthropic.tools.computer_20250124({
      displayWidthPx: 1920,
      displayHeightPx: 1080,
      displayNumber: 0,
      execute: async (action) => {
        // Handle action: mouse_move, click, type, screenshot, etc.
        switch (action.type) {
          case 'screenshot':
            return { type: 'image', data: screenshotBase64 };
          case 'click':
            await performClick(action.x, action.y);
            return { type: 'success' };
          // ... other actions
        }
      },
    }),
    bash: anthropic.tools.bash_20250124({
      execute: async (command) => {
        // Execute bash command
        return await runCommand(command);
      },
    }),
    textEditor: anthropic.tools.textEditor_20250124({
      execute: async ({ command, path, content }) => {
        // Handle file operations
      },
    }),
  },
  maxSteps: 20,
});
```

## Prompt Caching

Reduce costs on repeated system prompts:

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  messages: [
    {
      role: 'system',
      content: longSystemPrompt, // Will be cached
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: 'ephemeral' } },
      },
    },
    {
      role: 'user',
      content: 'Your question here',
    },
  ],
});

// Check cache usage
console.log(result.providerMetadata?.anthropic?.cacheCreationInputTokens);
console.log(result.providerMetadata?.anthropic?.cacheReadInputTokens);
```

## Tool Streaming

Enabled by default. Disable if needed:

```typescript
const model = anthropic('claude-sonnet-4-5-20250514', {
  toolStreaming: false,
});
```

## Custom Base URL

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://custom-endpoint.com',
});
```

## Error Handling

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, APICallError } from 'ai';

try {
  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-5-20250514'),
    prompt: 'Your prompt',
  });
} catch (error) {
  if (error instanceof APICallError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
  }
  throw error;
}
```

## Pricing (per 1K tokens)

| Model | Input | Output |
|-------|-------|--------|
| Claude 4.5 Opus | $0.005 | $0.025 |
| Claude 4 Opus | $0.005 | $0.025 |
| Claude 4.5 Sonnet | $0.003 | $0.015 |
| Claude 4 Sonnet | $0.003 | $0.015 |
| Claude 3.7 Sonnet | $0.003 | $0.015 |
| Claude 4.5 Haiku | $0.001 | $0.005 |
| Claude 3.5 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

## Best Practices

1. **Use the right model**: Haiku for speed, Sonnet for balance, Opus for complexity
2. **Enable thinking** for multi-step reasoning problems
3. **Use prompt caching** for repeated system prompts (saves 90% on cached tokens)
4. **Set appropriate maxTokens** to control costs
5. **Use streaming** for better UX on long responses

## See Also

- [Vercel AI SDK - Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic)
- [Anthropic API Documentation](https://docs.anthropic.com/)
