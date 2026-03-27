## Context

RAG Pipeline 有 14 個步驟橫跨 5 個 phase（`pre-retrieval`、`retrieval`、`post-retrieval`、`generation`、`evaluation`），engine 在 `pipelineExecution` 陣列中追蹤每個步驟的 `duration_ms`，但 `postPipelineProcessing()` 從未將這些數據匯聚為 phase-level 延遲並傳入 `logQuery()`。DB 欄位（`embedding_ms`、`retrieval_ms`、`generation_ms`）已存在，`logQuery()` 的 INSERT 語句已正確綁定這三個參數——唯一缺失的是 engine 到 logQuery 之間的計算與傳遞。

Admin AI 儀表板目前有 6 個 tab（儀表板 / 查詢日誌 / 知識庫 / 模板設定 / 費用估算 / 設定），`/latency-stats` 端點已完整實作 P50/P95 計算邏輯但因欄位為 null 永遠回傳空值。專案未安裝任何圖表庫。

## Goals / Non-Goals

**Goals:**
- 修復 per-phase latency 寫入，使現有 `/latency-stats` 端點回傳真實數據
- 提供 Admin Metrics 頁面展示 7d / 30d / 90d 長期趨勢
- 實作基礎異常偵測（統計方法，無外部依賴）
- 零 DB migration（利用現有欄位）

**Non-Goals:**
- 不整合 OpenTelemetry / Langfuse（自訂 trace 格式已足夠）
- 不新增即時告警通知（email / Slack webhook）——僅在 dashboard 視覺標記
- 不改變 `pipeline_trace` JSON blob 結構（已由 `ai-rag-tracing` spec 覆蓋）
- 不追蹤 `pre-retrieval` 和 `evaluation` phase 的獨立延遲欄位（維持現有 3 欄位設計）

## Decisions

### Decision 1: Phase-to-Column 映射策略

5 個 pipeline phase 映射到 3 個 DB 欄位：

| DB 欄位 | 對應 phase(s) | 包含步驟 |
|---------|--------------|---------|
| `embedding_ms` | `retrieval` 中的 `embedding` 步驟 | embedding |
| `retrieval_ms` | `retrieval`（扣除 embedding）+ `post-retrieval` | hybrid-search, cross-encoder, mmr, popularity-rerank |
| `generation_ms` | `generation` + `evaluation` | llm-generation, judge, self-reflection |

**Rationale**: `embedding_ms` 獨立追蹤是因為 embedding 是檢索的瓶頸指標；`retrieval_ms` 涵蓋搜尋 + 後處理（使用者感受的「檢索等待」）；`generation_ms` 涵蓋生成 + 評估（使用者感受的「回答生成等待」）。`pre-retrieval` phase（tool-selection、hyde、filter-build 等）延遲很短（通常 < 100ms 總計），包含在整體 `latency_ms` 與 per-phase 差值中即可。

**Alternative considered**: 新增 `pre_retrieval_ms` 和 `evaluation_ms` 兩個欄位——需 migration 且現有 `/latency-stats` 端點需重寫，收益不大。

### Decision 2: Engine 匯聚實作方式

在 `postPipelineProcessing()` 中，遍歷 `pipelineExecution` 陣列，按步驟 ID 匯聚：

```typescript
// engine.ts - postPipelineProcessing() 新增邏輯
const phaseLatency = { embeddingMs: 0, retrievalMs: 0, generationMs: 0 };

for (const entry of pipelineExecution) {
  if (entry.skipped || entry.error) continue;
  switch (entry.id) {
    case 'embedding':
      phaseLatency.embeddingMs += entry.duration_ms;
      break;
    case 'hybrid-search':
    case 'cross-encoder':
    case 'mmr':
    case 'popularity-rerank':
      phaseLatency.retrievalMs += entry.duration_ms;
      break;
    case 'llm-generation':
    case 'judge':
    case 'self-reflection':
      phaseLatency.generationMs += entry.duration_ms;
      break;
  }
}
```

**Rationale**: 用 step ID（而非 phase 名稱）做映射，因為同一 phase 內的步驟需要拆分到不同欄位（`embedding` 屬於 `retrieval` phase 但獨立追蹤）。跳過 skipped/error 的步驟避免計入零值或錯誤時間。

**Alternative considered**: 用 `entry.phase` 欄位分群——無法將 `embedding` 從 `retrieval` phase 中分離出來。

### Decision 3: 快取命中時的延遲處理

快取命中（KV 或 semantic cache）時，pipeline 提前結束，多數步驟被跳過。此時 `embeddingMs`、`retrievalMs`、`generationMs` 自然為 0。

- 若三個值皆為 0 → 寫入 `null`（表示此查詢無實際 pipeline 執行，與 `ai-rag-tracing` spec 一致）
- 若任一值 > 0 → 正常寫入

**Rationale**: 保持與現有 `/latency-stats` 端點的 `WHERE ${col} IS NOT NULL` 過濾一致，快取命中不汙染延遲統計。

### Decision 4: 圖表庫選擇 — Recharts

選擇 **Recharts** 作為圖表庫。

**Rationale**:
- 基於 React + D3，與 Next.js 15 + React 19 相容
- 宣告式 API，學習曲線低
- 支援 Line / Bar / Area / Composed chart，滿足趨勢圖需求
- Bundle size ~200KB（gzipped ~60KB），可接受
- 社區成熟（npm 週下載 3M+），問題好排查

**Alternatives considered**:
- **Chart.js + react-chartjs-2**：Canvas 渲染效能好但 SSR 整合差，Next.js App Router 需 `'use client'`（Recharts 也需要但 API 更 React-native）
- **Tremor**：UI 精美但 bundle 更大且引入額外設計系統，與現有 Radix UI + Tailwind 架構衝突
- **原生 SVG**：零依賴但開發時間大幅增加，不值得

### Decision 5: Metrics API 端點設計

新增單一端點 `GET /admin/ai/metrics`，回傳完整時間序列：

```
GET /admin/ai/metrics?range=30d
```

**Query Parameters**:
- `range`: `7d` | `30d` | `90d`（預設 `30d`）

**Response 結構**:
```json
{
  "range": "30d",
  "daily": [
    {
      "date": "2026-03-08",
      "query_count": 45,
      "latency": {
        "embedding_p50": 120,
        "embedding_p95": 350,
        "retrieval_p50": 180,
        "retrieval_p95": 600,
        "generation_p50": 1200,
        "generation_p95": 2800,
        "total_p50": 1800,
        "total_p95": 3500
      },
      "quality": {
        "avg_groundedness": 0.82,
        "avg_auto_score": 3.1,
        "avg_feedback_score": 4.2
      },
      "cache": {
        "hit_rate": 0.35,
        "kv_hits": 8,
        "semantic_hits": 4,
        "misses": 33
      },
      "query_types": {
        "simple": 20,
        "complex": 15,
        "general-knowledge": 8,
        "guardrails_blocked": 2
      },
      "anomalies": ["latency.generation_p95", "quality.avg_groundedness"]
    }
  ],
  "summary": {
    "total_queries": 1350,
    "avg_latency_ms": 1900,
    "avg_groundedness": 0.79,
    "cache_hit_rate": 0.32
  }
}
```

**Rationale**: 單一端點減少前端請求數。每日聚合在 SQL 層完成（`GROUP BY date(created_at)`），D1 SQLite 可高效處理。Percentile 計算使用 SQLite window function `NTILE` 或 OFFSET 方式（與現有 `/latency-stats` 一致）。

**Alternative considered**: 多個細粒度端點（`/metrics/latency`、`/metrics/quality` 等）——增加前端複雜度和請求數，無明顯收益。

### Decision 6: 異常偵測方法

使用 **Z-Score 方法**（簡單統計異常偵測）：

1. 對每個指標計算過去 7 天的移動平均（μ）和標準差（σ）
2. 當日值偏離 μ 超過 2σ 時標記為異常
3. 在 API response 的 `anomalies` 陣列中列出異常指標名稱

**實作位置**: 在 Metrics API 的 response 組裝階段（application 層），非 SQL 層。

**監控指標**:
- `latency.total_p95`：總延遲飆升
- `latency.generation_p95`：LLM 生成變慢
- `quality.avg_groundedness`：接地性下降
- `quality.avg_auto_score`：品質下降
- `cache.hit_rate`：快取效率異常

**Rationale**: Z-Score 零依賴、計算快、可解釋性高。在每日 aggregation 的時間序列上效果夠好。不需要 ML 模型或外部服務。

**Alternative considered**: 固定閾值告警（如 P95 > 3000ms）——不適應流量模式變化；IQR 方法——對小樣本不穩定。

### Decision 7: 前端 Metrics 頁面架構

新增 `apps/web/src/app/admin/ai/metrics/page.tsx`，`'use client'` 元件：

**佈局**:
- 頂部：時間範圍選擇器（7d / 30d / 90d 按鈕組）
- Summary 卡片列（4 張）：總查詢數、平均延遲、平均 groundedness、快取命中率
- 四個圖表區塊（2x2 grid）：
  1. **延遲趨勢**（Line Chart）：P50/P95 分段延遲，6 條線
  2. **品質趨勢**（Line Chart）：groundedness / auto_score / feedback_score
  3. **快取效率**（Area Chart）：hit rate 面積圖 + hit/miss 堆疊
  4. **查詢類型分佈**（Stacked Bar Chart）：每日各類型佔比

**異常標記**: 圖表上異常日以紅色圓點標記，hover 顯示偏離值。

**Tab 整合**: 在 `layout.tsx` 的 `tabs` 陣列中新增 `{ href: '/admin/ai/metrics', label: '趨勢分析' }`，放在「費用估算」之後。

## Risks / Trade-offs

**[Risk] D1 聚合查詢效能** → 90d 範圍需掃描最多 ~10,000 筆 `ai_query_logs`。Percentile 計算需排序。
- **Mitigation**: D1 SQLite 處理萬筆級別聚合效能足夠（< 200ms）。若未來數據量增長，可加入 `created_at` 索引（可能已存在）或改用預聚合表。

**[Risk] Recharts bundle size 增加前端載入** → ~60KB gzipped。
- **Mitigation**: Metrics 頁面僅 Admin 使用，不影響用戶端。Next.js 動態 import 可進一步延遲載入。

**[Risk] 異常偵測誤報** → 低流量日（如週末）的標準差小，正常波動也可能觸發異常。
- **Mitigation**: 最小樣本數門檻（daily.query_count < 5 的日期不參與異常計算）；前端標記為「可能異常」而非「告警」，管理員自行判斷。

**[Risk] loopBack 重新執行時的延遲計算** → self-reflection 觸發 loopBack 後，embedding / retrieval 步驟會再次執行，`pipelineExecution` 中會出現重複的 step ID。
- **Mitigation**: 匯聚時累加所有同 ID 步驟的 duration_ms（含迴圈執行），這正確反映了使用者感受的總延遲。Engine 的 `loop_history` trace 可用於分析迴圈次數。

**[Risk] 並行分支步驟的延遲計算** → 分支步驟以 `branch:branchId` 為 ID 記錄，duration_ms 為分支整體耗時。
- **Mitigation**: 分支目前未啟用，暫不處理。啟用後需決定分支步驟歸屬哪個 phase 欄位（依分支包含的步驟類型判斷）。

## Open Questions

- 是否需要將 Metrics 頁面的資料做前端快取（SWR / TanStack Query staleTime），避免每次切換 tab 都重新請求？建議 staleTime 設為 5 分鐘。
