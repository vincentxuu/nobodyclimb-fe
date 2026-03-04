## MODIFIED Requirements

### 需求：RAG 問答端點

系統應提供 `POST /api/v1/ai/ask` 端點，用於基於 RAG 的問答。未登入用戶 SHALL 被拒絕；已登入用戶 SHALL 受等級配額管控（請求次數 + token 消耗雙重限制）；請求 SHALL 經過輸入驗證與輸出過濾；成功回應 SHALL 附帶配額資訊。端點 SHALL 支援 `stream` 查詢參數：`?stream=true` 時回傳 SSE 串流（`text/event-stream`），`?stream=false` 或未提供時回傳原有 JSON 格式。

#### 場景：成功的問答請求（非串流）

- **當** 已登入用戶發送 POST 請求，body 為 `{ "query": "龍洞有什麼 5.10 路線？" }`，且次數配額與 token 配額皆未耗盡，無 `stream` 參數
- **則** 回應為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "...", "quota": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 3, "remaining": 3 } } }`

#### 場景：成功的串流問答請求

- **當** 已登入用戶發送 POST 請求，附帶 `?stream=true`，body 為合法 query，且配額未耗盡
- **則** 回應 HTTP 200，`Content-Type: text/event-stream`，依序推送 token 事件與 done 事件

#### 場景：帶選項的問答

- **當** POST 請求包含 `{ "query": "...", "limit": 10, "include_sources": false }`
- **則** 搜尋使用 limit=10 且 sources 陣列為空

#### 場景：查詢過短

- **當** 查詢少於 2 個字元
- **則** 回應 400，錯誤訊息為「問題至少需要 2 個字元」

#### 場景：未登入用戶被拒絕

- **當** 未驗證用戶呼叫 `/api/v1/ai/ask`
- **則** 回應 401，錯誤訊息為「請先登入以使用 AI 助理」

#### 場景：請求次數配額耗盡時被拒絕

- **當** 已登入用戶今日請求次數配額已全部使用
- **則** 回應 429，body 含 `error: "quota_exceeded"` 與等級、重置時間資訊

#### 場景：輸入含惡意模式被拒絕

- **當** 查詢通過長度驗證但含 prompt injection 或 jailbreak 關鍵字
- **則** 返回 400，body 含 `error: "invalid_input"`；不扣除請求次數配額與 token 配額

#### 場景：Token 配額耗盡時被拒絕

- **當** 用戶今日 token 消耗已達等級上限
- **則** 回應 429，body 含 `error: "token_quota_exceeded"` 與已用量、上限、重置時間；不扣除請求次數配額

## ADDED Requirements

### 需求：配額狀態查詢端點

系統應提供 `GET /api/v1/ai/quota/me` 端點，讓前端在頁面載入時取得用戶的當前等級與配額狀態，無需先發送 AI 請求。

#### 場景：已登入用戶查詢配額

- **當** 已登入用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 `{ "success": true, "data": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 2, "remaining": 4, "score": 38, "resets_at": "2026-03-04T16:00:00Z", "token_limit": 15000, "token_used": 3500, "token_remaining": 11500 } }`

#### 場景：未登入用戶查詢配額

- **當** 未驗證用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 401
