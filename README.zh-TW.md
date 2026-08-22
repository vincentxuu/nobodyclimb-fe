<div align="center">

# NobodyClimb

**為攀岩愛好者打造的社群平台。**

[![Deploy App](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-app.yml)
[![Deploy API](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml/badge.svg)](https://github.com/vincentxuu/nobodyclimb/actions/workflows/deploy-api.yml)
![Status](https://img.shields.io/badge/status-live-brightgreen.svg)

[網站](https://nobodyclimb.cc) · [API 文檔](https://api.nobodyclimb.cc/api/v1/docs) · [快速開始](#快速開始) · [部署](#部署) · [架構](#架構如何運作)

[English](README.md) · [繁體中文](README.zh-TW.md)

</div>

NobodyClimb 是一個攀岩社群平台，讓你記錄攀岩故事、追蹤完攀紀錄、探索路線資訊，並內建 AI 攀岩助手提供個人化建議。全站前後端均部署於 Cloudflare Workers，以 pnpm workspaces + Turborepo 管理 monorepo。

> [!IMPORTANT]
> 本專案為 monorepo，需要 Node.js 18+ 與 pnpm；後端依賴 Cloudflare D1 / R2 / KV 與 Workers AI。本地開發前請先設定環境變數（參考 `.env.local.example`）。

## 功能一覽

| 功能 | 說明 |
| --- | --- |
| 人物誌 | 核心故事、一句話、小故事，展現你的攀岩人生 |
| 攀登紀錄 | 完攀日期、難度評分、路線追蹤 |
| 人生清單 | 設定攀岩目標，追蹤完成進度 |
| 岩場 / 攀岩館 | 路線資訊、天氣、地圖 |
| 路線影片 | 14+ 個 YouTube 頻道、11 種分類篩選 |
| 多語系 | 繁體中文 / English / 日本語（next-intl） |
| 社群互動 | 追蹤、按讚、留言、快速反應、通知 |
| 等級系統 | 麓 / 壁 / 稜 / 巔，依貢獻解鎖更多功能 |
| 管理後台 | 用戶管理、岩場管理、廣播通知、Analytics 儀表板 |

## 技術架構

| 層級 | 技術 | 位置 |
| --- | --- | --- |
| Web 前端 | Next.js 15 + React 19 + TailwindCSS | `apps/web/` |
| 行動應用 | React Native + Expo 54 + Tamagui | `apps/mobile/` |
| 後端 API | Hono + Cloudflare Workers (D1 / R2 / KV) | `backend/` |
| AI 推論 | LangGraph + Multi-Provider (CF Workers AI / OpenAI / Anthropic / Google) | `backend/src/services/` |
| AI 觀測 | Langfuse (trace / span / generation tracking) | `backend/src/utils/` |
| 共用套件 | TypeScript (types / schemas / utils / hooks) | `packages/` |

## 快速開始

需求：Node.js 18+、pnpm、Git。

```bash
git clone https://github.com/vincentxuu/nobodyclimb.git
cd nobodyclimb
pnpm install
cp .env.local.example .env.local
pnpm dev          # 啟動所有服務
```

- Web 前端：`http://localhost:3000`
- 後端 API：`http://localhost:8787`

也可以只啟動單一服務：

```bash
pnpm dev:web      # 僅前端
pnpm dev:backend  # 僅後端
pnpm dev:mobile   # 僅行動應用
```

### 常用指令

```bash
pnpm build        # 建構所有套件
pnpm lint         # Biome 檢查
pnpm test         # 執行測試
pnpm typecheck    # TypeScript 型別檢查
pnpm format       # Biome 格式化
```

## AI 攀岩助手

平台內建 AI 助手，提供攀岩相關的智慧問答與推薦：

- **LangGraph 引擎** — 以狀態圖驅動 AI pipeline，支援 Baseline / Adaptive / Agentic / Plan-and-Execute 多策略
- **Multi-Provider** — 抽象層支援 Cloudflare Workers AI、OpenAI、Anthropic、Google 模型切換
- **Langfuse 觀測** — 全鏈路 trace / span / generation 追蹤，成本與延遲可視化
- **RAG 問答** — 結合向量搜尋與全文搜尋，針對岩場、路線、攀岩知識進行自然語言問答
- **Adaptive RAG** — 自動分類查詢類型，相關性不足時回退至全文搜尋補強
- **Agentic Multi-Step RAG** — 複雜問題觸發多輪搜尋（ReAct 模式），由 LLM 驅動搜尋決策
- **SSE 串流** — 逐字輸出回應，提升使用體驗
- **個人化** — 依攀登紀錄與用戶偏好調整回答內容，跨會話記憶
- **路線推薦** — 完攀後自動觸發個人化路線推薦
- **安全防護** — 輸入 / 輸出 Guardrails、Token Budget 管理
- **配額系統** — 依等級設定每日使用上限（次數 + Token 雙重限制）
- **管理儀表板** — AI 日誌查詢、Prompt 設定、知識庫管理、成本追蹤與用量統計、LangGraph 引擎切換

## 架構如何運作

```text
客戶端（Web / Mobile）
    |
    v
Cloudflare Workers edge        CDN、路由、驗證
    |
    v
Hono API（OpenAPI 文檔）
    |
    +-- routes/                API 路由
    +-- services/              業務邏輯與 LangGraph AI pipeline
    +-- repositories/          資料存取層
    `-- D1 / R2 / KV           資料庫、物件儲存、快取
```

## 專案結構

```
nobodyclimb/
├── apps/
│   ├── web/               # Next.js Web 前端
│   │   ├── src/app/       # App Router 頁面
│   │   ├── src/components # React 元件（按領域分組）
│   │   ├── src/lib/       # API client、工具函式
│   │   └── src/store/     # Zustand stores
│   └── mobile/            # React Native 行動應用 (Expo 54)
│       ├── app/           # Expo Router 頁面 (profile, crag, story)
│       └── src/components # RN 元件 (ui, crag, ascent, profile...)
├── backend/
│   ├── src/routes/        # API 路由（含 OpenAPI）
│   ├── src/services/      # 業務邏輯
│   ├── src/repositories/  # 資料存取層
│   └── migrations/        # D1 遷移腳本
├── packages/              # 共用套件 (types, schemas, utils, hooks, api-client)
└── docs/                  # 技術文件
```

## 部署

前後端皆透過 GitHub Actions 自動部署：

- `main` 分支 → 生產環境（`nobodyclimb.cc` / `api.nobodyclimb.cc`）
- 其他分支 → 預覽環境

手動部署：

```bash
# 前端
cd apps/web && pnpm build:cf && wrangler deploy --env production

# 後端（先執行資料庫遷移）
cd backend && pnpm db:migrate:remote && pnpm deploy:production
```

詳細步驟請參考 [部署指南](docs/DEPLOYMENT-GUIDE.md)。

## 開發慣例

- TypeScript 嚴格型別，前端使用 `@/` 路徑別名
- 元件按領域分組：`components/<domain>/`
- 多語系 UI（繁中 / 英文 / 日文），程式碼註解使用**繁體中文**
- AI pipeline 採用 LangGraph 狀態圖架構，搭配 Langfuse 全鏈路觀測
