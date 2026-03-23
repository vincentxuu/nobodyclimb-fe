## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。`tool-selection` step 分類結果為 `sql`、`hybrid`、`clarification-needed` 時，SHALL 由 `text-to-sql` pipeline step 處理，透過 `earlyReturn` 或 skipWhen 條件路由實現路徑分流。

#### Scenario: 透過 pipeline 引擎執行 RAG 查詢
- **WHEN** 使用者詢問「龍洞有什麼 5.10 的路線？」且 `tool-selection` step 設定 `ctx.queryType = 'simple'`
- **THEN** `PipelineEngine.run()` 依序執行已啟用的 step（semantic-cache → tool-selection → text-to-sql[skipWhen 跳過] → hyde → multi-query → filter-build → embedding → hybrid-search → cross-encoder → mmr → popularity-rerank → llm-generation → judge → self-reflection），最終回傳包含答案、來源和 query_id 的回應

#### Scenario: sql 類型由 text-to-sql step 處理
- **WHEN** `tool-selection` step 設定 `ctx.queryType = 'sql'`
- **THEN** `text-to-sql` step 呼叫 `TextToSqlService.execute(template, params)`，取得結果後由輕量 LLM 組裝回答，設定 `ctx.earlyReturn`，pipeline 停止

#### Scenario: hybrid 類型由 text-to-sql + llm-generation step 處理
- **WHEN** `tool-selection` step 設定 `ctx.queryType = 'hybrid'`
- **THEN** `text-to-sql` step 呼叫 `TextToSqlService.queryCandidates(params)` 取得候選集存入 `ctx.sqlCandidates` 和 `ctx.sqlContext`，後續 RAG step 被 skipWhen 跳過，`llm-generation` step 使用 `ctx.sqlContext` 作為 context 生成推薦

#### Scenario: clarification-needed 由 text-to-sql step 直接回傳
- **WHEN** `tool-selection` step 設定 `ctx.queryType = 'clarification-needed'`，`ctx.clarificationType = 'intent'`
- **THEN** `text-to-sql` step 組裝回應 `{ answer: '你是想要：A. 列出符合條件的路線清單，還是 B. 根據你的程度個人化推薦？', clarification_needed: true, clarification_options: ['A. 查詢清單', 'B. 個人化推薦'] }`，設定 `ctx.earlyReturn`

#### Scenario: clarification-needed 缺少岩場回傳問句
- **WHEN** `tool-selection` step 設定 `ctx.queryType = 'clarification-needed'`，`ctx.clarificationType = 'missing-crag'`
- **THEN** `text-to-sql` step 設定 `ctx.earlyReturn` 為 `{ answer: '請問是哪個岩場的路線？', clarification_needed: true, clarification_options: [] }`

#### Scenario: 回傳包含來源的答案
- **WHEN** RAG 查詢成功完成
- **THEN** 回應包含：答案文字、包含 id/type/title/url/score 的來源陣列，以及 query_id

#### Scenario: 輸入驗證失敗時中止查詢
- **WHEN** 輸入 guardrails 偵測到惡意模式
- **THEN** `QueryService.ask()` 拋出 `GuardrailError`，上層路由返回 400，不進行後續步驟（包含 SQL 路徑）

#### Scenario: 已登入用戶查詢時注入個人化 context
- **WHEN** 已登入用戶發送查詢（`ctx.queryType = 'simple'` 或 `'complex'`），且有記憶或完攀紀錄
- **THEN** PipelineContext 包含用戶記憶摘要、完攀紀錄與 `queryService` 實例，LLM 生成 step 使用個人化 system prompt

#### Scenario: text-to-sql step 被停用時 SQL 問題 fallback RAG
- **WHEN** 管理員在 Pipeline Flow UI 停用 `text-to-sql` step，且 `tool-selection` step 設定 `ctx.queryType = 'sql'`
- **THEN** `text-to-sql` step 被跳過（disabled），後續 RAG step 的 skipWhen 條件可能阻擋執行；engine 偵測到 `text-to-sql` 被停用時自動將 `ctx.queryType` 回復為 `'complex'`，確保 RAG 路徑正常運作

### Requirement: System prompt 設定
系統應使用可設定的 system prompt，指示 LLM 僅根據提供的資料以繁體中文回答。對已登入且有記憶或完攀紀錄的用戶，system prompt SHALL 在基礎指令前附加個人化 context 段落。

#### Scenario: 套用 system prompt 規則
- **WHEN** LLM 生成回應
- **THEN** 回應遵循規則：只使用提供的資料、使用繁體中文、簡潔扼要

#### Scenario: 已登入用戶帶有個人化 context
- **WHEN** 已登入用戶有記憶「攀岩程度約 5.11，偏好台中地區」及完攀紀錄
- **THEN** system prompt 前段包含「用戶資訊：攀岩程度約 5.11，偏好台中地區。已完攀：XX（5.10a）、YY（5.11b）。建議挑戰難度：5.11c-5.12a。」

#### Scenario: 匿名用戶或無資料時使用標準 system prompt
- **WHEN** 未登入用戶，或已登入但無記憶與完攀紀錄
- **THEN** 使用標準 system prompt，不加入個人化段落

## ADDED Requirements

### Requirement: SQL 查詢回應格式
系統 SHALL 在 SQL 路徑成功執行時，回傳與現有 RAG 回應相容的格式，額外帶 `query_route` 欄位標示路由來源。

#### Scenario: SQL 回應包含路由標記
- **WHEN** `ctx.queryType = 'sql'` 且 SQL 模板執行成功
- **THEN** `ctx.earlyReturn` 包含 `query_route: 'sql'`，`answer` 為 LLM 組裝的自然語言，`sources` 陣列為空（SQL 結果不是文件來源）

#### Scenario: SQL fallback RAG 時回應格式一致
- **WHEN** SQL 路徑 fallback 至 RAG（`text-to-sql` step 將 `queryType` 回復為 `complex`）
- **THEN** 回應格式與正常 RAG 回應相同，trace 記錄 `sql_fallback: true`

### Requirement: QueryService 工具方法保留
`QueryService` 類別 SHALL 保留所有現有工具方法（`extractGradeFilter`、`extractLocationFilter`、`extractTypeFilter`、`getDocuments`、`buildUrl`、`buildExcerpt`、`extractTitle`、`injectRouteLinks`、`runJudge`、`logQuery`、`hashQuery` 等），供各 pipeline step import 使用。

#### Scenario: Pipeline step 使用 QueryService 工具方法
- **WHEN** `text-to-sql` step 需要從查詢文字中解析岩場 ID
- **THEN** step 透過 `ctx` 中注入的 `queryService` 實例呼叫 `extractLocationFilter(query)` 取得 crag_id

#### Scenario: search 方法保持不變
- **WHEN** 外部呼叫 `QueryService.search()` 純語義搜尋端點
- **THEN** 行為與重構前完全相同，不經過 pipeline 引擎
