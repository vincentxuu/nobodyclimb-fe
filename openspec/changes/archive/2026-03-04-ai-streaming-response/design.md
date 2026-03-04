# Design: AI Streaming Response

## Context

目前 `POST /api/v1/ai/ask` 呼叫 `QueryService.ask()` 後等待完整結果再回傳 JSON。Cloudflare Workers AI 的 `AI.run()` 原生支援 `stream: true` 選項，回傳 `ReadableStream<Uint8Array>`，每個 chunk 格式為 ndjson（`{"response":"token",...}\n`）。

Hono 框架提供 `streamSSE()` helper（`hono/streaming`），可在 Cloudflare Workers 中輕鬆建立 SSE 回應。

## Goals / Non-Goals

**Goals:**
- 後端 `/ai/ask?stream=true` 回傳 SSE，首字 TTFB 降至 ≤2 秒
- 前端 ChatWidget 逐 token 顯示，附停止按鈕
- 串流中斷時退還配額
- 非串流模式保持完全向後相容

**Non-Goals:**
- WebSocket 雙向通訊（不需要）
- 多路串流（每次請求一個串流）
- 串流中的 cache 命中（cache 命中直接回傳 JSON，無需串流）

## Decisions

### 1. SSE over WebSocket

**選擇 SSE**。AI 回應是單向 server→client，SSE 足夠且實作更簡單。Cloudflare Workers 對 SSE 支援良好（`TransformStream`），不需要 WebSocket upgrade。

### 2. 前端用 `fetch` + `ReadableStream`，而非 `EventSource`

`EventSource` 僅支援 GET，但 `/ai/ask` 需 POST body（query 內容）且需帶 Auth header。使用 `fetch` + `response.body.getReader()` 手動解析 SSE 格式，完整控制 abort 與重試。

### 3. SSE 事件格式

每個 token：
```
data: {"type":"token","token":"..."}\n\n
```
串流結束（含 sources、建議問題）：
```
data: {"type":"done","query_id":"...","sources":[...],"suggested_questions":["..."],"quota_remaining":N}\n\n
```
錯誤：
```
data: {"type":"error","message":"..."}\n\n
```

**原因**：統一用 `type` 欄位區分事件，避免前端用多個 `EventSource.addEventListener`，也方便後續擴充。

### 4. 配額退還策略

配額在串流**開始前**扣除（與現有非串流邏輯一致）。若客戶端在收到 `done` 之前斷線（偵測 `request.signal.aborted` 或 stream 寫入失敗），執行退還：

```sql
UPDATE user_ranks SET daily_ai_used = daily_ai_used - 1 WHERE user_id = ?
```

退還條件：已扣除配額 + 未送出 `done` 事件。

### 5. QueryService 串流架構

`QueryService` 新增 `askStream()` 方法，接受 `WritableStreamDefaultWriter` 作為參數，在 LLM 生成期間寫入 token 事件。非 LLM 階段（embedding、vector search、reranking）維持同步，只有最終 `AI.run()` 呼叫改用 `stream: true`。

**理由**：避免整個 RAG pipeline 重構，只在最後一步插入 streaming，影響範圍最小。

### 6. Hono `streamSSE()` helper

使用 `hono/streaming` 的 `streamSSE(c, async (stream) => {...})` 包裝，自動處理 `Content-Type: text/event-stream`、`Cache-Control: no-cache` headers，以及客戶端斷線偵測。

## Risks / Trade-offs

| 風險 | 緩解方式 |
|------|----------|
| Cloudflare Workers AI 的 streaming ndjson 格式可能隨版本變動 | 加入 try/catch 解析，解析失敗時 fallback 到整塊輸出 |
| HyDE 生成（第一次 LLM 呼叫）不串流，用戶仍需等待 ~1–2 秒才看到第一個 token | 可接受；HyDE 是 RAG 內部步驟，不需串流給用戶 |
| 退還配額競態（多個請求同時退還） | `daily_ai_used = MAX(0, daily_ai_used - 1)` 避免負數 |
| 前端 `ReadableStream` 在舊版 Safari 的支援 | 目標用戶以 mobile Chrome/Safari 15+ 為主，可接受 |
| Cache 命中時不串流（直接回 JSON）造成行為不一致 | 前端偵測 `Content-Type` 決定處理方式；或 cache 命中時也模擬串流（逐字輸出），後者可作 v2 優化 |

## Migration Plan

1. 後端新增 `askStream()` + SSE 路由，與現有 `/ask` 路由並存（同路徑不同 query param）
2. 前端新增串流模式，預設仍用非串流（feature flag `NEXT_PUBLIC_ENABLE_AI_STREAMING`）
3. 驗證後將前端預設切換為串流模式
4. **Rollback**：關閉 feature flag 即可回退到非串流模式，無需後端變更

## Open Questions

- HyDE 第一次 LLM 呼叫是否也要串流？（目前決定：否，僅最終回答串流）
- Cache 命中時是否模擬串流以維持一致體驗？（目前決定：否，留 v2）
