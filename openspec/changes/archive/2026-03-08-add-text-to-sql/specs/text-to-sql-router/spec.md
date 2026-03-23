## ADDED Requirements

### Requirement: text-to-sql Pipeline Step
系統 SHALL 提供 `text-to-sql` pipeline step（phase: `pre-retrieval`，defaultOrder: 2），在 `tool-selection` step 之後執行，根據 `ctx.queryType` 處理 SQL 直查、Hybrid 候選集撈取與 Clarification 回應。此 step 透過 `skipWhen` 條件路由在非 SQL 類型查詢時自動跳過。

#### Scenario: sql queryType 執行 SQL 模板並 earlyReturn
- **WHEN** `ctx.queryType = 'sql'` 且 `ctx.sqlTemplate = 'COUNT_ROUTES_AT_CRAG'`
- **THEN** `text-to-sql` step 呼叫 `TextToSqlService.execute('COUNT_ROUTES_AT_CRAG', params)`，取得結果後由輕量 LLM 組裝自然語言回答，設定 `ctx.earlyReturn`（含 `query_route: 'sql'`），pipeline 停止

#### Scenario: hybrid queryType 撈取候選集
- **WHEN** `ctx.queryType = 'hybrid'`
- **THEN** `text-to-sql` step 呼叫 `TextToSqlService.queryCandidates(params)` 取得最多 20 條候選，格式化為 context 文字，存入 `ctx.sqlCandidates` 和 `ctx.sqlContext`，不設定 `earlyReturn`

#### Scenario: clarification-needed queryType 組裝回問
- **WHEN** `ctx.queryType = 'clarification-needed'` 且 `ctx.clarificationType = 'intent'`
- **THEN** step 設定 `ctx.earlyReturn = { answer: '你是想要：A. …，還是 B. …？', clarification_needed: true, clarification_options: [...] }`

#### Scenario: clarification-needed 缺少岩場
- **WHEN** `ctx.queryType = 'clarification-needed'` 且 `ctx.clarificationType = 'missing-crag'`
- **THEN** step 設定 `ctx.earlyReturn = { answer: '請問是哪個岩場的路線？', clarification_needed: true, clarification_options: [] }`

#### Scenario: 非 SQL 類型查詢被 skipWhen 跳過
- **WHEN** `ctx.queryType` 為 `'simple'`、`'complex'` 或 `'general-knowledge'`
- **THEN** engine 的 skipWhen 條件 `[{ field: 'queryType', operator: 'in', value: ['simple', 'complex', 'general-knowledge'] }]` 成立，跳過此 step

#### Scenario: step 被停用時的 fallback
- **WHEN** 管理員停用 `text-to-sql` step
- **THEN** engine 偵測到 `text-to-sql` 被停用且 `ctx.queryType` 為 `sql`/`hybrid`/`clarification-needed` 時，自動將 `ctx.queryType` 回復為 `'complex'`，確保後續 RAG step 可正常執行

### Requirement: SQL Fallback RAG 機制
`text-to-sql` step SHALL 在 SQL 執行失敗或結果為空時，將 `ctx.queryType` 回復為 `'complex'`，不設定 `ctx.earlyReturn`，讓 pipeline 繼續執行後續 RAG step。

#### Scenario: 路線名稱驗證失敗 fallback
- **WHEN** `TextToSqlService.validateRouteName()` 回傳 null（0 筆結果）
- **THEN** step 設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`

#### Scenario: SQL 執行例外 fallback
- **WHEN** `TextToSqlService.execute()` 拋出例外
- **THEN** step catch 例外，設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`

#### Scenario: SQL 查無結果 fallback
- **WHEN** SQL 模板執行回傳 0 筆結果
- **THEN** step 設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`

#### Scenario: 無對應模板 fallback
- **WHEN** `ctx.sqlTemplate` 值不在 `TextToSqlService` 支援的模板清單中
- **THEN** step 設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`

#### Scenario: Hybrid 候選集為空 fallback
- **WHEN** `TextToSqlService.queryCandidates()` 回傳 0 筆結果
- **THEN** step 設定 `ctx.queryType = 'complex'`、`ctx.trace.sql_fallback = true`，不設 `earlyReturn`，讓 pipeline 繼續走完整 RAG

### Requirement: 路線名稱驗證
系統 SHALL 在執行需要路線名稱的 SQL 模板（`ROUTE_INFO_LOOKUP`、`LIST_VIDEOS_FOR_ROUTE`、`ROUTE_FIRST_ASCENT`）前，先以 LIKE 查詢驗證路線存在，並取得 `route.id` 用於正式查詢。

#### Scenario: 路線名稱驗證成功
- **WHEN** LLM 輸出 `ctx.sqlParams.route_name = '一陽指'`
- **THEN** `text-to-sql` step 呼叫 `TextToSqlService.validateRouteName('一陽指')`，取得 `route.id` 後執行正式模板

#### Scenario: 路線名稱帶岩場時縮小範圍
- **WHEN** `ctx.sqlParams.route_name = '一陽指'` 且 `ctx.sqlParams.crag_name = '龍洞'`
- **THEN** step 先以 `ctx.queryService.extractLocationFilter()` 解析 crag_id，呼叫 `validateRouteName('一陽指', cragId)` 加入 `crag_id` 過濾

#### Scenario: 路線名稱驗證回傳多筆時取最相關
- **WHEN** LIKE 查詢回傳多筆結果
- **THEN** 若有 `crag_id` 參數則先過濾；仍有多筆時取第一筆，並在 LLM 組裝時標注完整路線名稱與所屬岩場

#### Scenario: 路線名稱驗證失敗時 fallback RAG
- **WHEN** LIKE 查詢回傳 0 筆結果
- **THEN** step 走 SQL Fallback RAG 機制
