# Backend 技術棧

## 核心框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Hono** | 4.6.x | 輕量級 Web 框架 |
| **TypeScript** | 5.x | 型別安全 |
| **Cloudflare Workers** | - | Serverless Runtime |

## 資料庫與儲存

| 技術 | 用途 | 說明 |
|------|------|------|
| **Cloudflare D1** | 主資料庫 | SQLite 相容，邊緣分佈式 |
| **Cloudflare R2** | 物件儲存 | S3 相容，用於圖片/檔案 |
| **Cloudflare KV** | 快取 | Key-Value 儲存 |

## 認證與安全

| 技術 | 版本 | 用途 |
|------|------|------|
| **jose** | 5.9.x | JWT 簽發與驗證 |
| **Zod** | 4.3.x | 請求驗證 |
| **@hono/zod-validator** | 0.7.x | Hono Zod 整合 |

## 工具函式庫

| 技術 | 版本 | 用途 |
|------|------|------|
| **cheerio** | 1.1.x | HTML 解析 (爬蟲/SEO) |

## 開發工具

| 技術 | 版本 | 用途 |
|------|------|------|
| **Wrangler** | 4.59.x | Cloudflare CLI |
| **@cloudflare/workers-types** | 4.x | TypeScript 型別 |

## 專案結構

```
backend/
├── src/
│   ├── index.ts            # 主入口點與路由
│   ├── types.ts            # TypeScript 型別定義
│   ├── db/                 # 資料庫 Schema
│   ├── middleware/         # 認證中介軟體
│   ├── routes/             # API 路由處理器
│   └── utils/              # 工具函式
├── migrations/             # D1 資料庫遷移
└── wrangler.toml           # Cloudflare Workers 配置
```

## API 路由結構

```
/api/v1
├── /auth                   # 認證相關
│   ├── POST /login         # 登入
│   ├── POST /register      # 註冊
│   ├── POST /google        # Google OAuth
│   └── POST /refresh       # Token 刷新
├── /users                  # 使用者管理
├── /biography              # 攀岩者傳記
├── /crag                   # 戶外岩場
├── /gym                    # 室內岩館
├── /blog                   # 部落格
├── /stats                  # 統計數據
└── /health                 # 健康檢查
```

## 環境配置

### Cloudflare Bindings

```toml
# wrangler.toml
[vars]
ENVIRONMENT = "production"

[[d1_databases]]
binding = "DB"
database_name = "nobodyclimb-db"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "nobodyclimb-storage"

[[kv_namespaces]]
binding = "CACHE"
```

### 環境變數 (Secrets)

| 變數名稱 | 說明 |
|----------|------|
| `JWT_SECRET` | JWT 簽名密鑰 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `CWA_API_KEY` | 中央氣象署 API Key |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳戶 ID |

## 部署環境

| 環境 | Worker 名稱 | Domain | D1 Database |
|------|-------------|--------|-------------|
| **Production** | nobodyclimb-api-production | api.nobodyclimb.cc | nobodyclimb-db |
| **Preview** | nobodyclimb-api-preview | api-preview.nobodyclimb.cc | nobodyclimb-db-preview |

## 常用指令

```bash
cd backend

pnpm dev                           # 啟動本地開發伺服器
pnpm deploy:preview                # 部署到 Preview 環境
pnpm deploy:production             # 部署到 Production 環境

# 資料庫操作
pnpm db:migrate                    # 執行本地遷移
pnpm db:migrate:remote             # 執行遠端遷移
```

## 資料庫遷移

遷移檔案位於 `backend/migrations/` 目錄，使用 Wrangler D1 migrations 管理。

```bash
# 建立新遷移
wrangler d1 migrations create nobodyclimb-db <migration_name>

# 套用遷移
wrangler d1 migrations apply nobodyclimb-db --remote --env production
```

## 效能最佳化

1. **Edge Computing**: 全球 300+ 邊緣節點，低延遲
2. **D1 Read Replicas**: 讀取自動複製到最近節點
3. **KV Cache**: 熱門資料快取
4. **R2 CDN**: 靜態資源 CDN 分發
