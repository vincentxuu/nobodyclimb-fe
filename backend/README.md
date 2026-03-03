# NobodyClimb API

Cloudflare Workers 後端 API，使用 Hono 框架和 D1 資料庫。

## 技術棧

- **Runtime**: Cloudflare Workers
- **Framework**: [Hono](https://hono.dev/) - 輕量級 Web 框架
- **API 文檔**: OpenAPI 3.1 (auto-generated via hono-openapi) + Scalar API Reference UI
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (檔案存儲)
- **Cache**: Cloudflare KV
- **Auth**: JWT (jose)
- **AI**: Cloudflare AI Workers Inference（LLM + Embedding）

## 專案結構

```
backend/
├── src/
│   ├── index.ts                            # 主入口，路由配置
│   ├── types.ts                            # TypeScript 類型定義
│   ├── db/
│   │   └── schema.sql                      # D1 資料庫 schema
│   ├── middleware/
│   │   └── auth.ts                         # JWT 認證中間件
│   ├── repositories/
│   │   └── notification-repository.ts      # 通知資料存取層
│   ├── routes/
│   │   ├── auth.ts                         # 認證路由
│   │   ├── users.ts                        # 用戶管理 (Admin)
│   │   ├── crags.ts                        # 岩場路由
│   │   ├── gyms.ts                         # 攀岩館路由
│   │   ├── posts.ts                        # 文章路由
│   │   ├── galleries.ts                    # 相簿路由
│   │   ├── videos.ts                       # 影片路由
│   │   ├── search.ts                       # 搜尋路由
│   │   ├── biographies.ts                  # 人物誌路由
│   │   ├── biography-content.ts            # 人物誌內容互動路由
│   │   ├── ascents.ts                      # 攀爬記錄路由
│   │   ├── route-stories.ts                # 路線故事路由
│   │   ├── bucket-list.ts                  # 人生清單路由
│   │   ├── notifications.ts                # 通知路由
│   │   ├── ai.ts                           # AI 問答與語義搜尋路由
│   │   ├── admin-ai.ts                     # Admin AI 管理路由
│   │   ├── admin-crags.ts                  # Admin 岩場管理路由
│   │   ├── admin-areas.ts                  # Admin 區域管理路由
│   │   ├── admin-import.ts                 # Admin 資料匯入路由
│   │   ├── admin-questions.ts              # Admin 問題管理路由
│   │   ├── climbing-locations.ts           # 攀岩地點路由
│   │   ├── media.ts                        # 媒體（YouTube/Instagram）路由
│   │   ├── story-prompts.ts                # 故事問題路由
│   │   ├── stats.ts                        # 全站統計路由
│   │   ├── traffic.ts                      # 流量統計路由
│   │   ├── access-logs.ts                  # 存取日誌路由
│   │   ├── weather.ts                      # 天氣路由
│   │   └── guest.ts                        # 訪客路由
│   ├── services/
│   │   ├── biography-service.ts            # 人物誌業務邏輯
│   │   ├── biography-content-interactions-service.ts  # 人物誌內容互動
│   │   ├── notification-service.ts         # 通知業務邏輯
│   │   ├── post-service.ts                 # 文章業務邏輯
│   │   ├── query.ts                        # AI RAG 問答服務
│   │   ├── embedding.ts                    # 向量嵌入服務
│   │   ├── indexing.ts                     # 資料索引服務
│   │   └── weather.ts                      # 天氣服務
│   └── utils/
│       ├── id.ts                           # ID 工具函數
│       └── ai-prompts.ts                   # AI Prompt 模板
├── migrations/                             # D1 資料庫遷移
├── wrangler.toml                           # Cloudflare 配置
├── package.json
└── tsconfig.json
```

## 快速開始

### 1. 安裝依賴

```bash
cd backend
pnpm install
```

### 2. 建立 D1 資料庫

```bash
# 建立資料庫
wrangler d1 create nobodyclimb-db

# 將返回的 database_id 更新到 wrangler.toml
```

### 3. 建立 KV Namespace

```bash
wrangler kv:namespace create CACHE

# 將返回的 id 更新到 wrangler.toml
```

### 4. 建立 R2 Bucket

```bash
wrangler r2 bucket create nobodyclimb-storage
```

### 5. 設定環境變數

```bash
# 設定 JWT 密鑰
wrangler secret put JWT_SECRET
```

### 6. 執行資料庫 Migration

```bash
# 本地開發
pnpm db:migrate

# 遠端資料庫
pnpm db:migrate:remote
```

### 7. 啟動開發伺服器

```bash
pnpm dev
```

API 文檔（開發伺服器啟動後可訪問）：
- OpenAPI JSON: `http://localhost:8787/api/v1/openapi.json`
- Scalar 互動式文檔: `http://localhost:8787/api/v1/docs`

## API 端點

### 認證 `/api/v1/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | 註冊新用戶 |
| POST | `/login` | 用戶登入 |
| POST | `/refresh-token` | 刷新 Token |
| GET | `/me` | 取得當前用戶資料 |
| PUT | `/profile` | 更新個人資料 |
| POST | `/logout` | 登出 |

### 岩場 `/api/v1/crags`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得岩場列表 |
| GET | `/featured` | 取得精選岩場 |
| GET | `/:id` | 取得岩場詳情 |
| GET | `/slug/:slug` | 用 slug 取得岩場 |
| GET | `/:id/routes` | 取得岩場路線 |
| POST | `/` | 新增岩場 (Admin) |
| PUT | `/:id` | 更新岩場 (Admin) |
| DELETE | `/:id` | 刪除岩場 (Admin) |

### 攀岩館 `/api/v1/gyms`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得攀岩館列表 |
| GET | `/featured` | 取得精選攀岩館 |
| GET | `/:id` | 取得攀岩館詳情 |
| GET | `/slug/:slug` | 用 slug 取得攀岩館 |
| GET | `/:id/reviews` | 取得評論 |
| POST | `/` | 新增攀岩館 (Admin) |
| PUT | `/:id` | 更新攀岩館 (Admin) |
| DELETE | `/:id` | 刪除攀岩館 (Admin) |

### 文章 `/api/v1/posts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得文章列表 |
| GET | `/featured` | 取得精選文章 |
| GET | `/tags` | 取得所有標籤 |
| GET | `/:id` | 取得文章詳情 |
| GET | `/slug/:slug` | 用 slug 取得文章 |
| GET | `/:id/comments` | 取得文章評論 |
| POST | `/` | 新增文章 |
| PUT | `/:id` | 更新文章 |
| DELETE | `/:id` | 刪除文章 |

### 相簿 `/api/v1/galleries`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得相簿列表 |
| GET | `/popular` | 取得熱門相簿 |
| GET | `/:id` | 取得相簿詳情 |
| GET | `/slug/:slug` | 用 slug 取得相簿 |
| POST | `/` | 新增相簿 |
| PUT | `/:id` | 更新相簿 |
| DELETE | `/:id` | 刪除相簿 |

### 影片 `/api/v1/videos`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得影片列表 |
| GET | `/featured` | 取得精選影片 |
| GET | `/categories` | 取得分類列表 |
| GET | `/:id` | 取得影片詳情 |
| GET | `/slug/:slug` | 用 slug 取得影片 |
| POST | `/` | 新增影片 (Admin) |
| PUT | `/:id` | 更新影片 (Admin) |
| DELETE | `/:id` | 刪除影片 (Admin) |

### 搜尋 `/api/v1/search`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 全站搜尋 |
| GET | `/suggestions` | 搜尋建議 |

### 人物誌 `/api/v1/biographies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得人物誌列表 |
| GET | `/featured` | 取得精選人物誌 |
| GET | `/me` | 取得目前使用者的人物誌 |
| GET | `/:id` | 依 ID 取得人物誌 |
| GET | `/slug/:slug` | 依 slug 取得人物誌 |
| POST | `/` | 建立或更新人物誌 |
| PUT | `/me` | 更新目前使用者的人物誌 |
| PUT | `/me/autosave` | 自動儲存人物誌 |
| DELETE | `/me` | 刪除目前使用者的人物誌 |
| GET | `/:id/neighbors` | 取得相鄰的人物誌 |
| GET | `/:id/stats` | 取得人物誌統計資料 |
| POST | `/:id/view` | 記錄瀏覽次數 |
| POST | `/:id/follow` | 追蹤人物誌 |
| GET | `/:id/follow` | 檢查追蹤狀態 |
| DELETE | `/:id/follow` | 取消追蹤人物誌 |
| GET | `/:id/followers` | 取得追蹤者列表 |
| GET | `/:id/following` | 取得追蹤中列表 |
| GET | `/explore/locations` | 探索攀岩地點 |

### 攀爬記錄 `/api/v1/ascents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得當前使用者的攀爬記錄 |
| GET | `/stats` | 取得攀爬統計 |
| GET | `/:id` | 取得單筆攀爬記錄 |
| POST | `/` | 新增攀爬記錄 |
| PUT | `/:id` | 更新攀爬記錄 |
| DELETE | `/:id` | 刪除攀爬記錄 |
| GET | `/route/:routeId/public` | 取得路線的公開攀爬記錄 |
| GET | `/route/:routeId/summary` | 取得路線攀爬摘要 |

### 路線故事 `/api/v1/route-stories`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得路線故事列表 |
| GET | `/:id` | 取得單筆路線故事 |
| POST | `/` | 新增路線故事 |
| PUT | `/:id` | 更新路線故事 |
| DELETE | `/:id` | 刪除路線故事 |
| POST | `/:id/like` | 按讚或取消按讚路線故事 |
| GET | `/:id/likes` | 取得路線故事按讚者列表 |
| POST | `/:id/helpful` | 標記或取消標記路線故事為有幫助 |
| GET | `/:id/comments` | 取得路線故事的留言 |
| POST | `/:id/comments` | 新增路線故事留言 |

### 人生清單 `/api/v1/bucket-list`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/popular` | 取得熱門人生清單項目 |
| GET | `/recent-completions` | 取得最近完成的人生清單項目 |
| GET | `/by-category` | 依分類取得人生清單項目 |
| GET | `/category-counts` | 取得各分類的項目數量 |
| GET | `/by-location` | 依地點取得人生清單項目 |
| GET | `/locations/popular` | 取得熱門攀岩地點 |
| GET | `/locations/:locationId` | 取得特定地點詳情 |
| GET | `/footprints` | 取得攀岩足跡地點 |
| GET | `/:id` | 取得單一人生清單項目 |
| GET | `/biography/:biographyId` | 取得指定人物誌的人生清單 |

### 通知 `/api/v1/notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得通知列表 |
| GET | `/unread-count` | 取得未讀通知數量 |
| PUT | `/:id/read` | 標記通知為已讀 |
| PUT | `/read-all` | 標記所有通知為已讀 |
| DELETE | `/:id` | 刪除通知 |
| DELETE | `/` | 刪除所有通知 |
| GET | `/stats` | 取得通知統計 |
| POST | `/broadcast` | 發送廣播通知（管理員） |
| GET | `/broadcast/history` | 取得廣播歷史記錄（管理員） |
| GET | `/admin/stats` | 取得通知系統統計（管理員） |

### AI 問答 `/api/v1/ai`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ask` | RAG 自然語言問答 |
| GET | `/search` | 語義搜尋 |
| POST | `/feedback` | 提交回饋 |
| POST | `/index` | 觸發資料索引（Admin） |
| GET | `/health` | AI 服務健康檢查 |

### Admin AI `/api/v1/admin/ai`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | AI 儀表板 KPI（查詢數、延遲、回饋率、Token 用量） |
| GET | `/logs` | 查詢日誌列表 |
| GET | `/logs/:id` | 日誌詳情 |
| GET | `/index-status` | 知識庫索引狀態 |
| GET | `/prompts` | Prompt 列表 |
| POST | `/prompts` | 建立 Prompt |
| GET | `/prompts/:id` | 取得 Prompt 詳情 |
| PUT | `/prompts/:id` | 更新 Prompt |
| DELETE | `/prompts/:id` | 刪除 Prompt |
| GET | `/settings` | 取得 AI 設定 |
| PUT | `/settings` | 更新 AI 設定 |

### 媒體 `/api/v1/media`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/biography/:id/youtube` | 取得人物誌的 YouTube 影片列表 |
| POST | `/biography/:id/youtube` | 新增 YouTube 影片關聯 |
| PUT | `/biography/:id/youtube/:videoId` | 更新 YouTube 影片關聯 |
| DELETE | `/biography/:id/youtube/:videoId` | 刪除 YouTube 影片關聯 |
| GET | `/biography/:id/instagram` | 取得人物誌的 Instagram 貼文列表 |
| POST | `/biography/:id/instagram` | 新增 Instagram 貼文關聯 |
| PUT | `/biography/:id/instagram/:postId` | 更新 Instagram 貼文關聯 |
| DELETE | `/biography/:id/instagram/:postId` | 刪除 Instagram 貼文關聯 |
| GET | `/youtube/:videoId` | 取得 YouTube 影片資訊 |
| GET | `/instagram/:postId` | 取得 Instagram 貼文資訊 |

### 統計 `/api/v1/stats`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得全站統計資料（DAU/WAU/MAU） |
| POST | `/clear-cache` | 清除統計快取 |
| GET | `/follow-analytics` | 取得追蹤數據分析 |
| GET | `/user-activity` | 取得用戶活躍度分析 |
| GET | `/content` | 取得內容統計分析 |
| GET | `/community` | 取得社群統計資料 |

### 用戶管理 `/api/v1/users` (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得用戶列表（支援活躍時間篩選排序） |
| GET | `/stats` | 取得用戶統計 |
| PATCH | `/:id/status` | 更新用戶狀態 |
| PATCH | `/:id/role` | 更新用戶角色 |
| GET | `/:id` | 取得單一用戶詳細資訊 |
| POST | `/:id/avatar` | 上傳用戶頭像 |

### 天氣 `/api/v1/weather`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得指定岩場天氣狀況 |

### 攀岩地點 `/api/v1/climbing-locations`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得攀岩地點列表 |
| GET | `/:id` | 取得攀岩地點詳情 |
| GET | `/countries` | 取得國家列表 |

### Admin 岩場管理 `/api/v1/admin/crags`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 取得所有岩場列表 |
| GET | `/stats` | 取得岩場統計資料 |
| POST | `/import` | 批次匯入岩場 |
| GET | `/:id` | 取得單一岩場詳情 |
| PUT | `/:id/bolts` | 更新岩場路線及 bolt 數量 |
| POST | `/:id/routes/import` | 批次匯入路線 |
| GET | `/:id/routes` | 取得岩場的路線列表 |
| POST | `/:id/routes` | 新增路線 |
| PUT | `/:id/routes/:routeId` | 更新路線 |
| DELETE | `/:id/routes/:routeId` | 刪除路線 |
| GET | `/:id/routes/:routeId/videos` | 取得路線的影片列表 |
| POST | `/:id/routes/:routeId/videos` | 新增路線影片 |
| DELETE | `/:id/routes/:routeId/videos/:videoId` | 移除路線影片關聯 |

### Admin 故事問題管理 `/api/v1/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/story-categories` | 取得所有故事分類 |
| POST | `/story-categories` | 新增故事分類 |
| PUT | `/story-categories/:id` | 更新故事分類 |
| DELETE | `/story-categories/:id` | 刪除故事分類 |
| GET | `/one-liner-questions` | 取得所有一句話問題 |
| POST | `/one-liner-questions` | 新增一句話問題 |
| PUT | `/one-liner-questions/:id` | 更新一句話問題 |
| DELETE | `/one-liner-questions/:id` | 刪除一句話問題 |
| GET | `/story-questions` | 取得所有小故事問題 |
| POST | `/story-questions` | 新增小故事問題 |
| PUT | `/story-questions/:id` | 更新小故事問題 |
| DELETE | `/story-questions/:id` | 刪除小故事問題 |

## 部署

### 手動部署

```bash
# 預覽環境
pnpm deploy:preview

# 正式環境
pnpm deploy:production
```

### CI/CD 自動部署

專案使用 GitHub Actions 自動部署，配置檔案位於 `.github/workflows/deploy-api.yml`。

**觸發條件：**
- 推送到 `main` 分支且 `backend/` 目錄有變更
- Pull Request 到 `main` 分支（僅執行 type check）
- 手動觸發 (workflow_dispatch)

**部署流程：**
1. 安裝依賴
2. TypeScript 類型檢查
3. 部署到 Cloudflare Workers
4. 執行 D1 資料庫 migration

**設定 GitHub Secrets：**

在 GitHub Repository Settings > Secrets and variables > Actions 中設定：

| Secret | 說明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（需要 Workers 和 D1 權限）|

**建立 Cloudflare API Token：**

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 點擊 "Create Token"
3. 選擇 "Edit Cloudflare Workers" 模板
4. 加入以下權限：
   - Account > D1 > Edit
   - Account > Workers KV Storage > Edit
   - Account > Workers R2 Storage > Edit
5. 複製 Token 並加入 GitHub Secrets

## AI RAG 系統

後端整合了基於 Cloudflare AI Workers Inference 的 RAG（Retrieval-Augmented Generation）問答系統。

### 模型配置

| 角色 | 模型 |
|------|------|
| LLM | `@cf/google/gemma-3-12b-it` |
| 向量嵌入 | `@cf/baai/bge-m3`（1024 維，多語言） |

### 功能架構

- **`QueryService`** (`src/services/query.ts`): 智慧 NLP 過濾（地點、難度、路線類型）、RAG 問答流程
- **`EmbeddingService`** (`src/services/embedding.ts`): 向量嵌入生成與查詢
- **`IndexingService`** (`src/services/indexing.ts`): 路線/岩場資料向量索引建立
- **管理後台** (`/api/v1/admin/ai`): 查詢日誌、KPI 儀表板、Prompt 管理、AI 設定

### 資料庫表格

```sql
-- AI 查詢日誌
ai_query_logs (id, query, response, latency_ms, token_count, feedback_score, ...)

-- AI 向量嵌入索引
ai_embeddings (id, content_type, content_id, embedding, metadata, ...)

-- AI Prompt 模板
ai_prompts (id, name, template, variables, is_active, ...)

-- AI 設定
ai_settings (key, value, updated_at)
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `JWT_SECRET` | JWT 簽名密鑰 |
| `CORS_ORIGIN` | 允許的 CORS 來源 |

## 授權

MIT
