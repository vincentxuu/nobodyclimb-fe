# Langfuse-Compatible Pipeline Trace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將現有 `pipeline_trace` 的 flat key-value 格式遷移為 Langfuse-compatible Trace/Span/Generation 資料模型，並更新 admin dashboard 以瀑布圖顯示各階段時間線。

**Architecture:** 採用雙軌遷移策略：各 step 同時保留 `ctx.trace.xxx`（後向相容）並新增 `withSpan()`/`skipSpan()` 呼叫，將 observations 收集到 `ctx.traceCtx.observations[]`。Pipeline 結束時 engine.ts 將其序列化為 `PipelineTraceDoc` 寫入 `pipeline_trace` 欄位。Admin 前端依 `observations` key 是否存在判斷用新瀑布圖或舊卡片視圖 fallback。

**Tech Stack:** TypeScript, Cloudflare Workers, D1 (SQLite JSON column), Hono, React 19, Next.js 15, TailwindCSS, Vitest

---

## File Structure

```
backend/src/
├── utils/
│   └── span.ts                                  # NEW: withSpan, skipSpan, errorSpan helpers
├── services/pipeline/
│   ├── types.ts                                 # MODIFY: add Observation / PipelineTraceDoc types + traceCtx field
│   ├── context.ts                               # MODIFY: initialize traceCtx in createPipelineContext()
│   ├── engine.ts                                # MODIFY: build PipelineTraceDoc, serialize to pipeline_trace
│   └── steps/
│       ├── semantic-cache.ts                    # MODIFY: add withSpan / skipSpan
│       ├── tool-selection.ts                    # MODIFY: add withSpan for query_parsing + tool_selection
│       ├── text-to-sql.ts                       # MODIFY: add withSpan
│       ├── multi-query.ts                       # MODIFY: add withSpan
│       ├── filter-build.ts                      # MODIFY: add withSpan
│       ├── hyde.ts                              # MODIFY: add withSpan
│       ├── embedding.ts                         # MODIFY: add withSpan
│       ├── hybrid-search.ts                     # MODIFY: add withSpan
│       ├── cross-encoder.ts                     # MODIFY: add withSpan
│       ├── mmr.ts                               # MODIFY: add withSpan
│       ├── popularity-rerank.ts                 # MODIFY: add withSpan
│       ├── llm-generation.ts                    # MODIFY: add withSpan for llm_generation + guardrails_output + memory_extraction
│       ├── self-reflection.ts                   # MODIFY: add withSpan
│       └── judge.ts                             # MODIFY: add withSpan
└── routes/
    └── ai.ts                                    # MODIFY: push guardrails_input + quota_check to traceCtx.observations

apps/web/src/
├── lib/api/
│   └── admin-ai.ts                              # MODIFY: add observations array to pipeline_trace type
└── components/admin/ai-log-detail/
    ├── types.ts                                 # MODIFY: add Observation / PipelineTraceDoc types
    └── pipeline-timeline.tsx                    # MODIFY: add waterfall view when observations present
```

**Note:** `admin-ai.ts` (backend route) 的 `pipeline` 組裝邏輯完全保留，frontend 改為從 `observations[]` 驅動瀑布圖而不再仰賴 `pipeline` 物件（舊 fallback 時才用）。

---

## Task 1: Add Observation & PipelineTraceDoc types to types.ts

**Files:**
- Modify: `backend/src/services/pipeline/types.ts`

- [ ] **Step 1: 在 types.ts 末尾加入 Observation 相關型別**

在 `PipelineContext` interface 宣告前找到適合位置（型別定義區），加入：

```typescript
// ────────────────────────────────────────────
// Langfuse-Compatible Pipeline Trace Types
// ────────────────────────────────────────────

export interface BaseObservation {
  id: string
  traceId: string
  name: string
  startTime: string   // ISO 8601
  endTime: string     // ISO 8601
  input?: unknown
  output?: unknown
  level: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR'
  statusMessage?: string
  metadata?: unknown
  parentObservationId?: string
}

export interface SpanObservation extends BaseObservation {
  kind: 'span'
}

export interface GenerationObservation extends BaseObservation {
  kind: 'generation'
  model: string
  modelParameters?: Record<string, unknown>
  usageDetails?: {
    input: number    // prompt tokens
    output: number   // completion tokens
    total: number
  }
}

export type Observation = SpanObservation | GenerationObservation

export interface PipelineTraceDoc {
  id: string                      // traceId = ai_query_logs.id
  name: string                    // "ai-ask"
  timestamp: string               // ISO 8601, request start
  input: { query: string }
  output: { answer: string }
  userId: string | null
  metadata: {
    query_type: string | null
    cache_hit: boolean
    model_used: string | null
  }
  observations: Observation[]     // ordered by startTime
}
```

- [ ] **Step 2: 在 PipelineContext interface 加入 traceCtx 欄位**

找到 `PipelineContext` interface（位在 types.ts，有 `trace: Record<string, unknown>` 欄位），在 `trace` 欄位旁加入：

```typescript
traceCtx: {
  traceId: string
  observations: Observation[]
}
```

- [ ] **Step 3: 執行 TypeScript 型別檢查確認無 error**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

Expected: 型別錯誤僅出現在 context.ts（traceCtx 尚未初始化），其餘無新增 error

- [ ] **Step 4: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/services/pipeline/types.ts
git commit -m "feat(trace): add Langfuse-compatible Observation and PipelineTraceDoc types"
```

---

## Task 2: Implement span.ts helpers (TDD)

**Files:**
- Create: `backend/src/utils/span.ts`
- Create: `backend/src/utils/__tests__/span.test.ts`

- [ ] **Step 1: 建立測試檔**

```typescript
// backend/src/utils/__tests__/span.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withSpan, skipSpan, errorSpan } from '../span'
import type { PipelineContext } from '../../services/pipeline/types'

function makeCtx(): Pick<PipelineContext, 'traceCtx'> {
  return {
    traceCtx: {
      traceId: 'trace-001',
      observations: [],
    },
  }
}

describe('withSpan (span kind)', () => {
  it('pushes a span observation with correct fields', async () => {
    const ctx = makeCtx()
    const result = await withSpan(
      ctx as PipelineContext,
      'semantic_cache',
      'span',
      async () => ({ hit: false, similarity_score: 0.5 }),
      (r) => ({ input: { query: 'test', threshold: 0.8 }, output: r }),
    )
    expect(result).toEqual({ hit: false, similarity_score: 0.5 })
    expect(ctx.traceCtx.observations).toHaveLength(1)
    const obs = ctx.traceCtx.observations[0]
    expect(obs.kind).toBe('span')
    expect(obs.name).toBe('semantic_cache')
    expect(obs.traceId).toBe('trace-001')
    expect(obs.level).toBe('DEFAULT')
    expect(obs.input).toEqual({ query: 'test', threshold: 0.8 })
    expect(obs.output).toEqual({ hit: false, similarity_score: 0.5 })
    expect(obs.startTime).toBeTruthy()
    expect(obs.endTime).toBeTruthy()
    expect(new Date(obs.endTime).getTime()).toBeGreaterThanOrEqual(new Date(obs.startTime).getTime())
  })

  it('pushes ERROR level and statusMessage when fn throws', async () => {
    const ctx = makeCtx()
    await expect(
      withSpan(ctx as PipelineContext, 'embedding', 'span', async () => { throw new Error('timeout') }, () => ({}))
    ).rejects.toThrow('timeout')
    expect(ctx.traceCtx.observations).toHaveLength(1)
    const obs = ctx.traceCtx.observations[0]
    expect(obs.level).toBe('ERROR')
    expect(obs.statusMessage).toBe('timeout')
  })
})

describe('withSpan (generation kind)', () => {
  it('pushes a generation observation with usageDetails', async () => {
    const ctx = makeCtx()
    await withSpan(
      ctx as PipelineContext,
      'llm_generation',
      'generation',
      async () => ({ content: 'answer', usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 } }),
      (r) => ({
        model: '@cf/google/gemma-3-12b-it',
        input: { context_length: 200, doc_count: 5 },
        output: { content: r.content.slice(0, 300) },
        usageDetails: { input: r.usage.prompt_tokens, output: r.usage.completion_tokens, total: r.usage.total_tokens },
      }),
    )
    const obs = ctx.traceCtx.observations[0]
    expect(obs.kind).toBe('generation')
    if (obs.kind === 'generation') {
      expect(obs.model).toBe('@cf/google/gemma-3-12b-it')
      expect(obs.usageDetails).toEqual({ input: 100, output: 50, total: 150 })
    }
  })
})

describe('skipSpan', () => {
  it('pushes a DEBUG span with skipped:true', () => {
    const ctx = makeCtx()
    skipSpan(ctx as PipelineContext, 'text_to_sql', 'query_type is general_knowledge')
    expect(ctx.traceCtx.observations).toHaveLength(1)
    const obs = ctx.traceCtx.observations[0]
    expect(obs.level).toBe('DEBUG')
    expect((obs.metadata as Record<string, unknown>)?.skipped).toBe(true)
    expect((obs.metadata as Record<string, unknown>)?.reason).toBe('query_type is general_knowledge')
    expect(obs.name).toBe('text_to_sql')
    // skipSpan should have same startTime and endTime
    expect(obs.startTime).toBe(obs.endTime)
  })
})

describe('errorSpan', () => {
  it('pushes an ERROR level span', () => {
    const ctx = makeCtx()
    const start = new Date().toISOString()
    errorSpan(ctx as PipelineContext, 'hyde', start, new Error('LLM error'))
    const obs = ctx.traceCtx.observations[0]
    expect(obs.level).toBe('ERROR')
    expect(obs.statusMessage).toBe('LLM error')
    expect(obs.startTime).toBe(start)
  })
})
```

- [ ] **Step 2: 執行測試確認 FAIL**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm vitest run src/utils/__tests__/span.test.ts 2>&1 | tail -20
```

Expected: `Cannot find module '../span'`

- [ ] **Step 3: 實作 span.ts**

```typescript
// backend/src/utils/span.ts
import type {
  PipelineContext,
  Observation,
  SpanObservation,
  GenerationObservation,
} from '../services/pipeline/types'

type SpanIO = Partial<
  Omit<SpanObservation, 'id' | 'name' | 'startTime' | 'endTime' | 'level' | 'traceId' | 'kind'>
>
type GenerationIO = Partial<
  Omit<GenerationObservation, 'id' | 'name' | 'startTime' | 'endTime' | 'level' | 'traceId' | 'kind'>
> & { model: string }

export async function withSpan<T>(
  ctx: PipelineContext,
  name: string,
  kind: 'span',
  fn: () => Promise<T>,
  getIO: (result: T) => SpanIO,
): Promise<T>

export async function withSpan<T>(
  ctx: PipelineContext,
  name: string,
  kind: 'generation',
  fn: () => Promise<T>,
  getIO: (result: T) => GenerationIO,
): Promise<T>

export async function withSpan<T>(
  ctx: PipelineContext,
  name: string,
  kind: 'span' | 'generation',
  fn: () => Promise<T>,
  getIO: (result: T) => SpanIO | GenerationIO,
): Promise<T> {
  const startTime = new Date().toISOString()
  let result: T
  try {
    result = await fn()
  } catch (err) {
    const endTime = new Date().toISOString()
    const obs: SpanObservation = {
      id: crypto.randomUUID(),
      traceId: ctx.traceCtx.traceId,
      name,
      kind: 'span',
      startTime,
      endTime,
      level: 'ERROR',
      statusMessage: err instanceof Error ? err.message : String(err),
    }
    ctx.traceCtx.observations.push(obs)
    throw err
  }
  const endTime = new Date().toISOString()
  const io = getIO(result)
  let obs: Observation
  if (kind === 'generation') {
    const genIO = io as GenerationIO
    obs = {
      id: crypto.randomUUID(),
      traceId: ctx.traceCtx.traceId,
      name,
      kind: 'generation',
      startTime,
      endTime,
      level: 'DEFAULT',
      model: genIO.model,
      ...genIO,
    } as GenerationObservation
  } else {
    obs = {
      id: crypto.randomUUID(),
      traceId: ctx.traceCtx.traceId,
      name,
      kind: 'span',
      startTime,
      endTime,
      level: 'DEFAULT',
      ...io,
    } as SpanObservation
  }
  ctx.traceCtx.observations.push(obs)
  return result
}

export function skipSpan(ctx: PipelineContext, name: string, reason?: string): void {
  const now = new Date().toISOString()
  const obs: SpanObservation = {
    id: crypto.randomUUID(),
    traceId: ctx.traceCtx.traceId,
    name,
    kind: 'span',
    startTime: now,
    endTime: now,
    level: 'DEBUG',
    metadata: { skipped: true, reason },
  }
  ctx.traceCtx.observations.push(obs)
}

export function errorSpan(
  ctx: PipelineContext,
  name: string,
  startTime: string,
  err: unknown,
): void {
  const obs: SpanObservation = {
    id: crypto.randomUUID(),
    traceId: ctx.traceCtx.traceId,
    name,
    kind: 'span',
    startTime,
    endTime: new Date().toISOString(),
    level: 'ERROR',
    statusMessage: err instanceof Error ? err.message : String(err),
  }
  ctx.traceCtx.observations.push(obs)
}
```

- [ ] **Step 4: 執行測試確認 PASS**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm vitest run src/utils/__tests__/span.test.ts 2>&1 | tail -20
```

Expected: All tests pass (8 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/utils/span.ts backend/src/utils/__tests__/span.test.ts
git commit -m "feat(trace): add withSpan/skipSpan/errorSpan helpers with tests"
```

---

## Task 3: Initialize traceCtx in context.ts

**Files:**
- Modify: `backend/src/services/pipeline/context.ts`

Context: `createPipelineContext()` 目前回傳含 `trace: opts.extraTrace ? { ...opts.extraTrace } : {}` 的物件，需新增 `traceCtx` 初始化。opts 需接受外部傳入 traceId（來自 `ai_query_logs.id`）。

- [ ] **Step 1: 更新 createPipelineContext opts 型別，加入 traceId 參數**

找到 opts 型別宣告（函式參數物件），在 `extraTrace?` 欄位旁加入：

```typescript
traceId?: string    // ai_query_logs.id，若未提供則自動生成
```

- [ ] **Step 2: 在回傳物件中加入 traceCtx 初始化**

找到 `trace: opts.extraTrace ? { ...opts.extraTrace } : {}` 這行，在其下方加入：

```typescript
traceCtx: {
  traceId: opts.traceId ?? crypto.randomUUID(),
  observations: [],
},
```

- [ ] **Step 3: 執行 TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

Expected: 無 error（ai.ts 尚未傳入 traceId 也不會報錯，因為是 optional）

- [ ] **Step 4: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/services/pipeline/context.ts
git commit -m "feat(trace): initialize traceCtx in createPipelineContext"
```

---

## Task 4: Migrate guardrails_input & quota_check spans in ai.ts

**Files:**
- Modify: `backend/src/routes/ai.ts`

Context: `ai.ts` 在建立 `extraTrace` 並呼叫 `QueryService.ask()` 之前執行 guardrails 和 quota check，無法用 `withSpan()`。`traceCtx` 存在於 context 物件上，而 context 在 `QueryService.ask()` 內部的 `createPipelineContext()` 建立，ai.ts 無法直接操作 context。

**解法：** 讓 `ai.ts` 將 `prebuiltObservations` 和 `traceId` 傳入 `QueryService.ask()`，後者再傳給 `createPipelineContext()`，在 context 初始化時就 seed 進 `traceCtx.observations`。

需更新：
1. `types.ts` — `createPipelineContext` opts 加入 `prebuiltObservations` 和 `traceId`
2. `context.ts` — 在 `traceCtx.observations` 初始化時使用 `prebuiltObservations`
3. `query/index.ts` — `QueryService.ask()` 簽名加入 `prebuiltObservations?: Observation[]` 和 `traceId?: string`，傳入 `createPipelineContext()`
4. `ai.ts` — 組裝 observations 並傳給 `queryService.ask()`

- [ ] **Step 1: 在 types.ts 的 createPipelineContext opts 加入 prebuiltObservations**

找到先前加入的 `traceId?: string` 行，在旁加入：

```typescript
prebuiltObservations?: Observation[]   // guardrails_input, quota_check 等 middleware 觀測
```

- [ ] **Step 2: 在 context.ts 的 traceCtx 初始化使用 prebuiltObservations**

找到：
```typescript
traceCtx: {
  traceId: opts.traceId ?? crypto.randomUUID(),
  observations: [],
},
```

改為：
```typescript
traceCtx: {
  traceId: opts.traceId ?? crypto.randomUUID(),
  observations: [...(opts.prebuiltObservations ?? [])],
},
```

- [ ] **Step 3: 在 ai.ts 組裝 guardrails_input observation**

找到 `extraTrace.guardrails_input = guardrailsInputTrace` 附近的程式碼，在 `extraTrace` 賦值後加入（保留原本 extraTrace 賦值不動，dual-track）：

```typescript
const guardrailsObsStart = guardrailsStart  // ISO string，需確認該變數名稱
const guardrailsObs: import('../services/pipeline/types').SpanObservation = {
  id: crypto.randomUUID(),
  traceId: logId,           // logId = ai_query_logs.id，在 ai.ts 先生成
  name: 'guardrails_input',
  kind: 'span',
  startTime: guardrailsObsStart,
  endTime: new Date().toISOString(),
  level: guardrailsInputTrace.passed ? 'DEFAULT' : 'ERROR',
  input: { query: body.query.slice(0, 200) },
  output: {
    passed: guardrailsInputTrace.passed,
    checks_run: guardrailsInputTrace.checks_run ?? [],
    triggered_check: guardrailsInputTrace.triggered_check ?? null,
  },
}
const prebuiltObservations: import('../services/pipeline/types').Observation[] = [guardrailsObs]
```

> **Note:** 需先確認 `ai.ts` 中實際的 guardrails 變數名稱，調整上述程式碼。用以下指令確認：
> ```bash
> grep -n "guardrails\|guardrailsInput\|guardrailsStart" /Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/ai.ts | head -20
> ```

- [ ] **Step 4: 在 ai.ts 組裝 quota_check observation**

找到 `extraTrace.quota_check = {...}` 賦值後加入：

```typescript
const quotaObs: import('../services/pipeline/types').SpanObservation = {
  id: crypto.randomUUID(),
  traceId: logId,
  name: 'quota_check',
  kind: 'span',
  startTime: quotaCheckStart,   // 需在 quota check 執行前記錄 start time
  endTime: new Date().toISOString(),
  level: 'DEFAULT',
  input: { rank: rank?.rank_id ?? 'foothill', estimated_tokens: estimatedTokens },
  output: {
    result: 'passed',
    daily_ai_used: rank?.daily_ai_used ?? 0,
    daily_ai_limit: rank?.daily_ai_limit ?? 2,
  },
}
prebuiltObservations.push(quotaObs)
```

- [ ] **Step 5: 更新 QueryService.ask() 簽名以接受 prebuiltObservations 和 traceId**

`QueryService.ask()` 目前簽名（`backend/src/services/query/index.ts` line 33）：

```typescript
async ask(request, userId?, ctx?, onToken?, extraTrace?)
```

在末尾加入兩個可選參數：

```typescript
async ask(
  request: AIAskRequest,
  userId?: string,
  ctx?: { waitUntil(promise: Promise<unknown>): void },
  onToken?: (token: string) => Promise<void>,
  extraTrace?: Record<string, unknown>,
  prebuiltObservations?: Observation[],   // NEW
  traceId?: string,                        // NEW
): Promise<AIAskResponse>
```

在 `createPipelineContext()` 呼叫處（約 line 125）加入：

```typescript
prebuiltObservations,
traceId,
```

- [ ] **Step 6: 將 prebuiltObservations 和 traceId 傳入 QueryService.ask() from ai.ts**

找到 `ai.ts` 中呼叫 `queryService.ask()` 的地方：

```bash
grep -n "\.ask(" /Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/ai.ts | head -10
```

在 `extraTrace` 參數後加入 `prebuiltObservations` 和 `logId`（logId 即本次查詢的 `ai_query_logs.id`，確認其生成時機）：

```typescript
queryService.ask(request, userId, waitUntilCtx, onToken, extraTrace, prebuiltObservations, logId)
```

- [ ] **Step 7: TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

Expected: 無新增 error

- [ ] **Step 8: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/routes/ai.ts \
         backend/src/services/pipeline/context.ts \
         backend/src/services/pipeline/types.ts \
         backend/src/services/query/index.ts
git commit -m "feat(trace): push guardrails_input and quota_check to traceCtx observations"
```

---

## Task 5: Serialize traceCtx to PipelineTraceDoc in engine.ts

**Files:**
- Modify: `backend/src/services/pipeline/engine.ts`

Context: pipeline 結束時（在寫入 DB 前）需從 `ctx.traceCtx` 建立 `PipelineTraceDoc` 並序列化為 JSON 存入 `pipeline_trace`。

目前 engine.ts 在約 line 590 呼叫 `ctx.trace.token_breakdown = ctx.tokenBreakdown`，在 line 601-603 設定 `memory_extraction`。需找到最後組裝 pipeline_trace 並傳給 logQuery 的地方（`pipelineTrace` 或 `ctx.trace`）。

- [ ] **Step 1: 確認 engine.ts 中 pipeline_trace 的組裝位置**

```bash
grep -n "pipeline_trace\|pipelineTrace\|logQuery\|cache-log" /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/engine.ts | head -20
```

- [ ] **Step 2: 在組裝 pipeline_trace 的位置之後，建立 PipelineTraceDoc**

找到組裝最終 trace 並傳給 logQuery 的程式碼段，在其前加入：

```typescript
import type { PipelineTraceDoc } from './types'

// 建立 Langfuse-compatible trace doc（雙軌：ctx.trace 仍保留舊格式）
const pipelineTraceDoc: PipelineTraceDoc = {
  id: ctx.traceCtx.traceId,
  name: 'ai-ask',
  timestamp: new Date(ctx.startTime).toISOString(),
  input: { query: ctx.request.query },
  output: { answer: ctx.answer ?? '' },
  userId: ctx.userId ?? null,
  metadata: {
    query_type: ctx.queryType ?? null,
    cache_hit: Boolean(ctx.earlyReturn),
    model_used: ctx.effectiveLlmModel ?? null,
  },
  observations: ctx.traceCtx.observations,
}

// 將舊 flat trace 欄位合併進 pipelineTraceDoc（backward compat 保留 token_breakdown 等）
const finalTrace = {
  ...ctx.trace,
  ...pipelineTraceDoc,  // observations 覆寫舊 key，id/name/timestamp 也在此
}
```

- [ ] **Step 3: 將 finalTrace 傳入 logQuery（取代原本的 ctx.trace）**

找到呼叫 `logQuery` 的程式碼，確認 `pipelineTrace` 參數，改為傳入 `JSON.stringify(finalTrace)`。

> **Note:** 確認實際變數名稱：
> ```bash
> grep -n "logQuery\|pipelineTrace\|JSON.stringify" /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/engine.ts | head -10
> ```

- [ ] **Step 4: 驗證 SQL token_breakdown 路徑不受影響**

`finalTrace = { ...ctx.trace, ...pipelineTraceDoc }` 中，`ctx.trace.token_breakdown` 仍存在（dual-track），而 `pipelineTraceDoc` 不含 `token_breakdown` key，因此展開後 `$.token_breakdown.xxx` 路徑保持不變。

手動驗證 merge 結果：

```typescript
// 在本地 Node.js / bun 執行確認 key 優先順序
const ctxTrace = { token_breakdown: { main_generation: { prompt_tokens: 100 } }, cache: { type: 'kv' } }
const traceDoc = { id: 'x', name: 'ai-ask', observations: [], metadata: { query_type: 'complex', cache_hit: false, model_used: 'gemma' } }
const merged = { ...ctxTrace, ...traceDoc }
console.log(merged.token_breakdown)  // 應仍為 { main_generation: { prompt_tokens: 100 } }
console.log(merged.cache)            // 應仍為 { type: 'kv' }
console.log(merged.observations)     // 應為 []
```

Expected: `token_breakdown` 和 `cache` 來自 `ctxTrace`，未被覆寫；`observations` 來自 `traceDoc`

- [ ] **Step 5: 執行測試確認無 regression**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm vitest run 2>&1 | tail -20
```

Expected: All tests pass

- [ ] **Step 6: TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

- [ ] **Step 7: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/services/pipeline/engine.ts
git commit -m "feat(trace): serialize traceCtx to PipelineTraceDoc in engine.ts"
```

---

## Task 6: Add withSpan to span-based step files

**Files:**
- Modify: `backend/src/services/pipeline/steps/semantic-cache.ts`
- Modify: `backend/src/services/pipeline/steps/filter-build.ts`
- Modify: `backend/src/services/pipeline/steps/embedding.ts`
- Modify: `backend/src/services/pipeline/steps/hybrid-search.ts`
- Modify: `backend/src/services/pipeline/steps/cross-encoder.ts`
- Modify: `backend/src/services/pipeline/steps/mmr.ts`
- Modify: `backend/src/services/pipeline/steps/popularity-rerank.ts`

**Pattern:** 每個 step 保留現有 `ctx.trace.xxx = {...}` 不動（dual-track），新增 `withSpan()` 或 `skipSpan()` 呼叫。

以 `semantic-cache.ts` 為範例：

- [ ] **Step 1: 確認 semantic-cache.ts 目前的 trace 寫法**

```bash
cat -n /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/semantic-cache.ts | head -80
```

- [ ] **Step 2: 為 semantic-cache.ts 加入 withSpan**

在 import 區加入：
```typescript
import { withSpan, skipSpan } from '../../../utils/span'
```

將主要邏輯包入 `withSpan()`（保留原 `ctx.trace.semantic_cache = {...}` 不動）：

```typescript
// 若 cache hit 直接 return，用 withSpan 包整個 function 主體
return await withSpan(ctx, 'semantic_cache', 'span', async () => {
  // ...原本的 semantic cache 邏輯...
  return result
}, (result) => ({
  input: { query: ctx.request.query.slice(0, 200), threshold: ctx.pipelineConfig.semantic_cache_threshold ?? 0.85 },
  output: { hit: Boolean(result?.hit), similarity_score: result?.similarity_score },
}))
```

> 若 step 有 early-return（cache hit），在 withSpan 內部 return 即可，observation 照樣被 push。

- [ ] **Step 3: 重複 Step 1-2 pattern 給其餘 6 個 span-based steps**

針對每個 step，先確認目前 trace 寫法再修改：

```bash
grep -n "ctx\.trace\." \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/filter-build.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/embedding.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/hybrid-search.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/cross-encoder.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/mmr.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/popularity-rerank.ts
```

spec 規定的 input/output 欄位如下：

| Step | kind | input fields | output fields |
|------|------|-------------|---------------|
| `filter_build` | span | `query` | `filter_applied`, `area_id?`, `crag_id?`, `grade?`, `route_type?` |
| `embedding` | span | `hyde_embedded`, `expanded_count`, `early_vector_reused` | `duration_ms` |
| `hybrid_search` | span | `strategy`, `doc_count_requested` | `doc_count`, `top_score`, `paths` |
| `cross_encoder` | span | `input_count`, `threshold` | `filtered_count`, `top_scores` |
| `mmr` | span | `lambda`, `input_count` | `selected_count` |
| `popularity_rerank` | span | `popularity_weight`, `doc_count` | `top_selected`, `personalized` |

若 step 因 `queryType` 被跳過（已有 `if (isCacheHit) return` 邏輯），在跳過分支加入 `skipSpan(ctx, 'step_name', 'reason')`。

- [ ] **Step 4: 執行所有後端測試確認無 regression**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm vitest run 2>&1 | tail -20
```

Expected: All tests pass

- [ ] **Step 5: TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/services/pipeline/steps/semantic-cache.ts \
         backend/src/services/pipeline/steps/filter-build.ts \
         backend/src/services/pipeline/steps/embedding.ts \
         backend/src/services/pipeline/steps/hybrid-search.ts \
         backend/src/services/pipeline/steps/cross-encoder.ts \
         backend/src/services/pipeline/steps/mmr.ts \
         backend/src/services/pipeline/steps/popularity-rerank.ts
git commit -m "feat(trace): add withSpan to all span-based pipeline steps"
```

---

## Task 7: Add withSpan to generation-based step files

**Files:**
- Modify: `backend/src/services/pipeline/steps/tool-selection.ts`
- Modify: `backend/src/services/pipeline/steps/hyde.ts`
- Modify: `backend/src/services/pipeline/steps/multi-query.ts`
- Modify: `backend/src/services/pipeline/steps/text-to-sql.ts`
- Modify: `backend/src/services/pipeline/steps/llm-generation.ts`
- Modify: `backend/src/services/pipeline/steps/judge.ts`
- Modify: `backend/src/services/pipeline/steps/self-reflection.ts`

**Pattern:** generation 類 step 需傳入 `model` 和 `usageDetails`（從 LLM response usage 讀取）。

- [ ] **Step 1: 確認各 generation step 的 usage 存取方式**

```bash
grep -n "usage\|tokenBreakdown\|promptTokens\|completion_tokens" \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/tool-selection.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/hyde.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/multi-query.ts \
  /Users/xiaoxu/Projects/nobodyclimb/backend/src/services/pipeline/steps/judge.ts 2>/dev/null | head -30
```

- [ ] **Step 2: tool-selection.ts — 新增 query_parsing (generation) + tool_selection (span) observations**

此 step 需 emit 兩個 observations：
1. `query_parsing`（generation）：包圍 LLM call
2. `tool_selection`（span）：routing decision，在 LLM call 之後

```typescript
// query_parsing generation observation
const queryParsingResult = await withSpan(ctx, 'query_parsing', 'generation', async () => {
  // 原本的 LLM call 邏輯
  return llmResult
}, (r) => ({
  model: ctx.pipelineConfig.query_classifier_model ?? '@cf/google/gemma-3-12b-it',
  input: { query: ctx.request.query },
  output: { query_type: r.query_type, tool: r.tool, confidence: r.confidence, params: r.params },
  usageDetails: r.usage ? { input: r.usage.prompt_tokens, output: r.usage.completion_tokens, total: r.usage.total_tokens } : undefined,
}))

// tool_selection span observation（routing decision，無 LLM call；注意必須 await）
await withSpan(ctx, 'tool_selection', 'span', async () => queryParsingResult, (r) => ({
  input: { query_type: r.query_type, tool: r.tool },
  output: { selected_tool: r.tool, fallback: Boolean(r.fallback) },
}))
```

> **Note:** 以上為 pseudo-code，需依 `tool-selection.ts` 實際結構調整。

- [ ] **Step 3: 重複 Step 2 pattern 給其餘 generation steps**

spec 規定的 input/output 欄位：

| Step | kind | input fields | output fields |
|------|------|-------------|---------------|
| `hyde` | generation | `query` | `hydeDoc` (300 chars max) |
| `multi_query` | generation | `query`, `count` | `queries: string[]` |
| `text_to_sql` | generation | `query`, `path` | `row_count?`, `candidate_count?`, `clarification_type?` |
| `llm_generation` | generation | `messages (truncated)`, `context_length`, `doc_count` | `content` (300 chars max) |
| `judge` | generation | `answer` (300 chars max), `context_chars` | `groundedness`, `quality`, `constraint_ok` |
| `self_reflection` | generation | `trigger_reason`, `original_answer` (300 chars max) | `revised_answer` (300 chars max) |

`llm-generation.ts` 額外需 emit `guardrails_output` span 和 `memory_extraction` span（見 spec 的 Notes）。

- [ ] **Step 4: TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

- [ ] **Step 5: 執行所有後端測試**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm vitest run 2>&1 | tail -20
```

Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/services/pipeline/steps/tool-selection.ts \
         backend/src/services/pipeline/steps/hyde.ts \
         backend/src/services/pipeline/steps/multi-query.ts \
         backend/src/services/pipeline/steps/text-to-sql.ts \
         backend/src/services/pipeline/steps/llm-generation.ts \
         backend/src/services/pipeline/steps/judge.ts \
         backend/src/services/pipeline/steps/self-reflection.ts
git commit -m "feat(trace): add withSpan to all generation-based pipeline steps"
```

---

## Task 8: Update admin-ai.ts pipeline object to read timing from observations

**Files:**
- Modify: `backend/src/routes/admin-ai.ts`

Context: 目前 `admin-ai.ts` 在 `/logs/:id` 組裝 `pipeline` 物件時，timing 資料來自 log 欄位（`log.embedding_ms`、`log.retrieval_ms`、`log.generation_ms`）。這些欄位是 aggregate 值，無法區分各子步驟（如 hybrid_search vs cross_encoder vs mmr）的個別時長。

根據 spec item 6「update pipeline object to read from observations array」，需在 observations 存在時，從 observations lookup 豐富 pipeline 各 stage 的 `duration_ms`、`input`、`output` 欄位。

- [ ] **Step 1: 在 pipeline 組裝前建立 observations lookup map**

找到 `const pt = pipelineTrace as Record<string, unknown> | null;` 這行（約 line 370），在其後加入：

```typescript
// Langfuse-compatible: 若 observations 存在，建立 name → observation lookup
const ptDoc = pipelineTrace as import('../services/pipeline/types').PipelineTraceDoc | null
const obsMap = new Map<string, import('../services/pipeline/types').Observation>(
  (ptDoc?.observations ?? []).map((obs) => [obs.name, obs])
)

const obsDurationMs = (name: string): number | null => {
  const obs = obsMap.get(name)
  if (!obs || obs.level === 'DEBUG') return null
  return new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()
}
```

- [ ] **Step 2: 用 obsDurationMs 豐富各 pipeline stage 的 duration_ms**

找到 `embedding` stage 組裝：

```typescript
embedding: {
  service: 'services/embedding.ts (Workers AI bge-m3)',
  description: '將 query（和 hydeDoc）轉為向量',
  duration_ms: (log.embedding_ms as number) ?? null,
  ...
}
```

改為（observations 存在時優先用觀測值，fallback 到 log 欄位）：

```typescript
embedding: {
  service: 'services/embedding.ts (Workers AI bge-m3)',
  description: '將 query（和 hydeDoc）轉為向量',
  duration_ms: obsDurationMs('embedding') ?? (log.embedding_ms as number) ?? null,
  ...
}
```

同樣處理有 observations 可用的其他 stage：
- `query_parsing` → `obsDurationMs('query_parsing')`
- `hyde` → `obsDurationMs('hyde')`
- `generation` → `obsDurationMs('llm_generation')`（注意 observation 名稱為 `llm_generation`，不是 `generation`）
- `judge` → `obsDurationMs('judge')`
- `self_reflection` → `obsDurationMs('self_reflection')`

- [ ] **Step 3: 確認 SQL token_breakdown 和 cache.type 路徑不受影響**

```bash
grep -n "json_extract.*token_breakdown\|json_extract.*cache" /Users/xiaoxu/Projects/nobodyclimb/backend/src/routes/admin-ai.ts
```

Expected: 路徑仍是 `$.token_breakdown.xxx` 和 `$.cache.type`（dual-track 保留這些 keys）

- [ ] **Step 4: TypeScript 檢查**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/api typecheck 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add backend/src/routes/admin-ai.ts
git commit -m "feat(trace): enrich pipeline stage durations from observations in admin-ai.ts"
```

---

## Task 9: Update frontend types and PipelineTimeline waterfall view

**Files:**
- Modify: `apps/web/src/lib/api/admin-ai.ts`
- Modify: `apps/web/src/components/admin/ai-log-detail/types.ts`
- Modify: `apps/web/src/components/admin/ai-log-detail/pipeline-timeline.tsx`

### Part A: Update frontend types

- [ ] **Step 1: 在 apps/web/src/lib/api/admin-ai.ts 的 pipeline_trace 型別加入 observations**

找到 `pipeline_trace: {` 定義（約 line 95），在其內部加入：

```typescript
// Langfuse-compatible trace structure
id?: string
name?: string
timestamp?: string
input?: { query: string }
output?: { answer: string }
userId?: string | null
metadata?: {
  query_type: string | null
  cache_hit: boolean
  model_used: string | null
}
observations?: Array<{
  id: string
  traceId: string
  name: string
  kind: 'span' | 'generation'
  startTime: string
  endTime: string
  level: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR'
  statusMessage?: string
  input?: unknown
  output?: unknown
  metadata?: unknown
  parentObservationId?: string
  // generation only:
  model?: string
  modelParameters?: Record<string, unknown>
  usageDetails?: { input: number; output: number; total: number }
}>
```

- [ ] **Step 2: 在 types.ts 加入 ObservationItem 型別供 pipeline-timeline.tsx 使用**

```typescript
export type ObservationItem = NonNullable<NonNullable<AILogDetail['pipeline_trace']>['observations']>[number]
```

### Part B: PipelineTimeline waterfall view

- [ ] **Step 3: 確認現有 pipeline-timeline.tsx 結構**

```bash
cat -n /Users/xiaoxu/Projects/nobodyclimb/apps/web/src/components/admin/ai-log-detail/pipeline-timeline.tsx
```

- [ ] **Step 4: 在 PipelineTimeline 中加入 isNewFormat 判斷**

在 component 內部（`expandedStages` state 下方）加入：

```typescript
const isNewFormat = Boolean(pipelineTrace?.observations?.length)
```

- [ ] **Step 5: 實作 WaterfallTimeline sub-component**

在 `pipeline-timeline.tsx` 內新增（或在同目錄建立 `waterfall-timeline.tsx`）：

```tsx
function WaterfallTimeline({
  observations,
}: {
  observations: ObservationItem[]
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 計算總時長（用於比例計算；排除 skipped 和 async spans）
  // memory_extraction 是 async，其 startTime ≈ endTime，不計入 total
  const isAsyncObs = (obs: ObservationItem) =>
    obs.name === 'memory_extraction' &&
    (obs.output as Record<string, unknown> | undefined)?.async === true

  const totalMs = observations.reduce((sum, obs) => {
    if (obs.level === 'DEBUG') return sum  // skipped spans
    if (isAsyncObs(obs)) return sum        // async spans don't count toward total
    const ms = new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()
    return sum + ms
  }, 0)

  return (
    <div className="font-mono text-xs space-y-0.5">
      {observations.map((obs) => {
        const durationMs = new Date(obs.endTime).getTime() - new Date(obs.startTime).getTime()
        const isSkipped = obs.level === 'DEBUG' && (obs.metadata as Record<string, unknown>)?.skipped
        const isAsync = isAsyncObs(obs)
        const isError = obs.level === 'ERROR'
        const isGeneration = obs.kind === 'generation'
        const isExpanded = expandedIds.has(obs.id)
        const barPct = (!isSkipped && !isAsync && totalMs > 0) ? Math.min(100, (durationMs / totalMs) * 100) : 0

        return (
          <div key={obs.id}>
            {/* Row */}
            <button
              onClick={() => !isSkipped && !isAsync && toggle(obs.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1 rounded text-left hover:bg-muted/50 transition-colors',
                (isSkipped || isAsync) && 'opacity-40 cursor-default',
                isError && 'text-red-500',
              )}
            >
              {/* Expand chevron */}
              <span className="w-3 shrink-0">
                {!isSkipped && (isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
              </span>

              {/* Stage name */}
              <span className="w-40 shrink-0 truncate text-muted-foreground">{obs.name}</span>

              {/* Bar */}
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                {!isSkipped && (
                  <div
                    className={cn('h-full rounded-full', isError ? 'bg-red-500' : isGeneration ? 'bg-blue-500' : 'bg-emerald-500')}
                    style={{ width: `${barPct}%` }}
                  />
                )}
              </div>

              {/* Duration */}
              <span className="w-16 shrink-0 text-right text-muted-foreground">
                {isSkipped ? 'skipped' : isAsync ? 'async' : `${durationMs}ms`}
              </span>

              {/* Badges */}
              <span className="w-20 shrink-0 text-right">
                {isError && <span className="text-red-500">✗</span>}
                {!isError && !isSkipped && !isAsync && <span className="text-emerald-600">✓</span>}
                {isAsync && <span className="text-yellow-500 text-[10px]">[async]</span>}
                {isGeneration && !isAsync && <span className="ml-1 text-blue-500 text-[10px]">[gen]</span>}
              </span>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="mx-2 mb-1 p-2 bg-muted/30 rounded text-[11px] space-y-1">
                {obs.input !== undefined && (
                  <div>
                    <span className="text-muted-foreground">input: </span>
                    <span className="text-foreground">{JSON.stringify(obs.input, null, 2)}</span>
                  </div>
                )}
                {obs.output !== undefined && (
                  <div>
                    <span className="text-muted-foreground">output: </span>
                    <span className="text-foreground">{JSON.stringify(obs.output, null, 2)}</span>
                  </div>
                )}
                {obs.kind === 'generation' && obs.usageDetails && (
                  <div>
                    <span className="text-muted-foreground">tokens: </span>
                    <span>input: {obs.usageDetails.input}  output: {obs.usageDetails.output}  total: {obs.usageDetails.total}</span>
                  </div>
                )}
                {obs.kind === 'generation' && obs.model && (
                  <div>
                    <span className="text-muted-foreground">model: </span>
                    <span>{obs.model}</span>
                  </div>
                )}
                {obs.statusMessage && (
                  <div className="text-red-500">
                    <span className="text-muted-foreground">error: </span>
                    <span>{obs.statusMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Total */}
      <div className="border-t pt-1 flex justify-end px-2 text-muted-foreground">
        total: {totalMs}ms
      </div>
    </div>
  )
}
```

> **Note:** `cn` 來自 `@/lib/utils`，`ChevronDown`/`ChevronRight` 來自 `lucide-react`（已有 import）。

- [ ] **Step 6: 在 PipelineTimeline 的 return 中加入 format 判斷**

找到現有 return 的主要 JSX，在其前加入：

```tsx
if (isNewFormat && pipelineTrace?.observations) {
  return (
    <div className="space-y-4">
      {/* 保留原有的 header 區段（展開/收合全部按鈕） */}
      <WaterfallTimeline observations={pipelineTrace.observations} />
    </div>
  )
}

// fallback: 舊格式用原本的 pipeline card 視圖
return (
  // ...原有的 JSX...
)
```

- [ ] **Step 7: TypeScript 檢查（前端）**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm --filter @nobodyclimb/web typecheck 2>&1 | head -40
```

- [ ] **Step 8: 前端 build 確認**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
pnpm build:web 2>&1 | tail -20
```

Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add apps/web/src/lib/api/admin-ai.ts \
         apps/web/src/components/admin/ai-log-detail/types.ts \
         apps/web/src/components/admin/ai-log-detail/pipeline-timeline.tsx
git commit -m "feat(admin): add waterfall timeline view for Langfuse-compatible pipeline trace"
```

---

## Task 10: End-to-end smoke test

- [ ] **Step 1: 啟動 backend dev server**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb/backend
pnpm dev
```

- [ ] **Step 2: 取得 JWT token 並送出 AI 查詢**

`/api/v1/ai/ask` 需要登入 JWT。先取得 token：

```bash
TOKEN=$(curl -s -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<admin_email>","password":"<admin_password>"}' | jq -r '.data.token')
echo "TOKEN: $TOKEN"
```

送出查詢：

```bash
curl -s -X POST http://localhost:8787/api/v1/ai/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "台北附近有什麼攀岩路線"}' | jq '.observations | length // "no observations key — check finalTrace"'
```

> **Note:** `/ai/ask` 回傳的是 `{ answer, sources }` 格式，`pipeline_trace` 不在此 response 中。改查 admin logs 確認 DB 寫入。

- [ ] **Step 3: 查詢 admin logs 確認 observations 格式**

```bash
# 取最新 log id
LOG_ID=$(curl -s "http://localhost:8787/api/v1/admin/ai/logs?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.items[0].id')
echo "LOG_ID: $LOG_ID"

# 查 log detail
curl -s "http://localhost:8787/api/v1/admin/ai/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pipeline_trace.observations | length'
```

Expected: `observations` array 長度 > 0（至少有 guardrails_input + quota_check）

```bash
curl -s "http://localhost:8787/api/v1/admin/ai/logs/$LOG_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pipeline_trace.observations[0]'
```

Expected: 回傳 observation 物件含 `id`, `name`, `kind`, `startTime`, `endTime`, `level`, `input`, `output`

- [ ] **Step 4: 確認舊格式 fallback 正常**

在 admin dashboard 找一筆無 `observations` 的舊 log，確認仍顯示舊 card 視圖。

- [ ] **Step 5: Final commit**

```bash
cd /Users/xiaoxu/Projects/nobodyclimb
git add -p  # 確認沒有意外的 staged change
git commit -m "chore(trace): smoke test verified — Langfuse-compatible pipeline trace complete"
```
