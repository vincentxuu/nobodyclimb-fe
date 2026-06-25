## Requirements

### Requirement: Pipeline Step 介面定義
每個 pipeline step SHALL 實作統一的 `PipelineStep` 介面，包含 `id`（唯一識別碼，kebab-case）、`name`（顯示名稱）、`description`（描述）、`phase`（pre-retrieval / retrieval / post-retrieval / generation / evaluation）、`defaultEnabled`（預設啟用）、`defaultOrder`（預設排序）、`requires`（需要的 context 欄位）、`provides`（產出的 context 欄位）、`skipWhen`（可選的條件路由陣列，見 Requirement: Conditional Routing）及 `execute(ctx: PipelineContext): Promise<PipelineContext>` 方法。

#### Scenario: 定義一個 pipeline step
- **WHEN** 開發者建立新的 pipeline step（如 `hyde.ts`）
- **THEN** 該 step 匯出的物件包含 `id: 'hyde'`、`name: 'HyDE 假設文件生成'`、`phase: 'pre-retrieval'`、`requires: ['queryType']`、`provides: ['hydeDoc']` 及 `execute` 方法

#### Scenario: Step execute 方法接收並回傳 PipelineContext
- **WHEN** pipeline 引擎呼叫 step 的 `execute(ctx)` 方法
- **THEN** step 從 `ctx` 讀取所需輸入，執行邏輯後修改 `ctx` 並回傳同一物件

### Requirement: Pipeline Step 註冊表
系統 SHALL 維護一份 step 註冊表（`registry.ts`），包含所有可用 step 的 metadata（id、name、description、phase、defaultEnabled、defaultOrder、requires、provides、skipWhen）。註冊表 SHALL 以陣列形式匯出，按 defaultOrder 排序。

#### Scenario: 註冊表列出所有 13 個 step
- **WHEN** 系統載入 registry
- **THEN** 註冊表包含 13 個 step：semantic-cache、tool-selection、hyde、multi-query、filter-build、embedding、hybrid-search、cross-encoder、mmr、popularity-rerank、llm-generation、judge、self-reflection

#### Scenario: 從註冊表查詢 step metadata
- **WHEN** 引擎或前端需要查詢某 step 的 phase 與描述
- **THEN** 可透過 `getStepById(id)` 取得完整 metadata

### Requirement: Pipeline 設定儲存
Pipeline step 的啟用/停用與排序設定 SHALL 儲存在 `ai_config` 資料表中，key 為 `pipeline_steps`，value 為 JSON 陣列，每個元素包含 `id`（step 識別碼）、`enabled`（布林值）和 `order`（整數）。KV 快取（非語義快取）SHALL 在 pipeline engine 層級處理（pipeline 執行前檢查、執行後寫入），不作為 step。

#### Scenario: 讀取 pipeline 設定
- **WHEN** pipeline 引擎啟動或管理員 API 查詢設定
- **THEN** 從 `ai_config` 讀取 `pipeline_steps` key 的 JSON 值，解析為 step 設定陣列

#### Scenario: pipeline_steps key 不存在時使用預設值
- **WHEN** `ai_config` 中不存在 `pipeline_steps` key
- **THEN** 系統使用註冊表的 `defaultEnabled` 和 `defaultOrder` 作為預設設定，所有 13 個 step 皆啟用

#### Scenario: 更新 pipeline 設定
- **WHEN** 管理員透過 API 更新 pipeline 設定
- **THEN** 系統驗證 JSON 格式後寫入 `ai_config` 的 `pipeline_steps` key

### Requirement: Pipeline 執行引擎
系統 SHALL 提供 `PipelineEngine` 類別，負責載入設定、驗證依賴、依序執行已啟用的 step。引擎 SHALL 按 phase 順序（pre-retrieval → retrieval → post-retrieval → generation → evaluation）執行，每個 phase 內的 step 按 `order` 排序。引擎 SHALL 支援 skipWhen 條件路由（見 Requirement: Conditional Routing）、loopBack 迴圈控制（見 Requirement: Looping Pattern）、分支並行執行（見 Requirement: Branching + Fusion）及 per-step timeout（見 Requirement: Per-Step Timeout）。Step 執行失敗或超時時，引擎 SHALL 根據 step 的 phase 和降級策略決定是繼續執行、降級替代還是中止 pipeline。

#### Scenario: 正常執行 pipeline
- **WHEN** 引擎收到查詢請求
- **THEN** 載入 pipeline 設定，過濾已啟用的 step，按 phase + order 排序，依序呼叫每個 step 的 `execute(ctx)` 方法

#### Scenario: Step 設定 earlyReturn 時提前結束
- **WHEN** 某 step（如 semantic-cache 或 tool-selection 的 GK 路徑）在 `ctx` 設定 `earlyReturn`
- **THEN** 引擎停止執行後續 step，直接回傳 `ctx.earlyReturn` 作為最終結果

#### Scenario: 跳過已停用的 step
- **WHEN** 管理員停用 `hyde` step
- **THEN** 引擎在 pre-retrieval phase 執行時跳過 hyde step，其他 step 正常執行

#### Scenario: 記錄各 step 執行時間至 trace
- **WHEN** pipeline 執行完畢
- **THEN** `ctx.trace` 包含 `pipeline_execution` 欄位，記錄每個已執行 step 的 id 與 duration_ms

#### Scenario: Step 超時時根據 phase 降級
- **WHEN** 某 step 執行超過其 timeout 限制
- **THEN** 引擎捕獲 `TimeoutError`，根據該 step 的 phase 決定降級行為：pre-retrieval 階段超時跳過該增強步驟、retrieval 階段超時使用已有部分結果繼續、generation 階段超時回傳錯誤訊息，降級事件記錄於 `ctx.trace.degraded_stages`

#### Scenario: Step 超時記錄至 trace
- **WHEN** step 因超時被跳過或降級
- **THEN** `ctx.trace.pipeline_execution` 中該 step 記錄 `{ timeout: true, timeout_ms: <configured>, duration_ms: <actual>, degraded: true }`

### Requirement: Pipeline 依賴驗證
引擎 SHALL 在執行前驗證所有已啟用 step 的依賴關係：每個已啟用 step 的 `requires` 欄位中列出的 context 欄位，MUST 被某個排序在其之前的已啟用 step 的 `provides` 提供，或由 pipeline 初始化預設提供。驗證失敗時 SHALL 拋出錯誤，阻止 pipeline 啟動。

#### Scenario: 停用 embedding 但保留 hybrid-search 時驗證失敗
- **WHEN** 管理員停用 `embedding` step 但 `hybrid-search` step 仍啟用
- **THEN** 引擎驗證失敗，`hybrid-search` 的 requires 中的 `queryVector` 無法被滿足，API 回傳 400 錯誤說明依賴衝突

#### Scenario: 所有依賴滿足時驗證通過
- **WHEN** 所有已啟用 step 的 requires 都能被前置 step 的 provides 或初始化預設滿足
- **THEN** 驗證通過，pipeline 正常啟動

### Requirement: Pipeline 設定管理 API
系統 SHALL 提供管理員 API 端點讀取與更新 pipeline 設定。

#### Scenario: GET /api/v1/admin/ai/pipeline-steps 回傳設定
- **WHEN** 管理員呼叫 `GET /api/v1/admin/ai/pipeline-steps`
- **THEN** 回傳所有 step 的完整資訊：id、name、description、phase、enabled、order、requires、provides，按 phase + order 排序

#### Scenario: PUT /api/v1/admin/ai/pipeline-steps 更新設定
- **WHEN** 管理員呼叫 `PUT /api/v1/admin/ai/pipeline-steps` 帶有新的 step 設定陣列
- **THEN** 系統驗證依賴關係後儲存至 `ai_config`，回傳更新後的完整設定

#### Scenario: PUT 時依賴驗證失敗
- **WHEN** 管理員送出的設定中 `hybrid-search` 啟用但 `embedding` 停用
- **THEN** API 回傳 400 錯誤，說明依賴衝突細節，不儲存設定

### Requirement: Pipeline Flow 前端 UI
系統 SHALL 在 `/admin/ai/settings` 頁面新增「Pipeline Flow」tab，提供視覺化的 step 管理介面。

#### Scenario: 顯示所有 step 按 phase 分組
- **WHEN** 管理員開啟「Pipeline Flow」tab
- **THEN** 頁面按 5 個 phase 區段顯示所有 step 卡片，每張卡片包含 step 名稱、描述、啟用開關

#### Scenario: 切換 step 啟用/停用
- **WHEN** 管理員切換某 step 的開關
- **THEN** 頁面即時更新該 step 的啟用狀態（尚未儲存至後端）

#### Scenario: Phase 內拖拉排序
- **WHEN** 管理員在同一 phase 內拖拉 step 卡片調整順序
- **THEN** 卡片順序即時更新，order 值自動重新計算

#### Scenario: 儲存設定
- **WHEN** 管理員點擊「儲存」按鈕
- **THEN** 前端呼叫 `PUT /api/v1/admin/ai/pipeline-steps`，成功後顯示儲存成功提示

#### Scenario: 依賴衝突時顯示警告
- **WHEN** 管理員停用某 step 但有其他已啟用 step 依賴它
- **THEN** 頁面顯示警告訊息，列出受影響的 step 名稱

#### Scenario: 重設為預設
- **WHEN** 管理員點擊「重設為預設」按鈕
- **THEN** 所有 step 恢復為 registry 定義的 defaultEnabled 和 defaultOrder

### Requirement: Conditional Routing（條件路由）
引擎 SHALL 支援 `skipWhen` 條件路由機制。每個 `PipelineStep` 可宣告 `skipWhen?: SkipCondition[]` 陣列，其中 `SkipCondition` 包含 `field`（PipelineContext 欄位名）、`operator`（`'eq'` | `'neq'` | `'in'`）和 `value`。引擎在呼叫 step 的 `execute()` 前 SHALL 評估 skipWhen 條件，任一條件成立則跳過該 step。此機制取代各 step 內部硬編碼的路由檢查（如 GK early skip），使跳過邏輯集中、可追蹤。

#### Scenario: GK 路徑透過 skipWhen 跳過 RAG step
- **WHEN** `tool-selection` step 設定 `ctx.queryType = 'general-knowledge'`
- **THEN** 引擎在執行後續 step（hyde、multi-query、filter-build、embedding、hybrid-search、cross-encoder、mmr、popularity-rerank、judge、self-reflection）前評估其 `skipWhen: [{ field: 'queryType', operator: 'eq', value: 'general-knowledge' }]`，條件成立，全部跳過

#### Scenario: skipWhen 跳過記錄至 trace
- **WHEN** 某 step 因 skipWhen 條件被跳過
- **THEN** `ctx.trace.pipeline_execution` 中該 step 記錄 `{ skipped: true, reason: 'skipWhen: queryType eq general-knowledge' }`

#### Scenario: 無 skipWhen 的 step 正常執行
- **WHEN** step 未定義 skipWhen 或 skipWhen 為空陣列
- **THEN** 引擎正常呼叫該 step 的 `execute(ctx)` 方法

#### Scenario: Step 內部業務邏輯跳過不受影響
- **WHEN** `cross-encoder` step 因候選數 ≤ 1 在 execute 內部跳過
- **THEN** 此跳過邏輯保留在 step 內部，與 engine 的 skipWhen 互不干涉

### Requirement: Looping Pattern（迴圈模式）
引擎 SHALL 支援評估驅動的迭代重試機制。`PipelineContext` SHALL 包含 `loopCount: number`（初始化為 0）和 `loopBack?: { targetPhase: PipelinePhase, reason: string }` 欄位。當 step 設定 `ctx.loopBack` 後，引擎 SHALL 檢查 `loopCount < max_pipeline_loops`（從 `ai_config` 讀取，預設 1），若未超限則遞增 `loopCount`、清除 `loopBack`、清除目標 phase 的舊產出，跳回 `targetPhase` 重新執行。若超限則記錄 trace warning 並繼續正常流程。

#### Scenario: self-reflection 觸發 loopBack 重新檢索
- **WHEN** `self-reflection` step 偵測到 `groundedness < 0.5` 且 `loopCount === 0`
- **THEN** step 設定 `ctx.loopBack = { targetPhase: 'retrieval', reason: 'low-groundedness' }`，引擎遞增 loopCount 至 1，清除 retrieval 階段產出（candidateMatches、documents 等），從 retrieval phase 重新執行

#### Scenario: loopBack 超過安全限制時停止
- **WHEN** step 設定 loopBack 但 `loopCount >= max_pipeline_loops`
- **THEN** 引擎忽略 loopBack，記錄 `trace.loop_limit_reached = true`，繼續正常流程不再回跳

#### Scenario: max_pipeline_loops 設定為 0 時完全停用
- **WHEN** 管理員將 `max_pipeline_loops` 設為 0
- **THEN** 引擎永不執行 loopBack，所有 loopBack 請求被忽略

#### Scenario: 迴圈 trace 記錄
- **WHEN** loopBack 觸發並完成第二輪執行
- **THEN** `ctx.trace` 包含 `loop_history` 陣列，記錄每次 loop 的 `{ loop: number, reason: string, targetPhase: string, groundedness_before: number, groundedness_after: number }`

### Requirement: Branching + Fusion（並行分支與融合）
引擎 SHALL 支援並行分支執行與結果融合。系統 SHALL 定義 `BranchConfig` 型別包含 `id`（分支組識別碼）、`branches`（`StepId[][]`，每個內部陣列為一條分支的 step 序列）和 `fusionStep`（`StepId`，負責合併分支結果）。分支配置 SHALL 儲存在 `ai_config` 的 `pipeline_branches` key 中（預設空陣列）。引擎偵測到 step 屬於 BranchConfig 時 SHALL 為各分支建立 context 淺拷貝，`Promise.all()` 並行執行各分支，將產出存入 `ctx.branchResults`，再呼叫 fusionStep 合併結果。

#### Scenario: 並行分支執行
- **WHEN** 配置了一個 BranchConfig，branches 為 `[['vector-search'], ['bm25-search']]`，fusionStep 為 `'rrf-fusion'`
- **THEN** 引擎為兩條分支各建立 context 淺拷貝，`Promise.all()` 並行執行 vector-search 和 bm25-search，各分支產出存入 `ctx.branchResults`

#### Scenario: Fusion step 合併分支結果
- **WHEN** 所有分支執行完畢
- **THEN** 引擎呼叫 fusionStep 的 `execute(ctx)`，fusionStep 從 `ctx.branchResults` 讀取各分支產出，合併後寫回主 context 的對應欄位

#### Scenario: 無分支配置時保持線性執行
- **WHEN** `pipeline_branches` 為空陣列（預設值）
- **THEN** 引擎以線性模式執行所有 step，行為與無 Branching 功能時完全一致

#### Scenario: 分支執行 trace 記錄
- **WHEN** 分支並行執行完畢
- **THEN** `ctx.trace.pipeline_execution` 包含分支組記錄：`{ branchId: string, branches: Array<{ steps: string[], duration_ms: number }>, fusionStep: string, fusion_duration_ms: number }`

#### Scenario: 分支配置管理 API
- **WHEN** 管理員呼叫 `GET /api/v1/admin/ai/pipeline-branches`
- **THEN** 回傳目前的分支配置陣列
- **WHEN** 管理員呼叫 `PUT /api/v1/admin/ai/pipeline-branches` 帶有新的分支配置
- **THEN** 系統驗證 branch 內的 stepId 存在於 registry 後儲存，回傳更新後的配置

### Requirement: Per-Step Timeout
引擎 SHALL 為每個 step 的 `execute(ctx)` 呼叫包裝 `withTimeout()` 超時保護。每個 step 的 timeout 值 SHALL 由該 step 對應的 `ai_config` 設定決定（見 Requirement: Per-Step Timeout 配置對照表）。超時時 SHALL 拋出 `TimeoutError`，引擎根據該 step 的 phase 執行對應降級策略。注意：此機制為 per-step 層級（每個 step 各自超時），而非 per-phase 層級。

#### Scenario: HyDE step 超時
- **WHEN** `hyde` step 執行超過 `hyde_timeout_ms`（預設 5000ms）
- **THEN** 引擎捕獲 TimeoutError，跳過 HyDE 增強，pipeline 使用原始查詢繼續，`ctx.trace.degraded_stages` 記錄 `'hyde'`

#### Scenario: Multi-Query step 超時
- **WHEN** `multi-query` step 執行超過 `multi_query_timeout_ms`（預設 5000ms）
- **THEN** 引擎捕獲 TimeoutError，跳過多查詢擴展，pipeline 使用原始查詢繼續，`ctx.trace.degraded_stages` 記錄 `'multi-query'`

#### Scenario: Embedding step 超時
- **WHEN** `embedding` step 執行超過 `embedding_timeout_ms`（預設 3000ms）
- **THEN** 引擎捕獲 TimeoutError，設定 `ctx.embeddingFailed = true`，後續 `hybrid-search` 僅使用 BM25 路徑

#### Scenario: Hybrid-Search step 超時
- **WHEN** `hybrid-search` step 執行超過 `search_timeout_ms`（預設 4000ms）
- **THEN** 引擎捕獲 TimeoutError，使用已完成的部分搜尋結果繼續（Vector 或 BM25 之一），若無結果則 pipeline 以 0 筆文件進入生成

#### Scenario: LLM-Generation step 超時
- **WHEN** `llm-generation` step 執行超過 `generation_timeout_ms`（預設 12000ms）
- **THEN** 引擎捕獲 TimeoutError，設定 `ctx.answer` 為超時錯誤訊息，pipeline 不再執行 evaluation phase

#### Scenario: Evaluation step 超時不影響回應
- **WHEN** `judge` 或 `self-reflection` step 超時（`judge_timeout_ms` 預設 8000ms，已存在）
- **THEN** 引擎跳過評估，使用已有的生成結果作為最終回應，不影響用戶體驗

### Requirement: Per-Step Timeout 配置對照表
各 step 的 timeout SHALL 從 `ai_config` 動態載入，支援在線上調整。每個 step 對應的 config key 如下：

| Step ID | Config Key | 預設值 | 範圍 | 說明 |
|---------|-----------|--------|------|------|
| `hyde` | `hyde_timeout_ms` | 5000 | 2000-10000 | HyDE 假設文件生成 |
| `multi-query` | `multi_query_timeout_ms` | 5000 | 2000-10000 | Multi-Query 擴展 |
| `embedding` | `embedding_timeout_ms` | 3000 | 1000-10000 | 向量嵌入 |
| `hybrid-search` | `search_timeout_ms` | 4000 | 1000-10000 | 混合搜尋（Vector + BM25）|
| `llm-generation` | `generation_timeout_ms` | 12000 | 5000-20000 | 主 LLM 生成 |
| `judge` | `judge_timeout_ms` | 8000 | 1000-30000 | LLM Judge（已存在）|
| `self-reflection` | `judge_timeout_ms` | 8000 | 1000-30000 | 共用 Judge timeout |
| 其他 step | 無獨立設定 | 不限制 | — | 通常 < 100ms，不需 timeout |

#### Scenario: 預設超時配置
- **WHEN** `ai_config` 中無對應 timeout 設定
- **THEN** 使用上表預設值；未列出的 step 不包裝 timeout

#### Scenario: 管理員調整 generation timeout
- **WHEN** 管理員將 `generation_timeout_ms` 從 12000 改為 15000
- **THEN** 後續 `llm-generation` step 在 15 秒後才會超時

#### Scenario: 配置值超出範圍時使用預設值
- **WHEN** 管理員將 `embedding_timeout_ms` 設為 500（低於範圍下限 1000）
- **THEN** 系統使用預設值 3000ms，忽略不合法的配置值

### Requirement: LangGraph engine post-processing
LangGraph 引擎（`runAIGraph`）在 graph invoke 完成後，對於非 earlyReturn 路徑，SHALL 執行與舊引擎 `postPipelineProcessing` 等價的後處理，包含 logQuery、KV 快取寫入、finalResponse 組裝。

#### Scenario: RAG 路徑回傳完整 finalResponse
- **WHEN** LangGraph 引擎處理 RAG 查詢（queryType 為 simple/complex/hybrid）且無 earlyReturn
- **THEN** `runAIGraph` 回傳的 PipelineContext MUST 包含 `finalResponse`，其中 `answer`、`sources`、`query_id`、`suggested_questions` 均為有效值

#### Scenario: Query 記錄寫入 ai_query_logs
- **WHEN** LangGraph 引擎處理任何非 earlyReturn 的 RAG 查詢
- **THEN** MUST 呼叫 `queryService.logQuery()` 將 query、response、sources、latencyMs、tokenCount 等寫入 `ai_query_logs`

#### Scenario: KV 快取寫入
- **WHEN** LangGraph 引擎產生非錯誤回答
- **THEN** MUST 將完整回應寫入 KV 快取（`env.CACHE.put`）

#### Scenario: earlyReturn 路徑不重複處理
- **WHEN** graph 執行中已設定 `earlyReturn`（GK、text-to-sql）
- **THEN** post-processing SHALL 跳過，避免重複 logQuery 和快取寫入

### Requirement: popularityRerankNode 回傳 context 和 sources
`popularityRerankNode` SHALL 回傳組裝好的 `context`（含影片數量文字）和 `sources`（含 `latestVideoUrl`），供下游 `llmGenerationNode` 使用。

#### Scenario: Baseline graph LLM 接收完整 context
- **WHEN** baseline graph 經過 popularityRerank 後進入 llmGeneration
- **THEN** `state.context` MUST 包含排序後的路線/岩場文字資料，且路線資料 MUST 包含影片數量（若有）

#### Scenario: Sources 包含影片連結
- **WHEN** popularityRerankNode 處理有影片的路線
- **THEN** 回傳的 `sources` 陣列中對應 source 的 `latestVideoUrl` MUST 為影片 URL

### Requirement: Streaming 模式 async Judge
LangGraph 引擎在 streaming 模式下，SHALL 透過 `waitUntil` 異步執行 Judge 評估。

#### Scenario: Streaming 回應的 groundedness 評估
- **WHEN** streaming 模式完成 LLM generation
- **THEN** MUST 在 `waitUntil` 中異步執行 `queryService.runJudge()`，並將 groundedness/quality 分數更新到 `ai_query_logs`

### Requirement: Streaming done 事件包含正確資料
Streaming 模式的 `done` SSE 事件 SHALL 包含處理後的 `answer`（已去除 `---SUGGESTIONS---`）、`sources`、`suggested_questions`、`query_id`。

#### Scenario: done 事件的 suggested_questions
- **WHEN** LLM 回應包含 `---SUGGESTIONS---` 分隔符
- **THEN** `done` 事件的 `suggested_questions` MUST 為解析後的問題陣列，`answer` MUST 不包含 `---SUGGESTIONS---` 及其後內容

### Requirement: 已攀路線排除
LangGraph 引擎的 `popularityRerankNode` SHALL 支援過濾已攀路線。

#### Scenario: 推薦時排除已攀路線
- **WHEN** `state.climbed_route_ids` 包含特定路線 ID
- **THEN** `popularityRerankNode` 組裝的 context 和 sources MUST 不包含這些路線

### Requirement: Token breakdown 彙總與 phase latency
LangGraph 引擎 SHALL 在 post-processing 中彙總 token breakdown 並計算 phase latency。

#### Scenario: Token 成本追蹤
- **WHEN** LangGraph 引擎完成 RAG 查詢
- **THEN** `ai_query_logs.token_count` MUST 反映所有階段的 token 總和

### Requirement: Low groundedness flagging
LangGraph 引擎 SHALL 在 groundedness 低於閾值時標記回應。

#### Scenario: 低品質回答標記
- **WHEN** Judge 評估的 groundedness < `pipelineConfig.groundedness_flag_threshold`
- **THEN** MUST 呼叫 `queryService.flagResponse(queryId, "low_groundedness")`
