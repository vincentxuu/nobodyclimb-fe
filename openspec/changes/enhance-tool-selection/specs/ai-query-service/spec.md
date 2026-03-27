## MODIFIED Requirements

### Requirement: RAG 查詢執行
系統應透過 `PipelineEngine` 執行 RAG（檢索增強生成）查詢。`QueryService.ask()` 方法 SHALL 建立 `PipelineContext`，呼叫 `PipelineEngine.run()` 依設定動態組裝並執行已啟用的 pipeline step，最終組合回應返回。查詢 SHALL 在 LLM 呼叫前經過輸入 guardrails 驗證，LLM 回應 SHALL 經過輸出 guardrails 過濾後才返回。對已登入用戶，查詢流程 SHALL 額外注入用戶記憶摘要與完攀紀錄 context。`parseQueryWithLLM()` SHALL 從 LLM 輸出中解析 `confidence` 信心分數和選填的 `alternative` 替代工具名。當 confidence < 0.5 時，系統 SHALL 覆寫工具為 `general_knowledge` 或觸發 clarification。當 confidence 介於 0.5-0.8 時，系統 SHALL 在 PipelineContext 設定 `fallbackEnabled = true`。Agentic ReAct loop SHALL 在既有的 `ANSWER`、`RETRIEVE`、`BROADEN` 之外，額外支援 `SWITCH_TOOL`、`DECOMPOSE` 和 `VERIFY` 動作類型。`RETRIEVE` 動作 SHALL 支援選填的 `retrievalMethod` 欄位（`'vector'` / `'bm25'` / `'hybrid'`），控制該步搜尋使用的檢索方法。

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

#### Scenario: 低信心觸發 general_knowledge fallback
- **WHEN** `parseQueryWithLLM()` 回傳 confidence < 0.5
- **THEN** 系統 SHALL 覆寫工具為 `general_knowledge`，設定 queryType 為 `general-knowledge`

#### Scenario: 中信心啟用 fallback 旗標
- **WHEN** `parseQueryWithLLM()` 回傳 confidence 介於 0.5 至 0.8
- **THEN** 系統 SHALL 在 PipelineContext 設定 `fallbackEnabled = true` 及 `alternativeTool` 為 LLM 輸出的替代工具名

## ADDED Requirements

### Requirement: Tool Selection 信心分數
`parseQueryWithLLM()` SHALL 解析 LLM 輸出中的 `confidence` 欄位（數值 0.0-1.0）。`ParsedQuery` 介面 SHALL 新增 `confidence: number` 和 `alternative?: string` 欄位。TOOL_SELECTION_PROMPT SHALL 要求 LLM 在 JSON 輸出中包含 `confidence` 和當 confidence < 0.8 時的 `alternative`（第二選擇工具名）。若 LLM 未輸出 confidence，SHALL 預設為 1.0（等同現有行為）。

#### Scenario: LLM 輸出包含信心分數
- **WHEN** LLM 回傳 `{"tool": "search_routes", "confidence": 0.9, "query_type": "simple", "params": {...}}`
- **THEN** ParsedQuery.confidence SHALL 為 0.9

#### Scenario: LLM 輸出包含替代工具
- **WHEN** LLM 回傳 `{"tool": "search_routes", "confidence": 0.6, "alternative": "sql_query", ...}`
- **THEN** ParsedQuery.alternative SHALL 為 `"sql_query"`

#### Scenario: LLM 未輸出 confidence 時使用預設值
- **WHEN** LLM 回傳 `{"tool": "search_routes", "query_type": "simple", "params": {...}}`（無 confidence 欄位）
- **THEN** ParsedQuery.confidence SHALL 預設為 1.0

### Requirement: Pipeline-level 工具 Fallback
當 Tool Selection 的 confidence < 0.8 且 hybrid-search 步驟完成後 `candidateMatches` 為 0 筆時，系統 SHALL 自動切換到 `alternativeTool` 重新執行。Fallback 觸發點為 `hybrid-search` 步驟完成後（檢查 `ctx.candidateMatches.length === 0`）。Fallback 執行時 SHALL 更新 `queryType` 和 `parsedQuery`，清除 retrieval 階段輸出，利用現有 `loopBack` 機制從 `filter-build` 步驟重新執行。Fallback SHALL 最多觸發 1 次（透過設定 `fallbackEnabled = false`）。Fallback 事件 SHALL 記錄到 pipelineTrace。

#### Scenario: 低信心 + 空結果觸發 fallback
- **WHEN** confidence = 0.65、alternative = 'sql_query'、hybrid-search 步驟完成後 candidateMatches 為空
- **THEN** 系統 SHALL 將 queryType 切換為 sql_query 對應的 queryType，設定 `fallbackEnabled = false`，透過 loopBack 從 filter-build 步驟重新執行，並在 trace 記錄 fallback 事件

#### Scenario: 高信心不觸發 fallback
- **WHEN** confidence = 0.92、hybrid-search 回傳 0 筆結果
- **THEN** 系統 SHALL 不觸發 fallback（信心足夠，空結果視為正常無資料）

#### Scenario: Fallback 最多 1 次
- **WHEN** 第一次 fallback 後仍回傳 0 筆結果
- **THEN** 系統 SHALL 不再觸發第二次 fallback，繼續正常流程

### Requirement: Agentic SWITCH_TOOL 動作
Agentic ReAct Loop（`agenticRetrieve()` 方法）SHALL 支援第四種動作 `SWITCH_TOOL`。`SWITCH_TOOL` 動作 SHALL 包含 `targetTool`（切換目標工具名）和 `reason`（切換原因）。執行 SWITCH_TOOL 時，`agenticRetrieve()` SHALL 依據 `targetTool` 重新建構 `vectorFilter`（透過 `buildFiltersFromParsed()` 使用新工具的 type 設定），然後呼叫 `runAgenticSearch()` 執行新一輪檢索，將結果合併到現有候選集（透過 RRF 合併）。SWITCH_TOOL 不會重啟 Pipeline 步驟，僅在 `agenticRetrieve()` 內部切換檢索工具。每次 agentic loop SHALL 最多允許 1 次 SWITCH_TOOL（透過 `switchToolUsed` 旗標追蹤）。SWITCH_TOOL SHALL 不可切換到 `general_knowledge`。

#### Scenario: Agent 決策切換工具
- **WHEN** agentic loop 中 Agent 回傳 `{"type": "SWITCH_TOOL", "targetTool": "sql_query", "reason": "向量搜尋結果不精確，需要結構化查詢"}`
- **THEN** `agenticRetrieve()` SHALL 依 sql_query 工具定義重建 vectorFilter，呼叫 `runAgenticSearch()` 取得新結果，透過 RRF 合併到現有候選集

#### Scenario: 禁止切換到 general_knowledge
- **WHEN** Agent 回傳 `{"type": "SWITCH_TOOL", "targetTool": "general_knowledge"}`
- **THEN** 系統 SHALL 忽略此動作，視為 ANSWER

#### Scenario: SWITCH_TOOL 最多 1 次
- **WHEN** agentic loop 中已執行過 1 次 SWITCH_TOOL
- **THEN** 後續 SWITCH_TOOL 動作 SHALL 被忽略，視為 ANSWER

### Requirement: TOOL_SELECTION_PROMPT 動態化
`TOOL_SELECTION_PROMPT` SHALL 使用 `{tools}` 佔位符取代現有靜態工具描述區塊。執行時由 `ToolRegistry.generatePromptBlock()` 填入動態內容。Prompt 中的規則邏輯區塊（選擇規則、判斷信號、query_type 規則）和模板變數（`{crags}`、`{areas}`、`{regions}`、`{query}`）SHALL 保持不變，`{tools}` 僅替換工具列表描述部分。Prompt SHALL 額外要求 LLM 在 JSON 輸出中包含 `confidence`（0.0-1.0）和條件性的 `alternative`（當 confidence < 0.8 時）。

#### Scenario: Prompt 使用動態工具描述
- **WHEN** tool-selection 步驟建構 prompt
- **THEN** SHALL 呼叫 `ToolRegistry.generatePromptBlock()` 填入 `{tools}` 佔位符，其餘 prompt 結構（規則邏輯、模板變數）不變

#### Scenario: Prompt 要求 confidence 輸出
- **WHEN** LLM 依照更新後的 TOOL_SELECTION_PROMPT 回應
- **THEN** JSON 輸出 SHALL 包含 `confidence` 數值欄位

### Requirement: Agentic DECOMPOSE 動作
Agentic ReAct Loop（`agenticRetrieve()` 方法）SHALL 支援 `DECOMPOSE` 動作。`DECOMPOSE` 動作 SHALL 包含 `subQueries`（子查詢字串陣列，最多 3 個，每個截斷 500 字元）。執行 DECOMPOSE 時，`agenticRetrieve()` SHALL 透過 `Promise.all` 並行對每個子查詢呼叫 `runAgenticSearch()`，將所有結果合併到候選集。每次 agentic loop SHALL 最多允許 1 次 DECOMPOSE（透過 `decomposeUsed` 旗標追蹤）。

#### Scenario: Agent 決策分解查詢
- **WHEN** agentic loop 中 Agent 回傳 `{"type": "DECOMPOSE", "subQueries": ["龍洞 5.10 路線", "北投 5.10 路線"]}`
- **THEN** `agenticRetrieve()` SHALL 並行搜尋每個子查詢，結果透過 RRF 合併到現有候選集

#### Scenario: DECOMPOSE 無效 subQueries 視為 ANSWER
- **WHEN** Agent 回傳 `{"type": "DECOMPOSE", "subQueries": []}` 或 subQueries 非陣列
- **THEN** 系統 SHALL 忽略此動作，視為 ANSWER

#### Scenario: DECOMPOSE 最多 1 次
- **WHEN** agentic loop 中已執行過 1 次 DECOMPOSE
- **THEN** 後續 DECOMPOSE 動作 SHALL 被忽略，視為 ANSWER

### Requirement: Agentic VERIFY 動作
Agentic ReAct Loop SHALL 支援 `VERIFY` 動作。`VERIFY` 動作 SHALL 包含 `verifyQuery`（驗證查詢字串，截斷 500 字元）。執行 VERIFY 時，`agenticRetrieve()` SHALL 使用空 filter `{}` 對 `verifyQuery` 呼叫 `runAgenticSearch()` 做獨立搜尋（不帶原始過濾條件，搜尋範圍更廣泛），結果合併到候選集。每次 agentic loop SHALL 最多允許 1 次 VERIFY（透過 `verifyUsed` 旗標追蹤）。

#### Scenario: Agent 決策交叉驗證
- **WHEN** agentic loop 中 Agent 回傳 `{"type": "VERIFY", "verifyQuery": "龍洞初學者推薦路線"}`
- **THEN** `agenticRetrieve()` SHALL 使用空 filter 搜尋驗證查詢，結果合併到候選集

#### Scenario: VERIFY 無效 verifyQuery 視為 ANSWER
- **WHEN** Agent 回傳 `{"type": "VERIFY"}` 或 verifyQuery 為空字串
- **THEN** 系統 SHALL 忽略此動作，視為 ANSWER

### Requirement: 檢索方法動態選擇（RetrievalMethod）
`ParsedQuery` SHALL 新增 `retrieval_method?: 'vector' | 'bm25' | 'hybrid'` 欄位。`TOOL_SELECTION_PROMPT` SHALL 要求 LLM 輸出 `retrieval_method` 欄位（選填，預設 hybrid）。判斷規則：`bm25` 用於精確關鍵字查詢（路線名稱、岩場名稱精確匹配），`vector` 用於語意模糊查詢（「適合初學者」「風景好的岩場」），`hybrid` 為預設。`runAgenticSearch()` SHALL 接受 `method: RetrievalMethod` 參數，根據 method 選擇性執行 Vector/BM25 搜尋。

#### Scenario: 精確查詢走 bm25
- **WHEN** 使用者查詢「一陽指幾級」，LLM 判斷 `retrieval_method: 'bm25'`
- **THEN** pipeline SHALL 跳過 embedding，僅使用 BM25 全文搜尋

#### Scenario: 語意查詢走 vector
- **WHEN** 使用者查詢「適合初學者的路線」，LLM 判斷 `retrieval_method: 'vector'`
- **THEN** pipeline SHALL 僅使用向量搜尋，跳過 BM25

#### Scenario: 預設走 hybrid
- **WHEN** LLM 未輸出 retrieval_method 或值為 'hybrid'
- **THEN** pipeline SHALL 同時執行 Vector + BM25 搜尋（現有行為）

### Requirement: 多工具組合選擇（MultiTool）
`ParsedQuery` SHALL 支援 `tool: 'multi_tool'` 和 `multi_tool` 物件欄位。`multi_tool` 物件 SHALL 包含 `steps` 陣列（最多 3 個，每個含 `tool`/`purpose`/`query`）和 `execution_mode`（`'parallel'` 或 `'sequential'`）。`parseQueryWithLLM()` SHALL 驗證 `multi_tool` 結構：steps 非空、每步 tool 名稱有效（排除 `multi_tool` 和 `general_knowledge`）、最多 3 步。無效時 SHALL 降級為 `search_routes`。執行時，`hybrid-search` 步驟 SHALL 將 `MultiToolPlan` 轉為 `ExecutionPlan` 格式，復用 `executePlan()` 處理並行/循序，復用 `synthesize()` 合併結果。

#### Scenario: 複合查詢觸發多工具
- **WHEN** 使用者查詢「龍洞有幾條路線？推薦幾條適合初學者的」
- **THEN** Tool Selection SHALL 選擇 `multi_tool`，steps 包含 `search_sql`（計數）和 `search_routes`（推薦），execution_mode 為 `parallel`

#### Scenario: multi_tool 與 hybrid 區分
- **WHEN** 使用者查詢「推薦龍洞的 5.10 路線」
- **THEN** Tool Selection SHALL 選擇 `hybrid`（SQL篩選+LLM推薦的固定組合），不使用 `multi_tool`

#### Scenario: multi_tool 執行失敗降級
- **WHEN** `executePlan()` 或 `synthesize()` 拋出異常
- **THEN** 系統 SHALL fallback 到 BM25-only 搜尋，回傳降級結果
