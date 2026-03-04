## ADDED Requirements

### Requirement: ChatWidget 串流接收
前端 ChatWidget SHALL 使用 `fetch` + `response.body.getReader()` 接收 SSE 串流，逐行解析 `data: {...}` 格式，不使用 `EventSource`（因需 POST 及 Auth header）。

#### Scenario: 串流啟動
- **WHEN** 用戶送出問題
- **THEN** 前端發出 `POST /api/v1/ai/ask?stream=true`，帶 `Authorization: Bearer <token>` header，顯示打字動畫佔位符

#### Scenario: Token 逐字顯示
- **WHEN** 前端收到 `{"type":"token","token":"..."}` 事件
- **THEN** 將 token 附加到當前助理訊息氣泡，實現逐字顯示效果

#### Scenario: 串流完成
- **WHEN** 前端收到 `{"type":"done",...}` 事件
- **THEN** 停止打字動畫，顯示 sources 卡片與 suggested questions，移除停止按鈕

#### Scenario: 串流錯誤
- **WHEN** 前端收到 `{"type":"error",...}` 事件，或網路中斷
- **THEN** 在訊息氣泡末端顯示錯誤提示「⚠ 生成中斷，請重試」，移除停止按鈕

### Requirement: 停止生成按鈕
串流進行期間，ChatWidget SHALL 顯示「停止生成」按鈕；用戶點擊後 SHALL 中止 fetch 請求（`AbortController.abort()`）並保留已接收的部分回答。

#### Scenario: 顯示停止按鈕
- **WHEN** 串流開始（`type:token` 首次收到）
- **THEN** 輸入區顯示「停止生成」按鈕，原送出按鈕隱藏

#### Scenario: 用戶點擊停止
- **WHEN** 用戶點擊「停止生成」
- **THEN** 呼叫 `AbortController.abort()`，訊息氣泡末端附加「（已停止）」，移除停止按鈕，恢復輸入區

### Requirement: Feature Flag 控制
串流模式 SHALL 由環境變數 `NEXT_PUBLIC_ENABLE_AI_STREAMING` 控制（`"true"` 啟用）。未設定時 SHALL 預設使用非串流模式，確保向後相容。

#### Scenario: 串流模式啟用
- **WHEN** `NEXT_PUBLIC_ENABLE_AI_STREAMING=true`
- **THEN** ChatWidget 使用 `?stream=true` 端點並啟用逐字顯示邏輯

#### Scenario: 串流模式關閉
- **WHEN** `NEXT_PUBLIC_ENABLE_AI_STREAMING` 未設定或非 `"true"`
- **THEN** ChatWidget 使用原有非串流端點，行為與舊版相同
