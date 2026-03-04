## Why

目前 AI 回答需等待 LLM 完整生成後才一次性顯示，在 Cloudflare Workers AI 的延遲下，用戶通常需等待 5–15 秒才看到任何輸出，體驗明顯遜於 ChatGPT 等主流產品。透過 SSE Streaming，回答首字出現時間可降至 1–2 秒，大幅降低感知等待時間。

## What Changes

- 後端 `/api/v1/ai/ask` 端點新增 `?stream=true` 查詢參數，支援 SSE 格式串流回應
- 前端 ChatWidget 新增串流接收邏輯，逐 token 顯示打字效果
- 串流期間顯示「停止生成」按鈕，允許用戶中斷
- 串流錯誤或中斷時，顯示已接收內容並提示錯誤；視情況退還配額
- 非串流模式（`?stream=false` 或預設）維持向後相容

## Capabilities

### New Capabilities

- `ai-streaming-backend`：後端 SSE 串流實作，包含 Cloudflare Workers AI streaming API 整合、token 推送格式、錯誤處理、配額退還邏輯
- `ai-streaming-frontend`：前端 ChatWidget 串流顯示，包含 EventSource / ReadableStream 接收、逐字動畫、停止生成按鈕、串流錯誤處理

### Modified Capabilities

- `ai-api-endpoints`：`POST /ai/ask` 新增 `stream` 查詢參數，回應格式擴展為可選 SSE（text/event-stream）或原有 JSON

## Impact

- **後端**：`backend/src/routes/ai.ts`（新增 stream 分支）、`backend/src/services/query.ts`（串流呼叫 Workers AI）
- **前端**：`apps/web/src/components/ai/ChatWidget.tsx`、`apps/web/src/components/ai/ChatMessage.tsx`（新增串流狀態顯示）
- **API contract**：`POST /api/v1/ai/ask?stream=true` 回應 `Content-Type: text/event-stream`，每個 token 格式為 `data: {"type":"token","token":"..."}\n\n`，結束時推送 `data: {"type":"done","query_id":"...","sources":[...],"suggested_questions":[...],"quota_remaining":N}\n\n`
- **配額邏輯**：串流中斷（網路錯誤、用戶停止）視為失敗，退還本次配額
