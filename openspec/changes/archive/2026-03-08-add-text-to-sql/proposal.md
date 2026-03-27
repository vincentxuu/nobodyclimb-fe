## Why

目前 AI 問答系統完全依賴向量搜尋（RAG），對「龍洞有幾條路線？」、「台北有幾條 5.12 路線？」這類計算/統計/篩選問題會產生數字幻覺，無法保證答案精確性。Text-to-SQL 讓 AI 直接將自然語言翻譯成 SQL 查詢 D1 資料庫，取得精確結果，同時保留 RAG 處理開放性語義問題的能力。

## What Changes

- 擴充 `tool-selection` pipeline step：新增 `sql`、`hybrid`、`clarification-needed` 三種 `query_type`，輸出對應的 `template` 與 `params`
- 新增 `text-to-sql` pipeline step（pre-retrieval phase，排序在 `tool-selection` 之後）：根據 `queryType` 執行 SQL 模板、Hybrid 候選集撈取或 Clarification 回應組裝
- 新增 `TextToSqlService`：從用戶問題抽出參數（岩場、難度、路線類型）填入預定義 SQL 模板並透過 D1 執行，只允許 SELECT，白名單限定 `routes`、`crags`、`gyms` 公開資料表
- 新增 Clarification Response：對模糊問題（如「找路線」）主動回問用戶選擇「A. 查詢清單」或「B. 個人化推薦」
- 新增 Hybrid 路徑：`text-to-sql` step 取得 SQL 候選集後，由 `llm-generation` step 使用候選集作為 context 生成推薦
- 更新 RAG pipeline step 的 `skipWhen` 條件：為 `sql`、`hybrid`、`clarification-needed` 類型跳過不必要的 RAG step

## Capabilities

### New Capabilities

- `text-to-sql-router`: 新增 `text-to-sql` pipeline step，處理 SQL 直查、Hybrid 候選集撈取與 Clarification 回應；包含 `TextToSqlService` 獨立 class，實作參數抽取（復用現有 extractLocationFilter / extractGradeFilter / extractTypeFilter）、SQL 模板填充、D1 參數化查詢執行與結果格式化
- `sql-template-engine`: SQL 模板定義與執行邏輯，涵蓋路線計數/清單/難度分佈、岩場排名/資訊、影片查詢（routes ↔ route_videos ↔ videos）、個人完攀統計（按類型 flash/onsight/rp 等、日期、岩場、評分）
- `hybrid-pipeline`: `text-to-sql` step 撈取 SQL 候選集 → 存入 PipelineContext → `llm-generation` step 使用候選集作為 context 生成推薦

### Modified Capabilities

- `query-classifier`: 擴充 `tool-selection` step 的分類輸出，新增 `sql`、`hybrid`、`clarification-needed` 類型，以及 `template`、`params`、`clarification_type` 欄位
- `ai-query-service`: PipelineContext 新增 SQL 相關欄位，更新 RAG step 的 skipWhen 條件以支援新 query type 的路由跳過
- `ai-pipeline-flow`: Step 註冊表新增 `text-to-sql` step（第 14 個 step），更新 pipeline_steps 預設設定

## Impact

- `backend/src/services/pipeline/steps/text-to-sql.ts`：新增 pipeline step 實作
- `backend/src/services/text-to-sql.ts`：新增 `TextToSqlService` class
- `backend/src/services/pipeline/types.ts`：PipelineContext 新增 SQL 相關欄位，queryType 聯合型別擴充
- `backend/src/services/pipeline/registry.ts`：新增 `text-to-sql` step metadata，更新 RAG step 的 skipWhen 條件
- `backend/src/services/pipeline/steps/tool-selection.ts`：擴充 Tool Calling 輸出 schema，新增 sql/hybrid/clarification-needed 分類
- `backend/src/services/pipeline/steps/llm-generation.ts`：新增 hybrid 路徑處理（使用 SQL 候選集作為 context）
- `backend/src/utils/ai-prompts.ts`：新增 SQL 分類提示詞、SQL 結果組裝提示詞、Clarification 回問模板
- D1 資料庫：直接查詢（routes、crags、gyms），無 schema 異動
- 無破壞性變更，現有 RAG pipeline 完整保留為其中一條路徑
