-- NobodyClimb Database Schema for Cloudflare D1
-- Version: 1.0.0

-- ============================================
-- Users & Authentication
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  google_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  -- Activity tracking
  last_active_at TEXT,
  last_login_at TEXT,
  login_count INTEGER DEFAULT 0,
  -- Referral tracking
  referral_source TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================
-- Blog Posts
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (post_id, tag),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag);

-- ============================================
-- Climbing Gyms
-- ============================================

CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  email TEXT,
  website TEXT,
  cover_image TEXT,
  is_featured INTEGER DEFAULT 0,
  opening_hours TEXT, -- JSON string
  facilities TEXT, -- JSON array
  price_info TEXT, -- JSON object
  rating_avg REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gyms_slug ON gyms(slug);
CREATE INDEX IF NOT EXISTS idx_gyms_city ON gyms(city);
CREATE INDEX IF NOT EXISTS idx_gyms_featured ON gyms(is_featured);

-- ============================================
-- Crags (Outdoor Climbing Sites)
-- ============================================

CREATE TABLE IF NOT EXISTS crags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  altitude INTEGER,
  rock_type TEXT,
  climbing_types TEXT, -- JSON array: ["sport", "trad", "boulder"]
  difficulty_range TEXT, -- e.g., "5.6-5.13a"
  route_count INTEGER DEFAULT 0,
  bolt_count INTEGER DEFAULT 0,
  cover_image TEXT,
  images TEXT, -- JSON array
  is_featured INTEGER DEFAULT 0,
  access_info TEXT,
  parking_info TEXT,
  approach_time INTEGER, -- minutes
  best_seasons TEXT, -- JSON array
  restrictions TEXT,
  rating_avg REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_crags_slug ON crags(slug);
CREATE INDEX IF NOT EXISTS idx_crags_region ON crags(region);
CREATE INDEX IF NOT EXISTS idx_crags_featured ON crags(is_featured);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  crag_id TEXT NOT NULL,
  name TEXT NOT NULL,
  grade TEXT,
  grade_system TEXT DEFAULT 'yds', -- yds, french, v-scale
  height INTEGER, -- meters
  bolt_count INTEGER,
  route_type TEXT CHECK (route_type IN ('sport', 'trad', 'boulder', 'mixed')),
  description TEXT,
  first_ascent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (crag_id) REFERENCES crags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_routes_crag ON routes(crag_id);
CREATE INDEX IF NOT EXISTS idx_routes_grade ON routes(grade);

-- ============================================
-- Galleries
-- ============================================

CREATE TABLE IF NOT EXISTS galleries (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug);
CREATE INDEX IF NOT EXISTS idx_galleries_author ON galleries(author_id);

CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery ON gallery_images(gallery_id);

-- ============================================
-- Videos
-- ============================================

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  youtube_id TEXT,
  vimeo_id TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  category TEXT,
  tags TEXT, -- JSON array
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);

-- ============================================
-- Biographies
-- ============================================

CREATE TABLE IF NOT EXISTS biographies (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT, -- e.g., "Professional Climber"
  bio TEXT,
  avatar_url TEXT,
  cover_image TEXT,
  -- Climbing-specific fields for persona feature
  climbing_start_year TEXT,
  frequent_locations TEXT, -- 平常出沒岩場
  favorite_route_type TEXT, -- 喜歡的路線型態
  climbing_reason TEXT, -- 踏上攀岩不歸路的原因
  climbing_meaning TEXT, -- 攀岩對你來說是什麼樣的存在
  bucket_list TEXT, -- 在攀岩世界裡，想做的人生清單
  advice TEXT, -- 對於初踏入攀岩的岩友，留言給他們的一句話
  achievements TEXT, -- JSON array
  social_links TEXT, -- JSON object
  is_featured INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 0, -- 是否公開到人物誌
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_biographies_slug ON biographies(slug);
CREATE INDEX IF NOT EXISTS idx_biographies_user ON biographies(user_id);
CREATE INDEX IF NOT EXISTS idx_biographies_public ON biographies(is_public);

-- ============================================
-- Reviews & Comments
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('gym', 'crag')),
  entity_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_entity ON reviews(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video')),
  entity_id TEXT NOT NULL,
  parent_id TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============================================
-- Notifications
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================
-- Likes/Favorites
-- ============================================

CREATE TABLE IF NOT EXISTS likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'gallery', 'video', 'gym', 'crag')),
  entity_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_entity ON likes(entity_type, entity_id);
