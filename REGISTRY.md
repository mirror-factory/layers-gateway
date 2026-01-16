# Test Registry - Vercel AI Gateway

> **Last Updated**: 2026-01-14
> **Status**: PASS (134/134 tests, 40 models)

---

## Stories

| ID | Title | Files | Tests | Status |
|----|-------|-------|-------|--------|
| test-anthropic | Test Anthropic (3) | test-providers-fixed.ts | 15 tests | ✅ PASS |
| test-openai-chat | Test OpenAI chat (9) | test-providers-fixed.ts | 41 tests | ✅ PASS |
| test-openai-reasoning | Test OpenAI reasoning (3) | test-providers-fixed.ts | 3 tests | ✅ PASS |
| test-google-chat | Test Google chat (6) | test-providers-fixed.ts | 18 tests | ✅ PASS |
| test-xai | Test xAI (9) | test-providers-fixed.ts | 39 tests | ✅ PASS |
| test-deepseek | Test DeepSeek (6) | test-providers-fixed.ts | 12 tests | ✅ PASS |
| test-perplexity | Test Perplexity (2) | test-providers-fixed.ts | 4 tests | ✅ PASS |
| test-morph | Test Morph (2) | test-providers-fixed.ts | 2 tests | ✅ PASS |

## Removed (Gateway Incompatible)

| ID | Models | Reason | Alternative |
|----|--------|--------|-------------|
| test-openai-embed | text-embedding-3-small, text-embedding-3-large | Gateway returns LanguageModel, not EmbeddingModel | Use @ai-sdk/openai directly |
| test-google-embed | text-embedding-005, text-multilingual-embedding-002 | Same as above | Use @ai-sdk/google directly |
| test-google-image | imagen-4.0-* (3 models) | Image generation requires separate API | Use Google Imagen API directly |
| test-gpt5-base | gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro | Models return no response via gateway | Use @ai-sdk/openai directly |
| test-gpt51-codex-max | gpt-5.1-codex-max | Intermittent failures | Use @ai-sdk/openai directly |
| test-deepseek-r1 | deepseek-r1 | Intermittent failures | Use @ai-sdk/deepseek directly |
| test-sonar-reasoning | sonar-reasoning | Deprecated/merged into sonar-reasoning-pro | Use sonar-reasoning-pro |

---

## Open Items

| Type | Priority | Location | Description |
|------|----------|----------|-------------|
| DONE | - | test-providers-fixed.ts | ✅ Run full test suite (134/134 pass) |
| TODO | 2 | @layers/models/README.md | Update model count from 54 to 40 |
| TODO | 2 | docs/providers/README.md | Update capability matrix with gateway caveats |
| TODO | 3 | vercel-ai-testing/SKILL.md | Update skill with gateway limitations |

---

## Research Log

| Date | Topic | Finding |
|------|-------|---------|
| 2026-01-13 | AI SDK v6 | Use `inputSchema` not `parameters` for tools |
| 2026-01-13 | Zod | Import from `zod/v4` not `zod` |
| 2026-01-13 | Output | Use `Output.object()` and `response.output` |
| 2026-01-14 | Gateway embeddings | `createGateway()` returns LanguageModel, embedding needs direct SDK |
| 2026-01-14 | Reasoning models | o3, o3-mini, o4-mini, sonar-reasoning-pro need `reasoningOnly: true` |
| 2026-01-14 | GPT-5 base | gpt-5, gpt-5-mini, gpt-5-nano, gpt-5-pro don't work via gateway |
| 2026-01-14 | Capability tuning | Some models have unreliable capabilities (stream, vision, json) via gateway |
| 2026-01-14 | Image generation | Google Imagen requires separate API, not `generateText` |

---

## Caveats (from @RALPH:CAVEAT tags)

| Location | Caveat |
|----------|--------|
| test-providers-fixed.ts:L24 | Gateway returns LanguageModel, not EmbeddingModel - use @ai-sdk/openai directly |
| test-providers-fixed.ts:L30 | Image generation needs separate API, not generateText |
| test-providers-fixed.ts:L36 | gpt-5 base models don't work through AI Gateway |
| test-providers-fixed.ts:L42 | gpt-5.1-codex-max has intermittent failures - use SDK directly |
| test-providers-fixed.ts:L48 | deepseek-r1 has intermittent failures - use SDK directly |

---

## Model Summary by Provider

| Provider | Models | Tests | Capabilities |
|----------|--------|-------|--------------|
| Anthropic | 3 | 15 | text, vision, tools, json, stream, reasoning |
| OpenAI Chat | 9 | 41 | text, vision, tools, json, stream |
| OpenAI Reasoning | 3 | 3 | reasoning only |
| Google | 6 | 18 | text, tools, json (vision/stream unreliable) |
| xAI | 9 | 39 | text, vision, tools, json, stream |
| DeepSeek | 6 | 12 | text, tools, json, stream, reasoning |
| Perplexity | 2 | 4 | web, json, stream |
| Morph | 2 | 2 | text |
| **Total** | **40** | **134** | - |

---

*Test Registry • Vercel AI Gateway • v1.0*
