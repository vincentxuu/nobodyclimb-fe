---
name: add-api-endpoint
description: 新增或修改 backend API endpoint 的標準步驟（Hono route + Zod validator + service/repository + OpenAPI + 掛載）。做 backend API 相關任務時使用
---

# 新增 Backend API Endpoint

Backend 在 `backend/`，Cloudflare Workers + Hono 4 + D1。照下面步驟做，每一步都有現成範例檔可抄。

## 架構決策：要不要分層？

- **簡單 CRUD**（一兩條 SQL）：SQL 直接寫在 route 檔。範例：`backend/src/routes/crags.ts`
- **有商業邏輯 / 權限 / 快取**：route → service → repository 三層。範例：
  `backend/src/routes/posts.ts` → `backend/src/services/post-service.ts` → `backend/src/repositories/post-repository.ts`

兩種都是專案認可的模式，依複雜度選擇。

## 步驟

### 1. 建 route 檔 `backend/src/routes/<resource>.ts`

骨架（新 code 一律用 Zod `validator`，不要學舊檔的手動 if 檢查）：

```ts
import { Hono } from 'hono'
import { describeRoute, validator } from 'hono-openapi'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { generateId, parsePagination } from '../utils/id'

export const thingsRoutes = new Hono<{ Bindings: Env }>()

const createThingSchema = z.object({
  name: z.string().min(1),
})

thingsRoutes.get(
  '/',
  describeRoute({ tags: ['Things'], summary: '取得列表', responses: { 200: { description: '成功' } } }),
  async (c) => {
    const { page, limit, offset } = parsePagination(c.req.query('page'), c.req.query('limit'))
    // D1: c.env.DB.prepare('SELECT ...').bind(...).all<T>() → result.results || []
    return c.json({ success: true, data, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } })
  }
)

thingsRoutes.post(
  '/',
  describeRoute({ tags: ['Things'], summary: '建立', responses: { 201: { description: '已建立' } } }),
  authMiddleware,                       // 需登入才加；admin 再加 adminMiddleware（順序：auth → admin → validator）
  validator('json', createThingSchema), // 也有 validator('query', ...) / validator('param', ...)
  async (c) => {
    const userId = c.get('userId')      // authMiddleware 設定
    const body = c.req.valid('json')
    const id = generateId()
    return c.json({ success: true, data: thing }, 201)
  }
)
```

### 2. 掛載到 `backend/src/index.ts`

兩處：頂部 import 區塊加 import；`v1.route(...)` 區塊（約 101–130 行）加
`v1.route('/things', thingsRoutes)`。若是新資源，OpenAPI documentation 的 `tags` 陣列也加一個 tag。

### 3. 錯誤處理慣例

- Service 層 `throw new Error('<已知訊息>')`；route 層 catch 後字串比對，對應到
  404 / 403 等，未知錯誤 `throw` 給全域 `app.onError`（回 500）。
- 錯誤信封：`{ success: false, error: 'Not Found', message: '<細節>' }` + 對應 HTTP status。

### 4. DB 慣例（違反即 review 不過）

- Table 複數、欄位 snake_case、boolean 用 INTEGER 0/1（`utils/id.ts` 的 `toBool()` 讀取）
- PK 用 `generateId()`（TEXT，app 端產生）；timestamp 用 `datetime('now')`
- 陣列欄位存 JSON 字串，讀寫時 `JSON.parse` / `JSON.stringify`
- like/bookmark/comment 用既有的多型表（`entity_type` + `entity_id`），不要另開新表
- 需要新表 / 新欄位 → 先照 `add-db-migration` skill 處理

### 5. 型別

回應的 data 型別如果前端（web/mobile）也要用，定義在 `packages/types`（照 `add-shared-code` skill），
不要只定義在 backend 內。

### 6. 驗證

照 `verify-changes` skill 的 backend 區段執行。最低限度：
`pnpm turbo run build --filter=@nobodyclimb/api^...` 後在 `backend/` 跑 `npx tsc --noEmit`，
再跑 root `pnpm lint`。

## 陷阱

- Service 一律在 handler 內每個 request 建構（bindings 來自 `c.env`），不要做成 module 全域單例。
- `adminMiddleware` 必須接在 `authMiddleware` 之後，單獨用會拿不到 user。
- 需要「登入者可看到個人化欄位、未登入也能看」的 GET → 用 `optionalAuthMiddleware`。
- OpenAPI 文件是 runtime 由 `openAPIRouteHandler` 產生的，不要去手改任何 openapi.json。
