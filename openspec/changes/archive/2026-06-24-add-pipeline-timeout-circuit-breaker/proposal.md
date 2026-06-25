## Why

目前 RAG pipeline 幾乎沒有超時保護機制——僅 `runJudge()` 有 8s Promise.race timeout，其餘階段（Embedding、Vector Search、BM25、LLM Generation）均無超時限制，完全依賴 Cloudflare Workers 30s 平台硬限。當 Workers AI 或 Vectorize 發生延遲或故障時，pipeline 會卡住直到平台強制終止，用戶體驗差且配額被白扣。此外，連續故障時沒有熔斷機制（每個請求獨立嘗試），可能加劇已過載的服務。

## What Changes

- 新增整體 pipeline timeout（`pipeline_timeout_ms`，預設 20s），`ask()` / `askStream()` 外層 `Promise.race` 保護
- 新增 per-phase timeout，各階段獨立超時（Embedding 3s、Search 4s、Generation 12s 等），建立通用 `withTimeout<T>()` 工具函式
- 實作 graceful degradation：各階段超時時降級而非整體失敗（如 Embedding 超時 → 僅 BM25、Vector Search 超時 → 用已有 BM25 結果繼續）
- 實作 Circuit Breaker 狀態機（Closed/Open/Half-Open），使用 KV 儲存狀態，連續 N 次失敗觸發熔斷
- 整合 AbortController，pipeline 超時或 SSE 斷線時取消進行中的底層請求
- 新增 IP 層級速率限制（匿名 5 次/分鐘、登入 20 次/分鐘）

## Capabilities

### New Capabilities
- `ai-circuit-breaker`: Circuit Breaker 熔斷器狀態機（Closed/Open/Half-Open），使用 KV 追蹤 Workers AI 連續失敗次數，Open 狀態直接拒絕請求不扣配額，Half-Open 允許探測恢復

### Modified Capabilities
- `ai-query-service`: 新增整體 pipeline timeout、per-phase timeout、graceful degradation 降級策略、AbortController 整合，超時時退還配額並記錄事件
- `ai-pipeline-flow`: Pipeline Engine 支援 per-step timeout wrapper，step 執行失敗時根據 phase 決定降級行為，`pipelineTrace` 記錄降級事件
- `ai-api-endpoints`: 新增 IP 層級速率限制（KV 或 Cloudflare Rate Limiting），超限回傳 429 + `Retry-After`

## Impact

- **後端程式碼**：`backend/src/services/query.ts`（ask/askStream timeout 包裝、降級邏輯）、`backend/src/services/pipeline/engine.ts`（per-step timeout）、`backend/src/services/embedding.ts`（AbortSignal 支援）、新建 `backend/src/utils/circuit-breaker.ts`、新建 `backend/src/utils/timeout.ts`
- **資料庫配置**：`ai_config` 新增 `pipeline_timeout_ms`、`embedding_timeout_ms`、`search_timeout_ms`、`generation_timeout_ms`、`circuit_breaker_threshold`、`circuit_breaker_reset_ms` 等欄位
- **KV 儲存**：Circuit Breaker 狀態和 IP 速率限制計數器
- **API 回應**：超時和熔斷時回傳標準錯誤格式，降級回應加上標記讓前端可顯示「此回應可能不完整」
- **前端**：需處理新的錯誤類型（503 熔斷、408 超時、429 速率限制）和降級標記
