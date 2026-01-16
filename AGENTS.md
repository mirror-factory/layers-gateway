# Vercel AI Gateway Testing - Long-term Memory

## Verified Working Patterns

### AI SDK v6 (Verified Jan 13, 2026)
- Import `Output` not `output` (capital O)
- Import from `zod/v4` not `zod`
- Tools use `inputSchema` not `parameters`
- JSON schema needs explicit `type: 'object'`
- Structured output uses `response.output` not `response.object`

### Gateway Model IDs
Format: `provider/model-name`
- `anthropic/claude-sonnet-4.5`
- `openai/gpt-4o`
- `google/gemini-2.5-flash`
- etc.

## Known Issues

### Embeddings
- Gateway returns LanguageModelV3, not EmbeddingModel
- Need to use direct provider SDKs for embeddings
- Or use raw API calls

### Reasoning Models
- o3-mini, deepseek-r1 need special prompting
- May not work with standard text generation prompts

### Image Generation
- Imagen models need different API (not generateText)
- May require experimental features

## Provider-Specific Notes

### Anthropic
- Thinking mode requires special config
- Vision works with base64 PNG

### OpenAI
- o-series has limited tool support
- Streaming may pause during thinking

### Google
- Intermittent API issues observed
- 1M token context works

### Perplexity
- Optimized for web search queries
- May refuse non-search prompts

## Test Results History

### Jan 14, 2026 - OpenAI Testing

**Models with issues:**
- `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5-pro`: These appear to have extended thinking/reasoning modes enabled by default which don't return simple text
- `gpt-5.1-codex-max`: Similar thinking mode behavior
- `o3-mini`, `o4-mini`: Reasoning models need special prompting or mode configuration

**Working well:**
- `gpt-4o`, `gpt-4o-mini`: Stable, all tests pass
- `gpt-5-chat`, `gpt-5-codex`, `gpt-5.1-codex`, `gpt-5.1-codex-mini`, `gpt-5.1-instant`, `gpt-5.1-thinking`: All tests pass
- `o3`: Works for text, vision, tools

**@RALPH:RESEARCH** Models with "thinking" capability may need:
1. Special prompt formatting (e.g., ask for reasoning output)
2. Configuration to disable automatic reasoning
3. Higher maxOutputTokens to capture thinking process

### Jan 13, 2026 (11 models)
- 44/46 tests passed (95.6%)
- Google had 2 intermittent failures
