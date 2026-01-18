# 資料庫設計

## 概述

遊戲系統使用 Cloudflare D1（SQLite）儲存題庫、考試、作答紀錄與認證資料。

---

## ER 關聯圖

> 📌 **圖例說明**：
> - 🔵 藍色區塊：現有主系統資料表（gyms, users）
> - 🟢 綠色區塊：遊戲系統新增資料表

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           現有主系統資料表 (藍色)                             │
│  ┌─────────────────┐                              ┌─────────────────┐       │
│  │     users       │                              │      gyms       │       │
│  │─────────────────│                              │─────────────────│       │
│  │ id (PK)         │                              │ id (PK)         │       │
│  │ username        │                              │ name            │       │
│  │ display_name    │                              │ slug            │       │
│  │ avatar_url      │                              │ cover_image     │       │
│  │ role            │                              │ ...             │       │
│  └────────┬────────┘                              └────────┬────────┘       │
└───────────┼────────────────────────────────────────────────┼────────────────┘
            │                                                │
            │                                                │ (可選連結)
            ▼                                                ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                          遊戲系統資料表 (綠色)                                  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                     game_organizations (組織)                        │     │
│  │  ┌─────────────────┐                                                │     │
│  │  │ id (PK)         │◄────────────────────────────────┐              │     │
│  │  │ type            │  (gym/school/guide/club/...)    │              │     │
│  │  │ name            │                                 │              │     │
│  │  │ linked_gym_id   │──► gyms (可選)                  │              │     │
│  │  │ is_active       │                                 │              │     │
│  │  └─────────────────┘                                 │              │     │
│  │           │                                          │              │     │
│  │     ┌─────┴─────┬───────────────┐                   │              │     │
│  │     ▼           ▼               ▼                   │              │     │
│  │  ┌────────┐ ┌────────┐    ┌──────────┐             │              │     │
│  │  │org_    │ │org_    │    │  exams   │             │              │     │
│  │  │admins  │ │members │    │──────────│             │              │     │
│  │  │────────│ │────────│    │org_id(FK)│─────────────┘              │     │
│  │  │user_id │ │user_id │    │name      │                            │     │
│  │  │role    │ │status  │    │pass_score│                            │     │
│  │  └────────┘ └────────┘    └────┬─────┘                            │     │
│  │       │          │             │                                  │     │
│  │       └──────────┼─────────────┤                                  │     │
│  │                  │             │                                  │     │
│  └──────────────────┼─────────────┼──────────────────────────────────┘     │
│                     │             │                                        │
│                     │             │ 1:N                                    │
│                     │             ▼                                        │
│  ┌─────────────────┐│    ┌─────────────────┐                              │
│  │   categories    ││    │    attempts     │                              │
│  │─────────────────││    │─────────────────│                              │
│  │ id (PK)         ││    │ user_id (FK)    │◄── users                     │
│  │ type            ││    │ exam_id (FK)    │                              │
│  │ name            ││    │ org_id (FK)     │◄── organizations             │
│  └────────┬────────┘│    │ score           │                              │
│           │         │    │ is_passed       │                              │
│           │ 1:N     │    └────────┬────────┘                              │
│           ▼         │             │                                        │
│  ┌─────────────────┐│             │ 1:1                                   │
│  │    questions    ││             ▼                                        │
│  │─────────────────││    ┌─────────────────┐                              │
│  │ category_id(FK) │└───►│ certifications  │                              │
│  │ type            │     │─────────────────│                              │
│  │ difficulty      │     │ user_id (FK)    │◄── users                     │
│  │ question        │     │ org_id (FK)     │◄── organizations             │
│  │ options (JSON)  │     │ level           │                              │
│  └─────────────────┘     │ attempt_id (FK) │                              │
│                          └─────────────────┘                              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 資料表關聯說明

| 關聯 | 說明 |
|------|------|
| gyms → game_organizations | 0:1，岩館可選擇性關聯到遊戲組織 |
| users → game_org_admins | 1:N，用戶可管理多個組織 |
| users → game_org_members | 1:N，用戶可加入多個組織 |
| game_organizations → game_exams | 1:N，組織可建立多個考卷 |
| users → game_attempts | 1:N，用戶可多次作答 |
| users → game_certifications | 1:N，用戶可獲得多個認證 |
| game_categories → game_questions | 1:N，類別包含多題 |
| game_questions ↔ game_exams | N:M，透過 game_exam_questions 關聯 |

---

## 資料表定義

### gyms（岩館）- 使用現有資料表

> ⚠️ **重要**：此表已存在於主系統 (`backend/src/db/schema.sql`)，遊戲系統直接引用，不需另外建立。

```sql
-- 現有 gyms 表結構（來自主系統）
CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  email TEXT,
  website TEXT,
  cover_image TEXT,           -- 遊戲系統使用此欄位作為岩館 Logo
  is_featured INTEGER DEFAULT 0,
  opening_hours TEXT,         -- JSON string
  facilities TEXT,            -- JSON array
  price_info TEXT,            -- JSON object
  rating_avg REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**遊戲系統使用的欄位**

| 欄位 | 說明 |
|------|------|
| id | 主鍵，用於關聯 exams 和 certifications |
| name | 岩館名稱，顯示於考卷和認證 |
| slug | URL 友善名稱，用於路由 |
| cover_image | 作為岩館 Logo 顯示 |

> **注意**：現有 gyms 表無 `is_active` 欄位。遊戲系統透過 `game_organizations` 表來管理哪些單位可使用遊戲功能。

---

### game_organizations（遊戲系統組織）- 新增

> 管理可使用遊戲系統的組織單位。支援多種類型的組織，不限於岩館。

```sql
CREATE TABLE IF NOT EXISTS game_organizations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('gym', 'school', 'guide', 'club', 'association', 'company', 'other')),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    -- 若為岩館類型，可關聯到現有 gyms 表
    linked_gym_id TEXT,
    -- 設定
    is_active INTEGER NOT NULL DEFAULT 1,
    custom_branding TEXT,           -- JSON: { primaryColor, logo, certificate_template }
    settings TEXT,                  -- JSON: 組織專屬設定
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (linked_gym_id) REFERENCES gyms(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_game_orgs_type ON game_organizations(type);
CREATE INDEX IF NOT EXISTS idx_game_orgs_slug ON game_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_game_orgs_active ON game_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_game_orgs_gym ON game_organizations(linked_gym_id);
```

**組織類型說明**

| 類型 | 說明 | 範例 |
|------|------|------|
| gym | 室內岩館 | 攀岩工廠、RedRock、岩究所 |
| school | 攀岩學校/教學機構 | 台灣攀岩學校、TARA 訓練中心 |
| guide | 戶外嚮導公司 | 戶外探索、溯溪攀岩團隊 |
| club | 社團/俱樂部 | 大學登山社、攀岩同好會 |
| association | 協會/官方組織 | 中華民國山岳協會、各縣市攀岩委員會 |
| company | 企業/團體 | 公司內訓、戶外團建 |
| other | 其他 | 自訂組織 |

**與現有岩館整合**

若組織類型為 `gym` 且網站已有該岩館資料，可透過 `linked_gym_id` 關聯：
- 自動同步岩館名稱、Logo
- 在岩館頁面顯示「此岩館提供繩索系統認證」
- 學員可從岩館頁面直接進入考試

---

### game_org_admins（組織管理員）- 新增

> 管理組織的後台管理員權限。

```sql
CREATE TABLE IF NOT EXISTS game_org_admins (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'instructor')),
    permissions TEXT,           -- JSON: 細部權限設定
    invited_by TEXT,            -- 邀請人 user_id
    invited_at DATETIME,
    accepted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_game_org_admins_org ON game_org_admins(org_id);
CREATE INDEX IF NOT EXISTS idx_game_org_admins_user ON game_org_admins(user_id);
```

**角色說明**

| 角色 | 權限 |
|------|------|
| owner | 完整權限：管理組織設定、邀請/移除管理員、所有題目與考卷管理 |
| admin | 管理權限：管理題目、考卷、查看學員成績、發放認證 |
| instructor | 教練權限：查看學員成績、發放認證、監考 |

**權限 JSON 格式（可選，用於細部控制）**

```json
{
  "manage_questions": true,      // 管理題目
  "manage_exams": true,          // 管理考卷
  "view_analytics": true,        // 查看數據分析
  "issue_certifications": true,  // 發放認證
  "manage_members": false        // 管理成員（僅 owner）
}
```

---

### game_org_members（組織成員/學員）- 新增

> 追蹤組織的學員名單，用於統計與權限控制。

```sql
CREATE TABLE IF NOT EXISTS game_org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,                 -- 管理員備註
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_game_org_members_org ON game_org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_game_org_members_user ON game_org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_game_org_members_status ON game_org_members(status);
```

> **用途**：組織可管理自己的學員名單，限定只有成員才能參加該組織的考試。若不設限，則所有用戶都可參加。

---

### users（使用者）- 使用現有資料表

> 此表已存在於主系統，遊戲系統直接引用。

```sql
-- 現有 users 表結構（來自主系統）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- nullable (用於OAuth)
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  climbing_start_year TEXT,
  frequent_gym TEXT,
  favorite_route_type TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  google_id TEXT UNIQUE,                 -- OAuth支援
  auth_provider TEXT DEFAULT 'local',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**遊戲系統使用的欄位**

| 欄位 | 說明 |
|------|------|
| id | 主鍵，關聯作答紀錄和認證 |
| display_name / username | 顯示名稱 |
| avatar_url | 頭像 |
| role | 系統管理員（admin）可管理所有岩館 |

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
    org_id TEXT,  -- NULL 表示系統預設考卷（公開題庫）
    name TEXT NOT NULL,
    description TEXT,
    category_ids TEXT,  -- JSON array，限定類別
    question_count INTEGER NOT NULL DEFAULT 20,
    time_limit INTEGER,  -- 秒數，NULL 表示無限制
    pass_score INTEGER NOT NULL DEFAULT 80,
    randomize_questions INTEGER NOT NULL DEFAULT 1,
    randomize_options INTEGER NOT NULL DEFAULT 0,
    show_explanation INTEGER NOT NULL DEFAULT 0,  -- 考試中是否顯示解釋
    require_membership INTEGER NOT NULL DEFAULT 0,  -- 是否限定組織成員
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_game_exams_org ON game_exams(org_id);
CREATE INDEX idx_game_exams_published ON game_exams(is_published);
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵 |
| org_id | TEXT | 組織 ID（NULL 為系統公開考卷） |
| name | TEXT | 考試名稱 |
| description | TEXT | 考試說明 |
| category_ids | TEXT | 限定類別（JSON） |
| question_count | INTEGER | 出題數量 |
| time_limit | INTEGER | 時間限制（秒） |
| pass_score | INTEGER | 及格分數 |
| randomize_questions | INTEGER | 是否隨機出題 |
| randomize_options | INTEGER | 是否隨機選項順序 |
| show_explanation | INTEGER | 是否顯示解釋 |
| require_membership | INTEGER | 是否限定組織成員才能參加 |
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
    org_id TEXT,  -- 所屬組織（可追蹤學員來源）
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
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (exam_id) REFERENCES game_exams(id),
    FOREIGN KEY (category_id) REFERENCES game_categories(id)
);

-- 索引
CREATE INDEX idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX idx_game_attempts_org ON game_attempts(org_id);
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
| org_id | TEXT | 組織 ID（追蹤學員來源） |
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
    org_id TEXT,  -- 發證組織，NULL 為系統認證
    attempt_id TEXT,  -- 取得認證的考試紀錄
    certificate_url TEXT,  -- 證書圖片 URL
    certificate_number TEXT UNIQUE,  -- 證書編號
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,  -- NULL 表示永久有效
    revoked_at DATETIME,  -- 撤銷時間
    revoke_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (attempt_id) REFERENCES game_attempts(id)
);

-- 索引
CREATE INDEX idx_game_certifications_user ON game_certifications(user_id);
CREATE INDEX idx_game_certifications_level ON game_certifications(level);
CREATE INDEX idx_game_certifications_org ON game_certifications(org_id);
CREATE INDEX idx_game_certifications_number ON game_certifications(certificate_number);
CREATE UNIQUE INDEX idx_game_certifications_unique ON game_certifications(user_id, level, org_id)
    WHERE revoked_at IS NULL;
```

**欄位說明**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | TEXT | 主鍵（UUID） |
| user_id | TEXT | 使用者 ID |
| level | INTEGER | 認證等級 1-5 |
| org_id | TEXT | 發證組織 |
| attempt_id | TEXT | 關聯的考試紀錄 |
| certificate_url | TEXT | 證書圖片 URL |
| certificate_number | TEXT | 證書編號（唯一） |
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
-- migrations/XXXX_create_game_tables.sql
--
-- 注意：此 migration 假設 gyms 和 users 表已存在（來自主系統）
-- 執行前請確認主系統的 migration 已完成

-- ============================================
-- 遊戲系統專用資料表
-- ============================================

-- 組織表（支援岩館、學校、嚮導公司、社團等）
CREATE TABLE IF NOT EXISTS game_organizations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('gym', 'school', 'guide', 'club', 'association', 'company', 'other')),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    contact_email TEXT,
    linked_gym_id TEXT,  -- 若為岩館類型，可關聯到現有 gyms 表
    is_active INTEGER NOT NULL DEFAULT 1,
    custom_branding TEXT,
    settings TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (linked_gym_id) REFERENCES gyms(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_game_orgs_type ON game_organizations(type);
CREATE INDEX IF NOT EXISTS idx_game_orgs_slug ON game_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_game_orgs_active ON game_organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_game_orgs_gym ON game_organizations(linked_gym_id);

-- 組織管理員表
CREATE TABLE IF NOT EXISTS game_org_admins (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'instructor')),
    permissions TEXT,
    invited_by TEXT,
    invited_at DATETIME,
    accepted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_game_org_admins_org ON game_org_admins(org_id);
CREATE INDEX IF NOT EXISTS idx_game_org_admins_user ON game_org_admins(user_id);

-- 組織成員表
CREATE TABLE IF NOT EXISTS game_org_members (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    UNIQUE(org_id, user_id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_org_members_org ON game_org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_game_org_members_user ON game_org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_game_org_members_status ON game_org_members(status);

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
    org_id TEXT,  -- NULL 表示系統公開考卷
    name TEXT NOT NULL,
    description TEXT,
    category_ids TEXT,
    question_count INTEGER NOT NULL DEFAULT 20,
    time_limit INTEGER,
    pass_score INTEGER NOT NULL DEFAULT 80,
    randomize_questions INTEGER NOT NULL DEFAULT 1,
    randomize_options INTEGER NOT NULL DEFAULT 0,
    show_explanation INTEGER NOT NULL DEFAULT 0,
    require_membership INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_exams_org ON game_exams(org_id);

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
    org_id TEXT,  -- 所屬組織
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
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (exam_id) REFERENCES game_exams(id),
    FOREIGN KEY (category_id) REFERENCES game_categories(id)
);

-- 認證表
CREATE TABLE IF NOT EXISTS game_certifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    org_id TEXT,  -- 發證組織
    attempt_id TEXT,
    certificate_url TEXT,
    certificate_number TEXT UNIQUE,
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    revoked_at DATETIME,
    revoke_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (org_id) REFERENCES game_organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (attempt_id) REFERENCES game_attempts(id)
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
CREATE INDEX IF NOT EXISTS idx_game_exams_published ON game_exams(is_published);
CREATE INDEX IF NOT EXISTS idx_game_attempts_user ON game_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_org ON game_attempts(org_id);
CREATE INDEX IF NOT EXISTS idx_game_attempts_completed ON game_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_game_certifications_user ON game_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_game_certifications_org ON game_certifications(org_id);
CREATE INDEX IF NOT EXISTS idx_game_certifications_number ON game_certifications(certificate_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_certifications_unique ON game_certifications(user_id, level, org_id)
    WHERE revoked_at IS NULL;
```
