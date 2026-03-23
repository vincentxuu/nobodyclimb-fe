## 1. 基礎工具與配置

- [x] 1.1 建立 `backend/src/utils/timeout.ts`，實作 `withTimeout<T>(promise, ms, label)` 通用超時函式和 `TimeoutError` 類別
- [x] 1.2 新增 `ai_config` migration，加入超時與熔斷相關配置欄位：`pipeline_timeout_ms`、`embedding_timeout_ms`、`search_timeout_ms`、`generation_timeout_ms`、`hyde_timeout_ms`、`multi_query_timeout_ms`、`circuit_breaker_threshold`、`circuit_breaker_reset_ms`
- [x] 1.3 更新 `backend/src/services/query.ts` 的 `loadPipelineConfig()` 載入新增的配置欄位（含預設值和範圍驗證）

## 2. Circuit Breaker 熔斷器

- [x] 2.1 建立 `backend/src/utils/circuit-breaker.ts`，實作 `CircuitBreaker` 類別（KV 狀態機：Closed/Open/Half-Open，含 `checkState()`、`recordSuccess()`、`recordFailure()` 方法），KV 資料結構為 `{ state, failureCount, lastFailureAt, openedAt }`，TTL 300s
- [x] 2.2 在 `QueryService.ask()` 和 `askStream()` 入口加入 Circuit Breaker 檢查，Open 狀態直接回傳 503 不扣配額
- [x] 2.3 在 `embedding` 和 `llm-generation` step 完成後呼叫 `recordSuccess()` / `recordFailure()`。失敗定義：Workers AI 異常或 TimeoutError；不算失敗：降級成功、Judge 超時回傳 null、業務邏輯錯誤
- [x] 2.4 在 `pipelineTrace` 和 `ai_query_logs` 記錄 Circuit Breaker 狀態變化和拒絕事件

## 3. Pipeline 整體超時

- [x] 3.1 在 `QueryService.ask()` 中以 `Promise.race` 包裝 `PipelineEngine.run()`，使用 `pipeline_timeout_ms` 作為超時限制
- [x] 3.2 在 `QueryService.askStream()` 中同樣加入整體超時保護，超時時推送 error 事件後關閉串流
- [x] 3.3 超時觸發時退還已扣除的用戶配額（請求次數和 token），記錄 `timeout: true` 至 `ai_query_logs`

## 4. Per-Step Timeout 與降級

- [x] 4.1 在 `PipelineEngine` 的 step 執行迴圈中，以 `withTimeout()` 包裝每個 step 的 `execute(ctx)` 呼叫，timeout 值依 step phase 從 config 讀取
- [x] 4.2 實作 pre-retrieval 階段降級：HyDE / Multi-Query 超時 → 跳過增強步驟，使用原始查詢繼續
- [x] 4.3 實作 retrieval 階段降級：Embedding 超時 → 標記向量不可用，`hybrid-search` 僅走 BM25；Vector/BM25 單邊超時 → 用另一邊結果繼續
- [x] 4.4 實作 generation 階段降級：LLM generation 超時 → 設定超時錯誤訊息為 answer，跳過 evaluation phase
- [x] 4.5 實作 evaluation 階段降級：Judge / Self-Reflection 超時 → 跳過評估，使用已有生成結果
- [x] 4.6 在 `PipelineContext.trace` 新增 `degraded_stages: string[]` 欄位，各降級點記錄降級步驟名稱；回應加上 `degraded: true` 標記

## 5. AbortController 整合

- [x] 5.1 在 `QueryService.ask()` 入口建立頂層 `AbortController`，將 `signal` 存入 `PipelineContext`
- [x] 5.2 Pipeline 超時觸發時呼叫 `controller.abort()`，取消進行中的底層請求
- [x] 5.3 SSE 串流客戶端斷線時呼叫 `controller.abort()`，停止進行中的 LLM generation
- [x] 5.4 驗證 Cloudflare Workers AI `env.AI.run()` 和 Vectorize `env.VECTOR_INDEX.query()` 對 AbortSignal 的支援程度，不支援時確保 Promise.race 仍正確運作

## 6. IP 層級速率限制

- [x] 6.1 建立 IP 速率限制 middleware（`backend/src/middleware/rateLimit.ts`），使用 KV 計數器（key: `rate:ai:{ip}:{minute}`，TTL 120s）
- [x] 6.2 在 AI 問答路由（`POST /api/v1/ai/ask`）加入速率限制，登入用戶 20 次/分鐘（管理員豁免）。因 AI 路由需 authMiddleware 認證，匿名請求已被 401 擋下，不需額外匿名速率限制
- [x] 6.3 超限時回傳 429 + `Retry-After` header + `error: "rate_limited"`，不扣除用戶配額

## 7. API 回應與錯誤處理

- [x] 7.1 更新 `backend/src/routes/ai.ts` 的 ask 路由，捕獲 `TimeoutError` 回傳 408（`error: "pipeline_timeout"`）、Circuit Breaker 拒絕回傳 503（`error: "service_unavailable"`）
- [x] 7.2 確保所有新錯誤類型（408 超時、503 熔斷、429 速率限制）不扣除用戶配額
- [x] 7.3 降級回應在 API response 中包含 `degraded: true` 和 `degraded_stages` 欄位
