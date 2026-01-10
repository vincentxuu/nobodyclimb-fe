-- Migration: Add gallery_images column to biographies
-- Version: 1.2.0
-- Date: 2026-01-10
-- Description: Add gallery_images column to store profile image gallery data as JSON

-- Add gallery_images column to biographies table
ALTER TABLE biographies ADD COLUMN gallery_images TEXT;

-- Note: gallery_images stores JSON data in the following format:
-- {
--   "images": [
--     { "id": "uuid", "url": "https://...", "caption": "...", "order": 0 }
--   ],
--   "layout": "single" | "double" | "grid"
-- }
