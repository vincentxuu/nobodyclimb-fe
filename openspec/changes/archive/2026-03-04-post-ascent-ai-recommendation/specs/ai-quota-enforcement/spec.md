## ADDED Requirements

### Requirement: 系統觸發 AI 請求繞過配額
系統內部觸發的 AI 推薦請求（`triggered_by: 'ascent'`）SHALL 不經過用戶配額檢查，不扣減 `daily_ai_used`，直接呼叫 `QueryService.ask()`。

#### Scenario: 系統觸發推薦不扣配額
- **WHEN** `RecommendationService` 以 `triggered_by: 'ascent'` 呼叫推薦生成
- **THEN** 直接呼叫 `QueryService.ask()`，不檢查 `daily_ai_used`，`daily_ai_used` 數值不變

#### Scenario: 手動觸發推薦正常扣配額
- **WHEN** 用戶透過 `POST /api/v1/ai/recommendations` 手動觸發（`triggered_by: 'manual'`）
- **THEN** 在呼叫推薦服務前，以原子 SQL UPDATE 扣除一次配額，`daily_ai_used` 遞增 1

#### Scenario: 系統觸發超過每日上限時停止
- **WHEN** 同一用戶當日 `triggered_by = 'ascent'` 的推薦記錄已達 3 筆
- **THEN** `RecommendationService` 不呼叫 `QueryService.ask()`，直接返回（靜默跳過）
