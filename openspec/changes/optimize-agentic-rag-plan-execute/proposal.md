## Why

目前 Agentic RAG 僅有 ReAct（邊走邊想）策略，每步 LLM 決策循序執行，適合探索性查詢但對結構明確的多實體比較查詢效率低、延遲高。業界 Agentic RAG 有兩種互補策略：ReAct（反應式）和 Plan-and-Execute（計畫式），兩者共存由查詢特性自動選擇。新增 Plan-and-Execute 和 Adaptive Plan 策略，讓系統對「比較三個岩場」「推薦不同難度路線並說明理由」等可分解查詢，先產生完整計畫再並行執行子任務，降低延遲並提升回答結構化品質。

## What Changes

- 新增 `planQuery()` 方法：使用強模型（Gemma 12B）分析查詢複雜度，分解為有依賴關係的子任務，每個子任務指定最佳工具和檢索方法
- 新增 `executePlan()` 方法：復用現有檢索基礎設施（embedding + vector search + BM25 或 TextToSqlService）按計畫並行/循序執行子查詢，無依賴的步驟 `Promise.all` 並行，不需額外 LLM 呼叫
- 新增 `synthesize()` 方法：使用強模型將所有子查詢的檢索結果智慧合併為結構化 context（非最終答案），最終答案仍由下游 `llm-generation` 步驟統一生成
- 新增 Adaptive Plan 機制：執行中途若子任務結果不足，可動態修改剩餘計畫（介於 ReAct 和純 Plan-and-Execute 之間）
- 擴充 `rag_strategy` 配置：從 `'baseline' | 'agentic'` 擴充為 `'baseline' | 'agentic' | 'plan-execute' | 'auto'`
- `auto` 模式：由 tool-selection 階段自動選擇策略（simple → baseline、探索性 complex → ReAct、結構化 complex → Plan-and-Execute）
- 新增 `PLANNING_PROMPT` 和 `SYNTHESIS_PROMPT` 提示詞模板，支援 DB 動態管理
- 在 `hybrid-search` 步驟內整合 Plan-and-Execute 路徑（如同現有 ReAct 整合方式）
- SSE Streaming 模式下，Plan-and-Execute 的 planning + execution 階段為非串流，synthesis 結果交給 `llm-generation` 步驟進行串流生成
- 擴充 `pipelineTrace` 記錄計畫內容、各子任務執行結果、策略選擇原因
- 新增 `ai_config` 配置項：`plan_execute_max_steps`、`plan_execute_min_entities`（觸發 Plan-and-Execute 的最少實體數）

## Capabilities

### New Capabilities
- `plan-execute-strategy`：Plan-and-Execute 和 Adaptive Plan 策略的完整實作，包含 planQuery、executePlan、synthesize 三階段，以及策略自動選擇邏輯

### Modified Capabilities
- `ai-query-service`：擴充 `rag_strategy` 支援 `plan-execute` 和 `auto` 模式，新增策略自動選擇邏輯，query.ts 需整合 Plan-and-Execute 執行路徑
- `ai-pipeline-flow`：Pipeline 步驟配置需支援 Plan-and-Execute 路徑的條件式路由，hybrid-search 步驟需新增第三種執行分支

## Impact

- **後端程式碼**：`backend/src/services/query.ts`（核心，新增 planQuery/executePlan/synthesize 方法）、`backend/src/services/pipeline/steps/hybrid-search.ts`（新增 plan-execute 分支）、`backend/src/utils/ai-prompts.ts`（新增 PLANNING_PROMPT、SYNTHESIS_PROMPT）、`backend/src/services/pipeline/registry.ts`（可能新增步驟 metadata）
- **資料庫**：`ai_config` 新增配置項、`ai_prompts` 新增提示詞記錄
- **API**：回應 trace 格式擴充（新增 plan、sub_tasks 欄位），API 介面不變
- **Token 消耗**：Plan-and-Execute 需額外 LLM 呼叫（planning + synthesis），但 Cloudflare Workers AI 無 per-token 計費，主要影響延遲而非成本
- **Admin UI**：`ai_config` 新增的配置項可透過現有 Admin 介面管理，無需新頁面
