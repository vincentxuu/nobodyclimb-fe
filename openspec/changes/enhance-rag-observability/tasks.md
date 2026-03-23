## 1. 修復 Per-Phase Latency 寫入（Backend）

- [x] 1.1 在 `engine.ts` 的 `postPipelineProcessing()` 中，遍歷 `pipelineExecution` 陣列，按 step ID 匯聚三個 phase 延遲：`embedding`→`embeddingMs`、`hybrid-search`+`cross-encoder`+`mmr`+`popularity-rerank`→`retrievalMs`、`llm-generation`+`judge`+`self-reflection`→`generationMs`。跳過 `skipped` 或 `error` 的步驟。loopBack 重新執行時 pipelineExecution 會出現重複 step ID，累加所有同 ID 條目的 `duration_ms`。三個值皆為 0 時傳入 `null`，負值傳入 `null`
- [x] 1.2 在 `postPipelineProcessing()` 呼叫 `logQuery()` 時，補上 `embeddingMs`、`retrievalMs`、`generationMs` 三個參數
- [ ] 1.3 驗證 `/admin/ai/latency-stats` 端點回傳非 null 的 P50/P95 數值（手動觸發幾筆非快取查詢後檢查）

## 2. Metrics API 端點（Backend）

- [x] 2.1 在 `admin-ai.ts` 新增 `GET /metrics` 路由，接受 `range` query parameter（`7d`/`30d`/`90d`，預設 `30d`），無效值回傳 400
- [x] 2.2 實作每日延遲聚合 SQL：按 `date(created_at)` 分群，使用 OFFSET 方式計算 `embedding_p50`/`p95`、`retrieval_p50`/`p95`、`generation_p50`/`p95`、`total_p50`/`p95`。`embedding_ms IS NULL` 的日期延遲百分位回傳 `null`
- [x] 2.3 實作每日品質聚合 SQL：`AVG(groundedness_score)`、`AVG(auto_score)`、`AVG(CASE WHEN feedback_score IS NOT NULL THEN feedback_score END)`，按日分群
- [x] 2.4 實作每日快取聚合 SQL：用 `cache_hit` 欄位計算 `hit_rate`，用 `json_extract(pipeline_trace, '$.cache.type')` 區分 `kv_hits` 和 `semantic_hits`，`pipeline_trace` 缺失時歸類為 `kv_hits`
- [x] 2.5 實作每日查詢類型分佈 SQL：按 `query_type` 計數，未出現的類型回傳 0
- [x] 2.6 實作 summary 聚合：`total_queries`、`avg_latency_ms`、`avg_groundedness`、`cache_hit_rate`，覆蓋整個 range
- [x] 2.7 實作 Z-Score 異常偵測：對每日指標計算前 7 日移動平均 μ 和標準差 σ，偏離 2σ 的指標加入 `anomalies` 陣列。`query_count < 5` 或歷史不足 7 天的日期不偵測
- [x] 2.8 組裝完整 JSON response（`range`、`daily[]`、`summary`），回傳 200

## 3. 安裝前端依賴

- [x] 3.1 ~~在 `apps/web/` 下安裝 Recharts~~ 改用原生 SVG/CSS 畫圖表，零依賴

## 4. Admin 導覽更新（Frontend）

- [x] 4.1 在 `apps/web/src/app/admin/ai/layout.tsx` 的 `tabs` 陣列中新增 `{ href: '/admin/ai/metrics', label: '趨勢分析', exact: false }`，置於「費用估算」之後

## 5. Metrics 頁面實作（Frontend）

- [x] 5.1 建立 `apps/web/src/app/admin/ai/metrics/page.tsx`（`'use client'`），包含頁面骨架：標題、時間範圍按鈕組（7 天/30 天/90 天）、4 張 summary 卡片、4 個圖表區塊（2x2 grid）
- [x] 5.2 使用 TanStack Query 呼叫 `GET /admin/ai/metrics?range=`，設定 `staleTime: 5 * 60 * 1000`（5 分鐘快取），切換 range 時重新 fetch
- [x] 5.3 實作 Summary 卡片列：總查詢數、平均延遲（ms）、平均 Groundedness（0-1）、快取命中率（%），資料載入中顯示 skeleton
- [x] 5.4 實作延遲趨勢折線圖（原生 SVG `MiniLineChart`）：6 條線（embedding/retrieval/generation 各 P50+P95），X 軸日期，Y 軸 ms，null 值斷線，hover tooltip 顯示 6 個數值
- [x] 5.5 實作品質趨勢折線圖（原生 SVG `MiniLineChart`）：3 條線（groundedness 0-1、auto_score 0-4、feedback_score 1-5），feedback null 時斷線
- [x] 5.6 實作快取效率面積圖（原生 SVG `AreaChart`）：hit_rate 面積（0-1），hover tooltip 顯示 hit_rate %、KV 命中數、語意命中數、未命中數
- [x] 5.7 實作查詢類型堆疊柱狀圖（原生 SVG `StackedBarChart`）：每日 4 色堆疊（simple/complex/general-knowledge/guardrails_blocked），hover tooltip 顯示各類型數量與佔比
- [x] 5.8 實作異常標記：圖表上異常日以紅色圓點標記，hover tooltip 額外顯示異常指標名稱與偏離方向

## 6. 驗證與整合測試

- [ ] 6.1 啟動 backend dev server，發送多筆不同類型查詢（simple/complex/general-knowledge/快取命中），確認 `ai_query_logs` 的 `embedding_ms`/`retrieval_ms`/`generation_ms` 正確寫入
- [ ] 6.2 呼叫 `GET /admin/ai/metrics?range=7d`，驗證 response 結構符合 spec（daily 陣列、latency/quality/cache/query_types/anomalies 欄位齊全）
- [ ] 6.3 造訪 `/admin/ai/metrics` 頁面，確認 4 張圖表正確渲染、時間範圍切換正常、異常標記顯示正確
- [x] 6.4 確認 `pnpm build:web` 建置成功（無 TypeScript 錯誤）
