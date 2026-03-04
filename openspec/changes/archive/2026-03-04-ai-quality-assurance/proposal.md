## Why

目前 AI RAG 系統缺乏對回答品質的自動評估機制：LLM 可能生成不基於檢索文件的幻覺內容，系統無法主動偵測或標記；查詢管道也沒有分段延遲追蹤，難以診斷效能瓶頸。在系統逐步擴大使用量的此刻，建立品質保證基礎設施是提升用戶信任的關鍵步驟。

## What Changes

- 新增 **Groundedness 評分**：每次 RAG 回應後，使用輕量 LLM 評估回答是否基於檢索文件（0–1 分），分數低時在回答中注入免責聲明
- 新增 **LLM-as-Judge 品質評分**：對每個回答自動評分（1–4 分），涵蓋相關性、完整性、格式正確性；整合用戶 feedback 進行比對
- 新增 **RAG 分段 latency 追蹤**：記錄 embedding、vector search、LLM generation 各階段耗時
- 擴展 **`ai_query_logs` 資料表**：新增 `groundedness_score`、`auto_score`、`embedding_ms`、`retrieval_ms`、`generation_ms` 欄位
- 擴展 **Admin Dashboard**：新增品質 KPI 面板（groundedness 趨勢、自動評分 vs 用戶評分比對、分段 latency P50/P95）
- 新增 **低分自動告警**：用戶評分 ≤ 2 星或 groundedness < 0.5 時，標記為「需人工審核」

## Capabilities

### New Capabilities

- `ai-groundedness-evaluation`: 對每次 RAG 回應進行 groundedness 自動評分，包含免責聲明注入、低分自動標記與 query log 記錄
- `ai-llm-judge`: 使用輕量 LLM 對回答進行 1–4 分品質評分，整合用戶 feedback 比對，並提供 Admin 品質趨勢報表
- `ai-rag-tracing`: 追蹤 RAG pipeline 各階段耗時（embedding_ms、retrieval_ms、generation_ms），提供瓶頸分析與低分 feedback 自動通知

### Modified Capabilities

- `ai-query-service`: 查詢執行流程需新增 groundedness 評分步驟、分段 latency 計時，以及向 query log 寫入新欄位
- `ai-admin-dashboard`: 新增品質保證相關 KPI 面板（groundedness 趨勢、LLM judge 評分、latency 分布、異常標記篩選器）

## Impact

**後端程式碼**：
- `backend/src/services/query.ts`：整合 groundedness 評分、分段計時
- `backend/src/routes/ai.ts`：整合 LLM-as-Judge 評分流程
- `backend/src/routes/admin-ai.ts`：新增品質 KPI 端點
- `backend/src/utils/ai-prompts.ts`：新增 groundedness judge prompt、quality judge prompt

**資料庫**：
- 新增 migration：`ai_query_logs` 加入 5 個新欄位
- 新增 migration：`ai_flagged_responses` 資料表（人工審核佇列）

**前端**：
- `apps/web/src/components/ai/`：Groundedness 免責聲明元件
- Admin Dashboard（若存在前端頁面）：品質 KPI 面板

**相依性**：
- Cloudflare Workers AI：需要呼叫輕量 LLM（`@cf/meta/llama-3.1-8b-instruct`）作為 judge（同一 Workers 環境）
- 不需新增外部相依套件
