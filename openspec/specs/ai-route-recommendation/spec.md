## ADDED Requirements

### Requirement: 系統觸發路線推薦生成
系統 SHALL 在用戶成功新增完攀紀錄後，非同步自動產生 AI 路線推薦並儲存至 `user_recommendations` 表，且不消耗用戶配額。每位用戶每日系統觸發上限為 3 次。

#### Scenario: 完攀後觸發推薦生成
- **WHEN** `POST /api/v1/ascents` 成功寫入完攀紀錄
- **THEN** 系統以 `ctx.waitUntil()` 非同步呼叫推薦服務，不阻塞 ascent API 回應

#### Scenario: 系統觸發每日上限
- **WHEN** 用戶當日系統觸發推薦已達 3 次，再次完攀
- **THEN** 跳過推薦生成，ascent API 正常回應（靜默不觸發）

#### Scenario: 無完攀紀錄的新用戶
- **WHEN** 用戶完成第一筆完攀，無歷史紀錄可參考
- **THEN** 系統仍觸發推薦，以通用攀岩查詢（不帶個人紀錄 context）生成，`recommendation` JSON 中 `context_ascents` 為空陣列

#### Scenario: 推薦生成失敗
- **WHEN** LLM 呼叫或 DB 寫入發生錯誤
- **THEN** 在 `user_recommendations` 插入 `status: 'failed'` 記錄，不重試，ascent API 不受影響

---

### Requirement: 用戶手動觸發推薦
系統 SHALL 提供 `POST /api/v1/ai/recommendations` 端點供用戶手動重新產生推薦，手動觸發 SHALL 消耗用戶當日 AI 配額一次。

#### Scenario: 手動觸發推薦成功
- **WHEN** 已登入用戶 POST `/api/v1/ai/recommendations`，且配額充足
- **THEN** 系統同步呼叫推薦服務，扣除一次配額，回傳新推薦記錄，HTTP 201

#### Scenario: 手動觸發配額不足
- **WHEN** 已登入用戶 POST `/api/v1/ai/recommendations`，但 `daily_ai_used >= daily_ai_limit`
- **THEN** 回傳 429，body 含配額資訊，不產生推薦

#### Scenario: 未登入用戶手動觸發
- **WHEN** 未驗證用戶 POST `/api/v1/ai/recommendations`
- **THEN** 回傳 401

---

### Requirement: 推薦歷史查詢
系統 SHALL 提供 `GET /api/v1/ai/recommendations` 端點，返回當前用戶的推薦歷史，按 `created_at` 降序排列，支援分頁。

#### Scenario: 查詢推薦歷史
- **WHEN** 已登入用戶 GET `/api/v1/ai/recommendations?limit=10&offset=0`
- **THEN** 回傳 `{ "success": true, "data": [ { "id": "...", "recommendation": { "answer": "...", "sources": [...], "query": "..." }, "triggered_by": "ascent", "status": "success", "created_at": "..." } ], "total": 5 }`

#### Scenario: 無推薦記錄
- **WHEN** 已登入用戶從未產生過推薦
- **THEN** 回傳 `{ "success": true, "data": [], "total": 0 }`

#### Scenario: 未登入用戶查詢
- **WHEN** 未驗證用戶 GET `/api/v1/ai/recommendations`
- **THEN** 回傳 401

---

### Requirement: 推薦資料持久化
系統 SHALL 將每筆推薦結果完整存入 `user_recommendations` 表，每次推薦皆新增一筆，永不覆蓋歷史紀錄。

#### Scenario: 推薦成功寫入
- **WHEN** 推薦生成完成（`answer` 與 `sources` 均有內容）
- **THEN** 寫入 `user_recommendations`，`status: 'success'`，`recommendation` 欄位為完整 JSON `{ answer, sources, query, context_ascents }`

#### Scenario: 推薦失敗寫入
- **WHEN** 推薦生成過程發生錯誤
- **THEN** 寫入 `user_recommendations`，`status: 'failed'`，`recommendation` 欄位為 `null`
