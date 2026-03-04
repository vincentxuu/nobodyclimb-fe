## ADDED Requirements

### Requirement: SSE 串流問答端點
後端 SHALL 在 `POST /api/v1/ai/ask?stream=true` 時以 SSE 格式回應，`Content-Type` 為 `text/event-stream`，`Cache-Control` 為 `no-cache`。非串流請求（無 `stream` 參數或 `stream=false`）SHALL 維持原有 JSON 回應格式，不受影響。

#### Scenario: 串流請求成功開始
- **WHEN** 已登入用戶 POST `/api/v1/ai/ask?stream=true`，body 為合法 query，配額未耗盡
- **THEN** 回應 HTTP 200，`Content-Type: text/event-stream`，開始推送 token 事件

#### Scenario: Token 事件格式
- **WHEN** LLM 生成一個 token
- **THEN** 後端推送 `data: {"type":"token","token":"<text>"}\n\n`

#### Scenario: 串流完成事件
- **WHEN** LLM 生成結束
- **THEN** 後端推送 `data: {"type":"done","query_id":"<id>","sources":[...],"suggested_questions":["..."],"quota_remaining":<N>}\n\n`，然後關閉串流

#### Scenario: 串流錯誤事件
- **WHEN** LLM 呼叫期間發生內部錯誤
- **THEN** 後端推送 `data: {"type":"error","message":"<human-readable>"}\n\n`，然後關閉串流

### Requirement: 串流配額退還
若客戶端在收到 `done` 事件前斷線，後端 SHALL 退還本次已扣除的配額，使 `daily_ai_used` 減 1（不低於 0）。

#### Scenario: 客戶端中途斷線
- **WHEN** 後端已扣除配額並開始串流，客戶端在 `done` 事件前中斷連線
- **THEN** `daily_ai_used` 回退 1，用戶可再發起一次請求

#### Scenario: 串流完成不退還
- **WHEN** 客戶端正常收到 `done` 事件
- **THEN** 配額不退還，`daily_ai_used` 維持已扣除狀態

### Requirement: QueryService 串流方法
`QueryService` SHALL 提供 `askStream(request, writer)` 方法，接受 `WritableStreamDefaultWriter` 參數，在最終 LLM 生成階段以 `stream: true` 呼叫 `AI.run()`，將每個 token 寫入 writer；RAG 前置階段（embedding、vector search、reranking）維持同步執行。

#### Scenario: LLM 串流呼叫
- **WHEN** `askStream()` 執行到最終 LLM 生成步驟
- **THEN** 呼叫 `env.AI.run(model, { stream: true, ... })` 取得 `ReadableStream`，逐 chunk 解析並寫入 writer

#### Scenario: Cache 命中時不串流
- **WHEN** query 命中 KV cache
- **THEN** `askStream()` 直接將完整回答以單一 `token` 事件寫入，緊接著送出 `done` 事件（不呼叫 LLM）
