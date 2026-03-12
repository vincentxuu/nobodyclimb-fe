-- ============================================
-- 網頁爬取功能：爬取來源與爬取頁面
-- ============================================

-- 爬取來源（要爬取的網站）
CREATE TABLE IF NOT EXISTS crawl_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                          -- 來源名稱（如：theCrag龍洞）
  url TEXT NOT NULL,                           -- 起始 URL
  description TEXT,                            -- 來源描述
  crawl_config TEXT,                           -- JSON: 爬取設定 { maxPages, maxDepth, format }
  schedule TEXT,                               -- Cron 排程（如 '0 0 * * 1' 每週一）
  status TEXT NOT NULL DEFAULT 'active',       -- active | paused | error
  last_crawled_at TEXT,                        -- 上次爬取時間
  last_page_count INTEGER DEFAULT 0,           -- 上次爬取頁數
  error_message TEXT,                          -- 最近一次錯誤訊息
  created_by TEXT,                             -- 建立者 user_id
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 爬取到的頁面內容
CREATE TABLE IF NOT EXISTS crawl_pages (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,                     -- 關聯的爬取來源
  url TEXT NOT NULL,                           -- 頁面 URL
  title TEXT,                                  -- 頁面標題
  content TEXT,                                -- Markdown 格式的頁面內容
  content_hash TEXT,                           -- 內容 hash（用於偵測變更）
  metadata TEXT,                               -- JSON: 額外 metadata { links, images, headers }
  word_count INTEGER DEFAULT 0,                -- 字數統計
  embedding_id TEXT,                           -- Vectorize 中的 embedding ID
  status TEXT NOT NULL DEFAULT 'active',       -- active | deleted | error
  crawled_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES crawl_sources(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_crawl_sources_status ON crawl_sources(status);
CREATE INDEX IF NOT EXISTS idx_crawl_sources_created_by ON crawl_sources(created_by);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_source_id ON crawl_pages(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_url ON crawl_pages(url);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_status ON crawl_pages(status);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_content_hash ON crawl_pages(content_hash);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_embedding_id ON crawl_pages(embedding_id);
