## ADDED Requirements

### Requirement: 測驗結果儲存 API

系統 SHALL 提供 `POST /api/v1/quiz/results` 端點儲存測驗結果。Auth: Optional。

Request Body（Zod 驗證）：
- `answers`: number[]（24 個 1~5 的整數）
- `personality_type`: string（3 字母代號，須為合法 PersonalityTypeCode）
- `power_pct`: number（0~100）
- `goal_pct`: number（0~100）
- `bold_pct`: number（0~100）
- `grit_index`: number | null（0~100，Goal 型適用）
- `flow_index`: number | null（0~100，Free 型適用）

#### Scenario: 已登入用戶儲存結果

- **WHEN** 已登入用戶 POST 測驗結果
- **THEN** 建立 `quiz_results` 記錄（user_id 為當前用戶），同時更新 `users.personality_type` 與 `users.personality_taken_at`，回傳 201 與記錄 id

#### Scenario: 匿名用戶儲存結果

- **WHEN** 未登入用戶 POST 測驗結果
- **THEN** 建立 `quiz_results` 記錄（user_id 為 null），回傳 201 與記錄 id

#### Scenario: 答案驗證失敗

- **WHEN** `answers` 長度不為 24 或任一值不在 1~5 範圍
- **THEN** 回傳 400 Bad Request，含 Zod 驗證錯誤訊息

#### Scenario: personality_type 不合法

- **WHEN** `personality_type` 不在 8 種合法代碼中
- **THEN** 回傳 400 Bad Request

### Requirement: 個人結果查詢 API

系統 SHALL 提供 `GET /api/v1/quiz/results/me` 端點。Auth: Required。

回傳最新一次結果與歷史記錄列表。

#### Scenario: 用戶查詢自己的結果

- **WHEN** 已登入用戶 GET `/api/v1/quiz/results/me`
- **THEN** 回傳 `{ success: true, data: { latest: QuizResult | null, history: QuizResult[] } }`，依 created_at 降序排列

#### Scenario: 未測驗過的用戶

- **WHEN** 從未測驗的用戶查詢
- **THEN** 回傳 `{ success: true, data: { latest: null, history: [] } }`

#### Scenario: 未登入用戶查詢

- **WHEN** 未驗證用戶 GET `/api/v1/quiz/results/me`
- **THEN** 回傳 401

### Requirement: 全站統計 API

系統 SHALL 提供 `GET /api/v1/quiz/stats` 端點。Auth: None。

#### Scenario: 查詢統計

- **WHEN** 任何人 GET `/api/v1/quiz/stats`
- **THEN** 回傳 `{ success: true, data: { totalTests: number, distribution: Record<PersonalityTypeCode, number>, recentTests: number } }`
- **THEN** `distribution` 為各型態佔比百分比（加總 100%），`recentTests` 為最近 24 小時測驗數

#### Scenario: KV Cache 命中

- **WHEN** 1 小時內重複查詢
- **THEN** 從 KV cache 回傳，不查詢 D1

#### Scenario: Cache 過期

- **WHEN** KV cache 超過 1 小時 TTL
- **THEN** 重新查詢 D1 並寫入 KV cache

### Requirement: OpenAPI 文件

系統 SHALL 為所有 quiz 端點產生 OpenAPI 3.1 文件，透過 `hono-openapi` 的 route decorator 自動註冊。

#### Scenario: OpenAPI JSON 包含 quiz 端點

- **WHEN** GET `/api/v1/openapi.json`
- **THEN** 回應包含 `/api/v1/quiz/results`、`/api/v1/quiz/results/me`、`/api/v1/quiz/stats` 路徑定義
