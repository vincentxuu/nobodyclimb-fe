## MODIFIED Requirements

### Requirement: 系統觸發路線推薦生成
系統 SHALL 在用戶成功新增完攀紀錄後，非同步自動產生 AI 路線推薦並儲存至 `user_recommendations` 表，且不消耗用戶配額。每位用戶每日系統觸發上限為 3 次。

推薦查詢 SHALL 以攀登能力程度描述為主，**不得**在查詢字串中包含已完攀路線名稱。推薦服務 SHALL 將已完攀的 route_id 列表注入 pipeline context（`climbed_route_ids`），供 retrieval 層排除使用。

#### Scenario: 完攀後觸發推薦生成
- **WHEN** `POST /api/v1/ascents` 成功寫入完攀紀錄
- **THEN** 系統以 `ctx.waitUntil()` 非同步呼叫推薦服務，不阻塞 ascent API 回應

#### Scenario: 系統觸發每日上限
- **WHEN** 用戶當日系統觸發推薦已達 3 次，再次完攀
- **THEN** 跳過推薦生成，ascent API 正常回應（靜默不觸發）

#### Scenario: 推薦查詢不含已完攀路線名稱
- **WHEN** 用戶有完攀紀錄（如白虎 5.11d、閃電 5.12a）
- **THEN** 查詢字串描述攀登程度與目標難度範圍，不出現「白虎」「閃電」等路線名稱

#### Scenario: 已完攀路線不出現在推薦結果
- **WHEN** 推薦生成完成
- **THEN** `recommendation.answer` 中推薦的路線，不包含任何 `context_ascents` 中的路線名稱

#### Scenario: 無完攀紀錄的新用戶
- **WHEN** 用戶完成第一筆完攀，無歷史紀錄可參考
- **THEN** 系統仍觸發推薦，以通用攀岩查詢生成，`context_ascents` 為空陣列，`climbed_route_ids` 為空陣列

#### Scenario: 推薦生成失敗
- **WHEN** LLM 呼叫或 DB 寫入發生錯誤
- **THEN** 在 `user_recommendations` 插入 `status: 'failed'` 記錄，不重試，ascent API 不受影響
