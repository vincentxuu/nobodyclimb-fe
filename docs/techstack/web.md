# Web 技術棧

## 核心框架

| 技術 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 15.5.x | React 全端框架，App Router |
| **React** | 19.1.x | UI 函式庫 |
| **TypeScript** | 5.9.x | 型別安全 |

## 樣式與 UI

| 技術 | 版本 | 用途 |
|------|------|------|
| **TailwindCSS** | 3.4.x | Utility-first CSS |
| **Tailwind Animate** | 1.0.x | TailwindCSS 動畫擴展 |
| **Radix UI** | 各元件獨立版本 | Headless UI 元件 |
| **Lucide React** | 0.542.x | 圖示庫 |
| **Framer Motion** | 12.23.x | 進階動畫 |
| **class-variance-authority** | 0.7.x | 元件變體管理 |
| **clsx** | 2.1.x | 條件式 className |
| **tailwind-merge** | 2.6.x | TailwindCSS class 合併 |

### Radix UI 元件清單

- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`

## 狀態管理

| 技術 | 版本 | 用途 |
|------|------|------|
| **Zustand** | 4.5.x | 全域客戶端狀態 |
| **TanStack Query** | 5.85.x | 伺服器狀態管理與快取 |

### Zustand Stores

```
web/src/store/
├── authStore.ts      # 認證狀態
├── contentStore.ts   # 內容狀態
└── uiStore.ts        # UI 狀態
```

## 表單處理

| 技術 | 版本 | 用途 |
|------|------|------|
| **React Hook Form** | 7.62.x | 表單狀態管理 |
| **Zod** | 3.25.x | Schema 驗證 (來自 @nobodyclimb/schemas) |
| **@hookform/resolvers** | 3.10.x | Zod 與 RHF 整合 |

## API 通訊

| 技術 | 版本 | 用途 |
|------|------|------|
| **Axios** | 1.11.x | HTTP 客戶端 |
| **js-cookie** | 3.0.x | Cookie 管理 (JWT Token) |

### API Client 初始化

```typescript
// web/src/lib/api.ts
import { createWebApiClient } from '@nobodyclimb/api-client/web';

export const api = createWebApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'https://api.nobodyclimb.cc/api/v1'
);
```

## 認證

| 技術 | 版本 | 用途 |
|------|------|------|
| **@react-oauth/google** | 0.13.x | Google OAuth 登入 |
| **js-cookie** | 3.0.x | Token 儲存 |

## 工具函式庫

| 技術 | 版本 | 用途 |
|------|------|------|
| **date-fns** | 2.30.x | 日期處理 |
| **dompurify** | 3.3.x | HTML 清理 (XSS 防護) |
| **browser-image-compression** | 2.0.x | 圖片壓縮 |
| **react-image-crop** | 11.0.x | 圖片裁切 |
| **react-quill-new** | 3.7.x | Rich Text Editor |

## 拖放功能

| 技術 | 版本 | 用途 |
|------|------|------|
| **@dnd-kit/core** | 6.3.x | 拖放核心 |
| **@dnd-kit/sortable** | 10.0.x | 可排序列表 |
| **@dnd-kit/utilities** | 3.2.x | 工具函式 |

## 測試

| 技術 | 版本 | 用途 |
|------|------|------|
| **Jest** | 29.7.x | 測試框架 |
| **@testing-library/react** | 16.3.x | React 測試工具 |
| **@testing-library/jest-dom** | 6.7.x | DOM 斷言 |
| **jest-environment-jsdom** | 30.2.x | JSDOM 環境 |

## 開發工具

| 技術 | 版本 | 用途 |
|------|------|------|
| **ESLint** | 8.57.x | 程式碼檢查 |
| **eslint-config-next** | 15.5.x | Next.js ESLint 配置 |
| **eslint-config-prettier** | 10.1.x | Prettier 整合 |
| **Prettier** | 3.6.x | 程式碼格式化 |
| **prettier-plugin-tailwindcss** | 0.6.x | TailwindCSS class 排序 |

## 部署

| 技術 | 版本 | 用途 |
|------|------|------|
| **@opennextjs/cloudflare** | 1.6.5 | Cloudflare Workers 適配器 |
| **Wrangler** | 4.30.x | Cloudflare CLI |

## 專案結構

```
web/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── api/                # API routes
│   │   ├── auth/               # 認證頁面
│   │   ├── biography/          # 攀岩者傳記
│   │   ├── blog/               # 部落格
│   │   ├── crag/               # 戶外岩場
│   │   ├── gym/                # 室內岩館
│   │   ├── gallery/            # 相簿
│   │   ├── profile/            # 使用者個人檔案
│   │   ├── search/             # 搜尋
│   │   └── videos/             # YouTube 影片瀏覽
│   ├── components/             # React 元件
│   │   ├── shared/             # 共用元件
│   │   └── ui/                 # 基礎 UI 元件 (Radix UI 封裝)
│   ├── lib/
│   │   ├── api.ts              # API 客戶端初始化
│   │   ├── constants/          # Web 專用常數
│   │   ├── hooks/              # Web 專用 hooks
│   │   └── utils/              # Web 專用工具
│   ├── store/                  # Zustand stores
│   └── styles/                 # 全域樣式
├── public/                     # 靜態資源
├── __tests__/                  # 測試
├── package.json
├── wrangler.toml               # Cloudflare Workers 設定
└── next.config.js
```

## 使用共用套件

```typescript
// 使用共用型別
import type { User, Biography } from '@nobodyclimb/types';

// 使用共用 schemas
import { loginSchema, registerSchema } from '@nobodyclimb/schemas';

// 使用共用 hooks
import { createUseAuth } from '@nobodyclimb/hooks';

// 使用共用工具
import { formatDate, formatRelativeTime } from '@nobodyclimb/utils';
```

## 常用指令

```bash
cd web

pnpm dev                 # 啟動開發伺服器 (localhost:3000)
pnpm build              # 建置生產版本
pnpm build:cf           # 建置 Cloudflare Workers 版本
pnpm lint               # 執行 ESLint
pnpm test               # 執行測試
pnpm format             # 格式化程式碼
pnpm format:check       # 檢查程式碼格式
```

## 部署環境

| 環境 | Worker 名稱 | Domain |
|------|-------------|--------|
| **Production** | nobodyclimb-fe-production | nobodyclimb.cc |
| **Preview** | nobodyclimb-fe-preview | preview.nobodyclimb.cc |
