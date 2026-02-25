-- 區域 (Areas) - 岩場的主要分區
-- 例如龍洞的「校門口」「鐘塔」「長巷」「音樂廳」「大禮堂」「第一洞」等
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  crag_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT,
  description TEXT,
  description_en TEXT,
  image TEXT,
  bolt_count INTEGER DEFAULT 0,
  route_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (crag_id) REFERENCES crags(id)
);

-- 岩壁分區 (Sectors) - 區域內的更細分區
-- 例如龍洞校門口的「人面岩」「門簷」「騙人的牆」等
CREATE TABLE IF NOT EXISTS sectors (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (area_id) REFERENCES areas(id)
);

-- 在 routes 表加入 area_id 和 sector_id 欄位（可為空，向下相容）
ALTER TABLE routes ADD COLUMN area_id TEXT REFERENCES areas(id);
ALTER TABLE routes ADD COLUMN sector_id TEXT REFERENCES sectors(id);

-- 索引
CREATE INDEX IF NOT EXISTS idx_areas_crag_id ON areas(crag_id);
CREATE INDEX IF NOT EXISTS idx_sectors_area_id ON sectors(area_id);
CREATE INDEX IF NOT EXISTS idx_routes_area_id ON routes(area_id);
CREATE INDEX IF NOT EXISTS idx_routes_sector_id ON routes(sector_id);
