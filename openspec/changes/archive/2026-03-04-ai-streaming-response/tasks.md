## 1. 後端：QueryService 串流方法

- [x] 1.1 在 `backend/src/services/query.ts` 新增 `askStream(request: AIAskRequest & { session_id?: string }, writer: WritableStreamDefaultWriter<string>)` 方法，確保 session_id 可傳入以帶入多輪對話 context
- [x] 1.2 RAG 前置階段（embedding、vector search、HyDE、reranking）維持同步執行，完成後才進入串流階段
- [x] 1.3 將最終 LLM 呼叫（`env.AI.run`）改為 `stream: true`，取得 `ReadableStream`；**先在內部緩衝完整回應文字**，不邊接收邊推送
- [x] 1.4 完整回應取得後，呼叫 `parseSuggestedQuestions()` 分離 answer 與 suggestions；再將 answer 逐 token（以空格/標點切割）推送 `data: {"type":"token","token":"..."}\n\n`
- [x] 1.5 全部 token 推送完畢後，寫入 query log 至 `ai_query_logs`（含 `query_id`、token 數、latency），再推送 `data: {"type":"done","query_id":"...","sources":[...],"suggested_questions":[...],"quota_remaining":N}\n\n`
- [x] 1.6 Cache 命中時，將完整回答以單一 token 事件 + done 事件寫入（不呼叫 LLM，亦不需緩衝）
- [x] 1.7 錯誤發生時，寫入 `data: {"type":"error","message":"..."}\n\n` 後關閉 writer（query log 寫入失敗狀態）

## 2. 後端：SSE 路由端點

- [x] 2.1 在 `backend/src/routes/ai.ts` 的 `POST /ask` handler 中，讀取 `stream` query 參數
- [x] 2.2 `stream=true` 時使用 `streamSSE(c, async (stream) => {...})` 建立 SSE 回應（`hono/streaming`）
- [x] 2.3 在 SSE handler 內呼叫 `queryService.askStream()`；注意 Hono `SSEStreamingApi.writeSSE()` 接受物件格式：`stream.writeSSE({ data: JSON.stringify({type:"token",...}) })`，而非 raw SSE 字串
- [x] 2.4 實作配額退還邏輯：偵測 `request.signal.aborted` 或 writer 寫入失敗，執行 `UPDATE user_ranks SET daily_ai_used = MAX(0, daily_ai_used - 1) WHERE user_id = ?`
- [x] 2.5 在 OpenAPI 描述中為 `/ask` 新增 `stream` query 參數文件，並新增 `text/event-stream` 回應格式說明

## 3. 前端：串流 API 函式

- [x] 3.1 在 `apps/web/src/lib/api/ai.ts` 新增 `askAIStream(request, onToken, onDone, onError, signal)` 函式
- [x] 3.2 使用 `fetch` + `response.body.getReader()` 接收 SSE，手動解析 `data: {...}` 行格式
- [x] 3.3 依 `type` 欄位分派：`token` → 呼叫 `onToken`，`done` → 呼叫 `onDone`，`error` → 呼叫 `onError`
- [x] 3.4 傳入 `AbortController.signal` 支援中途取消，取消時不呼叫 `onError`（靜默結束）

## 4. 前端：ChatWidget 串流顯示

- [x] 4.1 在 `ChatWidget.tsx` 新增 `abortControllerRef`，用於管理串流取消
- [x] 4.2 送出問題時，若 `NEXT_PUBLIC_ENABLE_AI_STREAMING=true`，改用 `askAIStream()` 而非 `useAskAI`
- [x] 4.3 收到 `onToken` 時，以 `setState` 逐步累加助理訊息的 `content` 欄位，實現逐字效果
- [x] 4.4 串流進行期間，輸入區顯示「停止生成」按鈕（`Square` 圖示），隱藏送出按鈕
- [x] 4.5 用戶點擊「停止生成」時，呼叫 `abortControllerRef.current.abort()`，訊息末端附加「（已停止）」
- [x] 4.6 收到 `onDone` 時，顯示 sources 卡片與 suggested questions，恢復輸入區狀態
- [x] 4.7 收到 `onError` 時，在訊息末端顯示「⚠ 生成中斷，請重試」，恢復輸入區狀態

## 5. Feature Flag 與環境設定

- [x] 5.1 在 `apps/web/.env.example`（或對應設定檔）新增 `NEXT_PUBLIC_ENABLE_AI_STREAMING=false` 說明
- [x] 5.2 確認 `NEXT_PUBLIC_ENABLE_AI_STREAMING` 未設定時，ChatWidget 預設走非串流路徑

## 6. 測試與驗證

- [x] 6.1 手動測試：串流模式下，回答逐字出現，停止按鈕可用
- [x] 6.2 手動測試：點擊「停止生成」後串流中斷，已有內容保留，配額退還（重新查詢配額確認）
- [x] 6.3 手動測試：關閉 feature flag（`NEXT_PUBLIC_ENABLE_AI_STREAMING=false`），確認非串流模式正常運作
- [x] 6.4 手動測試：網路中途斷線時，顯示錯誤提示並恢復輸入區
- [x] 6.5 手動測試：cache 命中時，串流模式仍能正常顯示（即使速度較快）
