## ADDED Requirements

### Requirement: 用戶 AI 記憶儲存
系統 SHALL 提供 `user_ai_memory` 表，儲存從對話中提取的用戶偏好與行為記憶；每筆記憶包含 `user_id`、`memory_key`（預定義識別碼，如 `climbing_level`）、`memory_type`（`preference` | `behavior` | `fact`）、`content`（文字描述）、`updated_at`。以 `(user_id, memory_key)` 作為唯一鍵，新提取相同 key 的記憶時執行 UPSERT（更新 `content` 與 `updated_at`），不新增重複記錄。

#### Scenario: 儲存新記憶
- **WHEN** 系統提取到「用戶攀岩程度約 5.11」這條記憶
- **THEN** 寫入 `user_ai_memory`：`memory_key = 'climbing_level'`、`memory_type = 'fact'`、`content = '攀岩程度約 5.11'`、`updated_at = now()`

#### Scenario: 更新同類既有記憶
- **WHEN** 已有 `memory_key = 'climbing_level'` 的記憶「攀岩程度約 5.11」，新提取到「攀岩程度約 5.12a」
- **THEN** 更新既有記錄的 `content` 與 `updated_at`，不新增重複記錄

### Requirement: 對話後自動提取記憶
系統 SHALL 在 AI 對話成功完成後，使用輕量 LLM（`@cf/meta/llama-3.1-8b-instruct`）非同步**僅從用戶問題（query）**提取可推斷的用戶資訊，並寫入 `user_ai_memory`。不得從 LLM 回答中提取（避免 AI 自我強化假記憶）。每次最多提取 3 條記憶。僅對已登入用戶執行提取。

#### Scenario: 從問題推斷攀岩程度
- **WHEN** 用戶詢問「有哪些 5.11c 路線適合我練習？」
- **THEN** LLM 提取記憶：`memory_key = 'climbing_level'`、`memory_type = 'fact'`、`content = '正在練習 5.11c 路線'`

#### Scenario: 從問題推斷偏好地區
- **WHEN** 用戶詢問「台中的室內攀岩館哪裡最好？」
- **THEN** LLM 提取記憶：`memory_key = 'preferred_region'`、`memory_type = 'preference'`、`content = '偏好台中地區'`

#### Scenario: 不從 AI 回答提取記憶
- **WHEN** AI 回答包含「建議你嘗試 5.12 路線」
- **THEN** 不將此內容寫入記憶（來源為 AI 回答，非用戶表達）

#### Scenario: 無明確資訊時不寫入
- **WHEN** 用戶詢問「龍洞有哪些路線？」且無法從問題推斷個人資訊
- **THEN** 不寫入任何記憶記錄

#### Scenario: 匿名用戶不提取
- **WHEN** 未登入用戶完成 AI 查詢
- **THEN** 不執行記憶提取流程

### Requirement: 查詢用戶記憶
系統 SHALL 提供 `GET /api/v1/ai/memory` 端點，返回當前登入用戶的所有記憶清單，依 `updated_at` 倒序排列。

#### Scenario: 已登入用戶查詢記憶
- **WHEN** 已登入用戶 GET `/api/v1/ai/memory`
- **THEN** 返回 `{ "success": true, "data": [ { "id": 1, "memory_type": "fact", "content": "...", "updated_at": "..." } ] }`

#### Scenario: 用戶無記憶時返回空陣列
- **WHEN** 已登入用戶尚無任何記憶
- **THEN** 返回 `{ "success": true, "data": [] }`

#### Scenario: 未登入用戶被拒絕
- **WHEN** 未驗證用戶呼叫 GET `/api/v1/ai/memory`
- **THEN** 返回 401

### Requirement: 刪除用戶記憶
系統 SHALL 提供 `DELETE /api/v1/ai/memory/:id` 端點，允許用戶刪除指定記憶；只能刪除自己的記憶。

#### Scenario: 成功刪除自己的記憶
- **WHEN** 已登入用戶 DELETE `/api/v1/ai/memory/5`（該記憶屬於自己）
- **THEN** 返回 204，記憶從資料庫刪除

#### Scenario: 嘗試刪除他人記憶被拒絕
- **WHEN** 用戶 A 嘗試 DELETE `/api/v1/ai/memory/99`（屬於用戶 B）
- **THEN** 返回 404（不揭露他人資料存在）

### Requirement: 前端記憶管理介面
系統 SHALL 提供 `/profile/ai-memory` 頁面，讓用戶查看並刪除自己的 AI 記憶；頁面需要登入才能存取。

#### Scenario: 顯示記憶清單
- **WHEN** 已登入用戶訪問 `/profile/ai-memory`
- **THEN** 頁面顯示所有記憶條目，含類型標籤（preference/behavior/fact）與更新時間

#### Scenario: 刪除單筆記憶
- **WHEN** 用戶點擊某筆記憶的刪除按鈕並確認
- **THEN** 該記憶從清單中移除，後端同步刪除

#### Scenario: 未登入被重導向
- **WHEN** 未登入用戶訪問 `/profile/ai-memory`
- **THEN** 重導向至登入頁
