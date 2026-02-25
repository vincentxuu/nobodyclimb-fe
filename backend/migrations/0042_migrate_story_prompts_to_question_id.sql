-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Migrate story_prompts to use question_id
-- Description: Update story_prompts table to use question_id instead of field_name
--              to align with the new story_questions schema
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create new table with question_id
CREATE TABLE story_prompts_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  biography_id TEXT NOT NULL,
  question_id TEXT NOT NULL,          -- 改為 question_id (對應 story_questions.id)
  category TEXT NOT NULL,             -- 保持分類欄位以便快速篩選
  prompted_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  dismissed_count INTEGER NOT NULL DEFAULT 0,
  last_dismissed_at TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES story_questions(id) ON DELETE CASCADE,
  UNIQUE(biography_id, question_id)   -- 每個人物誌的每個問題只能有一筆記錄
);

-- Step 2: Copy existing data (field_name → question_id)
INSERT INTO story_prompts_new (
  id, user_id, biography_id, question_id, category,
  prompted_at, completed_at, dismissed_count, last_dismissed_at
)
SELECT
  id, user_id, biography_id, field_name, category,
  prompted_at, completed_at, dismissed_count, last_dismissed_at
FROM story_prompts;

-- Step 3: Drop old table and rename
DROP TABLE story_prompts;
ALTER TABLE story_prompts_new RENAME TO story_prompts;

-- Step 4: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_story_prompts_user ON story_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_story_prompts_biography ON story_prompts(biography_id);
CREATE INDEX IF NOT EXISTS idx_story_prompts_question ON story_prompts(question_id);
CREATE INDEX IF NOT EXISTS idx_story_prompts_prompted ON story_prompts(prompted_at);
CREATE INDEX IF NOT EXISTS idx_story_prompts_category ON story_prompts(category);
