-- ============================================
-- Migration: 0028_anonymous_story_sharing.sql
-- Description: 支援匿名故事分享與認領功能
-- ============================================

-- ============================================
-- PART 1: Guest Sessions 表
-- 用於追蹤未登入訪客的瀏覽行為和分享資格
-- ============================================

CREATE TABLE IF NOT EXISTS guest_sessions (
    id TEXT PRIMARY KEY,
    -- 瀏覽行為追蹤
    first_visit_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_visit_at TEXT NOT NULL DEFAULT (datetime('now')),
    page_views INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    biography_views INTEGER DEFAULT 0,
    -- 分享資格
    is_eligible_to_share INTEGER DEFAULT 0,
    eligible_at TEXT,
    -- 可選的聯絡資訊（用於 email 比對認領）
    contact_email TEXT,
    -- 認領狀態
    claimed_by_user_id TEXT,
    claimed_at TEXT,
    -- 時間戳記
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 索引：用於查詢未認領的 session
CREATE INDEX IF NOT EXISTS idx_guest_sessions_claimed ON guest_sessions(claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_email ON guest_sessions(contact_email);

-- ============================================
-- PART 2: 修改 Biographies 表
-- 新增匿名分享相關欄位
-- ============================================

-- 新增 guest_session_id 欄位（用於關聯匿名內容）
ALTER TABLE biographies ADD COLUMN guest_session_id TEXT REFERENCES guest_sessions(id) ON DELETE SET NULL;

-- 新增 is_anonymous 欄位（是否顯示為匿名）
ALTER TABLE biographies ADD COLUMN is_anonymous INTEGER DEFAULT 0;

-- 新增 anonymous_name 欄位（匿名顯示名稱，如「攀岩者 #A1B2」）
ALTER TABLE biographies ADD COLUMN anonymous_name TEXT;

-- 新增 claimed_at 欄位（認領時間）
ALTER TABLE biographies ADD COLUMN claimed_at TEXT;

-- 更新 visibility 欄位，加入 'anonymous' 選項
-- SQLite 不支援直接修改 CHECK 約束，所以這裡用觸發器來驗證
-- 注意：visibility 現有值為 'private', 'public', 'unlisted'，新增 'anonymous'

-- 索引：用於查詢匿名內容
CREATE INDEX IF NOT EXISTS idx_biographies_guest_session ON biographies(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_biographies_anonymous ON biographies(is_anonymous);

-- ============================================
-- PART 3: Content Claims 表
-- 記錄認領歷史
-- ============================================

CREATE TABLE IF NOT EXISTS content_claims (
    id TEXT PRIMARY KEY,
    guest_session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    biography_id TEXT NOT NULL,
    -- 認領時的狀態
    kept_anonymous INTEGER DEFAULT 0,
    -- 時間戳記
    claimed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (biography_id) REFERENCES biographies(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_content_claims_user ON content_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_content_claims_session ON content_claims(guest_session_id);

-- ============================================
-- PART 4: 分享資格設定表（可調整門檻）
-- ============================================

CREATE TABLE IF NOT EXISTS share_eligibility_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    min_page_views INTEGER DEFAULT 5,
    min_biography_views INTEGER DEFAULT 3,
    min_time_spent_minutes INTEGER DEFAULT 5,
    require_all INTEGER DEFAULT 0,  -- 0: 滿足任一, 1: 需全部滿足
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 插入預設設定
INSERT OR IGNORE INTO share_eligibility_config (id) VALUES ('default');
