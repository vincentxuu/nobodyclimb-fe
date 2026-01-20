# NobodyClimb - 攀岩社群平台

NobodyClimb 是一個完整的攀岩社群平台，包含前端與後端系統，均部署於 Cloudflare Workers。

## 專案概述

NobodyClimb 是一個專為攀岩愛好者打造的平台，提供攀岩場地資訊、攀岩路線、個人檔案、部落格、相片集、YouTube 影片瀏覽等功能，幫助攀岩愛好者分享經驗、尋找攀岩場地、交流技巧。

### 系統架構

- **前端**: Next.js 15 + React 19 應用程式，部署於 Cloudflare Workers
- **後端**: Hono 框架 API，部署於 Cloudflare Workers，使用 D1 資料庫

## 技術棧

### 前端

- **框架**: Next.js 15.5 (App Router) + React 19
- **語言**: TypeScript 5.9
- **樣式**: TailwindCSS 3.4 + Tailwind Animate
- **狀態管理**: Zustand 4.5 (全域)、TanStack Query 5.85 (伺服器狀態)
- **表單處理**: React Hook Form 7.62 + Zod 3.25
- **UI元件**: Radix UI primitives + 自定義元件
- **HTTP客戶端**: Axios 1.11
- **動畫**: Framer Motion 12.23
- **主題管理**: Next Themes 0.4
- **拖曳功能**: dnd-kit (core + sortable)
- **富文本編輯**: React Quill New 3.7
- **圖片處理**: browser-image-compression + react-image-crop
- **工具函式**: Class Variance Authority + clsx + Tailwind Merge
- **日期處理**: date-fns 2.30
- **Cookie 處理**: js-cookie 3.0
- **圖標**: Lucide React 0.542
- **安全性**: isomorphic-dompurify (XSS 防護)
- **OAuth**: @react-oauth/google
- **測試**: Jest 29.7 + React Testing Library 16.3
- **程式碼格式化**: Prettier 3.6 + ESLint 8.57
- **部署**: Cloudflare Workers (OpenNext.js 適配器 1.6.5)

### 後端

- **運行環境**: Cloudflare Workers
- **框架**: Hono (輕量級 Web 框架)
- **資料庫**: Cloudflare D1 (SQLite)
- **儲存**: Cloudflare R2 (檔案儲存)
- **快取**: Cloudflare KV
- **認證**: JWT (jose 函式庫)
- **部署工具**: Wrangler CLI

## 專案結構

```
nobodyclimb-fe/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── api/                # API 路由
│   │   ├── about/              # 關於頁面
│   │   ├── auth/               # 認證相關頁面（登入、註冊、個人資料設定）
│   │   ├── biography/          # 人物誌頁面
│   │   ├── blog/               # 部落格頁面
│   │   ├── bucket-list/        # 願望清單頁面
│   │   ├── crag/               # 岩場資訊頁面
│   │   ├── gallery/            # 相片集頁面
│   │   ├── games/              # 遊戲頁面（繩索系統測驗）
│   │   ├── gym/                # 攀岩館頁面
│   │   ├── profile/            # 個人檔案頁面
│   │   ├── search/             # 搜尋頁面
│   │   ├── upload/             # 上傳頁面
│   │   ├── videos/             # 影片瀏覽頁面
│   │   ├── layout.tsx          # 全站布局
│   │   └── page.tsx            # 首頁
│   ├── components/             # React 元件
│   │   ├── biography/          # 人物誌相關元件
│   │   ├── blog/               # 部落格相關元件
│   │   ├── bucket-list/        # 願望清單相關元件
│   │   ├── crag/               # 岩場相關元件
│   │   ├── editor/             # 編輯器元件
│   │   ├── gallery/            # 相片集相關元件
│   │   ├── games/              # 遊戲相關元件
│   │   ├── home/               # 首頁相關元件
│   │   ├── layout/             # 布局相關元件
│   │   ├── profile/            # 個人檔案相關元件
│   │   ├── search/             # 搜尋相關元件
│   │   ├── shared/             # 共用元件
│   │   ├── ui/                 # UI基礎元件（Radix UI）
│   │   └── videos/             # 影片相關元件
│   ├── data/                   # 靜態資料
│   ├── lib/                    # 工具函式庫
│   │   ├── api/                # API 客戶端
│   │   ├── constants/          # 常數定義
│   │   ├── hooks/              # 自定義 React Hooks
│   │   ├── types/              # TypeScript 型別定義
│   │   └── utils/              # 通用工具函式
│   ├── mocks/                  # 模擬資料
│   ├── store/                  # Zustand 狀態管理
│   │   ├── authStore.ts        # 認證狀態
│   │   ├── contentStore.ts     # 內容狀態
│   │   └── uiStore.ts          # UI 狀態
│   └── styles/                 # 全域樣式
├── docs/                       # 專案文件
│   ├── backend/                # 後端開發文件
│   ├── bio/                    # 人物誌設計文件
│   ├── blog/                   # 部落格內容文件
│   ├── cloudflare-deployment/  # Cloudflare 部署文件
│   ├── crag-redesign/          # 岩場重設計文件
│   ├── games/                  # 遊戲功能文件
│   ├── nav-profile/            # 導覽列設計文件
│   ├── prd/                    # 產品需求文件
│   ├── route-data/             # 路線資料文件
│   ├── route-data-refactor/    # 路線資料重構文件
│   └── yt-data/                # YouTube 資料收集文件
├── public/                     # 靜態資源
│   ├── data/                   # JSON 資料檔
│   ├── icon/                   # 圖標資源
│   ├── images/                 # 圖片資源
│   ├── logo/                   # 品牌標誌
│   └── photo/                  # 相片資源
├── backend/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts            # 主要進入點和路由
│   │   ├── types.ts            # TypeScript 型別
│   │   ├── db/                 # 資料庫結構定義
│   │   ├── middleware/         # 認證中介軟體
│   │   ├── routes/             # API 路由處理器
│   │   └── utils/              # 工具函式
│   ├── migrations/             # D1 資料庫遷移
│   └── wrangler.toml           # Cloudflare Workers 配置
├── scripts/                    # 工具腳本
│   ├── channels.json           # YouTube 頻道配置
│   ├── add-channel.sh          # 新增 YouTube 頻道（互動式）
│   ├── update-videos.sh        # 批次更新所有頻道影片
│   ├── collect-youtube-data.sh # 收集單一頻道影片資料
│   ├── convert-youtube-videos.js   # 影片資料轉換
│   ├── merge-video-sources.js      # 影片來源合併
│   ├── generate-video-chunks.js    # 影片分塊產生
│   ├── generate-stats.js           # 統計資料產生
│   ├── convert-longdong-csv.js     # 龍洞 CSV 轉換
│   ├── excel-to-routes.js          # Excel 轉路線資料
│   ├── routes-to-excel.js          # 路線資料轉 Excel
│   ├── populate-biography.js       # 人物誌資料填充
│   ├── populate-bucket-list.js     # 願望清單資料填充
│   ├── upload-gallery-images.sh    # 相片集圖片上傳
│   └── verify-deployment.sh        # 部署驗證
├── cloudflare-env.d.ts         # Cloudflare 環境型別
├── next.config.js              # Next.js 配置
├── open-next.config.ts         # OpenNext Cloudflare 配置
├── tailwind.config.js          # TailwindCSS 配置
├── wrangler.json               # 前端 Cloudflare Wrangler 配置
└── package.json                # 專案依賴
```

## 主要功能

### 核心功能

- **用戶認證**: 註冊、登入、Google OAuth、多步驟個人資料設定
- **個人檔案**: 用戶資料、攀岩經驗、個人設定、文章管理、書籤收藏
- **部落格系統**: 文章創建、編輯、瀏覽功能、富文本編輯器
- **岩場資訊**: 岩場詳情、路線資訊、地圖顯示、天氣狀況、社群媒體整合
- **攀岩館**: 攀岩館資訊、設施介紹、詳細頁面
- **相片集**: 攀岩相片瀏覽、彈出視窗展示、圖片上傳與裁切
- **人物誌**: 攀岩人物故事、個人檔案展示、章節式內容
- **搜尋功能**: 全站搜尋、進階篩選
- **影片瀏覽**: YouTube 攀岩影片整合、多頻道支援、篩選、播放功能
- **願望清單**: 攀岩目標追蹤、拖曳排序
- **遊戲系統**: 繩索系統測驗、攀岩知識學習

### 技術特色

- **響應式設計**: 支援桌面和行動裝置
- **主題切換**: 明暗模式支援
- **國際化**: 多語言切換功能
- **動畫效果**: Framer Motion 流暢的頁面轉場和互動動畫
- **圖片優化**: Next.js 圖片優化，支援多種尺寸和格式
- **圖片處理**: 瀏覽器端圖片壓縮與裁切
- **拖曳排序**: dnd-kit 實現拖曳功能
- **富文本編輯**: React Quill 編輯器
- **YouTube 支援**: 優化的 YouTube 縮圖和影片嵌入
- **程式碼品質**: ESLint + Prettier 自動格式化
- **型別安全**: 完整的 TypeScript 支援
- **測試覆蓋**: Jest + React Testing Library
- **現代化架構**: 使用 React 19 和 Next.js 15 最新特性
- **XSS 防護**: DOMPurify 內容清理

### YouTube 影片功能

- 支援 14+ 個攀岩 YouTube 頻道的影片收集
- 自動化影片資料更新腳本
- 互動式新增頻道腳本
- 影片篩選和搜尋功能
- 嵌入式影片播放器

## 安裝與執行

### 前置需求

- Node.js 18+ (支援 React 19)
- pnpm (推薦) 或 npm

### 1. 複製專案

```bash
git clone [專案repository URL]
cd nobodyclimb-fe
```

### 2. 安裝依賴

```bash
pnpm install
# 或
npm install
```

### 3. 設定環境變數

在專案根目錄創建 `.env.local` 檔案（如需要）：

```env
# 環境變數配置（目前暫無外部 API 需求）
# NEXT_PUBLIC_CUSTOM_VAR=your_value
```

### 4. 啟動開發伺服器

```bash
pnpm dev
# 或
npm run dev
```

### 5. 訪問應用

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 指令說明

### 前端開發相關

- `pnpm dev` - 啟動開發伺服器 (localhost:3000)
- `pnpm build` - 建構生產版本
- `pnpm start` - 啟動生產伺服器
- `pnpm lint` - 執行 ESLint 程式碼檢查
- `pnpm test` - 執行 Jest 測試
- `pnpm format` - 使用 Prettier 格式化程式碼
- `pnpm format:check` - 檢查程式碼格式

### 前端 Cloudflare 部署

- `pnpm build:cf` - 建構 Cloudflare 版本
- `wrangler deploy --env production` - 部署到生產環境 (nobodyclimb.cc)
- `wrangler deploy --env preview` - 部署到預覽環境
- `wrangler tail --env production` - 查看生產環境日誌

### 後端開發相關

```bash
cd backend                      # 切換到後端目錄
pnpm dev                        # 啟動本地開發伺服器
pnpm db:migrate                 # 執行本地資料庫遷移
pnpm db:migrate:remote          # 執行遠端 D1 資料庫遷移
pnpm deploy:preview             # 部署到預覽環境
pnpm deploy:production          # 部署到生產環境
```

### YouTube 影片資料管理

#### 新增 YouTube 頻道

使用互動式腳本新增頻道到追蹤清單：

```bash
./scripts/add-channel.sh
```

腳本會提示輸入：
- **YouTube 頻道 URL**: 例如 `https://www.youtube.com/@EmilAbrahamsson`
- **精選閾值**: 觀看次數超過此數值的影片會被標記為精選（預設 20000）

也可以直接傳入參數：

```bash
./scripts/add-channel.sh 'https://www.youtube.com/@EmilAbrahamsson' 30000
```

頻道設定檔位於 `scripts/channels.json`。

#### 更新所有頻道影片

批次更新所有追蹤頻道的影片資料：

```bash
./scripts/update-videos.sh
```

此腳本會：
1. 讀取 `scripts/channels.json` 中的頻道清單
2. 使用 yt-dlp 收集各頻道的影片資料
3. 轉換並輸出到 `public/data/` 目錄

#### 其他腳本

- `./scripts/collect-youtube-data.sh` - 收集單一頻道影片資料
- `node scripts/convert-youtube-videos.js` - 轉換影片資料格式

#### 前置需求

執行腳本前需安裝：

```bash
brew install yt-dlp jq
```

## 部署說明

本專案前後端均部署於 Cloudflare Workers，配置了多個環境以支援不同的部署需求。

### 環境配置

#### 前端 (Frontend)

**生產環境 (Production)**

- **域名**: nobodyclimb.cc, <www.nobodyclimb.cc>
- **Worker 名稱**: nobodyclimb-fe-production
- **部署指令**: `wrangler deploy --env production`

**預覽環境 (Preview)**

- **Worker 名稱**: nobodyclimb-fe-preview
- **部署指令**: `wrangler deploy --env preview`

**KV 綁定**: `VIDEOS` (用於未來影片資料儲存)

#### 後端 (Backend)

**生產環境 (Production)**

- **域名**: api.nobodyclimb.cc
- **Worker 名稱**: nobodyclimb-api-production
- **D1 資料庫**: nobodyclimb-db
- **R2 儲存**: nobodyclimb-storage
- **部署指令**: `cd backend && pnpm deploy:production`

**預覽環境 (Preview)**

- **Worker 名稱**: nobodyclimb-api-preview
- **D1 資料庫**: nobodyclimb-db-preview
- **R2 儲存**: nobodyclimb-storage-preview
- **部署指令**: `cd backend && pnpm deploy:preview`

#### 開發環境 (Development)

- **前端**: `pnpm dev` (localhost:3000)
- **後端**: `cd backend && pnpm dev`

### 快速部署步驟

#### 前端部署

```bash
# 1. 安裝依賴
pnpm install

# 2. 登入 Cloudflare
wrangler login

# 3. 建構專案
pnpm build:cf

# 4. 部署到生產環境
wrangler deploy --env production

# 5. 查看日誌
wrangler tail --env production
```

#### 後端部署

```bash
# 1. 切換到後端目錄
cd backend

# 2. 安裝依賴
pnpm install

# 3. 設定 JWT Secret (僅首次)
wrangler secret put JWT_SECRET --env production

# 4. 執行資料庫遷移
pnpm db:migrate:remote

# 5. 部署到生產環境
pnpm deploy:production
```

### KV 存儲配置

專案配置了 Cloudflare KV 存儲，用於將來存儲動態數據：

#### 當前狀態

- **綁定名稱**: VIDEOS
- **KV 命名空間 ID**: 6562f1cc9373496da57aeb48987346f8
- **目前使用**: 暫時使用靜態 JSON 檔案 (`public/data/videos.json`)

#### KV 使用說明

**1. 在 Cloudflare Workers 環境中訪問 KV**

```typescript
// 在 API routes 中使用
export async function GET(request: Request) {
  const { VIDEOS } = process.env as unknown as CloudflareEnv;
  
  // 讀取數據
  const data = await VIDEOS.get('videos', { type: 'json' });
  
  // 寫入數據  
  await VIDEOS.put('videos', JSON.stringify(newData));
  
  return Response.json(data);
}
```

**2. 型別支援**

```typescript
// cloudflare-env.d.ts 中已定義
interface CloudflareEnv {
  VIDEOS: KVNamespace;
}
```

**3. Wrangler CLI 操作**

```bash
# 上傳數據到 KV
wrangler kv:key put --binding=VIDEOS "videos" --path="./public/data/videos.json"

# 讀取 KV 數據
wrangler kv:key get --binding=VIDEOS "videos"

# 列出所有 keys
wrangler kv:key list --binding=VIDEOS
```

### 詳細部署文件

更詳細的部署文件請參考 `docs/cloudflare-deployment/` 目錄：

- `deployment-steps.md` - 完整部署步驟
- `deployment-checklist.md` - 部署檢查清單
- `environment-setup.md` - 環境設定說明

## 開發指南

### 程式碼風格

- 使用 TypeScript 5.9 進行嚴格型別檢查
- 遵循 ESLint 8.57 和 Prettier 3.6 配置
- 使用 Tailwind CSS 3.4 進行樣式設計
- 採用 React 19 Hooks 和函數式元件
- 使用現代化的 Next.js 15 App Router 結構
- 所有程式碼和註解使用繁體中文

### 前端架構模式

#### 狀態管理

- **Zustand stores** (`src/store/`): 全域客戶端狀態 (auth, UI, content)
- **TanStack Query**: 伺服器狀態快取和資料獲取
- **React Hook Form + Zod**: 表單狀態和驗證

#### API 通信

- Axios 客戶端位於 `src/lib/api/client.ts`，包含:
  - 請求攔截器: 自動從 cookies 添加 JWT token
  - 回應攔截器: 處理 401 錯誤時自動刷新 token
- 基礎 URL: `https://api.nobodyclimb.cc/api/v1` (可透過 `NEXT_PUBLIC_API_URL` 配置)
- 認證 tokens 使用 `js-cookie` 儲存在 cookies 中

#### 元件組織

- 功能按領域分組 (例如: `components/crag/`, `components/profile/`)
- 共用元件在 `components/shared/`
- 基礎 UI 元件 (Radix UI 包裝) 在 `components/ui/`
- 使用 `@/` 路徑別名進行匯入 (例如: `import { Button } from '@/components/ui/button'`)

### 後端架構模式

- RESTful API，路由處理器在 `backend/src/routes/`
- JWT 認證中介軟體
- D1 資料庫，SQLite schema 在 `backend/src/db/schema.sql`
- Cloudflare 綁定: DB (D1), CACHE (KV), STORAGE (R2)

### TypeScript 路徑別名

- `@/*` 對應到 `src/*` (配置於 `tsconfig.json`)
- 後端從前端 TypeScript 配置中排除

### 圖片處理

- 使用 Next.js 15 優化圖片載入和快取
- 支援 YouTube 縮圖和多種圖片來源
- 啟用 AVIF 和 WebP 格式支援
- 配置多種裝置尺寸優化

## CI/CD

本專案使用 GitHub Actions 進行自動化部署：

- `.github/workflows/deploy.yml` - 前端部署工作流程
- `.github/workflows/deploy-api.yml` - 後端 API 部署工作流程
  - 監聽 `backend/` 目錄變更時觸發
  - 自動執行 D1 資料庫遷移
  - 需要 `CLOUDFLARE_API_TOKEN` secret

## 重要提示

- 前端使用 React 19 和 Next.js 15，需要 Node.js 18+
- 目前使用 `public/data/` 中的靜態 JSON 檔案存儲影片資料 (KV 整合規劃中)
- 後端需要 Cloudflare 帳號和正確的綁定設定
- JWT secret 必須透過 `wrangler secret put JWT_SECRET` 為後端配置
- 所有程式碼、註解和文件均使用繁體中文

## 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

---

## 聯絡資訊

- **網站**: [nobodyclimb.cc](https://nobodyclimb.cc)
- **API**: [api.nobodyclimb.cc](https://api.nobodyclimb.cc)
- **開發團隊**: NobodyClimb Team

## 專案特色

- 完整的前後端分離架構
- 全部部署於 Cloudflare Workers，享受全球 CDN 加速
- 使用 D1 資料庫和 R2 儲存，零冷啟動時間
- React 19 + Next.js 15 最新技術棧
- 完整的認證系統和權限管理
- 響應式設計，支援各種裝置
- 繁體中文介面和內容

---

*本專案為 NobodyClimb 攀岩社群平台，致力於為攀岩愛好者提供最佳的線上體驗。*
