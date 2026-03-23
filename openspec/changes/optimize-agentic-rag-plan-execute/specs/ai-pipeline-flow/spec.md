## ADDED Requirements

### Requirement: hybrid-search 步驟支援 Plan-and-Execute 分支
`hybrid-search` 步驟 SHALL 根據有效的 RAG 策略選擇三種執行分支之一：baseline（單次多路檢索）、agentic（ReAct 多步決策）、plan-execute（Plan-and-Execute 計畫式執行）。有效策略由 `rag_strategy` 配置和 `strategy_hint`（auto 模式時）共同決定。

#### Scenario: Plan-and-Execute 分支觸發條件
- **WHEN** `pipelineConfig.rag_strategy` 為 `'plan-execute'` 且 `ctx.queryType` 為 `'complex'`
- **THEN** `hybrid-search` 步驟執行 Plan-and-Execute 分支：呼叫 `planQuery()` → `executePlan()` → `synthesize()`，將合併結果設定為 `ctx.context`、`ctx.sources` 和 `ctx.skipPostRetrieval = true`

#### Scenario: Auto 模式下 Plan-and-Execute 分支觸發
- **WHEN** `pipelineConfig.rag_strategy` 為 `'auto'` 且 `ctx.strategyHint` 為 `'plan-execute'` 且 `ctx.queryType` 為 `'complex'`
- **THEN** `hybrid-search` 步驟走 Plan-and-Execute 分支

#### Scenario: 非 complex 查詢不觸發 Plan-and-Execute
- **WHEN** `rag_strategy` 為 `'plan-execute'` 但 `ctx.queryType` 為 `'simple'`
- **THEN** `hybrid-search` 步驟走 baseline 分支（Plan-and-Execute 僅對 complex 查詢生效）

#### Scenario: Plan-and-Execute fallback 到 ReAct
- **WHEN** Plan-and-Execute 的 planning 階段失敗（JSON 解析錯誤或超時）
- **THEN** `hybrid-search` 步驟 fallback 到 agentic（ReAct）分支，記錄 fallback 原因至 trace

### Requirement: tool-selection 步驟輸出 strategy_hint
`tool-selection` 步驟 SHALL 在 `auto` 模式下輸出 `strategy_hint` 欄位至 `PipelineContext`，指示建議的 RAG 策略。`strategy_hint` 由 LLM 在 tool-selection 的同一次呼叫中產出。`tool-selection` 步驟的 `provides` 清單 SHALL 新增 `strategyHint`。

#### Scenario: tool-selection 輸出 strategy_hint
- **WHEN** `rag_strategy` 為 `'auto'` 且查詢涉及多實體比較
- **THEN** `tool-selection` 步驟設定 `ctx.strategyHint = 'plan-execute'`，下游 `hybrid-search` 步驟讀取此值選擇分支

#### Scenario: 非 auto 模式不輸出 strategy_hint
- **WHEN** `rag_strategy` 為 `'baseline'`、`'agentic'` 或 `'plan-execute'`
- **THEN** `tool-selection` 步驟不設定 `ctx.strategyHint`，`hybrid-search` 步驟直接使用 `rag_strategy` 值

#### Scenario: TOOL_SELECTION_PROMPT 擴充
- **WHEN** `rag_strategy` 為 `'auto'`
- **THEN** `TOOL_SELECTION_PROMPT` 的 LLM 輸出 JSON 新增 `strategy_hint` 欄位，值為 `'baseline'` | `'agentic'` | `'plan-execute'`，根據查詢是否涉及 2+ 個明確實體比較決定

### Requirement: PipelineContext 擴充
`PipelineContext` SHALL 新增 `strategyHint?: string` 和 `skipPostRetrieval?: boolean` 欄位。`strategyHint` 由 `tool-selection` 步驟設定，由 `hybrid-search` 步驟讀取。`skipPostRetrieval` 由 `hybrid-search` 步驟在 Plan-and-Execute synthesize 成功時設定，由 `cross-encoder`、`mmr`、`popularity-rerank` 步驟讀取。

#### Scenario: strategyHint 欄位傳遞
- **WHEN** `tool-selection` 步驟設定 `ctx.strategyHint = 'plan-execute'`
- **THEN** `hybrid-search` 步驟可從 `ctx.strategyHint` 讀取策略建議

#### Scenario: strategyHint 未設定時無影響
- **WHEN** `ctx.strategyHint` 為 `undefined`（非 auto 模式）
- **THEN** `hybrid-search` 步驟使用 `pipelineConfig.rag_strategy` 直接決定分支

#### Scenario: skipPostRetrieval 跳過 post-retrieval 步驟
- **WHEN** `ctx.skipPostRetrieval` 為 `true`
- **THEN** `cross-encoder`、`mmr`、`popularity-rerank` 步驟偵測到此旗標後跳過執行，記錄 `skipped: true, reason: 'skipPostRetrieval'` 至 trace
