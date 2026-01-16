# Layers: Infrastructure for Human-AI Coordination
## Complete Development and Strategy Document

**Mirror Factory** | January 2026

> *"Before AI can align with humanity, humans need to align with each other."*

---

## Foundational Alignment

This document serves as the definitive technical and strategic foundation for building Layers—a platform enabling human-AI coordination through six integrated components: Sessions, Ditto, Workbook, Library, Planner, and Easel. 

### Our Mission

We're not building productivity tools. We're building systems that give people their agency back.

When we think about who we're building for—our sisters, our mothers, our partners, our friends—we don't want them working to the bone every day. But they're capable people. They have ambitions. They want to create, to build, to contribute something meaningful.

**The question isn't "how do we automate their work?" The question is:**

> How do we enable agency for anyone—not to replace their work, but to amplify their capacity to create, build, and pursue what matters to them?

### The Scientific Hypothesis

> We believe AI can shift people from **context drowning** to **context authoring**—enabling them to direct work through unified personal context rather than fragmented tool-switching, reclaiming 20% of their time while improving the quality of what they create.

Context authoring is the differentiator. Every AI company is building "agents that do work." Very few are building "agents that understand you deeply enough to do *your* work *your* way—honoring your creative choices, your preferences, your values."

### Success Criteria

We don't ask "did users complete tasks?" We ask **"do users feel like context authors—people with agency over their work and lives?"**

Three signals of transformation:

1. **User stops re-explaining themselves** — If they never have to say "as I mentioned before" or "remember when we discussed," context is working.
2. **User describes AI as "knowing them"** — Language shifts from "I told it what to do" to "it understands what I need."
3. **User reports reduced cognitive overhead** — Not just time saved, but *mental load* reduced.

---

## Architecture Foundation: Hybrid Monorepo

*Per MFDR-001: Repository Architecture for Mirror Factory Platform*

### Decision Summary

Mirror Factory adopts a **hybrid monorepo with NPM distribution**. Core development happens in a monorepo, while shared packages are published to NPM for external consumption.

```
INTERNAL (monorepo):                    EXTERNAL (npm install):
┌─────────────────────────┐             ┌─────────────────────────┐
│ mirror-factory/         │             │ their-app/              │
│ ├── packages/           │   publish   │ ├── package.json        │
│ │   ├── credits-sdk/ ───────────────► │ │   "@mf/credits": "^1" │
│ │   ├── auth/        ───────────────► │ │   "@mf/auth": "^1"    │
│ │   └── ai-gateway/  ───────────────► │ │   "@mf/ai-gateway"    │
│ ├── apps/               │             │ └── src/                │
│ │   ├── credits-api/    │             │                         │
│ │   └── layers/         │             │ They install small      │
│ └── experiments/        │             │ packages, not our repo  │
└─────────────────────────┘             └─────────────────────────┘
```

### Why Hybrid Monorepo?

1. **Atomic commits** for internal development—when we change the credits API, we immediately see if Layers breaks
2. **Clean external DX**—third-party developers run `npm install @mirror-factory/credits` and get a small, well-documented package
3. **R&D velocity**—spinning up a new experiment means creating a folder and adding `"@mirror-factory/credits": "workspace:*"`
4. **Scales with team**—Kyle owns Layers, Bobby owns future products, Alfonso owns Credits

### Monorepo Structure

```
mirror-factory/
├── package.json                 # Root workspace config
├── pnpm-workspace.yaml          # Defines workspace packages
├── turbo.json                   # Build orchestration
│
├── packages/                    # Shared, publishable code
│   ├── credits-sdk/             # @mirror-factory/credits (PUBLIC)
│   │   ├── package.json
│   │   ├── src/
│   │   └── README.md            # External-facing docs
│   ├── auth/                    # @mirror-factory/auth (PUBLIC)
│   ├── ai-gateway/              # @mirror-factory/ai-gateway (PUBLIC)
│   ├── user-system/             # @mirror-factory/user (PUBLIC)
│   └── internal-utils/          # Not published (private: true)
│
├── apps/                        # Deployable services (never published)
│   ├── credits-api/             # The credits backend service
│   └── layers/                  # Layers Platform
│       ├── apps/
│       │   ├── web/             # Next.js 14+ with App Router
│       │   ├── mobile/          # Capacitor wrapper
│       │   └── desktop/         # Tauri wrapper
│       └── packages/
│           ├── ui/              # Shared React components
│           ├── lib/             # Business logic, utilities
│           ├── api/             # API client, types
│           └── editor/          # TipTap configuration
│
├── experiments/                 # R&D playground (never published)
│   └── [quick proofs of concept]
│
└── docs/                        # External developer documentation
```

### Recommended Stack

| Component | Tool | Rationale |
|-----------|------|-----------|
| Package manager | pnpm | 60-80% disk savings, strict dependency isolation |
| Build orchestration | Turborepo | Simple config, excellent caching |
| Publishing | Changesets | PR-based versioning, automated changelogs |
| CI | GitHub Actions | Native monorepo support, good caching |

---

## MF Credits System & AI Gateway

The MF Credits System is foundational infrastructure that every Mirror Factory product will consume. Built with Vercel AI SDK and AI Gateway for unified AI provider management and cost control.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mirror Factory Products                       │
│         Layers │ Future Product A │ Future Product B            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     MF AI Gateway                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Credits   │  │    User     │  │   Provider  │              │
│  │   System    │  │   System    │  │   Router    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                     Vercel AI SDK                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     AI Providers                                 │
│      Anthropic │ OpenAI │ Google │ Groq │ Together              │
└─────────────────────────────────────────────────────────────────┘
```

### @mirror-factory/ai-gateway Package

The AI Gateway package provides unified AI access with built-in credits management:

```typescript
// packages/ai-gateway/src/index.ts
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText } from 'ai';
import { MFCredits } from '@mirror-factory/credits';

export interface AIGatewayConfig {
  userId: string;
  productId: string;
  defaultModel?: string;
}

export function createAIGateway(config: AIGatewayConfig) {
  const credits = new MFCredits({ userId: config.userId });
  
  return {
    async streamText(options: StreamTextOptions) {
      // Check credits before request
      const estimate = estimateTokenCost(options);
      await credits.reserve(estimate);
      
      try {
        const result = await streamText({
          model: selectModel(options.model || config.defaultModel),
          ...options,
        });
        
        // Deduct actual usage
        const usage = await result.usage;
        await credits.deduct(usage.totalTokens, options.model);
        
        return result;
      } catch (error) {
        await credits.release(estimate);
        throw error;
      }
    },
    
    async generateText(options: GenerateTextOptions) {
      // Similar pattern with credits management
    },
    
    // Model selection with cost optimization
    selectModel(taskComplexity: 'simple' | 'standard' | 'complex') {
      switch (taskComplexity) {
        case 'complex': return anthropic('claude-sonnet-4');
        case 'standard': return anthropic('claude-3-5-haiku');
        case 'simple': return openai('gpt-4.1-mini');
      }
    }
  };
}
```

### @mirror-factory/credits Package

The Credits SDK for external developers and internal use:

```typescript
// packages/credits-sdk/src/index.ts
export interface CreditBalance {
  available: number;
  reserved: number;
  used: number;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit' | 'reserve' | 'release';
  model: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class MFCredits {
  constructor(private config: { userId: string; apiKey?: string }) {}
  
  async getBalance(): Promise<CreditBalance> { /* ... */ }
  async reserve(amount: number): Promise<string> { /* ... */ }
  async deduct(tokens: number, model: string): Promise<CreditTransaction> { /* ... */ }
  async release(reservationId: string): Promise<void> { /* ... */ }
  async getUsage(period: 'day' | 'week' | 'month'): Promise<CreditTransaction[]> { /* ... */ }
}
```

### @mirror-factory/user Package

User system exportable for use across Mirror Factory products:

```typescript
// packages/user-system/src/index.ts
export interface MFUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultModel: string;
  aiResponseLength: 'concise' | 'standard' | 'detailed';
  // Product-specific preferences stored in JSONB
  productPreferences: Record<string, unknown>;
}

export class MFUserSystem {
  constructor(private supabaseClient: SupabaseClient) {}
  
  async getCurrentUser(): Promise<MFUser | null> { /* ... */ }
  async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> { /* ... */ }
  async getTeamMembers(teamId: string): Promise<MFUser[]> { /* ... */ }
}
```

### NPM Package Configuration

```json
// packages/credits-sdk/package.json
{
  "name": "@mirror-factory/credits",
  "version": "0.1.0",
  "private": false,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "test": "vitest"
  },
  "peerDependencies": {
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

### Internal Consumption (Layers)

```typescript
// apps/layers/packages/api/src/ai.ts
import { createAIGateway } from '@mirror-factory/ai-gateway';
import { MFCredits } from '@mirror-factory/credits';

// Internal: uses workspace:* reference
export const aiGateway = createAIGateway({
  userId: getCurrentUserId(),
  productId: 'layers',
  defaultModel: 'claude-sonnet-4',
});

// Use in Ditto
export async function streamDittoResponse(messages: Message[]) {
  return aiGateway.streamText({
    messages,
    system: await buildContextPrompt(),
  });
}
```

---

# Part 1: Complete Question Inventory with Default Answers

## 1.1 Product Vision & Strategy (12 Questions)

### Q1: What is the core thesis differentiating Layers from existing tools?
**Default Answer:** "Before AI can align with humanity, humans need to align with each other." Unlike productivity tools that optimize individual output (Notion, Obsidian) or enterprise-first AI search (Glean), Layers addresses **human coordination as the prerequisite** for effective AI integration. The platform captures how teams align (Sessions), builds shared understanding (Library), coordinates goals (Planner), and provides AI that serves coordination rather than replacement (Ditto).

**R&D Direction Alignment:** This directly supports the context authoring hypothesis—shifting people from context drowning to context authoring through unified personal context.

### Q2: What makes the "Infrastructure for Human-AI Coordination" positioning defensible?
**Default Answer:** Three factors create defensibility: (1) **Bottom-up data moat**—each user builds semantic knowledge that becomes more valuable over time; (2) **Coordination network effects**—teams using Sessions + Planner create shared context competitors can't replicate; (3) **Philosophical positioning**—framing around "alignment" captures the AI zeitgeist while remaining practically useful. Granola captures meetings, Glean searches enterprise data, but neither coordinates humans toward aligned goals.

### Q3: How should we prioritize the six components for MVP?
**Default Answer:** Phase 1 (Weeks 1-8): **Sessions + Workbook + Ditto (basic)**—capture meeting intelligence, enable documentation, provide AI assistance. Phase 2 (Weeks 9-14): **Library**—semantic indexing across sessions and documents. Phase 3 (Weeks 15-20): **Planner**—goal hierarchy connecting to captured context. Phase 4 (Weeks 21+): **Easel**—presentation generation from accumulated knowledge. This sequence delivers immediate value (meeting capture) while building toward the full coordination loop.

**Disney 7-Phase Alignment:** Each phase follows Blue Sky → Concept → Feasibility → Design → Production → Installation → Close-out for its features.

### Q4: Who are the primary personas and what's their entry point?
**Default Answer:** Three personas with different entry points:
- **Kyle (VP Product, "Context Architect")**: Enters via Sessions for meeting management, values Library for cross-team knowledge synthesis
- **Bob (Consultant, "Knowledge Synthesizer")**: Enters via Workbook for client documentation, values Library for project knowledge graphs
- **Alfonso (Designer, "Iterative Builder")**: Enters via Sessions for design reviews, values Easel for turning feedback into presentations

**LADI Framework Alignment:** These are people we love. When we imagine them using these tools, we ask: Would this give them agency? Would this honor their intelligence?

### Q5: What's the relationship between personal and team context?
**Default Answer:** **Personal-first, team-optional.** Users build personal Sessions, Libraries, and Plans that optionally connect to team workspaces. This enables bottom-up adoption (individual → team → organization) versus Glean's top-down deployment. RLS policies in Supabase enable: `private` (user only), `shared` (specific collaborators), `team` (workspace members), `public` (anyone with link).

### Q6: How does Layers handle the "too many AI tools" fatigue?
**Default Answer:** Layers consolidates: meeting recording (replaces Granola), note-taking (replaces Notion/Obsidian), semantic search (replaces Glean/Mem), project planning (complements Linear), and presentations (replaces basic slides). The integration between components creates value no single-purpose tool provides. Position as "one tool for the coordination loop" rather than "another AI productivity app."

**Core Insight:** The agency we're enabling comes not from automation alone—it comes from eliminating the **fragmentation tax**. Every time someone has to re-explain context to a tool, manually connect information across systems, or remember where something lives, they're paying that tax.

### Q7: What's the freemium model structure?
**Default Answer:** 
- **Free**: 20 Sessions/month, 5GB Library storage, 1000 MF Credits/month, basic Ditto (Haiku), personal use only
- **Pro ($12/user/month)**: Unlimited Sessions, 50GB storage, 10,000 MF Credits/month, full Ditto (Claude Sonnet), collaboration features
- **Team ($20/user/month)**: Shared Libraries, team Planner, 25,000 MF Credits/month, admin controls, priority support
- **Enterprise (custom)**: SSO/SAML, dedicated support, custom integrations, unlimited credits, data residency options

**MF Credits Integration:** All AI usage across Mirror Factory products deducts from the unified credit balance managed by @mirror-factory/credits.

### Q8: What metrics define success at each stage?
**Default Answer:**
- **Pre-launch**: Daily active alpha users, session completion rate, NPS
- **Launch (first 90 days)**: Weekly signups (target: 10% WoW growth), activation rate (user creates first Session within 24 hours), 7-day retention
- **Growth**: Monthly active users, viral coefficient (invites per user), free-to-paid conversion rate (target: 4%+)
- **Scale**: Net revenue retention (target: >100%), time-in-app, Library queries per user

**Transformation Metrics:** Beyond product metrics, measure whether users report feeling like "context authors" versus "context managers."

### Q9: How does Layers compete with Granola specifically?
**Default Answer:** Granola excels at meeting capture (client-side recording, AI enhancement) but stops there. Layers differentiates through the **full loop**: Sessions capture → Library indexes → Planner connects to goals → Easel presents outcomes. Granola 2.0 adds folder chat; Layers offers semantic knowledge graphs across all content. Granola lacks: speaker diarization, cross-meeting analysis, goal tracking, presentation generation. Position as "Granola + everything after the meeting."

### Q10: What's the Y Combinator pitch positioning?
**Default Answer:** "72% of your current batch is AI-powered; 50%+ are building agents. But agents can't coordinate humans—that's Layers. We're the infrastructure that makes human-AI teams work. Think Slack for AI coordination: bottom-up adoption, network effects through collaboration, building the data moat that enterprise AI needs. We're not another AI productivity tool; we're the layer between human teams and AI capabilities."

**Impossible Challenge:** Make personal context so unified and understood that people forget they ever had to context-switch—and in doing so, return them to the creative seat of their own lives.

### Q11: How does Layers handle enterprise vs. SMB differently?
**Default Answer:** **Same product, different packaging.** SMB/individuals self-serve with credit card; enterprise gets: SSO/SAML via Supabase Auth, audit logs, custom data retention policies, dedicated success manager, and optional private cloud deployment. Unlike Glean (enterprise-only), Layers maintains full feature parity in free tier—enterprises pay for security/compliance, not capabilities.

### Q12: What's the 3-year product vision?
**Default Answer:** Year 1: Core loop (Sessions → Library → Planner). Year 2: AI agents that act on coordination context (Ditto executes, not just advises). Year 3: Platform play—third-party integrations where Layers becomes the coordination layer for all work tools. 

**Ultimate Vision:** Everyone is a creator. Every person—whether they're writing code, running a company, raising a family, or crafting a presentation—brings intention to their work. Our tools should honor that, understanding that agency means choosing *how* you want to work, not just having work done for you.

---

## 1.2 Sessions Architecture (8 Questions)

### Q13: What constitutes a "Session" in Layers?
**Default Answer:** A Session is a **bounded work context container** that captures: (1) Meeting recording + transcription (if applicable), (2) Real-time notes/artifacts, (3) Participant list and roles, (4) Linked Library items and Planner goals, (5) AI-generated summaries and action items. Sessions can be meetings (with recording) or async work sessions (no recording). Each Session has: title, date, participants, duration, tags, and privacy level.

### Q14: How does client-side meeting recording work?
**Default Answer:** Like Granola: capture system audio via browser/native APIs without joining meeting as a bot. Implementation:
```javascript
// MediaRecorder API
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: { deviceId: 'system' } // Requires Capacitor/Tauri native plugin
});
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
```
Desktop (Tauri): Use system audio APIs via Rust plugin. Mobile (Capacitor): Limited—requires accessibility permissions. Web: Chrome tab capture API for browser-based meetings.

### Q15: What transcription service should Layers use?
**Default Answer:** **AssemblyAI** for primary transcription. Rationale: 5.65% WER (excellent accuracy), built-in speaker diarization (up to 50 speakers), included features (auto chapters, sentiment, PII redaction), SOC 2 Type 2 compliance. Pricing: $0.0025/min batch, ~$2.50/hour of meetings. Alternative: Deepgram for cost-sensitive scenarios ($0.0043/min) or self-hosted WhisperX for privacy-critical deployments.

### Q16: How does speaker diarization integrate with transcription?
**Default Answer:** AssemblyAI provides diarization automatically. Post-processing pipeline:
1. Upload audio to AssemblyAI with `speaker_labels: true`
2. Receive transcript with speaker segments
3. User maps speakers to participants (if not auto-detected via calendar integration)
4. Store transcript with speaker attribution in Supabase
5. Index speaker-attributed segments in Library for "what did Kyle say about X?" queries

### Q17: How are Sessions linked to Library and Planner?
**Default Answer:** Bidirectional linking:
- **Session → Library**: Auto-index transcript, notes, extracted entities (people, topics, decisions)
- **Session → Planner**: Action items extracted by Ditto link to Goals; Sessions can be tagged to Projects
- **Library → Session**: Search results link back to source Sessions with timestamps
- **Planner → Session**: Goals track which Sessions informed them

### Q18: What's the session privacy/sharing model?
**Default Answer:** Four levels:
- **Private**: Only creator sees; encrypted at rest
- **Participants**: Auto-shared with meeting attendees (via calendar integration)
- **Team**: All workspace members can view
- **Public**: Shareable link (with optional password)

RLS policy example:
```sql
CREATE POLICY "Session access" ON sessions FOR SELECT
USING (
  user_id = auth.uid() OR
  auth.uid() = ANY(participants) OR
  (team_id IS NOT NULL AND team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))
);
```

### Q19: How does real-time session collaboration work?
**Default Answer:** During active Sessions, use Supabase Realtime:
- **Presence**: Show who's viewing/editing (green dots, cursor positions)
- **Broadcast**: Sync live notes between participants
- **DB Changes**: Instant updates when Session data changes

For collaborative note-taking within Sessions, integrate with Workbook via Yjs for CRDT-based real-time editing. PartyKit handles Yjs document sync.

### Q20: What happens to Sessions after meetings end?
**Default Answer:** Post-meeting pipeline:
1. **Processing**: Transcription completes (~1.5x real-time)
2. **Enhancement**: Ditto generates summary, action items, key decisions (deducts MF Credits)
3. **Indexing**: Content auto-indexed in Library (embeddings generated)
4. **Linking**: Action items suggested for Planner goal connections
5. **Notification**: Participants notified with shareable summary link

---

## 1.3 Ditto/AI Layer (10 Questions)

### Q21: What is Ditto's core role in Layers?
**Default Answer:** Ditto is the **AI context partner** that assists coordination, not just productivity. Key capabilities: (1) Meeting summarization and action extraction, (2) Cross-session analysis ("What did we decide about X across all meetings?"), (3) Goal progress tracking against Planner items, (4) Document drafting from Library context, (5) Presentation generation for Easel. Ditto is present everywhere but tailored per component.

**Context Authoring Role:** Ditto understands your preferences, your style, your values—amplifying your creative choices rather than flattening them into generic optimization.

### Q22: What AI model should Ditto use?
**Default Answer:** Using MF AI Gateway with Vercel AI SDK:
- **Claude Sonnet 4 as primary** (best reasoning quality, excellent for synthesis)
- **Claude Haiku 3.5 for fast/simple tasks** (cheap, fast)
- **GPT-4.1-mini as fallback** (reliability)

```typescript
import { createAIGateway } from '@mirror-factory/ai-gateway';

const gateway = createAIGateway({ userId, productId: 'layers' });

// Automatic model selection based on task complexity
const result = await gateway.streamText({
  model: gateway.selectModel('complex'), // → claude-sonnet-4
  messages,
  system: contextPrompt,
});
```

### Q23: How does Ditto access user context?
**Default Answer:** Context hierarchy:
1. **Immediate**: Current Session/document being viewed
2. **Recent**: Last 7 days of user activity
3. **Relevant**: Library items semantically similar to current context
4. **Full**: User's complete Library (for cross-context queries)

Use RAG pattern: query pgvector for relevant chunks → inject as context → generate response. Prompt caching (Anthropic) for system prompts = 90% cost reduction on repeated context.

### Q24: How should Ditto handle multi-turn conversations?
**Default Answer:** Use Vercel AI SDK's `useChat` hook with message persistence:
```typescript
// Server: Route handler
export async function POST(req) {
  const { messages } = await req.json();
  const gateway = createAIGateway({ userId: getUserId(req), productId: 'layers' });
  
  const result = await gateway.streamText({
    messages,
    system: await buildContextPrompt(userId), // Cached system prompt
  });
  return result.toTextStreamResponse();
}

// Client: React component
const { messages, input, handleSubmit } = useChat({
  api: '/api/ditto/chat',
  body: { sessionId }, // Include current context
});
```

### Q25: What tools should Ditto have access to?
**Default Answer:** MCP-compatible tools:
- `search_library`: Query Library semantically
- `get_session`: Retrieve Session details/transcript
- `get_planner_goals`: Fetch goals and progress
- `create_action_item`: Add items to Planner
- `draft_document`: Create Workbook document from context
- `web_search`: External research (via Perplexity/Tavily)
- `calendar`: Access user's calendar (via Google/MS integration)

### Q26: How does Ditto personalize to each user?
**Default Answer:** Three personalization layers:
1. **Preferences**: Stored in @mirror-factory/user system (response length, formality, default actions)
2. **Patterns**: Learned from interaction history (topics of interest, common queries)
3. **Context**: Real-time Library and Session context

```typescript
import { MFUserSystem } from '@mirror-factory/user';

const userSystem = new MFUserSystem(supabase);
const user = await userSystem.getCurrentUser();
const prefs = user.preferences.productPreferences.layers;

// Apply preferences to Ditto system prompt
const systemPrompt = buildDittoPrompt(prefs);
```

### Q27: What's the cost model for Ditto at scale?
**Default Answer:** Conservative estimate for active user (10 Ditto interactions/day):
- Average: 2,000 input tokens, 500 output tokens per interaction
- Monthly: 600K input, 150K output tokens per user
- With 80% prompt caching: ~$0.45/user/month (Claude Sonnet)
- Without caching: ~$2.25/user/month

At 10,000 MAU with 20% heavy users: ~$2,000/month AI costs. Scale linearly; implement usage caps via MF Credits system.

**Credits Mapping:** 1 MF Credit ≈ 100 tokens. Free tier gets 1000 credits/month (~10K tokens of AI usage).

### Q28: How does Ditto differ across components?
**Default Answer:**
- **Sessions**: Summarize, extract actions, identify decisions
- **Workbook**: Draft, edit, expand, format content
- **Library**: Search, synthesize, answer questions across context
- **Planner**: Progress tracking, goal suggestions, priority recommendations
- **Easel**: Generate slides, suggest visualizations, refine presentations

Same underlying model via AI Gateway, different system prompts and tool availability per context.

### Q29: Should Ditto use agents or simple tool calling?
**Default Answer:** **Start with simple tool calling**, graduate to agents for complex workflows. Vercel AI SDK 5's `stopWhen` and `prepareStep` enable agent-like behavior without LangGraph complexity:
```typescript
const result = await generateText({
  model: gateway.selectModel('complex'),
  tools: dittoTools,
  stopWhen: [stepCountIs(5), hasToolCall('complete')],
  prepareStep: async ({ stepNumber }) => {
    if (stepNumber > 2) return { model: gateway.selectModel('simple') }; // Downgrade for efficiency
  },
});
```
Consider LangGraph only if Ditto needs persistent multi-agent orchestration (e.g., research agent + writing agent + review agent).

### Q30: How does Ditto handle errors and hallucinations?
**Default Answer:** Multi-layer protection:
1. **Grounding**: Always cite Library sources; include "Source: [Session name, timestamp]"
2. **Confidence**: For factual claims, use uncertainty language when confidence is low
3. **Verification**: User can click any claim to see source context
4. **Fallback**: If no relevant context found, acknowledge limitation before responding
5. **Rate limiting**: MF Credits system prevents abuse with per-user limits

---

## 1.4 Workbook/Editor (8 Questions)

### Q31: What editor framework should Workbook use?
**Default Answer:** **TipTap** built on ProseMirror. Rationale: 34K GitHub stars, best-in-class Yjs collaboration support, extensive extension library, TypeScript-first. Implementation:
```typescript
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

const ydoc = new Y.Doc();
const editor = new Editor({
  extensions: [
    StarterKit,
    Collaboration.configure({ document: ydoc }),
  ],
});
```

### Q32: How does Workbook handle Notion-style blocks?
**Default Answer:** Use TipTap's node system with custom extensions:
- **Paragraph, Heading, List**: StarterKit defaults
- **Code Block**: `@tiptap/extension-code-block-lowlight`
- **Image**: `@tiptap/extension-image` + Supabase Storage
- **Embed**: Custom node for Sessions, Library items, URLs
- **Table**: `@tiptap/extension-table`
- **AI Block**: Custom node for Ditto-generated content (visually distinct)

### Q33: How does real-time collaboration work in Workbook?
**Default Answer:** Yjs + PartyKit architecture:
1. Each document = Yjs Y.Doc
2. PartyKit room per document (edge-hosted, global latency ~50ms)
3. TipTap Collaboration extension syncs editor state
4. Supabase stores periodic snapshots and final state
5. Cursor positions via y-presence

```typescript
// PartyKit server
export default class DocumentRoom implements Party.Server {
  ydoc: Y.Doc;
  async onConnect(conn: Party.Connection) {
    // Sync Yjs state to new connection
  }
}
```

### Q34: How does versioning work in Workbook?
**Default Answer:** Leverage Yjs for versioning:
- **Auto-save**: Every keystroke synced via CRDT
- **Snapshots**: Periodic `Y.encodeStateAsUpdate()` stored in Supabase
- **History view**: Render previous snapshots with diff highlighting
- **Named versions**: User can save named snapshots ("v1 Final Draft")
- **Branching**: Create new Y.Doc forked from snapshot for draft alternatives

### Q35: How does Ditto integrate with Workbook editing?
**Default Answer:** Multiple integration points:
- **Slash commands**: Type `/` to invoke Ditto for generation
- **Selection actions**: Select text → "Improve with Ditto" popup
- **AI Blocks**: Insert Ditto-generated content as distinct blocks
- **Chat sidebar**: Contextual Ditto conversation about current document
- **Auto-suggestions**: Inline completions (opt-in, like Copilot)

All AI features deduct from MF Credits via the AI Gateway.

### Q36: How are Workbook documents indexed for Library?
**Default Answer:** Real-time indexing pipeline:
1. On save/significant change, trigger Supabase Edge Function
2. Extract text content from Y.Doc
3. Chunk into ~500 token segments with overlap
4. Generate embeddings via OpenAI text-embedding-3-small
5. Store in `document_chunks` table with pgvector
6. Update `documents` metadata table

Index update frequency: debounced, max every 30 seconds during active editing.

### Q37: What export formats does Workbook support?
**Default Answer:**
- **Markdown**: Native (TipTap exports to MD)
- **HTML**: TipTap `editor.getHTML()`
- **PDF**: Server-side render via Puppeteer/Playwright
- **DOCX**: pandoc conversion from Markdown
- **Notion import**: Support Notion export format

### Q38: How does Workbook handle offline editing?
**Default Answer:** Yjs + IndexedDB:
1. Store Y.Doc updates in IndexedDB (`y-indexeddb` provider)
2. User can edit offline; changes persist locally
3. On reconnection, Yjs automatically merges with server state
4. Conflict resolution is automatic (CRDT guarantees)
5. Show sync status indicator in UI

---

## 1.5 Library/Context Layer (8 Questions)

### Q39: How does Library semantic search work?
**Default Answer:** Hybrid search combining vector + full-text:
```sql
-- Hybrid search function
CREATE FUNCTION search_library(query_embedding vector(384), query_text text)
RETURNS TABLE(id uuid, content text, similarity float, fts_rank float) AS $$
SELECT id, content,
  1 - (embedding <=> query_embedding) as similarity,
  ts_rank(fts, plainto_tsquery(query_text)) as fts_rank
FROM library_items
WHERE fts @@ plainto_tsquery(query_text)
  OR (embedding <=> query_embedding) < 0.3
ORDER BY (similarity * 0.7 + fts_rank * 0.3) DESC
LIMIT 20;
$$ LANGUAGE sql;
```

### Q40: What embedding model should Library use?
**Default Answer:** **OpenAI text-embedding-3-small** (384 dimensions). Rationale: excellent quality/cost ratio at $0.02/1M tokens, 384 dimensions sufficient for retrieval (reduces storage), well-supported. Alternative: Cohere embed-v3 for multilingual needs. Store embeddings in pgvector with HNSW index for fast similarity search.

### Q41: How does Library handle different content types?
**Default Answer:** Content type handlers:
- **Sessions**: Chunk transcript by speaker turns or time windows
- **Workbook docs**: Chunk by heading sections or ~500 tokens
- **Uploads**: PDF text extraction → chunking, images → OCR + description via vision model
- **Web clips**: Extract main content, store with source URL
- **Slack/email imports**: Thread-based chunking

Each chunk stores: `content`, `embedding`, `source_type`, `source_id`, `metadata` (timestamp, author, tags).

### Q42: How does Library connect to external data sources?
**Default Answer:** MCP servers for integrations:
- **Google Drive**: Official Anthropic MCP server
- **Slack**: MCP server for channel history
- **GitHub**: Repository and issue indexing
- **Email**: Gmail API integration

Pattern: MCP server provides `list_files`, `get_content` tools → Ditto orchestrates retrieval → content indexed in Library. User authorizes connections via OAuth; data pulled on-demand or scheduled sync.

### Q43: How does Library handle knowledge graphs beyond vectors?
**Default Answer:** Entity extraction layer on top of vector search:
1. Extract entities (people, companies, topics) via NER (Claude or SpaCy)
2. Store in `entities` table with relationships
3. Build graph edges from co-occurrence and explicit mentions
4. Query: "Show me everything about [entity]" = entity lookup + vector search

For MVP, focus on vector search; add knowledge graph as enhancement.

### Q44: What's the Library privacy model?
**Default Answer:** Items inherit source privacy:
- Session chunks → Session privacy level
- Document chunks → Document privacy level
- User can't search across team Libraries without team membership
- Separate vector indices per privacy level (performance optimization)

### Q45: How does Library handle deduplication?
**Default Answer:** Multi-layer dedup:
1. **Exact**: Hash content; skip if hash exists
2. **Near-duplicate**: If vector similarity > 0.95 to existing chunk, merge or skip
3. **Source-aware**: Same source + overlapping content = update existing chunk
4. **User-controlled**: Allow duplicate imports with source attribution

### Q46: What are Library's storage and performance limits?
**Default Answer:**
- **Free tier**: 5GB storage, ~50K chunks, query latency <500ms
- **Pro tier**: 50GB storage, ~500K chunks
- **Performance**: pgvector HNSW handles millions of vectors; partition by user_id at scale
- **Cost**: Supabase Pro ($25/month) includes 8GB database, sufficient for thousands of users

---

## 1.6 Planner/Strategic Canvas (6 Questions)

### Q47: What is Planner's hierarchical structure?
**Default Answer:** Three-level hierarchy:
- **Mission**: Overarching purpose (1 per workspace, rarely changes)
- **Goals**: Quarterly/annual objectives (OKR-style, ~3-7 active)
- **Projects**: Tactical work packages (linked to Goals, ~10-20 active)
- **Tasks**: Individual action items (within Projects or standalone)

Data model:
```typescript
interface Goal {
  id: string;
  title: string;
  mission_id: string;
  progress: number; // 0-100
  due_date: Date;
  linked_sessions: string[];
  child_projects: Project[];
}
```

### Q48: How does Planner connect to Sessions and Library?
**Default Answer:** Bidirectional linking:
- **Session → Planner**: Action items extracted by Ditto suggested for Goal/Project linking
- **Library → Planner**: Relevant context surfaces when viewing Goals (similar content)
- **Planner → Session**: Goals track which Sessions informed them; progress updates linked to meeting evidence
- **Search**: "What progress have we made on [Goal]?" queries Sessions and Library

### Q49: What canvas library should Planner use?
**Default Answer:** **tldraw SDK**. Rationale: React-first, extensive customization, built-in collaboration via Yjs, WebGL rendering, MIT license (with watermark; remove via business license). Implementation:
```jsx
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

function PlannerCanvas({ goalData }) {
  return (
    <Tldraw>
      {/* Custom shapes for Goals, Projects, connections */}
    </Tldraw>
  );
}
```

### Q50: How does Planner handle timeline/roadmap views?
**Default Answer:** Multiple view modes:
- **Canvas**: Free-form spatial arrangement (default)
- **Timeline**: Horizontal time axis with Goals/Projects positioned by date
- **List**: Traditional hierarchical list view
- **Board**: Kanban-style by status (Not Started, In Progress, Complete)

Store positions/layout per view; user can switch without losing arrangement.

### Q51: How does Ditto assist with Planner?
**Default Answer:**
- **Goal suggestions**: Based on Session patterns ("You've discussed X in 5 meetings; create a Goal?")
- **Progress tracking**: Summarize evidence of progress from Sessions/Library
- **Priority recommendations**: Based on due dates, dependencies, recent activity
- **Weekly review**: Auto-generated digest of Planner status with Session context

### Q52: How does Planner collaboration work?
**Default Answer:** Real-time via Yjs (same as Workbook):
- Canvas state synced across collaborators
- Cursor positions visible
- Comments on Goals/Projects (stored in Supabase)
- Permissions: View, Comment, Edit roles per workspace

---

## 1.7 Easel/Presentation Layer (4 Questions)

### Q53: What approach should Easel use for slide generation?
**Default Answer:** MDX-based with custom renderer:
1. Store slides as MDX (Markdown + JSX components)
2. Custom React renderer based on mdx-deck patterns
3. Ditto generates MDX from Workbook/Library content
4. User edits in WYSIWYG or code view

```markdown
# Q4 Strategy Review
---
import { Chart } from './components/Chart'

## Revenue Progress
<Chart data={revenueData} />

Key insight: **43% growth** driven by enterprise expansion
---
# Next Steps
- Expand sales team (linked to Goal: Sales Hiring)
- Launch new product line
```

### Q54: How does Easel connect to Library and Workbook?
**Default Answer:**
- **Generate from Workbook**: Select document sections → "Create presentation" → Ditto generates slides
- **Generate from Library**: Query-based ("Create presentation about Q4 results") → Ditto synthesizes from relevant Library content
- **Embed Library items**: Insert charts, quotes, session highlights as components
- **Bidirectional**: Presentation links back to sources; updates reflect changes

### Q55: What export formats does Easel support?
**Default Answer:**
- **HTML**: Native web presentation (shareable link)
- **PDF**: Server-side render via Playwright
- **PPTX**: pptxgenjs library for native PowerPoint
- **Images**: PNG/JPEG per slide for social sharing

### Q56: How does presentation mode work?
**Default Answer:** Full-screen presenter view with:
- Slide navigation (keyboard, touch, clicker support)
- Speaker notes (second window option)
- Timer and progress indicator
- Audience view URL for live sharing
- Recording mode (capture with voiceover → generate video)

---

## 1.8 Technical Architecture (10 Questions)

### Q57: What is the overall system architecture?
**Default Answer:**
```
┌─────────────────────────────────────────────────────────────────┐
│              Frontend (Next.js App Router)                       │
├─────────┬─────────┬─────────┬─────────┬─────────┬───────────────┤
│Sessions │Workbook │ Library │ Planner │  Easel  │    Ditto      │
│         │(TipTap) │         │(tldraw) │         │               │
└────┬────┴────┬────┴────┬────┴────┬────┴────┬────┴───────┬───────┘
     └─────────┴─────────┴─────────┴─────────┴────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              State Layer                                         │
│  Zustand (UI) │ TanStack Query (Server) │ Yjs (CRDT)            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              MF Shared Infrastructure (@mirror-factory/*)        │
│     AI Gateway │ Credits System │ User System │ Auth            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              Realtime Layer                                      │
│      PartyKit (Yjs Sync) │ Supabase Realtime (Presence)         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              Supabase Backend                                    │
│ PostgreSQL + pgvector │ Auth │ Storage │ Edge Functions         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│              External Services                                   │
│ AssemblyAI │ Claude API │ OpenAI Embeddings │ Vercel AI SDK     │
└─────────────────────────────────────────────────────────────────┘
```

### Q58: How does the monorepo structure look?
**Default Answer:** Per MFDR-001, Layers lives within the Mirror Factory hybrid monorepo:

```
mirror-factory/
├── packages/                    # Shared, publishable NPM packages
│   ├── credits-sdk/             # @mirror-factory/credits (PUBLIC)
│   ├── auth/                    # @mirror-factory/auth (PUBLIC)
│   ├── ai-gateway/              # @mirror-factory/ai-gateway (PUBLIC)
│   └── user-system/             # @mirror-factory/user (PUBLIC)
│
├── apps/
│   └── layers/                  # Layers Platform (sub-monorepo)
│       ├── apps/
│       │   ├── web/             # Next.js 14+ with App Router
│       │   ├── mobile/          # Capacitor wrapper
│       │   └── desktop/         # Tauri wrapper
│       ├── packages/
│       │   ├── ui/              # Shared React components (shadcn/ui based)
│       │   ├── lib/             # Business logic, utilities
│       │   ├── api/             # API client, types, Supabase client
│       │   ├── editor/          # TipTap configuration and extensions
│       │   └── config/          # Shared ESLint, TypeScript, Tailwind
│       └── supabase/            # Migrations, seed data, Edge Functions
│
└── experiments/                 # R&D playground
```

**Internal consumption:**
```json
// apps/layers/packages/api/package.json
{
  "dependencies": {
    "@mirror-factory/credits": "workspace:*",
    "@mirror-factory/ai-gateway": "workspace:*",
    "@mirror-factory/user": "workspace:*"
  }
}
```

### Q59: How does authentication work?
**Default Answer:** Supabase Auth integrated with @mirror-factory/auth package:
- **Social providers**: Google, GitHub, Microsoft (OAuth)
- **Magic link**: Email-based passwordless
- **Enterprise**: SAML/SSO via Supabase Auth (Team/Enterprise tier)

JWT tokens stored in HTTP-only cookies; RLS policies enforce authorization. Session refresh handled automatically by Supabase client.

```typescript
import { MFAuth } from '@mirror-factory/auth';

const auth = new MFAuth(supabase);
const user = await auth.getCurrentUser();
const credits = await user.getCreditsBalance();
```

### Q60: How does the API layer work?
**Default Answer:** Next.js Route Handlers + MF packages:
```typescript
// app/api/sessions/route.ts
import { createClient } from '@/lib/supabase/server';
import { MFCredits } from '@mirror-factory/credits';

export async function GET() {
  const supabase = createClient();
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  return Response.json({ sessions });
}
```

For AI operations, use MF AI Gateway with Vercel AI SDK streaming.

### Q61: How does file storage work?
**Default Answer:** Supabase Storage with buckets:
- `recordings/`: Audio files from Sessions (private, RLS)
- `uploads/`: User-uploaded files (PDFs, images)
- `exports/`: Generated exports (PDFs, PPTX)
- `avatars/`: User profile images (public)

Signed URLs for secure, time-limited access to private files.

### Q62: How does the real-time system handle scale?
**Default Answer:** Two-tier architecture:
- **PartyKit (CRDT sync)**: Edge-hosted Yjs rooms; handles document collaboration with ~50ms global latency; auto-scales per Cloudflare Durable Objects
- **Supabase Realtime (presence/ephemeral)**: PostgreSQL-based; handles presence, typing indicators, notifications

At scale: partition PartyKit rooms by document; Supabase Realtime handles up to 10,000 concurrent connections on Pro plan.

### Q63: What's the error handling and monitoring strategy?
**Default Answer:**
- **Error tracking**: Sentry for frontend + backend errors
- **Logging**: Vercel Logs for serverless; structured JSON for searchability
- **Uptime monitoring**: Checkly or Better Uptime for endpoint health
- **Performance**: Vercel Analytics + custom metrics to PostHog
- **AI monitoring**: Token usage, latency, error rates via MF Credits system logging

### Q64: How does database schema evolution work?
**Default Answer:** Supabase Migrations:
```bash
# Create migration
supabase migration new add_sessions_table

# Apply locally
supabase db reset

# Push to production
supabase db push
```

Use Supabase Branching for preview environments per PR. Schema changes reviewed via migration diffs.

### Q65: What caching strategy should Layers use?
**Default Answer:** Multi-level caching:
- **CDN**: Vercel Edge Cache for static assets
- **API**: TanStack Query with staleTime/cacheTime configuration
- **AI**: Anthropic prompt caching for system prompts (90% cost reduction)
- **Search**: Cache frequent Library queries in Redis (Upstash) or Supabase

### Q66: How does Layers handle rate limiting?
**Default Answer:**
- **API**: Vercel rate limiting via middleware (100 req/min per user)
- **AI**: MF Credits system enforces per-user limits (credits exhausted = blocked)
- **Search**: Rate limit expensive vector queries (10/min)
- **Implementation**: Upstash Redis for distributed rate limiting + MF Credits for AI

---

## 1.9 UX/UI Design (8 Questions)

### Q67: What design system should Layers use?
**Default Answer:** **shadcn/ui** as foundation. Rationale: Copy-paste components (not npm dependency), Tailwind-based, highly customizable, Radix primitives for accessibility. Extend with custom components for domain-specific UI (Session cards, Goal nodes, etc.).

### Q68: What are the core UI patterns needed?
**Default Answer:**
- **Command palette**: Cmd+K for universal search/actions (cmdk library)
- **Keyboard shortcuts**: Extensive shortcuts with visible hints
- **Panels**: Resizable split views (Session + Workbook + Ditto)
- **Navigation**: Sidebar with component switching
- **Contextual menus**: Right-click and hover actions

### Q69: What wireframes are missing and needed?
**Default Answer:** Based on existing wireframes (Welcome, Planner, Workbook), needed:
1. **Library standalone**: Search interface, results list, detail view
2. **Easel**: Slide editor, presenter view, export dialog
3. **Session management**: List view, detail view, recording controls
4. **Ditto full view**: Conversation panel, context sidebar
5. **Settings**: Account, workspace, integrations, AI preferences, credits usage
6. **Mobile layouts**: All components adapted for phone/tablet
7. **Meeting recording UI**: Recording indicator, transcription progress
8. **Onboarding flow**: First-run experience, workspace setup
9. **Empty states**: Each component when no content exists
10. **Error states**: Offline, API errors, permission denied, credits exhausted

### Q70: How should mobile UI differ from desktop?
**Default Answer:**
- **Navigation**: Bottom tab bar (mobile) vs sidebar (desktop)
- **Panels**: Full-screen views with back navigation (mobile) vs split panels (desktop)
- **Gestures**: Swipe for navigation, pull-to-refresh
- **Safe areas**: Respect iPhone notch, Android navigation bar
- **Touch targets**: Minimum 44px tap targets

Use responsive Tailwind classes; conditionally render components based on viewport.

### Q71: What accessibility requirements must Layers meet?
**Default Answer:** WCAG 2.1 AA compliance:
- **Keyboard navigation**: All actions keyboard-accessible
- **Screen readers**: Proper ARIA labels (shadcn/ui handles basics)
- **Color contrast**: 4.5:1 minimum ratio
- **Focus indicators**: Visible focus states
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Testing**: axe-core integration in Playwright tests

### Q72: How does dark mode work?
**Default Answer:** System preference + manual toggle:
```typescript
// Tailwind config
darkMode: 'class',

// Theme provider
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```
Store preference in @mirror-factory/user system for cross-device consistency.

### Q73: What's the information architecture?
**Default Answer:**
- **Workspace level**: Mission, team settings, shared Libraries
- **Personal level**: My Sessions, My Documents, My Goals
- **Component level**: Sessions, Workbook, Library, Planner, Easel
- **Item level**: Individual session, document, library item, goal

Navigation: Workspace selector → Component tabs → Item views

### Q74: How should Layers handle loading states?
**Default Answer:**
- **Skeleton screens**: For initial loads (show structure immediately)
- **Spinners**: For actions (button loading states)
- **Progress bars**: For long operations (transcription, export)
- **Optimistic updates**: For CRUD operations (TanStack Query mutations)
- **Streaming**: For AI responses (show text as it generates)

---

## 1.10 Meeting Recording Integration (6 Questions)

### Q75: What's the recording architecture?
**Default Answer:** Client-side capture (like Granola):
- **Desktop (Tauri)**: System audio capture via native Rust plugins
- **Mobile (Capacitor)**: Microphone capture (system audio limited by iOS/Android)
- **Web**: Tab capture API for browser meetings; fallback to microphone

Store raw audio temporarily, process through AssemblyAI, delete original after successful transcription.

### Q76: How does Layers integrate with virtual meeting platforms?
**Default Answer:** Passive capture (no bots joining):
- **Zoom/Meet/Teams**: Capture system audio output
- **Calendar integration**: Auto-detect meetings from Google/Microsoft Calendar
- **One-click start**: "Record this meeting" notification at meeting start time
- **No API integration required**: Works with any meeting platform

### Q77: How does speaker diarization map to participants?
**Default Answer:** Two-stage process:
1. **AssemblyAI diarization**: Returns speaker_0, speaker_1, etc.
2. **Speaker identification**: User maps speakers to known participants (from calendar), OR voice matching against previous sessions (future enhancement)

Store speaker mappings; suggest based on calendar attendees and voice profile history.

### Q78: How does in-person meeting recording work?
**Default Answer:** Microphone capture with considerations:
- **Device placement**: Prompt user for optimal mic position
- **Multiple speakers**: Recommend dedicated conference mic (Jabra, Owl)
- **Diarization accuracy**: Lower for in-person (overlapping speech); warn user
- **Privacy**: Prompt for consent confirmation before recording in-person

### Q79: How does Layers handle recording privacy and consent?
**Default Answer:**
- **Consent prompt**: Before first recording, explain what's captured
- **Notification**: Visual indicator during active recording
- **Participant awareness**: Encourage user to notify meeting participants
- **Data handling**: Audio deleted after processing; transcript stored per user's retention settings
- **Enterprise controls**: Admins can disable recording, set retention policies

### Q80: What's the transcription processing pipeline?
**Default Answer:**
1. **Capture**: Client records audio in webm/opus format
2. **Upload**: Chunked upload to Supabase Storage (progress indicator)
3. **Submit**: Edge Function submits to AssemblyAI
4. **Process**: ~1.5x real-time; webhook on completion
5. **Store**: Transcript with speaker labels and timestamps to Supabase
6. **Index**: Generate embeddings, add to Library
7. **Enhance**: Ditto generates summary, action items (deducts MF Credits)
8. **Notify**: Push notification to user with summary link

---

# Part 2: Architecture Decision Records (ADRs)

## ADR-001: Next.js as Primary Framework

**Status:** Accepted

**Context:** Layers requires a web-first framework that supports SSR, excellent DX, and can power all 7 target platforms through Capacitor and Tauri wrappers.

**Decision:** Adopt Next.js 14+ with App Router as the primary framework.

**Rationale:**
- **Largest React ecosystem**: Access to TipTap, tldraw, and thousands of libraries
- **Server Components**: Reduce client bundle, improve performance
- **Flexible rendering**: SSR, SSG, ISR per-route as needed
- **Vercel integration**: Native deployment, AI SDK, analytics
- **Cross-platform**: Next.js app can be wrapped by Capacitor/Tauri with minimal changes

**Alternatives Considered:**
- **Remix**: Better web standards, but smaller ecosystem and less Vercel optimization
- **SvelteKit**: Best performance, but team would need to learn Svelte; smaller component ecosystem
- **Nuxt**: Locked to Vue ecosystem

**Consequences:**
- Team must learn App Router patterns (different from Pages Router)
- Some libraries may not fully support Server Components
- Vercel becomes preferred hosting (though not required)

---

## ADR-002: Capacitor for Mobile

**Status:** Accepted

**Context:** Need to ship iOS and Android apps with maximum code reuse from web codebase.

**Decision:** Use Capacitor to wrap the Next.js web app for mobile platforms.

**Rationale:**
- **95-100% code reuse**: Web app becomes mobile app
- **Web developer friendly**: No new language/framework to learn
- **Native access**: Full native API access via plugins
- **Progressive enhancement**: PWA fallback for instant access

**Alternatives Considered:**
- **React Native**: Better native performance, but requires separate codebase (70-90% reuse), new paradigms
- **Flutter**: Excellent performance, but requires Dart (50-70% reuse), different UI paradigm

**Consequences:**
- Performance is WebView-based (adequate for productivity apps, may limit animation-heavy features)
- Some native plugins may need custom development
- iOS app review may require native-feeling navigation patterns

---

## ADR-003: Tauri for Desktop

**Status:** Accepted

**Context:** Need desktop apps for Mac, Windows, and Linux with native performance.

**Decision:** Use Tauri 2.x for desktop application wrappers.

**Rationale:**
- **10-30x smaller bundles**: ~2.5MB vs ~85MB (Electron)
- **5-10x less memory**: ~30-50MB vs ~150-300MB (Electron)
- **Security**: Capability-based permissions, Rust backend
- **Native system integration**: Menu bar, notifications, file system
- **Cross-platform**: Single codebase for all desktop OSes

**Alternatives Considered:**
- **Electron**: Larger ecosystem, consistent Chromium rendering, but significantly larger bundles and memory usage

**Consequences:**
- Different WebView engines per OS (WebKit on Mac, Edge WebView2 on Windows) may cause rendering inconsistencies
- Rust knowledge needed for custom native plugins
- Longer build times due to Rust compilation

---

## ADR-004: Supabase as Backend

**Status:** Accepted

**Context:** Need a backend providing auth, database, real-time, storage, and serverless functions.

**Decision:** Use Supabase as the primary backend platform.

**Rationale:**
- **All-in-one**: Auth, PostgreSQL, Realtime, Storage, Edge Functions
- **PostgreSQL power**: Full SQL, JSONB, pgvector for AI features
- **Row Level Security**: Authorization logic in database
- **Open source**: No vendor lock-in; can self-host if needed
- **Generous free tier**: 500MB DB, 1GB storage, 50K MAU

**Alternatives Considered:**
- **Firebase**: NoSQL limitations, no full SQL, Google lock-in
- **PlanetScale**: Great DB, but no auth/storage/realtime (would need multiple services)
- **Custom (AWS/GCP)**: Maximum flexibility, but significant DevOps overhead

**Consequences:**
- Learn PostgreSQL and RLS patterns
- Some features (branching) are newer and evolving
- Edge Functions have cold start latency

---

## ADR-005: MF AI Gateway with Vercel AI SDK

**Status:** Accepted

**Context:** Need unified AI layer supporting multiple models, streaming, tool calling, cost management, and excellent DX across all Mirror Factory products.

**Decision:** Build @mirror-factory/ai-gateway using Vercel AI SDK, integrated with @mirror-factory/credits for usage tracking and billing.

**Rationale:**
- **Vercel AI SDK**: Unified API across providers, streaming, tool calling, React hooks (useChat), TypeScript-first
- **Exportable package**: Other MF products and external developers can consume via NPM
- **Credits integration**: Automatic token tracking, usage limits, billing
- **Claude Sonnet 4**: Best reasoning quality, excellent for synthesis, 200K context, prompt caching (90% cost reduction)
- **Provider flexibility**: Can switch models per task (Haiku for simple, GPT-4.1-mini for fallback)

**Architecture:**
```typescript
// Unified model selection with credits management
import { createAIGateway } from '@mirror-factory/ai-gateway';

const gateway = createAIGateway({ userId, productId: 'layers' });

const result = await gateway.streamText({
  model: gateway.selectModel('complex'), // claude-sonnet-4
  system: systemPrompt, // Cached via Anthropic
  tools: mcpTools,
});
// Credits automatically deducted based on token usage
```

**Alternatives Considered:**
- **LangChain/LangGraph**: More orchestration features, but adds complexity; defer until multi-agent patterns needed
- **OpenAI Assistants API**: Deprecated August 2026; avoid building on it
- **Direct provider SDKs**: More control, but no unified interface or credits integration

**Consequences:**
- Primary AI costs tied to Anthropic pricing
- Need to implement prompt caching for cost efficiency
- Monitor for rate limits and implement fallbacks
- External developers get same AI capabilities via NPM package

---

## ADR-006: Real-Time Collaboration Approach

**Status:** Accepted

**Context:** Workbook and Planner require real-time collaborative editing.

**Decision:** Use Yjs (CRDT) with PartyKit for document sync, Supabase Realtime for presence.

**Rationale:**
- **Yjs**: Most popular CRDT library (900K weekly downloads), excellent editor integrations (TipTap, tldraw)
- **PartyKit**: Edge-hosted Yjs rooms (~50ms global latency), acquired by Cloudflare, integrates with Yjs out-of-box
- **Supabase Realtime**: Already in stack; use for presence, cursors, notifications (not document sync)

**Architecture:**
- Each document = Yjs Y.Doc
- PartyKit room per document handles CRDT sync
- Supabase stores periodic snapshots for persistence
- Supabase Realtime Broadcast for ephemeral state (cursors, typing)

**Alternatives Considered:**
- **Liveblocks**: Managed solution with pre-built components, but vendor lock-in and scaling costs
- **Supabase Realtime only**: Not designed for CRDT sync; would need custom conflict resolution

**Consequences:**
- PartyKit dependency (mitigated by Cloudflare backing)
- Need to handle persistence (Yjs → Supabase snapshots)
- Two realtime systems to manage (PartyKit + Supabase)

---

## ADR-007: Testing Strategy

**Status:** Accepted

**Context:** Need comprehensive testing across web, mobile, and desktop platforms.

**Decision:** Three-tier testing strategy: Playwright (E2E), Storybook (components), Vitest (unit/integration).

**Testing Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                 E2E Tests (Playwright)              │
│  - Critical user journeys across platforms          │
│  - Visual regression (screenshots)                  │
│  - Cross-browser (Chrome, Safari, Firefox)          │
│  - Mobile viewports                                 │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│               Component Tests (Storybook)           │
│  - Isolated component rendering                     │
│  - Visual testing (Chromatic optional)              │
│  - Interaction testing (play functions)             │
│  - Documentation                                    │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│             Unit/Integration (Vitest)               │
│  - Business logic                                   │
│  - API routes                                       │
│  - Supabase queries (mocked or test DB)            │
│  - AI tool functions                                │
│  - MF package integration tests                     │
└─────────────────────────────────────────────────────┘
```

**Rationale:**
- **Playwright**: Best cross-browser E2E, mobile emulation, visual testing built-in
- **Storybook**: Component isolation, documentation, visual testing via Chromatic
- **Vitest**: Fast, ESM-native, compatible with Next.js

**Consequences:**
- Significant test infrastructure to maintain
- Need clear guidelines on what to test at each level
- CI/CD must run all test types (potentially parallelized)

---

# Part 3: Implementation Roadmap

## Phase 1: Foundation (Weeks 1-4)

### Week 1-2: Infrastructure Setup
- [ ] Mirror Factory monorepo structure with Turborepo + pnpm
- [ ] @mirror-factory/credits package scaffold
- [ ] @mirror-factory/ai-gateway package with Vercel AI SDK
- [ ] @mirror-factory/user package scaffold
- [ ] Layers sub-monorepo within apps/layers/
- [ ] Next.js 14 App Router project
- [ ] Supabase project with auth, initial schema
- [ ] Vercel deployment with preview environments
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Design system (shadcn/ui) installation

### Week 3-4: Core Components
- [ ] Authentication flow (social + magic link) via @mirror-factory/auth
- [ ] Basic layout (sidebar, navigation)
- [ ] Workbook MVP (TipTap without collaboration)
- [ ] Ditto chat interface (MF AI Gateway + Claude)
- [ ] Credits display and usage tracking

## Phase 2: Sessions MVP (Weeks 5-8)

### Week 5-6: Recording Infrastructure
- [ ] Client-side audio capture (web)
- [ ] AssemblyAI integration
- [ ] Transcription storage and display
- [ ] Basic Session CRUD

### Week 7-8: Session Intelligence
- [ ] Speaker diarization display
- [ ] Ditto summarization (via AI Gateway)
- [ ] Action item extraction
- [ ] Session list and detail views
- [ ] Credits deduction for AI features

## Phase 3: Library & Collaboration (Weeks 9-14)

### Week 9-10: Library Foundation
- [ ] pgvector setup with embeddings
- [ ] Document indexing pipeline
- [ ] Basic semantic search UI
- [ ] Session-to-Library linking

### Week 11-12: Real-Time Collaboration
- [ ] Yjs + PartyKit integration
- [ ] TipTap collaborative editing
- [ ] Presence indicators
- [ ] Version history

### Week 13-14: Library Enhancement
- [ ] Hybrid search (vector + full-text)
- [ ] Cross-content queries via Ditto
- [ ] Upload and web clip support

## Phase 4: Planner & Cross-Platform (Weeks 15-20)

### Week 15-16: Planner MVP
- [ ] tldraw canvas integration
- [ ] Goal/Project hierarchy
- [ ] Session linking to Goals
- [ ] Basic views (canvas, list)

### Week 17-18: Cross-Platform
- [ ] Capacitor mobile wrapper
- [ ] Tauri desktop wrapper
- [ ] Platform-specific UI adjustments
- [ ] Beta testing on all platforms

### Week 19-20: Polish & Launch Prep
- [ ] Onboarding flow
- [ ] Settings and preferences (via @mirror-factory/user)
- [ ] Performance optimization
- [ ] Documentation
- [ ] NPM package publishing for @mirror-factory/* packages

## Phase 5: Easel & Scale (Weeks 21+)

### Week 21-24: Easel MVP
- [ ] MDX slide format
- [ ] Ditto presentation generation
- [ ] Presenter mode
- [ ] Export (PDF, PPTX)

### Ongoing: Growth Features
- [ ] Team workspaces
- [ ] Integrations (Google Drive, Slack)
- [ ] Advanced Planner views
- [ ] Enterprise features (SSO, audit)

---

# Part 4: Key Technical Specifications

## Database Schema (Core Tables)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free', -- free, pro, team, enterprise
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MF Credits
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  available INT DEFAULT 1000, -- Free tier default
  reserved INT DEFAULT 0,
  used_this_period INT DEFAULT 0,
  period_start TIMESTAMPTZ DEFAULT now(),
  period_end TIMESTAMPTZ DEFAULT (now() + interval '1 month'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  amount INT NOT NULL,
  type TEXT NOT NULL, -- debit, credit, reserve, release
  model TEXT,
  product_id TEXT, -- layers, future-product, etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_seconds INT,
  participants TEXT[], -- Array of participant names/emails
  transcript JSONB, -- Speaker-attributed segments
  summary TEXT,
  action_items JSONB,
  recording_url TEXT,
  privacy TEXT DEFAULT 'private', -- private, participants, team, public
  team_id UUID REFERENCES teams,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documents (Workbook)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  content JSONB, -- TipTap/Y.Doc serialized
  privacy TEXT DEFAULT 'private',
  team_id UUID REFERENCES teams,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Library Items (for semantic search)
CREATE TABLE library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  source_type TEXT NOT NULL, -- session, document, upload, web_clip
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(384),
  metadata JSONB, -- timestamp, speaker, section, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for vector search
CREATE INDEX library_items_embedding_idx ON library_items 
USING hnsw (embedding vector_cosine_ops);

-- Goals (Planner)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  progress INT DEFAULT 0, -- 0-100
  parent_id UUID REFERENCES goals, -- For hierarchy
  team_id UUID REFERENCES teams,
  position JSONB, -- Canvas position {x, y}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
```

## API Structure

```
/app
├── /api
│   ├── /sessions
│   │   ├── route.ts           # GET all, POST new
│   │   └── /[id]
│   │       └── route.ts       # GET, PUT, DELETE single
│   ├── /documents
│   │   ├── route.ts
│   │   └── /[id]/route.ts
│   ├── /library
│   │   ├── /search/route.ts   # POST semantic search
│   │   └── /ingest/route.ts   # POST index content
│   ├── /goals
│   │   ├── route.ts
│   │   └── /[id]/route.ts
│   ├── /ditto
│   │   ├── /chat/route.ts     # POST streaming chat (via AI Gateway)
│   │   └── /summarize/route.ts
│   ├── /credits
│   │   ├── /balance/route.ts  # GET current balance
│   │   └── /usage/route.ts    # GET usage history
│   └── /transcription
│       └── /webhook/route.ts  # AssemblyAI callback
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (via MF AI Gateway)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Transcription
ASSEMBLYAI_API_KEY=

# PartyKit
NEXT_PUBLIC_PARTYKIT_HOST=

# Vercel
VERCEL_URL=

# MF Platform
MF_PRODUCT_ID=layers
```

---

# Part 5: Competitive Positioning Summary

| Feature | Layers | Granola | Glean | Notion | Obsidian |
|---------|--------|---------|-------|--------|----------|
| Meeting Recording | ✅ Client-side | ✅ Best-in-class | ❌ | ⚠️ New | ❌ Plugin |
| AI Assistant | ✅ Ditto | ✅ GPT-4o | ✅ Agents | ✅ Notion AI | ❌ Plugin |
| Semantic Search | ✅ Library | ⚠️ Single meeting | ✅ Enterprise | ⚠️ Basic | ❌ Plugin |
| Goal Planning | ✅ Planner | ❌ | ❌ | ⚠️ Databases | ❌ Plugin |
| Presentations | ✅ Easel | ❌ | ❌ | ❌ | ❌ |
| Bottom-up GTM | ✅ | ✅ | ❌ Enterprise-only | ✅ | ✅ |
| Offline-first | ⚠️ Planned | ❌ | ❌ | ⚠️ New | ✅ |
| Cross-platform | ✅ 7 platforms | ⚠️ 4 | Web only | ✅ | ✅ |
| Pricing Entry | Free | Free (25 meetings) | Enterprise ($50+/user) | Free | Free |
| Unified Credits | ✅ MF Credits | ❌ | ❌ | ❌ | ❌ |

**Layers' Unique Position:** Complete coordination loop (capture → knowledge → goals → present) with bottom-up adoption, powered by the MF Credits system that enables transparent AI usage across all features. No competitor offers this integrated approach with exportable infrastructure packages.

---

# Part 6: Risk Assessment and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI costs exceed revenue | Medium | High | MF Credits system with usage caps, prompt caching, tiered limits |
| Cross-platform bugs | High | Medium | Comprehensive E2E testing, platform-specific QA |
| Transcription accuracy issues | Medium | Medium | User correction UI, multi-provider fallback |
| Competition (Granola expansion) | Medium | High | Move fast on Library + Planner differentiation |
| Supabase limitations | Low | High | Architecture allows migration; standard Postgres |
| User adoption friction | Medium | High | Simplified onboarding, clear value in Session 1 |
| Package adoption by external devs | Medium | Medium | Excellent docs, simple API surface, clear examples |

---

# Part 7: Guiding Principles (LADI Framework)

### Love
We build for people we love. When we imagine our mothers, our siblings, our partners using these tools, we ask: Would this give them agency? Would this honor their intelligence?

### Action
Bias toward experimentation over planning. Ship something testable every week. Context authoring is a big idea—we make it real through small, concrete experiments.

### Discovery
Research before building. Understand what "context" means to different people. Discovery means we learn their world before we design for it.

### Innovation
If our product feels like "Notion with AI" or "Linear but smarter," we've failed. We're building something different: systems that understand you deeply enough to amplify your agency, not just complete your tasks.

---

# Conclusion

This document provides the comprehensive foundation for building Layers within the Mirror Factory ecosystem. The research validates the proposed architecture while highlighting key decisions, tradeoffs, and implementation patterns.

**The recommended immediate priorities are:**

1. **Set up Mirror Factory monorepo** with Turborepo, pnpm, and the hybrid architecture from MFDR-001
2. **Build @mirror-factory/credits and @mirror-factory/ai-gateway packages** with Vercel AI SDK integration
3. **Build Sessions MVP** with client-side recording and AssemblyAI transcription
4. **Implement Ditto** using MF AI Gateway for meeting summarization
5. **Add Library foundation** with pgvector semantic search

The bottom-up GTM strategy, combined with the unique "human-AI coordination" positioning and exportable NPM packages, creates a defensible market position distinct from both Granola (meetings only) and Glean (enterprise only). The technical choices (Next.js + Supabase + Capacitor + Tauri + MF packages) enable the ambitious 7-platform target with realistic code reuse of 95%+.

**Success depends on executing the full coordination loop—meetings captured in Sessions, knowledge indexed in Library, goals tracked in Planner, outcomes presented in Easel—while the MF Credits system provides transparent, unified AI usage that external developers can also leverage.**

**This is how we enable agency for anyone—not to replace their work, but to amplify their capacity to create, build, and pursue what matters to them.**

---

*Mirror Factory • Layers Infrastructure Document • v3.0 • January 2026*
