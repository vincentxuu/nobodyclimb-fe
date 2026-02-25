-- Migration: 0035_add_route_extended_fields
-- Description: 新增路線擴展欄位 + videos 表擴充 + route_videos 關聯表

-- ============================================
-- 0. Videos 表擴充（頻道資訊）
-- ============================================

-- 頻道名稱
ALTER TABLE videos ADD COLUMN channel TEXT;

-- 頻道 ID（如 @Jimiras）
ALTER TABLE videos ADD COLUMN channel_id TEXT;

-- ============================================
-- 1. 路線擴展欄位
-- ============================================

-- 英文名稱
ALTER TABLE routes ADD COLUMN name_en TEXT;

-- 類型英文
ALTER TABLE routes ADD COLUMN type_en TEXT;

-- 首攀日期
ALTER TABLE routes ADD COLUMN first_ascent_date TEXT;

-- 首攀者英文名
ALTER TABLE routes ADD COLUMN first_ascent_en TEXT;

-- 安全評級 (●●● 等)
ALTER TABLE routes ADD COLUMN safety_rating TEXT;

-- 狀態 (published/draft)
ALTER TABLE routes ADD COLUMN status TEXT DEFAULT 'published';

-- 區段英文名
ALTER TABLE routes ADD COLUMN sector_en TEXT;

-- 攀登攻略
ALTER TABLE routes ADD COLUMN tips TEXT;

-- 保護裝備
ALTER TABLE routes ADD COLUMN protection TEXT;

-- 確保站類型
ALTER TABLE routes ADD COLUMN anchor_type TEXT;

-- ============================================
-- 2. route_videos 關聯表（路線與影片多對多）
-- ============================================

CREATE TABLE IF NOT EXISTS route_videos (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  UNIQUE(route_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_route_videos_route ON route_videos(route_id);
CREATE INDEX IF NOT EXISTS idx_route_videos_video ON route_videos(video_id);
