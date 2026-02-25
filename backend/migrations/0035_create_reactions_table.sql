-- 創建快速反應表
-- 支援三種反應類型：me_too (我也是), plus_one (+1), well_said (說得好)

CREATE TABLE IF NOT EXISTS content_reactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- 關聯的內容
  content_type TEXT NOT NULL CHECK(content_type IN ('core_story', 'one_liner', 'story')),
  content_id TEXT NOT NULL,

  -- 反應類型
  reaction_type TEXT NOT NULL CHECK(reaction_type IN ('me_too', 'plus_one', 'well_said')),

  -- 發起反應的用戶
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 時間戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- 確保每個用戶對同一內容的同一反應類型只能有一個
  UNIQUE(content_type, content_id, reaction_type, user_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_reactions_content ON content_reactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON content_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON content_reactions(reaction_type);

-- 為現有的內容表添加反應計數欄位（方便查詢）
ALTER TABLE biography_core_stories ADD COLUMN reaction_me_too_count INTEGER DEFAULT 0;
ALTER TABLE biography_core_stories ADD COLUMN reaction_plus_one_count INTEGER DEFAULT 0;
ALTER TABLE biography_core_stories ADD COLUMN reaction_well_said_count INTEGER DEFAULT 0;

ALTER TABLE biography_one_liners ADD COLUMN reaction_me_too_count INTEGER DEFAULT 0;
ALTER TABLE biography_one_liners ADD COLUMN reaction_plus_one_count INTEGER DEFAULT 0;
ALTER TABLE biography_one_liners ADD COLUMN reaction_well_said_count INTEGER DEFAULT 0;

ALTER TABLE biography_stories ADD COLUMN reaction_me_too_count INTEGER DEFAULT 0;
ALTER TABLE biography_stories ADD COLUMN reaction_plus_one_count INTEGER DEFAULT 0;
ALTER TABLE biography_stories ADD COLUMN reaction_well_said_count INTEGER DEFAULT 0;
