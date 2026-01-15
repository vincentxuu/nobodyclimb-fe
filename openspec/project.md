# Project Context

## Purpose
NobodyClimb is a climbing community platform for sharing crag/gym info, routes, profiles, blogs, photos, and curated YouTube videos. The goal is to provide a responsive, fast, community-focused experience for climbers across web and mobile.

## Tech Stack
- Next.js 15 (App Router) + React 19
- TypeScript 5.9
- Tailwind CSS 3.4 + tailwindcss-animate
- State: Zustand (client) + TanStack Query (server)
- Forms: React Hook Form + Zod
- UI: Radix UI primitives + custom components
- HTTP: Axios
- Animations: Framer Motion
- Testing: Jest + React Testing Library
- Formatting/Lint: Prettier + ESLint
- Deployment: Cloudflare Workers via OpenNext
- Backend (in repo): Hono on Cloudflare Workers, D1 (SQLite), R2, KV, JWT (jose)

## Project Conventions

### Code Style
- TypeScript with strict typing; prefer explicit types for public APIs and shared utils.
- React function components with hooks; App Router patterns for data loading and layouts.
- Tailwind utility-first styling; use CVA/clsx/tailwind-merge for variants.
- Keep components grouped by domain under `src/components/<domain>/`.
- Use `@/` path alias for imports from `src/`.
- Code and comments are written in Traditional Chinese.

### Architecture Patterns
- Next.js App Router with route segments under `src/app/`.
- Feature grouping by domain (crag, gym, profile, videos, etc.).
- Client state in `src/store/` (Zustand); server state via TanStack Query.
- API client in `src/lib/api/` with Axios interceptors for JWT handling.
- Backend routes in `backend/src/routes/` with Hono middleware for auth.

### Testing Strategy
- Unit/component tests with Jest + React Testing Library.
- Prefer testing behavior over implementation details.
- Run `pnpm test` for frontend; backend tests are not currently defined.

### Git Workflow
- Feature branches named `feature/<short-description>`.
- Open PRs from feature branches; avoid direct commits to main.
- Commit message format is not enforced in repo; keep messages concise and descriptive.

## Domain Context
- The domain centers on climbing: crags (outdoor), gyms (indoor), routes, grades, and climber profiles.
- Content types include blogs, photo galleries, biographies, and curated YouTube videos.
- The UI and content target a Traditional Chinese audience.

## Important Constraints
- Runs on Cloudflare Workers; avoid Node-only APIs not supported by Workers.
- Frontend and backend both deploy to Workers; keep bundles compatible with edge runtime.
- API base URL defaults to `https://api.nobodyclimb.cc/api/v1` and can be overridden by `NEXT_PUBLIC_API_URL`.
- Node.js 18+ required for local development.

## External Dependencies
- Cloudflare Workers (frontend and backend)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (file storage)
- Cloudflare KV (key-value storage)
- OpenNext Cloudflare adapter for Next.js deployment
