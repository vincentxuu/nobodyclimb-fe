# NobodyClimb - 攀岩社群平台

專為攀岩愛好者打造的社群平台，採用 **pnpm workspaces + Turborepo** monorepo 架構，前後端均部署於 Cloudflare Workers。

- **網站**: [nobodyclimb.cc](https://nobodyclimb.cc)
- **API 文檔**: [api.nobodyclimb.cc/api/v1/docs](https://api.nobodyclimb.cc/api/v1/docs)

## 系統架構

| 層級 | 技術 | 說明 |
|------|------|------|
| Web 前端 | Next.js 15 + React 19 | `apps/web/`，部署於 Cloudflare Workers |
| 行動應用 | React Native 0.81 + Expo 54 + Tamagui | `apps/mobile/` |
| 後端 API | Hono 4.6 + Cloudflare Workers | `backend/`，D1 / R2 / KV |
| 共用套件 | TypeScript packages | `packages/`，types / schemas / utils / hooks |

## 技術棧

### 前端 (`apps/web`)

- Next.js 15.5 (App Router)、React 19、TypeScript 5.9
- TailwindCSS 3.4、Radix UI、Framer Motion 12.23
- Zustand 4.5（全域狀態）、TanStack Query 5.85（伺服器狀態）
- React Hook Form 7.62 + Zod 3.25（表單驗證）
- Axios（JWT 自動注入）、js-cookie、dnd-kit、React Quill
- Jest 29.7 + React Testing Library 16.3
- 部署：OpenNext.js 1.6.5 + Wrangler

### 後端 (`backend`)

- Hono 4.6、Cloudflare D1 (SQLite)、R2、KV
- OpenAPI 3.1（hono-openapi 自動生成）+ Scalar API Reference UI
- Zod + zod-openapi 驗證、JWT (jose) 認證
- Cloudflare AI Workers Inference（LLM + Embedding）

## 主要功能

- **用戶認證**: 註冊、登入、Google OAuth、多步驟設定
- **等級系統**: 麓 / 壁 / 稜 / 巔，依個人檔案完整度與攀岩紀錄積分計算
- **個人檔案**: 攀岩經驗、身體數據、文章管理、書籤收藏
- **人物誌**: 核心故事、一句話、小故事，含追蹤、按讚、留言、快速反應
- **攀登紀錄**: 完攀日期、難度評分、路線追蹤
- **路線故事**: 分享、按讚、留言、標記有幫助
- **人生清單**: 攀岩目標（依分類、地點）、完成追蹤
- **岩場 / 攀岩館**: 詳情、路線、天氣、地圖
- **相片集**: 瀏覽、上傳、裁切
- **影片瀏覽**: 14+ 個 YouTube 頻道、11 種分類、篩選播放
- **通知系統**: 按讚 / 留言 / 追蹤通知，管理員廣播
- **搜尋**: 全站搜尋、語義搜尋、進階篩選
- **AI 問答**: RAG 自然語言問答（SSE 串流）、每日配額（依等級）、Adaptive RAG
- **AI Chat Widget**: 浮動對話視窗、歷史記錄、隨機建議問題
- **AI 路線推薦**: 完攀後自動觸發個人化推薦

## 專案結構

```text
nobodyclimb/
├── apps/
│   ├── web/                    # Next.js Web 前端
│   │   ├── src/
│   │   │   ├── app/            # App Router 頁面
│   │   │   ├── components/     # React 元件（按領域分組）
│   │   │   ├── lib/            # API client、工具函式
│   │   │   └── store/          # Zustand stores
│   │   ├── public/data/        # 靜態影片資料 JSON
│   │   └── scripts/            # YouTube 資料處理腳本
│   └── mobile/                 # React Native 行動應用
├── backend/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/             # API 路由（含 OpenAPI 裝飾器）
│   │   ├── services/           # 業務邏輯（含 AI RAG）
│   │   ├── repositories/       # 資料存取層
│   │   └── db/schema.sql       # D1 資料庫 schema
│   └── migrations/             # D1 遷移腳本
├── packages/                   # 共用套件
│   ├── types/                  # TypeScript 型別
│   ├── schemas/                # Zod schemas
│   ├── constants/              # 共用常數
│   ├── hooks/                  # 共用 React Hooks
│   ├── utils/                  # 通用工具函式
│   └── api-client/             # API 客戶端
└── docs/                       # 技術文件
```

## 快速開始

### 前置需求

- Node.js 18+、pnpm

### 安裝與啟動

```bash
pnpm install
pnpm dev          # 啟動所有服務（Turborepo）
pnpm dev:web      # 僅前端 localhost:3000
pnpm dev:backend  # 僅後端 localhost:8787
```

API 文檔：`http://localhost:8787/api/v1/docs`

### 常用指令

```bash
pnpm build        # 建構所有套件
pnpm build:cf     # 建構前端 Cloudflare 版本
pnpm lint         # Lint 所有套件
pnpm test         # 執行測試
pnpm typecheck    # TypeScript 型別檢查
pnpm format       # Prettier 格式化
```

### 後端資料庫

```bash
cd backend
pnpm db:migrate         # 本地遷移
pnpm db:migrate:remote  # 遠端 D1 遷移
```

## 部署

### 前端

```bash
cd apps/web
pnpm build:cf
wrangler deploy --env production   # nobodyclimb.cc
wrangler deploy --env preview
wrangler tail --env production     # 查看日誌
```

### 後端

```bash
cd backend
wrangler secret put JWT_SECRET --env production  # 僅首次
pnpm db:migrate:remote
pnpm deploy:production
```

### 環境對照

| 層 | 生產 | 預覽 |
|----|------|------|
| 前端 Worker | `nobodyclimb-fe-production` | `nobodyclimb-fe-preview` |
| 後端 Worker | `nobodyclimb-api-production` | `nobodyclimb-api-preview` |
| D1 | `nobodyclimb-db` | `nobodyclimb-db-preview` |
| R2 | `nobodyclimb-storage` | `nobodyclimb-storage-preview` |

### CI/CD

GitHub Actions 自動部署：

- `deploy.yml`：前端，`main` → production（啟用 Analytics），其他分支 → preview
- `deploy-api.yml`：後端，偵測 `backend/` 變更自動部署，需要 `CLOUDFLARE_API_TOKEN` secret

## YouTube 影片腳本

所有腳本位於 `apps/web/scripts/`，需安裝 `brew install yt-dlp jq`。

### 頻道管理

```bash
./scripts/add-channel.sh                   # 互動式新增頻道
./scripts/add-channel.sh 'https://...' 30000  # 直接傳參
./scripts/update-videos.sh                 # 批次更新所有頻道
```

### 元數據更新

```bash
node scripts/update-video-metadata.js              # 更新缺少元數據的影片
node scripts/update-video-metadata.js --force --limit 50  # 強制重新抓取
node scripts/update-video-metadata.js --dry-run    # 只顯示統計
```

| 參數 | 說明 |
|------|------|
| `--force` | 強制重新抓取所有影片 |
| `--limit N` | 只抓取 N 個影片 |
| `--offset N` | 跳過前 N 個（分批用） |
| `--newest-first` | 優先更新最新影片 |
| `--regenerate` | 更新後重新生成 chunks |

### 路線影片工作流程

```bash
# 1. 搜尋路線相關影片
node scripts/search-route-videos.js longdong --limit=5

# 2. 在 Google Sheets 中審核，下載 CSV

# 3. 匯入
node scripts/import-route-videos.js output/route-videos-longdong.csv

# 4. 抓取元數據
node scripts/fetch-video-metadata.js --limit 100
```

可用岩場 ID：`longdong`、`defulan`、`guanziling`、`kenting`、`shoushan`

## 開發慣例

- TypeScript 嚴格型別；前端使用 `@/` 路徑別名
- 元件按領域分組：`components/<domain>/`
- 人物誌互動統一使用 `components/biography/display/ContentInteractionBar`
- AI 相關：LLM `@cf/google/gemma-3-12b-it`、嵌入 `@cf/baai/bge-m3`（1024 維）
- 所有程式碼、註解、文件使用繁體中文

## Analytics 環境變數

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | 總開關（`'true'` 啟用，CI 自動設定） |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host URL |
