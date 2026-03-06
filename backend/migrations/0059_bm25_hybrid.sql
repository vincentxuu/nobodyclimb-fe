-- BM25 Hybrid RAG：為 ai_documents 建立 FTS5 全文搜尋索引
-- 搭配現有 Vectorize 雙路向量搜尋，形成三路 RRF 合併
-- 解決路線名稱（「幻想鄉」）、精確難度（「5.11b」）等術語的搜尋不精準問題

-- FTS5 虛擬表：儲存 doc_id（對應 ai_documents.id）與文字內容
CREATE VIRTUAL TABLE IF NOT EXISTS ai_documents_fts USING fts5(
  doc_id UNINDEXED,
  text,
  tokenize='unicode61'
);

-- 插入觸發器：新增 ai_documents 時自動同步 FTS 索引
CREATE TRIGGER IF NOT EXISTS ai_documents_fts_insert
AFTER INSERT ON ai_documents BEGIN
  INSERT INTO ai_documents_fts(doc_id, text)
  VALUES (new.id, new.text);
END;

-- 更新觸發器：更新 ai_documents.text 時同步 FTS 索引
CREATE TRIGGER IF NOT EXISTS ai_documents_fts_update
AFTER UPDATE ON ai_documents BEGIN
  DELETE FROM ai_documents_fts WHERE doc_id = old.id;
  INSERT INTO ai_documents_fts(doc_id, text)
  VALUES (new.id, new.text);
END;

-- 刪除觸發器：刪除 ai_documents 時同步清除 FTS 索引
CREATE TRIGGER IF NOT EXISTS ai_documents_fts_delete
AFTER DELETE ON ai_documents BEGIN
  DELETE FROM ai_documents_fts WHERE doc_id = old.id;
END;

-- 回填現有 ai_documents 資料至 FTS 索引
INSERT INTO ai_documents_fts(doc_id, text)
SELECT id, text FROM ai_documents;

-- ai_config：BM25 相關設定
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('bm25_top_k', '10');
