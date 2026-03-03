-- AI 聊天記錄資料表
-- 儲存用戶的對話 session 與訊息歷史

-- =============================================
-- chat_sessions: 對話 session 管理
-- =============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,               -- UUID
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,               -- 取自第一則 user 訊息（前 50 字）
  created_at INTEGER NOT NULL,       -- Unix timestamp（秒）
  updated_at INTEGER NOT NULL,       -- Unix timestamp（秒）

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id, updated_at DESC);

-- =============================================
-- chat_messages: 對話訊息
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,               -- UUID
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  suggested_questions TEXT,          -- JSON array，僅 assistant 訊息使用
  query_id TEXT,                     -- 對應 ai_query_logs.id，僅 assistant 訊息
  created_at INTEGER NOT NULL,       -- Unix timestamp（秒）

  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id, created_at ASC);
