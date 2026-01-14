-- ═══════════════════════════════════════════════════════════
-- Migration: Create biography likes table
-- Description: Creates table for liking biographies (人物誌按讚)
-- ═══════════════════════════════════════════════════════════

-- 人物誌按讚表
CREATE TABLE IF NOT EXISTS biography_likes (
  id TEXT PRIMARY KEY,
  biography_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(biography_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_biography_likes_biography ON biography_likes(biography_id);
CREATE INDEX IF NOT EXISTS idx_biography_likes_user ON biography_likes(user_id);
