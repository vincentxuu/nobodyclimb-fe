-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Route User Integration
-- Description: 路線與使用者整合 + 路線故事收集
--
-- 功能：
--   1. user_route_ascents - 使用者攀爬記錄
--   2. route_stories - 路線故事
--   3. 擴展通用互動表支援 route_story
--   4. bucket_list_items 關聯 route_id
--   5. routes 加入社群統計欄位
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================
-- PART 1: User Route Ascents - 使用者攀爬記錄
-- ============================================

CREATE TABLE IF NOT EXISTS user_route_ascents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  route_id TEXT NOT NULL,

  -- 攀爬類型
  ascent_type TEXT NOT NULL CHECK (ascent_type IN (
    'redpoint',      -- 紅點完攀 (經過練習後一次完攀)
    'flash',         -- 閃攀 (第一次嘗試且看過他人攀爬)
    'onsight',       -- 視攀 (第一次嘗試且未看過任何資訊)
    'attempt',       -- 嘗試 (未完攀)
    'toprope',       -- 上方確保
    'lead',          -- 先鋒
    'seconding',     -- 跟攀
    'repeat'         -- 重複完攀
  )),

  -- 攀爬詳情
  ascent_date TEXT NOT NULL,           -- 攀爬日期 (YYYY-MM-DD)
  attempts_count INTEGER DEFAULT 1,     -- 嘗試次數
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 個人評分 1-5
  perceived_grade TEXT,                 -- 個人感受難度
  notes TEXT,                           -- 私人筆記

  -- 媒體連結
  photos TEXT,                          -- JSON array: 照片 URLs
  youtube_url TEXT,                     -- YouTube 影片連結
  instagram_url TEXT,                   -- Instagram 貼文連結

  -- 隱私設定
  is_public INTEGER DEFAULT 1,          -- 是否公開

  -- 時間戳
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_ascents_user ON user_route_ascents(user_id);
CREATE INDEX IF NOT EXISTS idx_ascents_route ON user_route_ascents(route_id);
CREATE INDEX IF NOT EXISTS idx_ascents_date ON user_route_ascents(ascent_date);
CREATE INDEX IF NOT EXISTS idx_ascents_type ON user_route_ascents(ascent_type);
CREATE INDEX IF NOT EXISTS idx_ascents_public ON user_route_ascents(is_public);
CREATE INDEX IF NOT EXISTS idx_ascents_user_route ON user_route_ascents(user_id, route_id);

-- ============================================
-- PART 2: Route Stories - 路線故事
-- ============================================

CREATE TABLE IF NOT EXISTS route_stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  route_id TEXT NOT NULL,

  -- 故事類型
  story_type TEXT NOT NULL CHECK (story_type IN (
    'beta',              -- 攀爬技巧/動作建議
    'experience',        -- 攀爬心得
    'first_ascent',      -- 首攀故事
    'history',           -- 路線歷史
    'safety',            -- 安全提醒
    'conditions',        -- 岩況報告
    'gear',              -- 裝備建議
    'approach',          -- 進場資訊
    'other'              -- 其他
  )),

  -- 內容
  title TEXT,                           -- 標題 (可選)
  content TEXT NOT NULL,                -- 故事內容

  -- 媒體連結
  photos TEXT,                          -- JSON array: 照片 URLs
  youtube_url TEXT,                     -- YouTube 影片連結
  instagram_url TEXT,                   -- Instagram 貼文連結

  -- 隱私與狀態
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'community', 'private')),
  is_featured INTEGER DEFAULT 0,        -- 是否精選
  is_verified INTEGER DEFAULT 0,        -- 是否經過驗證 (由管理員標記)

  -- 互動計數 (由觸發器或應用層更新)
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,      -- 「有幫助」計數

  -- 時間戳
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_route_stories_user ON route_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_route_stories_route ON route_stories(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stories_type ON route_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_route_stories_visibility ON route_stories(visibility);
CREATE INDEX IF NOT EXISTS idx_route_stories_featured ON route_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_route_stories_created ON route_stories(created_at DESC);

-- ============================================
-- PART 3: 擴展通用互動表 - likes
-- 重建表以加入 'route_story' entity_type
-- ============================================

CREATE TABLE IF NOT EXISTS likes_new2 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'biography', 'post', 'bucket_list_item',
      'core_story', 'one_liner', 'story',
      'gallery', 'video', 'gym', 'crag', 'route',
      'route_story'  -- 新增
    )
  ),
  entity_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, entity_type, entity_id)
);

-- 遷移現有資料
INSERT INTO likes_new2 (id, user_id, entity_type, entity_id, created_at)
SELECT id, user_id, entity_type, entity_id, created_at FROM likes;

-- 替換表
DROP TABLE likes;
ALTER TABLE likes_new2 RENAME TO likes;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created ON likes(created_at DESC);

-- ============================================
-- PART 4: 擴展通用互動表 - comments
-- 重建表以加入 'route_story' entity_type
-- ============================================

CREATE TABLE IF NOT EXISTS comments_new3 (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN (
      'biography', 'post', 'bucket_list_item',
      'core_story', 'one_liner', 'story',
      'gallery', 'video', 'gym', 'crag', 'route',
      'route_story'  -- 新增
    )
  ),
  entity_id TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id TEXT,
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_hidden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments_new3(id) ON DELETE CASCADE
);

-- 遷移現有資料
INSERT INTO comments_new3 (id, user_id, entity_type, entity_id, content, parent_id, like_count, reply_count, is_hidden, created_at, updated_at)
SELECT id, user_id, entity_type, entity_id, content, parent_id, like_count, reply_count, is_hidden, created_at, updated_at FROM comments;

-- 替換表
DROP TABLE comments;
ALTER TABLE comments_new3 RENAME TO comments;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- ============================================
-- PART 5: 擴展 content_reactions 表
-- 加入 'route_story' content_type
-- ============================================

CREATE TABLE IF NOT EXISTS content_reactions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- 關聯的內容
  content_type TEXT NOT NULL CHECK(content_type IN (
    'core_story', 'one_liner', 'story',
    'route_story'  -- 新增
  )),
  content_id TEXT NOT NULL,

  -- 反應類型
  reaction_type TEXT NOT NULL CHECK(reaction_type IN (
    'me_too',      -- 我也是
    'plus_one',    -- +1
    'well_said',   -- 說得好
    'helpful'      -- 有幫助 (新增，專為 route_story)
  )),

  -- 發起反應的用戶
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 時間戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 確保每個用戶對同一內容的同一反應類型只能有一個
  UNIQUE(content_type, content_id, reaction_type, user_id)
);

-- 遷移現有資料
INSERT INTO content_reactions_new (id, content_type, content_id, reaction_type, user_id, created_at)
SELECT id, content_type, content_id, reaction_type, user_id, created_at FROM content_reactions;

-- 替換表
DROP TABLE content_reactions;
ALTER TABLE content_reactions_new RENAME TO content_reactions;

-- 重建索引
CREATE INDEX IF NOT EXISTS idx_reactions_content ON content_reactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON content_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON content_reactions(reaction_type);

-- ============================================
-- PART 6: bucket_list_items 加入 route_id
-- 讓目標清單可以關聯到具體路線
-- ============================================

ALTER TABLE bucket_list_items ADD COLUMN route_id TEXT REFERENCES routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bucket_list_route ON bucket_list_items(route_id);

-- ============================================
-- PART 7: routes 加入社群統計欄位
-- ============================================

ALTER TABLE routes ADD COLUMN ascent_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN story_count INTEGER DEFAULT 0;
ALTER TABLE routes ADD COLUMN community_rating_avg REAL DEFAULT 0;
ALTER TABLE routes ADD COLUMN community_rating_count INTEGER DEFAULT 0;

-- ============================================
-- 完成
-- ============================================
