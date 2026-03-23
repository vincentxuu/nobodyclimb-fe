## Why

`query.ts` 已膨脹至 2452 行，所有 pipeline 階段（Tool Calling、HyDE、Multi-Query、BM25、Cross-encoder、MMR、Judge、Self-reflection）硬編碼在單一 `ask()` 方法中，無法獨立啟用/停用或調整執行順序。管理員若想關閉某個階段（如 HyDE 或 Judge）只能改程式碼重新部署，缺乏運行時的靈活性。需要將 pipeline 拆解為可配置的 step flow，讓管理員在 `/admin/ai/settings` 介面上以拖拉排序、開關切換的方式管理各階段。

## What Changes

- **重構 `query.ts`**：將單體 `ask()` 方法拆解為獨立的 pipeline step 模組（每個 step 有統一介面：`execute(ctx) → ctx`）
- **新增 pipeline step 註冊機制**：每個 step 定義 `id`、`name`、`description`、`defaultEnabled`、`defaultOrder`、`phase`（pre-retrieval / retrieval / post-retrieval / generation / evaluation）
- **擴充 `ai_config` 資料表**：新增 `pipeline_steps` key，以 JSON 陣列儲存每個 step 的 `enabled`、`order` 設定，管理員可透過 API 更新
- **新增後端 API**：`GET/PUT /api/v1/admin/ai/pipeline-steps` 讀取與更新 pipeline 設定
- **新增前端 Pipeline Flow 設定 UI**：在 `/admin/ai/settings` 新增「Pipeline Flow」tab，以視覺化方式顯示各 step 的啟用狀態與執行順序，支援拖拉排序與開關切換
- **Pipeline 執行引擎**：運行時讀取設定，依 `phase` 分組、`order` 排序，依序執行已啟用的 step

### 預計拆分的 Pipeline Steps（13 個）

| Step ID | 名稱 | Phase | 預設啟用 |
|---------|------|-------|---------|
| `semantic-cache` | 語義快取檢查 | pre-retrieval | ✅ |
| `tool-selection` | Tool Calling (LLM A) | pre-retrieval | ✅ |
| `hyde` | HyDE 假設文件生成 | pre-retrieval | ✅ |
| `multi-query` | Multi-Query Expansion | pre-retrieval | ✅ |
| `filter-build` | Filter 建構（grade/crag/region） | pre-retrieval | ✅ |
| `embedding` | Query + HyDE Embedding（內部並行） | retrieval | ✅ |
| `hybrid-search` | Vector + BM25 並行搜尋 + RRF 合併 | retrieval | ✅ |
| `cross-encoder` | Cross-encoder Reranking | post-retrieval | ✅ |
| `mmr` | MMR 多樣性選取 | post-retrieval | ✅ |
| `popularity-rerank` | 熱門度加權排序 | post-retrieval | ✅ |
| `llm-generation` | LLM 回答生成（含 GK 通識路徑） | generation | ✅ |
| `judge` | Judge 品質評估 | evaluation | ✅ |
| `self-reflection` | Self-Reflection 重生成 | evaluation | ✅ |

備註：KV 快取（非語義快取）在 pipeline engine 層級處理，不作為 step。Agentic 模式為 `hybrid-search` step 的內部分支。

### Modular RAG 進階能力

#### Conditional Routing（條件路由）
將原本各 step 硬編碼的 GK early skip 檢查（`if (ctx.queryType === 'general-knowledge') return ctx;`）泛化為 engine 層級的 `skipWhen` 路由規則。每個 step 的 registry metadata 可宣告 `skipWhen` 條件陣列，engine 在執行前自動評估，符合則跳過。條件格式：`{ field: keyof PipelineContext, operator: 'eq' | 'neq' | 'in', value: any }`。

#### Looping Pattern（迴圈模式）
評估驅動的迭代重試機制。`self-reflection` step 偵測到低 groundedness（< 0.5）時，可設定 `ctx.loopBack` 回退到 retrieval phase 重新檢索更好的文件（而非僅在同 context 下重新生成）。engine 支援 `loopBack` 欄位與 `max_pipeline_loops` 安全限制（預設 1）。

#### Branching + Fusion（分支與融合）
Engine 層級的並行分支支援。定義 `BranchConfig` 可將同 phase 內的 step 標記為並行分支（`Promise.all` 並行執行），由 fusion step 負責合併分支結果。現有 `hybrid-search` step 內部的 Vector + BM25 並行可作為首個應用場景的參考模式。

## Capabilities

### New Capabilities
- `ai-pipeline-flow`: Pipeline step 的註冊、配置儲存、執行引擎，以及管理員 API 與前端 Flow 設定 UI

### Modified Capabilities
- `ai-query-service`: 將現有 `ask()` 單體流程重構為 pipeline step 架構，各 step 透過統一介面串接，依設定動態組裝執行順序

## Impact

- **Backend**：
  - `backend/src/services/query.ts`：主要重構目標，拆分為多個 step 模組
  - 新增 `backend/src/services/pipeline/` 目錄，放置各 step 實作與 pipeline engine
  - `backend/src/routes/admin-ai.ts`：新增 `GET/PUT /api/v1/admin/ai/pipeline-steps` 與 `GET/PUT /api/v1/admin/ai/pipeline-branches` API
- **Frontend**：
  - `apps/web/src/app/admin/ai/settings/page.tsx`：新增「Pipeline Flow」tab
  - `apps/web/src/lib/api/admin-ai.ts`：新增 pipeline API client
- **風險**：
  - 重構核心查詢邏輯，需確保所有現有功能不受影響
  - Step 間存在依賴關係（如 `embedding` 依賴 `hyde` 的輸出），需在 UI 與引擎中處理依賴驗證
  - 效能：pipeline 引擎不應增加可觀延遲（設定應快取在記憶體中）
