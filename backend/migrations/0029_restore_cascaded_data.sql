-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Restore Cascaded Data (Part 3 of 7)
-- Description: Restore data that was affected by users table rebuild
-- ═══════════════════════════════════════════════════════════════════════════

-- Restore biographies user_id (was SET NULL by foreign key)
UPDATE biographies
SET user_id = (
  SELECT user_id FROM biographies_backup
  WHERE biographies_backup.id = biographies.id
)
WHERE id IN (SELECT id FROM biographies_backup);

-- Restore other tables
INSERT OR REPLACE INTO posts SELECT * FROM posts_backup;
INSERT OR REPLACE INTO galleries SELECT * FROM galleries_backup;
INSERT OR REPLACE INTO gallery_images SELECT * FROM gallery_images_backup;
INSERT OR REPLACE INTO notifications SELECT * FROM notifications_backup;
INSERT OR REPLACE INTO comments SELECT * FROM comments_backup;
INSERT OR REPLACE INTO reviews SELECT * FROM reviews_backup;

-- Cleanup backup tables
DROP TABLE IF EXISTS users_backup;
DROP TABLE IF EXISTS biographies_backup;
DROP TABLE IF EXISTS posts_backup;
DROP TABLE IF EXISTS galleries_backup;
DROP TABLE IF EXISTS gallery_images_backup;
DROP TABLE IF EXISTS notifications_backup;
DROP TABLE IF EXISTS comments_backup;
DROP TABLE IF EXISTS reviews_backup;
