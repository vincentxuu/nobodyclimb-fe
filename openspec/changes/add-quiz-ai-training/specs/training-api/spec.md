## MODIFIED Requirements

### Requirement: 取得訓練計畫內容 API

系統 SHALL 提供 `GET /api/v1/training/plan/:type` 端點。Auth: None。

`:type` 為 3 字母 PersonalityTypeCode。回傳該型態的 4 週 x 3 天訓練計畫內容，資料來源為 `@nobodyclimb/constants` 的靜態定義。

若用戶已登入且該型態有 AI 生成計畫，回傳中 SHALL 額外包含 `ai_available: true` 標記，提示前端可切換至 AI 計畫。

#### Scenario: 取得碎岩者訓練計畫

- **WHEN** GET `/api/v1/training/plan/PGB`
- **THEN** 回傳 `{ success: true, data: TrainingPlan }`，包含 4 週、每週 3 天、每天含 title、description、duration、exercises

#### Scenario: 無效型態代碼

- **WHEN** GET `/api/v1/training/plan/XXX`
- **THEN** 回傳 400 Bad Request

#### Scenario: 已登入用戶有 AI 計畫

- **WHEN** 已登入用戶 GET `/api/v1/training/plan/PGB`，且該用戶有 AI 生成的 PGB 計畫
- **THEN** 回傳中額外包含 `ai_available: true`
