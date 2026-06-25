## MODIFIED Requirements

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

## ADDED Requirements

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
