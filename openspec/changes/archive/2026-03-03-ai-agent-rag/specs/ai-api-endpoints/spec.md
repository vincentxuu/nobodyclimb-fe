## 新增需求

### 需求：RAG 問答端點
系統應提供 `POST /api/v1/ai/ask` 端點，用於基於 RAG 的問答。

#### 場景：成功的問答請求
- **當** 發送 POST 請求，body 為 `{ "query": "龍洞有什麼 5.10 路線？" }`
- **則** 回應為 `{ "success": true, "data": { "answer": "...", "sources": [...], "query_id": "..." } }`

#### 場景：帶選項的問答
- **當** POST 請求包含 `{ "query": "...", "limit": 10, "include_sources": false }`
- **則** 搜尋使用 limit=10 且 sources 陣列為空

#### 場景：查詢過短
- **當** 查詢少於 2 個字元
- **則** 回應 400，錯誤訊息為「問題至少需要 2 個字元」

### 需求：語義搜尋端點
系統應提供 `GET /api/v1/ai/search` 端點，用於不使用 LLM 的純向量搜尋。

#### 場景：基本搜尋
- **當** 發送 GET 請求到 `/api/v1/ai/search?q=龍洞路線`
- **則** 回應包含帶分數的符合文件陣列

#### 場景：使用類型篩選搜尋
- **當** GET 請求包含 `?q=...&type=route`
- **則** 只回傳路線文件

#### 場景：使用限制搜尋
- **當** GET 請求包含 `?q=...&limit=20`
- **則** 最多回傳 20 個結果（上限 50）

### 需求：回饋端點
系統應提供 `POST /api/v1/ai/feedback` 端點，讓使用者評分 AI 回應。

#### 場景：提交正面回饋
- **當** 發送 POST 請求，body 為 `{ "query_id": "xxx", "score": 5 }`
- **則** ai_query_logs 記錄更新為 feedback_score=5

#### 場景：提交帶文字的回饋
- **當** POST 請求包含 `{ "query_id": "xxx", "score": 3, "text": "回答不夠詳細" }`
- **則** feedback_score 和 feedback_text 都被更新

#### 場景：無效的回饋分數
- **當** 分數不在 1-5 之間
- **則** 回應 400 並帶錯誤訊息

### 需求：索引管理端點
系統應提供 `POST /api/v1/ai/index` 端點，讓管理員觸發重建索引。

#### 場景：觸發路線重建索引
- **當** 已驗證的管理員 POST `{ "type": "route" }`
- **則** 觸發路線索引並回傳成功訊息

#### 場景：觸發完整重建索引
- **當** 已驗證的管理員 POST `{ "type": "all", "reindex": true }`
- **則** 清除所有文件並重建索引

#### 場景：未授權存取
- **當** 非管理員使用者呼叫索引端點
- **則** 回應 403 Forbidden

### 需求：健康檢查端點
系統應提供 `GET /api/v1/ai/health` 端點，驗證 AI 服務可用性。

#### 場景：所有服務健康
- **當** Workers AI 可存取
- **則** 回應為 `{ "success": true, "status": "healthy", "ai": true }`

#### 場景：服務降級
- **當** Workers AI 回傳錯誤
- **則** 回應 500，body 為 `{ "success": false, "status": "unhealthy", "error": "..." }`

### 需求：公開端點存取
系統應允許未驗證存取 ask、search、feedback 和 health 端點。

#### 場景：匿名使用者查詢
- **當** 未驗證使用者呼叫 /ask 端點
- **則** 正常處理請求（user_id 記錄為 null）

### 需求：速率限制
系統應對公開端點執行速率限制，防止濫用。

#### 場景：超過速率限制
- **當** IP 每分鐘對 /ask 發送超過 100 次請求
- **則** 回應 429 Too Many Requests

### 需求：CORS 支援
系統應包含適當的 CORS 標頭，用於前端存取。

#### 場景：預檢請求
- **當** 對 AI 端點發送 OPTIONS 請求
- **則** 回應包含與設定的 origin 相符的 Access-Control-Allow-Origin

### 需求：錯誤回應格式
系統應在所有 AI 端點回傳一致的錯誤回應格式。

#### 場景：伺服器錯誤
- **當** 發生非預期錯誤
- **則** 回應為 `{ "success": false, "error": "Error Type", "message": "使用者友善訊息" }`

### 需求：請求驗證
系統應使用 Zod 或等效驗證工具驗證請求 body schema。

#### 場景：缺少必要欄位
- **當** /ask 呼叫時沒有 query 欄位
- **則** 回應 400 並帶驗證錯誤詳情
