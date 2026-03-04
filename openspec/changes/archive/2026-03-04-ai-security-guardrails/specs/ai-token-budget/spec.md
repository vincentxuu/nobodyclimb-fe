## ADDED Requirements

### Requirement: 每日 Token 消耗追蹤
系統 SHALL 追蹤每用戶每日累計 token 消耗量，存於 `user_ranks.daily_token_used`；每日重置機制與現有請求次數配額共用。

#### Scenario: 成功請求後更新 token 消耗
- **WHEN** 用戶 AI 請求成功完成
- **THEN** `user_ranks.daily_token_used` 增加本次實際消耗（或估算）的 token 數

#### Scenario: 每日重置清零 token 消耗
- **WHEN** `resetDailyUsage()` 執行
- **THEN** `daily_token_used` 重置為 0

### Requirement: 每日 Token 上限
系統 SHALL 在 LLM 呼叫前估算本次預期消耗（涵蓋 SYSTEM_PROMPT + context + query + history）；次數扣除與 token 扣除 SHALL 合併為單一原子 SQL 操作，避免競態條件；若加上已用量超過 `daily_token_limit` SHALL 返回 429 且不扣除請求次數配額。

各 rank 對應 token 上限：
- 麓（foothill）：5,000 tokens/天
- 壁（wall）：15,000 tokens/天
- 稜（ridge）：30,000 tokens/天
- 巔（summit）：60,000 tokens/天
- 管理員：不受限制

#### Scenario: 用戶 token 餘額充足
- **WHEN** 用戶今日已用 2,000 tokens，上限為 5,000，本次估算消耗 500 tokens
- **THEN** 請求繼續執行，完成後 `daily_token_used` 更新為 2,500

#### Scenario: 用戶 token 超過上限
- **WHEN** 用戶今日已用 4,800 tokens，上限為 5,000，本次估算消耗 500 tokens
- **THEN** 返回 429，body 含 `error: "token_quota_exceeded"`、已用量、上限、重置時間；不扣除請求次數配額

#### Scenario: 管理員不受 token 限制
- **WHEN** 管理員用戶發送 AI 請求
- **THEN** 不進行 token 預算檢查，直接執行 LLM 呼叫

### Requirement: 高消耗請求告警
系統 SHALL 在單次請求消耗超過 1,000 tokens 時，於 `ai_query_logs` 標記 `is_high_consumption = true`。

#### Scenario: 高消耗請求被標記
- **WHEN** 單次請求實際消耗（或估算）超過 1,000 tokens
- **THEN** 對應 `ai_query_logs` 記錄的 `is_high_consumption` 欄位設為 `true`

#### Scenario: 正常消耗請求不標記
- **WHEN** 單次請求消耗不超過 1,000 tokens
- **THEN** `is_high_consumption` 為 `false`（或預設值）
