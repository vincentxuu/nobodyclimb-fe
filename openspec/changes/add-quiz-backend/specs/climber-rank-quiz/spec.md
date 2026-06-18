## MODIFIED Requirements

### Requirement: Climber Rank 積分新增測驗來源

系統 SHALL 在 `calculateUserScore` 函式中新增兩項積分來源：

| 來源 | 計分方式 | 上限 |
|------|---------|------|
| 測驗完成（quiz_results 有 user_id 記錄） | +5 分（僅計一次，不論測驗幾次） | 5 分 |
| 訓練計畫完成（某型態 4 週 x 3 天全部 completed） | 每完成一個型態 +15 分 | 15 分（僅計一個型態） |

#### Scenario: 用戶完成測驗獲得積分

- **WHEN** 用戶至少有一筆 `quiz_results` 記錄（user_id 非 null）
- **THEN** `calculateUserScore` 回傳的積分加 5 分
- **THEN** breakdown 中新增 `quiz_completed: 5`

#### Scenario: 多次測驗不重複計分

- **WHEN** 用戶有 3 筆 quiz_results 記錄
- **THEN** 測驗積分仍為 5 分（僅計一次）

#### Scenario: 用戶完成訓練計畫獲得積分

- **WHEN** 用戶某型態的 training_progress 中 12 天（4 週 x 3 天）全部 `completed = true`
- **THEN** `calculateUserScore` 回傳的積分加 15 分
- **THEN** breakdown 中新增 `training_completed: 15`

#### Scenario: 部分完成不計分

- **WHEN** 用戶某型態僅完成 11/12 天
- **THEN** 訓練積分為 0 分

#### Scenario: RankScoreBreakdown 型別擴充

- **WHEN** `calculateUserScore` 回傳 breakdown
- **THEN** 包含 `quiz_completed: number`（0 或 5）與 `training_completed: number`（0 或 15）欄位
