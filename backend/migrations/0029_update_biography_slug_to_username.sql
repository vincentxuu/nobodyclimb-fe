-- Migration: Update biography slugs to use username
-- This migration updates all biographies that have a user_id to use the user's username as the slug

-- Update biographies slug to match the user's username
UPDATE biographies
SET slug = (
  SELECT username FROM users WHERE users.id = biographies.user_id
),
updated_at = datetime('now')
WHERE user_id IS NOT NULL
AND user_id IN (SELECT id FROM users);
