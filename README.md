<div align="center">

# NobodyClimb

**The community platform for climbing enthusiasts.**

[![Deploy App](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml)
[![Deploy API](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml)
![Status](https://img.shields.io/badge/status-live-brightgreen.svg)

[Website](https://nobodyclimb.cc) · [API Docs](https://api.nobodyclimb.cc/api/v1/docs) · [Quick start](#quick-start) · [Deploy](#deployment) · [Architecture](#how-it-works)

[English](README.md) · [繁體中文](README.zh-TW.md)

</div>

NobodyClimb is a community platform for climbing enthusiasts — record your climbing stories, track ascents, explore route information, and get personalized advice from the built-in AI climbing assistant. Both frontend and backend run on Cloudflare Workers, managed as a monorepo with pnpm workspaces + Turborepo.

> [!IMPORTANT]
> This repository is a monorepo requiring Node.js 18+ and pnpm; the backend depends on Cloudflare D1 / R2 / KV and Workers AI. Configure environment variables before developing locally (see `.env.local.example`).

## Features at a glance

| Feature | Description |
| --- | --- |
| Persona | Core story, one-liner, and short stories that showcase your climbing life |
| Ascent log | Completion dates, difficulty grading, route tracking |
| Life list | Set climbing goals and track progress |
| Crags / Gyms | Route info, weather, maps |
| Route videos | 14+ YouTube channels, 11 category filters |
| i18n | Traditional Chinese / English / Japanese (next-intl) |
| Social | Follows, likes, comments, quick reactions, notifications |
| Level system | 麓 / 壁 / 稜 / 巔 — unlock more features through contribution |
| Admin dashboard | User management, crag management, broadcasts, analytics dashboard |

## Tech stack

| Layer | Technology | Location |
| --- | --- | --- |
| Web frontend | Next.js 15 + React 19 + TailwindCSS | `apps/web/` |
| Mobile app | React Native + Expo 54 + Tamagui | `apps/mobile/` |
| Backend API | Hono + Cloudflare Workers (D1 / R2 / KV) | `backend/` |
| AI inference | LangGraph + Multi-Provider (CF Workers AI / OpenAI / Anthropic / Google) | `backend/src/services/` |
| AI observability | Langfuse (trace / span / generation tracking) | `backend/src/utils/` |
| Shared packages | TypeScript (types / schemas / utils / hooks) | `packages/` |

## Quick start

Requirements: Node.js 18+, pnpm, and Git.

```bash
git clone https://github.com/vincentxuu/nobodyclimb.git
cd nobodyclimb
pnpm install
cp .env.local.example .env.local
pnpm dev          # start all services
```

- Web frontend: `http://localhost:3000`
- Backend API: `http://localhost:8787`

You can also start a single service:

```bash
pnpm dev:web      # frontend only
pnpm dev:backend  # backend only
pnpm dev:mobile   # mobile app only
```

### Common commands

```bash
pnpm build        # build all packages
pnpm lint         # Biome checks
pnpm test         # run tests
pnpm typecheck    # TypeScript type checking
pnpm format       # Biome formatting
```

## AI climbing assistant

The platform ships with a built-in AI assistant for climbing Q&A and recommendations:

- **LangGraph engine** — state-graph-driven AI pipeline supporting Baseline / Adaptive / Agentic / Plan-and-Execute strategies
- **Multi-provider** — abstraction layer to switch between Cloudflare Workers AI, OpenAI, Anthropic, and Google models
- **Langfuse observability** — end-to-end trace / span / generation tracking with cost and latency visualization
- **RAG Q&A** — combines vector and full-text search for natural-language answers about crags, routes, and climbing knowledge
- **Adaptive RAG** — classifies query types automatically and falls back to full-text search when relevance is low
- **Agentic multi-step RAG** — complex questions trigger multi-round search (ReAct pattern) driven by LLM decisions
- **SSE streaming** — token-by-token responses for a better experience
- **Personalization** — answers adapt to your ascent history and preferences, with cross-session memory
- **Route recommendations** — personalized route suggestions triggered after each completed ascent
- **Safety guardrails** — input/output guardrails and token budget management
- **Quota system** — per-level daily limits (both request count and tokens)
- **Admin dashboard** — AI log queries, prompt settings, knowledge base management, cost tracking and usage stats, LangGraph engine switching

## How it works

```text
Clients (Web / Mobile)
    |
    v
Cloudflare Workers edge        CDN, routing, auth
    |
    v
Hono API (OpenAPI docs)
    |
    +-- routes/                API routes
    +-- services/              business logic and LangGraph AI pipeline
    +-- repositories/          data access layer
    `-- D1 / R2 / KV           database, object storage, cache
```

## Project structure

```
nobodyclimb/
├── apps/
│   ├── web/               # Next.js web frontend
│   │   ├── src/app/       # App Router pages
│   │   ├── src/components # React components (grouped by domain)
│   │   ├── src/lib/       # API client, utilities
│   │   └── src/store/     # Zustand stores
│   └── mobile/            # React Native mobile app (Expo 54)
│       ├── app/           # Expo Router pages (profile, crag, story)
│       └── src/components # RN components (ui, crag, ascent, profile...)
├── backend/
│   ├── src/routes/        # API routes (with OpenAPI)
│   ├── src/services/      # business logic
│   ├── src/repositories/  # data access layer
│   └── migrations/        # D1 migration scripts
├── packages/              # shared packages (types, schemas, utils, hooks, api-client)
└── docs/                  # technical documentation
```

## Deployment

Both frontend and backend deploy automatically via GitHub Actions:

- `main` branch → production (`nobodyclimb.cc` / `api.nobodyclimb.cc`)
- Other branches → preview environments

Manual deployment:

```bash
# Frontend
cd apps/web && pnpm build:cf && wrangler deploy --env production

# Backend (run database migration first)
cd backend && pnpm db:migrate:remote && pnpm deploy:production
```

See the [deployment guide](docs/DEPLOYMENT-GUIDE.md) for details.

## Development conventions

- Strict TypeScript; the frontend uses the `@/` path alias
- Components grouped by domain: `components/<domain>/`
- Multilingual UI (zh-TW / en / ja); code comments written in **Traditional Chinese**
- AI pipeline built on LangGraph state graphs with full Langfuse observability
