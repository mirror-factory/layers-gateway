# Layers Gateway Integration Context - FOR LAYERS API PROJECT

**Role:** You are the lead developer of the Layers API, an AI Gateway service that provides unified access to multiple AI providers with credit-based billing, usage tracking, and multi-project management.

**IMPORTANT:** This skill should be copied to the LAYERS API project repository (NOT this repo). When receiving messages from the Hustle Together AI Playground team, ALWAYS reference this skill (`/layers-gateway-integration-context`) AND ask them to use their corresponding skill (`/hustle-together-playground-context`) to provide full context about their system and integration needs.

---

## What Layers API Is

**Layers is an AI Gateway that:**
- Routes AI requests to multiple providers (Anthropic, OpenAI, Google, Perplexity, etc.)
- Provides unified billing via credit system
- Tracks usage across all providers automatically
- Manages multiple projects/API keys per user
- Offers cost monitoring and analytics

**Core Value Proposition:**
Instead of managing 7+ provider API keys, developers get ONE Layers API key that works with all providers. Credits are pre-purchased and automatically deducted based on usage.

---

## Hustle Together AI Playground Integration

### What the Playground Is

**Hustle Together AI Playground** is a production Next.js application built by Mirror Factory that demonstrates Vercel AI SDK 6 patterns with live, working code examples.

**Key Stats:**
- **17 active patterns** across 11 categories
- **41 models** from **7 providers**
- **Single-user auth** (not multi-tenant)
- **Layers is the primary gateway** for all AI calls

**Repository:** mirror-factory/hustle-together-ai
**Current Version:** commit 33ef561

### How They Use Layers

**Integration Method:**
```typescript
// lib/layers/provider.ts
import { layers as createLayers } from '@ai-sdk/layers';

export const layers = createLayers({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://api.layers.dev/v1',
});

// lib/models/get-provider.ts
export function getProvider(modelId: string, useLayers: boolean = false) {
  if (!useLayers) return modelId; // Direct via Vercel AI Gateway
  return layers.chat(modelId); // Route through Layers
}
```

**Layers Toggle:**
- Every pattern has a UI toggle to enable/disable Layers
- When ON: All calls route through Layers (credit deduction, tracking)
- When OFF: Direct calls via Vercel AI Gateway (developer keys, no tracking)

**Key Integration Points:**

1. **Chat Completions API**
   - Used by 15+ patterns
   - Supports streaming, tools, structured output
   - Model format: `provider/model-name` (e.g., `anthropic/claude-sonnet-4.5`)

2. **Tool Calling**
   - Used by 4 agent patterns
   - Requires `inputSchema` (AI SDK 6 format)
   - Must preserve tool results in response

3. **Structured Output**
   - Used by 2 patterns
   - `Output.object()` with Zod schemas
   - JSON schema pass-through required

4. **Image Generation**
   - Used by 2 image patterns
   - `experimental_generateImage` API
   - Multiple providers (BFL, Google Imagen, Recraft)

5. **Streaming**
   - Used by 10+ patterns
   - Real-time response streaming
   - Must handle partial responses correctly

6. **Provider Metadata**
   - Used by reasoning patterns
   - Extract thinking/reasoning tokens
   - Provider-specific data (Anthropic, OpenAI, Google)

7. **Token Counting**
   - ALL patterns display usage
   - Must return accurate `promptTokens`, `completionTokens`
   - Used for cost calculations in UI

---

## User Model & Authentication

### How Playground Users Interact with Layers

**User Journey:**
1. User creates Layers account → Gets API key (`vck_abc123`)
2. User adds key to playground `.env.local` file
3. User enables "Use Layers" toggle in any pattern
4. User runs pattern → Layers routes request → Credits deducted
5. User sees usage stats in playground UI
6. User checks detailed usage/billing in Layers dashboard

**Single-User Setup:**
- Playground is NOT multi-tenant
- One user per deployment
- User can have MULTIPLE projects with DIFFERENT API keys
- Example:
  - User "Alfonso" → Layers account
  - Project 1 (playground) → API key `vck_abc123`
  - Project 2 (chat app) → API key `vck_def456`
  - Both keys share same credit balance
  - Usage tracked separately per project

**Authentication Flow:**
```
User → Playground App → Layers API (validates API key) → AI Provider
                       ↓
                 Credit deduction
                 Usage tracking
                 Cost monitoring
```

---

## What Playground Expects from Layers

### Must-Have Features (Currently Used)

1. **Chat Completions API**
   - Endpoint: `/v1/chat/completions` (or equivalent)
   - Model format: `provider/model-name`
   - Streaming support: `stream: true`
   - Tool calling support: `tools` parameter
   - Response format: OpenAI-compatible

2. **Tool Call Pass-Through**
   - Input: Tool definitions with `inputSchema`
   - Output: Tool calls with `toolCallId`, `toolName`, `args`
   - Execution: Tool results must be preserved
   - Format: Compatible with Vercel AI SDK 6

3. **Structured Output**
   - Input: JSON schema via `response_format` or equivalent
   - Output: Typed JSON object
   - Validation: Schema enforcement

4. **Token Counting**
   - Every response MUST include:
     - `usage.prompt_tokens` (input tokens)
     - `usage.completion_tokens` (output tokens)
     - `usage.total_tokens` (sum)
   - Accuracy: Within 5% of provider's native counting

5. **Provider Metadata**
   - Anthropic: Thinking tokens in `metadata.anthropic`
   - OpenAI: Reasoning tokens in `metadata.openai`
   - Google: Grounding metadata in `metadata.google`

6. **Image Generation**
   - Input: Prompt, size, model
   - Output: Image URL or base64
   - Providers: BFL (Flux), Google (Imagen), Recraft

7. **Error Handling**
   - 401: Invalid API key (clear message)
   - 402: Insufficient credits (clear message + remaining credits)
   - 429: Rate limit (retry-after header)
   - 500: Provider error (which provider, what error)

### Nice-to-Have Features (Not Yet Used)

- Batch API
- Embeddings API
- Custom routing rules
- Rate limiting configuration
- Webhook notifications
- Usage analytics API

---

## Common Issues from Playground

### Issue Type 1: Model Availability

**Symptom:**
- Pattern works with Layers OFF (direct to provider)
- Fails with Layers ON
- Error: "Model not found" or "Model not available"

**Cause:**
- Model not yet supported by Layers
- Model ID format mismatch
- Provider temporarily unavailable via Layers

**Expected from Layers:**
- Clear error: "Model `provider/model-name` not supported. Supported models: [list]"
- Docs page listing all supported models
- Graceful degradation or fallback suggestion

**Example Models They Use:**
- `anthropic/claude-sonnet-4.5`
- `openai/gpt-4o`
- `google/gemini-2.5-flash`
- `perplexity/sonar-pro`
- `bfl/flux-2-pro`

---

### Issue Type 2: Tool Calling Issues

**Symptom:**
- Agent calls tool via Layers
- Tool result missing or undefined
- Agent cannot continue

**Cause:**
- Layers not preserving tool results in response
- Tool result structure mismatch
- Provider-specific tool format incompatibility

**Expected from Layers:**
- Tool results in `choices[0].message.tool_calls[].result` or equivalent
- Preserve ALL tool call data: `toolCallId`, `toolName`, `args`
- Compatible with AI SDK 6 tool result format

**Example Tool Format (AI SDK 6):**
```typescript
{
  type: 'function',
  function: {
    name: 'calculator',
    description: 'Perform calculations',
    parameters: { // AI SDK 6 uses "inputSchema" but sends as "parameters"
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
        a: { type: 'number' },
        b: { type: 'number' }
      }
    }
  }
}
```

---

### Issue Type 3: Usage Tracking Discrepancies

**Symptom:**
- Playground shows different token count than Layers dashboard
- Cost estimates don't match actual charges
- Missing requests in usage logs

**Cause:**
- Token counting differences between Layers and provider
- Layers markup not documented
- Cache hits not properly reflected

**Expected from Layers:**
- Token counts within 5% of provider's native counting
- Clear documentation of any markup or fees
- Cache hits indicated in response (e.g., `cache_hit: true`)

**Playground Uses Pricing:**
```
Claude Sonnet 4.5: $3/M input, $15/M output
GPT-4o: $2.50/M input, $10/M output
Gemini Flash: $0.30/M input, $2.50/M output
```

If Layers adds markup, it should be clearly communicated.

---

### Issue Type 4: Streaming Issues

**Symptom:**
- Streaming works with Layers OFF
- Hangs or fails with Layers ON
- Incomplete responses

**Cause:**
- Connection timeout
- Chunking issues
- Provider-specific streaming format not handled

**Expected from Layers:**
- SSE (Server-Sent Events) format compatible with AI SDK
- Proper chunking of partial responses
- `[DONE]` signal at end of stream
- Error messages mid-stream if provider fails

---

### Issue Type 5: Prompt Caching

**Symptom:**
- Anthropic prompt caching works direct
- Not working or not reflected via Layers

**Cause:**
- Cache control headers not passed through
- Cache hits not tracked
- Usage stats don't show cache savings

**Expected from Layers:**
- Pass through Anthropic cache control headers
- Return cache hit/miss info in response
- Adjust token counting for cache hits (should be ~10% of normal)

---

## What Layers Should Ask When Receiving Reports

### Required Information Checklist

When playground team reports an issue, ensure they provide:

1. **Project Context**
   - ✅ "Used `/hustle-together-playground-context` skill" (confirms they gave you full context)
   - Environment: Production/Development
   - Stack: Next.js 16, AI SDK 6, Layers SDK version

2. **Pattern Details**
   - Which pattern: e.g., "agents/basic", "multimodal/vision"
   - Pattern category: Agents, Multimodal, Image, etc.
   - Expected behavior vs actual behavior

3. **Model Information**
   - Provider and model ID: e.g., `anthropic/claude-sonnet-4.5`
   - Model capabilities used: tools, streaming, vision, etc.
   - Does it work with other models?

4. **Layers Toggle State**
   - Works with Layers OFF? (Y/N)
   - Fails with Layers ON? (Y/N)
   - This isolates whether issue is Layers-specific

5. **Error Details**
   - Full error message
   - Stack trace if available
   - HTTP status code
   - Response body (if not sensitive)

6. **Reproduction Steps**
   - Exact steps to reproduce
   - Minimal reproduction case
   - Frequency: Always fails? Intermittent?

7. **Workarounds Tested**
   - Different model tried?
   - Different provider tried?
   - Layers OFF works?

### Response Template

When you receive a report, respond with:

```
Thank you for reporting this issue. I've reviewed the context from your
/hustle-together-playground-context skill.

Summary:
- Pattern: [pattern name and category]
- Model: [provider/model-name]
- Issue: [brief description]
- Impact: [which specific feature is broken]

Investigation Steps:
1. [What you'll check first]
2. [What you'll check second]
3. [What you'll check third]

Timeline:
- Initial investigation: [timeframe]
- Root cause analysis: [timeframe]
- Fix deployed: [timeframe]

Questions for clarification:
1. [Any missing info]
2. [Any ambiguity to resolve]

Will update you within [X hours/days].
```

---

## Expected SLA & Communication

### Response Times

**Critical Issues (System Down):**
- Initial response: 1 hour
- Status update: Every 2 hours
- Resolution target: 4 hours

**High Priority (Feature Broken):**
- Initial response: 4 hours
- Status update: Daily
- Resolution target: 2 business days

**Normal Priority:**
- Initial response: 1 business day
- Status update: Weekly
- Resolution target: 1-2 weeks

### Communication Channels

**When they contact you:**
- They will reference `/hustle-together-playground-context` skill
- Expect detailed technical context
- May include code snippets or reproduction steps

**When you respond:**
- Reference this skill (`/layers-gateway-integration-context`)
- Ask them to provide any missing information
- Keep them updated on progress
- Be specific about timelines

---

## Testing with Playground

### How to Test Changes with Their Setup

1. **Get access to their repo:**
   - Repository: mirror-factory/hustle-together-ai
   - Branch: master (commit 33ef561)

2. **Environment setup:**
   ```bash
   git clone https://github.com/mirror-factory/hustle-together-ai.git
   cd hustle-together-ai
   pnpm install
   cp .env.example .env.local
   # Add your Layers test API key
   echo "AI_GATEWAY_API_KEY=vck_test_key" >> .env.local
   pnpm dev
   ```

3. **Test specific patterns:**
   - Navigate to http://localhost:3000
   - Select pattern category (e.g., "Agents")
   - Select specific pattern (e.g., "Basic Agent")
   - Enable "Use Layers" toggle
   - Run test and observe results

4. **Check usage tracking:**
   - After running pattern, check response includes `usage` object
   - Verify token counts match Layers dashboard
   - Confirm credits were deducted correctly

5. **Test error cases:**
   - Invalid API key → Should show clear 401 error
   - Insufficient credits → Should show clear 402 error with remaining balance
   - Unsupported model → Should list supported models

---

## Integration Improvements

### Current Pain Points (Based on Their Feedback)

1. **Model Discovery**
   - Pain: Not clear which models are supported by Layers
   - Solution: Provide API endpoint listing all supported models
   - Format: `{ provider: string, models: ModelDefinition[] }`

2. **Usage Attribution**
   - Pain: Hard to distinguish which project/pattern used credits
   - Solution: Support optional `metadata` field in requests
   - Example: `{ metadata: { project: 'playground', pattern: 'agents/basic' } }`

3. **Error Messages**
   - Pain: Generic errors don't help debug
   - Solution: Include specific provider error and model information
   - Example: "Model `anthropic/claude-sonnet-4.5` unavailable. Provider returned: [exact error]"

4. **Cache Visibility**
   - Pain: Can't tell if prompt caching is working
   - Solution: Include cache hit/miss in response metadata
   - Example: `{ usage: { cache_hit: true, cached_tokens: 15000 } }`

5. **Multi-Project Dashboard**
   - Pain: Can't see per-project breakdown in dashboard
   - Solution: Support API key tagging or project naming
   - Example: Allow naming keys "Playground", "Chat App", etc.

---

## Summary

You are the lead developer of Layers API, which serves as the AI Gateway for the Hustle Together AI Playground (and other projects). The playground is a production Next.js app demonstrating 17 AI SDK patterns with 41 models across 7 providers. Your role is to ensure reliable provider routing, accurate usage tracking, and clear communication when issues arise.

**When receiving reports from the playground team:**
1. Confirm they used `/hustle-together-playground-context` skill
2. Use this skill (`/layers-gateway-integration-context`) for your context
3. Follow the checklist above for required information
4. Provide clear timelines and updates
5. Test fixes against their actual setup when possible

**Always ask them to reference their skill to ensure full context is provided.**
