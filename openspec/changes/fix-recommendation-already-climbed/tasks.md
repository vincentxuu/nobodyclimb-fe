## 1. Pipeline Context 擴充

- [x] 1.1 在 `backend/src/services/pipeline/context.ts` 的 context 初始值加入 `climbed_route_ids: null as string[] | null`

## 2. 推薦查詢改寫（解法 D）

- [x] 2.1 在 `recommendation.ts` 新增 `getMaxGrade(ascents)` helper，從完攀紀錄中取最高難度並計算 +1 級目標範圍（如 5.11d → 5.12a–5.12b）
- [x] 2.2 修改 `buildRecommendationQuery()`：以能力程度描述取代路線名稱清單，使用 2.1 的目標範圍
- [x] 2.3 修改 `generate()` 中取完攀紀錄的 SQL，同時撈 `route_id`（現在只撈 name/grade/crag_name）
- [x] 2.4 在 `generate()` 中將 route_id 列表作為 `climbed_route_ids` 注入 pipeline options（透過 `QueryService.ask()` 的 options 傳遞）

## 3. MMR 層排除（解法 A - Agentic 路徑）

- [x] 3.1 在 `backend/src/services/pipeline/steps/popularity-rerank.ts` 的 MMR 執行前，讀取 `ctx.climbed_route_ids`，從候選集中移除對應文件（依文件 metadata 的 route_id 比對）
- [x] 3.2 確認文件 metadata 格式中有 `route_id` 欄位可供比對（查看 `popularityRerankStep` 接收的文件結構）

## 4. Hybrid SQL 路徑排除（解法 A - Hybrid 路徑）

- [x] 4.1 修改 `text-to-sql.ts` 的 `queryCandidates()` 支援 `excluded_ids?: string[]` 參數，當非空時 SQL 加 `AND r.id NOT IN (...)`
- [x] 4.2 修改 `handleHybridPath()` 從 `ctx.climbed_route_ids` 取值並傳入 `queryCandidates()`

## 5. Judge Prompt 加入 Constraint Satisfaction

- [x] 5.1 修改 `backend/src/utils/ai-prompts.ts` 的 `JUDGE_PROMPT`：在評估規則加入 `constraint_ok` 說明，更新 JSON 輸出格式為 `{"groundedness": float, "quality": int, "constraint_ok": bool}`
- [x] 5.2 修改 `backend/src/services/pipeline/engine.ts` 的 judge 解析邏輯（`runJudge` 回傳後）：解析 `constraint_ok`；若 `constraint_ok === false` 則將 quality 強制設為 1；解析失敗時 `constraint_ok` 預設 `true`
- [x] 5.3 在 pipeline trace 中記錄 `constraint_ok` 值（加入 `ctx.trace` 的 judge 段落），不寫入 DB

## 6. 驗證

- [ ] 6.1 手動測試：用有完攀紀錄的帳號觸發推薦，確認回答不含已完攀路線
- [ ] 6.2 確認 Judge trace 在推薦已完攀路線的情境下 `constraint_ok = false`，quality = 1
- [ ] 6.3 確認 `buildRecommendationQuery()` 的輸出查詢字串不含路線名稱
