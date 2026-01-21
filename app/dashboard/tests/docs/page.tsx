'use client';

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
  Boxes,
  Plug,
  Server,
  Image,
  ArrowRight,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'unit-tests',
    name: 'Unit Tests',
    description: 'Model registry helper functions and data integrity tests',
    icon: Boxes,
    testCount: 67,
    files: ['helpers.test.ts (48)', 'registry.test.ts (19)'],
    highlights: [
      'getModelById, getModelsByProvider, queryModels',
      'calculateCost, calculateCredits',
      'Model schema validation',
      'Provider grouping & filtering',
    ],
  },
  {
    id: 'gateway-tests',
    name: 'Gateway Tests',
    description: 'Direct Vercel AI Gateway integration tests',
    icon: Plug,
    testCount: 18,
    files: ['gateway.test.ts (18)'],
    highlights: [
      'Provider connectivity (5 providers)',
      'Vision, Tools, JSON mode',
      'Streaming responses',
      'Thinking/reasoning models',
    ],
  },
  {
    id: 'api-tests',
    name: 'API Tests',
    description: 'Full Layers API endpoint integration tests',
    icon: Server,
    testCount: 48,
    files: ['layers-api.test.ts (39)', 'layers-api-quick.test.ts (9)'],
    highlights: [
      'Authentication & API keys',
      'Credits tracking & deduction',
      'Rate limiting headers',
      'All capabilities (text, vision, tools, etc.)',
    ],
  },
  {
    id: 'image-tests',
    name: 'Image Tests',
    description: 'Image generation model tests',
    icon: Image,
    testCount: 8,
    files: ['image-generation.test.ts (8)'],
    highlights: [
      'Gemini 2.5 Flash Image',
      'Gemini 3 Pro Image',
      'Flux models & aspect ratios',
      'Imagen multi-generation',
    ],
  },
];

export default function DocsOverviewPage() {
  const totalTests = CATEGORIES.reduce((sum, cat) => sum + cat.testCount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Documentation</h1>
        <p className="text-lg text-muted-foreground">
          Complete coverage of {totalTests} tests across the Layers platform
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-muted-foreground">Pass Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">6</div>
              <div className="text-sm text-muted-foreground">Test Files</div>
            </div>
            <div>
              <div className="text-3xl font-bold">17</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;

          return (
            <Card key={category.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.testCount} tests</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Test Files
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.files.map((file) => (
                      <span
                        key={file}
                        className="px-2 py-1 bg-muted rounded text-xs font-mono"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Highlights
                  </div>
                  <ul className="space-y-1">
                    {category.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <CheckCircle2 className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={`/dashboard/tests/docs/${category.id}`}>
                  <Button variant="ghost" className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground">
                    View Tests
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Running Tests
          </CardTitle>
          <CardDescription>
            How to run the test suite locally
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`# Navigate to the models package
cd packages/@layers/models

# Run unit tests (helpers + registry)
bun test helpers registry

# Run gateway integration tests
AI_GATEWAY_API_KEY=xxx bun test gateway

# Run API integration tests
LAYERS_API_URL=https://web-nine-sage-13.vercel.app \\
LAYERS_API_KEY=lyr_live_xxx \\
bun test layers-api

# Run quick smoke tests
bun test layers-api-quick

# Run image generation tests
bun test image-generation

# Run ALL tests
bun test`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Navigation prompt */}
      <div className="text-center text-sm text-muted-foreground">
        Select a category from the sidebar to view detailed test documentation
      </div>
    </div>
  );
}
