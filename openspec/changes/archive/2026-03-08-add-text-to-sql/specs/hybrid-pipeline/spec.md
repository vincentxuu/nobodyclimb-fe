## ADDED Requirements

### Requirement: Hybrid Pipeline 執行流程
系統 SHALL 在 `ctx.queryType = 'hybrid'` 時，由 `text-to-sql` step 先以 SQL 取得精確候選集存入 `ctx.sqlCandidates` 和 `ctx.sqlContext`，後續 RAG retrieval/post-retrieval step 被 skipWhen 跳過，`llm-generation` step 使用 `ctx.sqlContext` 作為 context 生成推薦回答。

#### Scenario: Hybrid 推薦執行完整流程
- **WHEN** 用戶輸入「推薦我幾條適合初學者的龍洞路線」
- **THEN** pipeline 依序執行：1) `tool-selection` step 設定 `ctx.queryType = 'hybrid'`，2) `text-to-sql` step 呼叫 SQL 查詢龍洞 grade ≤ N 的路線（最多 20 條），格式化為 context 文字存入 `ctx.sqlContext`，3) hyde 至 popularity-rerank 被 skipWhen 跳過，4) `llm-generation` step 偵測 `ctx.queryType = 'hybrid'`，使用 `ctx.sqlContext` 取代 RAG `ctx.context` 生成推薦

#### Scenario: Hybrid 候選集上限
- **WHEN** SQL 查詢符合條件的路線超過 20 條
- **THEN** `TextToSqlService.queryCandidates()` 取前 20 條（依 grade 排序），不全數傳入

#### Scenario: Hybrid SQL 查無結果時 fallback RAG
- **WHEN** SQL 候選集查詢回傳 0 筆結果
- **THEN** `text-to-sql` step 走 SQL Fallback RAG 機制（將 `ctx.queryType` 回復為 `'complex'`），pipeline 繼續執行完整 RAG 路徑

### Requirement: Hybrid 候選集格式相容現有 context
`text-to-sql` step SHALL 將 SQL 查詢結果格式化為與現有 RAG document context 相容的純文字格式，存入 `ctx.sqlContext`，`llm-generation` step 不需修改現有 SYSTEM_PROMPT 即可使用。

#### Scenario: SQL 結果格式化為 context 文字
- **WHEN** SQL 查詢回傳路線陣列 `[{ name, grade, route_type, description }]`
- **THEN** `text-to-sql` step 將每條路線格式化為「路線名稱：XX，難度：5.10a，類型：運攀，描述：…」，與現有 RAG context 段落格式一致，存入 `ctx.sqlContext`

### Requirement: llm-generation step 支援 Hybrid 路徑
`llm-generation` step SHALL 在 `ctx.queryType = 'hybrid'` 時，使用 `ctx.sqlContext` 取代 RAG `ctx.context` 作為 LLM SYSTEM_PROMPT 的 context 區段。

#### Scenario: hybrid 使用 SQL 候選集作為 context
- **WHEN** `ctx.queryType = 'hybrid'` 且 `ctx.sqlContext` 有值
- **THEN** `llm-generation` step 在組裝 SYSTEM_PROMPT 時，使用 `ctx.sqlContext` 替代 `ctx.context`（RAG 文件 context），其他行為（串流、suggestedQuestions、injectRouteLinks）不變

#### Scenario: hybrid 回應帶 query_route 標記
- **WHEN** `ctx.queryType = 'hybrid'` 且 `llm-generation` step 完成
- **THEN** 回應的 `query_route` 為 `'hybrid'`
