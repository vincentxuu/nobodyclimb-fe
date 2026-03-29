## Why

LangGraph 引擎（`use_langgraph_engine=true`）在 RAG 路徑缺少 `postPipelineProcessing` 等價邏輯，導致：回應缺少路線連結與建議問題、query 沒有記錄到資料庫、KV 快取未寫入、token 消耗無法追蹤。同時 `popularityRerankNode` 沒有回傳 `context` 和 `sources`，導致 baseline graph 的 LLM 在無資料情況下生成回答。

## What Changes

- 修復 `popularityRerankNode`：回傳組裝好的 `context`（含影片數量）和 `sources`（含 `latestVideoUrl`）
- 在 `runAIGraph()` 後加入 post-processing：logQuery、KV 快取寫入、`finalResponse` 組裝
- 修復 streaming 模式的 async Judge（`waitUntil` 背景執行）
- 修復 streaming 模式 `---SUGGESTIONS---` 被當 raw token 推送的問題
- 補上 phase latency 計算、token breakdown 彙總、低 groundedness flagging
- 補上已攀路線排除功能（`climbed_route_ids`）

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `ai-pipeline-flow`: LangGraph 引擎的 post-processing 補齊，使其與舊引擎行為一致

## Impact

- **Backend**: `backend/src/services/ai-graph/` — index.ts、nodes/popularity-rerank.ts、nodes/judge.ts
- **API**: POST `/api/v1/ai/ask` 的回應格式修正（`sources`、`suggested_questions`、`query_id` 從 undefined 變為正確值）
- **資料庫**: `ai_query_logs` 恢復正常寫入
- **快取**: KV 恢復正常寫入
