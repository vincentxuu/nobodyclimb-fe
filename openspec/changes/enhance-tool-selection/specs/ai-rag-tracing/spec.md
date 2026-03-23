## ADDED Requirements

### Requirement: Tool Selection 信心分數 trace 記錄
System SHALL 在 `pipeline_trace.tool_selection` 中記錄以下欄位：
- `confidence: number` — LLM 輸出的工具選擇信心分數（0.0-1.0）
- `alternative?: string` — 第二選擇工具名（當 confidence < 0.8 時）
- `selected_tool: string` — 最終選定的工具名

#### Scenario: 記錄高信心工具選擇
- **WHEN** Tool Selection 回傳 confidence = 0.92、tool = 'search_routes'
- **THEN** `pipeline_trace.tool_selection` SHALL 包含 `{ selected_tool: 'search_routes', confidence: 0.92 }`

#### Scenario: 記錄低信心工具選擇及替代方案
- **WHEN** Tool Selection 回傳 confidence = 0.65、tool = 'search_routes'、alternative = 'sql_query'
- **THEN** `pipeline_trace.tool_selection` SHALL 包含 `{ selected_tool: 'search_routes', confidence: 0.65, alternative: 'sql_query' }`

### Requirement: 工具 Fallback 事件 trace 記錄
System SHALL 在 `pipeline_trace.tool_selection.fallback` 中記錄 fallback 事件：
- `triggered: boolean` — 是否觸發了 fallback
- `from_tool: string` — 原工具名
- `to_tool: string` — 切換目標工具名
- `reason: string` — 觸發原因（`'empty_results'`）

#### Scenario: 記錄 fallback 觸發事件
- **WHEN** pipeline-level fallback 從 search_routes 切換到 sql_query
- **THEN** `pipeline_trace.tool_selection.fallback` SHALL 包含 `{ triggered: true, from_tool: 'search_routes', to_tool: 'sql_query', reason: 'empty_results' }`

#### Scenario: 未觸發 fallback 時記錄
- **WHEN** 工具選擇 confidence >= 0.8 或結果非空
- **THEN** `pipeline_trace.tool_selection.fallback` SHALL 包含 `{ triggered: false }`

### Requirement: Agentic SWITCH_TOOL 事件 trace 記錄
`pipeline_trace.agentic.steps` 中的每一步 SHALL 記錄 `action_type` 欄位（`'ANSWER'` / `'RETRIEVE'` / `'BROADEN'` / `'SWITCH_TOOL'`）。當 `action_type` 為 `SWITCH_TOOL` 時，該步驟記錄 SHALL 額外包含 `target_tool`（切換目標工具名）和 `reason`（切換原因）。

SWITCH_TOOL 事件**僅記錄在 `pipeline_trace.agentic.steps` 中**，不另外在 `pipeline_trace.tool_selection` 重複記錄，避免資料冗餘。`pipeline_trace.tool_selection` 負責記錄**初始工具選擇**（confidence、alternative、fallback），`pipeline_trace.agentic.steps` 負責記錄**agentic loop 中的所有動作**（含 SWITCH_TOOL）。

#### Scenario: 記錄 agentic 工具切換
- **WHEN** agentic loop 第 2 步 Agent 執行 SWITCH_TOOL 從 search_routes 切換到 sql_query
- **THEN** `pipeline_trace.agentic.steps[1]` SHALL 包含 `{ step: 2, action_type: 'SWITCH_TOOL', target_tool: 'sql_query', reason: '...', docs_retrieved: N }`

#### Scenario: 無 SWITCH_TOOL 時 steps 僅包含其他動作
- **WHEN** agentic loop 完成且未觸發 SWITCH_TOOL
- **THEN** `pipeline_trace.agentic.steps` 各步驟的 `action_type` SHALL 僅包含 `'RETRIEVE'`、`'BROADEN'` 或 `'ANSWER'`

## MODIFIED Requirements

### Requirement: agentic stage trace 擴充
System SHALL record docs_retrieved count for each step in `pipeline_trace.agentic.steps` and termination reason for agentic loop. Each step SHALL additionally record `action_type` field indicating the action taken (`'ANSWER'` / `'RETRIEVE'` / `'BROADEN'` / `'SWITCH_TOOL'` / `'DECOMPOSE'` / `'VERIFY'`). When `action_type` is `'SWITCH_TOOL'`, the step SHALL also record `target_tool` and `reason`. When `action_type` is `'DECOMPOSE'`, the step SHALL record `subQueries`. When `action_type` is `'VERIFY'`, the step SHALL record `verifyQuery`.

#### Scenario: Each step records docs_retrieved
- **WHEN** agentic loop step completes retrieval
- **THEN** that step's trace entry SHALL include `docs_retrieved` count

#### Scenario: Records termination reason
- **WHEN** agentic loop terminates
- **THEN** trace SHALL record termination reason: `'enough_docs'` / `'max_steps'` / `'no_improvement'`

#### Scenario: Records SWITCH_TOOL action with details
- **WHEN** agentic loop step executes SWITCH_TOOL action
- **THEN** that step's trace entry SHALL include `action_type: 'SWITCH_TOOL'`、`target_tool` 和 `reason` 欄位

#### Scenario: Records DECOMPOSE action with subQueries
- **WHEN** agentic loop step executes DECOMPOSE action
- **THEN** that step's trace entry SHALL include `action_type: 'DECOMPOSE'`、`subQueries` 陣列和 `docs_retrieved` 計數

#### Scenario: Records VERIFY action with verifyQuery
- **WHEN** agentic loop step executes VERIFY action
- **THEN** that step's trace entry SHALL include `action_type: 'VERIFY'`、`verifyQuery` 字串和 `docs_retrieved` 計數

### Requirement: 檢索方法 trace 記錄
`pipeline_trace.retrieval` SHALL 記錄 `retrieval_method` 欄位（`'vector'` / `'bm25'` / `'hybrid'`），反映該次查詢使用的檢索方法。

#### Scenario: 記錄 bm25 檢索方法
- **WHEN** 查詢使用 bm25 檢索方法
- **THEN** `pipeline_trace.retrieval.retrieval_method` SHALL 為 `'bm25'`

#### Scenario: 記錄 embedding 跳過
- **WHEN** `retrievalMethod === 'bm25'`
- **THEN** `pipeline_trace.embedding` SHALL 包含 `{ skipped: true, reason: 'bm25_only' }`

### Requirement: Multi-Tool trace 記錄
`pipeline_trace.multi_tool` SHALL 記錄多工具組合執行的完整資訊：
- `steps`：每步的 `stepId`、`query`、`tool`、`result_count`、`duration_ms`、`error`
- `execution_mode`：`'parallel'` 或 `'sequential'`
- `total_duration_ms`：總執行時間
- `sources_count`：合併後的來源數量

#### Scenario: 記錄 multi-tool 成功執行
- **WHEN** multi-tool 查詢成功完成
- **THEN** `pipeline_trace.multi_tool` SHALL 包含所有步驟的執行結果和總時間

#### Scenario: 記錄 multi-tool 降級
- **WHEN** multi-tool 執行失敗
- **THEN** `pipeline_trace.multi_tool` SHALL 包含 `{ fallback: true, error: '...', total_duration_ms: N }`
