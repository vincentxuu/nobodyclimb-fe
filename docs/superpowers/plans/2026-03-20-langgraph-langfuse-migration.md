# LangGraph + Langfuse AI Service Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 以 LangGraph JS 取代自製 pipeline engine，並整合 Langfuse 進行 LLM 可觀測性追蹤，同時保留現有 API 介面不變。

**Architecture:** 用 `@langchain/langgraph` `StateGraph` 重新描述現有 16 個 pipeline steps 為 LangGraph nodes；`PipelineContext` 轉成 LangGraph `Annotation` state；三種 RAG 策略（Baseline / Agentic / Plan-and-Execute）分別實作為三張 graph；每個 node 執行時自動向 Langfuse 上報 span。以 `use_langgraph_engine` feature flag 控制新舊路徑切換，確保零停機遷移。

**Tech Stack:** `@langchain/langgraph` 0.2+, `langfuse` JS SDK 3+, Cloudflare Workers AI（維持直接呼叫，不引入 LangChain model wrapper）, Cloudflare Workers `nodejs_compat`（已啟用）

---

## File Structure

```
backend/src/services/ai-graph/
├── index.ts              # GraphService：主入口，取代 pipeline/engine.ts 的呼叫點
├── state.ts              # LangGraph Annotation state（對應 PipelineContext）
├── langfuse.ts           # Langfuse client factory + span helper utilities
├── routing.ts            # 所有 conditional edge functions
├── graphs/
│   ├── baseline.ts       # Baseline strategy StateGraph
│   ├── agentic.ts        # Agentic (ReAct) StateGraph（有 cycle）
│   └── plan-execute.ts   # Plan-and-Execute StateGraph（Send API）
└── nodes/
    ├── semantic-cache.ts
    ├── tool-selection.ts
    ├── text-to-sql.ts
    ├── embedding.ts
    ├── filter-build.ts
    ├── hyde.ts
    ├── multi-query.ts
    ├── hybrid-search.ts
    ├── cross-encoder.ts
    ├── mmr.ts
    ├── popularity-rerank.ts
    ├── llm-generation.ts
    ├── judge.ts
    ├── self-reflection.ts
    └── memory-extractor.ts

backend/src/services/query/
└── index.ts              # 修改：加入 feature flag 切換至 GraphService

backend/wrangler.toml     # 加入 LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASEURL
```

**Modified files:**
- `backend/src/services/query/index.ts` — 加入 GraphService feature flag routing
- `backend/wrangler.toml` — 新增 Langfuse 環境變數設定說明（secrets via wrangler secret）
- `backend/package.json` — 新增 dependencies

---

## Task 0: Unit Tests for Routing Functions

**Files:**
- Create: `backend/src/services/ai-graph/__tests__/routing.test.ts`

每個 routing function 都是純函式（無副作用），非常適合 unit test。本 task 先把測試寫好，確認 fail，再在後續 task 實作 routing.ts 讓測試通過。

- [x] **Step 1: 建立測試檔 `backend/src/services/ai-graph/__tests__/routing.test.ts`**

```typescript
// backend/src/services/ai-graph/__tests__/routing.test.ts
import { describe, it, expect } from 'vitest';
import {
  routeAfterSemanticCache,
  routeAfterToolSelection,
  routeAfterTextToSql,
  routeAfterEmbedding,
  routeAfterJudge,
  routeAfterSelfReflection,
  routeAgenticDecision,
  routeAfterAgenticRetrieve,
} from '../routing';

const baseCfg = {
  judge_regen_quality_max: 3,
  max_pipeline_loops: 2,
  self_reflection_min_length: 50,
  agentic_max_steps: 5,
  agentic_min_docs_to_answer: 3,
  rag_strategy: 'baseline',
} as any;

describe('routeAfterSemanticCache', () => {
  it('returns END when earlyReturn is set', () => {
    const state = { earlyReturn: { answer: 'cached' } } as any;
    expect(routeAfterSemanticCache(state)).toBe('END');
  });
  it('returns toolSelection when no earlyReturn', () => {
    const state = {} as any;
    expect(routeAfterSemanticCache(state)).toBe('toolSelection');
  });
});

describe('routeAfterToolSelection', () => {
  it('returns END when earlyReturn is set', () => {
    expect(routeAfterToolSelection({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns textToSql when queryType === sql', () => {
    expect(routeAfterToolSelection({ queryType: 'sql' } as any)).toBe('textToSql');
  });
  it('returns END when queryType === clarification-needed', () => {
    expect(routeAfterToolSelection({ queryType: 'clarification-needed' } as any)).toBe('END');
  });
  it('returns llmGeneration when queryType === general-knowledge', () => {
    expect(routeAfterToolSelection({ queryType: 'general-knowledge' } as any)).toBe('llmGeneration');
  });
  it('returns filterBuild (via embedding path) for normal queries', () => {
    expect(routeAfterToolSelection({ queryType: 'vector' } as any)).toBe('filterBuild');
  });
});

describe('routeAfterTextToSql', () => {
  it('returns END (clarification/error) when earlyReturn is set', () => {
    expect(routeAfterTextToSql({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns llmGeneration when sqlCandidates has results', () => {
    expect(routeAfterTextToSql({ sqlCandidates: [{ id: 1 }] } as any)).toBe('llmGeneration');
  });
  it('returns embedding when sqlCandidates is empty (fallback)', () => {
    expect(routeAfterTextToSql({ sqlCandidates: [] } as any)).toBe('embedding');
  });
  it('returns embedding when sqlCandidates is undefined (fallback)', () => {
    expect(routeAfterTextToSql({} as any)).toBe('embedding');
  });
});

describe('routeAfterEmbedding', () => {
  it('returns hybridSearch when embeddingFailed', () => {
    expect(routeAfterEmbedding({ embeddingFailed: true } as any)).toBe('hybridSearch');
  });
  it('returns hyde when embedding succeeds', () => {
    expect(routeAfterEmbedding({} as any)).toBe('hyde');
  });
});

describe('routeAfterJudge', () => {
  it('returns selfReflection when quality is low and under loop limit', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 2,
      loopCount: 0,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('selfReflection');
  });
  it('returns memoryExtractor when quality is good', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 5,
      loopCount: 0,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('memoryExtractor');
  });
  it('returns memoryExtractor when loop limit reached', () => {
    const state = {
      pipelineConfig: baseCfg,
      quality: 2,
      loopCount: 2,
      context: 'x'.repeat(100),
    } as any;
    expect(routeAfterJudge(state)).toBe('memoryExtractor');
  });
});

describe('routeAfterSelfReflection', () => {
  it('returns hybridSearch when loopBack.targetPhase === retrieval', () => {
    const state = { loopBack: { targetPhase: 'retrieval' } } as any;
    expect(routeAfterSelfReflection(state)).toBe('hybridSearch');
  });
  it('returns llmGeneration when no loopBack', () => {
    expect(routeAfterSelfReflection({} as any)).toBe('llmGeneration');
  });
  it('returns llmGeneration when loopBack.targetPhase is not retrieval', () => {
    const state = { loopBack: { targetPhase: 'generation' } } as any;
    expect(routeAfterSelfReflection(state)).toBe('llmGeneration');
  });
});

describe('routeAgenticDecision', () => {
  it('returns END when earlyReturn is set', () => {
    expect(routeAgenticDecision({ earlyReturn: { answer: 'x' } } as any)).toBe('END');
  });
  it('returns llmGeneration when lastAgenticAction === ANSWER', () => {
    expect(routeAgenticDecision({ trace: { lastAgenticAction: 'ANSWER' } } as any)).toBe('llmGeneration');
  });
  it('returns agenticRetrieve otherwise', () => {
    expect(routeAgenticDecision({ trace: { lastAgenticAction: 'RETRIEVE' } } as any)).toBe('agenticRetrieve');
  });
});

describe('routeAfterAgenticRetrieve', () => {
  it('returns llmGeneration when max steps reached', () => {
    const state = { pipelineConfig: baseCfg, loopCount: 5, candidateMatches: [] } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('llmGeneration');
  });
  it('returns llmGeneration when enough docs', () => {
    const state = {
      pipelineConfig: baseCfg,
      loopCount: 1,
      candidateMatches: [{}, {}, {}],
    } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('llmGeneration');
  });
  it('returns agenticDecision when under limits', () => {
    const state = {
      pipelineConfig: baseCfg,
      loopCount: 1,
      candidateMatches: [{}],
    } as any;
    expect(routeAfterAgenticRetrieve(state)).toBe('agenticDecision');
  });
});
```

- [x] **Step 2: 執行測試，確認全部 fail（routing.ts 尚未實作）**

```bash
cd backend && pnpm vitest run src/services/ai-graph/__tests__/routing.test.ts
```

Expected: All tests fail with "Cannot find module '../routing'"

- [x] **Step 3: commit**

```bash
git add backend/src/services/ai-graph/__tests__/routing.test.ts
git commit -m "test(ai): add unit tests for all LangGraph routing functions (TDD red phase)"
```

---

## Task 1: 安裝依賴 & Langfuse 基礎設定

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/wrangler.toml`
- Create: `backend/src/services/ai-graph/langfuse.ts`

- [x] **Step 1: 安裝 packages**

```bash
cd backend
pnpm add @langchain/langgraph langfuse
```

- [x] **Step 2: 確認安裝成功，檢查 node_modules**

```bash
ls node_modules/@langchain/langgraph/package.json
ls node_modules/langfuse/package.json
```

Expected: 兩個 `package.json` 都存在，`@langchain/langgraph` version ≥ 0.2.0

- [x] **Step 3: 在 wrangler.toml 加入 Langfuse 環境變數說明（preview & production）**

在 `[env.preview.vars]` 和 `[env.production.vars]` 區塊末尾加入：

```toml
# Langfuse Observability - Set via wrangler secret:
# wrangler secret put LANGFUSE_PUBLIC_KEY --env preview
# wrangler secret put LANGFUSE_SECRET_KEY --env preview
# wrangler secret put LANGFUSE_BASEURL --env preview
# LANGFUSE_BASEURL 預設為 https://cloud.langfuse.com，如使用 self-hosted 才需設定
```

- [x] **Step 4: 更新 `backend/src/types/index.ts`（或對應 Env 型別檔）加入 Langfuse 環境變數型別**

找到 `Env` interface，加入：

```typescript
LANGFUSE_PUBLIC_KEY?: string;
LANGFUSE_SECRET_KEY?: string;
LANGFUSE_BASEURL?: string;
```

- [x] **Step 5: 建立 `backend/src/services/ai-graph/langfuse.ts`**

> **注意**：Cloudflare Workers 是 request-scoped，模組層級的 singleton 會在不同請求之間共享狀態，導致 trace 串到錯誤的請求。`getLangfuseClient` 每次呼叫都應建立全新實例，不要快取。

```typescript
import { Langfuse, LangfuseTraceClient, LangfuseSpanClient } from 'langfuse';
import { Env } from '../../types';

/** 每次請求建立一個新的 Langfuse client 實例（request-scoped）
 *  env 不含 keys 時回傳 null（靜默降級）
 */
export function getLangfuseClient(env: Env): Langfuse | null {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) return null;
  return new Langfuse({
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    secretKey: env.LANGFUSE_SECRET_KEY,
    baseUrl: env.LANGFUSE_BASEURL ?? 'https://cloud.langfuse.com',
    flushAt: 10,
    flushInterval: 5000,
  });
}

/** 建立一個新 trace，代表一次完整的 AI 問答請求 */
export function createTrace(
  langfuse: Langfuse | null,
  opts: {
    name: string;
    userId?: string;
    sessionId?: string;
    input: unknown;
    metadata?: Record<string, unknown>;
  },
): LangfuseTraceClient | null {
  if (!langfuse) return null;
  return langfuse.trace({
    name: opts.name,
    userId: opts.userId,
    sessionId: opts.sessionId,
    input: opts.input,
    metadata: opts.metadata,
  });
}

/** 在 trace 下建立一個 span，代表一個 pipeline node 的執行 */
export function startSpan(
  trace: LangfuseTraceClient | null,
  name: string,
  input?: unknown,
): LangfuseSpanClient | null {
  if (!trace) return null;
  return trace.span({ name, input });
}

/** 結束一個 span，記錄輸出與 metadata */
export function endSpan(
  span: LangfuseSpanClient | null,
  opts: {
    output?: unknown;
    metadata?: Record<string, unknown>;
    level?: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR';
  } = {},
): void {
  if (!span) return;
  span.end({
    output: opts.output,
    metadata: opts.metadata,
    level: opts.level,
  });
}

/** 強制 flush，在 Cloudflare Workers waitUntil 中呼叫 */
export async function flushLangfuse(langfuse: Langfuse | null): Promise<void> {
  if (!langfuse) return;
  await langfuse.flushAsync();
}
```

- [x] **Step 6: typecheck 通過**

```bash
cd backend
pnpm typecheck
```

Expected: 0 errors（如有 Langfuse type 問題，確認 `langfuse` package 包含 TypeScript types）

- [x] **Step 7: commit**

```bash
git add backend/package.json backend/pnpm-lock.yaml backend/wrangler.toml backend/src/services/ai-graph/langfuse.ts
git commit -m "feat(ai): install langgraph + langfuse, add langfuse client utility"
```

---

## Task 2: 定義 LangGraph State

**Files:**
- Create: `backend/src/services/ai-graph/state.ts`

LangGraph state 是 `PipelineContext` 的超集——直接重用現有型別，LangGraph 以 `Annotation.Root` 包裝，確保 reducer 行為。

- [x] **Step 1: 建立 `backend/src/services/ai-graph/state.ts`**

```typescript
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { PipelineContext } from '../pipeline/types';
import { LangfuseTraceClient } from 'langfuse';

/**
 * LangGraph Graph State
 *
 * 直接繼承 PipelineContext 的所有欄位，以 Annotation.Root 描述。
 * 每個 node 回傳 Partial<GraphState>，LangGraph 以 last-write-wins
 * 策略合併（預設 reducer），符合原本 pipeline 行為。
 */
export const GraphStateAnnotation = Annotation.Root({
  // ---------- 直接對應 PipelineContext 的所有欄位 ----------
  // 使用 Annotation<T>() 讓 LangGraph 知道型別，不指定 reducer 表示 last-write-wins
  env: Annotation<PipelineContext['env']>(),
  request: Annotation<PipelineContext['request']>(),
  userId: Annotation<string | undefined>(),
  pipelineConfig: Annotation<PipelineContext['pipelineConfig']>(),
  prompts: Annotation<Record<string, string>>(),
  gatewayOptions: Annotation<PipelineContext['gatewayOptions']>(),
  trace: Annotation<Record<string, unknown>>({
    reducer: (a, b) => ({ ...a, ...b }), // trace 欄位做 merge
  }),
  tokenBreakdown: Annotation<PipelineContext['tokenBreakdown']>({
    reducer: (a, b) => ({ ...a, ...b }),
  }),
  queryService: Annotation<PipelineContext['queryService']>(),
  startTime: Annotation<number>(),

  // 快取
  cacheKey: Annotation<string>(),
  cacheTtl: Annotation<number>(),
  recentHistory: Annotation<PipelineContext['recentHistory']>(),
  isAnonymousNoHistory: Annotation<boolean>(),
  earlyQueryVector: Annotation<number[] | null>(),

  // Pre-retrieval
  queryType: Annotation<PipelineContext['queryType']>(),
  effectiveLlmModel: Annotation<string | undefined>(),
  parsedQuery: Annotation<PipelineContext['parsedQuery']>(),
  toolConfidence: Annotation<number>(),
  fallbackEnabled: Annotation<boolean>(),
  alternativeTool: Annotation<string | undefined>(),
  hydeDoc: Annotation<string | undefined>(),
  expandedQueries: Annotation<string[] | undefined>(),
  vectorFilter: Annotation<Record<string, unknown> | undefined>(),
  queryVector: Annotation<number[] | undefined>(),
  hydeVector: Annotation<number[] | null | undefined>(),
  expandedVectors: Annotation<number[][] | undefined>(),

  // Text-to-SQL
  sqlTemplate: Annotation<string | undefined>(),
  sqlParams: Annotation<Record<string, unknown> | undefined>(),
  clarificationType: Annotation<'intent' | 'missing-crag' | undefined>(),
  sqlCandidates: Annotation<Array<Record<string, unknown>> | undefined>(),
  sqlContext: Annotation<string | undefined>(),

  // Similar route
  isSimRouteSearch: Annotation<boolean | undefined>(),
  excludeRouteId: Annotation<string | null | undefined>(),
  referenceRouteInfo: Annotation<string | null | undefined>(),

  // 預載資料
  preloadedCrags: Annotation<PipelineContext['preloadedCrags']>(),
  preloadedAreas: Annotation<PipelineContext['preloadedAreas']>(),

  // Retrieval
  candidateMatches: Annotation<PipelineContext['candidateMatches']>(),
  documents: Annotation<PipelineContext['documents']>(),
  retrievalScore: Annotation<number | undefined>(),

  // Post-retrieval
  scoredCandidates: Annotation<PipelineContext['scoredCandidates']>(),
  rerankedMatches: Annotation<PipelineContext['rerankedMatches']>(),
  sources: Annotation<PipelineContext['sources']>(),
  context: Annotation<string | undefined>(),

  // Generation
  rawAnswer: Annotation<string | undefined>(),
  answer: Annotation<string | undefined>(),
  suggestedQuestions: Annotation<string[] | undefined>(),
  parsedAnswer: Annotation<string | undefined>(),

  // Evaluation
  groundedness: Annotation<number | null | undefined>(),
  quality: Annotation<number | null | undefined>(),

  // 流程控制
  earlyReturn: Annotation<PipelineContext['earlyReturn']>(),
  finalResponse: Annotation<PipelineContext['finalResponse']>(),
  streamingMode: Annotation<boolean | undefined>(),
  onToken: Annotation<((token: string) => Promise<void>) | undefined>(),
  waitUntilCtx: Annotation<PipelineContext['waitUntilCtx']>(),

  // 個人化
  memorySummary: Annotation<string | null | undefined>(),
  ascentContext: Annotation<string | null | undefined>(),
  abilityLevel: Annotation<number | null | undefined>(),

  // Looping
  loopCount: Annotation<number>(),
  loopBack: Annotation<PipelineContext['loopBack']>(),

  // Branching
  branchResults: Annotation<PipelineContext['branchResults']>(),

  // Latency
  phaseLatency: Annotation<PipelineContext['phaseLatency']>(),

  // 其他
  retrievalMethod: Annotation<PipelineContext['retrievalMethod']>(),
  multiToolPlan: Annotation<PipelineContext['multiToolPlan']>(),
  strategyHint: Annotation<string | undefined>(),
  skipPostRetrieval: Annotation<boolean | undefined>(),
  // NOTE: 使用 Record 而非 Map，因為 LangGraph 在 checkpointing 時需要 JSON 序列化
  videoCountMap: Annotation<Record<string, number> | undefined>(),
  latestVideoMap: Annotation<Record<string, string> | undefined>(),
  llmMessages: Annotation<PipelineContext['llmMessages']>(),
  selfReflectionTriggered: Annotation<number | undefined>(),
  cannotAnswer: Annotation<boolean | undefined>(),
  abortSignal: Annotation<AbortSignal | undefined>(),
  embeddingFailed: Annotation<boolean | undefined>(),
  degradedStages: Annotation<string[] | undefined>({
    reducer: (a, b) => [...(a ?? []), ...(b ?? [])],
  }),
  circuitBreaker: Annotation<PipelineContext['circuitBreaker']>(),

  // ---------- LangGraph 新增欄位 ----------
  /** Langfuse trace 實例，由 GraphService 注入，nodes 用來建立 span */
  langfuseTrace: Annotation<LangfuseTraceClient | null | undefined>(),
});

export type GraphState = typeof GraphStateAnnotation.State;
```

- [x] **Step 2: typecheck**

```bash
cd backend
pnpm typecheck
```

Expected: 0 errors

- [x] **Step 3: commit**

```bash
git add backend/src/services/ai-graph/state.ts
git commit -m "feat(ai): define LangGraph state annotation mapping PipelineContext"
```

---

## Task 2.5: AI Provider Abstraction Layer

**Files:**
- Create: `backend/src/services/ai-graph/providers/types.ts`
- Create: `backend/src/services/ai-graph/providers/cloudflare.ts`
- Create: `backend/src/services/ai-graph/providers/openai.ts`
- Create: `backend/src/services/ai-graph/providers/anthropic.ts`
- Create: `backend/src/services/ai-graph/providers/google.ts`
- Create: `backend/src/services/ai-graph/providers/index.ts`
- Modify: `backend/src/types/index.ts`
- Modify: `backend/src/services/pipeline/types.ts`
- Modify: `backend/src/services/ai-graph/state.ts`
- Modify: `backend/src/services/ai-graph/index.ts`
- Create: `backend/src/services/ai-graph/__tests__/providers.test.ts`
- Modify: `backend/wrangler.toml`

目前服務完全耦合於 Cloudflare Workers AI binding。本 task 引入 provider 抽象層，讓 LLM 提供商可透過設定切換（Cloudflare / OpenAI / Anthropic / Google），embedding provider 獨立設定，節點程式碼統一呼叫 `state.llmProvider.chat()` 介面，不再直接呼叫 `env.AI.run()`。

> **⚠️ Embedding 維度警告（重要）**：不同 provider 的向量嵌入維度不同：
> - Cloudflare BGE-M3：**1024 維**
> - OpenAI text-embedding-3-small：**1536 維**
> - Google text-embedding-004：**768 維**
>
> **切換 `embedding_provider` 後必須重新索引 Vectorize 中的所有文件**，否則新舊向量維度不符會導致搜尋結果錯誤或 API 報錯。`llm_provider` 可隨時切換，無須重新索引。

- [x] **Step 1: 建立 `backend/src/services/ai-graph/providers/types.ts`**

```typescript
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  gatewayOptions?: { gateway: { id: string } };
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface EmbeddingOptions {
  model?: string;
}

export interface AIProvider {
  name: string;
  /** 呼叫 LLM 生成，支援 tool calling */
  chat(messages: ChatMessage[], opts?: LLMCallOptions): Promise<LLMResponse>;
  /** 串流生成，每個 token 觸發 onToken callback */
  streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> }
  ): Promise<LLMResponse>;
  /** 向量嵌入 */
  embed(text: string, opts?: EmbeddingOptions): Promise<number[]>;
  /** 批次向量嵌入 */
  embedBatch(texts: string[], opts?: EmbeddingOptions): Promise<number[][]>;
}

export type ProviderName = 'cloudflare' | 'openai' | 'anthropic' | 'google';
```

- [x] **Step 2: 建立 `backend/src/services/ai-graph/providers/cloudflare.ts`**

```typescript
// 封裝現有的 Cloudflare Workers AI binding 呼叫
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';
import { Env } from '../../../types';

export class CloudflareProvider implements AIProvider {
  readonly name = 'cloudflare';
  constructor(
    private readonly ai: Env['AI'],
    private readonly defaultModel = '@cf/meta/llama-3.1-8b-instruct',
    private readonly defaultEmbeddingModel = '@cf/baai/bge-m3',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const response = await this.ai.run(opts.model ?? this.defaultModel, {
      messages,
      max_tokens: opts.maxTokens,
      tools: opts.tools,
    } as Parameters<typeof this.ai.run>[1], opts.gatewayOptions);
    // parse Workers AI response format
    const content = (response as { response?: string; result?: { response: string } })?.response
      ?? (response as { result?: { response: string } })?.result?.response ?? '';
    return { content, usage: (response as { usage?: LLMResponse['usage'] }).usage };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    // 使用現有的 streamLLMGeneration 邏輯移植至此
    // ...
    return { content: '' };
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: [text] } as Parameters<typeof this.ai.run>[1],
    );
    return (result as { data: number[][] }).data[0];
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const result = await this.ai.run(
      opts.model ?? this.defaultEmbeddingModel,
      { text: texts } as Parameters<typeof this.ai.run>[1],
    );
    return (result as { data: number[][] }).data;
  }
}
```

- [x] **Step 3: 建立 `backend/src/services/ai-graph/providers/openai.ts`**

```typescript
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly baseUrl = 'https://api.openai.com/v1';

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'gpt-4o-mini',
    private readonly defaultEmbeddingModel = 'text-embedding-3-small',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.tools?.length) {
      body.tools = opts.tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      body.tool_choice = 'auto';
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      choices: Array<{ message: { content: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };
    const choice = data.choices[0].message;
    const toolCall = choice.tool_calls?.[0]?.function
      ? { name: choice.tool_calls[0].function.name, arguments: JSON.parse(choice.tool_calls[0].function.arguments) }
      : undefined;
    return { content: choice.content ?? '', usage: data.usage, toolCall };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI stream error: ${res.status}`);
    let fullContent = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        try {
          const chunk = JSON.parse(data) as { choices: Array<{ delta: { content?: string } }> };
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) { fullContent += token; await opts.onToken(token); }
        } catch { /* ignore parse errors */ }
      }
    }
    return { content: fullContent };
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: opts.model ?? this.defaultEmbeddingModel, input: text }),
    });
    const data = await res.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0].embedding;
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: opts.model ?? this.defaultEmbeddingModel, input: texts }),
    });
    const data = await res.json() as { data: Array<{ embedding: number[]; index: number }> };
    return data.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
  }
}
```

- [x] **Step 4: 建立 `backend/src/services/ai-graph/providers/anthropic.ts`**

```typescript
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private readonly baseUrl = 'https://api.anthropic.com/v1';

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'claude-haiku-4-5-20251001',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const system = messages.find(m => m.role === 'system')?.content;
    const nonSystem = messages.filter(m => m.role !== 'system');
    const body: Record<string, unknown> = {
      model: opts.model ?? this.defaultModel,
      max_tokens: opts.maxTokens ?? 1024,
      messages: nonSystem,
    };
    if (system) body.system = system;
    if (opts.tools?.length) {
      body.tools = opts.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      content: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    const textBlock = data.content.find(b => b.type === 'text');
    const toolBlock = data.content.find(b => b.type === 'tool_use');
    return {
      content: textBlock?.text ?? '',
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      toolCall: toolBlock ? { name: toolBlock.name!, arguments: toolBlock.input! } : undefined,
    };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    const system = messages.find(m => m.role === 'system')?.content;
    const nonSystem = messages.filter(m => m.role !== 'system');
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        max_tokens: opts.maxTokens ?? 1024,
        messages: nonSystem,
        system,
        stream: true,
      }),
    });
    let fullContent = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(line.slice(5)) as { type: string; delta?: { type: string; text?: string } };
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
            fullContent += ev.delta.text;
            await opts.onToken(ev.delta.text);
          }
        } catch { /* ignore */ }
      }
    }
    return { content: fullContent };
  }

  // Anthropic 無原生 embedding API，降級至拋出錯誤，呼叫方應 fallback 到 Cloudflare
  async embed(_text: string): Promise<number[]> {
    throw new Error('AnthropicProvider does not support embedding. Configure a separate embedding provider.');
  }
  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error('AnthropicProvider does not support embedding.');
  }
}
```

- [x] **Step 5: 建立 `backend/src/services/ai-graph/providers/google.ts`**

```typescript
import { AIProvider, ChatMessage, EmbeddingOptions, LLMCallOptions, LLMResponse } from './types';

export class GoogleProvider implements AIProvider {
  readonly name = 'google';
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = 'gemini-2.0-flash',
    private readonly defaultEmbeddingModel = 'text-embedding-004',
  ) {}

  async chat(messages: ChatMessage[], opts: LLMCallOptions = {}): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel;
    const systemInstruction = messages.find(m => m.role === 'system');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: opts.maxTokens, temperature: opts.temperature ?? 0.7 },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    const res = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    if (!res.ok) throw new Error(`Google AI error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };
    return {
      content: data.candidates[0]?.content.parts[0]?.text ?? '',
      usage: {
        prompt_tokens: data.usageMetadata.promptTokenCount,
        completion_tokens: data.usageMetadata.candidatesTokenCount,
        total_tokens: data.usageMetadata.totalTokenCount,
      },
    };
  }

  async streamChat(
    messages: ChatMessage[],
    opts: LLMCallOptions & { onToken: (token: string) => Promise<void> },
  ): Promise<LLMResponse> {
    const model = opts.model ?? this.defaultModel;
    const systemInstruction = messages.find(m => m.role === 'system');
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = { contents };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
    const res = await fetch(
      `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    let fullContent = '';
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const chunk = JSON.parse(line.slice(6)) as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
          };
          const text = chunk.candidates[0]?.content.parts[0]?.text ?? '';
          if (text) { fullContent += text; await opts.onToken(text); }
        } catch { /* ignore */ }
      }
    }
    return { content: fullContent };
  }

  async embed(text: string, opts: EmbeddingOptions = {}): Promise<number[]> {
    const model = opts.model ?? this.defaultEmbeddingModel;
    const res = await fetch(
      `${this.baseUrl}/models/${model}:embedContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] } }) },
    );
    const data = await res.json() as { embedding: { values: number[] } };
    return data.embedding.values;
  }

  async embedBatch(texts: string[], opts: EmbeddingOptions = {}): Promise<number[][]> {
    const model = opts.model ?? this.defaultEmbeddingModel;
    const res = await fetch(
      `${this.baseUrl}/models/${model}:batchEmbedContents?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: texts.map(text => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          })),
        }) },
    );
    const data = await res.json() as { embeddings: Array<{ values: number[] }> };
    return data.embeddings.map(e => e.values);
  }
}
```

- [x] **Step 6: 建立 `backend/src/services/ai-graph/providers/index.ts`**

```typescript
import { AIProvider, ProviderName } from './types';
import { CloudflareProvider } from './cloudflare';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { Env } from '../../../types';

export interface ProviderConfig {
  /** 主要 LLM provider（chat + streaming） */
  llmProvider: ProviderName;
  /** 嵌入向量 provider（embed）；預設與 llmProvider 相同，若不支援 embed 則 fallback 到 cloudflare */
  embeddingProvider?: ProviderName;
}

/**
 * 工廠函式：根據 config 和 env 建立 AIProvider 實例。
 * 若 provider 所需的 API key 不存在，拋出明確錯誤。
 */
export function createProvider(name: ProviderName, env: Env): AIProvider {
  switch (name) {
    case 'cloudflare':
      return new CloudflareProvider(env.AI);
    case 'openai':
      if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set');
      return new OpenAIProvider(env.OPENAI_API_KEY);
    case 'anthropic':
      if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
      return new AnthropicProvider(env.ANTHROPIC_API_KEY);
    case 'google':
      if (!env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not set');
      return new GoogleProvider(env.GOOGLE_AI_API_KEY);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/** 建立主 LLM provider + embedding provider（自動 fallback） */
export function createProviders(config: ProviderConfig, env: Env): {
  llm: AIProvider;
  embedding: AIProvider;
} {
  const llm = createProvider(config.llmProvider, env);
  let embedding: AIProvider;
  const embName = config.embeddingProvider ?? config.llmProvider;
  try {
    const ep = createProvider(embName, env);
    // anthropic doesn't support embedding — fallback to cloudflare
    embedding = ep.name === 'anthropic' ? new CloudflareProvider(env.AI) : ep;
  } catch {
    embedding = new CloudflareProvider(env.AI);
  }
  return { llm, embedding };
}

export * from './types';
```

- [x] **Step 7: 更新 `backend/src/types/index.ts` — 在 `Env` 介面加入新 API key 欄位**

找到 `Env` interface，加入：

```typescript
OPENAI_API_KEY?: string;
ANTHROPIC_API_KEY?: string;
GOOGLE_AI_API_KEY?: string;
```

- [x] **Step 8: 更新 `backend/src/services/pipeline/types.ts` — 在 `PipelineConfig` 加入 provider 欄位**

找到 `PipelineConfig` interface，加入：

```typescript
llm_provider?: 'cloudflare' | 'openai' | 'anthropic' | 'google';
embedding_provider?: 'cloudflare' | 'openai' | 'google';
```

- [x] **Step 9: 更新 `backend/src/services/ai-graph/state.ts` — 在 `GraphStateAnnotation` 加入 provider 欄位**

在 `// ---------- LangGraph 新增欄位 ----------` 區塊，`langfuseTrace` 之後加入：

```typescript
/** 注入的 LLM provider，nodes 透過此介面呼叫 chat / streamChat */
llmProvider: Annotation<AIProvider | undefined>(),
/** 注入的 embedding provider，embedding node 透過此介面呼叫 embed */
embeddingProvider: Annotation<AIProvider | undefined>(),
```

並在檔案頂部加入：

```typescript
import { AIProvider } from './providers/types';
```

- [x] **Step 10: 更新 `backend/src/services/ai-graph/index.ts` — 注入 providers 到 initialState**

在 `runAIGraph()` 中，`initialState` 建立之前加入 provider 初始化：

```typescript
import { createProviders } from './providers';

// inside runAIGraph(), after building initialState:
const { llm, embedding } = createProviders({
  llmProvider: ctx.pipelineConfig.llm_provider ?? 'cloudflare',
  embeddingProvider: ctx.pipelineConfig.embedding_provider,
}, ctx.env);
const initialState: GraphState = {
  ...ctx,
  langfuseTrace: trace,
  llmProvider: llm,
  embeddingProvider: embedding,
};
```

> **Node 使用方式**：各 node（llm-generation, judge, hyde, multi-query, tool-selection）應改用 `state.llmProvider.chat()` / `state.llmProvider.streamChat()` 取代直接呼叫 `ctx.env.AI.run()`。Embedding node 應改用 `state.embeddingProvider.embed()` / `state.embeddingProvider.embedBatch()`。

- [x] **Step 11: 建立 `backend/src/services/ai-graph/__tests__/providers.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { createProvider } from '../providers';

describe('createProvider', () => {
  it('creates CloudflareProvider when provider is cloudflare', () => {
    const provider = createProvider('cloudflare', { AI: {} } as any);
    expect(provider.name).toBe('cloudflare');
  });
  it('throws when OpenAI key missing', () => {
    expect(() => createProvider('openai', {} as any)).toThrow('OPENAI_API_KEY is not set');
  });
  it('creates OpenAIProvider when key is present', () => {
    const provider = createProvider('openai', { OPENAI_API_KEY: 'sk-test' } as any);
    expect(provider.name).toBe('openai');
  });
  it('creates AnthropicProvider when key is present', () => {
    const provider = createProvider('anthropic', { ANTHROPIC_API_KEY: 'ant-test' } as any);
    expect(provider.name).toBe('anthropic');
  });
  it('creates GoogleProvider when key is present', () => {
    const provider = createProvider('google', { GOOGLE_AI_API_KEY: 'gai-test' } as any);
    expect(provider.name).toBe('google');
  });
});
```

- [x] **Step 12: 在 `backend/wrangler.toml` 加入新 secrets 說明**

在 Langfuse secrets 說明之後的 `[env.preview.vars]` 和 `[env.production.vars]` 區塊加入：

```toml
# AI Provider API Keys - Set via wrangler secret:
# wrangler secret put OPENAI_API_KEY --env preview
# wrangler secret put ANTHROPIC_API_KEY --env preview
# wrangler secret put GOOGLE_AI_API_KEY --env preview
# LLM provider selection (cloudflare | openai | anthropic | google), default: cloudflare
# LLM_PROVIDER = "cloudflare"
# Embedding provider (cloudflare | openai | google), default: same as LLM_PROVIDER
# WARNING: Changing EMBEDDING_PROVIDER requires full re-index of all documents in Vectorize
# EMBEDDING_PROVIDER = "cloudflare"
```

- [x] **Step 13: typecheck 通過**

```bash
cd backend && pnpm typecheck
```

Expected: 0 errors

- [x] **Step 14: 執行 provider 單元測試**

```bash
cd backend && pnpm vitest run src/services/ai-graph/__tests__/providers.test.ts
```

Expected: 5 passed

- [x] **Step 15: commit**

```bash
git add backend/src/services/ai-graph/providers/ \
        backend/src/services/ai-graph/__tests__/providers.test.ts \
        backend/src/types/index.ts \
        backend/src/services/pipeline/types.ts \
        backend/src/services/ai-graph/state.ts \
        backend/src/services/ai-graph/index.ts \
        backend/wrangler.toml
git commit -m "feat(ai): add multi-provider abstraction layer (Cloudflare/OpenAI/Anthropic/Google)"
```

---

## Task 3: 建立 Routing 函式 & 共用 Node 骨架

**Files:**
- Create: `backend/src/services/ai-graph/routing.ts`

Routing functions 是 LangGraph `addConditionalEdges` 的第二個參數——純函式，輸入 state 輸出 node 名稱。

- [x] **Step 1: 建立 `backend/src/services/ai-graph/routing.ts`**

```typescript
import { GraphState } from './state';

/** 檢查是否有 earlyReturn（cache hit 或特殊路徑），直接到 END */
export function routeAfterSemanticCache(state: GraphState): 'END' | 'toolSelection' {
  if (state.earlyReturn) return 'END';
  return 'toolSelection';
}

/** tool-selection 後的分流 */
export function routeAfterToolSelection(state: GraphState):
  | 'textToSql'      // SQL 路徑
  | 'filterBuild'    // 一般向量搜尋路徑（先建立 filter，再 embedding）
  | 'llmGeneration'  // general-knowledge：不需要 retrieval，直接生成
  | 'END'            // 需要澄清的問題
{
  if (state.earlyReturn) return 'END';
  if (state.queryType === 'sql') return 'textToSql';
  if (state.queryType === 'clarification-needed') return 'END';
  if (state.queryType === 'general-knowledge') return 'llmGeneration'; // 跳過 retrieval
  return 'filterBuild'; // 一般 vector 路徑：filterBuild → embedding → ...
}

/** text-to-sql 後：成功有結果→生成回答，無結果→ fallback 向量搜尋，earlyReturn（澄清/錯誤）→ END */
export function routeAfterTextToSql(state: GraphState): 'llmGeneration' | 'embedding' | 'END' {
  if (state.earlyReturn) return 'END'; // 澄清需求或 SQL error
  if (state.sqlCandidates && state.sqlCandidates.length > 0) return 'llmGeneration'; // SQL 有結果，直接生成
  return 'embedding'; // 無結果，fallback 到向量搜尋
}

/** embedding 後：若失敗則跳過 HyDE/MultiQuery，直接 hybrid-search（BM25-only fallback）*/
export function routeAfterEmbedding(state: GraphState): 'hyde' | 'hybridSearch' {
  if (state.embeddingFailed) return 'hybridSearch';
  return 'hyde';
}

/** judge 後：quality 不足且未超過 loop 限制則觸發 self-reflection */
export function routeAfterJudge(state: GraphState): 'selfReflection' | 'memoryExtractor' {
  const cfg = state.pipelineConfig;
  const quality = state.quality ?? 4;
  const loopCount = state.loopCount ?? 0;
  if (
    quality <= cfg.judge_regen_quality_max &&
    loopCount < cfg.max_pipeline_loops &&
    (state.context?.length ?? 0) >= cfg.self_reflection_min_length
  ) {
    return 'selfReflection';
  }
  return 'memoryExtractor';
}

/**
 * self-reflection 後：檢查 loopBack.targetPhase
 * - 'retrieval' → 回到 hybridSearch（重新搜尋）
 * - 其他 / 未設定 → 回到 llmGeneration（重新生成）
 */
export function routeAfterSelfReflection(state: GraphState): 'hybridSearch' | 'llmGeneration' {
  if (state.loopBack?.targetPhase === 'retrieval') return 'hybridSearch';
  return 'llmGeneration';
}

// ---- Agentic Strategy ----

/** agentic decision 後的分流 */
export function routeAgenticDecision(state: GraphState):
  | 'agenticRetrieve'
  | 'llmGeneration'   // ANSWER action
  | 'END'
{
  if (state.earlyReturn) return 'END';
  const lastAction = (state.trace as Record<string, unknown>)?.lastAgenticAction as string | undefined;
  if (lastAction === 'ANSWER') return 'llmGeneration';
  return 'agenticRetrieve';
}

/** agentic retrieve 後：繼續迭代或回答 */
export function routeAfterAgenticRetrieve(state: GraphState): 'agenticDecision' | 'llmGeneration' {
  const cfg = state.pipelineConfig;
  const loopCount = state.loopCount ?? 0;
  if (loopCount >= cfg.agentic_max_steps) return 'llmGeneration';
  const docCount = state.candidateMatches?.length ?? 0;
  if (docCount >= cfg.agentic_min_docs_to_answer) return 'llmGeneration';
  return 'agenticDecision';
}
```

- [x] **Step 2: typecheck**

```bash
cd backend && pnpm typecheck
```

Expected: 0 errors

- [x] **Step 3: commit**

```bash
git add backend/src/services/ai-graph/routing.ts
git commit -m "feat(ai): add LangGraph conditional routing functions"
```

---

## Task 4: 實作 Pre-Retrieval Nodes（semantic-cache, tool-selection, embedding, filter-build）

**Files:**
- Create: `backend/src/services/ai-graph/nodes/semantic-cache.ts`
- Create: `backend/src/services/ai-graph/nodes/tool-selection.ts`
- Create: `backend/src/services/ai-graph/nodes/embedding.ts`
- Create: `backend/src/services/ai-graph/nodes/filter-build.ts`
- Refer to existing: `backend/src/services/pipeline/steps/semantic-cache.ts`, `tool-selection.ts`, `embedding.ts`, `filter-build.ts`

每個 node 的模式：讀取現有 pipeline step 的 `execute()` 邏輯，**移植**至 LangGraph node function（簽名：`(state: GraphState) => Promise<Partial<GraphState>>`），加入 Langfuse span。

- [x] **Step 1: 閱讀現有 semantic-cache step**

```bash
cat backend/src/services/pipeline/steps/semantic-cache.ts
```

- [x] **Step 2: 建立 `backend/src/services/ai-graph/nodes/semantic-cache.ts`**

模式如下（以 semantic-cache 為例）：

```typescript
import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';

export async function semanticCacheNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'semantic-cache', {
    query: state.request.query,
    cacheKey: state.cacheKey,
  });
  try {
    // 移植自 pipeline/steps/semantic-cache.ts 的 execute() 邏輯
    // 使用 state.queryService, state.pipelineConfig, state.earlyQueryVector 等
    // 若 cache hit，設定 state.earlyReturn
    // ...（完整邏輯從現有 step 複製並調整 ctx → state）...

    endSpan(span, { output: { cacheHit: !!state.earlyReturn } });
    return { /* partial state updates */ };
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
```

對每個 node 重複相同移植模式。

- [x] **Step 3: 建立 tool-selection, embedding, filter-build nodes**

（同上移植模式）

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

Expected: 0 errors

- [x] **Step 5: commit**

```bash
git add backend/src/services/ai-graph/nodes/
git commit -m "feat(ai): add pre-retrieval LangGraph nodes (semantic-cache, tool-selection, embedding, filter-build)"
```

---

## Task 5: 實作 Query Enhancement Nodes（hyde, multi-query, text-to-sql）

**Files:**
- Create: `backend/src/services/ai-graph/nodes/hyde.ts`
- Create: `backend/src/services/ai-graph/nodes/multi-query.ts`
- Create: `backend/src/services/ai-graph/nodes/text-to-sql.ts`
- Refer to: `backend/src/services/pipeline/steps/hyde.ts`, `multi-query.ts`, `text-to-sql.ts`

- [x] **Step 1: 移植 hyde node**

重點：`hydeDoc` + `hydeVector` 更新，Langfuse span 記錄 `hydeDoc` 作為輸出，token usage 記入 `tokenBreakdown.hyde`。

- [x] **Step 2: 移植 multi-query node**

重點：`expandedQueries` + `expandedVectors` 更新，span 記錄 query count。

- [x] **Step 3: 移植 text-to-sql node**

重點：SQL 執行結果寫入 `sqlCandidates` + `sqlContext`，或設定 `earlyReturn`（澄清需求）。

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 5: commit**

```bash
git add backend/src/services/ai-graph/nodes/
git commit -m "feat(ai): add query enhancement nodes (hyde, multi-query, text-to-sql)"
```

---

## Task 6: 實作 Retrieval & Reranking Nodes（hybrid-search, cross-encoder, mmr, popularity-rerank）

**Files:**
- Create: `backend/src/services/ai-graph/nodes/hybrid-search.ts`
- Create: `backend/src/services/ai-graph/nodes/cross-encoder.ts`
- Create: `backend/src/services/ai-graph/nodes/mmr.ts`
- Create: `backend/src/services/ai-graph/nodes/popularity-rerank.ts`
- Refer to: 同名 pipeline steps

- [x] **Step 1: 移植 hybrid-search node**

重點：`candidateMatches` + `documents` 更新；`embeddingFailed` 時僅走 BM25 path；span 記錄 retrieved doc count 與 retrieval score。

- [x] **Step 2: 移植 cross-encoder node**

重點：`scoredCandidates` 更新；超時降級記入 `degradedStages`；span 記錄 reranker weight。

- [x] **Step 3: 移植 mmr + popularity-rerank nodes**

重點：`rerankedMatches` 更新；最終組裝 `sources` + `context`。

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 5: commit**

```bash
git add backend/src/services/ai-graph/nodes/
git commit -m "feat(ai): add retrieval and reranking LangGraph nodes"
```

---

## Task 7: 實作 Generation & Evaluation Nodes（llm-generation, judge, self-reflection, memory-extractor）

**Files:**
- Create: `backend/src/services/ai-graph/nodes/llm-generation.ts`
- Create: `backend/src/services/ai-graph/nodes/judge.ts`
- Create: `backend/src/services/ai-graph/nodes/self-reflection.ts`
- Create: `backend/src/services/ai-graph/nodes/memory-extractor.ts`
- Refer to: 同名 pipeline steps

- [x] **Step 1: 移植 llm-generation node**

重點：
- Streaming 模式：呼叫 `queryService.streamLLMGeneration`，`onToken` callback 維持不變
- 更新 `rawAnswer`, `answer`, `suggestedQuestions`
- Langfuse span 記錄 `tokenBreakdown.main_generation`（prompt_tokens, completion_tokens）

- [x] **Step 2: 移植 judge node**

重點：更新 `groundedness` + `quality`；超時時設 `degradedStages`。Langfuse span 記錄 judge scores。

- [x] **Step 3: 移植 self-reflection node**

重點：重新呼叫生成、更新 `answer`；遞增 `loopCount`；記錄 `selfReflectionTriggered`。

- [x] **Step 4: 移植 memory-extractor node**

重點：此 node 必須是**非阻塞的（non-blocking）**。node 內部直接呼叫 `state.waitUntilCtx.waitUntil(extractMemoryAsync(...))` 將實際工作排入背景，然後**立即 return `{}`**，不等待完成。graph 的 `memoryExtractor → END` 邊用 `addEdge`（不是 conditional），表示 node 完成後立即結束 graph，不等待背景工作。

```typescript
export async function memoryExtractorNode(state: GraphState): Promise<Partial<GraphState>> {
  // 非阻塞：排入 waitUntil 背景執行，立即 return
  if (state.waitUntilCtx) {
    state.waitUntilCtx.waitUntil(extractMemoryAsync(state));
  }
  return {}; // graph 立即繼續到 END，不等待記憶體萃取完成
}
```

span 記錄 extracted memory type（在 `extractMemoryAsync` 內部處理）。

- [x] **Step 5: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 6: commit**

```bash
git add backend/src/services/ai-graph/nodes/
git commit -m "feat(ai): add generation and evaluation LangGraph nodes"
```

---

## Task 8: 組裝 Baseline Strategy Graph

**Files:**
- Create: `backend/src/services/ai-graph/graphs/baseline.ts`

Baseline flow（左到右含 conditional edges）：

```
START
  → semanticCache  ──[earlyReturn?]──→ END
  → toolSelection  ──[queryType]──→ textToSql ──[earlyReturn]──→ END
                                              ──[sqlCandidates>0]──→ llmGeneration
                                              ──[no results]──→ embedding
                   ──[general-knowledge]──→ llmGeneration (skip retrieval)
                   ──[vector]──→ filterBuild → embedding
  → embedding      ──[failed?]──→ hybridSearch (BM25-only)
                   ──[ok]──→ hyde → multiQuery → hybridSearch
  → crossEncoder → mmr → popularityRerank
  → llmGeneration
  → judge ──[quality low & loopable]──→ selfReflection
          ──[quality ok]─────────────→ memoryExtractor
  → selfReflection ──[loopBack=retrieval]──→ hybridSearch
                   ──[otherwise]─────────→ llmGeneration (cycle)
  → END
```

- [x] **Step 1: 建立 `backend/src/services/ai-graph/graphs/baseline.ts`**

```typescript
import { StateGraph, END, START } from '@langchain/langgraph';
import { GraphStateAnnotation } from '../state';
import { semanticCacheNode } from '../nodes/semantic-cache';
import { toolSelectionNode } from '../nodes/tool-selection';
import { filterBuildNode } from '../nodes/filter-build';
import { textToSqlNode } from '../nodes/text-to-sql';
import { embeddingNode } from '../nodes/embedding';
import { hydeNode } from '../nodes/hyde';
import { multiQueryNode } from '../nodes/multi-query';
import { hybridSearchNode } from '../nodes/hybrid-search';
import { crossEncoderNode } from '../nodes/cross-encoder';
import { mmrNode } from '../nodes/mmr';
import { popularityRerankNode } from '../nodes/popularity-rerank';
import { llmGenerationNode } from '../nodes/llm-generation';
import { judgeNode } from '../nodes/judge';
import { selfReflectionNode } from '../nodes/self-reflection';
import { memoryExtractorNode } from '../nodes/memory-extractor';
import {
  routeAfterSemanticCache,
  routeAfterToolSelection,
  routeAfterTextToSql,
  routeAfterEmbedding,
  routeAfterJudge,
  routeAfterSelfReflection,
} from '../routing';

export function buildBaselineGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('toolSelection', toolSelectionNode)
    .addNode('filterBuild', filterBuildNode)       // Issue 1: filterBuild between toolSelection and embedding
    .addNode('textToSql', textToSqlNode)
    .addNode('embedding', embeddingNode)
    .addNode('hyde', hydeNode)
    .addNode('multiQuery', multiQueryNode)
    .addNode('hybridSearch', hybridSearchNode)
    .addNode('crossEncoder', crossEncoderNode)
    .addNode('mmr', mmrNode)
    .addNode('popularityRerank', popularityRerankNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('selfReflection', selfReflectionNode)
    .addNode('memoryExtractor', memoryExtractorNode);

  // Edges
  graph.addEdge(START, 'semanticCache');
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  });
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    textToSql: 'textToSql',
    filterBuild: 'filterBuild',     // Issue 1 & 8: vector path goes to filterBuild first
    llmGeneration: 'llmGeneration', // Issue 8: general-knowledge skips retrieval entirely
    END,
  });
  graph.addEdge('filterBuild', 'embedding'); // Issue 1: filterBuild → embedding
  graph.addConditionalEdges('textToSql', routeAfterTextToSql, {
    llmGeneration: 'llmGeneration', // Issue 2: SQL results → generate answer
    embedding: 'embedding',         // Issue 2: no results → fallback vector search
    END,                            // Issue 2: earlyReturn (clarification/error) → END
  });
  graph.addConditionalEdges('embedding', routeAfterEmbedding, {
    hyde: 'hyde',
    hybridSearch: 'hybridSearch',
  });
  graph.addEdge('hyde', 'multiQuery');
  graph.addEdge('multiQuery', 'hybridSearch');
  graph.addEdge('hybridSearch', 'crossEncoder');
  graph.addEdge('crossEncoder', 'mmr');
  graph.addEdge('mmr', 'popularityRerank');
  graph.addEdge('popularityRerank', 'llmGeneration');
  graph.addEdge('llmGeneration', 'judge');
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'selfReflection',
    memoryExtractor: 'memoryExtractor',
  });
  // Issue 3: selfReflection can loop back to retrieval phase, not just generation
  graph.addConditionalEdges('selfReflection', routeAfterSelfReflection, {
    hybridSearch: 'hybridSearch',   // Issue 3: retrieval-phase loopback
    llmGeneration: 'llmGeneration', // Issue 3: generation-phase loopback (default)
  });
  graph.addEdge('memoryExtractor', END);

  return graph.compile();
}

export const baselineGraph = buildBaselineGraph();
```

- [x] **Step 2: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 3: commit**

```bash
git add backend/src/services/ai-graph/graphs/baseline.ts
git commit -m "feat(ai): assemble baseline RAG strategy LangGraph"
```

---

## Task 9: 組裝 Agentic Strategy Graph

**Files:**
- Create: `backend/src/services/ai-graph/nodes/agentic-decision.ts`
- Create: `backend/src/services/ai-graph/nodes/agentic-retrieve.ts`
- Create: `backend/src/services/ai-graph/graphs/agentic.ts`
- Refer to: `backend/src/services/query/llm.ts` (agenticRetrieve), `backend/src/services/query/index.ts` (agentic strategy logic)

Agentic flow（ReAct cycle）：

```
START → semanticCache → agenticDecision ──[ANSWER]──→ llmGeneration → judge → memoryExtractor → END
                     ↑       ↓[RETRIEVE/etc]
                     └── agenticRetrieve ──[max steps?]──→ llmGeneration
```

- [x] **Step 1: 建立 `agentic-decision.ts` node**

移植 `agenticRetrieve` 的 LLM decision 部分：呼叫 `AGENTIC_DECISION_PROMPT`，解析回傳的 `AgenticAction`，記入 `trace.lastAgenticAction`。

- [x] **Step 2: 建立 `agentic-retrieve.ts` node**

移植向量搜尋 + 文件取得部分，遞增 `loopCount`，合併 `candidateMatches`。

- [x] **Step 3: 建立 `backend/src/services/ai-graph/graphs/agentic.ts`**

```typescript
import { StateGraph, END, START } from '@langchain/langgraph';
import { GraphStateAnnotation } from '../state';
// ... imports
import { routeAfterSemanticCache, routeAfterToolSelection, routeAgenticDecision, routeAfterAgenticRetrieve, routeAfterJudge } from '../routing';

export function buildAgenticGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('toolSelection', toolSelectionNode)    // agentic 也需要 tool-selection 決定查詢類型
    .addNode('filterBuild', filterBuildNode)        // Issue 1: filterBuild 在 agentic 中亦需存在
    .addNode('agenticDecision', agenticDecisionNode)
    .addNode('agenticRetrieve', agenticRetrieveNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('memoryExtractor', memoryExtractorNode);

  graph.addEdge(START, 'semanticCache');
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, {
    END,
    toolSelection: 'toolSelection',
  });
  // Issue 1 & 8: toolSelection → filterBuild（一般路徑）/ llmGeneration（general-knowledge）
  graph.addConditionalEdges('toolSelection', routeAfterToolSelection, {
    filterBuild: 'agenticDecision', // agentic: filterBuild → agenticDecision（不走 embedding 靜態路徑）
    llmGeneration: 'llmGeneration', // general-knowledge 直接生成
    textToSql: 'llmGeneration',     // SQL 在 agentic 中由 agenticDecision 處理
    END,
  });
  graph.addEdge('filterBuild', 'agenticDecision');
  graph.addConditionalEdges('agenticDecision', routeAgenticDecision, {
    agenticRetrieve: 'agenticRetrieve',
    llmGeneration: 'llmGeneration',
    END,
  });
  graph.addConditionalEdges('agenticRetrieve', routeAfterAgenticRetrieve, {
    agenticDecision: 'agenticDecision',
    llmGeneration: 'llmGeneration',
  });
  graph.addEdge('llmGeneration', 'judge');
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'llmGeneration', // agentic 不做 self-reflection，直接再生成
    memoryExtractor: 'memoryExtractor',
  });
  graph.addEdge('memoryExtractor', END);

  return graph.compile();
}

export const agenticGraph = buildAgenticGraph();
```

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 5: commit**

```bash
git add backend/src/services/ai-graph/nodes/agentic-*.ts backend/src/services/ai-graph/graphs/agentic.ts
git commit -m "feat(ai): assemble agentic ReAct strategy LangGraph"
```

---

## Task 10: 組裝 Plan-and-Execute Strategy Graph

**Files:**
- Create: `backend/src/services/ai-graph/nodes/planning.ts`
- Create: `backend/src/services/ai-graph/nodes/synthesis.ts`
- Create: `backend/src/services/ai-graph/graphs/plan-execute.ts`
- Refer to: `backend/src/services/query/plan-execute.ts`

Plan-and-Execute flow：

```
START → planning → [parallel per-step searches via Send API] → synthesis → judge → memoryExtractor → END
```

LangGraph `Send` API 讓每個 plan step 以獨立 node invocation 執行（map-reduce pattern）。

- [x] **Step 1: 建立 `planning.ts` node**

移植 `planQuery()` 邏輯，輸出 `trace.planSteps`（步驟列表）。

- [x] **Step 2: 建立 `synthesis.ts` node**

移植 `synthesize()` 邏輯：合併所有 step results，輸出 `context` + `sources`。

- [x] **Step 3: 建立 `plan-execute.ts` graph**

> **重要限制**：`dispatchPlanSteps` 使用 LangGraph `Send` API 僅分派**可並行的 plan steps**。若 plan 中有依賴順序的步驟（step B 依賴 step A 的結果），`Send` API 無法表達此依賴。目前實作假設所有 plan steps 互相獨立，可並行執行。若未來需要支援循序依賴的步驟，需改用 `sequentialExecutor` node（在單一 node 內用迴圈依序執行步驟）。

```typescript
import { StateGraph, END, START, Send } from '@langchain/langgraph';
import { GraphState } from '../state';
// ...

type PlanStep = { id: number; query: string; tool: string; filters: Record<string, unknown> };

/** 將並行的 plan steps 分派為獨立的 Send 呼叫（map-reduce pattern）
 *  注意：只適合互相獨立的步驟；有順序依賴時改用 sequentialExecutor node
 */
function dispatchPlanSteps(state: GraphState): Send[] {
  const planSteps = state.multiToolPlan?.steps as PlanStep[] | undefined ?? [];
  return planSteps.map(step =>
    new Send('executePlanStep', { ...state, currentPlanStep: step })
  );
}

export function buildPlanExecuteGraph() {
  const graph = new StateGraph(GraphStateAnnotation)
    .addNode('semanticCache', semanticCacheNode)
    .addNode('filterBuild', filterBuildNode)          // Issue 1: filterBuild node added
    .addNode('planning', planningNode)
    .addNode('executePlanStep', executePlanStepNode)  // 接收 Send payload
    .addNode('synthesis', synthesisNode)
    .addNode('llmGeneration', llmGenerationNode)
    .addNode('judge', judgeNode)
    .addNode('memoryExtractor', memoryExtractorNode);

  graph.addEdge(START, 'semanticCache');
  graph.addConditionalEdges('semanticCache', routeAfterSemanticCache, { END, toolSelection: 'planning' });
  // dispatchPlanSteps returns Send[] — LangGraph treats this as a dynamic branch map
  graph.addConditionalEdges('planning', dispatchPlanSteps, {});
  graph.addEdge('executePlanStep', 'synthesis');
  graph.addEdge('synthesis', 'llmGeneration');
  graph.addEdge('llmGeneration', 'judge');
  graph.addConditionalEdges('judge', routeAfterJudge, {
    selfReflection: 'llmGeneration',
    memoryExtractor: 'memoryExtractor',
  });
  graph.addEdge('memoryExtractor', END);

  return graph.compile();
}
```

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 5: commit**

```bash
git add backend/src/services/ai-graph/nodes/planning.ts backend/src/services/ai-graph/nodes/synthesis.ts backend/src/services/ai-graph/graphs/plan-execute.ts
git commit -m "feat(ai): assemble plan-and-execute strategy LangGraph"
```

---

## Task 11: 建立 GraphService 主入口

**Files:**
- Create: `backend/src/services/ai-graph/index.ts`

GraphService 取代 `pipeline/engine.ts` 的角色：
1. 根據 `rag_strategy` 選擇對應 graph
2. 建立 Langfuse trace
3. 將 `PipelineContext` 轉為初始 `GraphState`
4. 呼叫 `graph.invoke()`
5. Flush Langfuse（透過 `waitUntil`）

- [x] **Step 1: 建立 `backend/src/services/ai-graph/index.ts`**

```typescript
import { PipelineContext } from '../pipeline/types';
import { GraphState } from './state';
import { getLangfuseClient, createTrace, flushLangfuse } from './langfuse';
import { baselineGraph } from './graphs/baseline';
import { agenticGraph } from './graphs/agentic';
import { planExecuteGraph } from './graphs/plan-execute';

/**
 * 執行 LangGraph AI pipeline。
 * 接受與原本 pipeline engine 相同的 PipelineContext，回傳執行後的 state（含 finalResponse）。
 */
export async function runAIGraph(ctx: PipelineContext): Promise<PipelineContext> {
  const langfuse = getLangfuseClient(ctx.env);
  const trace = createTrace(langfuse, {
    name: 'ai-pipeline',
    userId: ctx.userId,
    sessionId: ctx.request.sessionId,
    input: { query: ctx.request.query },
    metadata: { strategy: ctx.pipelineConfig.rag_strategy },
  });

  const initialState: GraphState = {
    ...ctx,
    langfuseTrace: trace,
  };

  // 根據策略選擇 graph
  const strategy = ctx.pipelineConfig.rag_strategy ?? 'baseline';
  let graph: typeof baselineGraph;
  if (strategy === 'agentic') {
    graph = agenticGraph;
  } else if (strategy === 'plan-execute') {
    graph = planExecuteGraph;
  } else {
    graph = baselineGraph;
  }

  const finalState = await graph.invoke(initialState, {
    recursionLimit: 20, // 防止無限迴圈
  });

  // Issue 5: 必須先 update trace，再 flush——否則 flush 時 trace 尚未更新，output 會遺失
  if (trace) {
    trace.update({ output: finalState.answer });
  }

  // Flush Langfuse non-blocking（在 trace.update 之後）
  if (ctx.waitUntilCtx && langfuse) {
    ctx.waitUntilCtx.waitUntil(flushLangfuse(langfuse));
  }

  // 回傳符合 PipelineContext 型別的結果
  return finalState as unknown as PipelineContext;
}
```

- [x] **Step 2: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 3: commit**

```bash
git add backend/src/services/ai-graph/index.ts
git commit -m "feat(ai): add GraphService main entry point with strategy selection"
```

---

## Task 12: Feature Flag 整合至 QueryService

**Files:**
- Modify: `backend/src/services/query/index.ts`

加入 `use_langgraph_engine` feature flag，讓新舊 pipeline 可以並行切換。

- [x] **Step 1: 閱讀 QueryService 中呼叫 pipeline engine 的位置**

```bash
grep -n "engine\|runPipeline\|pipelineEngine" backend/src/services/query/index.ts | head -20
```

- [x] **Step 2: 在 QueryService 的主執行路徑加入 feature flag 切換**

找到 pipeline engine 的呼叫點，在它之前加入：

```typescript
import { runAIGraph } from '../ai-graph';

// 在 ask() / processQuery() 方法中：
const useNewEngine = this.config?.use_langgraph_engine === true;
if (useNewEngine) {
  // 將現有 ctx 傳入 GraphService
  const result = await runAIGraph(ctx);
  return result.finalResponse!;
} else {
  // 原本的 pipeline engine 呼叫（保持不變）
  await engine.run(ctx);
  return ctx.finalResponse!;
}
```

注意：`use_langgraph_engine` 需要加入 `PipelineConfig` type 和 `ai_config` 表的預設值。

- [x] **Step 3: 在 `PipelineConfig` 加入 `use_langgraph_engine` 欄位**

```typescript
// backend/src/services/pipeline/types.ts 的 PipelineConfig 末尾加入：
use_langgraph_engine?: boolean;
```

- [x] **Step 4: typecheck**

```bash
cd backend && pnpm typecheck
```

- [x] **Step 5: 本機啟動確認舊路徑仍正常（feature flag 預設 false）**

```bash
cd backend && pnpm dev
# 在另一個 terminal：
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"query": "台灣有哪些知名攀岩場？"}'
```

Expected: 正常回應，`pipeline_trace` 中看不到 langfuse 欄位（因為 flag 未開）

- [x] **Step 6: commit**

```bash
git add backend/src/services/query/index.ts backend/src/services/pipeline/types.ts
git commit -m "feat(ai): add use_langgraph_engine feature flag in QueryService"
```

---

## Task 13: 驗證新引擎端對端 & Langfuse 追蹤

- [x] **Step 1: 透過 admin API 開啟 feature flag**

```bash
# 更新 ai_config 表中的 use_langgraph_engine
curl -X POST http://localhost:8787/api/v1/admin/ai/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"key": "use_langgraph_engine", "value": "true"}'
```

- [x] **Step 2: 測試 Baseline 策略**

```bash
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"query": "台灣有哪些適合初學者的攀岩路線？"}'
```

Expected: 正常回應，`pipeline_trace` 含 LangGraph 執行資訊

- [x] **Step 3: 確認 Langfuse 收到 trace**

前往 Langfuse dashboard（https://cloud.langfuse.com 或自建），確認：
- 看到 `ai-pipeline` trace
- 每個 node 有對應 span（semantic-cache, tool-selection, embedding, ...）
- Span 有 input/output 資訊
- Token usage 正確記錄

- [x] **Step 4: 測試 Agentic 策略**

```bash
# 先設定 rag_strategy = agentic
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"query": "幫我找三個 5.11b 難度的運動攀岩路線，要有詳細的動作說明"}'
```

Expected: 正常回應，Langfuse 顯示 agentic decision cycle

- [x] **Step 5: 測試 Plan-and-Execute 策略**

```bash
# 設定 rag_strategy = plan-execute
curl -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test_token>" \
  -d '{"query": "比較龍洞和小冬瓜這兩個攀岩場的特色和適合族群"}'
```

Expected: 正常回應，Langfuse 顯示 planning + parallel execution spans

- [x] **Step 6: 錯誤處理測試——Langfuse keys 未設定時**

在 `.dev.vars` 中移除 LANGFUSE keys，確認：
- AI 功能仍正常（Langfuse 靜默降級）
- 無任何錯誤拋出

- [x] **Step 7: deploy to preview 環境**

```bash
cd backend && pnpm deploy:preview
```

- [x] **Step 8: preview 環境驗測**

重複 Step 2-5 對 `api-preview.nobodyclimb.cc`

- [x] **Step 9: commit**

```bash
git add .
git commit -m "feat(ai): LangGraph + Langfuse migration complete, all strategies verified"
```

---

## Task 14: 清理與文件

**Files:**
- Create: `docs/ai-agent/langgraph-architecture.md`

- [x] **Step 1: 撰寫 `docs/ai-agent/langgraph-architecture.md`**

記錄：
- Graph 架構圖（Mermaid）
- 各 node 對應的原始 pipeline step
- Feature flag 切換方式
- Langfuse dashboard 觀察重點
- 如何新增 node / 修改 routing

- [x] **Step 2: 確認舊 pipeline engine 仍可透過 feature flag 切回**

```bash
# 設回 use_langgraph_engine = false，跑一次完整請求確認 fallback 正常
```

- [x] **Step 3: commit**

```bash
git add docs/ai-agent/langgraph-architecture.md
git commit -m "docs(ai): add LangGraph architecture documentation"
```

---

## 關鍵注意事項

1. **Cloudflare Workers 相容性**：`nodejs_compat` flag 已啟用，`@langchain/langgraph` 在此環境可運行。如遇到特定 Node.js API 缺失，優先查看 `@langchain/langgraph` changelog 和 Cloudflare Workers compatibility dates。

2. **Bundle Size**：`@langchain/langgraph` 加上 `langfuse` 會增加 bundle size。若 Workers bundle 超過限制，考慮：
   - 使用 `wrangler` 的 tree-shaking
   - 僅 import 需要的模組（不 import 整個 `@langchain/core`）
   - 確認 `compatibility_date = "2024-12-01"` 已支援所需 API

3. **Streaming 維持不變**：`llm-generation` node 的 streaming 邏輯透過 `state.onToken` callback 維持，對前端透明。

4. **Langfuse Flush 時機**：Cloudflare Workers 是 request-scoped，必須透過 `waitUntilCtx.waitUntil()` 確保 flush 完成再結束 worker，否則資料會遺失。

5. **自訂 Reducer**：`trace` 和 `tokenBreakdown` 欄位使用 merge reducer，其他欄位使用 last-write-wins（LangGraph 預設）。

6. **Plan-and-Execute 的 Send API**：LangGraph `Send` API 讓 map-reduce 成為可能，但每個 step 的 state 是獨立副本。`synthesis` node 需從 `branchResults`（或自訂 aggregation reducer）合併所有 step 結果。

7. **舊 pipeline 保留**：migration 完成後，舊 `pipeline/` 目錄保留作為 fallback，直到新引擎在 production 穩定運行 2 週後再評估是否移除。
