## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。`QueryService` SHALL 提供 `planQuery()`（查詢分解為子任務計畫）、`executePlan()`（並行/循序執行子任務檢索）和 `synthesize()`（智慧合併多源檢索結果為結構化 context，非最終答案）方法，供 Plan-and-Execute 策略的 pipeline step 呼叫。

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

#### Scenario: Plan-and-Execute 策略使用 QueryService 方法
- **WHEN** `hybrid-search` 步驟選擇 Plan-and-Execute 策略（`rag_strategy` 為 `plan-execute` 或 `auto` 且 `strategy_hint` 為 `plan-execute`）
- **THEN** 步驟呼叫 `ctx.queryService.planQuery()` 生成計畫、`ctx.queryService.executePlan()` 執行子任務檢索、`ctx.queryService.synthesize()` 智慧合併檢索結果為結構化 context，設定 `ctx.context`、`ctx.sources` 和 `ctx.skipPostRetrieval = true`，供下游 `llm-generation` 步驟生成最終回答

## ADDED Requirements

### Requirement: rag_strategy 配置擴充
`PipelineConfig` 的 `rag_strategy` 欄位 SHALL 支援四種值：`'baseline'`（預設，單次檢索）、`'agentic'`（ReAct 多步決策）、`'plan-execute'`（Plan-and-Execute 計畫式執行）、`'auto'`（根據查詢特性自動選擇）。`loadPipelineConfig()` 讀取 `ai_config` 的 `rag_strategy` 值時，無效值 SHALL fallback 為 `'baseline'`。

#### Scenario: 讀取 plan-execute 策略配置
- **WHEN** `ai_config` 中 `rag_strategy` 為 `'plan-execute'`
- **THEN** `loadPipelineConfig()` 回傳的 `cfg.rag_strategy` 為 `'plan-execute'`

#### Scenario: 讀取 auto 策略配置
- **WHEN** `ai_config` 中 `rag_strategy` 為 `'auto'`
- **THEN** `loadPipelineConfig()` 回傳的 `cfg.rag_strategy` 為 `'auto'`

#### Scenario: 無效值 fallback
- **WHEN** `ai_config` 中 `rag_strategy` 為 `'invalid'`
- **THEN** `loadPipelineConfig()` 回傳的 `cfg.rag_strategy` 為 `'baseline'`

### Requirement: Plan-and-Execute 配置項載入
`loadPipelineConfig()` SHALL 新增載入以下配置項：`plan_execute_max_steps`（預設 4，範圍 2-6）、`plan_execute_min_entities`（預設 2，範圍 2-5）、`planning_timeout_ms`（預設 5000，範圍 3000-10000）、`synthesis_timeout_ms`（預設 8000，範圍 5000-15000）、`plan_step_timeout_ms`（預設 6000，範圍 3000-10000）、`adaptive_plan_enabled`（預設 true）。

#### Scenario: 載入 Plan-and-Execute 配置
- **WHEN** `loadPipelineConfig()` 執行
- **THEN** 回傳的 `PipelineConfig` 包含 `plan_execute_max_steps`、`plan_execute_min_entities`、`planning_timeout_ms`、`synthesis_timeout_ms`、`plan_step_timeout_ms`、`adaptive_plan_enabled` 欄位，各使用 `num()` 驗證範圍

#### Scenario: 配置項不存在時使用預設值
- **WHEN** `ai_config` 中不存在 `plan_execute_max_steps` key
- **THEN** 使用預設值 4
