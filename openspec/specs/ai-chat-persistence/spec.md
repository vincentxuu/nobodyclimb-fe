## ADDED Requirements

### Requirement: 建立與載入 session
系統 SHALL 在用戶開啟對話時自動建立或載入 chat session，僅對已登入用戶有效。

#### Scenario: 已登入用戶首次開啟
- **WHEN** 已登入用戶開啟 ChatWidget 且無任何 session
- **THEN** 系統呼叫 `POST /ai/sessions` 建立新 session，前端持有 `currentSessionId`

#### Scenario: 已登入用戶再次開啟
- **WHEN** 已登入用戶開啟 ChatWidget 且存在歷史 session
- **THEN** 系統呼叫 `GET /ai/sessions` 取得列表，自動載入最新 session 的訊息

#### Scenario: 未登入用戶開啟
- **WHEN** 未登入用戶開啟 ChatWidget
- **THEN** 對話不持久化，僅保留於記憶體（關閉即消失），不顯示聊天記錄入口

### Requirement: 自動儲存訊息
系統 SHALL 在每則訊息產生後自動儲存至後端。

#### Scenario: 儲存用戶訊息
- **WHEN** 用戶送出問題且存在有效 `currentSessionId`
- **THEN** 系統呼叫 `POST /ai/sessions/:id/messages`，payload `{ role: 'user', content }`

#### Scenario: 儲存 AI 回應
- **WHEN** AI 回應到達且存在有效 `currentSessionId`
- **THEN** 系統呼叫 `POST /ai/sessions/:id/messages`，payload `{ role: 'assistant', content, suggested_questions, query_id }`

#### Scenario: 儲存失敗不中斷對話
- **WHEN** 儲存 API 呼叫失敗
- **THEN** 前端僅 console.error，對話顯示不受影響

### Requirement: 查看聊天記錄列表
系統 SHALL 提供入口讓用戶查看並切換過去的 session。

#### Scenario: 開啟歷史列表
- **WHEN** 用戶點擊標題列的「歷史」按鈕
- **THEN** 顯示最多 20 個 session，每筆顯示 title（第一則訊息前 50 字）與相對時間

#### Scenario: 切換 session
- **WHEN** 用戶點擊歷史列表中某個 session
- **THEN** 系統呼叫 `GET /ai/sessions/:id/messages`，以載入的訊息取代當前對話內容

#### Scenario: 空白歷史
- **WHEN** 用戶無任何歷史 session
- **THEN** 顯示「還沒有歷史對話」提示文字

### Requirement: 清除對話
系統 SHALL 允許用戶刪除當前 session。

#### Scenario: 觸發清除
- **WHEN** 用戶點擊清除按鈕
- **THEN** 顯示確認對話框「確定要清除這段對話嗎？」

#### Scenario: 確認清除
- **WHEN** 用戶確認清除
- **THEN** 系統呼叫 `DELETE /ai/sessions/:id`，對話區清空，建立新 session

#### Scenario: 取消清除
- **WHEN** 用戶取消確認
- **THEN** 對話內容不變，確認框關閉
