## ADDED Requirements

### Requirement: Planning 階段 — 查詢分解與計畫生成
系統 SHALL 提供 `planQuery()` 方法，使用強模型（`cfg.llm_model`）分析查詢結構，將多實體/多面向的 complex 查詢分解為有依賴關係的子任務清單。每個子任務 SHALL 包含 `id`（流水號）、`query`（子查詢文字）、`tool`（檢索工具名稱）、`filters`（過濾條件）和 `depends_on`（前置子任務 id 陣列）。計畫 SHALL 同時指定 `execution_mode`（`parallel` / `sequential` / `mixed`）。

#### Scenario: 多實體比較查詢的計畫生成
- **WHEN** 使用者查詢「比較龍洞、大砲岩和關子嶺的 5.10 路線」
- **THEN** `planQuery()` 生成 3 個並行子任務，各查詢一個岩場的 5.10 路線，`execution_mode` 為 `parallel`，每個子任務 `depends_on` 為空陣列

#### Scenario: 有依賴的多步查詢計畫
- **WHEN** 使用者查詢「龍洞最熱門的路線是哪條？那條路線的難度適合初學者嗎？」
- **THEN** `planQuery()` 生成 2 個子任務：第一個查詢龍洞熱門路線（`depends_on: []`），第二個分析該路線適合性（`depends_on: [1]`），`execution_mode` 為 `sequential`

#### Scenario: Planning 子任務數量上限
- **WHEN** 查詢可分解為超過 `plan_execute_max_steps`（預設 4）個子任務
- **THEN** `planQuery()` 限制輸出最多 `plan_execute_max_steps` 個子任務，合併相似的子查詢

#### Scenario: Planning JSON 解析失敗時 fallback
- **WHEN** LLM 回傳的 planning 結果無法解析為有效 JSON
- **THEN** 系統 fallback 到 ReAct 策略（`agenticRetrieve()`），在 `pipelineTrace` 記錄 `plan_fallback: 'json_parse_error'`

#### Scenario: Planning 超時時 fallback
- **WHEN** `planQuery()` 執行時間超過 `planning_timeout_ms`（預設 5000ms）
- **THEN** 系統 fallback 到 ReAct 策略，在 `pipelineTrace` 記錄 `plan_fallback: 'timeout'`

### Requirement: Execution 階段 — 子任務並行/循序執行
系統 SHALL 提供 `executePlan()` 方法，按計畫的 `execution_mode` 和 `depends_on` 依賴關係執行子任務。無依賴的子任務 SHALL 使用 `Promise.all()` 並行執行。每個子任務 SHALL 直接呼叫 `QueryService` 的 embedding + vector search + BM25 方法進行檢索，不遞迴呼叫完整 pipeline。

#### Scenario: 並行執行無依賴的子任務
- **WHEN** 計畫包含 3 個 `depends_on: []` 的子任務
- **THEN** `executePlan()` 使用 `Promise.all()` 同時執行 3 個子任務的檢索，各子任務獨立 embed + vector search + BM25

#### Scenario: 循序執行有依賴的子任務
- **WHEN** 子任務 2 的 `depends_on` 包含子任務 1 的 id
- **THEN** `executePlan()` 先執行子任務 1，完成後將結果注入子任務 2 的 context，再執行子任務 2

#### Scenario: 混合模式執行
- **WHEN** `execution_mode` 為 `mixed`，子任務 1、2 無依賴，子任務 3 依賴子任務 1
- **THEN** `executePlan()` 先 `Promise.all()` 並行執行子任務 1 和 2，子任務 1 完成後再執行子任務 3

#### Scenario: 子任務超時時跳過
- **WHEN** 某子任務執行時間超過 `plan_step_timeout_ms`（預設 6000ms）
- **THEN** 該子任務標記為 `timed_out`，跳過其結果，不阻塞其他子任務，依賴該子任務的後續子任務也跳過

#### Scenario: 子任務使用指定工具
- **WHEN** 子任務指定 `tool: 'sql_query'`，`filters: { crag_name: '龍洞' }`
- **THEN** `executePlan()` 呼叫 `TextToSqlService` 執行對應 SQL 模板查詢，而非向量檢索

### Requirement: Adaptive Plan — 子任務失敗時動態修改計畫
系統 SHALL 支援 Adaptive Plan 機制：當某子任務檢索結果為 0 筆時，可動態修改剩餘未執行的子任務。Adaptive Plan SHALL 透過 `adaptive_plan_enabled` 配置控制（預設 `true`），最多觸發 1 次 replan。

#### Scenario: 子任務結果為空時觸發 replan
- **WHEN** 某子任務執行後結果為 0 筆，且尚未觸發過 replan
- **THEN** 系統使用輕量模型（`cfg.lightweight_model`）快速評估是否需要修改計畫，若需要則生成替代子任務（如放寬過濾條件或切換工具），替換尚未執行的子任務

#### Scenario: Replan 限制最多 1 次
- **WHEN** 已經觸發過一次 replan 後，另一個子任務又結果為空
- **THEN** 系統不再觸發 replan，使用已有結果繼續 synthesis 階段

#### Scenario: Adaptive Plan 停用
- **WHEN** `adaptive_plan_enabled` 設為 `false`
- **THEN** 子任務結果為空時不觸發 replan，直接使用所有已完成子任務的結果進行 synthesis

#### Scenario: Replan 記錄至 trace
- **WHEN** replan 被觸發
- **THEN** `pipelineTrace` 記錄 `adaptive_replan: { trigger_step_id: number, reason: string, new_steps: [...] }`

### Requirement: Synthesis 階段 — 多源結果智慧合併
系統 SHALL 提供 `synthesize()` 方法，使用強模型（`cfg.llm_model`）將所有子任務的檢索結果智慧合併為結構化 context。`synthesize()` SHALL 負責組織 context 結構（按實體分段、標註來源、處理矛盾資訊），但 SHALL NOT 生成最終回答——最終回答由下游 `llm-generation` 步驟統一生成。

#### Scenario: 合併多岩場比較的檢索結果
- **WHEN** 3 個子任務分別回傳龍洞、大砲岩、關子嶺的 5.10 路線檢索結果
- **THEN** `synthesize()` 將結果按岩場分段組織為結構化 context（如「【龍洞】路線A 5.10a...【大砲岩】路線B 5.10b...」），保留各路線的 source_id 引用，設定 `ctx.context` 和 `ctx.sources`

#### Scenario: 處理部分子任務失敗
- **WHEN** 3 個子任務中有 1 個超時或結果為空
- **THEN** `synthesize()` 基於 2 個成功子任務的結果組織 context，在 context 中標註第三個岩場的資訊暫時無法取得

#### Scenario: Synthesis 超時時降級
- **WHEN** `synthesize()` 執行時間超過 `synthesis_timeout_ms`（預設 8000ms）
- **THEN** 系統將所有子任務的原始檢索結果直接串接為 context，交給下游 `llm-generation` 步驟生成回答

#### Scenario: Synthesis 輸出結構
- **WHEN** `synthesize()` 成功完成
- **THEN** 設定 `ctx.context`（結構化 context 字串）和 `ctx.sources`（sources 陣列，包含 id、type、title、url、score），格式與現有 `popularity-rerank` 步驟的產出相容，供下游 `llm-generation`（生成回答）和 `judge`（品質評估）步驟使用

#### Scenario: SQL 與向量檢索混合結果處理
- **WHEN** 子任務結果混合 SQL 查詢結果（無 embedding 向量）和向量檢索結果
- **THEN** `synthesize()` 統一將兩類結果轉換為文字 context，SQL 結果中的結構化資料（如統計數字）以自然語言描述嵌入 context

### Requirement: Plan-and-Execute 配置管理
系統 SHALL 在 `ai_config` 表中新增 Plan-and-Execute 相關配置項，所有配置可透過現有 Admin API 動態調整。

#### Scenario: 預設配置值
- **WHEN** 系統初始化或配置項不存在
- **THEN** 使用以下預設值：`plan_execute_max_steps: 4`（範圍 2-6）、`plan_execute_min_entities: 2`（範圍 2-5）、`planning_timeout_ms: 5000`（範圍 3000-10000）、`synthesis_timeout_ms: 8000`（範圍 5000-15000）、`plan_step_timeout_ms: 6000`（範圍 3000-10000）、`adaptive_plan_enabled: true`

#### Scenario: 透過 Admin API 調整配置
- **WHEN** 管理員更新 `plan_execute_max_steps` 為 3
- **THEN** 後續所有 Plan-and-Execute 查詢的最大子任務數限制為 3

### Requirement: Plan-and-Execute Trace 記錄
系統 SHALL 在 `pipelineTrace` 中完整記錄 Plan-and-Execute 執行過程，供可觀測性和除錯使用。

#### Scenario: 完整 trace 記錄
- **WHEN** Plan-and-Execute 策略執行完畢
- **THEN** `pipelineTrace` 包含 `plan_execute` 物件，記錄：`strategy: 'plan-execute'`、`plan`（計畫內容）、`planning_duration_ms`、`steps`（每個子任務的 query、tool、results_count、duration_ms、status）、`synthesis_duration_ms`、`total_duration_ms`、`adaptive_replan`（若有觸發）

#### Scenario: Fallback 時記錄原因
- **WHEN** Plan-and-Execute 因 planning 失敗而 fallback 到 ReAct
- **THEN** `pipelineTrace` 包含 `plan_execute: { strategy: 'plan-execute', plan_fallback: 'json_parse_error' | 'timeout', fallback_to: 'agentic' }`

### Requirement: PLANNING_PROMPT 提示詞模板
系統 SHALL 提供 `PLANNING_PROMPT` 提示詞模板，用於 `planQuery()` 方法。模板 SHALL 支援 `ai_prompts` DB 管理，可動態覆寫。

#### Scenario: Prompt 模板結構
- **WHEN** `planQuery()` 呼叫 LLM
- **THEN** 使用 `PLANNING_PROMPT` 模板，模板包含：使用者查詢、可用工具清單（5 個）、已知岩場/區域清單、few-shot 範例（至少 2 個），要求 LLM 輸出結構化 JSON 計畫

#### Scenario: DB prompt 覆寫
- **WHEN** `ai_prompts` 表中存在 key 為 `PLANNING_PROMPT` 的記錄
- **THEN** 使用 DB 中的版本取代程式碼中的預設模板

### Requirement: SYNTHESIS_PROMPT 提示詞模板
系統 SHALL 提供 `SYNTHESIS_PROMPT` 提示詞模板，用於 `synthesize()` 方法。模板 SHALL 支援 `ai_prompts` DB 管理，可動態覆寫。

#### Scenario: Prompt 模板結構
- **WHEN** `synthesize()` 呼叫 LLM
- **THEN** 使用 `SYNTHESIS_PROMPT` 模板，模板包含：原始使用者查詢、各子任務的查詢和檢索結果、指示合併策略（比較型/聚合型/補充型），要求 LLM 輸出結構化 context（非最終答案）

#### Scenario: DB prompt 覆寫
- **WHEN** `ai_prompts` 表中存在 key 為 `SYNTHESIS_PROMPT` 的記錄
- **THEN** 使用 DB 中的版本取代程式碼中的預設模板

### Requirement: SSE Streaming 模式相容性
Plan-and-Execute 策略 SHALL 與現有 SSE Streaming 模式（`askStream()`）相容。planning 和 execution 階段為非串流，synthesis 產出的結構化 context 交給 `llm-generation` 步驟進行串流生成。

#### Scenario: Streaming 模式下的 Plan-and-Execute
- **WHEN** 使用者以 `?stream=true` 發送多實體比較查詢，且策略為 Plan-and-Execute
- **THEN** planning 和 execution 階段不產出串流 token，完成後將結構化 context 設定至 `ctx.context`，`llm-generation` 步驟以 SSE 串流方式生成最終回答

#### Scenario: Streaming 模式下的 time to first token
- **WHEN** Plan-and-Execute 策略在 streaming 模式下執行
- **THEN** time to first token 比 baseline 模式延長（因 planning + execution 階段），但 LLM 生成開始後串流行為與 baseline 一致

### Requirement: Plan-and-Execute 下游 reranking 行為
Plan-and-Execute 策略的 `synthesize()` 產出 SHALL 設定 `ctx.context` 和 `ctx.sources`，跳過下游的 `cross-encoder`、`mmr`、`popularity-rerank` 步驟（因 synthesize 已完成結果組織），直接進入 `llm-generation` 步驟。

#### Scenario: 跳過 post-retrieval 步驟
- **WHEN** Plan-and-Execute 的 `synthesize()` 成功完成
- **THEN** `hybrid-search` 步驟設定 `ctx.skipPostRetrieval = true`，下游 cross-encoder、mmr、popularity-rerank 步驟偵測到此旗標後跳過執行

#### Scenario: Synthesis 失敗時不跳過 post-retrieval
- **WHEN** `synthesize()` 超時，改用原始檢索結果串接
- **THEN** `ctx.skipPostRetrieval` 不設定，下游 reranking 步驟照常執行

### Requirement: 策略自動選擇
當 `rag_strategy` 設為 `'auto'` 時，系統 SHALL 根據 tool-selection 步驟輸出的 `strategy_hint` 自動選擇 RAG 策略。策略選擇 SHALL 基於查詢特性：`simple` → baseline、探索性 `complex` → ReAct、結構化多實體 `complex` → Plan-and-Execute、`sql`/`hybrid`/`general-knowledge` → baseline。

#### Scenario: Auto 模式選擇 Plan-and-Execute
- **WHEN** `rag_strategy` 為 `'auto'`，使用者查詢涉及 2+ 個明確岩場/路線比較
- **THEN** tool-selection 輸出 `strategy_hint: 'plan-execute'`，`hybrid-search` 步驟走 Plan-and-Execute 分支

#### Scenario: Auto 模式選擇 ReAct
- **WHEN** `rag_strategy` 為 `'auto'`，使用者查詢為探索性 complex（如「龍洞有什麼好玩的」）
- **THEN** tool-selection 輸出 `strategy_hint: 'agentic'`，`hybrid-search` 步驟走 ReAct 分支

#### Scenario: Auto 模式選擇 Baseline
- **WHEN** `rag_strategy` 為 `'auto'`，使用者查詢為 simple 或 general-knowledge
- **THEN** tool-selection 輸出 `strategy_hint: 'baseline'`，`hybrid-search` 步驟走 baseline 分支

#### Scenario: 實體數不足時降級為 ReAct
- **WHEN** `rag_strategy` 為 `'auto'`，`strategy_hint` 為 `'plan-execute'`，但 `planQuery()` 生成的計畫子任務數 < `plan_execute_min_entities`（預設 2）
- **THEN** 系統降級為 ReAct 策略，在 `pipelineTrace` 記錄 `plan_fallback: 'insufficient_steps'`

#### Scenario: 硬設定策略覆蓋 auto
- **WHEN** `rag_strategy` 為 `'plan-execute'`（非 auto）
- **THEN** 忽略 `strategy_hint`，所有 complex 查詢強制走 Plan-and-Execute 分支（不受 `plan_execute_min_entities` 限制）

#### Scenario: rag_strategy 配置擴充
- **WHEN** 系統讀取 `ai_config` 的 `rag_strategy` 值
- **THEN** 有效值為 `'baseline'`、`'agentic'`、`'plan-execute'`、`'auto'`，無效值 fallback 為 `'baseline'`
