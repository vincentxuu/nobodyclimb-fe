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
│   │   ├── auth.ts                         # JWT 認證中間件
│   │   ├── accessLog.ts                    # 請求/回應日誌中間件
│   │   ├── dateFormat.ts                   # 回應日期格式中間件
│   │   └── rateLimit.ts                    # 速率限制中間件
│   ├── repositories/
│   │   ├── notification-repository.ts      # 通知資料存取層
│   │   ├── biography-repository.ts         # 人物誌資料存取層
│   │   ├── biography-content-repository.ts # 人物誌內容查詢
│   │   ├── biography-content-crud-repository.ts # 人物誌內容 CRUD
│   │   ├── content-interactions-repository.ts   # 內容互動（按讚/留言）
│   │   ├── post-repository.ts              # 文章資料存取層
│   │   └── memory.ts                       # AI 用戶記憶資料存取層
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
│   │   ├── query.ts                        # AI RAG 問答服務（Pipeline 入口 + NLP 方法）
│   │   ├── text-to-sql.ts                  # Text-to-SQL 服務
│   │   ├── embedding.ts                    # 向量嵌入服務
│   │   ├── indexing.ts                     # 資料索引服務
│   │   ├── rank.ts                         # Climber Rank 等級與配額服務
│   │   ├── recommendation.ts              # AI 路線推薦服務
│   │   ├── personalization.ts             # 個人化系統（記憶 + 攀登能力）
│   │   ├── memory-extractor.ts            # AI 用戶記憶萃取
│   │   ├── pipeline/                       # 模組化 RAG Pipeline
│   │   │   ├── index.ts                    # 公開匯出
│   │   │   ├── engine.ts                   # PipelineEngine（執行引擎 + 後處理）
│   │   │   ├── context.ts                  # PipelineContext 建立
│   │   │   ├── registry.ts                 # Step 註冊表（14 個 step 定義）
│   │   │   ├── types.ts                    # Pipeline 型別定義
│   │   │   ├── utils.ts                    # 共用工具（parseSuggestedQuestions）
│   │   │   └── steps/                      # 14 個 Pipeline Step 實作
│   │   │       ├── semantic-cache.ts       # 語義快取檢查
│   │   │       ├── tool-selection.ts       # Tool Calling 意圖分類
│   │   │       ├── text-to-sql.ts          # Text-to-SQL 直查
│   │   │       ├── hyde.ts                 # HyDE 假設文件生成
│   │   │       ├── multi-query.ts          # Multi-Query Expansion
│   │   │       ├── filter-build.ts         # Vectorize Filter 建構
│   │   │       ├── embedding.ts            # Query/HyDE/Expanded Embedding
│   │   │       ├── hybrid-search.ts        # Vector + BM25 混合搜尋 + Agentic
│   │   │       ├── cross-encoder.ts        # Cross-encoder Reranking
│   │   │       ├── mmr.ts                  # MMR 多樣性選取
│   │   │       ├── popularity-rerank.ts    # 熱門度加權 + Sources/Context 組合
│   │   │       ├── llm-generation.ts       # LLM 回答生成（含 GK earlyReturn）
│   │   │       ├── judge.ts                # Judge 品質評估
│   │   │       └── self-reflection.ts      # Self-Reflection 重生成 + loopBack
│   │   └── weather.ts                      # 天氣服務
│   └── utils/
│       ├── id.ts                           # ID 工具函數
│       ├── ai-prompts.ts                   # AI Prompt 模板
│       ├── guardrails.ts                   # AI 輸入/輸出安全防護
│       ├── storage.ts                      # R2 檔案儲存工具
│       └── viewTracker.ts                  # 瀏覽次數追蹤工具
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
| POST | `/ask` | RAG 自然語言問答（`?stream=true` 啟用 SSE 串流） |
| GET | `/search` | 語義搜尋 |
| POST | `/feedback` | 提交回饋 |
| POST | `/index` | 觸發資料索引（Admin） |
| GET | `/health` | AI 服務健康檢查 |
| POST | `/recommendations` | 手動觸發個人化路線推薦（消耗配額） |
| GET | `/recommendations` | 取得最新路線推薦 |
| GET | `/quota/me` | 取得當前用戶 AI 配額狀態（含等級、次數、token） |
| GET | `/memory` | 取得用戶 AI 記憶 |
| DELETE | `/memory/:id` | 刪除用戶 AI 記憶 |
| GET | `/sessions` | 取得對話歷史列表 |
| POST | `/sessions` | 建立新對話 |
| DELETE | `/sessions/:id` | 刪除對話 |
| GET | `/sessions/:id/messages` | 取得對話訊息 |
| POST | `/sessions/:id/messages` | 儲存對話訊息 |

### Admin AI `/api/v1/admin/ai`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | AI 儀表板 KPI（查詢數、延遲、回饋率、Token 用量） |
| GET | `/stats` | Token 用量聚合統計（依時間區間，供費用估算） |
| GET | `/logs` | 查詢日誌列表 |
| GET | `/logs/:id` | 日誌詳情 |
| GET | `/knowledge` | 知識庫索引狀態（文件數量統計） |
| GET | `/prompts` | Prompt 列表 |
| GET | `/prompts/defaults` | 取得預設 Prompt 模板 |
| POST | `/prompts` | 建立 Prompt |
| GET | `/prompts/:id` | 取得 Prompt 詳情 |
| PUT | `/prompts/:id` | 更新 Prompt |
| DELETE | `/prompts/:id` | 刪除 Prompt |
| GET | `/config` | 取得 AI Pipeline 設定 |
| PUT | `/config` | 更新 AI Pipeline 設定 |
| GET | `/pipeline-steps` | 取得 Pipeline Step 列表（開關/排序） |
| PUT | `/pipeline-steps` | 更新 Pipeline Step 開關/排序 |
| GET | `/users/:userId/rank` | 取得用戶等級詳情（含積分明細） |
| PUT | `/users/:userId/rank-override` | 覆寫用戶等級 |
| POST | `/recalculate-ranks` | 批次重算所有用戶等級 |
| GET | `/quality-stats` | 品質指標統計 |
| GET | `/latency-stats` | 延遲分段統計 |
| GET | `/flagged` | 低品質標記列表 |
| PATCH | `/flagged/:id` | 更新標記狀態 |

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

## AI 系統

後端整合了基於 Cloudflare AI Workers Inference 的完整 AI 問答與個人化系統。

### 模型配置

| 角色 | 模型 |
|------|------|
| LLM | `@cf/google/gemma-3-12b-it` |
| 向量嵌入 | `@cf/baai/bge-m3`（1024 維，多語言） |

### 功能架構

| 服務 | 檔案 | 說明 |
|------|------|------|
| `QueryService` | `src/services/query.ts` | Pipeline 入口、NLP 過濾方法、SSE 串流輸出 |
| `PipelineEngine` | `src/services/pipeline/engine.ts` | 模組化 RAG Pipeline 引擎（14 步動態組裝） |
| `Pipeline Steps` | `src/services/pipeline/steps/` | 14 個可獨立開關/排序的 Pipeline Step |
| `TextToSqlService` | `src/services/text-to-sql.ts` | Text-to-SQL 結構化查詢 |
| `EmbeddingService` | `src/services/embedding.ts` | 向量嵌入生成與語義搜尋 |
| `IndexingService` | `src/services/indexing.ts` | 路線/岩場資料向量索引建立 |
| `RankService` | `src/services/rank.ts` | Climber Rank 等級計算、配額管理、Token 追蹤 |
| `RecommendationService` | `src/services/recommendation.ts` | 個人化路線推薦（完攀後自動觸發） |
| `PersonalizationService` | `src/services/personalization.ts` | 攀登能力估算、個人化 System Prompt |
| `MemoryExtractor` | `src/services/memory-extractor.ts` | 從對話中萃取用戶偏好（攀岩等級、偏好地區等） |
| `Guardrails` | `src/utils/guardrails.ts` | 輸入/輸出安全防護（Prompt Injection、PII 過濾） |
| 管理後台 | `/api/v1/admin/ai` | 查詢日誌、KPI 儀表板、成本追蹤、Prompt 管理、Pipeline 設定 |

### 模組化 Pipeline 架構

RAG 問答流程採用模組化 Pipeline 設計，14 個 Step 分布在 5 個 Phase 中動態組裝：

| Phase | Steps | 說明 |
|-------|-------|------|
| **pre-retrieval** | semantic-cache, tool-selection, text-to-sql, hyde, multi-query, filter-build | 查詢前處理：快取、分類、擴展 |
| **retrieval** | embedding, hybrid-search | 檢索：向量 + BM25 + RRF + Agentic |
| **post-retrieval** | cross-encoder, mmr, popularity-rerank | 精排：重排、多樣性、熱門度 |
| **generation** | llm-generation | 生成：LLM 回答（含 GK/SQL earlyReturn）|
| **evaluation** | judge, self-reflection | 評估：品質評分、重生成、loopBack |

每個 Step 可透過 Admin UI 獨立開關/排序，宣告 `requires`/`provides`/`skipWhen` 供 Engine 自動管理執行邏輯。

### 流程圖

#### RAG 問答流程（模組化 Pipeline 架構）

```
POST /api/v1/ai/ask
        │
        ▼
  ┌─────────────┐
  │  配額檢查   │  daily_ai_used >= limit OR daily_token_used >= limit → 429
  └──────┬──────┘
         │ 通過
         ▼
  ┌─────────────┐
  │ Input Guard │  有害查詢 → 400 blocked
  └──────┬──────┘
         │ 通過
         ▼
  ┌──────────────────┐
  │  KV 精確快取     │  hash key 命中 → 直接回傳
  └──────┬───────────┘
         │ 未命中
         ▼
  ╔══════════════════════════════════════════════════╗
  ║            PipelineEngine（14 步動態組裝）         ║
  ║                                                    ║
  ║  Pre-retrieval:                                    ║
  ║    ① Semantic Cache → ② Tool Selection             ║
  ║    → ③ Text-to-SQL → ④ HyDE → ⑤ Multi-Query      ║
  ║    → ⑥ Filter Build                               ║
  ║                                                    ║
  ║  Retrieval:                                        ║
  ║    ⑦ Embedding → ⑧ Hybrid Search (+ Agentic)      ║
  ║                                                    ║
  ║  Post-retrieval:                                   ║
  ║    ⑨ Cross-encoder → ⑩ MMR → ⑪ Popularity Rerank  ║
  ║                                                    ║
  ║  Generation:                                       ║
  ║    ⑫ LLM Generation                               ║
  ║                                                    ║
  ║  Evaluation:                                       ║
  ║    ⑬ Judge → ⑭ Self-Reflection (+ loopBack)       ║
  ╚══════════════════════════════════════════════════╝
         │
    stream=true？
    ┌────┴────┐
   是         否
    │         │
    ▼         ▼
  SSE 逐字   JSON 回應
  推送 token  含配額資訊
    │
  客戶端斷線？→ 退還配額

查詢路徑分流（Tool Selection 決定）：
  general-knowledge → GK earlyReturn（跳過向量搜尋）
  sql               → SQL earlyReturn（Text-to-SQL 直查）
  simple            → 輕量搜尋（跳過 HyDE/Multi-Query）
  hybrid            → SQL 撈候選 + 向量 rerank
  complex           → 完整 pipeline（HyDE + Multi-Query + Judge）
  clarification     → 追問確認 earlyReturn
```

#### SSE 串流事件格式

```
data: {"type":"token","token":"<text>"}        ← 逐字推送
data: {"type":"done","query_id":"...","sources":[...],"quota_remaining":N}
data: {"type":"error","message":"<human-readable>"}
```

#### AI 路線推薦流程

```
POST /api/v1/ascents（完攀紀錄）
        │
        ├─── 正常回應（不等待推薦）
        │
        └─── ctx.waitUntil()  ← 非同步、不佔配額
                  │
                  ▼
           每日系統觸發 ≥ 3 次？→ 略過
                  │ < 3 次
                  ▼
           取近期攀登紀錄作為 context
                  │
                  ▼
           LLM 生成個人化路線推薦
                  │
                  ▼
           寫入 user_recommendations
           status: 'done' | 'failed'
```

#### 等級配額系統

```
任何 AI 請求
      │
      ▼
 原子 UPDATE：
 SET daily_ai_used = daily_ai_used + 1
 WHERE user_id = ? AND daily_ai_used < daily_ai_limit
      │
 影響 1 行？
 ┌────┴────┐
是         否
 │         │
 ▼         ▼
繼續處理  429 quota_exceeded
      │
      ▼
 回應附帶 quota_remaining
      │
 串流中途斷線？→ daily_ai_used - 1
```

### 等級系統（Climber Rank）

依用戶個人檔案完整度與攀岩紀錄計算積分，對應等級與 AI 配額：

| 等級 | 積分門檻 | daily_ai_limit | daily_token_limit |
|------|---------|---------------|-------------------|
| 麓（foothill） | 0 | 2 次 | 5,000 |
| 壁（wall） | 20 | 6 次 | 15,000 |
| 稜（ridge） | 70 | 12 次 | 30,000 |
| 巔（summit） | 100 | 24 次 | 60,000 |

支援 `rank_override_id`：管理員可手動覆寫用戶等級，跳過自動計算。

### 資料庫表格

```sql
-- AI 查詢日誌（含 token 追蹤、品質指標、pipeline trace）
ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count,
  groundedness_score, auto_score, feedback_score, query_type, model_used,
  embedding_ms, retrieval_ms, generation_ms, self_reflection_triggered,
  is_high_consumption, cache_hit, hyde_triggered, pipeline_trace, ...)

-- AI 文件索引（路線/岩場向量化文件）
ai_documents (id, content_type, content_id, text, metadata, ...)

-- AI Prompt 模板（支援版本控制與狀態：draft/production）
ai_prompts (id, name, version, content, status, ...)

-- AI 設定（Key-Value，50+ 可調參數）
ai_config (key, value, updated_at)

-- AI 品質標記（低品質回答人工審視）
ai_flagged_responses (id, query_log_id, groundedness_score, ...)

-- 用戶 AI 記憶（從對話萃取的偏好）
user_ai_memory (id, user_id, memory_key, memory_value, memory_type, ...)

-- 用戶路線推薦
user_recommendations (id, user_id, recommendation, context_ascents, status, ...)

-- 對話歷史
chat_sessions (id, user_id, created_at, updated_at)
chat_messages (id, session_id, role, content, suggested_questions, query_id, ...)

-- Climber Rank 等級與配額
user_ranks (user_id, score, rank_id, daily_ai_used, daily_ai_limit,
  daily_token_used, daily_token_limit, rank_override_id, last_reset_date, ...)
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `JWT_SECRET` | JWT 簽名密鑰 |
| `CORS_ORIGIN` | 允許的 CORS 來源 |

## 授權

MIT
