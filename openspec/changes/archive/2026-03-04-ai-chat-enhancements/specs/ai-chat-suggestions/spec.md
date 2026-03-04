## ADDED Requirements

### Requirement: 輪播建議問題
系統 SHALL 在對話空白狀態每次隨機顯示不同的建議問題。

#### Scenario: 開啟時隨機取樣
- **WHEN** ChatWidget 開啟且對話為空
- **THEN** 從至少 12 題的題庫中隨機取 3 題顯示，每次開啟結果可能不同

#### Scenario: 點擊輪播建議
- **WHEN** 用戶點擊建議問題按鈕
- **THEN** 直接送出該問題（等同填入並提交）

### Requirement: 動態後續建議
系統 SHALL 在每次 AI 回應後，於最後一則訊息下方顯示 AI 生成的追問建議。

#### Scenario: 顯示後續建議
- **WHEN** AI 回應到達且 response 的 `suggested_questions` 陣列非空
- **THEN** 在最後一則 AI 訊息下方顯示最多 3 個建議按鈕

#### Scenario: 無建議時不顯示
- **WHEN** AI 回應的 `suggested_questions` 為空陣列
- **THEN** 不顯示任何建議按鈕列

#### Scenario: 點擊後續建議
- **WHEN** 用戶點擊後續建議問題
- **THEN** 直接送出該問題，建議按鈕列隱藏

#### Scenario: 送出新問題後隱藏舊建議
- **WHEN** 用戶自行輸入並送出新問題
- **THEN** 前一輪的建議按鈕列立即隱藏

### Requirement: 後端建議問題生成
後端 SHALL 在 `/ai/ask` response 中回傳 `suggested_questions` 欄位。

#### Scenario: 正常回傳建議
- **WHEN** LLM 成功生成回答且 prompt 包含建議問題指令
- **THEN** response 包含 `suggested_questions: string[]`，陣列長度 0-3

#### Scenario: 解析失敗時 fallback
- **WHEN** LLM 回應未包含分隔符號或格式異常
- **THEN** `suggested_questions` 回傳空陣列 `[]`，主回答內容不受影響
