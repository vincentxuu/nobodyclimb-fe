## Why

目前 AI 系統的 10 個 prompt 模板全部硬編碼在 `backend/src/utils/ai-prompts.ts`，管理員無法在後台調整任何 prompt 內容。雖然後端已有 `/admin/ai/prompts` CRUD API 和 `ai_prompts` 資料表（含版本控制），但前端完全沒有對應的 prompt 管理介面。此外，`/admin/ai/settings` 頁面目前將 30+ 項設定和 4 組 guardrail 列表全部塞在一個長頁面中，缺乏分類導航，UX 體驗很差。

## What Changes

### Prompt 模板管理
- 新增 `/admin/ai/prompts` 前端頁面，提供 prompt 列表、編輯器、版本歷史
- 支援在管理後台編輯所有 10 個 prompt 模板（SYSTEM_PROMPT、TOOL_SELECTION_PROMPT、QUERY_TEMPLATE 等）
- 修改後端 query service，讓它優先從 `ai_prompts` 資料表讀取 active 版本的 prompt，fallback 到硬編碼預設值
- 支援 prompt 版本比對和快速回滾到上一版本
- 支援 prompt 變數標記（如 `{query}`、`{context}`），編輯器中顯示可用變數

### Settings 頁面 UX 重構
- 將 settings 頁面從單一長頁面重構為分頁式（Tab）介面
- 分頁規劃：模型設定 / 搜尋與排名 / Token 與品質 / 快取與對話 / Agentic 模式 / 防護設定
- 每個分頁獨立儲存，避免一次送出所有設定
- 改善 guardrail 列表的編輯體驗（新增/刪除標籤式 UI 取代純文字框）

## Capabilities

### New Capabilities
- `ai-prompt-editor`: 管理員 prompt 模板管理介面，包含列表頁、編輯器（含語法高亮）、版本歷史、回滾、變數標記提示
- `ai-prompt-runtime`: 後端 prompt 載入機制，從 DB 讀取 active prompt 並 fallback 到硬編碼預設值，含快取策略

### Modified Capabilities
- `ai-admin-dashboard`: Settings 頁面從長頁面重構為分頁式 UI，guardrail 列表改用標籤式編輯

## Impact

- **前端**：新增 `apps/web/src/app/admin/ai/prompts/` 頁面，重構 `apps/web/src/app/admin/ai/settings/page.tsx`
- **後端**：修改 `backend/src/services/query.ts` 的 prompt 載入邏輯（從 import 常數改為 DB 讀取 + fallback）
- **API**：現有 `/admin/ai/prompts` API 無需修改，可能需微調回傳欄位
- **資料庫**：使用現有 `ai_prompts` 和 `ai_config` 表，可能需 seed 預設 prompt 資料
- **效能**：prompt 讀取需加入 KV 快取（避免每次查詢都讀 DB），設計快取失效策略
