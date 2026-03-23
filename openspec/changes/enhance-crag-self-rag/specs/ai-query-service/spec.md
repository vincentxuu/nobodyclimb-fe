## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。Pipeline trace SHALL 記錄 reranker 過濾數量和 Tool Selection 信心分數。

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

## ADDED Requirements

### Requirement: 清理 SELF_REFLECTION_PROMPT 死碼
系統 SHALL 移除與 `SELF_REFLECTION_PROMPT` 相關的所有程式碼。Self-reflection 功能已由 `pipeline/steps/self-reflection.ts` 的 Judge + loopBack 機制完整取代，原始 YES/NO 評估 prompt 不再被任何 pipeline step 執行。清理範圍涵蓋常量定義、import、resolvePrompt 註冊、及管理後台條目。

#### Scenario: ai-prompts.ts 常量移除
- **WHEN** 檢視 `backend/src/utils/ai-prompts.ts` 原始碼
- **THEN** 檔案中不包含 `SELF_REFLECTION_PROMPT` 的匯出定義

#### Scenario: query.ts 的 resolvePrompt 註冊移除
- **WHEN** 檢視 `backend/src/services/query.ts` 的 prompts 建構邏輯
- **THEN** 不再包含 `SELF_REFLECTION_PROMPT` 的 `resolvePrompt()` 呼叫和 import

#### Scenario: admin-ai.ts 管理後台條目移除
- **WHEN** 檢視 `backend/src/routes/admin-ai.ts` 的 prompt 管理清單
- **THEN** 不再包含 `SELF_REFLECTION_PROMPT` 的 import 和管理後台展示條目

#### Scenario: ai_prompts DB 表無引用
- **WHEN** 查詢 `ai_prompts` 表中 prompt_key 為 `self_reflection_prompt` 的記錄
- **THEN** 無相關記錄（若存在則一併移除）

### Requirement: Pipeline Trace 擴充記錄
系統 SHALL 在 `pipelineTrace` 中擴充記錄 reranker 過濾數量和 Tool Selection 信心分數，供後續分析和監控使用。欄位命名統一如下。

#### Scenario: Trace 記錄 reranker 過濾資訊
- **WHEN** Cross-Encoder Reranking 後執行閾值過濾
- **THEN** `trace.retrieval.reranker` 包含 `filtered_count`（被過濾的文件數）和 `threshold_used`（使用的閾值）欄位

#### Scenario: Trace 記錄 Tool Selection 信心
- **WHEN** Tool Selection 完成（含 LLM 回傳 confidence）
- **THEN** `trace.query_parsing` 包含 `confidence`（0.0-1.0 信心分數）和 `confidence_fallback`（布林值，是否觸發降級）欄位；`trace.tool_selection` 包含 `selected_tool`、`confidence`、`alternative`（若有）欄位

### Requirement: PipelineConfig 新增配置欄位
`PipelineConfig` 類型 SHALL 新增以下欄位以支援 reranker 閾值過濾和 Tool Selection 信心 fallback，值來源為 `ai_config` DB 表。

#### Scenario: PipelineConfig 包含 reranker 閾值欄位
- **WHEN** Pipeline Engine 載入 `PipelineConfig`
- **THEN** 配置包含 `reranker_relevance_threshold`（number，預設 0.3）和 `reranker_min_keep`（number，預設 2）

#### Scenario: PipelineConfig 包含 Tool Selection 信心閾值
- **WHEN** Pipeline Engine 載入 `PipelineConfig`
- **THEN** 配置包含 `tool_confidence_threshold`（number，預設 0.7）

### Requirement: ai_config DB Migration
系統 SHALL 新增 D1 migration 在 `ai_config` 表中插入 3 個新配置項，確保現有部署無需手動設定即可使用預設值。

#### Scenario: Migration 新增 reranker 配置
- **WHEN** 執行 migration
- **THEN** `ai_config` 表新增 `reranker_relevance_threshold`（預設 `'0.3'`）和 `reranker_min_keep`（預設 `'2'`）

#### Scenario: Migration 新增 Tool Selection 信心配置
- **WHEN** 執行 migration
- **THEN** `ai_config` 表新增 `tool_confidence_threshold`（預設 `'0.7'`）

#### Scenario: Migration 可安全 rollback
- **WHEN** 需要回退 migration
- **THEN** 刪除 `ai_config` 表中 `key` 為 `reranker_relevance_threshold`、`reranker_min_keep`、`tool_confidence_threshold` 的記錄
