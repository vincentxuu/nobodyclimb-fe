## Why

RAG Pipeline 的可觀測性存在結構性缺口：`ai_query_logs` 的 `embedding_ms`、`retrieval_ms`、`generation_ms` 三個欄位從未被寫入（engine 計算了 per-step duration 但未匯聚為 phase-level 延遲）；`/latency-stats` 端點永遠回傳 null；Admin 儀表板缺少長期品質趨勢與異常偵測，使團隊無法定位效能瓶頸或及時發現品質退化。業界標準要求 per-component span 追蹤、品質趨勢監控、與自動告警——本專案在這三個面向均有差距。

## What Changes

- **修復 per-phase latency 寫入**：engine 的 `postPipelineProcessing()` 從 `pipeline_execution` 匯聚 phase-level 延遲，傳入 `logQuery()` 寫入 `embedding_ms`、`retrieval_ms`、`generation_ms`
- **啟用 `/latency-stats` 端點**：修復後此端點自動生效（P50/P95 延遲統計）
- **新增 Admin Metrics 頁面**（`/admin/ai/metrics`）：展示長期趨勢圖表
  - 延遲趨勢：每日 P50/P95 分段延遲（embedding / retrieval / generation）
  - 品質趨勢：每日平均 groundedness、auto_score、feedback_score
  - 快取效率：每日 cache hit rate 趨勢
  - 查詢類型分佈：simple / complex / general-knowledge 佔比變化
- **新增 Metrics API 端點**（`/admin/ai/metrics`）：提供時間序列聚合資料
  - 支援時間範圍（7d / 30d / 90d）
  - 每日分群聚合：延遲 percentiles、品質分數、快取命中率、查詢類型分佈
- **異常偵測基礎**：
  - 在 Metrics API 計算 7 日移動平均與標準差
  - 偏離 2σ 的指標回傳 `anomaly: true` 標記
  - Admin Metrics 頁面以視覺標記（紅點/背景色）突顯異常日

## Capabilities

### New Capabilities
- `ai-metrics-dashboard`: Admin AI Metrics 頁面與趨勢視覺化，包含延遲/品質/快取/查詢類型的時間序列圖表與異常標記

### Modified Capabilities
- `ai-rag-tracing`: 修復 per-phase latency 寫入（engine 匯聚 phase duration → logQuery()），使現有 spec 中的分段延遲記錄需求實際落地
- `ai-admin-dashboard`: 新增 Metrics API 端點（`/admin/ai/metrics`），擴充 Admin 導覽列加入 Metrics 入口

## Impact

- **Backend**：
  - `backend/src/services/pipeline/engine.ts`：修改 `postPipelineProcessing()` 計算 phase-level 延遲
  - `backend/src/services/query.ts`：`logQuery()` 接收並寫入三個延遲欄位
  - `backend/src/routes/admin-ai.ts`：新增 `/metrics` 端點
- **Frontend**：
  - 新增 `apps/web/src/app/admin/ai/metrics/page.tsx`：Metrics 頁面
  - 修改 Admin AI 導覽：加入 Metrics 入口
- **Database**：無 schema 變更（`embedding_ms`、`retrieval_ms`、`generation_ms` 欄位已存在）
- **Dependencies**：需新增前端圖表庫 Recharts（專案目前未安裝任何圖表庫）
