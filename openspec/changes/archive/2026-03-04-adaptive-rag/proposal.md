## Why

現有 RAG pipeline 對所有查詢一視同仁，不論「龍洞有哪些路線」這類簡單 lookup 或「幫我比較台中幾個岩場的特色」這類複雜推薦問題，都跑完整個 HyDE + RRF + Reranker + MMR 流程，造成不必要的成本與延遲。同時，系統缺乏對取回文件品質的自我評估，無法在 retrieval 效果差時自動修正。

## What Changes

- **新增 query classifier**：在 RAG pipeline 入口對查詢分類（簡單 lookup / 複雜推薦比較 / 一般知識），依類別走不同子流程
- **簡單問題快速通道**：跳過 HyDE 假設文件生成，直接進行 vector search，降低 embedding API 呼叫次數
- **依複雜度選擇 LLM 模型**：簡單問題使用輕量模型，複雜問題使用 gemma-3-12b-it，節省推論費用
- **Corrective RAG (CRAG) retrieval 品質評估**：取回文件後以 LLM-as-judge 評估相關性，低於門檻時放寬條件重新搜尋
- **Self-reflection 機制**：LLM 生成回答後自我評估是否真正回答了問題，評估失敗最多觸發一次重試

## Capabilities

### New Capabilities

- `query-classifier`: 依查詢語意將問題分類為 `simple`、`complex`、`general-knowledge` 三類，並依類別決定 RAG 子流程與模型選擇
- `corrective-rag`: 對取回的文件做相關性評估（CRAG），相關性不足時重新搜尋；對 LLM 回答做 self-reflection，品質不足時重新生成

### Modified Capabilities

- `ai-query-service`：RAG 查詢流程新增分類路由入口，整合 CRAG 評估與 self-reflection，query log 新增 `query_type`、`model_used`、`retrieval_score`、`self_reflection_triggered` 欄位

## Impact

- **主要修改**：`backend/src/services/query.ts`（pipeline 路由邏輯）
- **Prompt 新增**：`backend/src/utils/ai-prompts.ts`（classifier prompt、retrieval judge prompt、self-reflection prompt）
- **D1 schema**：`ai_query_logs` 表新增 4 個追蹤欄位（`query_type`、`model_used`、`retrieval_score`、`self_reflection_triggered`）
- **無 breaking change**：現有 API 合約不變，前端無需修改
