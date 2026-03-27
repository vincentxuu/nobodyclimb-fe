## Why

CRAG（Corrective RAG）目前僅在檢索結果為 0 筆時觸發難度過濾放寬重試，缺乏對個別文件相關性的閾值過濾——Cross-Encoder Reranker 只重排序不丟棄低分文件，導致低相關性文件可能進入生成階段，影響回答品質。Self-RAG 方面，Tool Selection 缺少信心分數，無法做智慧 fallback；檢索必要性也沒有預判機制，所有非 `general_knowledge` 查詢都執行完整檢索流程。此外 `SELF_REFLECTION_PROMPT` 已是死碼（功能已由 Judge + loopBack 取代），需清理。

## What Changes

- **Cross-Encoder Reranking 後新增相關性閾值過濾**：reranker score 低於可配置門檻的文件直接丟棄，從源頭減少低品質 context
- **Tool Selection 新增信心分數**：修改 `TOOL_SELECTION_PROMPT` 要求 LLM 輸出 `confidence` 欄位（0.0-1.0），低信心時啟用 fallback 策略
- **信心三層 fallback**：結合 Tool Selection 信心分數，`confidence < tool_confidence_threshold`（預設 0.7）直接走 `general_knowledge`，中等信心（0.7-0.8）啟用空結果 fallback，高信心（>= 0.8）正常使用
- **清理 `SELF_REFLECTION_PROMPT` 死碼**：移除 `ai-prompts.ts` 常量定義、`query.ts` resolvePrompt 註冊、`admin-ai.ts` 管理後台條目

## Capabilities

### New Capabilities

_無新增 capability_

### Modified Capabilities

- `corrective-rag`：新增 Cross-Encoder Reranking 後的相關性閾值過濾機制，從「僅零結果觸發」擴展為「低品質文件主動過濾」
- `query-classifier`：Tool Selection 輸出新增 `confidence` 信心分數欄位，支援低信心 fallback 與檢索必要性預判
- `ai-query-service`：整合信心分數的 fallback 路由邏輯、清理 `SELF_REFLECTION_PROMPT` 死碼

## Impact

- **程式碼**：
  - `backend/src/services/pipeline/steps/cross-encoder.ts`：新增 reranker score 閾值過濾邏輯
  - `backend/src/services/pipeline/steps/tool-selection.ts`：解析 confidence 欄位、fallback 邏輯
  - `backend/src/utils/ai-prompts.ts`：修改 `TOOL_SELECTION_PROMPT` 加入 confidence 輸出要求、移除 `SELF_REFLECTION_PROMPT`
  - `backend/src/services/query.ts`：整合 confidence 路由邏輯
- **DB 配置**：`ai_config` 表新增 3 個欄位：`reranker_relevance_threshold`（預設 0.3）、`reranker_min_keep`（預設 2）、`tool_confidence_threshold`（預設 0.7），需新增 D1 migration
- **類型**：`PipelineConfig` 新增 `reranker_relevance_threshold`、`reranker_min_keep`、`tool_confidence_threshold` 欄位
- **API**：無 breaking change，`pipelineTrace` 擴充記錄 `filtered_count`、`threshold_used`、`confidence`、`confidence_fallback`
- **相依性**：無新增套件
