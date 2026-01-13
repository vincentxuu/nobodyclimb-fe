-- ═══════════════════════════════════════════════════════════
-- Migration: Create media relation tables
-- Description: Creates tables for YouTube and Instagram media associations
-- ═══════════════════════════════════════════════════════════

-- YouTube 影片關聯表
CREATE TABLE IF NOT EXISTS biography_videos (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,  -- own_content, featured_in, mentioned, recommended, completion_proof
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(biography_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_biography_videos_bio ON biography_videos(biography_id);
CREATE INDEX IF NOT EXISTS idx_biography_videos_video ON biography_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_biography_videos_featured ON biography_videos(is_featured);

-- Instagram 貼文關聯表
CREATE TABLE IF NOT EXISTS biography_instagrams (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  instagram_shortcode TEXT NOT NULL,
  media_type TEXT,  -- IMAGE, VIDEO, CAROUSEL, REEL
  thumbnail_url TEXT,
  caption TEXT,
  posted_at TEXT,
  relation_type TEXT NOT NULL,  -- own_post, tagged, mentioned, completion_proof
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  UNIQUE(biography_id, instagram_shortcode)
);

CREATE INDEX IF NOT EXISTS idx_biography_ig_bio ON biography_instagrams(biography_id);
CREATE INDEX IF NOT EXISTS idx_biography_ig_shortcode ON biography_instagrams(instagram_shortcode);
CREATE INDEX IF NOT EXISTS idx_biography_ig_featured ON biography_instagrams(is_featured);
