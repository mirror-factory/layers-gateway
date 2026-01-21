import { NextRequest, NextResponse } from 'next/server';
import {
  runAllTests,
  runTestsByFile,
  runTestsByCategory,
  runSingleTest,
  getTestFiles,
  type TestRunResult,
  type TestRunSummary,
} from '@/lib/test-runner';
import { ALL_TESTS, TEST_CATEGORIES } from '@/lib/test-capabilities';

interface RunTestsRequest {
  mode: 'all' | 'file' | 'category' | 'single';
  target?: string; // file ID, category ID, or test ID
  stream?: boolean;
}

/**
 * Test Runner API
 *
 * POST /api/tests/run
 *
 * Execute tests against the Layers API
 *
 * Body:
 *   {
 *     "mode": "all" | "file" | "category" | "single",
 *     "target": "file-id" | "category-id" | "test-id", // required for file/category/single
 *     "stream": true  // optional: stream results via SSE
 *   }
 *
 * Headers:
 *   X-Layers-API-Key: Your Layers API key (optional, uses env if not provided)
 *
 * Response (non-streaming):
 *   {
 *     "total": 141,
 *     "passed": 135,
 *     "failed": 4,
 *     "skipped": 2,
 *     "errors": 0,
 *     "duration": 12345,
 *     "results": [...]
 *   }
 *
 * Response (streaming):
 *   SSE events for each test result
 */
export async function POST(request: NextRequest) {
  try {
    const body: RunTestsRequest = await request.json();
    const { mode, target, stream = false } = body;

    // Get API key from header or environment
    const apiKey = request.headers.get('X-Layers-API-Key') ||
                   process.env.LAYERS_API_KEY ||
                   'lyr_live_demo'; // Demo key for local testing
    const gatewayKey = process.env.AI_GATEWAY_API_KEY;
    // Default to localhost for local development
    const apiUrl = process.env.LAYERS_API_URL || 'http://localhost:3700';

    // Validate mode and target
    if (mode === 'file' && !target) {
      return NextResponse.json(
        { error: 'Target file ID required for file mode' },
        { status: 400 }
      );
    }

    if (mode === 'category' && !target) {
      return NextResponse.json(
        { error: 'Target category ID required for category mode' },
        { status: 400 }
      );
    }

    if (mode === 'single' && !target) {
      return NextResponse.json(
        { error: 'Target test ID required for single mode' },
        { status: 400 }
      );
    }

    // Validate file/category/test exists
    if (mode === 'file') {
      const files = getTestFiles();
      if (!files.find((f) => f.id === target)) {
        return NextResponse.json(
          { error: `Unknown file ID: ${target}`, availableFiles: files.map((f) => f.id) },
          { status: 400 }
        );
      }
    }

    if (mode === 'category') {
      if (!TEST_CATEGORIES.find((c) => c.id === target)) {
        return NextResponse.json(
          { error: `Unknown category ID: ${target}`, availableCategories: TEST_CATEGORIES.map((c) => c.id) },
          { status: 400 }
        );
      }
    }

    if (mode === 'single') {
      if (!ALL_TESTS.find((t) => t.id === target)) {
        return NextResponse.json(
          { error: `Unknown test ID: ${target}` },
          { status: 400 }
        );
      }
    }

    const options = {
      apiUrl,
      apiKey,
      gatewayKey,
      timeout: 30000,
    };

    // Streaming response
    if (stream) {
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          let summary: TestRunSummary;

          const progressHandler = (result: TestRunResult) => {
            sendEvent('test-result', result);
          };

          try {
            switch (mode) {
              case 'all':
                summary = await runAllTests({ ...options, onProgress: progressHandler });
                break;
              case 'file':
                summary = await runTestsByFile(target!, { ...options, onProgress: progressHandler });
                break;
              case 'category':
                summary = await runTestsByCategory(target!, { ...options, onProgress: progressHandler });
                break;
              case 'single':
                const result = await runSingleTest(target!, options);
                summary = {
                  total: 1,
                  passed: result.status === 'pass' ? 1 : 0,
                  failed: result.status === 'fail' ? 1 : 0,
                  skipped: result.status === 'skip' ? 1 : 0,
                  errors: result.status === 'error' ? 1 : 0,
                  duration: result.duration,
                  results: [result],
                };
                sendEvent('test-result', result);
                break;
              default:
                throw new Error(`Unknown mode: ${mode}`);
            }

            sendEvent('complete', {
              total: summary.total,
              passed: summary.passed,
              failed: summary.failed,
              skipped: summary.skipped,
              errors: summary.errors,
              duration: summary.duration,
            });
          } catch (error) {
            sendEvent('error', {
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }

          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    let summary: TestRunSummary;

    switch (mode) {
      case 'all':
        summary = await runAllTests(options);
        break;
      case 'file':
        summary = await runTestsByFile(target!, options);
        break;
      case 'category':
        summary = await runTestsByCategory(target!, options);
        break;
      case 'single':
        const result = await runSingleTest(target!, options);
        summary = {
          total: 1,
          passed: result.status === 'pass' ? 1 : 0,
          failed: result.status === 'fail' ? 1 : 0,
          skipped: result.status === 'skip' ? 1 : 0,
          errors: result.status === 'error' ? 1 : 0,
          duration: result.duration,
          results: [result],
        };
        break;
      default:
        return NextResponse.json(
          { error: `Unknown mode: ${mode}` },
          { status: 400 }
        );
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Test runner error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tests/run
 *
 * Get test runner status and available options
 */
export async function GET() {
  const files = getTestFiles();

  return NextResponse.json({
    status: 'ready',
    total_tests: ALL_TESTS.length,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      testCount: f.testCount,
    })),
    categories: TEST_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      testCount: ALL_TESTS.filter((t) => t.category === c.id).length,
    })),
    environment: {
      hasApiKey: !!process.env.LAYERS_API_KEY,
      hasGatewayKey: !!process.env.AI_GATEWAY_API_KEY,
      apiUrl: process.env.LAYERS_API_URL || 'http://localhost:3700',
      demoMode: !process.env.LAYERS_API_KEY, // Using demo key
    },
  });
}
