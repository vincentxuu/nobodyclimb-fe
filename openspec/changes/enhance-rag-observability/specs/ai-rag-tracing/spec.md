## MODIFIED Requirements

### Requirement: RAG 分段 Latency 追蹤

系統 SHALL 在 RAG 查詢執行過程中，由 Pipeline Engine 的 `postPipelineProcessing()` 從 `pipelineExecution` 陣列匯聚三個關鍵階段的耗時（毫秒）：embedding 階段（`embedding` 步驟）、retrieval 階段（`hybrid-search` + `cross-encoder` + `mmr` + `popularity-rerank` 步驟的累計）、generation 階段（`llm-generation` + `judge` + `self-reflection` 步驟的累計）。匯聚使用步驟 ID 匹配，跳過 `skipped` 或 `error` 的步驟。

#### Scenario: 完整 RAG pipeline 計時

- **WHEN** 查詢走完整 RAG 流程（embedding → search → LLM）
- **THEN** `postPipelineProcessing()` SHALL 從 `pipelineExecution` 匯聚 `embeddingMs`、`retrievalMs`、`generationMs` 三個數值，傳入 `logQuery()` 寫入 DB，皆為正整數

#### Scenario: 快取命中時不計時

- **WHEN** 查詢命中 KV 或語意快取，pipeline 提前結束
- **THEN** 三個匯聚值皆為 0，`postPipelineProcessing()` SHALL 傳入 `null`（非 0）給 `logQuery()`

#### Scenario: General knowledge 路徑計時

- **WHEN** 查詢走 general_knowledge 路徑（`embedding` 和 `hybrid-search` 步驟被跳過）
- **THEN** `embeddingMs` = 0 → 傳入 `null`，`retrievalMs` = 0 → 傳入 `null`，`generationMs` = `llm-generation` 步驟的 `duration_ms` → 傳入正整數

#### Scenario: loopBack 重新執行時累計延遲

- **WHEN** `self-reflection` 觸發 `loopBack`，pipeline 從 `filter-build` 步驟重新執行
- **THEN** `pipelineExecution` 中出現重複步驟 ID 的條目，匯聚 SHALL 累加所有同 ID 步驟的 `duration_ms`

#### Scenario: 延遲值不為負數

- **WHEN** 任何分段匯聚結果為負數（時鐘異常）
- **THEN** 該欄位 SHALL 傳入 `null`，不寫入負值

### Requirement: 分段延遲記錄

系統 SHALL 將三個分段延遲值寫入 `ai_query_logs` 的對應欄位（`embedding_ms`、`retrieval_ms`、`generation_ms`，INTEGER 型別，皆 nullable）。`logQuery()` 的現有 INSERT 語句已正確綁定這三個參數，無需修改。

#### Scenario: 三段延遲全部寫入

- **WHEN** 完整 RAG pipeline 執行完畢
- **THEN** `postPipelineProcessing()` 傳入三個延遲值至 `logQuery()`，且均寫入 DB

#### Scenario: 延遲值不為負數

- **WHEN** 任何分段計時結果為負數（時鐘異常）
- **THEN** 該欄位記錄為 null，不寫入負值

#### Scenario: /latency-stats 端點回傳真實數據

- **WHEN** 管理員呼叫 `GET /admin/ai/latency-stats`
- **THEN** 端點 SHALL 回傳過去 24 小時非快取查詢的 P50/P95 百分位數，數值為正整數（非 null）
