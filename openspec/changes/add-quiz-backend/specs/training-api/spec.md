## ADDED Requirements

### Requirement: 取得訓練計畫內容 API

系統 SHALL 提供 `GET /api/v1/training/plan/:type` 端點。Auth: None。

`:type` 為 3 字母 PersonalityTypeCode。回傳該型態的 4 週 x 3 天訓練計畫內容，資料來源為 `@nobodyclimb/constants` 的靜態定義。

#### Scenario: 取得碎岩者訓練計畫

- **WHEN** GET `/api/v1/training/plan/PGB`
- **THEN** 回傳 `{ success: true, data: TrainingPlan }`，包含 4 週、每週 3 天、每天含 title、description、duration、exercises

#### Scenario: 無效型態代碼

- **WHEN** GET `/api/v1/training/plan/XXX`
- **THEN** 回傳 400 Bad Request

### Requirement: 記錄訓練進度 API

系統 SHALL 提供 `POST /api/v1/training/progress` 端點。Auth: Required。

Request Body（Zod 驗證）：
- `personality_type`: string（3 字母代號）
- `week`: number（1~4）
- `day`: number（1~3）
- `completed`: boolean
- `notes`: string | null（選填備註）

#### Scenario: 標記訓練日完成

- **WHEN** 已登入用戶 POST `{ personality_type: "PGB", week: 1, day: 2, completed: true }`
- **THEN** 以 upsert 方式建立或更新 `training_progress` 記錄，回傳 200

#### Scenario: 取消完成標記

- **WHEN** 已登入用戶 POST `{ personality_type: "PGB", week: 1, day: 2, completed: false }`
- **THEN** 更新該記錄的 `completed = false`

#### Scenario: 未登入用戶被拒絕

- **WHEN** 未驗證用戶 POST
- **THEN** 回傳 401

#### Scenario: week 或 day 超出範圍

- **WHEN** `week` 不在 1~4 或 `day` 不在 1~3
- **THEN** 回傳 400 Bad Request

### Requirement: 查詢個人訓練進度 API

系統 SHALL 提供 `GET /api/v1/training/progress/me` 端點。Auth: Required。

支援 query parameter `type`（選填），篩選特定型態的進度。

#### Scenario: 查詢所有型態進度

- **WHEN** 已登入用戶 GET `/api/v1/training/progress/me`
- **THEN** 回傳 `{ success: true, data: TrainingProgressRecord[] }`，依 personality_type 分組，包含各 week/day 的完成狀態

#### Scenario: 篩選特定型態進度

- **WHEN** GET `/api/v1/training/progress/me?type=PGB`
- **THEN** 僅回傳 PGB 型態的訓練進度

#### Scenario: 無進度記錄

- **WHEN** 用戶從未記錄任何訓練進度
- **THEN** 回傳 `{ success: true, data: [] }`

#### Scenario: 未登入用戶被拒絕

- **WHEN** 未驗證用戶 GET
- **THEN** 回傳 401
