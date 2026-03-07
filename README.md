# NobodyClimb - 攀岩社群平台

專為攀岩愛好者打造的社群平台，記錄你的攀岩故事、追蹤完攀紀錄、探索路線資訊。

- **網站**: [nobodyclimb.cc](https://nobodyclimb.cc)
- **API 文檔**: [api.nobodyclimb.cc/api/v1/docs](https://api.nobodyclimb.cc/api/v1/docs)

## 技術架構

| 層級 | 技術 | 位置 |
|------|------|------|
| Web 前端 | Next.js 15 + React 19 + TailwindCSS | `apps/web/` |
| 行動應用 | React Native + Expo 54 + Tamagui | `apps/mobile/` |
| 後端 API | Hono + Cloudflare Workers (D1 / R2 / KV) | `backend/` |
| AI 推論 | Cloudflare Workers AI (LLM + Embedding) | `backend/src/services/` |
| 共用套件 | TypeScript (types / schemas / utils / hooks) | `packages/` |

前後端均部署於 **Cloudflare Workers**，使用 **pnpm workspaces + Turborepo** 管理 monorepo。

## 主要功能

- **人物誌** — 核心故事、一句話、小故事，展現你的攀岩人生
- **攀登紀錄** — 完攀日期、難度評分、路線追蹤
- **人生清單** — 設定攀岩目標，追蹤完成進度
- **岩場 / 攀岩館** — 路線資訊、天氣、地圖
- **路線影片** — 14+ 個 YouTube 頻道、11 種分類篩選
- **AI 問答** — RAG 自然語言問答，串流逐字輸出，個人化攀岩建議
- **等級系統** — 麓 / 壁 / 稜 / 巔，依貢獻解鎖更多功能
- **社群互動** — 追蹤、按讚、留言、快速反應、通知
- **管理後台** — 用戶管理、岩場 / 攀岩館管理、廣播通知、Analytics 儀表板、AI 管理（日誌、Prompt 設定、知識庫、成本追蹤）

## AI 功能

平台內建 AI 攀岩助手，基於 Cloudflare Workers AI 推論，提供攀岩相關的智慧問答與推薦：

- **RAG 問答** — 結合向量搜尋與全文搜尋，針對岩場、路線、攀岩知識進行自然語言問答
- **Adaptive RAG** — 自動分類查詢類型，相關性不足時回退至全文搜尋補強
- **Agentic Multi-Step RAG** — 複雜問題觸發多輪搜尋（ReAct 模式），由 LLM 驅動搜尋決策
- **SSE 串流** — 逐字輸出回應，提升使用體驗
- **個人化** — 依攀登紀錄與用戶偏好調整回答內容，跨會話記憶
- **路線推薦** — 完攀後自動觸發個人化路線推薦
- **安全防護** — 輸入 / 輸出 Guardrails、Token Budget 管理
- **配額系統** — 依等級設定每日使用上限（次數 + Token 雙重限制）
- **管理儀表板** — AI 日誌查詢、Prompt 設定、知識庫管理、成本追蹤與用量統計

## 快速開始

```bash
# 前置需求：Node.js 18+、pnpm
pnpm install
pnpm dev          # 啟動所有服務
pnpm dev:web      # 僅前端 (localhost:3000)
pnpm dev:backend  # 僅後端 (localhost:8787)
```

### 常用指令

```bash
pnpm build        # 建構所有套件
pnpm lint         # ESLint 檢查
pnpm test         # 執行測試
pnpm typecheck    # TypeScript 型別檢查
pnpm format       # Prettier 格式化
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
│   └── mobile/            # React Native 行動應用
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

# 後端
cd backend && pnpm db:migrate:remote && pnpm deploy:production
```

## 開發慣例

- TypeScript 嚴格型別，前端使用 `@/` 路徑別名
- 元件按領域分組：`components/<domain>/`
- 所有程式碼、註解、文件使用**繁體中文**
