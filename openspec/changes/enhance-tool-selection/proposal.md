## Why

Tool Selection 步驟（`tool-selection.ts`）是 RAG Pipeline 的入口決策點，決定使用哪個工具（search_routes / search_crags / general_knowledge / sql_query / hybrid）。目前存在三個核心問題：

1. **無信心分數**：LLM 只回傳工具名稱，無法區分「非常確定用 search_routes」和「不確定，可能是 sql_query」，導致無法做智慧 fallback
2. **選錯無法修正**：Agentic ReAct Loop 只有 ANSWER / RETRIEVE / BROADEN 三種動作，無法切換工具。例如「龍洞有幾條路線？」若選了 search_routes（向量搜尋），不會自動切換到更精確的 sql_query
3. **工具定義靜態硬寫**：5 個工具的名稱、描述、參數定義散佈在 `TOOL_SELECTION_PROMPT` 和程式碼中，新增工具需同時改 prompt 和多處程式碼

## What Changes

- 新增 **ToolRegistry** 工具註冊機制，統一管理工具的 metadata 和執行邏輯
- **TOOL_SELECTION_PROMPT** 改為從 ToolRegistry 動態生成工具描述區塊
- Tool Selection 輸出新增 **confidence 信心分數**（0.0-1.0），低信心時啟用 fallback 策略
- 新增 **工具 fallback 機制**：檢索結果品質低或為空時，自動嘗試替代工具
- 新增 Agentic **SWITCH_TOOL** 動作，允許 ReAct Loop 中觀察結果後切換工具
- **pipelineTrace** 擴充記錄 tool selection confidence、fallback 事件、工具切換歷程

## Capabilities

### New Capabilities
- `tool-registry`: 工具註冊機制（ToolRegistry class），統一管理 RAG 工具的 metadata、描述、參數定義，支援動態 prompt 生成

### Modified Capabilities
- `ai-query-service`: 新增 confidence 信心分數輸出、工具 fallback 邏輯、SWITCH_TOOL agentic 動作
- `ai-pipeline-flow`: tool-selection 步驟 provides 新增 `toolConfidence`，pipelineTrace 擴充 tool selection 詳細記錄
- `ai-rag-tracing`: trace 結構新增 `tool_selection.confidence`、`tool_selection.fallback`、`tool_selection.switches` 欄位

## Impact

- **Backend 程式碼**：
  - 新建 `backend/src/services/tool-registry.ts`（ToolRegistry class）
  - 修改 `backend/src/services/pipeline/steps/tool-selection.ts`（confidence 解析、fallback 邏輯）
  - 修改 `backend/src/utils/ai-prompts.ts`（TOOL_SELECTION_PROMPT 動態化、AGENTIC_DECISION_PROMPT 新增 SWITCH_TOOL）
  - 修改 `backend/src/services/query.ts`（agenticRetrieve 支援 SWITCH_TOOL）
- **API 回應**：`pipelineTrace` 結構擴充，無 breaking change
- **相依性**：無新套件，純 TypeScript 實作
- **風險**：TOOL_SELECTION_PROMPT 變更可能影響工具選擇準確率，需在上線前用人工測試驗證（黃金測試集尚未建立）
