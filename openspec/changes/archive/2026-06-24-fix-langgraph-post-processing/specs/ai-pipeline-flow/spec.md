## MODIFIED Requirements

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
