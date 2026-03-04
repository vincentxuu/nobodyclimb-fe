## MODIFIED Requirements

### 需求：RAG 問答端點

系統應提供 `POST /api/v1/ai/ask` 端點，用於基於 RAG 的問答。未登入用戶 SHALL 被拒絕；已登入用戶 SHALL 受等級配額管控；成功回應 SHALL 附帶配額資訊。

#### 場景：成功的問答請求

- **當** 已登入用戶發送 POST 請求，body 為 `{ "query": "龍洞有什麼 5.10 路線？" }`，且配額未耗盡
- **則** 回應為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "...", "quota": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 3, "remaining": 3 } } }`

#### 場景：帶選項的問答

- **當** POST 請求包含 `{ "query": "...", "limit": 10, "include_sources": false }`
- **則** 搜尋使用 limit=10 且 sources 陣列為空

#### 場景：查詢過短

- **當** 查詢少於 2 個字元
- **則** 回應 400，錯誤訊息為「問題至少需要 2 個字元」

#### 場景：未登入用戶被拒絕

- **當** 未驗證用戶呼叫 `/api/v1/ai/ask`
- **則** 回應 401，錯誤訊息為「請先登入以使用 AI 助理」

#### 場景：配額耗盡時被拒絕

- **當** 已登入用戶今日配額已全部使用
- **則** 回應 429，body 含 `error: "quota_exceeded"` 與等級、重置時間資訊

## ADDED Requirements

### 需求：配額狀態查詢端點

系統應提供 `GET /api/v1/ai/quota/me` 端點，讓前端在頁面載入時取得用戶的當前等級與配額狀態，無需先發送 AI 請求。

#### 場景：已登入用戶查詢配額

- **當** 已登入用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 `{ "success": true, "data": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 2, "remaining": 4, "score": 38, "resets_at": "2026-03-04T16:00:00Z" } }`

#### 場景：未登入用戶查詢配額

- **當** 未驗證用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 401
