## ADDED Requirements

### Requirement: 同型態用戶排名 API

系統 SHALL 提供 `GET /api/v1/quiz/ranking/:type` 端點。Auth: Optional。

`:type` 為 3 字母 PersonalityTypeCode（如 PGB、TFS）。

#### Scenario: 查詢特定型態排名

- **WHEN** GET `/api/v1/quiz/ranking/PGB`
- **THEN** 回傳所有 `users.personality_type = 'PGB'` 且有攀登記錄的用戶列表
- **THEN** 依攀登表現排序（完攀數降序 > 最高難度降序），含 user_id、display_name、avatar_url、ascent_count、highest_grade
- **THEN** 上限回傳 50 筆

#### Scenario: 已登入用戶查詢排名含自己排位

- **WHEN** 已登入用戶 GET `/api/v1/quiz/ranking/PGB`，且該用戶為 PGB 型態
- **THEN** 回傳額外 `my_rank` 欄位標示用戶在排名中的位置（從 1 開始）

#### Scenario: 無效型態代碼

- **WHEN** GET `/api/v1/quiz/ranking/XXX`（非合法代碼）
- **THEN** 回傳 400 Bad Request

#### Scenario: 該型態無用戶

- **WHEN** 某型態尚無已登入用戶記錄
- **THEN** 回傳 `{ success: true, data: { ranking: [], total: 0 } }`
