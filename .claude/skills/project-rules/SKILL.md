---
name: project-rules
description: nobodyclimb 專案開發規範，涵蓋 monorepo 結構、API 模式、前後端慣例、共用 packages
---

# nobodyclimb 專案規範

## Monorepo 結構

Turbo + pnpm workspace。Apps：`web`（Next.js 15）、`mobile`（Expo/React Native）。Backend：Cloudflare Workers + Hono。

## 共用 Packages

| Package | 用途 |
|---------|------|
| `@nobodyclimb/api-client` | Axios HTTP client，平台切換（web vs native token storage） |
| `@nobodyclimb/hooks` | Auth store factory（`createAuthStore`，Zustand） |
| `@nobodyclimb/schemas` | Zod schemas（前後端共用） |
| `@nobodyclimb/types` | TypeScript type definitions |
| `@nobodyclimb/constants` | 常數 |
| `@nobodyclimb/utils` | 共用工具函式 |

新功能涉及型別或驗證時，**必須放 shared packages**，不要在 app 內重複定義。

## Backend（Hono + D1）

### 架構

Routes → Services → Repositories，三層分離。

### Database

Cloudflare D1（SQLite），**不用 ORM**。直接 D1 API：

```typescript
const result = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
```

Schema 在 `backend/src/db/schema.sql`，migrations 在 `backend/migrations/`。

### Auth

JWT（jose）：access token 15m + refresh token 7d。Middleware：
- `authMiddleware` — 必須登入
- `optionalAuthMiddleware` — 可選
- `adminMiddleware` — admin only

`last_active_at` 每 24h 更新一次（減少 writes）。

### Validation

Zod schemas + `@hono/standard-validator`，自動驗證 + typed。

### Response 格式

```typescript
{ success: boolean, error?: string, message?: string, data?: any }
```

分頁用 `parsePagination()` 從 query string 解析。

## Web Frontend（Next.js 15）

### 路由

App Router + `[locale]` 動態 segment（next-intl i18n）。

### State

- Zustand stores（`authStore`, `contentStore`, `uiStore`）
- React Query v5（server state）
- React Hook Form + Zod（forms）

### API Client

`@nobodyclimb/api-client` 的 `createWebApiClient()`，Axios-based，自動 token refresh on 401。

### 元件結構

- Feature-based folders
- UI：Radix UI + Tailwind CSS + Framer Motion
- Path alias：`@/*` → `./src/*`

## Mobile（Expo + React Native）

- Expo Router v6（file-based routing）
- Tamagui v2（style system）
- 同樣用 `@nobodyclimb/*` shared packages
- `createAuthStore` 提供 native token storage

## Linting / Formatting（Prettier）

- `semi: false`、`singleQuote: true`
- `tabWidth: 2`、`printWidth: 100`
- `trailingComma: "es5"`
- `prettier-plugin-tailwindcss`

ESLint：`eslint-config-next`，`no-unused-vars` with `_` pattern。

## 命名慣例

- 檔案：kebab-case
- 元件：PascalCase
- Functions/hooks：camelCase
- 中文 comments
