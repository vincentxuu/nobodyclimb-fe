## ADDED Requirements

### Requirement: quiz_results 資料表

系統 SHALL 建立 `quiz_results` 資料表儲存每次測驗結果。

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

#### Scenario: Migration 建立 quiz_results

- **WHEN** 執行 `pnpm db:migrate`
- **THEN** `quiz_results` 表與索引成功建立，支援 user_id 為 NULL（匿名測驗）

### Requirement: users 表新增性格欄位

系統 SHALL 在 `users` 表新增 `personality_type` 與 `personality_taken_at` 欄位。

```sql
ALTER TABLE users ADD COLUMN personality_type TEXT;
ALTER TABLE users ADD COLUMN personality_taken_at TEXT;
```

#### Scenario: 欄位新增成功

- **WHEN** Migration 執行完成
- **THEN** `users` 表包含 `personality_type`（TEXT, nullable）與 `personality_taken_at`（TEXT, nullable）欄位

### Requirement: training_progress 資料表

系統 SHALL 建立 `training_progress` 資料表追蹤用戶訓練進度。

```sql
CREATE TABLE training_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  personality_type TEXT NOT NULL,
  week INTEGER NOT NULL,
  day INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_training_user ON training_progress(user_id);
CREATE INDEX idx_training_type ON training_progress(personality_type);
```

#### Scenario: Migration 建立 training_progress

- **WHEN** 執行 `pnpm db:migrate`
- **THEN** `training_progress` 表與索引成功建立

#### Scenario: 同一用戶同一型態同一天不可重複記錄

- **WHEN** 用戶嘗試記錄已存在的 (user_id, personality_type, week, day) 組合
- **THEN** 系統 SHALL 以 upsert 方式更新 completed 狀態，而非新增重複記錄
