-- ═══════════════════════════════════════════════════════════
-- Migration: Add last_active_at column to users table
-- Description: Adds last_active_at column for tracking user activity
-- ═══════════════════════════════════════════════════════════

-- 添加 last_active_at 欄位到 users 表
ALTER TABLE users ADD COLUMN last_active_at TEXT;

-- 為 last_active_at 建立索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- 初始化現有用戶的 last_active_at 為 updated_at 或 created_at
UPDATE users SET last_active_at = COALESCE(updated_at, created_at) WHERE last_active_at IS NULL;
