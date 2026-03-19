## Why

路線推薦系統會推薦使用者已完攀的路線，原因是 retrieval 層完全沒有排除機制，加上 LLM Judge 的評估維度缺少「約束滿足度」，導致明顯錯誤的推薦被評為滿分（Groundedness 100%, Quality 4/4）。

## What Changes

- **`buildRecommendationQuery()`**：不再於查詢字串中包含路線名稱，改以能力程度描述取代，防止向量搜尋回撈已完攀路線
- **`queryCandidates()`**：hybrid 路徑的 SQL 候選集加入 `NOT IN (已完攀 route_id)` 過濾，需要傳入 `userId`
- **MMR/popularity-rerank 步驟**：在選取候選集前排除使用者已完攀的路線（依 route id）
- **`RecommendationService.generate()`**：將已完攀的 route id 列表注入 pipeline context，供 retrieval 層使用
- **LLM Judge prompt**：新增 Constraint Satisfaction 評估維度，對推薦類問題強制檢查「尚未爬過」等明確約束

## Capabilities

### New Capabilities

- `recommendation-constraint-exclusion`：推薦流程中排除已完攀路線的機制（query 改寫 + SQL 過濾 + MMR 過濾）

### Modified Capabilities

- `ai-llm-judge`：新增 Constraint Satisfaction 評估維度（q_constraint_ok 欄位）
- `ai-route-recommendation`：推薦查詢策略改為以能力程度為主，不帶路線名稱；pipeline context 需注入 climbed_route_ids

## Impact

- `backend/src/services/recommendation.ts`：`buildRecommendationQuery()` 邏輯修改；`generate()` 需撈 route_id 並注入 context
- `backend/src/services/text-to-sql.ts`：`queryCandidates()` 支援 `excluded_route_ids` 參數
- `backend/src/services/pipeline/steps/popularity-rerank.ts`：執行 MMR 前過濾已完攀路線
- `backend/src/services/pipeline/context.ts`：新增 `climbed_route_ids` 欄位
- `backend/src/utils/ai-prompts.ts`：Judge prompt 加入 Constraint Satisfaction 維度
- `backend/src/services/pipeline/steps/llm-judge.ts`（或相關 judge 邏輯）：解析並記錄 `q_constraint_ok`
