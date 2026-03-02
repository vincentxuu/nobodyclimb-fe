-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Users Table Backup (Part 1 of 7)
-- Description: Create backup tables for all tables that will be affected by users table rebuild
-- ═══════════════════════════════════════════════════════════════════════════

-- Backup all tables that have foreign keys to users
-- This prevents data loss when we rebuild the users table
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE biographies_backup AS SELECT * FROM biographies;
CREATE TABLE posts_backup AS SELECT * FROM posts;
CREATE TABLE galleries_backup AS SELECT * FROM galleries;
CREATE TABLE gallery_images_backup AS SELECT * FROM gallery_images;
CREATE TABLE notifications_backup AS SELECT * FROM notifications;
CREATE TABLE comments_backup AS SELECT * FROM comments;
CREATE TABLE reviews_backup AS SELECT * FROM reviews;
