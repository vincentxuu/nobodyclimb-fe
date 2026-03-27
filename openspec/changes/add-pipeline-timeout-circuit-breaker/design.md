## Context

RAG pipeline 目前僅 `runJudge()` 有 8s `Promise.race` timeout，其餘階段（Embedding、Vector Search、BM25、LLM Generation、HyDE、Multi-Query）皆無超時限制，完全依賴 Cloudflare Workers 30s 平台硬限。Pipeline Engine 在 step 層級有 try/catch 錯誤隔離，但失敗後只記錄錯誤繼續執行，無降級策略。沒有連續失敗追蹤或熔斷機制。

**現有超時/錯誤模式**：
- `runJudge()`：`Promise.race` + 8s timeout，失敗回傳 null scores（graceful）
- `streamLLMGeneration()`：無 timeout，ReadableStream 讀取，部分文字可接受
- `PipelineEngine`：step 層級 try/catch，generation phase 失敗注入預設訊息
- `embed()`：無 timeout，失敗直接 throw
- `embedBatch()`：batch 層級隔離，失敗插入空向量

## Goals / Non-Goals

**Goals:**
- 防止單次查詢耗盡 Workers 30s 限制，確保可控的超時行為
- 各階段獨立超時，快速失敗而非等待
- 超時時優雅降級，盡可能返回部分結果而非完全失敗
- 連續故障自動熔斷，保護下游服務
- SSE 斷線或 pipeline 超時時取消進行中的底層請求
- IP 層級速率限制，防止未認證用戶大量請求

**Non-Goals:**
- 不做分散式 tracing（OpenTelemetry）整合
- 不做跨 Worker 的全局熔斷（每個 Worker isolate 獨立，透過 KV 共享狀態）
- 不做自動 retry（超時後不重試，避免加劇過載）
- 不做前端 UI 的超時/熔斷管理介面（Admin 透過 ai_config 直接設定）

## Decisions

### 1. 超時機制：Promise.race + withTimeout 工具函式

**選擇**：建立通用 `withTimeout<T>(promise, ms, label)` 函式，所有階段統一使用。

**替代方案**：
- AbortController 單獨使用 → 不是所有 Cloudflare API 都支援 AbortSignal，且 Promise.race 更通用
- 每個階段各自實作 → 重複程式碼，行為不一致

**設計**：
```typescript
// backend/src/utils/timeout.ts
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new TimeoutError(label, ms)), ms)
      ),
    ]);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
```

### 2. 超時值設計：ai_config 動態配置

**選擇**：所有超時值存入 `ai_config` 表，可在線上調整無需部署。

| 配置 key | 預設值 | 範圍 | 說明 |
|----------|--------|------|------|
| `pipeline_timeout_ms` | 20000 | 10000-25000 | 整體 pipeline |
| `embedding_timeout_ms` | 3000 | 1000-10000 | Embedding 階段 |
| `search_timeout_ms` | 4000 | 1000-10000 | Vector + BM25 |
| `generation_timeout_ms` | 12000 | 5000-20000 | 主 LLM 生成 |
| `hyde_timeout_ms` | 5000 | 2000-10000 | HyDE 生成 |
| `multi_query_timeout_ms` | 5000 | 2000-10000 | Multi-Query 擴展 |

### 3. 降級策略：階段性 fallback

**選擇**：各階段超時時降級到最佳替代路徑，而非整體失敗。

| 階段超時 | 降級行為 | 理由 |
|----------|---------|------|
| Embedding | 僅 BM25 關鍵字檢索 | BM25 不需向量 |
| Vector Search | 用 BM25 結果繼續 | 部分結果好過無結果 |
| BM25 Search | 用 Vector 結果繼續 | 同上 |
| HyDE / Multi-Query | 跳過增強，用原始查詢 | 增強步驟為可選 |
| Main Generation | 回傳「系統忙碌」+ 退還配額 | 無法降級 |
| 整體 Pipeline | 回傳已有最佳結果或錯誤訊息 | 保證有回應 |

降級事件記錄於 `ctx.trace.degraded_stages`，回應加上 `degraded: true` 標記。

### 4. Circuit Breaker：KV 狀態機

**選擇**：使用 Cloudflare KV 儲存 Circuit Breaker 狀態，跨 Worker isolate 共享。

**替代方案**：
- 記憶體內狀態 → Workers isolate 不共享記憶體，每個 isolate 獨立計數，無法有效熔斷
- D1 資料庫 → 太慢，不適合每次請求讀寫
- Durable Objects → 過度設計，KV 的最終一致性對熔斷足夠

**狀態機**：
```
Closed (正常) --[連續 5 次失敗]--> Open (熔斷)
Open --[30s 冷卻後]--> Half-Open (探測)
Half-Open --[1 次成功]--> Closed
Half-Open --[1 次失敗]--> Open
```

**KV 結構**：
- Key: `circuit:workers-ai`
- Value: `{ state: 'closed' | 'open' | 'half-open', failureCount: number, lastFailureAt: number, openedAt: number }`
- TTL: 300s（5 分鐘無活動自動重置為 closed）

### 5. AbortController：頂層控制器

**選擇**：在 `ask()` 入口建立頂層 `AbortController`，傳入各階段。Pipeline 超時時呼叫 `controller.abort()` 取消進行中的請求。

**注意**：需驗證 Cloudflare Workers AI `env.AI.run()` 和 Vectorize `env.VECTOR_INDEX.query()` 是否支援 AbortSignal。若不支援，Promise.race 仍確保超時生效，只是底層請求會執行完畢（資源浪費但不影響正確性）。

### 6. IP 速率限制：KV 滑動窗口

**選擇**：KV 實作簡易滑動窗口。

**替代方案**：
- Cloudflare Rate Limiting（平台原生）→ 需額外計費，且目前已有 KV binding
- 固定窗口 → 邊界突刺問題

**設計**：
- Key: `rate:{ip}:{minute}` （分鐘粒度）
- TTL: 120s
- 匿名：5 次/分鐘，登入：20 次/分鐘

## Risks / Trade-offs

- **KV 最終一致性** → Circuit Breaker 可能在不同 PoP 有短暫不一致。可接受，因為少數漏過的請求不會造成嚴重問題。
- **超時值太短** → 正常查詢被誤殺。Mitigation：預設值基於現有 latency 數據留有 3-5x 餘量，且可在線上動態調整。
- **降級回應品質下降** → 僅 BM25 結果品質不如 Hybrid。Mitigation：在回應標記 `degraded: true`，前端可提示用戶「此回應可能不完整，請稍後重試」。
- **AbortController 支援不確定** → Cloudflare API 可能不支援 AbortSignal。Mitigation：Promise.race 作為保底，AbortController 為最佳化嘗試。
- **IP 速率限制誤判** → 同一 IP 多人（如公司網路）。Mitigation：登入用戶 20 次/分鐘已相當寬鬆；未來可改用 Cloudflare Rate Limiting 原生功能。
