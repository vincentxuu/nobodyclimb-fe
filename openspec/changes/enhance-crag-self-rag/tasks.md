## 1. DB Migration

- [x] 1.1 新增 migration 檔案（如 `0057_reranker_confidence_config.sql`），INSERT 三筆 `ai_config` 記錄：`reranker_relevance_threshold`（`'0.3'`）、`reranker_min_keep`（`'2'`）、`tool_confidence_threshold`（`'0.7'`）
- [ ] 1.2 ~~本地執行~~ CI/CD 執行 `pnpm db:migrate` 驗證 migration 成功，確認三筆 config 可讀取（等部署 preview 時執行）
- [x] 1.3 準備 rollback SQL：`DELETE FROM ai_config WHERE key IN ('reranker_relevance_threshold', 'reranker_min_keep', 'tool_confidence_threshold')`，記錄於 migration 檔案註解中

## 2. PipelineConfig 類型與載入

- [x] 2.1 `backend/src/services/pipeline/types.ts`：`PipelineConfig` 新增 `reranker_relevance_threshold: number`、`reranker_min_keep: number`、`tool_confidence_threshold: number` 欄位
- [x] 2.2 `backend/src/services/query.ts`：`loadPipelineConfig()` 中使用 `num()` helper 從 `ai_config` 讀取三個新欄位——`reranker_relevance_threshold`（預設 0.3，範圍 0-1）、`reranker_min_keep`（預設 2，範圍 1-20）、`tool_confidence_threshold`（預設 0.7，範圍 0-1）

## 3. Cross-Encoder 相關性閾值過濾

- [x] 3.1 `backend/src/services/pipeline/steps/cross-encoder.ts`：在 `ctx.scoredCandidates` 賦值後（reranking 映射完成，約 line 44 後），新增閾值過濾邏輯——根據 `pipelineConfig.reranker_relevance_threshold` 過濾 score < 閾值的文件
- [x] 3.2 實作 `min_keep` 安全網：過濾後若候選數 < `reranker_min_keep`，改為保留 score 最高的前 N 筆
- [x] 3.3 trace 擴充：`trace.retrieval.reranker` 記錄 `filtered_count` 和 `threshold_used`

## 4. Tool Selection 信心分數

- [x] 4.1 `backend/src/utils/ai-prompts.ts`：修改 `TOOL_SELECTION_PROMPT`，在輸出 JSON schema 中新增 `"confidence": 0.0-1.0` 欄位（放在 JSON 最後）
- [x] 4.2 `backend/src/services/query.ts`：`parseQueryWithLLM()` 解析 LLM 回傳的 `confidence` 欄位，處理缺失（預設 0.8）、非數字（預設 0.8）、超範圍（clamp 至 0.0-1.0）
- [x] 4.3 `backend/src/types.ts`：`ParsedQuery` 介面新增 `confidence?: number` 欄位

## 5. 低信心 Fallback 邏輯

- [x] 5.1 `backend/src/services/pipeline/steps/tool-selection.ts`：在所有分支邏輯完成後（line 174 `return ctx` 之前），加入最終 confidence fallback 檢查——當 `parsedQuery.confidence < pipelineConfig.tool_confidence_threshold` 且 `ctx.queryType` 非 `general-knowledge`、且未觸發 regex 安全網（檢查 trace 中無 `personal_query_fallback` 和 `sql_query_fallback` 標記）時，覆寫 `ctx.queryType = 'general-knowledge'`
- [x] 5.2 確保 regex 安全網（個人查詢、SQL 計數）優先於 confidence fallback，不受信心閾值影響
- [x] 5.3 trace 擴充：`trace.query_parsing` 記錄 `confidence`、`confidence_fallback`（布林值）、`original_tool`（降級前的原始工具）

## 6. SELF_REFLECTION_PROMPT 清理

- [x] 6.1 `backend/src/utils/ai-prompts.ts`：移除 `SELF_REFLECTION_PROMPT` 匯出定義
- [x] 6.2 `backend/src/services/query.ts`：移除 `SELF_REFLECTION_PROMPT` 的 import 和 `resolvePrompt()` 註冊
- [x] 6.3 `backend/src/routes/admin-ai.ts`：移除 `SELF_REFLECTION_PROMPT` 的 import 和管理後台展示條目
- [x] 6.4 確認 `ai_prompts` DB 表中無 `self_reflection_prompt` 記錄（若有則在 migration 中清除）

## 7. 驗證與測試

- [ ] 7.1 本地啟動 backend dev server，發送測試查詢，確認 trace 中包含 `filtered_count`、`threshold_used`、`confidence`、`confidence_fallback` 欄位
- [ ] 7.2 測試 reranker 過濾：調整 `reranker_relevance_threshold` 為極高值（如 0.99），確認 `min_keep` 安全網生效
- [ ] 7.3 測試 confidence fallback：發送模糊查詢，確認低信心時降級為 `general_knowledge` 並記錄 `confidence_fallback: true`
- [x] 7.4 測試 SELF_REFLECTION_PROMPT 清理：確認 admin UI prompt 列表不再顯示 Self-Reflection 項目，TypeScript 編譯無錯誤
- [x] 7.5 執行 `pnpm typecheck` 和 `pnpm lint` 確認無類型和 lint 錯誤
