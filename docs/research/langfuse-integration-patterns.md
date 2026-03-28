# Langfuse LLM Observability Integration Patterns — Research Summary

> Research date: 2026-03-25

---

## 1. RAG Pipeline Tracing Structure

Langfuse provides **10 specialized observation types** for structured tracing. For RAG pipelines, the key types are:

| Type | Purpose |
|------|---------|
| **Span** | Durations of units of work (e.g., query classification, preprocessing) |
| **Retriever** | Data retrieval steps (vector store, database calls) |
| **Embedding** | LLM embedding calls (model, token usage, costs) |
| **Generation** | AI model output (prompts, completions, token usage, costs) |
| **Evaluator** | Assessment of relevance/correctness/faithfulness |
| **Tool** | Tool calls (e.g., weather API, search API) |
| **Agent** | Orchestration decisions (decides flow, uses tools) |
| **Guardrail** | Input/output protection against malicious content |

### Recommended RAG Trace Structure

```
Trace: "user-question"
├── Span: "query-classification"         (classify intent, extract filters)
├── Embedding: "embed-query"             (embed user query, log model + tokens)
├── Retriever: "vector-search"           (search vector DB, log retrieved docs)
├── Span: "context-assembly"             (rank, filter, assemble context)
├── Generation: "llm-answer"             (LLM call with prompt + context → answer)
└── Evaluator: "groundedness-check"      (evaluate faithfulness to sources)
```

### Python Example (for reference — patterns apply to JS/TS)

```python
@observe()
def rag_pipeline(question: str):
    # 1. Retrieval — automatically traced as "retriever" type
    with langfuse.start_as_current_observation(
        as_type="retriever",
        name="retrieve_documents",
        input=question,
    ) as span:
        docs = retriever.invoke(question)
        span.update(output=docs)

    # 2. Generation — automatically instrumented via callback
    answer = llm.invoke(prompt_with_context)

    return answer
```

---

## 2. JS/TS SDK v3 (Current) — Patterns & API

The current Langfuse JS/TS SDK is **OpenTelemetry-native**. Key packages:

| Package | Purpose | Runtime |
|---------|---------|---------|
| `@langfuse/tracing` | Core tracing functions | Universal JS |
| `@langfuse/otel` | LangfuseSpanProcessor for exporting traces | **Node.js ≥ 20 only** |
| `@langfuse/client` | Prompts, datasets, scores | Universal JS |
| `@langfuse/openai` | Auto-trace OpenAI SDK | Universal JS |

### Initialization (Node.js)

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

const langfuseSpanProcessor = new LangfuseSpanProcessor({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
});

const sdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
});
sdk.start();
```

### Pattern A: Context Manager (recommended for pipelines)

```typescript
import { startActiveObservation, startObservation, propagateAttributes } from "@langfuse/tracing";

await startActiveObservation("rag-pipeline", async (rootSpan) => {
  rootSpan.update({ input: { query: userQuery } });

  // Retrieval step
  const retrieval = startObservation(
    "vector-search",
    { input: { query: userQuery } },
    { asType: "retriever" }  // ← typed as retriever
  );
  const docs = await vectorSearch(userQuery);
  retrieval.update({ output: docs }).end();

  // LLM generation
  const generation = startObservation(
    "llm-answer",
    {
      model: "gemma-3-12b-it",
      input: [{ role: "user", content: promptWithContext }],
    },
    { asType: "generation" }  // ← typed as generation
  );
  const answer = await callLLM(promptWithContext);
  generation.update({
    output: { content: answer },
    usageDetails: { input: 500, output: 200, total: 700 },
  }).end();

  rootSpan.update({ output: answer });
});

await langfuseSpanProcessor.forceFlush();
```

### Pattern B: observe() Decorator Wrapper

```typescript
import { observe, updateActiveObservation } from "@langfuse/tracing";

async function vectorSearch(query: string) {
  // business logic
  updateActiveObservation({ metadata: { source: "vectorize" } });
  return results;
}

// Wrap existing function — no internal modification needed
const tracedVectorSearch = observe(vectorSearch, {
  name: "vector-search",
  asType: "retriever",
});
```

### Pattern C: Manual Span Creation (full control)

```typescript
import { startObservation } from "@langfuse/tracing";

const span = startObservation("rag-pipeline", {
  input: { query: userQuery },
});

// Child observations via parent.startObservation()
const embedding = span.startObservation(
  "embed-query",
  { model: "@cf/baai/bge-m3", input: userQuery },
  { asType: "embedding" }
);
embedding.update({ usageDetails: { input: 128 } }).end();

const retrieval = span.startObservation(
  "vector-search",
  { input: { query: userQuery } },
  { asType: "retriever" }
);
retrieval.update({ output: retrievedDocs }).end();

const generation = span.startObservation(
  "llm-answer",
  { model: "gemma-3-12b-it", input: messages },
  { asType: "generation" }
);
generation.update({
  output: { content: answer },
  usageDetails: { input: 500, output: 200 },
}).end();

span.update({ output: answer }).end();
await langfuseSpanProcessor.forceFlush();
```

### Key Differences: span vs generation vs retriever

- **`asType: "span"`** (default) — generic work unit, no LLM-specific rendering
- **`asType: "generation"`** — renders prompt/completion in Langfuse UI, tracks model/tokens/costs
- **`asType: "retriever"`** — renders retrieved documents, tracks retrieval quality
- **`asType: "embedding"`** — tracks embedding model, dimensions, token usage
- **`asType: "tool"`** — renders tool call input/output

---

## 3. Cloudflare Workers — Critical Gotchas

### The Core Problem

**`@langfuse/otel` (LangfuseSpanProcessor) requires `@opentelemetry/sdk-node`, which depends on Node.js APIs unavailable in Cloudflare Workers' V8 isolate runtime.**

This is a **known, documented limitation** (see [GitHub Discussion #10715](https://github.com/orgs/langfuse/discussions/10715)).

### Available Workarounds (ranked by viability)

#### Option 1: Direct REST API Ingestion (most reliable for CF Workers)

Langfuse exposes a batch ingestion endpoint that works from any runtime:

```typescript
// POST https://cloud.langfuse.com/api/public/ingestion
// Auth: Basic base64(publicKey:secretKey)

const payload = {
  batch: [
    {
      type: "trace-create",
      id: crypto.randomUUID(),
      body: {
        id: traceId,
        name: "rag-pipeline",
        input: { query: userQuery },
        output: { answer },
        userId: "user-123",
        sessionId: "session-456",
      }
    },
    {
      type: "generation-create",
      id: crypto.randomUUID(),
      body: {
        traceId: traceId,
        name: "llm-answer",
        model: "gemma-3-12b-it",
        input: messages,
        output: answer,
        usage: { input: 500, output: 200, total: 700 },
        startTime: startTime,
        endTime: endTime,
      }
    },
    {
      type: "span-create",
      id: crypto.randomUUID(),
      body: {
        traceId: traceId,
        name: "vector-search",
        input: { query: userQuery },
        output: retrievedDocs,
        startTime: retrievalStart,
        endTime: retrievalEnd,
      }
    }
  ]
};

// Fire in waitUntil to not block response
ctx.waitUntil(
  fetch("https://cloud.langfuse.com/api/public/ingestion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${publicKey}:${secretKey}`)}`,
    },
    body: JSON.stringify(payload),
  })
);
```

Response is **HTTP 207 Multi-Status** with per-event results (allows partial failures).

#### Option 2: Legacy `langfuse` npm Package

The older `langfuse` npm package (pre-OTEL) uses `fetch()` internally and may work in CF Workers:

```typescript
import Langfuse from "langfuse";

const langfuse = new Langfuse({
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: "https://cloud.langfuse.com",
});

const trace = langfuse.trace({ name: "rag-pipeline", userId });
const span = trace.span({ name: "retrieval", input: query });
span.end({ output: docs });

const generation = trace.generation({
  name: "llm-call",
  model: "gemma-3-12b-it",
  input: messages,
});
generation.end({ output: answer, usage: { input: 500, output: 200 } });

// CRITICAL: flush in waitUntil
ctx.waitUntil(langfuse.flushAsync());
```

**Note**: This is the legacy SDK (v2-era). Langfuse still supports it with security patches but no new features.

#### Option 3: OTEL-compatible CF Workers Library

Use `@microlabs/otel-cf-workers` to bridge the OTEL gap:

```typescript
import { instrument } from "@microlabs/otel-cf-workers";

// Wrap your worker export with OTEL instrumentation
export default instrument(
  { fetch: app.fetch },  // your Hono app
  (env) => ({
    exporter: {
      url: "https://cloud.langfuse.com/api/public/otel/v1/traces",
      headers: {
        Authorization: `Basic ${btoa(`${env.LANGFUSE_PUBLIC_KEY}:${env.LANGFUSE_SECRET_KEY}`)}`,
      },
    },
    service: { name: "nobodyclimb-api" },
  })
);
```

### waitUntil Pattern (all approaches)

```typescript
// In Hono route handler:
app.post("/api/v1/ai/ask", async (c) => {
  const answer = await ragPipeline(query);

  // Non-blocking flush after response
  c.executionCtx.waitUntil(langfuse.flushAsync());
  // OR for direct API:
  c.executionCtx.waitUntil(sendTracesToLangfuse(tracePayload));

  return c.json({ answer });
});
```

**Important**: `ctx.waitUntil()` extends worker lifetime up to **30 seconds** after response. This time is shared across all `waitUntil()` calls in the same request.

---

## 4. Centralized vs Distributed Instrumentation

### Industry Consensus: Centralized Orchestration Layer

Most production RAG systems instrument at the **orchestration/pipeline layer**, not inside individual services. The reasons:

1. **Single trace per request** — The orchestrator creates the root trace and passes context down
2. **Cleaner hierarchy** — Parent-child relationships are explicit
3. **Easier to maintain** — One place to update tracing logic
4. **Framework support** — LangChain, LlamaIndex, etc. auto-instrument at the chain level

### Recommended Pattern for NobodyClimb

```
Route Handler (Hono)
  └── AI Query Service (orchestrator) ← creates trace here
        ├── Query Classifier           ← child span
        ├── Embedding Service           ← child embedding observation
        ├── Vector Search               ← child retriever observation
        ├── Context Assembly            ← child span
        ├── LLM Generation             ← child generation observation
        └── Evaluation (optional)       ← child evaluator observation
```

The orchestrator (`ai-query-service`) owns the trace. Each sub-step receives the parent span reference to create child observations:

```typescript
// ai-query-service.ts — the orchestrator
export async function handleAIQuery(query: string, env: Env, ctx: ExecutionContext) {
  const traceId = crypto.randomUUID();
  const trace = createTrace(traceId, "ai-query", { query });

  // Step 1: Classify
  const classifySpan = trace.addSpan("classify-query", { input: query });
  const classification = await classifyQuery(query);
  classifySpan.end({ output: classification });

  // Step 2: Embed + Retrieve
  const embedSpan = trace.addEmbedding("embed-query", {
    model: "@cf/baai/bge-m3",
    input: query,
  });
  const embedding = await env.AI.run("@cf/baai/bge-m3", { text: [query] });
  embedSpan.end({ usage: { input: tokenCount } });

  const retrieveSpan = trace.addRetriever("vector-search", { input: query });
  const docs = await env.VECTORIZE.query(embedding, { topK: 5 });
  retrieveSpan.end({ output: docs });

  // Step 3: Generate
  const genSpan = trace.addGeneration("llm-answer", {
    model: "@cf/google/gemma-3-12b-it",
    input: buildPrompt(query, docs),
  });
  const answer = await env.AI.run("@cf/google/gemma-3-12b-it", { messages });
  genSpan.end({ output: answer, usage: { input: 500, output: 200 } });

  trace.end({ output: answer });

  // Flush in background
  ctx.waitUntil(trace.flush());

  return answer;
}
```

### When to Distribute

Distribute instrumentation only when:
- Services are independently deployed (microservices)
- Using OpenTelemetry context propagation across HTTP boundaries
- Different teams own different pipeline stages

For a monolith backend like NobodyClimb's Hono API, **centralized is clearly better**.

---

## 5. Practical Recommendation for NobodyClimb

Given the constraints (Cloudflare Workers, Hono, D1, Workers AI):

### Approach: Thin Langfuse Client Wrapper over REST API

Build a lightweight `LangfuseTracer` class that:
1. Collects trace events in memory during request processing
2. Batches them into a single `POST /api/public/ingestion` call
3. Fires the batch in `ctx.waitUntil()` after the response

```typescript
// utils/langfuse.ts
export class LangfuseTracer {
  private events: BatchEvent[] = [];
  private traceId: string;

  constructor(name: string, opts: { userId?: string; sessionId?: string; input?: any }) {
    this.traceId = crypto.randomUUID();
    this.events.push({
      type: "trace-create",
      id: crypto.randomUUID(),
      body: { id: this.traceId, name, ...opts },
    });
  }

  span(name: string, input?: any): ObservationHandle {
    const id = crypto.randomUUID();
    const startTime = new Date().toISOString();
    this.events.push({
      type: "span-create",
      id,
      body: { id, traceId: this.traceId, name, input, startTime },
    });
    return {
      end: (output?: any) => {
        this.events.push({
          type: "span-update",
          id: crypto.randomUUID(),
          body: { id, traceId: this.traceId, output, endTime: new Date().toISOString() },
        });
      },
    };
  }

  generation(name: string, opts: { model: string; input: any }): ObservationHandle {
    const id = crypto.randomUUID();
    const startTime = new Date().toISOString();
    this.events.push({
      type: "generation-create",
      id,
      body: { id, traceId: this.traceId, name, startTime, ...opts },
    });
    return {
      end: (output: any, usage?: { input: number; output: number }) => {
        this.events.push({
          type: "generation-update",
          id: crypto.randomUUID(),
          body: {
            id, traceId: this.traceId, output,
            endTime: new Date().toISOString(),
            usage: usage ? { ...usage, total: usage.input + usage.output } : undefined,
          },
        });
      },
    };
  }

  async flush(env: { LANGFUSE_PUBLIC_KEY: string; LANGFUSE_SECRET_KEY: string }): Promise<void> {
    if (this.events.length === 0) return;
    await fetch("https://cloud.langfuse.com/api/public/ingestion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${env.LANGFUSE_PUBLIC_KEY}:${env.LANGFUSE_SECRET_KEY}`)}`,
      },
      body: JSON.stringify({ batch: this.events }),
    });
  }
}
```

Usage in Hono:

```typescript
app.post("/api/v1/ai/ask", async (c) => {
  const { query } = await c.req.json();
  const env = c.env;

  const tracer = new LangfuseTracer("ai-ask", {
    userId: c.get("userId"),
    input: { query },
  });

  // Classify
  const classifySpan = tracer.span("classify-query", query);
  const classification = classifyQuery(query);
  classifySpan.end(classification);

  // Embed + Retrieve
  const embedSpan = tracer.span("embed-query", query);
  const embedding = await env.AI.run("@cf/baai/bge-m3", { text: [query] });
  embedSpan.end({ dimensions: 1024 });

  const retrieveSpan = tracer.span("vector-search", { query });
  const docs = await env.VECTORIZE_INDEX.query(embedding.data[0], { topK: 5 });
  retrieveSpan.end({ count: docs.matches.length });

  // Generate
  const gen = tracer.generation("llm-answer", {
    model: "@cf/google/gemma-3-12b-it",
    input: buildMessages(query, docs),
  });
  const result = await env.AI.run("@cf/google/gemma-3-12b-it", { messages });
  gen.end(result.response, { input: 500, output: 200 });

  // Non-blocking flush
  c.executionCtx.waitUntil(tracer.flush(env));

  return c.json({ answer: result.response });
});
```

---

## Summary of Key Findings

| Area | Finding |
|------|---------|
| **SDK v3 architecture** | Fully OTEL-native; uses `@opentelemetry/sdk-node` which **does not work in CF Workers** |
| **CF Workers workaround** | Use direct REST API (`POST /api/public/ingestion`) or legacy `langfuse` npm package |
| **Observation types** | Use `generation` for LLM calls, `retriever` for vector search, `embedding` for embeddings, `span` for generic steps |
| **Flush pattern** | Always use `ctx.waitUntil(flush())` — 30s budget shared across all waitUntil calls |
| **Centralized vs distributed** | Centralized at orchestration layer is the standard for monolith backends |
| **Trace structure** | One trace per user request, child observations for each pipeline step |
| **Batch ingestion** | `POST /api/public/ingestion` accepts batch of events, returns HTTP 207 multi-status |

---

## Sources

- [Langfuse JS/TS SDK Docs](https://langfuse.com/docs/sdk/typescript)
- [Langfuse TypeScript Instrumentation](https://langfuse.com/docs/observability/sdk/typescript/instrumentation)
- [Langfuse Observation Types](https://langfuse.com/docs/observability/features/observation-types)
- [Langfuse RAG Observability & Evals](https://langfuse.com/blog/2025-10-28-rag-observability-and-evals)
- [Langfuse Serverless Functions FAQ](https://langfuse.com/faq/all/aws-lambda-and-serverless-functions)
- [Langfuse Tracing Data Model](https://langfuse.com/docs/observability/data-model)
- [Langfuse Ingestion API (DeepWiki)](https://deepwiki.com/langfuse/langfuse/6.2-ingestion-api)
- [CF Workers + Langfuse Discussion #10715](https://github.com/orgs/langfuse/discussions/10715)
- [CF Workers waitUntil Docs](https://developers.cloudflare.com/workers/runtime-apis/context/)
- [otel-cf-workers](https://github.com/evanderkoogh/otel-cf-workers)
