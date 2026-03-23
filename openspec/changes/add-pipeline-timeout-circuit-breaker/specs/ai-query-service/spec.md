## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。`ask()` 和 `askStream()` SHALL 受整體 pipeline timeout 保護（`pipeline_timeout_ms`），超時時回傳標準錯誤回應並退還用戶配額。Pipeline 執行前 SHALL 檢查 Circuit Breaker 狀態，Open 狀態時直接拒絕請求。

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

#### Scenario: Pipeline 整體超時
- **WHEN** `PipelineEngine.run()` 執行時間超過 `pipeline_timeout_ms`（預設 20000ms）
- **THEN** `ask()` 中的 `Promise.race` 觸發 `TimeoutError`，回傳 408 錯誤（`error: "pipeline_timeout"`）「查詢處理超時，請稍後再試」，退還已扣除的用戶配額，`ai_query_logs` 記錄 `timeout: true`

#### Scenario: Pipeline 超時時串流模式處理
- **WHEN** `askStream()` 執行中 pipeline 超時
- **THEN** 推送 `{ type: 'error', message: '查詢處理超時，請稍後再試' }` 事件後關閉串流，退還配額

#### Scenario: Circuit Breaker Open 時拒絕查詢
- **WHEN** 用戶發送 AI 查詢，但 Circuit Breaker 為 Open 狀態
- **THEN** `ask()` 不執行 pipeline，直接回傳 503 錯誤「AI 服務暫時不可用，請稍後再試」，不扣除配額

## ADDED Requirements

### Requirement: Pipeline 超時配置
`QueryService` SHALL 從 `ai_config` 載入 `pipeline_timeout_ms` 設定（預設 20000，範圍 10000-25000），作為 `ask()` / `askStream()` 的整體超時限制。

#### Scenario: 使用預設超時值
- **WHEN** `ai_config` 中無 `pipeline_timeout_ms` 設定
- **THEN** 使用預設值 20000ms

#### Scenario: 管理員調整超時值
- **WHEN** 管理員將 `pipeline_timeout_ms` 設為 15000
- **THEN** 後續查詢在 15 秒後超時

#### Scenario: 配置值超出範圍時使用預設值
- **WHEN** 管理員將 `pipeline_timeout_ms` 設為 5000（低於範圍下限 10000）
- **THEN** 系統使用預設值 20000ms，忽略不合法的配置值

### Requirement: Graceful Degradation（超時降級）
Pipeline 各階段超時時 SHALL 嘗試降級而非整體失敗。降級事件 SHALL 記錄於 `pipelineTrace.degraded_stages` 陣列，降級回應 SHALL 在回應中加上 `degraded: true` 標記。

#### Scenario: Embedding 超時降級為 BM25
- **WHEN** Embedding 階段超過 `embedding_timeout_ms` 超時
- **THEN** Pipeline 跳過向量搜尋，僅使用 BM25 關鍵字檢索繼續後續生成，`degraded_stages` 記錄 `'embedding'`

#### Scenario: Vector Search 超時用 BM25 結果繼續
- **WHEN** Vectorize 查詢超過 `search_timeout_ms` 超時，但 BM25 已有結果
- **THEN** Pipeline 使用 BM25 結果繼續生成，`degraded_stages` 記錄 `'vector-search'`

#### Scenario: BM25 超時用 Vector 結果繼續
- **WHEN** D1 FTS5 查詢超過 `search_timeout_ms` 超時，但 Vector Search 已有結果
- **THEN** Pipeline 使用 Vector 結果繼續生成，`degraded_stages` 記錄 `'bm25-search'`

#### Scenario: HyDE 超時跳過增強
- **WHEN** HyDE 超過 `hyde_timeout_ms` 超時
- **THEN** Pipeline 跳過 HyDE 增強，使用原始查詢繼續，`degraded_stages` 記錄 `'hyde'`

#### Scenario: Multi-Query 超時跳過增強
- **WHEN** Multi-Query Expansion 超過 `multi_query_timeout_ms` 超時
- **THEN** Pipeline 跳過多查詢擴展，使用原始查詢繼續，`degraded_stages` 記錄 `'multi-query'`

#### Scenario: 主 LLM Generation 超時
- **WHEN** 主 LLM 生成超過 `generation_timeout_ms` 超時
- **THEN** 回傳「系統忙碌，請稍後再試」訊息，退還配額，`degraded_stages` 記錄 `'llm-generation'`

#### Scenario: 降級回應標記
- **WHEN** 任何階段發生降級
- **THEN** API 回應包含 `degraded: true` 和 `degraded_stages` 陣列，前端可顯示「此回應可能不完整」提示

### Requirement: AbortController 整合
`QueryService.ask()` SHALL 在入口建立頂層 `AbortController`，將 `signal` 傳入各階段。Pipeline 超時或 SSE 斷線時 SHALL 呼叫 `controller.abort()` 取消進行中的底層請求。

#### Scenario: Pipeline 超時觸發 abort
- **WHEN** Pipeline 整體超時觸發
- **THEN** `controller.abort()` 被呼叫，所有支援 AbortSignal 的進行中請求被取消

#### Scenario: SSE 斷線觸發 abort
- **WHEN** 串流模式下客戶端斷線
- **THEN** `controller.abort()` 被呼叫，進行中的 LLM generation 被取消，不繼續消耗資源

#### Scenario: 底層 API 不支援 AbortSignal
- **WHEN** `env.AI.run()` 或 `env.VECTOR_INDEX.query()` 不支援 AbortSignal
- **THEN** `Promise.race` 仍確保超時生效，底層請求會自然完成但結果被忽略

### Requirement: 超時工具函式
系統 SHALL 提供通用 `withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T>` 工具函式。超時時 SHALL 拋出 `TimeoutError`（含 label 和 ms 資訊）。

#### Scenario: 正常完成
- **WHEN** promise 在 ms 內 resolve
- **THEN** `withTimeout` 回傳 promise 的結果

#### Scenario: 超時拋出 TimeoutError
- **WHEN** promise 未在 ms 內完成
- **THEN** `withTimeout` 拋出 `TimeoutError`，message 包含 label 和超時毫秒數
