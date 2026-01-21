'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ALL_TESTS,
  TEST_FILES,
  TEST_CATEGORIES,
  getTestsByFile,
  type TestCase,
} from '@/lib/test-capabilities';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Play,
  Boxes,
  Plug,
  Server,
  Image,
  Code,
  ArrowRight,
} from 'lucide-react';

// Category configuration
const CATEGORY_CONFIG: Record<
  string,
  {
    name: string;
    description: string;
    icon: React.ElementType;
    fileIds: string[];
    documentation: Record<string, { title: string; description: string; example?: string }>;
  }
> = {
  'unit-tests': {
    name: 'Unit Tests',
    description: 'Model registry helper functions and data integrity tests',
    icon: Boxes,
    fileIds: ['helpers', 'registry'],
    documentation: {
      registry: {
        title: 'Model Registry',
        description:
          'Tests that verify the model registry data structure, model counts, provider groupings, and schema validation.',
        example: `import { MODEL_REGISTRY } from '@layers/models';
// Registry contains 23 models across 5 providers
console.log(MODEL_REGISTRY.length); // 23`,
      },
      helpers: {
        title: 'Helper Functions',
        description:
          'Tests for utility functions that query, filter, and manipulate model data. Includes cost calculation and capability filtering.',
        example: `import { getModelById, queryModels, calculateCost } from '@layers/models';

// Get a specific model
const claude = getModelById('anthropic/claude-sonnet-4.5');

// Query models with filters
const visionModels = queryModels({
  capabilities: ['vision', 'text'],
  maxInputPrice: 0.01,
});

// Calculate cost
const cost = calculateCost('anthropic/claude-sonnet-4.5', 1000, 500);`,
      },
    },
  },
  'gateway-tests': {
    name: 'Gateway Tests',
    description: 'Direct Vercel AI Gateway integration tests',
    icon: Plug,
    fileIds: ['gateway'],
    documentation: {
      connectivity: {
        title: 'Provider Connectivity',
        description:
          'Tests that verify connection to each AI provider through the Vercel AI Gateway. Ensures all 5 providers are reachable.',
      },
      vision: {
        title: 'Vision Capabilities',
        description:
          'Tests for image input processing with Claude and GPT-4o models via the gateway.',
        example: `const response = await generateText({
  model: gateway('anthropic/claude-sonnet-4.5'),
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Describe this image' },
      { type: 'image', image: imageData },
    ],
  }],
});`,
      },
      tools: {
        title: 'Tool Calling',
        description:
          'Tests for function calling capabilities with Claude and GPT-4o models.',
        example: `const tools = {
  getWeather: {
    description: 'Get weather for a location',
    inputSchema: jsonSchema({
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location'],
    }),
    execute: async ({ location }) => ({ temp: 72, condition: 'sunny' }),
  },
};`,
      },
      json: {
        title: 'JSON Mode',
        description:
          'Tests for structured JSON output from models. Ensures valid JSON responses.',
      },
      streaming: {
        title: 'Streaming',
        description:
          'Tests for real-time token streaming via Server-Sent Events (SSE).',
      },
      thinking: {
        title: 'Thinking/Reasoning',
        description:
          'Tests for extended reasoning capabilities with GPT-5.1 Thinking and Perplexity Sonar Reasoning Pro.',
      },
      'web-search': {
        title: 'Web Search',
        description:
          'Tests for internet search capabilities with Perplexity models.',
      },
      text: {
        title: 'Text Generation',
        description:
          'Tests for basic text generation with Morph models via the gateway.',
      },
    },
  },
  'api-tests': {
    name: 'API Tests',
    description: 'Full Layers API endpoint integration tests',
    icon: Server,
    fileIds: ['layers-api', 'layers-api-quick'],
    documentation: {
      auth: {
        title: 'Authentication',
        description:
          'Tests for API key validation, format checking, and rejection of invalid keys.',
        example: `curl -X POST https://api.layers.dev/v1/chat \\
  -H "Authorization: Bearer lyr_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "anthropic/claude-sonnet-4.5", "messages": [...]}'`,
      },
      credits: {
        title: 'Credits System',
        description:
          'Tests for credit tracking, usage reporting, and token counting in responses.',
      },
      'rate-limits': {
        title: 'Rate Limiting',
        description:
          'Tests for rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset).',
      },
      text: {
        title: 'Text Generation',
        description:
          'Tests for basic chat completions with Claude, GPT-4o, Perplexity, and Morph models.',
      },
      streaming: {
        title: 'Streaming',
        description:
          'Tests for SSE streaming format through the Layers API.',
      },
      tools: {
        title: 'Tool Calling',
        description:
          'Tests for function calling through the Layers API with Claude and GPT-4o.',
      },
      json: {
        title: 'JSON Mode',
        description:
          'Tests for structured JSON output through the Layers API.',
      },
      thinking: {
        title: 'Extended Thinking',
        description:
          'Tests for reasoning capabilities including GPT-5.1-thinking and Claude with anthropic options.',
      },
      vision: {
        title: 'Vision',
        description:
          'Tests for image input processing through the Layers API.',
      },
      'web-search': {
        title: 'Web Search',
        description:
          'Tests for Perplexity web search capabilities through the Layers API.',
      },
      caching: {
        title: 'Prompt Caching',
        description:
          'Tests for prompt caching parameter support with Anthropic models.',
      },
      validation: {
        title: 'Request Validation',
        description:
          'Tests for proper validation of missing model, messages, and malformed requests.',
      },
      compatibility: {
        title: 'OpenAI Compatibility',
        description:
          'Tests for OpenAI-compatible response format and health check endpoint.',
      },
    },
  },
  'image-tests': {
    name: 'Image Tests',
    description: 'Image generation model tests',
    icon: Image,
    fileIds: ['image-generation'],
    documentation: {
      'image-gen': {
        title: 'Image Generation',
        description:
          'Tests for image generation capabilities including Gemini Flash Image, Gemini Pro Image, Flux models, and Imagen.',
        example: `import { experimental_generateImage } from 'ai';

const result = await experimental_generateImage({
  model: gateway('google/gemini-2.5-flash-image'),
  prompt: 'A futuristic city at sunset',
  size: '1024x1024',
});`,
      },
    },
  },
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pass':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Pass
        </span>
      );
    case 'fail':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          Fail
        </span>
      );
    case 'skip':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <MinusCircle className="h-3 w-3" />
          Skip
        </span>
      );
    default:
      return null;
  }
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const config = CATEGORY_CONFIG[params.category];

  if (!config) {
    notFound();
  }

  // Get all tests for this category's files
  const tests: TestCase[] = [];
  for (const fileId of config.fileIds) {
    tests.push(...getTestsByFile(fileId));
  }

  // Group tests by their category
  const testsByCategory: Record<string, TestCase[]> = {};
  for (const test of tests) {
    if (!testsByCategory[test.category]) {
      testsByCategory[test.category] = [];
    }
    testsByCategory[test.category].push(test);
  }

  // Get test files info
  const files = TEST_FILES.filter((f) => config.fileIds.includes(f.id));

  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{config.name}</h1>
          <p className="text-lg text-muted-foreground">{config.description}</p>
        </div>
      </div>

      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <div className="font-mono text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {file.description}
                  </div>
                </div>
                <div className="text-sm font-medium text-primary">
                  {file.testCount} tests
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tests by Category */}
      {Object.entries(testsByCategory).map(([categoryId, categoryTests]) => {
        const categoryInfo = TEST_CATEGORIES.find((c) => c.id === categoryId);
        const docs = config.documentation[categoryId];

        return (
          <Card key={categoryId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {docs?.title || categoryInfo?.name || categoryId}
                  </CardTitle>
                  <CardDescription>
                    {docs?.description || categoryInfo?.description}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {categoryTests.length} tests
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Example code if available */}
              {docs?.example && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground mb-2">
                    <Code className="h-3 w-3" />
                    Example
                  </div>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{docs.example}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Test list */}
              <div className="space-y-2">
                {categoryTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {test.name}
                        </span>
                        {test.providers && test.providers.length > 0 && (
                          <div className="flex gap-1">
                            {test.providers.map((p) => (
                              <span
                                key={p}
                                className="px-1.5 py-0.5 rounded bg-muted text-xs"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {test.description}
                      </p>
                    </div>
                    <StatusBadge status={test.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Run Tests CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Run these tests</h3>
              <p className="text-sm text-muted-foreground">
                Execute {tests.length} tests interactively
              </p>
            </div>
            <Link href="/dashboard/tests/runner">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Open Test Runner
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
