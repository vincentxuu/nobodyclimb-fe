## ADDED Requirements

### Requirement: 每日定時重置 AI 使用量

系統 SHALL 透過 Cloudflare Workers Cron Trigger 於每日台灣時間 00:00（UTC 16:00）重置所有用戶的當日 AI 使用量。

#### Scenario: Cron 執行時重置所有用戶使用量

- **WHEN** Cron Trigger 於 UTC 16:00 觸發
- **THEN** `user_ranks` 全表執行 `SET daily_ai_used = 0, last_reset_date = date('now')`

#### Scenario: 重置後用戶可重新使用 AI

- **WHEN** 某用戶昨日已用盡配額（daily_ai_used = daily_ai_limit），Cron 執行後
- **THEN** 該用戶的 `daily_ai_used` 歸零，可再次呼叫 AI 端點

### Requirement: 每日重新計算用戶積分與等級

系統 SHALL 在每日 Cron 執行時，重新計算所有活躍用戶的等級積分，並更新對應等級與每日配額上限。

#### Scenario: 用戶新增內容後次日升段

- **WHEN** 用戶昨日新增了 biography_core_stories，使積分跨越 25 分門檻，Cron 執行後
- **THEN** 該用戶的 `rank_id` 更新為「壁」，`daily_ai_limit` 更新為 6

#### Scenario: 封鎖用戶跳過重算

- **WHEN** `users.is_active = 0` 的用戶在 `user_ranks` 有記錄
- **THEN** Cron 仍重置其 `daily_ai_used`，但跳過積分重算

#### Scenario: 有手動覆寫的用戶不被自動調整等級

- **WHEN** 用戶的 `user_ranks.rank_override_id` 非空（管理員手動指定等級）
- **THEN** Cron 僅重置 `daily_ai_used`，不更新 `rank_id` 與 `daily_ai_limit`

#### Scenario: 無 user_ranks 記錄但有 biography 的用戶

- **WHEN** 某活躍用戶有 biography 但從未使用過 AI（無 `user_ranks` 記錄）
- **THEN** Cron 為其建立初始 `user_ranks` 記錄並計算正確積分與等級

### Requirement: 配額日期防護（Lazy Fallback）

系統 SHALL 在 AI 請求時，若 `last_reset_date` 早於今日，先執行懶重置再繼續處理，以應對 Cron 執行失敗的情況。

#### Scenario: Cron 前一日未執行

- **WHEN** 用戶呼叫 AI 端點，`last_reset_date` 為前一日（Cron 失敗導致未重置）
- **THEN** 系統先執行單用戶懶重置（`daily_ai_used = 0, last_reset_date = today`），再執行正常配額檢查
