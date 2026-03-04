## ADDED Requirements

### Requirement: AI 請求前配額檢查
系統 SHALL 在處理 `POST /api/v1/ai/ask` 前驗證用戶是否有剩餘配額，未登入用戶 SHALL 被拒絕。

#### Scenario: 未登入用戶被拒絕
- **WHEN** 未驗證用戶呼叫 `POST /api/v1/ai/ask`
- **THEN** 回傳 401，錯誤訊息為「請先登入以使用 AI 助理」

#### Scenario: 配額充足時允許請求
- **WHEN** 已登入用戶的 `daily_ai_used < daily_ai_limit`
- **THEN** 系統繼續處理 AI 請求，並於成功回應後扣除一次配額

#### Scenario: 配額耗盡時拒絕請求
- **WHEN** 已登入用戶的 `daily_ai_used >= daily_ai_limit`
- **THEN** 回傳 429，body 為 `{ "success": false, "error": "quota_exceeded", "data": { "tier": "壁", "daily_limit": 6, "daily_used": 6, "resets_at": "2026-03-04T16:00:00Z" } }`

### Requirement: 配額原子性扣除
系統 SHALL 以單一原子 SQL UPDATE 扣除配額，防止並發請求導致超量使用。

#### Scenario: 正常扣除成功
- **WHEN** 原子 UPDATE 影響 1 行（`daily_ai_used < daily_ai_limit` 成立）
- **THEN** AI 請求繼續執行，`daily_ai_used` 遞增 1

#### Scenario: 並發請求不超量
- **WHEN** 同一用戶在配額剩餘 1 次時同時發送兩個 AI 請求
- **THEN** 其中一個請求成功扣除，另一個回傳 429（原子 UPDATE 保證只有一個成功）

### Requirement: AI 回應附帶配額資訊
系統 SHALL 在每次成功的 AI 回應中附帶用戶的即時配額狀態。

#### Scenario: 成功請求回應含配額資訊
- **WHEN** AI 請求成功並扣除配額後
- **THEN** 回應 body 為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "...", "quota": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 3, "remaining": 3 } } }`

### Requirement: 配額狀態查詢端點
系統 SHALL 提供 `GET /api/v1/ai/quota/me` 端點，讓前端在頁面載入時取得用戶的初始配額狀態。

#### Scenario: 已登入用戶查詢配額
- **WHEN** 已登入用戶 GET `/api/v1/ai/quota/me`
- **THEN** 回傳 `{ "success": true, "data": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 2, "remaining": 4, "score": 38, "resets_at": "2026-03-04T16:00:00Z" } }`

#### Scenario: 未登入用戶查詢配額
- **WHEN** 未驗證用戶 GET `/api/v1/ai/quota/me`
- **THEN** 回傳 401

### Requirement: 系統觸發 AI 請求繞過配額
系統內部觸發的 AI 推薦請求（`triggered_by: 'ascent'`）SHALL 不經過用戶配額檢查，不扣減 `daily_ai_used`，直接呼叫 `QueryService.ask()`。

#### Scenario: 系統觸發推薦不扣配額
- **WHEN** `RecommendationService` 以 `triggered_by: 'ascent'` 呼叫推薦生成
- **THEN** 直接呼叫 `QueryService.ask()`，不檢查 `daily_ai_used`，`daily_ai_used` 數值不變

#### Scenario: 手動觸發推薦正常扣配額
- **WHEN** 用戶透過 `POST /api/v1/ai/recommendations` 手動觸發（`triggered_by: 'manual'`）
- **THEN** 在呼叫推薦服務前，以原子 SQL UPDATE 扣除一次配額，`daily_ai_used` 遞增 1

### Requirement: 推薦系統每日觸發上限
系統 SHALL 限制每位用戶每天最多因完攀自動觸發 3 次推薦生成，超過上限後不觸發，前端引導由 sessionStorage 本地計數決定。

#### Scenario: 每日系統觸發未超限
- **WHEN** 用戶當日 `triggered_by: 'ascent'` 推薦紀錄筆數 < 3
- **THEN** 允許自動觸發，呼叫 `RecommendationService.generate(userId, 'ascent')`

#### Scenario: 每日系統觸發已達上限
- **WHEN** 用戶當日 `triggered_by: 'ascent'` 推薦紀錄筆數 >= 3
- **THEN** 不觸發推薦生成，ascent API 回應不含任何推薦相關欄位
