# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NobodyClimb is a rock climbing community platform using **pnpm workspaces + Turborepo** monorepo architecture:
- **Web Frontend**: Next.js 15 + React 19 application deployed on Cloudflare Workers (in `apps/web/`)
- **Mobile App**: React Native (Expo) + Tamagui cross-platform app (in `apps/mobile/`)
- **Backend API**: Hono framework on Cloudflare Workers with D1 database (in `backend/`)
- **Shared Packages**: Cross-project shared types, schemas, utils, hooks, etc. (in `packages/`)

## Technology Stack

### Web Frontend (apps/web)
- **Framework**: Next.js 15.5 (App Router), React 19
- **Language**: TypeScript 5.9
- **Styling**: TailwindCSS 3.4 + Tailwind Animate
- **State Management**: Zustand 4.5 (global), TanStack Query 5.85 (server state)
- **Forms**: React Hook Form 7.62 + Zod 3.25
- **UI Components**: Radix UI primitives + custom components
- **Animation**: Framer Motion 12.23
- **Testing**: Jest 29.7 + React Testing Library 16.3
- **Deployment**: Cloudflare Workers via OpenNext.js adapter

### Mobile App (apps/mobile)
- **Framework**: React Native 0.81 + Expo 54
- **Language**: TypeScript 5.9
- **UI Components**: Tamagui 2.0
- **Navigation**: Expo Router 6
- **State Management**: Zustand + TanStack Query

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono 4.6 (lightweight web framework)
- **API Documentation**: OpenAPI 3.1 + Scalar API Reference UI
- **Validation**: Zod + @hono/zod-openapi
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (file storage)
- **Cache**: Cloudflare KV
- **Auth**: JWT (jose library)

## Essential Commands

### Monorepo Commands (from root)
```bash
pnpm dev                 # Start all dev servers (via Turborepo)
pnpm dev:web             # Start web frontend only (localhost:3000)
pnpm dev:mobile          # Start mobile app (Expo)
pnpm dev:backend         # Start backend API
pnpm build               # Build all packages
pnpm build:web           # Build web frontend only
pnpm build:cf            # Build web for Cloudflare
pnpm lint                # Lint all packages
pnpm test                # Run all tests
pnpm typecheck           # TypeScript check all packages
pnpm format              # Format all code with Prettier
pnpm format:check        # Check code formatting
```

### Web Frontend (apps/web)
```bash
cd apps/web
pnpm dev                            # Start Next.js dev server
pnpm build                          # Build for production
pnpm build:cf                       # Build for Cloudflare
pnpm lint                           # Run ESLint
pnpm test                           # Run Jest tests
```

### Mobile App (apps/mobile)
```bash
cd apps/mobile
pnpm start                          # Start Expo dev server
pnpm ios                            # Run on iOS simulator
pnpm android                        # Run on Android emulator
```

### Backend Development
```bash
cd backend
pnpm dev                           # Start local dev server (localhost:8787)
pnpm db:migrate                    # Run migrations locally
pnpm db:migrate:remote             # Run migrations on remote D1
pnpm deploy:preview                # Deploy to preview environment
pnpm deploy:production             # Deploy to production
```

API documentation available at:
- OpenAPI JSON: `http://localhost:8787/api/v1/doc`
- Scalar UI: `http://localhost:8787/api/v1/reference`

### Frontend Cloudflare Deployment
```bash
cd apps/web
wrangler deploy --env production    # Deploy to production (nobodyclimb.cc)
wrangler deploy --env preview       # Deploy to preview environment
wrangler tail --env production      # View production logs
```

### YouTube Video Data Processing
```bash
cd apps/web
./scripts/add-channel.sh            # Add new YouTube channel (interactive)
./scripts/update-videos.sh          # Update all channel videos
./scripts/collect-youtube-data.sh   # Collect single channel video data
node scripts/convert-youtube-videos.js  # Convert video data format
```

Channel configuration is stored in `apps/web/scripts/channels.json`. Prerequisites: `yt-dlp`, `jq`.

## Project Structure

```
nobodyclimb/
├── apps/
│   ├── web/                        # Next.js Web Frontend (@nobodyclimb/web)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   ├── components/         # React components
│   │   │   ├── lib/                # Utility functions
│   │   │   ├── store/              # Zustand stores
│   │   │   └── styles/             # Global styles
│   │   ├── public/                 # Static assets
│   │   ├── scripts/                # Build/utility scripts
│   │   └── wrangler.json           # Cloudflare Workers config
│   │
│   └── mobile/                     # React Native App (@nobodyclimb/mobile)
│       ├── app/                    # Expo Router pages
│       ├── src/                    # Source code
│       │   ├── components/         # React Native components
│       │   └── lib/                # Utility functions
│       ├── assets/                 # App assets
│       └── tamagui.config.ts       # Tamagui UI config
│
├── backend/                        # Cloudflare Workers API (@nobodyclimb/api)
│   ├── src/
│   │   ├── index.ts                # Main entry point and routing
│   │   ├── db/                     # Database schema
│   │   ├── middleware/             # Auth middleware
│   │   ├── openapi/                # OpenAPI schema definitions
│   │   │   ├── routes/             # OpenAPI route definitions
│   │   │   └── schemas.ts          # Zod schemas for OpenAPI
│   │   ├── repositories/           # Data access layer
│   │   ├── routes/                 # API route handlers
│   │   ├── services/               # Business logic layer
│   │   └── utils/                  # Utility functions
│   ├── migrations/                 # D1 database migrations
│   └── wrangler.toml               # Cloudflare Workers config
│
├── packages/                       # Shared packages
│   ├── api-client/                 # API client library
│   ├── constants/                  # Shared constants
│   ├── hooks/                      # Shared React hooks
│   ├── schemas/                    # Zod validation schemas
│   ├── types/                      # TypeScript type definitions
│   └── utils/                      # Shared utility functions
│
├── docs/                           # Documentation
│   ├── ai-agent/                   # AI Agent 實作指南
│   ├── cloudflare-deployment/      # Cloudflare 部署指南
│   └── ...                         # 其他設計與規劃文件
├── turbo.json                      # Turborepo config
├── pnpm-workspace.yaml             # pnpm workspace config
└── package.json                    # Root package config
```

## Architecture Patterns

### Frontend State Management
- **Zustand stores** (`apps/web/src/store/`): Global client state (auth, UI, content)
- **TanStack Query**: Server state caching and data fetching
- **React Hook Form + Zod**: Form state and validation

### API Communication
- Axios client in `apps/web/src/lib/api/client.ts` with:
  - Request interceptor: Auto-adds JWT token from cookies
  - Response interceptor: Handles token refresh on 401
- Base URL: `https://api.nobodyclimb.cc/api/v1` (configurable via `NEXT_PUBLIC_API_URL`)
- Auth tokens stored in cookies using `js-cookie`

### Component Organization (Web)
- Features grouped by domain (e.g., `apps/web/src/components/crag/`, `apps/web/src/components/profile/`)
- Shared components in `apps/web/src/components/shared/`
- Base UI components (Radix UI wrappers) in `apps/web/src/components/ui/`
- Biography interaction components in `apps/web/src/components/biography/display/`
- Use `@/` path alias for imports (e.g., `import { Button } from '@/components/ui/button'`)

### Shared Packages
- Use workspace packages for cross-project sharing:
  - `@nobodyclimb/types` - TypeScript type definitions
  - `@nobodyclimb/schemas` - Zod validation schemas
  - `@nobodyclimb/constants` - Shared constants
  - `@nobodyclimb/hooks` - Shared React hooks
  - `@nobodyclimb/utils` - Utility functions
  - `@nobodyclimb/api-client` - API client library

### Biography Interaction Components
The biography feature uses shared interaction components in `apps/web/src/components/biography/display/`:

- **`ContentInteractionBar`**: Unified component combining quick reactions, like, and comment
  ```tsx
  <ContentInteractionBar
    contentType="stories"  // 'core-stories' | 'one-liners' | 'stories'
    contentId={id}
    isLiked={isLiked}
    likeCount={likeCount}
    commentCount={commentCount}
    onToggleLike={handleToggleLike}
    onFetchComments={handleFetchComments}
    onAddComment={handleAddComment}
    size="sm"           // 'sm' | 'md'
    showBorder={true}   // Show top border
    centered={false}    // Center align content
  />
  ```
- **`QuickReactionBar`**: Quick reaction buttons (我也是, +1, 說得好)
- **`ContentLikeButton`**: Like button with Mountain icon (emerald-600 color)
- **`ContentCommentSheet`**: Inline expandable comment section

### Backend Architecture (Hono + D1)
- RESTful API with route handlers in `backend/src/routes/`
- **OpenAPI 3.1 Documentation**: Auto-generated API docs at `/api/v1/doc`
- **Scalar API Reference**: Interactive API documentation UI at `/api/v1/reference`
- JWT authentication middleware
- D1 database with SQLite schema in `backend/src/db/schema.sql`
- Cloudflare bindings: DB (D1), CACHE (KV), STORAGE (R2)
- Layered architecture: routes → services → repositories

### Active User Definition (User Activity Tracking)
The system tracks user activity through the `last_active_at` field in the `users` table:

**Update Strategy**:
- Updated automatically in auth middleware (`backend/src/middleware/auth.ts`)
- Uses a "once per 24 hours" throttling strategy to minimize database writes
- Any authenticated API request counts as activity (login-based definition)

**Activity Metrics** (calculated in `backend/src/routes/stats.ts`):
- **DAU (Daily Active Users)**: Users with `last_active_at` within the last 24 hours
- **WAU (Weekly Active Users)**: Users with `last_active_at` within the last 7 days
- **MAU (Monthly Active Users)**: Users with `last_active_at` within the last 30 days

This follows industry-standard time ranges. The activity definition is intentionally broad (any authenticated request) to capture all user engagement, including passive browsing. This approach is commonly used by content platforms like Facebook, Instagram, and Medium.

## Deployment Environments

### Frontend (Cloudflare Workers)
- **Production**: `nobodyclimb.cc`, `www.nobodyclimb.cc`
  - Worker: `nobodyclimb-fe-production`
  - Deploy: `wrangler deploy --env production`
- **Preview**: Worker: `nobodyclimb-fe-preview`
  - Deploy: `wrangler deploy --env preview`
- KV Namespace binding: `VIDEOS` (for future video data storage)

### Backend (Cloudflare Workers)
- **Production**: `api.nobodyclimb.cc`
  - Worker: `nobodyclimb-api-production`
  - D1: `nobodyclimb-db`
  - R2: `nobodyclimb-storage`
- **Preview**: Worker: `nobodyclimb-api-preview`
  - D1: `nobodyclimb-db-preview`
  - R2: `nobodyclimb-storage-preview`

## Special Configurations

### TypeScript Path Aliases
- Web: `@/*` maps to `apps/web/src/*` (configured in `apps/web/tsconfig.json`)
- Each package has its own TypeScript config
- Backend is excluded from frontend TypeScript config

### Image Optimization
Next.js image configuration supports:
- YouTube thumbnails (`i.ytimg.com`, `img.youtube.com`)
- Cloudflare R2 and IPFS
- Imgur and custom domain
- AVIF and WebP formats
- Multiple device sizes for responsive images

### Cloudflare Workers Adapter
- Using `@opennextjs/cloudflare` 1.6.5
- Build output in `apps/web/.open-next/` directory
- Assets served via Cloudflare Assets binding
- Routes configured in `apps/web/wrangler.json` to run worker first for dynamic routes

## Testing

- Jest configured for unit and component testing
- React Testing Library for component tests
- Run tests: `pnpm test`
- No custom Jest config file found (using Next.js defaults)

## Analytics Configuration

Analytics tools (Google Analytics, Microsoft Clarity, PostHog) are controlled by two layers:

### Build-time Control
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Set in CI/CD workflow (`.github/workflows/deploy.yml`)
  - `main` branch → `true` (production)
  - Other branches → `false` (preview/test)

### Runtime Control
- `analytics.tsx` checks hostname at runtime
- Only enables on production domains: `nobodyclimb.cc`, `www.nobodyclimb.cc`
- Automatically disabled on: `preview.nobodyclimb.cc`, `localhost`, etc.

### Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Master switch for analytics (`'true'` to enable) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics Measurement ID |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity Project ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host URL |

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `deploy.yml`: Frontend deployment
  - Sets `NEXT_PUBLIC_ENABLE_ANALYTICS` based on branch
  - `main` → production with analytics enabled
  - Other branches → preview with analytics disabled
- `deploy-api.yml`: Backend API deployment with D1 migrations
  - Triggers on changes to `backend/` directory
  - Requires `CLOUDFLARE_API_TOKEN` secret

## Important Notes

- This is a **pnpm workspaces + Turborepo** monorepo
- Web frontend uses React 19 and Next.js 15 (requires Node.js 18+)
- Mobile app uses React Native 0.81 + Expo 54 + Tamagui 2.0
- All code is in Traditional Chinese (comments, docs)
- Currently using static JSON files in `apps/web/public/data/` for video data (KV integration planned)
- Backend requires Cloudflare account and proper bindings setup
- JWT secret must be configured via `wrangler secret put JWT_SECRET` for backend

## StartMoving - Idea to Product Framework

StartMoving is a structured framework for turning ideas into products. Use these slash commands:

| Command | Purpose |
|---------|---------|
| `/startmoving.new` | Create a new project |
| `/startmoving.define` | Define your idea (interactive Q&A) |
| `/startmoving.validate` | Generate validation plan |
| `/startmoving.plan` | Plan your MVP |
| `/startmoving.landing` | Generate landing page |
| `/startmoving.status` | View project status |
| `/startmoving.list` | List all projects |

**Workflow**: `/startmoving.new` → `/startmoving.define` → `/startmoving.validate` → `/startmoving.plan` → `/startmoving.landing`

For detailed instructions, see `.startmoving/AGENTS.md`.
