# NobodyClimb - 攀岩社群前端專案

這是 NobodyClimb 攀岩社群的前端專案，使用 Next.js 14 框架建構。

## 專案概述

NobodyClimb 是一個專為攀岩愛好者打造的平台，提供攀岩場地資訊、攀岩路線、個人檔案、部落格、相片集等功能，幫助攀岩愛好者分享經驗、尋找攀岩場地、交流技巧。

## 技術棧

- **框架**: Next.js 14 (React 18)
- **語言**: TypeScript
- **樣式**: TailwindCSS
- **狀態管理**: Zustand
- **表單處理**: React Hook Form + Zod
- **UI元件**: 自定義UI元件 + Radix UI
- **HTTP客戶端**: Axios
- **資料獲取**: TanStack Query
- **動畫**: Framer Motion
- **測試**: Jest + React Testing Library

## 專案結構

```
src/
├── app/                    # Next.js 應用頁面
│   ├── auth/               # 認證相關頁面
│   ├── biography/          # 人物誌頁面
│   ├── blog/               # 部落格頁面
│   ├── crag/               # 岩場資訊頁面
│   ├── gallery/            # 相片集頁面
│   ├── gym/                # 攀岩館頁面
│   ├── profile/            # 個人檔案頁面
│   ├── search/             # 搜尋頁面
│   ├── layout.tsx          # 全站布局
│   └── page.tsx            # 首頁
├── components/             # 元件
│   ├── biography/          # 人物誌相關元件
│   ├── blog/               # 部落格相關元件
│   ├── crag/               # 岩場相關元件
│   ├── gallery/            # 相片集相關元件
│   ├── gym/                # 攀岩館相關元件
│   ├── home/               # 首頁相關元件
│   ├── layout/             # 布局相關元件
│   ├── profile/            # 個人檔案相關元件
│   ├── search/             # 搜尋相關元件
│   ├── shared/             # 共用元件
│   └── ui/                 # UI基礎元件
├── data/                   # 靜態資料
├── lib/                    # 工具函式庫
│   ├── api/                # API相關
│   ├── constants/          # 常數
│   ├── hooks/              # 自定義Hooks
│   ├── types/              # TypeScript型別定義
│   └── utils/              # 通用工具函式
├── mocks/                  # 模擬資料
├── store/                  # Zustand狀態管理
│   ├── authStore.ts        # 認證狀態
│   ├── contentStore.ts     # 內容狀態
│   └── uiStore.ts          # UI狀態
└── styles/                 # 全域樣式
```

## 主要功能

- **用戶認證**: 註冊、登入、個人資料設定
- **個人檔案**: 用戶個人資料、攀岩經驗、設定
- **部落格**: 文章創建、編輯、瀏覽、評論
- **岩場資訊**: 查看岩場詳情、路線資訊、天氣狀況
- **攀岩館**: 攀岩館資訊、設施介紹
- **相片集**: 攀岩相片瀏覽與分享
- **人物誌**: 攀岩人物故事與介紹
- **搜尋功能**: 全站搜尋和篩選

## 安裝與執行

1. 複製專案
   ```bash
   git clone [專案repository URL]
   cd nobodyclimb-fe
   ```

2. 安裝依賴
   ```bash
   npm install
   ```

3. 設定環境變數
   在專案根目錄創建 `.env.local` 檔案，並設定必要的環境變數

4. 啟動開發伺服器
   ```bash
   npm run dev
   ```

5. 打開瀏覽器
   訪問 [http://localhost:3000](http://localhost:3000)

## 指令說明

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 建構生產版本
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行程式碼品質檢查
- `npm run test` - 執行測試