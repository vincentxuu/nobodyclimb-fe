# NobodyClimb API

Cloudflare Workers 後端 API，使用 Hono 框架和 D1 資料庫。

## 技術棧

- **Runtime**: Cloudflare Workers
- **Framework**: [Hono](https://hono.dev/) - 輕量級 Web 框架
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (檔案存儲)
- **Cache**: Cloudflare KV
- **Auth**: JWT (jose)

## 專案結構

```
backend/
├── src/
│   ├── index.ts          # 主入口，路由配置
│   ├── types.ts          # TypeScript 類型定義
│   ├── db/
│   │   └── schema.sql    # D1 資料庫 schema
│   ├── middleware/
│   │   └── auth.ts       # JWT 認證中間件
│   ├── routes/
│   │   ├── auth.ts       # 認證路由
│   │   ├── crags.ts      # 岩場路由
│   │   ├── gyms.ts       # 攀岩館路由
│   │   ├── posts.ts      # 文章路由
│   │   ├── galleries.ts  # 相簿路由
│   │   ├── videos.ts     # 影片路由
│   │   └── search.ts     # 搜尋路由
│   └── utils/
│       └── id.ts         # 工具函數
├── wrangler.toml         # Cloudflare 配置
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

## 部署

```bash
# 預覽環境
pnpm deploy:preview

# 正式環境
pnpm deploy:production
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `JWT_SECRET` | JWT 簽名密鑰 |
| `CORS_ORIGIN` | 允許的 CORS 來源 |

## 授權

MIT
