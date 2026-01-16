# Vercel AI Gateway Model Testing - Ralph Loop Instructions

## Mission

Test ALL 54 models through Vercel AI Gateway. Fix any failures by researching with Context7 and web search. Document everything in MODEL-REGISTRY.md.

## Environment

- **Test script:** `scripts/test-providers.ts`
- **API Key:** `AI_GATEWAY_API_KEY` environment variable
- **Central doc:** `/home/dev/repos/mirror-factory/docs/models/MODEL-REGISTRY.md`

## Research Protocol (MANDATORY)

Before fixing any failure:
1. **Context7 MCP** - Pull current Vercel AI SDK v6 docs for the provider
2. **Web Search** - Check for gateway-specific issues or model ID changes
3. **Document findings** - Add `@RALPH:RESEARCH` comments

## AI SDK v6 Critical Patterns

These MUST be followed:

```typescript
// Imports
import { generateText, streamText, Output, createGateway, jsonSchema } from 'ai';
import { z } from 'zod/v4';  // NOT 'zod'

// Tool definitions use inputSchema, NOT parameters
inputSchema: jsonSchema<{ arg: string }>({
  type: 'object',  // REQUIRED
  properties: { ... },
  required: [...],
})

// Structured output
output: Output.object({ schema: myZodSchema })
const obj = response.output;  // NOT response.object
```

## Test Commands

```bash
# Test specific provider
npx tsx scripts/test-providers.ts --provider anthropic

# Test specific capability
npx tsx scripts/test-providers.ts --capability vision

# Test all
npx tsx scripts/test-providers.ts
```

## Story Workflow

For each story:
1. Run tests for that provider/type
2. If failures: Research with Context7 + web search
3. Fix the test script or document the model limitation
4. Re-run until all pass
5. Mark story as passes: true in prd.json
6. Update REGISTRY.md with results

## Completion Criteria

- All 54 models tested
- All fixable issues resolved
- MODEL-REGISTRY.md Testing Matrix updated with actual results
- prd.json shows all stories with passes: true
