# 人物誌內容調整建議

> 版本: 1.1
> 建立日期: 2026-01-11
> 更新: 移除向後相容，直接採用新設計

---

## 整體架構

```
Biography (主表)
├─ 基本資訊
├─ 核心故事欄位
└─ 進階故事欄位

BucketListItem (獨立表)
├─ 結構化目標清單
├─ 進度追蹤
└─ 完成故事

BiographyStory (獨立表) [選用]
└─ 動態故事卡片
```

---

## 一、資料結構

### 1. Biography 主表

```typescript
interface Biography {
  // ═══════════════════════════════════════════
  // 基本資訊
  // ═══════════════════════════════════════════
  id: string
  user_id: string | null
  slug: string
  name: string
  avatar_url: string | null
  cover_image: string | null

  // ═══════════════════════════════════════════
  // 攀岩基本資訊
  // ═══════════════════════════════════════════
  climbing_start_year: string | null      // 哪一年開始攀岩
  frequent_locations: string | null       // 平常出沒的地方
  favorite_route_type: string | null      // 喜歡的路線型態

  // ═══════════════════════════════════════════
  // 核心故事（必填建議）
  // ═══════════════════════════════════════════
  climbing_origin: string | null          // 你與攀岩的相遇
  climbing_meaning: string | null         // 攀岩對你來說是什麼
  advice_to_self: string | null           // 給剛開始攀岩的自己

  // ═══════════════════════════════════════════
  // 進階故事（選填）
  // ═══════════════════════════════════════════
  memorable_moment: string | null         // 攀岩路上最難忘的一天
  biggest_challenge: string | null        // 曾經想放棄的時刻
  breakthrough_story: string | null       // 最大的突破經歷
  fear_management: string | null          // 面對恐懼的方式
  climbing_lesson: string | null          // 攀岩教會我的事
  climbing_mentor: string | null          // 攀岩路上的貴人
  dream_climb: string | null              // 夢想中的攀登
  life_outside_climbing: string | null    // 攀岩之外的我

  // ═══════════════════════════════════════════
  // 媒體與社群
  // ═══════════════════════════════════════════
  gallery_images: string | null           // JSON: 照片集
  social_links: string | null             // JSON: 社群連結

  // ═══════════════════════════════════════════
  // 狀態
  // ═══════════════════════════════════════════
  is_featured: number
  is_public: number
  published_at: string | null
  created_at: string
  updated_at: string

  // ═══════════════════════════════════════════
  // 互動統計
  // ═══════════════════════════════════════════
  total_likes: number
  total_views: number
  follower_count: number
}
```

### 2. BucketListItem 人生清單表

```typescript
interface BucketListItem {
  id: string
  biography_id: string

  // 內容
  title: string                           // 目標標題
  description: string | null              // 詳細描述
  category: BucketListCategory            // 分類

  // 目標細節
  target_grade: string | null             // 目標難度 (5.12a, V6)
  target_location: string | null          // 目標地點

  // 時間
  created_at: string
  target_date: string | null              // 預計完成
  completed_at: string | null             // 實際完成

  // 狀態
  status: BucketListStatus
  progress: number                        // 0-100

  // 完成故事
  completion_story: string | null
  completion_media: string | null         // JSON: 照片/影片

  // 社群
  is_public: boolean
  likes_count: number
  inspired_count: number                  // 被加入清單次數

  sort_order: number
}

type BucketListCategory =
  | 'outdoor_route'      // 戶外路線
  | 'indoor_grade'       // 室內難度
  | 'competition'        // 比賽目標
  | 'training'           // 訓練目標
  | 'adventure'          // 冒險挑戰
  | 'skill'              // 技能學習
  | 'other'              // 其他

type BucketListStatus =
  | 'planned'            // 計畫中
  | 'in_progress'        // 進行中
  | 'completed'          // 已完成
  | 'on_hold'            // 暫緩
```

### 3. 互動相關表

```typescript
// 人生清單按讚
interface BucketListLike {
  id: string
  bucket_list_item_id: string
  user_id: string
  created_at: string
}

// 目標參考（加入我的清單）
interface BucketListReference {
  id: string
  source_item_id: string              // 原始目標
  target_biography_id: string         // 參考者
  created_at: string
}

// 追蹤關係
interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// 通知
interface Notification {
  id: string
  user_id: string
  type: 'goal_completed' | 'goal_liked' | 'goal_referenced' | 'new_follower'
  actor_id: string | null
  target_id: string | null            // 相關的 item/biography id
  title: string
  message: string
  is_read: boolean
  created_at: string
}
```

---

## 二、題目設計

### 第一階段：基本資訊（必填）

| 欄位 | 題目 | 類型 |
|-----|------|-----|
| name | 你的暱稱 | 文字 |
| avatar_url | 大頭照 | 圖片上傳 |
| climbing_start_year | 哪一年開始攀岩 | 年份選單 |
| frequent_locations | 平常出沒的地方 | 文字（多個用逗號分隔）|
| favorite_route_type | 喜歡的路線型態 | 多選：抱石/先鋒/速度/傳攀 |

### 第二階段：核心故事（建議填寫）

| 欄位 | 題目 | 引導 |
|-----|------|-----|
| climbing_origin | 你與攀岩的相遇 | 描述第一次接觸攀岩的情景，是什麼讓你想繼續？ |
| climbing_meaning | 攀岩對你來說是什麼 | 攀岩在你生活中扮演什麼角色？帶給你什麼？ |
| advice_to_self | 給剛開始攀岩的自己 | 如果能回到起點，你會對自己說什麼？ |

### 第三階段：人生清單

結構化新增，每個目標包含：
- 標題、分類、描述
- 目標難度、地點
- 預計完成時間
- 進度追蹤
- 完成後可分享故事

### 第四階段：進階故事（選填）

| 欄位 | 題目 | 目的 |
|-----|------|-----|
| memorable_moment | 攀岩路上最難忘的一天 | 創造共鳴 |
| biggest_challenge | 曾經想放棄的時刻 | 鼓勵低潮者 |
| breakthrough_story | 最大的突破經歷 | 分享方法 |
| fear_management | 面對恐懼的方式 | 實用建議 |
| climbing_lesson | 攀岩教會我的事 | 人生智慧 |
| climbing_mentor | 攀岩路上的貴人 | 感謝傳承 |
| dream_climb | 夢想中的攀登 | 展現夢想 |
| life_outside_climbing | 攀岩之外的我 | 完整的人 |

---

## 三、資料庫 Schema

### 完整 SQL

```sql
-- ═══════════════════════════════════════════════════════════
-- 人物誌主表（重建）
-- ═══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS biographies;

CREATE TABLE biographies (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  cover_image TEXT,

  -- 攀岩基本資訊
  climbing_start_year TEXT,
  frequent_locations TEXT,
  favorite_route_type TEXT,

  -- 核心故事
  climbing_origin TEXT,
  climbing_meaning TEXT,
  advice_to_self TEXT,

  -- 進階故事
  memorable_moment TEXT,
  biggest_challenge TEXT,
  breakthrough_story TEXT,
  fear_management TEXT,
  climbing_lesson TEXT,
  climbing_mentor TEXT,
  dream_climb TEXT,
  life_outside_climbing TEXT,

  -- 媒體
  gallery_images TEXT,
  social_links TEXT,

  -- 狀態
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  -- 統計
  total_likes INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_biographies_slug ON biographies(slug);
CREATE INDEX idx_biographies_user ON biographies(user_id);
CREATE INDEX idx_biographies_public ON biographies(is_public);
CREATE INDEX idx_biographies_featured ON biographies(is_featured);

-- ═══════════════════════════════════════════════════════════
-- 人生清單表
-- ═══════════════════════════════════════════════════════════

CREATE TABLE bucket_list_items (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,

  -- 內容
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',

  -- 目標細節
  target_grade TEXT,
  target_location TEXT,

  -- 時間
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  target_date TEXT,
  completed_at TEXT,

  -- 狀態
  status TEXT DEFAULT 'planned',
  progress INTEGER DEFAULT 0,

  -- 完成故事
  completion_story TEXT,
  completion_media TEXT,

  -- 社群
  is_public INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  inspired_count INTEGER DEFAULT 0,

  sort_order INTEGER DEFAULT 0,

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE
);

CREATE INDEX idx_bucket_list_biography ON bucket_list_items(biography_id);
CREATE INDEX idx_bucket_list_status ON bucket_list_items(status);
CREATE INDEX idx_bucket_list_public ON bucket_list_items(is_public);
CREATE INDEX idx_bucket_list_location ON bucket_list_items(target_location);

-- ═══════════════════════════════════════════════════════════
-- 互動表
-- ═══════════════════════════════════════════════════════════

-- 人生清單按讚
CREATE TABLE bucket_list_likes (
  id TEXT PRIMARY KEY,
  bucket_list_item_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (bucket_list_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(bucket_list_item_id, user_id)
);

-- 目標參考
CREATE TABLE bucket_list_references (
  id TEXT PRIMARY KEY,
  source_item_id TEXT NOT NULL,
  target_biography_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (source_item_id) REFERENCES bucket_list_items(id) ON DELETE CASCADE,
  FOREIGN KEY (target_biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(source_item_id, target_biography_id)
);

-- 追蹤
CREATE TABLE follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- 通知
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  actor_id TEXT,
  target_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

---

## 四、頁面呈現

### 人物誌詳情頁結構

```
┌─────────────────────────────────────────┐
│ 封面照片 + 頭像 + 名字                  │
│ 攀岩 N 年 · 常去地點                    │
│ [追蹤] ❤ 讚數  👁 瀏覽數               │
├─────────────────────────────────────────┤
│ 快速資訊卡片                            │
│ [開始年份] [常去地點] [喜歡的路線]      │
├─────────────────────────────────────────┤
│ 我與攀岩的相遇                          │
│ (climbing_origin 內容)                  │
├─────────────────────────────────────────┤
│ 攀岩對我來說                            │
│ (climbing_meaning 內容)                 │
├─────────────────────────────────────────┤
│ 🎯 人生清單                             │
│ ┌─ 進行中 ────────────────────────┐    │
│ │ ○ 目標1  [進度條] 40%           │    │
│ │ ○ 目標2  [進度條] 60%           │    │
│ └─────────────────────────────────┘    │
│ ┌─ 已完成 ────────────────────────┐    │
│ │ ✓ 目標3  完成於 2025.08         │    │
│ │   「完成故事...」 ❤ 23          │    │
│ └─────────────────────────────────┘    │
│ [+ 加入我的清單]                        │
├─────────────────────────────────────────┤
│ 📖 更多故事 (進階故事卡片)              │
│ [最難忘的一天] [面對恐懼] ...           │
├─────────────────────────────────────────┤
│ 給剛開始攀岩的你                        │
│ 💬 (advice_to_self 內容)               │
├─────────────────────────────────────────┤
│ [← 上一篇]            [下一篇 →]        │
└─────────────────────────────────────────┘
```

### 探索頁面結構

```
┌─────────────────────────────────────────┐
│ 探索攀岩故事                            │
├─────────────────────────────────────────┤
│ 主題分類                                │
│ [恐懼與勇氣] [突破時刻] [攀岩哲學] ...  │
├─────────────────────────────────────────┤
│ 🔥 熱門目標                             │
│ 1. 完攀龍洞校門口  45人挑戰中           │
│ 2. 抱石 V6        38人挑戰中           │
├─────────────────────────────────────────┤
│ ✨ 最新完成                             │
│ [故事卡片] [故事卡片] [故事卡片]        │
├─────────────────────────────────────────┤
│ 📍 依地點探索                           │
│ [龍洞] [熱海] [關子嶺] [更多]           │
└─────────────────────────────────────────┘
```

---

## 五、實作順序

### Phase 1：資料庫與類型（2-3 天）

- [ ] 建立新的 migration 檔案
- [ ] 更新 `src/lib/types.ts`
- [ ] 更新 `backend/src/types.ts`

### Phase 2：後端 API（3-4 天）

- [ ] 更新 biographies routes
- [ ] 新增 bucket-list routes
- [ ] 新增 interactions routes (likes, references, follows)
- [ ] 新增 notifications routes

### Phase 3：前端填寫流程（4-5 天）

- [ ] 重新設計填寫表單（四階段）
- [ ] 人生清單管理 UI
- [ ] 完成目標流程

### Phase 4：前端呈現（3-4 天）

- [ ] 重新設計詳情頁
- [ ] 更新列表頁
- [ ] 建立探索頁面

### Phase 5：互動功能（2-3 天）

- [ ] 按讚功能
- [ ] 加入清單功能
- [ ] 追蹤功能
- [ ] 通知系統

---

## 六、欄位對照表（舊 → 新）

| 舊欄位 | 新欄位 | 備註 |
|-------|-------|-----|
| climbing_reason | climbing_origin | 重新命名 |
| advice | advice_to_self | 重新命名 |
| bucket_list | bucket_list_items (表) | 拆分為獨立表 |
| - | memorable_moment | 新增 |
| - | biggest_challenge | 新增 |
| - | breakthrough_story | 新增 |
| - | fear_management | 新增 |
| - | climbing_lesson | 新增 |
| - | climbing_mentor | 新增 |
| - | dream_climb | 新增 |
| - | life_outside_climbing | 新增 |
| - | total_likes | 新增 |
| - | total_views | 新增 |
| - | follower_count | 新增 |

---

*此為最終版本，直接採用新設計，無需向後相容。*
