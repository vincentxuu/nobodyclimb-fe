-- Migration: Add comment_count to biographies table
-- Purpose: Track comment count for each biography for performance optimization
-- Date: 2026-01-14

-- Add comment_count column to biographies table
ALTER TABLE biographies ADD COLUMN comment_count INTEGER DEFAULT 0 NOT NULL;

-- Create index for efficient comment counting
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);

-- Initialize comment_count with current counts
UPDATE biographies
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.entity_type = 'biography'
    AND comments.entity_id = biographies.id
);

-- Create trigger to increment comment_count when a comment is added
CREATE TRIGGER IF NOT EXISTS increment_biography_comment_count
AFTER INSERT ON comments
WHEN NEW.entity_type = 'biography'
BEGIN
  UPDATE biographies
  SET comment_count = comment_count + 1
  WHERE id = NEW.entity_id;
END;

-- Create trigger to decrement comment_count when a comment is deleted
CREATE TRIGGER IF NOT EXISTS decrement_biography_comment_count
AFTER DELETE ON comments
WHEN OLD.entity_type = 'biography'
BEGIN
  UPDATE biographies
  SET comment_count = CASE
    WHEN comment_count > 0 THEN comment_count - 1
    ELSE 0
  END
  WHERE id = OLD.entity_id;
END;
