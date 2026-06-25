## Requirements

### 需求：RAG 問答端點

系統應提供 `POST /api/v1/ai/ask` 端點，用於基於 RAG 的問答。未登入用戶 SHALL 被拒絕；已登入用戶 SHALL 受等級配額管控（請求次數 + token 消耗雙重限制）；請求 SHALL 經過輸入驗證與輸出過濾；成功回應 SHALL 附帶配額資訊。端點 SHALL 支援 `stream` 查詢參數：`?stream=true` 時回傳 SSE 串流（`text/event-stream`），`?stream=false` 或未提供時回傳原有 JSON 格式。端點 SHALL 受 IP 層級速率限制保護，超限時回傳 429。Circuit Breaker Open 時 SHALL 回傳 503。Pipeline 超時時 SHALL 回傳 408。

#### 場景：成功的問答請求（非串流）

- **當** 已登入用戶發送 POST 請求，body 為 `{ "query": "龍洞有什麼 5.10 路線？" }`，且次數配額與 token 配額皆未耗盡，無 `stream` 參數
- **則** 回應為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "...", "quota": { ... } } }`

#### 場景：成功但降級的問答請求

- **當** 已登入用戶發送查詢，pipeline 中某些階段超時觸發降級但最終仍生成回應
- **則** 回應為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "...", "degraded": true, "degraded_stages": ["embedding"], "quota": { ... } } }`

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

#### 場景：Pipeline 超時

- **當** Pipeline 執行超過 `pipeline_timeout_ms` 超時
- **則** 回應 408，body 含 `error: "pipeline_timeout"`、`message: "查詢處理超時，請稍後再試"`，退還已扣除的配額

#### 場景：Circuit Breaker 熔斷

- **當** Circuit Breaker 為 Open 狀態
- **則** 回應 503，body 含 `error: "service_unavailable"`、`message: "AI 服務暫時不可用，請稍後再試"`，不扣除配額

#### 場景：IP 速率限制超限

- **當** 同一 IP 在一分鐘內請求次數超過限制（匿名 5 次、登入 20 次）
- **則** 回應 429，body 含 `error: "rate_limited"`、`Retry-After` header 指示等待秒數，不扣除配額

### 需求：配額狀態查詢端點

系統應提供 `GET /api/v1/ai/quota/me` 端點，讓前端在頁面載入時取得用戶的當前等級與配額狀態，無需先發送 AI 請求。

#### 場景：已登入用戶查詢配額

- **當** 已登入用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 `{ "success": true, "data": { "tier": "壁", "tier_display": "壁", "daily_limit": 6, "daily_used": 2, "remaining": 4, "score": 38, "resets_at": "2026-03-04T16:00:00Z", "token_limit": 15000, "token_used": 3500, "token_remaining": 11500 } }`

#### 場景：未登入用戶查詢配額

- **當** 未驗證用戶 GET `/api/v1/ai/quota/me`
- **則** 回傳 401

### 需求：IP 層級速率限制
系統 SHALL 在 AI 問答端點加入 IP 層級速率限制，使用 KV 儲存計數器。匿名用戶 SHALL 限制為每 IP 每分鐘 5 次，已登入用戶 SHALL 限制為每 IP 每分鐘 20 次。速率限制 SHALL 在配額檢查之前執行。

#### 場景：匿名 IP 超限
- **WHEN** 未登入用戶的 IP 在一分鐘內第 6 次請求 `/api/v1/ai/ask`
- **THEN** 回應 429，body 含 `error: "rate_limited"`，header 含 `Retry-After: <剩餘秒數>`

#### 場景：登入 IP 超限
- **WHEN** 已登入用戶的 IP 在一分鐘內第 21 次請求 `/api/v1/ai/ask`
- **THEN** 回應 429，body 含 `error: "rate_limited"`，header 含 `Retry-After: <剩餘秒數>`

#### 場景：IP 限制分鐘重置
- **WHEN** 上一分鐘 IP 達到限制，新的一分鐘開始
- **THEN** 計數器重置，請求正常通過

#### 場景：速率限制不扣除配額
- **WHEN** 請求因 IP 速率限制被拒絕
- **THEN** 不扣除用戶的每日請求次數配額和 token 配額
