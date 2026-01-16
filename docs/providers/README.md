# AI Provider Documentation

Comprehensive documentation for each AI provider supported through Vercel AI SDK.

## Supported Providers

| Provider | Package | Models | Key Features |
|----------|---------|--------|--------------|
| [Anthropic](./anthropic.md) | `@ai-sdk/anthropic` | Claude 4.5, 4, 3.7, 3.5 | Reasoning, Computer Use, PDF |
| [OpenAI](./openai.md) | `@ai-sdk/openai` | GPT-5, GPT-4o, o-series | Structured outputs, Responses API |
| [Google](./google.md) | `@ai-sdk/google` | Gemini 3, 2.5, 2.0 | Image gen, Search grounding |
| [xAI](./xai.md) | `@ai-sdk/xai` | Grok 4.1, 4, 3 | X search, 2M context |
| [DeepSeek](./deepseek.md) | `@ai-sdk/deepseek` | V3.2, R1 | Reasoning, Cost-effective |
| [Perplexity](./perplexity.md) | `@ai-sdk/perplexity` | Sonar, Sonar Pro | Real-time web search |

## Quick Start

```bash
# Install Vercel AI SDK and providers
pnpm add ai @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/google @ai-sdk/xai @ai-sdk/deepseek @ai-sdk/perplexity
```

## Environment Variables

```bash
# Required for each provider
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=...
XAI_API_KEY=xai-...
DEEPSEEK_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
```

## Core Functions

All providers use the same Vercel AI SDK functions:

```typescript
import { generateText, streamText, generateObject, embed, tool } from 'ai';
```

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateText` | Complete text generation | `{ text, usage, toolCalls }` |
| `streamText` | Streaming text | `{ textStream, usage }` |
| `generateObject` | Structured JSON output | `{ object }` |
| `embed` | Create embeddings | `{ embedding }` |
| `tool` | Define callable tools | Tool definition |

## Common Patterns

### Text Generation

```typescript
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const { text } = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  prompt: 'Your prompt here',
  maxTokens: 1000,
});
```

### Streaming

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { textStream } = await streamText({
  model: openai('gpt-4o'),
  prompt: 'Your prompt here',
});

for await (const chunk of textStream) {
  process.stdout.write(chunk);
}
```

### Structured Output

```typescript
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

const { object } = await generateObject({
  model: google('gemini-2.0-flash'),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()),
  }),
  prompt: 'Analyze this article...',
});
```

### Tool Calling

```typescript
import { generateText, tool } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod';

const { text, toolCalls } = await generateText({
  model: xai('grok-4'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get weather for a location',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
});
```

## Capability Matrix

| Provider | Text | Vision | Tools | JSON | Stream | Reasoning | Embed | Image Gen | Web Search |
|----------|------|--------|-------|------|--------|-----------|-------|-----------|------------|
| Anthropic | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| OpenAI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* |
| Google | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| xAI | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| DeepSeek | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Perplexity | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

*OpenAI web search requires Responses API

## See Also

- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [@layers/models](../packages/@layers/models/) - Model registry
- [@layers/credits](../packages/@layers/credits/) - Credit calculation
