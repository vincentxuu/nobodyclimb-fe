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
