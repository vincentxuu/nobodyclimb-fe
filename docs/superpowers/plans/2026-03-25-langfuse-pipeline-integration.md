# Langfuse Pipeline Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Langfuse observability into the RAG pipeline so every AI request produces a full trace with per-step spans and per-LLM-call generation records on Langfuse Cloud.

**Architecture:** Centralized instrumentation at the pipeline engine layer. Engine auto-wraps each step execution with a Langfuse span, and sets `ctx.currentLfSpan` so that LLM calls within the step become children of the span (nested hierarchy). Langfuse client is created per-request in `QueryService.ask()` and flushed via `ctx.waitUntil()`. When LANGFUSE keys are absent, all instrumentation is silently no-op.

**Tech Stack:** `langfuse` npm v3.38.6 (legacy SDK, fetch-based, CF Workers compatible), Cloudflare Workers, Hono

**Known limitations (follow-up):**
- LangGraph engine path (`use_langgraph_engine=true`): traces will only have a root trace with no child spans/generations. LangGraph nodes are not instrumented in this plan.
- Branch execution in engine.ts: steps inside `BranchConfig` are not instrumented with spans.
- Embedding (`embedding.ts`) and cross-encoder calls: non-LLM AI inference, not tracked as `generation()`. Can be added as `span()` later.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Delete | `backend/src/services/ai-graph/langfuse.ts` | Remove misplaced file |
| Create | `backend/src/utils/langfuse.ts` | Langfuse helpers: client factory, trace/span/generation/flush wrappers |
| Modify | `backend/src/services/pipeline/types.ts` | Add `langfuseTrace` + `currentLfSpan` to `PipelineContext` |
| Modify | `backend/src/services/pipeline/context.ts` | Accept and set `langfuseTrace` in factory |
| Modify | `backend/src/services/pipeline/engine.ts` | Auto-wrap step execution with Langfuse spans, set `currentLfSpan` |
| Modify | `backend/src/services/query/llm.ts` | Wrap `env.AI.run` calls with `generation()` |
| Modify | `backend/src/services/query/plan-execute.ts` | Wrap `env.AI.run` calls with `generation()` |
| Modify | `backend/src/services/query/retrieval.ts` | Wrap agentic decision `env.AI.run` with `generation()` |
| Modify | `backend/src/services/query/index.ts` | Create Langfuse client+trace, pass to context, flush in waitUntil |
| Modify | `backend/src/services/pipeline/steps/llm-generation.ts` | Add `logGeneration()` for direct LLM calls |
| Modify | `backend/src/services/pipeline/steps/self-reflection.ts` | Add `logGeneration()` for direct LLM calls |
| Modify | `backend/src/services/pipeline/steps/text-to-sql.ts` | Add `logGeneration()` for direct LLM calls |

---

### Task 1: Create `utils/langfuse.ts` and delete old file

**Files:**
- Delete: `backend/src/services/ai-graph/langfuse.ts`
- Create: `backend/src/utils/langfuse.ts`

- [ ] **Step 1: Create the new langfuse utility file**

`logGeneration` accepts either a `LangfuseTraceClient` or `LangfuseSpanClient` as parent, so generations nest under the current step span when available.

```typescript
import { Langfuse, LangfuseTraceClient, LangfuseSpanClient } from 'langfuse';
import type { Env } from '../types';

/** Parent type: trace or span — both support .generation() and .span() */
export type LangfuseParent = LangfuseTraceClient | LangfuseSpanClient;

/**
 * 每次請求建立一個新的 Langfuse client 實例（request-scoped）
 * env 不含 keys 時回傳 null（靜默降級）
 */
export function createLangfuseClient(env: Env): Langfuse | null {
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

/** 在 parent（trace 或 span）下建立一個子 span */
export function startSpan(
  parent: LangfuseParent | null,
  name: string,
  input?: unknown,
): LangfuseSpanClient | null {
  if (!parent) return null;
  return parent.span({ name, input });
}

/** 結束一個 span */
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

/**
 * 記錄一次 LLM 呼叫（model、prompt、completion、token usage）
 * parent 可以是 trace 或 span，generation 會掛在 parent 下（形成巢狀層級）
 */
export function logGeneration(
  parent: LangfuseParent | null,
  opts: {
    name: string;
    model: string;
    input: unknown;
    output?: string;
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    metadata?: Record<string, unknown>;
    startTime?: Date;
    endTime?: Date;
    level?: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR';
  },
): void {
  if (!parent) return;
  parent.generation({
    name: opts.name,
    model: opts.model,
    input: opts.input,
    output: opts.output,
    usage: opts.usage,
    metadata: opts.metadata,
    startTime: opts.startTime,
    endTime: opts.endTime,
    level: opts.level,
  });
}

/** 強制 flush，在 Cloudflare Workers waitUntil 中呼叫 */
export async function flushLangfuse(langfuse: Langfuse | null): Promise<void> {
  if (!langfuse) return;
  await langfuse.flushAsync();
}

// Re-export types for consumers
export type { LangfuseTraceClient, LangfuseSpanClient };
```

- [ ] **Step 2: Delete the old langfuse file**

```bash
rm backend/src/services/ai-graph/langfuse.ts
```

- [ ] **Step 3: Verify no remaining imports from old path**

```bash
grep -r "ai-graph/langfuse" backend/src/
```

Expected: no output (the old file was never imported anywhere)

- [ ] **Step 4: Commit**

```bash
git add backend/src/utils/langfuse.ts
git rm backend/src/services/ai-graph/langfuse.ts
git commit -m "refactor: move langfuse utils from ai-graph/ to utils/ and add generation/parent support"
```

---

### Task 2: Add `langfuseTrace` and `currentLfSpan` to PipelineContext

**Files:**
- Modify: `backend/src/services/pipeline/types.ts`
- Modify: `backend/src/services/pipeline/context.ts`

- [ ] **Step 1: Add fields to PipelineContext in types.ts**

In `backend/src/services/pipeline/types.ts`, add import at top:

```typescript
import type { LangfuseTraceClient, LangfuseSpanClient } from '../../utils/langfuse';
```

Add fields to `PipelineContext` interface (after the `circuitBreaker` field, around line 410):

```typescript
  // Langfuse observability（null = 靜默降級，不影響 pipeline 執行）
  langfuseTrace?: LangfuseTraceClient | null;
  // 目前正在執行的 step 的 Langfuse span（engine 在每個 step 開始/結束時設定）
  currentLfSpan?: LangfuseSpanClient | null;
```

- [ ] **Step 2: Accept langfuseTrace in createPipelineContext**

In `backend/src/services/pipeline/context.ts`, add to opts parameter type:

```typescript
  langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null;
```

Add to returned object (after `circuitBreaker`):

```typescript
    langfuseTrace: opts.langfuseTrace ?? null,
    currentLfSpan: null,
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/pipeline/types.ts backend/src/services/pipeline/context.ts
git commit -m "feat(langfuse): add langfuseTrace and currentLfSpan to PipelineContext"
```

---

### Task 3: Auto-wrap pipeline steps with Langfuse spans in engine.ts

**Files:**
- Modify: `backend/src/services/pipeline/engine.ts`

The engine wraps each `step.execute(ctx)` with a Langfuse span and sets `ctx.currentLfSpan` so that LLM calls within the step become children of the span.

- [ ] **Step 1: Add import**

At top of `backend/src/services/pipeline/engine.ts`:

```typescript
import { startSpan, endSpan } from '../../utils/langfuse';
```

- [ ] **Step 2: Wrap step execution with span and set currentLfSpan**

Find the try block that executes steps (around line 408-410):

```typescript
      // 執行 step（含超時保護和錯誤邊界）
      const stepStart = Date.now();
      try {
```

Replace with:

```typescript
      // 執行 step（含超時保護和錯誤邊界）
      const stepStart = Date.now();
      const lfSpan = startSpan(ctx.langfuseTrace ?? null, meta.id, {
        phase: meta.phase,
        query: ctx.request.query,
      });
      ctx.currentLfSpan = lfSpan;
      try {
```

Find the end of the catch block (around line 470) where it does `stepIdx++; continue;`. Add before that line:

```typescript
        endSpan(lfSpan, {
          output: { error: errorMsg, ...(isTimeout ? { timeout: true } : {}) },
          level: 'ERROR',
        });
        ctx.currentLfSpan = null;
```

Find the normal completion path after the catch block. After `pipelineExecution.push(...)` (around line 479), add:

```typescript
      endSpan(lfSpan, {
        output: { duration_ms: stepDuration },
        metadata: { phase: meta.phase },
      });
      ctx.currentLfSpan = null;
```

- [ ] **Step 3: Update trace output at end of run()**

At the end of `run()`, before `return ctx;` (around line 581), add:

```typescript
    // Langfuse trace 最終更新：記錄完整回應和 metadata
    if (ctx.langfuseTrace) {
      ctx.langfuseTrace.update({
        output: ctx.answer ?? ctx.earlyReturn?.answer,
        metadata: {
          latency_ms: Date.now() - ctx.startTime,
          query_type: ctx.queryType,
          model: ctx.effectiveLlmModel,
          degraded: ctx.degradedStages?.length ? true : undefined,
          loop_count: ctx.loopCount,
        },
      });
    }
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pipeline/engine.ts
git commit -m "feat(langfuse): auto-wrap pipeline steps with spans, set currentLfSpan for nesting"
```

---

### Task 4: Wrap LLM calls with Langfuse `generation()` in llm.ts

**Files:**
- Modify: `backend/src/services/query/llm.ts`

Each function adds an optional `langfuseParent` parameter (type `LangfuseParent | null`). This will be the `currentLfSpan` from the pipeline context, so generations nest under the step span.

- [ ] **Step 1: Add imports**

At top of `backend/src/services/query/llm.ts`:

```typescript
import { logGeneration } from '../../utils/langfuse';
import type { LangfuseParent } from '../../utils/langfuse';
```

- [ ] **Step 2: Instrument `parseQueryWithLLM`**

Add `langfuseParent?: LangfuseParent | null` as last parameter (after `promptTemplate`).

After line 37 (`const text = rawResult.response?.trim() ?? '';`), add:

```typescript
  logGeneration(langfuseParent ?? null, {
    name: 'tool-selection',
    model: llmModel,
    input: [{ role: 'user', content: prompt }],
    output: text,
    usage: rawResult.usage ? {
      promptTokens: rawResult.usage.prompt_tokens,
      completionTokens: rawResult.usage.completion_tokens,
      totalTokens: rawResult.usage.total_tokens,
    } : undefined,
  });
```

- [ ] **Step 3: Instrument `generateHyDE`**

Add `langfuseParent?: LangfuseParent | null` as last parameter.

After line 99 (`const doc = result.response?.trim() ?? '';`), add:

```typescript
    logGeneration(langfuseParent ?? null, {
      name: 'hyde',
      model: llmModel,
      input: [{ role: 'user', content: prompt }],
      output: doc,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
```

- [ ] **Step 4: Instrument `generateMultipleQueries`**

Add `langfuseParent?: LangfuseParent | null` as last parameter.

After line 128 (`const text = result.response?.trim() ?? '';`), add:

```typescript
    logGeneration(langfuseParent ?? null, {
      name: 'multi-query',
      model,
      input: [{ role: 'user', content: prompt }],
      output: text,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
```

- [ ] **Step 5: Instrument `streamLLMGeneration`**

Add `langfuseParent?: LangfuseParent | null` as last parameter.

Before the existing `return fullText;` (line 207), add:

```typescript
  logGeneration(langfuseParent ?? null, {
    name: 'llm-generation-stream',
    model,
    input: messages,
    output: fullText,
    metadata: { streaming: true },
  });
```

- [ ] **Step 6: Instrument `runJudge`**

Add `langfuseParent?: LangfuseParent | null` as last parameter (after `opts`).

After line 287 (`const scores = parseJudgeResponse(rawResponse);`), add:

```typescript
    logGeneration(langfuseParent ?? null, {
      name: 'judge',
      model,
      input: [
        { role: 'system', content: '只回傳 JSON，不含任何說明文字。' },
        { role: 'user', content: judgePrompt },
      ],
      output: rawResponse,
      usage: judgeResult.usage ? {
        promptTokens: judgeResult.usage.prompt_tokens,
        completionTokens: judgeResult.usage.completion_tokens,
        totalTokens: judgeResult.usage.total_tokens,
      } : undefined,
    });
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/services/query/llm.ts
git commit -m "feat(langfuse): wrap LLM calls in llm.ts with generation() tracking"
```

---

### Task 5: Instrument LLM calls in plan-execute.ts and retrieval.ts

**Files:**
- Modify: `backend/src/services/query/plan-execute.ts` (3 LLM calls: planQuery, adaptiveReplan, synthesize)
- Modify: `backend/src/services/query/retrieval.ts` (1 LLM call: decideNextAction in agentic retrieval)

These functions are called via QueryService delegates and have `env.AI.run` calls.

- [ ] **Step 1: Instrument plan-execute.ts**

Add imports at top:

```typescript
import { logGeneration } from '../../utils/langfuse';
import type { LangfuseParent } from '../../utils/langfuse';
```

Add `langfuseParent?: LangfuseParent | null` as last parameter to `planQuery`, the adaptive replan function, and `synthesize`.

After each `env.AI.run` call resolves, add `logGeneration(langfuseParent ?? null, ...)` with:
- `planQuery` → name: `'planning'`
- adaptive replan → name: `'adaptive-replan'`
- `synthesize` → name: `'synthesis'`

Each should include model, input messages, output text, and usage if available.

- [ ] **Step 2: Instrument retrieval.ts decideNextAction**

Add imports at top:

```typescript
import { logGeneration } from '../../utils/langfuse';
import type { LangfuseParent } from '../../utils/langfuse';
```

Add `langfuseParent?: LangfuseParent | null` as last parameter to `decideNextAction` (or the function containing the agentic decision `env.AI.run` call around line 195).

After the `env.AI.run` result (around line 201), add:

```typescript
    logGeneration(langfuseParent ?? null, {
      name: 'agentic-decision',
      model,
      input: [{ role: 'user', content: prompt }],
      output: raw,
      usage: result.usage ? {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      } : undefined,
    });
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/query/plan-execute.ts backend/src/services/query/retrieval.ts
git commit -m "feat(langfuse): instrument plan-execute and agentic retrieval LLM calls"
```

---

### Task 6: Update QueryService to pass langfuseParent through delegates

**Files:**
- Modify: `backend/src/services/query/index.ts`

Pipeline steps call LLM functions through `ctx.queryService` delegates. The QueryService reads `currentLfSpan` from a per-request field and passes it as `langfuseParent` to each delegate.

- [ ] **Step 1: Add langfuseParent property to QueryService**

In `backend/src/services/query/index.ts`, after the `embeddingService` field (line 25), add:

```typescript
  private _langfuseParent: import('../../utils/langfuse').LangfuseParent | null = null;

  setLangfuseParent(parent: import('../../utils/langfuse').LangfuseParent | null): void {
    this._langfuseParent = parent;
  }
```

- [ ] **Step 2: Pass langfuseParent in delegate methods**

Update each delegate method to pass `this._langfuseParent` as the last argument:

```typescript
  parseQueryWithLLM(...args) {
    return parseQueryWithLLM(this.env, ...args, this._langfuseParent);
  }
```

Apply to: `parseQueryWithLLM`, `generateHyDE`, `generateMultipleQueries`, `streamLLMGeneration`, `runJudge`, `planQuery`, `synthesize`, and any delegate that calls an instrumented function.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/query/index.ts
git commit -m "feat(langfuse): forward langfuseParent through QueryService delegates"
```

---

### Task 7: Wire Langfuse into QueryService.ask() — create client, trace, flush

**Files:**
- Modify: `backend/src/services/query/index.ts`

- [ ] **Step 1: Add imports**

At top of `backend/src/services/query/index.ts`:

```typescript
import { createLangfuseClient, createTrace, flushLangfuse } from '../../utils/langfuse';
```

- [ ] **Step 2: Create Langfuse client and trace in ask()**

In `ask()` method, after the `circuitBreaker` check block (after the `extraTrace.circuit_breaker = ...` block), add:

```typescript
    // Langfuse observability
    const langfuseClient = createLangfuseClient(this.env);
    const langfuseTrace = createTrace(langfuseClient, {
      name: 'ai-ask',
      userId,
      input: { query, chat_history_length: recentHistory.length },
      metadata: {
        streaming: streamingMode,
        cache_key: cacheKey,
      },
    });
    // 設定 langfuseParent 讓 delegate 方法傳遞給 LLM 函式
    // 初始設為 trace root；engine 每個 step 開始時會更新為 currentLfSpan
    this.setLangfuseParent(langfuseTrace);
```

- [ ] **Step 3: Pass langfuseTrace to createPipelineContext**

In the `createPipelineContext(...)` call, add after `circuitBreaker,`:

```typescript
      langfuseTrace,
```

- [ ] **Step 4: Hook QueryService.setLangfuseParent to track currentLfSpan**

Pipeline steps call `ctx.queryService` delegates, but the `currentLfSpan` changes per step. We need `queryService._langfuseParent` to stay in sync with `ctx.currentLfSpan`.

The simplest approach: in each step's `execute()`, the engine has already set `ctx.currentLfSpan`. The delegate methods should read it dynamically. Change the delegate methods (from Task 6) to use a getter pattern instead:

In `QueryService`, replace the `_langfuseParent` field with a getter that reads from a reference:

```typescript
  private _pipelineCtx: { currentLfSpan?: import('../../utils/langfuse').LangfuseSpanClient | null; langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null } | null = null;

  setPipelineCtx(ctx: { currentLfSpan?: import('../../utils/langfuse').LangfuseSpanClient | null; langfuseTrace?: import('../../utils/langfuse').LangfuseTraceClient | null }): void {
    this._pipelineCtx = ctx;
  }

  private get langfuseParent(): import('../../utils/langfuse').LangfuseParent | null {
    // 優先使用 currentLfSpan（step span），fallback 到 trace root
    return this._pipelineCtx?.currentLfSpan ?? this._pipelineCtx?.langfuseTrace ?? null;
  }
```

Then delegates use `this.langfuseParent`:

```typescript
  parseQueryWithLLM(...) {
    return parseQueryWithLLM(this.env, ..., this.langfuseParent);
  }
```

And in `ask()`, after `createPipelineContext`:

```typescript
    this.setPipelineCtx(pipelineCtx);
```

This way, as the engine sets `ctx.currentLfSpan` for each step, the QueryService delegates automatically pick up the correct parent span.

- [ ] **Step 5: Flush Langfuse after pipeline completes**

Replace the try/catch block around pipeline execution (lines ~149-171) with try/catch/finally:

```typescript
    try {
      let result;
      if (pipelineCfg.use_langgraph_engine === true) {
        result = await withTimeout(runAIGraph(pipelineCtx), pipelineCfg.pipeline_timeout_ms, 'pipeline');
      } else {
        const engine = new PipelineEngine(this.env);
        result = await withTimeout(engine.run(pipelineCtx), pipelineCfg.pipeline_timeout_ms, 'pipeline');
      }
      return result.earlyReturn ?? result.finalResponse!;
    } catch (err) {
      controller.abort();
      throw err;
    } finally {
      if (langfuseClient && ctx) {
        ctx.waitUntil(flushLangfuse(langfuseClient));
      }
    }
```

Note: `ctx` is the `waitUntil` context parameter of `ask()`, not `pipelineCtx`.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/query/index.ts
git commit -m "feat(langfuse): wire client/trace/flush into QueryService.ask() with dynamic span parenting"
```

---

### Task 8: Instrument direct `env.AI.run` calls in pipeline steps

**Files:**
- Modify: `backend/src/services/pipeline/steps/llm-generation.ts`
- Modify: `backend/src/services/pipeline/steps/self-reflection.ts`
- Modify: `backend/src/services/pipeline/steps/text-to-sql.ts`

These steps call `env.AI.run` directly. They use `ctx.currentLfSpan` (set by engine) as the parent for `logGeneration()`.

- [ ] **Step 1: Instrument llm-generation.ts**

Add import at top:

```typescript
import { logGeneration } from '../../../utils/langfuse';
```

After the GK path `env.AI.run` (line 43-47), after `const rawAnswer = extractLLMResponse(llmResult)...`:

```typescript
      logGeneration(ctx.currentLfSpan ?? ctx.langfuseTrace ?? null, {
        name: 'llm-generation-gk',
        model: effectiveLlmModel,
        input: gkParams.messages,
        output: rawAnswer,
        usage: llmResult.usage ? {
          promptTokens: llmResult.usage.prompt_tokens,
          completionTokens: llmResult.usage.completion_tokens,
          totalTokens: llmResult.usage.total_tokens,
        } : undefined,
      });
```

After the RAG path `env.AI.run` (line 131-135), after `rawLLMAnswer = extractLLMResponse(llmResult)...`:

```typescript
      logGeneration(ctx.currentLfSpan ?? ctx.langfuseTrace ?? null, {
        name: 'llm-generation-rag',
        model: effectiveLlmModel,
        input: llmMessages,
        output: rawLLMAnswer,
        usage: llmUsage ? {
          promptTokens: llmUsage.prompt_tokens,
          completionTokens: llmUsage.completion_tokens,
          totalTokens: llmUsage.total_tokens,
        } : undefined,
      });
```

- [ ] **Step 2: Instrument self-reflection.ts**

Add import:
```typescript
import { logGeneration } from '../../../utils/langfuse';
```

After the `env.AI.run` call, add `logGeneration(ctx.currentLfSpan ?? ctx.langfuseTrace ?? null, ...)` with name `'self-reflection-regen'`, including model, messages, output, and usage.

- [ ] **Step 3: Instrument text-to-sql.ts**

Add import:
```typescript
import { logGeneration } from '../../../utils/langfuse';
```

After the `env.AI.run` call (line 119), add `logGeneration(ctx.currentLfSpan ?? ctx.langfuseTrace ?? null, ...)` with name `'text-to-sql'`, including model, messages, output, and usage.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pipeline/steps/llm-generation.ts backend/src/services/pipeline/steps/self-reflection.ts backend/src/services/pipeline/steps/text-to-sql.ts
git commit -m "feat(langfuse): instrument direct env.AI.run calls in pipeline steps"
```

---

### Task 9: Set Langfuse secrets and verify end-to-end

- [ ] **Step 1: Set secrets for preview environment**

```bash
cd backend
wrangler secret put LANGFUSE_PUBLIC_KEY --env preview
wrangler secret put LANGFUSE_SECRET_KEY --env preview
```

Enter your Langfuse Cloud project keys when prompted.

- [ ] **Step 2: Deploy to preview**

```bash
cd backend && pnpm deploy:preview
```

- [ ] **Step 3: Send a test query**

```bash
curl -X POST https://<preview-api-url>/api/v1/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "龍洞有哪些 5.10 的路線？"}'
```

- [ ] **Step 4: Verify in Langfuse Cloud**

Open https://cloud.langfuse.com → your project → Traces. Verify:
- A trace named `ai-ask` appears with the query as input
- Child spans for each pipeline step (tool-selection, embedding, hybrid-search, etc.)
- Generation observations **nested under their parent step spans** (not flat at trace root)
- Generation records include: model name, prompt messages, completion text, token counts
- Trace output contains the final answer and metadata

- [ ] **Step 5: Verify no-key degradation (local dev)**

```bash
cd backend && pnpm dev
```

Send a query to localhost:8787. Verify pipeline works normally with no Langfuse errors in console (keys are not set locally, so all Langfuse calls should be no-op).
