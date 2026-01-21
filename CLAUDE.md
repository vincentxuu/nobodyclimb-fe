# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NobodyClimb is a rock climbing community platform consisting of:
- **Frontend**: Next.js 15 + React 19 application deployed on Cloudflare Workers
- **Backend**: Hono framework API on Cloudflare Workers with D1 database (in `backend/` directory)

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router), React 19
- **Language**: TypeScript 5.9
- **Styling**: TailwindCSS 3.4 + Tailwind Animate
- **State Management**: Zustand 4.5 (global), TanStack Query 5.85 (server state)
- **Forms**: React Hook Form 7.62 + Zod 3.25
- **UI Components**: Radix UI primitives + custom components
- **Animation**: Framer Motion 12.23
- **Testing**: Jest 29.7 + React Testing Library 16.3
- **Deployment**: Cloudflare Workers via OpenNext.js adapter

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (file storage)
- **Cache**: Cloudflare KV
- **Auth**: JWT (jose library)

## Essential Commands

### Frontend Development
```bash
pnpm dev                 # Start Next.js dev server (localhost:3000)
pnpm build              # Build for production
pnpm lint               # Run ESLint
pnpm test               # Run Jest tests
pnpm format             # Format code with Prettier
pnpm format:check       # Check code formatting
```

### Frontend Cloudflare Deployment
```bash
pnpm build:cf                       # Build for Cloudflare
wrangler deploy --env production    # Deploy to production (nobodyclimb.cc)
wrangler deploy --env preview       # Deploy to preview environment
wrangler tail --env production      # View production logs
```

### Backend Development
```bash
cd backend
pnpm dev                           # Start local dev server
pnpm db:migrate                    # Run migrations locally
pnpm db:migrate:remote             # Run migrations on remote D1
pnpm deploy:preview                # Deploy to preview environment
pnpm deploy:production             # Deploy to production
```

### YouTube Video Data Processing
```bash
./scripts/add-channel.sh            # Add new YouTube channel (interactive)
./scripts/update-videos.sh          # Update all channel videos
./scripts/collect-youtube-data.sh   # Collect single channel video data
node scripts/convert-youtube-videos.js  # Convert video data format
```

Channel configuration is stored in `scripts/channels.json`. Prerequisites: `yt-dlp`, `jq`.

## Project Structure

```
nobodyclimb-fe/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages (login, register, profile-setup)
│   │   ├── biography/          # Climber biographies
│   │   ├── blog/               # Blog system
│   │   ├── crag/               # Outdoor climbing crags
│   │   ├── gym/                # Indoor climbing gyms
│   │   ├── gallery/            # Photo galleries
│   │   ├── profile/            # User profiles
│   │   ├── search/             # Search functionality
│   │   ├── videos/             # YouTube video browser
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components organized by feature
│   │   ├── shared/             # Shared components across features
│   │   └── ui/                 # Base UI components (Radix UI wrappers)
│   ├── lib/
│   │   ├── api/                # API client (Axios + interceptors)
│   │   ├── constants/          # Constants and configuration
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── store/
│   │   ├── authStore.ts        # Auth state (Zustand)
│   │   ├── contentStore.ts     # Content state (Zustand)
│   │   └── uiStore.ts          # UI state (Zustand)
│   └── styles/                 # Global styles
├── backend/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts            # Main entry point and routing
│   │   ├── types.ts            # TypeScript types
│   │   ├── db/                 # Database schema
│   │   ├── middleware/         # Auth middleware
│   │   ├── routes/             # API route handlers
│   │   └── utils/              # Utility functions
│   ├── migrations/             # D1 database migrations
│   └── wrangler.toml           # Cloudflare Workers config
├── public/
│   └── data/                   # Static JSON data files (videos, etc.)
└── scripts/                    # Utility scripts (YouTube data collection)
```

## Architecture Patterns

### Frontend State Management
- **Zustand stores** (`src/store/`): Global client state (auth, UI, content)
- **TanStack Query**: Server state caching and data fetching
- **React Hook Form + Zod**: Form state and validation

### API Communication
- Axios client in `src/lib/api/client.ts` with:
  - Request interceptor: Auto-adds JWT token from cookies
  - Response interceptor: Handles token refresh on 401
- Base URL: `https://api.nobodyclimb.cc/api/v1` (configurable via `NEXT_PUBLIC_API_URL`)
- Auth tokens stored in cookies using `js-cookie`

### Component Organization
- Features grouped by domain (e.g., `components/crag/`, `components/profile/`)
- Shared components in `components/shared/`
- Base UI components (Radix UI wrappers) in `components/ui/`
- Use `@/` path alias for imports (e.g., `import { Button } from '@/components/ui/button'`)

### Backend Architecture (Hono + D1)
- RESTful API with route handlers in `backend/src/routes/`
- JWT authentication middleware
- D1 database with SQLite schema in `backend/src/db/schema.sql`
- Cloudflare bindings: DB (D1), CACHE (KV), STORAGE (R2)

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
- `@/*` maps to `src/*` (configured in `tsconfig.json`)
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
- Build output in `.open-next/` directory
- Assets served via Cloudflare Assets binding
- Routes configured in `wrangler.json` to run worker first for dynamic routes

## Testing

- Jest configured for unit and component testing
- React Testing Library for component tests
- Run tests: `pnpm test`
- No custom Jest config file found (using Next.js defaults)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `deploy.yml`: Frontend deployment
- `deploy-api.yml`: Backend API deployment with D1 migrations
  - Triggers on changes to `backend/` directory
  - Requires `CLOUDFLARE_API_TOKEN` secret

## Important Notes

- Frontend uses React 19 and Next.js 15 (requires Node.js 18+)
- All code is in Traditional Chinese (comments, docs)
- Currently using static JSON files in `public/data/` for video data (KV integration planned)
- Backend requires Cloudflare account and proper bindings setup
- JWT secret must be configured via `wrangler secret put JWT_SECRET` for backend
