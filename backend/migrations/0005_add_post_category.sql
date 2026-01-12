-- Migration: Add category field to posts table
-- Date: 2026-01-12
-- Description: Add category column for article classification

-- Add category column to posts table
ALTER TABLE posts ADD COLUMN category TEXT;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
