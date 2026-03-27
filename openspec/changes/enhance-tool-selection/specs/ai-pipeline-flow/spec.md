## MODIFIED Requirements

### Requirement: Pipeline Step 註冊表
System SHALL maintain step registry (`registry.ts`) with all available step metadata. Registry SHALL export as array sorted by defaultOrder. tool-selection 步驟的 `provides` SHALL 新增 `toolConfidence`、`fallbackEnabled`、`alternativeTool` 和 `retrievalMethod` 欄位。

13 steps registered: semantic-cache, tool-selection, hyde, multi-query, filter-build, embedding, hybrid-search, cross-encoder, mmr, popularity-rerank, llm-generation, judge, self-reflection

#### Scenario: tool-selection 步驟 provides 包含信心分數
- **WHEN** 查詢 tool-selection 步驟的 metadata
- **THEN** `provides` 陣列 SHALL 包含 `toolConfidence`、`fallbackEnabled` 和 `alternativeTool`

## ADDED Requirements

### Requirement: PipelineContext 工具信心欄位
`PipelineContext` SHALL 新增以下欄位：
- `toolConfidence: number` — Tool Selection 的信心分數（0.0-1.0），預設 1.0
- `fallbackEnabled: boolean` — 是否啟用工具 fallback，預設 false
- `alternativeTool?: string` — fallback 目標工具名

#### Scenario: 高信心查詢的 context 設定
- **WHEN** Tool Selection 回傳 confidence = 0.92
- **THEN** PipelineContext SHALL 設定 `toolConfidence = 0.92`、`fallbackEnabled = false`

#### Scenario: 低信心查詢的 context 設定
- **WHEN** Tool Selection 回傳 confidence = 0.65、alternative = 'sql_query'
- **THEN** PipelineContext SHALL 設定 `toolConfidence = 0.65`、`fallbackEnabled = true`、`alternativeTool = 'sql_query'`

### Requirement: 工具 Fallback 觸發機制
當 `fallbackEnabled = true` 時，`hybrid-search` 步驟完成後 SHALL 檢查 `ctx.candidateMatches.length`。若為 0 筆，系統 SHALL 觸發工具 fallback。Fallback 執行流程：
1. 將 `ctx.queryType` 切換為 `alternativeTool` 對應的 queryType
2. 更新 `ctx.parsedQuery` 的 tool 欄位
3. 設定 `ctx.fallbackEnabled = false`（防止遞迴）
4. 設定 `ctx.loopBack = { targetPhase: 'pre-retrieval', reason: 'tool_fallback' }`，利用現有 loopBack 機制從 `filter-build` 步驟重新執行
5. 記錄 fallback 事件到 `ctx.trace`

Fallback SHALL 最多觸發 1 次。觸發點明確為 `hybrid-search` 步驟完成後，因為此步驟產出 `candidateMatches`，是判斷檢索是否有效的最早時機。

#### Scenario: Fallback 從 filter-build 重新執行
- **WHEN** `fallbackEnabled = true` 且 `hybrid-search` 步驟完成後 `ctx.candidateMatches` 為空陣列
- **THEN** Engine SHALL 將 queryType 切換為 alternativeTool 的 queryType，設定 `fallbackEnabled = false`，透過 `loopBack` 機制從 filter-build 步驟重新執行

#### Scenario: Fallback 不遞迴
- **WHEN** fallback 執行後 hybrid-search 仍回傳 0 筆結果
- **THEN** Engine SHALL 繼續正常流程（`fallbackEnabled` 已設為 false，不再觸發）

#### Scenario: 非 RAG 路徑不觸發 fallback
- **WHEN** queryType 為 `sql` 或 `general-knowledge`（這些路徑跳過 hybrid-search）
- **THEN** fallback 機制 SHALL 不被觸發

### Requirement: PipelineContext 檢索方法欄位
`PipelineContext` SHALL 新增 `retrievalMethod: RetrievalMethod` 欄位（型別為 `'vector' | 'bm25' | 'hybrid'`），預設 `'hybrid'`。tool-selection 步驟 SHALL 從 LLM 輸出的 `retrieval_method` 設定此欄位。

#### Scenario: bm25 模式跳過 embedding
- **WHEN** `ctx.retrievalMethod === 'bm25'`
- **THEN** embedding 步驟 SHALL 跳過（設定 `queryVector = undefined`），trace 記錄 `{ skipped: true, reason: 'bm25_only' }`

#### Scenario: vector 模式跳過 BM25
- **WHEN** `ctx.retrievalMethod === 'vector'`
- **THEN** hybrid-search baseline 路徑 SHALL 跳過 BM25 搜尋，僅執行向量搜尋

### Requirement: PipelineContext MultiTool 欄位
`PipelineContext` SHALL 新增 `multiToolPlan?: MultiToolPlan` 欄位和 `queryType` union 值 `'multi-tool'`。

### Requirement: Multi-Tool skipWhen 條件
以下 8 個步驟的 `skipWhen` SHALL 包含 `'multi-tool'` queryType：text-to-sql、hyde、multi-query、filter-build、embedding、cross-encoder、mmr、popularity-rerank。`hybrid-search` 步驟 SHALL 不跳過 `'multi-tool'`（需要執行 multi-tool 分支）。

#### Scenario: multi-tool 查詢跳過中間步驟
- **WHEN** `ctx.queryType === 'multi-tool'`
- **THEN** pipeline SHALL 跳過 text-to-sql、hyde、multi-query、filter-build、embedding、cross-encoder、mmr、popularity-rerank，直接在 hybrid-search 步驟執行 multi-tool 分支

### Requirement: Multi-Tool 執行分支
`hybrid-search` 步驟 SHALL 在偵測到 `ctx.queryType === 'multi-tool' && ctx.multiToolPlan` 時，優先執行 multi-tool 分支。分支 SHALL 將 `MultiToolPlan` 轉為 `ExecutionPlan` 格式，復用 `executePlan()` 和 `synthesize()` 方法。成功時設定 `ctx.skipPostRetrieval = true`。失敗時 SHALL fallback 到 BM25-only 搜尋。

#### Scenario: multi-tool 成功執行
- **WHEN** `ctx.queryType === 'multi-tool'` 且 `executePlan()` + `synthesize()` 成功
- **THEN** `ctx.context` 和 `ctx.sources` SHALL 由 synthesize 結果設定，`ctx.skipPostRetrieval = true`

#### Scenario: multi-tool 執行失敗降級
- **WHEN** `executePlan()` 或 `synthesize()` 拋出異常
- **THEN** 系統 SHALL fallback 到 BM25-only 搜尋，記錄降級到 `ctx.degradedStages`
