# cf-rag-kit Design Spec

**Date**: 2026-03-15
**Status**: Draft
**Scope**: Standalone template repo extracting NobodyClimb's AI system into a generic, reusable Cloudflare RAG kit

---

## Overview

`cf-rag-kit` is a pnpm monorepo template that packages a production-grade RAG (Retrieval-Augmented Generation) system built on Cloudflare Workers + Hono + D1 + Vectorize. It can be used in three ways:

1. **Full template** — Clone and use as the foundation for a new project
2. **Backend only** — Deploy `backend/` as a standalone Worker; call its API from any frontend
3. **UI components only** — Copy `packages/ui/` into an existing React/Next.js/Astro project

---

## Repository Structure

```
cf-rag-kit/
├── apps/
│   └── demo/                         # Next.js 15 demo app
│       ├── src/
│       │   ├── app/
│       │   │   ├── admin/ai/         # Admin dashboard pages
│       │   │   └── demo/             # Public chat demo page
│       │   ├── components/           # Page-level composition (imports from packages/ui)
│       │   └── lib/                  # App-level utilities
│       └── wrangler.json
│
├── backend/                          # Standalone deployable Hono Worker
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ai.ts                 # User-facing AI endpoints
│   │   │   └── admin-ai.ts           # Admin management endpoints
│   │   ├── services/
│   │   │   ├── pipeline/             # Pipeline engine + 14 steps
│   │   │   │   ├── engine.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── context.ts
│   │   │   │   ├── registry.ts
│   │   │   │   ├── utils.ts
│   │   │   │   └── steps/            # 14 pipeline step implementations
│   │   │   ├── query/                # Query service + 8 sub-modules
│   │   │   │   ├── index.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── types.ts
│   │   │   │   ├── nlp.ts            # Generic tag/category/date filter extraction (stub for custom logic)
│   │   │   │   ├── documents.ts
│   │   │   │   ├── filters.ts
│   │   │   │   ├── llm.ts
│   │   │   │   ├── retrieval.ts
│   │   │   │   ├── cache-log.ts
│   │   │   │   └── plan-execute.ts
│   │   │   ├── tool-registry.ts      # Tool definitions for tool-selection step
│   │   │   ├── embedding.ts
│   │   │   ├── rank.ts               # Quota tier system (generic tiers)
│   │   │   ├── memory-extractor.ts
│   │   │   ├── personalization.ts
│   │   │   ├── recommendation.ts
│   │   │   └── indexing.ts
│   │   ├── utils/
│   │   │   ├── guardrails.ts
│   │   │   ├── ai-prompts.ts
│   │   │   ├── circuit-breaker.ts
│   │   │   └── timeout.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Simple JWT auth (plug-in your own)
│   │   │   └── rateLimit.ts
│   │   ├── repositories/
│   │   │   └── memory.ts
│   │   └── db/
│   │       └── schema.sql            # AI tables only
│   ├── migrations/
│   └── wrangler.toml
│
├── packages/
│   ├── ui/                           # React components (copy or pnpm add)
│   │   ├── admin/                    # Admin dashboard + 24 pipeline trace visualizers
│   │   │   ├── ai-log-detail/        # Pipeline trace components
│   │   │   ├── dashboard/            # KPI metrics, charts
│   │   │   ├── config/               # Pipeline config editor
│   │   │   └── prompts/              # Prompt management UI
│   │   ├── chat/                     # Embeddable chat widget
│   │   │   ├── ChatWidget.tsx        # Main widget (SSE streaming support)
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── QuotaIndicator.tsx
│   │   └── package.json
│   │
│   ├── api-client/                   # fetch-based API client (no axios dependency)
│   │   ├── src/
│   │   │   ├── ai.ts                 # User-facing AI calls + streaming
│   │   │   └── admin-ai.ts           # Admin API calls
│   │   └── package.json
│   │
│   ├── types/                        # Shared TypeScript types
│   └── schemas/                      # Zod validation schemas
│
├── seed/
│   ├── demo-documents.json           # ~50 Cloudflare Workers docs articles
│   └── seed.ts                       # Setup script: D1 + Vectorize + embeddings + admin user
│
├── docs/
│   ├── integration-nextjs.md         # Next.js integration guide
│   └── integration-astro.md          # Astro integration guide
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Generification Changes

The following domain-specific elements from NobodyClimb are replaced with generic equivalents:

| NobodyClimb (Original) | cf-rag-kit (Generic) |
|---|---|
| Quota tiers: `foothill / wall / ridge / summit` | `free / starter / pro / enterprise` |
| Document types: `routes / crags / videos` | `documents / collections / media` (configurable via env) |
| Climbing NLP filters: grade, location, type | Generic filters: tag, category, date — `nlp.ts` ships as a stub with the extraction interface defined; implementers fill in domain logic |
| Personalization: `biography + ascent context` | Generic: `user_profile + activity_history` |
| Climbing-specific system prompts | Generic knowledge base Q&A prompts (overridable via admin) |
| Hardcoded domain URLs | Environment variable: `PUBLIC_API_URL` |
| Rank scoring from biography/stories/ascents | Generic scoring from profile completeness + activity |
| `popularity-rerank` step (ranks by video count) | Renamed to `source-assembly` — reranks by generic `popularity_score` field on documents |
| `crag-fallback` trace visualizer (CRAG = Corrective RAG, climbing term) | Renamed to `result-fallback` — fallback to broader retrieval when insufficient results found |

**Unchanged (renamed only)**: Pipeline architecture, all 14 steps (including `popularity-rerank` → renamed `source-assembly`), admin dashboard logic, chat widget, quota enforcement mechanism, circuit breaker, guardrails, judge/self-reflection.

---

## API Endpoints

### User-facing (`/api/v1/ai`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/ask` | RAG Q&A with optional SSE streaming (`?stream=true`) |
| `GET` | `/quota/me` | Current user quota + tier info |
| `GET` | `/search` | Semantic search (no LLM) |
| `POST` | `/feedback` | Submit feedback score (1–5) |
| `POST` | `/sessions` | Create chat session |
| `GET` | `/sessions` | List sessions |
| `GET` | `/sessions/:id/messages` | Get session messages |
| `POST` | `/sessions/:id/messages` | Save message to session |
| `DELETE` | `/sessions/:id` | Delete session |
| `GET` | `/recommendations` | Get user's recommendation history |
| `POST` | `/recommendations` | Trigger manual recommendation generation |
| `GET` | `/memory` | List user's stored memories |
| `DELETE` | `/memory/:id` | Delete a memory |
| `GET` | `/health` | Health check |

### Admin (`/api/v1/admin/ai`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | KPI metrics (queries, latency, success rate, weekly trends) |
| `GET` | `/logs` | Paginated query logs with filters (date, type, user, feedback score) |
| `GET` | `/logs/:id` | Full pipeline trace detail |
| `GET/PUT` | `/config` | AI configuration (models, timeouts, thresholds) |
| `GET/POST/PUT/DELETE` | `/prompts` | Prompt management with versioning |
| `GET` | `/prompts/defaults` | Get default prompt templates |
| `GET/PUT` | `/pipeline-steps` | Enable/disable/reorder steps |
| `GET` | `/metrics` | Trend analysis (7d/30d/90d): latency percentiles, quality, cache hit rate |
| `GET` | `/knowledge` | Knowledge base index status (document counts per collection) |
| `GET` | `/users/:id/rank` | User tier detail with score breakdown |
| `POST` | `/recalculate-ranks` | Recalculate all user tiers |
| `PUT` | `/users/:id/rank-override` | Admin override user tier |

---

## Pipeline Architecture

14 registered pipeline steps across 5 phases, all configurable via admin dashboard.

Note: `guardrails-input`, `guardrails-output`, `quota-check`, and `memory-extraction` are handled at the route/engine level and appear as trace events in the admin UI, but are not registered pipeline steps.

```
pre-retrieval → retrieval → post-retrieval → generation → evaluation
```

| Phase | Registered Step IDs |
|---|---|
| pre-retrieval | `semantic-cache`, `tool-selection`, `text-to-sql` (optional), `hyde`, `multi-query`, `filter-build` |
| retrieval | `embedding`, `hybrid-search` (BM25 + vector) |
| post-retrieval | `cross-encoder`, `mmr`, `source-assembly` |
| generation | `llm-generation` (streaming) |
| evaluation | `judge`, `self-reflection` |

Strategy selection (per-query):
- **Baseline**: Standard single-pass retrieval
- **Agentic**: Multi-step retrieval loop (complex queries)
- **Plan-Execute**: Decompose → parallel execute → synthesize

---

## UI Components

### `packages/ui/admin`
React components for pipeline trace visualization and admin management:

**Pipeline trace visualizers** (24 components — 22 extracted from source + 2 new):
`guardrails-input`, `guardrails-output`, `cache`, `quota-check`, `query-parsing`, `text-to-sql`, `embedding`, `hyde`, `multi-query`, `filter`, `retrieval`, `rrf-fusion`, `result-fallback` (renamed from `crag-fallback`), `reranker`, `mmr-selection`, `agentic`, `plan-execute`, `multi-tool`, `generation`, `self-reflection`, `judge`, `memory-extraction` ← 22 extracted

New in cf-rag-kit (not in source): `tool-selection`, `source-assembly` ← 2 new visualizers built during extraction to complete the step coverage

**Supporting components**:
- `PipelineTimeline` — visual stage-by-stage execution timeline
- `QualitySection` — groundedness, auto_score, feedback metrics
- `LatencyBreakdown` — phase latency chart
- `CostAnalysis` — token cost with provider pricing
- `DecisionNarrative` — natural language pipeline explanation

**Dashboard / config / prompts**:
- Dashboard: KPI cards, latency charts, quality metrics
- Config editor: model settings, thresholds, timeouts
- Prompt manager: versioned prompt editing

### `packages/ui/chat`
Embeddable chat widget:
- SSE streaming token delivery
- Session management
- Quota indicator
- Feedback buttons (thumbs up/down → `POST /feedback`)
- Framework-agnostic React (works in Next.js natively; Astro via `@astrojs/react`)

---

## API Client (`packages/api-client`)

- **fetch-based** (not axios) — works in all environments including Edge Runtime and Astro
- Exports typed functions matching all backend endpoints
- Streaming helper: `askStream(query, onToken, onDone, onError)`
- TanStack Query hooks included as optional exports (React only)

---

## Demo Scenario

**Domain**: Cloudflare Workers technical documentation Q&A

- **Seed data**: ~50 articles covering Workers, D1, KV, R2, Vectorize, AI Binding
- **Setup**:
  ```bash
  # 1. Create Cloudflare resources (run once)
  wrangler d1 create cf-rag-kit-db
  wrangler vectorize create cf-rag-kit-index --dimensions=1024 --metric=cosine
  # 2. Write IDs from above output into wrangler.toml, then:
  pnpm seed   # runs D1 migrations + embeds documents + creates admin user
  ```
- **Start**: `pnpm dev` — runs backend (`:8787`) + demo app (`:3000`)

Demo pages:
- `localhost:3000/demo` — public chat interface, ask Cloudflare questions
- `localhost:3000/admin/ai` — full admin dashboard with live pipeline traces

---

## Quota Tiers (Generic)

| Tier | Score Threshold | Daily Queries | Daily Tokens |
|---|---|---|---|
| free | 0 | 2 | 5,000 |
| starter | 20 | 6 | 15,000 |
| pro | 70 | 12 | 30,000 |
| enterprise | 100 | 24 | 60,000 |

Score is calculated from: profile completeness + activity history (configurable formula).
Admin can override any user's tier manually.

---

## Out of Scope

| Excluded | Reason |
|---|---|
| User registration / login UI | Auth strategy varies per project; JWT middleware provided as plug-in point |
| Document indexing UI | Document structure is project-specific; `indexing.ts` service exposed for custom use |
| Payment / upgrade flow | Quota tiers exist; upgrade trigger is project-specific |
| Mobile app | Web (React) components only |
| Non-Cloudflare vector DBs | Scoped to Cloudflare ecosystem (Vectorize + D1 + Workers AI) |

---

## Auth Contract

The template ships a simple JWT middleware. To integrate your own auth:

1. Middleware must set `c.set('userId', string)` and `c.set('user', { id: string, role: 'admin' | 'user' })` on the Hono context
2. Backend reads `WRANGLER_SECRET_JWT_SECRET` binding for JWT verification (configurable in `wrangler.toml`)
3. Admin routes check `user.role === 'admin'`; quota system uses `userId` as the lookup key

---

## `packages/ui` Distribution Strategy

`packages/ui` is designed for **copy-and-own** usage:
- Copy the directory into your project's `src/components/ai/`
- Peer dependencies required: React 18+, TailwindCSS 3.4+, `lucide-react`, `@tanstack/react-query`, and potentially Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-tooltip`, etc.) — exact list to be confirmed during extraction audit
- No npm publish required; all styles use Tailwind utility classes (no CSS-in-JS)
- Astro users must add `@astrojs/react` and wrap components with `client:load`

---

## Prerequisites for Users

- Cloudflare account with Workers, D1, Vectorize, and AI Binding enabled
- Node.js 18+ and pnpm
- `wrangler` CLI installed and authenticated
- (Optional) Bring your own auth middleware; template includes simple JWT implementation

---

## Integration Guides

### Next.js (existing project)
1. Deploy `backend/` as a Worker, note the API URL
2. Copy `packages/ui/` and `packages/api-client/` into your project
3. Set `NEXT_PUBLIC_API_URL` to your Worker URL
4. Import `ChatWidget` or admin components as needed

### Astro (existing project)
1. Deploy `backend/` as a Worker
2. Add `@astrojs/react` integration to your Astro project
3. Copy `packages/ui/` and `packages/api-client/` into your project
4. Use components in `.astro` files with `client:load` directive
