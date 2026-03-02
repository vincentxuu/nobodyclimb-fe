-- AI RAG 系統資料表
-- 建立向量搜尋、查詢日誌、Prompt 管理等所需的資料表

-- =============================================
-- ai_documents: 儲存用於 RAG 的文件內容
-- =============================================
CREATE TABLE IF NOT EXISTS ai_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,               -- route, crag, video
  source_id TEXT NOT NULL,          -- 原始實體 ID
  text TEXT NOT NULL,               -- 完整文字供 LLM context 使用
  metadata TEXT,                    -- JSON: grade_numeric, crag_id, region 等
  embedding_id TEXT,                -- Vectorize 中對應的向量 ID
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_documents(type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_source ON ai_documents(type, source_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_embedding ON ai_documents(embedding_id);

-- =============================================
-- ai_query_logs: 查詢日誌，用於分析與改善回答品質
-- =============================================
CREATE TABLE IF NOT EXISTS ai_query_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,                     -- 使用者 ID（匿名時為 NULL）
  query TEXT NOT NULL,              -- 使用者問題
  response TEXT,                    -- AI 回答
  sources TEXT,                     -- JSON: 使用的來源文件 [{id, type, title, score}]
  latency_ms INTEGER,               -- 總回應時間（毫秒）
  token_count INTEGER,              -- LLM 使用的 token 數
  feedback_score INTEGER,           -- 使用者評分 1-5
  feedback_text TEXT,               -- 使用者回饋文字
  created_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_query_logs_user ON ai_query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created ON ai_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_feedback ON ai_query_logs(feedback_score);

-- =============================================
-- ai_prompts: Prompt 模板管理與版本控制
-- =============================================
CREATE TABLE IF NOT EXISTS ai_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,               -- prompt 名稱，如 system_prompt, query_template
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL,            -- prompt 內容
  variables TEXT,                   -- JSON: 可用變數列表，如 ["context", "query"]
  status TEXT NOT NULL DEFAULT 'draft', -- draft, production
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_name ON ai_prompts(name);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_status ON ai_prompts(name, status);

-- =============================================
-- ai_tools: AI 工具管理（未來擴充用）
-- =============================================
CREATE TABLE IF NOT EXISTS ai_tools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parameters TEXT,                  -- JSON: 工具參數 schema
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =============================================
-- ai_config: AI 系統設定（key-value）
-- =============================================
CREATE TABLE IF NOT EXISTS ai_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 預設設定
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('cache_ttl', '3600'),
  ('max_results', '5'),
  ('min_score', '0.5'),
  ('llm_model', '@cf/meta/llama-3.1-8b-instruct'),
  ('embedding_model', '@cf/baai/bge-m3');
