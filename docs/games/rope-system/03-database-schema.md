# 資料庫設計

## 概述

遊戲系統使用 Cloudflare D1（SQLite）儲存題庫、考試、作答紀錄與認證資料。

---

## ER 關聯圖

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   categories    │       │     users       │       │      gyms       │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ type            │       │ ...             │       │ name            │
│ name            │       └────────┬────────┘       │ slug            │
│ description     │                │                │ logo_url        │
│ icon            │                │                │ is_active       │
│ order_index     │                │                └────────┬────────┘
└────────┬────────┘                │                         │
         │                         │                         │
         │ 1:N                     │                         │
         ▼                         │                         │
┌─────────────────┐                │                         │
│    questions    │                │                         │
│─────────────────│                │                         │
│ id (PK)         │                │                         │
│ category_id(FK) │                │                         │
│ type            │                │                         │
│ difficulty      │                │                         │
│ scenario        │                │                         │
│ question        │                │                         │
│ options (JSON)  │                │                         │
│ correct_answer  │                │                         │
│ explanation     │                │                         │
│ reference_sources│                │                         │
│ image_url       │                │                         │
│ is_active       │                │                         │
└────────┬────────┘                │                         │
         │                         │                         │
         │ N:M                     │                         │
         ▼                         │                         │
┌─────────────────┐                │                         │
│  exam_questions │                │                         │
│─────────────────│                │                         │
│ exam_id (FK)    │                │                         │
│ question_id(FK) │                │                         │
│ order_index     │                │                         │
└────────┬────────┘                │                         │
         │                         │                         │
         │ N:1                     │                         │
         ▼                         │                         │
┌─────────────────┐                │                         │
│     exams       │                │                         │
│─────────────────│                │                         │
│ id (PK)         │                │                         │
│ gym_id (FK)     │◄───────────────┼─────────────────────────┤
│ name            │                │                         │
│ description     │                │                         │
│ time_limit      │                │                         │
│ pass_score      │                │                         │
│ is_published    │                │                         │
└────────┬────────┘                │                         │
         │                         │                         │
         │ 1:N                     │                         │
         ▼                         │                         │
┌─────────────────┐                │                         │
│    attempts     │                │                         │
│─────────────────│                │                         │
│ id (PK)         │                │                         │
│ user_id (FK)    │◄───────────────┤                         │
│ exam_id (FK)    │                │                         │
│ category_id(FK) │                │                         │
│ mode            │                │                         │
│ score           │                │                         │
│ total_questions │                │                         │
│ correct_count   │                │                         │
│ answers (JSON)  │                │                         │
│ started_at      │                │                         │
│ completed_at    │                │                         │
└────────┬────────┘                │                         │
         │                         │                         │
         │                         │                         │
         ▼                         │                         │
┌─────────────────┐                │                         │
│ certifications  │                │                         │
│─────────────────│                │                         │
│ id (PK)         │                │                         │
│ user_id (FK)    │◄───────────────┘                         │
│ level           │                                          │
│ gym_id (FK)     │◄─────────────────────────────────────────┘
│ attempt_id (FK) │
│ issued_at       │
│ expires_at      │
└─────────────────┘
```

---

## 資料表定義

### gyms（岩館）

> 此表與網站主系統共用，這裡列出遊戲系統需要的欄位。

```sql
CREATE TABLE gyms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_gyms_slug ON gyms(slug);
CREATE INDEX idx_gyms_active ON gyms(is_active);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵（UUID） |
| name | TEXT | 岩館名稱 |
| slug | TEXT | URL 友善名稱 |
| logo_url | TEXT | 岩館 Logo |
| is_active | INTEGER | 是否啟用 |

---

### categories（題目類別）

```sql
CREATE TABLE game_categories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('sport', 'trad')),
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    icon TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    question_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_game_categories_type ON game_categories(type);
CREATE INDEX idx_game_categories_order ON game_categories(order_index);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵，如 `sport-belay`, `trad-anchor` |
| type | TEXT | 類型：`sport`（運動攀登）, `trad`（傳統攀登） |
| name | TEXT | 中文名稱 |
| name_en | TEXT | 英文名稱 |
| description | TEXT | 類別說明 |
| icon | TEXT | 圖示名稱或 URL |
| order_index | INTEGER | 排序順序 |
| question_count | INTEGER | 題目數量（快取） |

**預設資料**

```sql
INSERT INTO game_categories (id, type, name, name_en, description, order_index) VALUES
('sport-belay', 'sport', '基礎確保', 'Basic Belaying', '確保器操作、姿勢、給繩收繩', 1),
('sport-lead', 'sport', '先鋒攀登', 'Lead Climbing', '掛繩技巧、墜落係數、到頂處理', 2),
('sport-toprope', 'sport', '頂繩架設', 'Top Rope Setup', '固定點評估、架設方式', 3),
('sport-rappel', 'sport', '垂降系統', 'Rappelling', '垂降裝置、備份系統', 4),
('trad-anchor', 'trad', '固定點架設', 'Anchor Building', 'SERENE原則、均力分散', 5),
('trad-protection', 'trad', '保護裝備放置', 'Protection Placement', 'Cam與Nut放置技巧', 6),
('trad-multipitch', 'trad', '多繩距系統', 'Multi-pitch Systems', '系統轉換、繩索管理', 7),
('trad-rescue', 'trad', '自我救援', 'Self Rescue', '脫困、攀升、拖吊', 8);
```

---

### questions（題目）

```sql
CREATE TABLE game_questions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('choice', 'ordering', 'situation')),
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
    scenario TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,  -- JSON array
    correct_answer TEXT NOT NULL,  -- 單一值或 JSON array（排序題）
    explanation TEXT,
    hint TEXT,
    reference_sources TEXT,  -- JSON array: 參考來源
    image_url TEXT,
    animation_url TEXT,
    tags TEXT,  -- JSON array
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES game_categories(id)
);

-- 索引
CREATE INDEX idx_game_questions_category ON game_questions(category_id);
CREATE INDEX idx_game_questions_type ON game_questions(type);
CREATE INDEX idx_game_questions_difficulty ON game_questions(difficulty);
CREATE INDEX idx_game_questions_active ON game_questions(is_active);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵，如 `sport-belay-001` |
| category_id | TEXT | 所屬類別 |
| type | TEXT | 題型：`choice`/`ordering`/`situation` |
| difficulty | INTEGER | 難度 1-3（⭐⭐⭐） |
| scenario | TEXT | 情境描述 |
| question | TEXT | 問題內容 |
| options | TEXT | 選項（JSON 格式） |
| correct_answer | TEXT | 正確答案 |
| explanation | TEXT | 答案解釋 |
| hint | TEXT | 提示（學習模式用） |
| reference_sources | TEXT | 參考來源（JSON 格式） |
| image_url | TEXT | 題目圖片 |
| animation_url | TEXT | 操作動畫 |
| tags | TEXT | 標籤（JSON 格式） |
| is_active | INTEGER | 是否啟用 |

**options JSON 格式**

```json
// 選擇題
[
  { "id": "A", "text": "選項內容", "image": "/path/to/image.svg" },
  { "id": "B", "text": "選項內容", "image": null },
  { "id": "C", "text": "選項內容", "image": null }
]

// 排序題
[
  { "id": "A", "text": "步驟一" },
  { "id": "B", "text": "步驟二" },
  { "id": "C", "text": "步驟三" }
]
```

**correct_answer 格式**

```json
// 選擇題
"A"

// 排序題（正確順序）
["C", "A", "B", "D"]
```

---

### exams（考試）

```sql
CREATE TABLE game_exams (
    id TEXT PRIMARY KEY,
    gym_id TEXT,  -- NULL 表示系統預設考卷
    name TEXT NOT NULL,
    description TEXT,
    category_ids TEXT,  -- JSON array，限定類別
    question_count INTEGER NOT NULL DEFAULT 20,
    time_limit INTEGER,  -- 秒數，NULL 表示無限制
    pass_score INTEGER NOT NULL DEFAULT 80,
    randomize_questions INTEGER NOT NULL DEFAULT 1,
    randomize_options INTEGER NOT NULL DEFAULT 0,
    show_explanation INTEGER NOT NULL DEFAULT 0,  -- 考試中是否顯示解釋
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gym_id) REFERENCES gyms(id)
);

-- 索引
CREATE INDEX idx_game_exams_gym ON game_exams(gym_id);
CREATE INDEX idx_game_exams_published ON game_exams(is_published);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| gym_id | TEXT | 岩館 ID（NULL 為系統預設） |
| name | TEXT | 考試名稱 |
| description | TEXT | 考試說明 |
| category_ids | TEXT | 限定類別（JSON） |
| question_count | INTEGER | 出題數量 |
| time_limit | INTEGER | 時間限制（秒） |
| pass_score | INTEGER | 及格分數 |
| randomize_questions | INTEGER | 是否隨機出題 |
| randomize_options | INTEGER | 是否隨機選項順序 |
| show_explanation | INTEGER | 是否顯示解釋 |
| is_published | INTEGER | 是否發布 |

---

### exam_questions（考試題目關聯）

```sql
CREATE TABLE game_exam_questions (
    exam_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (exam_id, question_id),
    FOREIGN KEY (exam_id) REFERENCES game_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES game_questions(id)
);

-- 索引
CREATE INDEX idx_game_exam_questions_exam ON game_exam_questions(exam_id);
```

**說明**

用於自訂考卷指定特定題目。若考試設定 `randomize_questions = 1` 且未指定題目，則從 `category_ids` 中隨機抽題。

---

### attempts（作答紀錄）

```sql
CREATE TABLE game_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT,  -- NULL 表示學習模式
    category_id TEXT,  -- 學習模式時使用
    mode TEXT NOT NULL CHECK (mode IN ('learn', 'exam')),
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    combo_max INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER,  -- 總耗時（秒）
    answers TEXT,  -- JSON: { questionId: { answer, isCorrect, timeSpent } }
    is_passed INTEGER,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES game_exams(id),
    FOREIGN KEY (category_id) REFERENCES game_categories(id)
);

-- 索引
CREATE INDEX idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX idx_game_attempts_exam ON game_attempts(exam_id);
CREATE INDEX idx_game_attempts_category ON game_attempts(category_id);
CREATE INDEX idx_game_attempts_mode ON game_attempts(mode);
CREATE INDEX idx_game_attempts_completed ON game_attempts(completed_at);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵（UUID） |
| user_id | TEXT | 使用者 ID |
| exam_id | TEXT | 考試 ID（考試模式） |
| category_id | TEXT | 類別 ID（學習模式） |
| mode | TEXT | 模式：`learn`/`exam` |
| score | INTEGER | 總分 |
| total_questions | INTEGER | 總題數 |
| correct_count | INTEGER | 答對題數 |
| wrong_count | INTEGER | 答錯題數 |
| combo_max | INTEGER | 最大連擊數 |
| time_spent | INTEGER | 總耗時（秒） |
| answers | TEXT | 作答詳情（JSON） |
| is_passed | INTEGER | 是否及格 |
| started_at | DATETIME | 開始時間 |
| completed_at | DATETIME | 完成時間 |

**answers JSON 格式**

```json
{
  "sport-belay-001": {
    "answer": "A",
    "isCorrect": true,
    "timeSpent": 12
  },
  "sport-belay-002": {
    "answer": "C",
    "isCorrect": false,
    "timeSpent": 8
  }
}
```

---

### certifications（認證）

```sql
CREATE TABLE game_certifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    gym_id TEXT,  -- 發證岩館，NULL 為系統認證
    attempt_id TEXT,  -- 取得認證的考試紀錄
    certificate_url TEXT,  -- 證書圖片 URL
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,  -- NULL 表示永久有效
    revoked_at DATETIME,  -- 撤銷時間
    revoke_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (gym_id) REFERENCES gyms(id),
    FOREIGN KEY (attempt_id) REFERENCES game_attempts(id)
);

-- 索引
CREATE INDEX idx_game_certifications_user ON game_certifications(user_id);
CREATE INDEX idx_game_certifications_level ON game_certifications(level);
CREATE INDEX idx_game_certifications_gym ON game_certifications(gym_id);
CREATE UNIQUE INDEX idx_game_certifications_unique ON game_certifications(user_id, level, gym_id)
    WHERE revoked_at IS NULL;
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵（UUID） |
| user_id | TEXT | 使用者 ID |
| level | INTEGER | 認證等級 1-5 |
| gym_id | TEXT | 發證岩館 |
| attempt_id | TEXT | 關聯的考試紀錄 |
| certificate_url | TEXT | 證書圖片 |
| issued_at | DATETIME | 發證時間 |
| expires_at | DATETIME | 過期時間 |
| revoked_at | DATETIME | 撤銷時間 |
| revoke_reason | TEXT | 撤銷原因 |

---

### question_stats（題目統計）

```sql
CREATE TABLE game_question_stats (
    question_id TEXT PRIMARY KEY,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    avg_time_spent REAL,  -- 平均作答時間（秒）
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES game_questions(id)
);
```

**用途**

追蹤每題的答對率，用於：
- 難度校正
- 找出問題題目
- 數據分析報表

---

## 查詢範例

### 取得類別列表（含進度）

```sql
SELECT
    c.*,
    COALESCE(
        (SELECT COUNT(DISTINCT a.id)
         FROM game_attempts a
         WHERE a.category_id = c.id
         AND a.user_id = ?
         AND a.mode = 'learn'
         AND a.correct_count = a.total_questions),
        0
    ) as completed_count
FROM game_categories c
ORDER BY c.order_index;
```

### 隨機抽題

```sql
SELECT * FROM game_questions
WHERE category_id IN ('sport-belay', 'sport-lead')
AND is_active = 1
ORDER BY RANDOM()
LIMIT 20;
```

### 使用者認證狀態

```sql
SELECT
    level,
    issued_at,
    expires_at,
    CASE
        WHEN revoked_at IS NOT NULL THEN 'revoked'
        WHEN expires_at < CURRENT_TIMESTAMP THEN 'expired'
        ELSE 'valid'
    END as status
FROM game_certifications
WHERE user_id = ?
AND revoked_at IS NULL
ORDER BY level DESC;
```

### 題目答對率排行

```sql
SELECT
    q.id,
    q.question,
    s.attempt_count,
    ROUND(s.correct_count * 100.0 / s.attempt_count, 1) as correct_rate
FROM game_questions q
JOIN game_question_stats s ON q.id = s.question_id
WHERE s.attempt_count >= 10
ORDER BY correct_rate ASC
LIMIT 20;
```

---

## Migration 檔案

```sql
-- migrations/0001_create_game_tables.sql

-- 岩館表（若尚未存在）
CREATE TABLE IF NOT EXISTS gyms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);
CREATE INDEX IF NOT EXISTS idx_gyms_active ON gyms(is_active);

-- 類別表
CREATE TABLE IF NOT EXISTS game_categories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('sport', 'trad')),
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    icon TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    question_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 題目表
CREATE TABLE IF NOT EXISTS game_questions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('choice', 'ordering', 'situation')),
    difficulty INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
    scenario TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    hint TEXT,
    reference_sources TEXT,  -- JSON array: 參考來源
    image_url TEXT,
    animation_url TEXT,
    tags TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES game_categories(id)
);

-- 考試表
CREATE TABLE IF NOT EXISTS game_exams (
    id TEXT PRIMARY KEY,
    gym_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category_ids TEXT,
    question_count INTEGER NOT NULL DEFAULT 20,
    time_limit INTEGER,
    pass_score INTEGER NOT NULL DEFAULT 80,
    randomize_questions INTEGER NOT NULL DEFAULT 1,
    randomize_options INTEGER NOT NULL DEFAULT 0,
    show_explanation INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 考試題目關聯表
CREATE TABLE IF NOT EXISTS game_exam_questions (
    exam_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (exam_id, question_id),
    FOREIGN KEY (exam_id) REFERENCES game_exams(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES game_questions(id)
);

-- 作答紀錄表
CREATE TABLE IF NOT EXISTS game_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT,
    category_id TEXT,
    mode TEXT NOT NULL CHECK (mode IN ('learn', 'exam')),
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    combo_max INTEGER NOT NULL DEFAULT 0,
    time_spent INTEGER,
    answers TEXT,
    is_passed INTEGER,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- 認證表
CREATE TABLE IF NOT EXISTS game_certifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    gym_id TEXT,
    attempt_id TEXT,
    certificate_url TEXT,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    revoked_at DATETIME,
    revoke_reason TEXT
);

-- 題目統計表
CREATE TABLE IF NOT EXISTS game_question_stats (
    question_id TEXT PRIMARY KEY,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    avg_time_spent REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES game_questions(id)
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_game_categories_type ON game_categories(type);
CREATE INDEX IF NOT EXISTS idx_game_questions_category ON game_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_game_questions_active ON game_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_completed ON game_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_game_certifications_user ON game_certifications(user_id);
```
