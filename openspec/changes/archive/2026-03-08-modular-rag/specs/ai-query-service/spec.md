## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。

#### Scenario: 透過 pipeline 引擎執行 RAG 查詢
- **WHEN** 使用者詢問「龍洞有什麼 5.10 的路線？」
- **THEN** `QueryService.ask()` 建立 PipelineContext（含 `queryService` 實例）後呼叫 `PipelineEngine.run()`，引擎先檢查 KV 快取，未命中則依序執行已啟用的 step（semantic-cache → tool-selection → hyde → multi-query → filter-build → embedding → hybrid-search → cross-encoder → mmr → popularity-rerank → llm-generation → judge → self-reflection），最終寫入 KV 快取並回傳包含答案、來源和 query_id 的回應

#### Scenario: 回傳包含來源的答案
- **WHEN** RAG 查詢成功完成
- **THEN** 回應包含：答案文字、包含 id/type/title/url/score 的來源陣列，以及 query_id

#### Scenario: 輸入驗證失敗時中止查詢
- **WHEN** 輸入 guardrails 偵測到惡意模式
- **THEN** `QueryService.ask()` 拋出 `GuardrailError`，上層路由返回 400，不進行後續 RAG 步驟

#### Scenario: 已登入用戶查詢時注入個人化 context
- **WHEN** 已登入用戶發送查詢，且有記憶或完攀紀錄
- **THEN** PipelineContext 包含用戶記憶摘要、完攀紀錄與 `queryService` 實例，LLM 生成 step 使用個人化 system prompt

#### Scenario: Step 被停用時跳過對應功能
- **WHEN** 管理員停用 `hyde` step 後使用者發送查詢
- **THEN** pipeline 跳過 HyDE 假設文件生成，直接使用原始 query 進行向量搜尋，不影響最終回應格式

#### Scenario: Step 被停用時 trace 記錄跳過原因
- **WHEN** 某 step 被停用
- **THEN** `ctx.trace.pipeline_execution` 中該 step 的記錄顯示 `skipped: true, reason: 'disabled'`

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

### Requirement: QueryService 工具方法保留
`QueryService` 類別 SHALL 保留所有現有工具方法（`extractGradeFilter`、`extractLocationFilter`、`extractTypeFilter`、`getDocuments`、`buildUrl`、`buildExcerpt`、`extractTitle`、`injectRouteLinks`、`runJudge`、`logQuery`、`hashQuery` 等），供各 pipeline step import 使用。

#### Scenario: Pipeline step 使用 QueryService 工具方法
- **WHEN** `filter-build` step 需要從查詢文字中偵測難度
- **THEN** step 透過 `ctx` 中注入的 `queryService` 實例呼叫 `extractGradeFilter(query)` 取得難度範圍

#### Scenario: search 方法保持不變
- **WHEN** 外部呼叫 `QueryService.search()` 純語義搜尋端點
- **THEN** 行為與重構前完全相同，不經過 pipeline 引擎
