## ADDED Requirements

### Requirement: 測驗結果儲存 API

系統 SHALL 提供 `POST /api/v1/quiz/results` 端點儲存測驗結果。

Request Body:
- `answers`: number[]（24 個 1-5 的整數）
- `personality_type`: string（3 字母代號）
- `power_pct`: number（0-100）
- `goal_pct`: number（0-100）
- `bold_pct`: number（0-100）
- `grit_index`: number | null（0-100，Goal 型態）
- `flow_index`: number | null（0-100，Free 型態）

Auth: Optional — 已登入用戶綁定 user_id；未登入用戶以匿名記錄儲存（可於後續登入時綁定）。

#### Scenario: 已登入用戶儲存結果

- **WHEN** 已登入用戶 POST 測驗結果
- **THEN** 建立 `quiz_results` 記錄，user_id 為當前用戶，同時更新 `users.personality_type` 和 `users.personality_taken_at`

#### Scenario: 匿名用戶儲存結果

- **WHEN** 未登入用戶 POST 測驗結果
- **THEN** 建立 `quiz_results` 記錄，user_id 為 null

#### Scenario: 答案驗證失敗

- **WHEN** answers 長度不為 24 或任一值不在 1-5 範圍
- **THEN** 回傳 400 Bad Request

### Requirement: 個人結果查詢 API

系統 SHALL 提供 `GET /api/v1/quiz/results/me` 端點。Auth: Required。

回傳：最新一次結果 + 歷史記錄列表。

#### Scenario: 用戶查詢自己的結果

- **WHEN** 已登入用戶 GET `/api/v1/quiz/results/me`
- **THEN** 回傳 `{ latest: QuizResult, history: QuizResult[] }`，依 created_at 降序

#### Scenario: 未測驗過的用戶

- **WHEN** 從未測驗的用戶查詢
- **THEN** 回傳 `{ latest: null, history: [] }`

### Requirement: 全站統計 API

系統 SHALL 提供 `GET /api/v1/quiz/stats` 端點。Auth: None。

回傳：總測驗數、各型態分佈百分比、最近 24 小時測驗數。結果 SHALL 使用 KV cache，TTL 1 小時。

#### Scenario: 查詢統計

- **WHEN** 任何人 GET `/api/v1/quiz/stats`
- **THEN** 回傳 `{ totalTests, distribution: { PGB: 15.2, ... }, recentTests }`

#### Scenario: Cache 命中

- **WHEN** 1 小時內重複查詢
- **THEN** 從 KV cache 回傳，不查詢 D1

### Requirement: 型態排名 API

系統 SHALL 提供 `GET /api/v1/quiz/ranking/:type` 端點。Auth: Optional。

回傳同型態用戶列表，依攀登記錄指標排序（如完攀數、最高難度）。

#### Scenario: 查詢碎岩者排名

- **WHEN** GET `/api/v1/quiz/ranking/PGB`
- **THEN** 回傳所有 personality_type = 'PGB' 的用戶，依攀登表現排序

### Requirement: D1 Schema

系統 SHALL 建立以下 D1 表：

```sql
CREATE TABLE quiz_results (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  personality_type TEXT NOT NULL,
  power_pct INTEGER NOT NULL,
  goal_pct INTEGER NOT NULL,
  bold_pct INTEGER NOT NULL,
  grit_index INTEGER,
  flow_index INTEGER,
  answers TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_quiz_type ON quiz_results(personality_type);
CREATE INDEX idx_quiz_user ON quiz_results(user_id);
```

系統 SHALL 在 `users` 表新增欄位：

```sql
ALTER TABLE users ADD COLUMN personality_type TEXT;
ALTER TABLE users ADD COLUMN personality_taken_at TEXT;
```

#### Scenario: Migration 執行

- **WHEN** 執行 `pnpm db:migrate`
- **THEN** quiz_results 表和 users 欄位變更成功建立
