# Langfuse-Compatible Pipeline Trace Design

**Date:** 2026-03-20
**Status:** Draft
**Scope:** TypeScript backend pipeline trace instrumentation

---

## Background

The current `pipeline_trace` JSON column in `ai_query_logs` uses a flat key-value structure (`ctx.trace.xxx = {...}`). Several pipeline stages lack trace data entirely. The goal is to:

1. Adopt the Langfuse Trace/Span/Generation data model in the existing D1 `pipeline_trace` column
2. Add missing instrumentation (startTime, endTime, input, output) to all pipeline stages
3. Update the admin dashboard with a waterfall timeline view where each stage is expandable to show input/output details
4. Lay the groundwork for future Langfuse Cloud integration via Python + LangGraph

**Not in scope:** Sending data to Langfuse Cloud from TS (deferred to Python migration).

---

## Data Model

### pipeline_trace JSON structure

```typescript
interface PipelineTraceDoc {
  id: string                    // traceId = ai_query_logs.id
  name: string                  // "ai-ask"
  timestamp: string             // ISO 8601, request start
  input: { query: string }
  output: { answer: string }
  userId: string | null
  metadata: {
    query_type: string | null
    cache_hit: boolean
    model_used: string | null
  }
  observations: Observation[]   // ordered by startTime
}

interface BaseObservation {
  id: string                    // crypto.randomUUID()
  traceId: string
  name: string
  startTime: string             // ISO 8601
  endTime: string               // ISO 8601
  input?: unknown
  output?: unknown
  level: 'DEFAULT' | 'DEBUG' | 'WARNING' | 'ERROR'
  statusMessage?: string        // error message if level === 'ERROR'
  metadata?: unknown
  parentObservationId?: string  // for nested spans
}

interface Span extends BaseObservation {
  kind: 'span'
}

interface Generation extends BaseObservation {
  kind: 'generation'
  model: string
  modelParameters?: Record<string, unknown>
  usageDetails?: {
    input: number               // prompt tokens
    output: number              // completion tokens
    total: number
  }
}

type Observation = Span | Generation
```

### Observations per pipeline stage

The pipeline has two sources of observations:

**Route middleware (in `ai.ts`) — pushed directly to `traceCtx.observations`, NOT via `withSpan()`:**

| Stage | kind | input | output |
|-------|------|-------|--------|
| `guardrails_input` | span | `{ query: string (200 chars max) }` | `{ passed: bool, checks_run: string[], triggered_check?: string }` |
| `quota_check` | span | `{ rank: string, estimated_tokens: number }` | `{ result: string, daily_ai_used: number, daily_ai_limit: number }` |

**Pipeline step files — use `withSpan()` or `skipSpan()`:**

| Stage | Step file | kind | input | output |
|-------|-----------|------|-------|--------|
| `semantic_cache` | `semantic-cache.ts` | span | `{ query: string (200 chars), threshold: number }` | `{ hit: bool, similarity_score?: number }` |
| `query_parsing` | `tool-selection.ts` | generation | `{ query: string }` | `{ query_type: string, tool: string, confidence: number, params: object }` |
| `tool_selection` | `tool-selection.ts` | span | `{ query_type: string, tool: string }` | `{ selected_tool: string, alternative?: string, fallback: bool }` |
| `text_to_sql` | `text-to-sql.ts` | generation | `{ query: string, path: string }` | `{ row_count?: number, candidate_count?: number, clarification_type?: string }` |
| `multi_query` | `multi-query.ts` | generation | `{ query: string, count: number }` | `{ queries: string[] }` |
| `filter_build` | `filter-build.ts` | span | `{ query: string }` | `{ filter_applied: bool, area_id?: string, crag_id?: string, grade?: string, route_type?: string }` |
| `hyde` | `hyde.ts` | generation | `{ query: string }` | `{ hydeDoc: string (300 chars max) }` |
| `embedding` | `embedding.ts` | span | `{ hyde_embedded: bool, expanded_count: number, early_vector_reused: bool }` | `{ duration_ms: number }` |
| `hybrid_search` | `hybrid-search.ts` | span | `{ strategy: string, doc_count_requested: number }` | `{ doc_count: number, top_score: number, paths: string[] }` |
| `cross_encoder` | `cross-encoder.ts` | span | `{ input_count: number, threshold: number }` | `{ filtered_count: number, top_scores: number[] }` |
| `mmr` | `mmr.ts` | span | `{ lambda: number, input_count: number }` | `{ selected_count: number }` |
| `popularity_rerank` | `popularity-rerank.ts` | span | `{ popularity_weight: number, doc_count: number }` | `{ top_selected: number, personalized: bool }` |
| `llm_generation` | `llm-generation.ts` | generation | `{ messages: string (truncated), context_length: number, doc_count: number }` | `{ content: string (300 chars max) }` |
| `self_reflection` | `self-reflection.ts` | generation | `{ trigger_reason: string, original_answer: string (300 chars max) }` | `{ revised_answer: string (300 chars max) }` |
| `judge` | `judge.ts` | generation | `{ answer: string (300 chars max), context_chars: number }` | `{ groundedness: number, quality: number, constraint_ok: bool }` |
| `guardrails_output` | `llm-generation.ts` | span | `{ answer_length: number }` | `{ passed: bool, truncated: bool, leakage_detected: bool }` |
| `memory_extraction` | `llm-generation.ts` | span | `{ triggered: bool }` | `{ async: bool, reason?: string }` |

**Notes:**
- `tool-selection.ts` emits two observations: `query_parsing` (the LLM call) and `tool_selection` (the routing decision)
- `llm-generation.ts` emits three observations: `llm_generation`, `guardrails_output`, and `memory_extraction`
- `semantic_cache` early-exits the pipeline on hit; the `metadata.cache_hit` flag in `PipelineTraceDoc` reflects this
- Steps skipped due to `queryType` get a `skipSpan()` observation: `level: 'DEBUG'`, `metadata: { skipped: true, reason: string }`

---

## Architecture

### New file: `backend/src/utils/span.ts`

```typescript
type SpanIO = Partial<Omit<Span, 'id' | 'name' | 'startTime' | 'endTime' | 'level' | 'traceId' | 'kind'>>
type GenerationIO = Partial<Omit<Generation, 'id' | 'name' | 'startTime' | 'endTime' | 'level' | 'traceId' | 'kind'>> & { model: string }

export async function withSpan<T>(
  ctx: PipelineContext,
  name: string,
  kind: 'span',
  fn: () => Promise<T>,
  getIO: (result: T) => SpanIO
): Promise<T>

export async function withSpan<T>(
  ctx: PipelineContext,
  name: string,
  kind: 'generation',
  fn: () => Promise<T>,
  getIO: (result: T) => GenerationIO  // must include model; usageDetails optional
): Promise<T>

export function skipSpan(
  ctx: PipelineContext,
  name: string,
  reason?: string
): void  // pushes level:'DEBUG', metadata:{ skipped:true, reason }

export function errorSpan(
  ctx: PipelineContext,
  name: string,
  startTime: string,
  err: unknown
): void  // pushes level:'ERROR', statusMessage: err.message
```

### Changes to `context.ts`

```typescript
// Add to PipelineContext:
traceCtx: {
  traceId: string
  observations: Observation[]
}
```

Initialized in `createPipelineContext()`:
```typescript
traceCtx: {
  traceId: opts.traceId ?? crypto.randomUUID(),  // opts.traceId = ai_query_logs.id
  observations: [],
}
```

### Changes to `ai.ts`

`guardrails_input` and `quota_check` are route middleware — they run before the pipeline and cannot use `withSpan()`. Instead, push observations directly:

```typescript
ctx.traceCtx.observations.push({
  id: crypto.randomUUID(),
  traceId: ctx.traceCtx.traceId,
  name: 'guardrails_input',
  kind: 'span',
  startTime: guardrailsStart,
  endTime: new Date().toISOString(),
  level: passed ? 'DEFAULT' : 'ERROR',
  input: { query: query.slice(0, 200) },
  output: { passed, checks_run, triggered_check },
})
```

Replace the existing `extraTrace.guardrails_input` and `extraTrace.quota_check` assignments.

### Changes to `engine.ts`

At end of pipeline, build the `PipelineTraceDoc` and write to `pipeline_trace` column:

```typescript
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
```

### Migration strategy: dual-track

During migration, each step continues to write both `ctx.trace.xxx` (backward compat) AND calls `withSpan()`. `traceCtx` is guaranteed to exist — it is always initialized in `createPipelineContext()`, so steps do not need to guard against undefined.

After all steps are migrated and verified, remove `ctx.trace.xxx` writes in a cleanup pass.

### Changes to each step file (14 step files)

Replace `ctx.trace.xxx = {...}` with `withSpan()` or `skipSpan()`.

Steps that contain LLM calls use `kind: 'generation'` with `usageDetails`:
- `tool-selection.ts` (query_parsing generation)
- `hyde.ts`
- `multi-query.ts`
- `text-to-sql.ts`
- `llm-generation.ts`
- `judge.ts`
- `self-reflection.ts`

---

## Admin Dashboard: Timeline View

### New component: `PipelineTimeline`

Replace the current card-based pipeline display with a waterfall chart. Each row shows the observation name, a proportional bar, duration, and status. Each row is **clickable to expand** and shows the full `input`, `output`, and `usageDetails` as formatted JSON.

```
guardrails_input   ▓░░░░░░░░░░░░░░░░   12ms   ✓
quota_check        ▓░░░░░░░░░░░░░░░░    8ms   ✓
semantic_cache     ▓░░░░░░░░░░░░░░░░   15ms   ✓ (miss)
query_parsing      ▓▓▓░░░░░░░░░░░░░░  280ms   ✓ [generation]
tool_selection     ▓░░░░░░░░░░░░░░░░    5ms   ✓
text_to_sql        ─────────────────   --     skipped
multi_query        ▓▓░░░░░░░░░░░░░░░  160ms   ✓ [generation]
filter_build       ▓░░░░░░░░░░░░░░░░   12ms   ✓
hyde               ▓▓░░░░░░░░░░░░░░░  180ms   ✓ [generation]
embedding          ▓▓░░░░░░░░░░░░░░░  210ms   ✓
hybrid_search      ▓▓░░░░░░░░░░░░░░░  240ms   ✓
cross_encoder      ▓▓░░░░░░░░░░░░░░░  180ms   ✓
mmr                ▓░░░░░░░░░░░░░░░░    8ms   ✓
popularity_rerank  ▓░░░░░░░░░░░░░░░░    5ms   ✓
llm_generation     ▓▓▓▓▓▓▓▓░░░░░░░░ 1800ms   ✓ [generation]
judge              ▓▓░░░░░░░░░░░░░░░  220ms   ✓ [generation]
guardrails_output  ▓░░░░░░░░░░░░░░░░    5ms   ✓
memory_extraction  ▓░░░░░░░░░░░░░░░░   --     async
─────────────────────────────────────────────────
total                                3340ms
```

**Expanded row example** (clicking `hybrid_search`):

```
▼ hybrid_search   240ms   ✓
  input:   { "strategy": "hybrid", "doc_count_requested": 10 }
  output:  { "doc_count": 8, "top_score": 0.87, "paths": ["vector", "bm25"] }
```

**Expanded generation row** (clicking `llm_generation`):

```
▼ llm_generation   1800ms   ✓ [generation]
  input:   { "messages": "[{role: system, content: ...}] (truncated)", "context_length": 4200, "doc_count": 8 }
  output:  { "content": "台灣北部的攀岩路線..." }
  tokens:  input: 1240  output: 380  total: 1620   ← only shown if usageDetails present
  model:   @cf/google/gemma-3-12b-it
```

### Backward compatibility

Old `pipeline_trace` records (flat key format) are detected by absence of `observations` key and rendered with the existing card view as fallback.

---

## Migration

No D1 schema migration needed — `pipeline_trace` column type remains `TEXT` (JSON). Old records are read-compatible via fallback rendering.

---

## Future: Langfuse Cloud Integration (Python)

When the Python + LangGraph service is live:

1. Python nodes call `langfuse.trace()` / `trace.span()` / `trace.generation()` using the Langfuse Python SDK
2. TS pipeline continues writing to D1 in Langfuse-compatible format
3. Admin dashboard reads from D1 (TS traces) until TS is fully replaced
4. At cutover, admin dashboard reads from Langfuse Cloud API instead of D1

The `PipelineTraceDoc` structure in D1 maps 1:1 to Langfuse's data model, making cutover straightforward.

---

## Implementation Order

1. `utils/span.ts` — withSpan, skipSpan, errorSpan helpers
2. `context.ts` — add traceCtx field
3. `ai.ts` — migrate guardrails_input + quota_check spans (direct push, not withSpan)
4. `engine.ts` — serialize traceCtx to pipeline_trace
5. Step files (14) — replace ctx.trace.xxx with withSpan/skipSpan
6. `admin-ai.ts` — update pipeline object to read from observations array
7. Admin frontend — PipelineTimeline component with expandable rows
