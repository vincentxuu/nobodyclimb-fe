## Context

現有 ChatWidget 是一個基於 RAG 的 AI 問答元件，已有：複製按鈕、👍/👎 評分回饋、基礎 Markdown 渲染（手寫 parser）。本次新增 6 項功能：輪播建議、動態後續建議、對話記憶、聊天記錄、清除對話、重新生成回應、Markdown 優化（程式碼塊 + 表格）。

**現有後端 `/ai/ask` response 結構**：
```json
{ "answer": "...", "sources": [...], "query_id": "abc123" }
```

**現有後端 pipeline（query.ts）**：
- Stage 1：LLM Tool Calling（解析查詢意圖）+ HyDE（生成假設文件）
- Stage 2-4：向量搜尋、D1 查詢、結果合併
- Stage 5：LLM C 生成最終回答

## Goals / Non-Goals

**Goals:**
- 擴充 `/ai/ask` response，加入 `suggested_questions: string[]`
- 新增 `chat_sessions` / `chat_messages` D1 table 與 CRUD API
- 前端整合新 API，支援 session 切換與清除
- 輪播建議（純前端隨機取樣）
- 重新生成回應（純前端重送）
- Markdown 擴充（程式碼塊、表格）

**Non-Goals:**
- Streaming 回應（SSE）
- 語音輸入/輸出
- 跨用戶分享對話
- 未登入訪客的對話持久化

## Decisions

### 1. 動態後續建議：同一 LLM 呼叫 vs. 獨立呼叫

**決定**：在 Stage 5 同一次 LLM 呼叫中，以分隔符號附加建議問題。

**做法**：
- System prompt 結尾加入指令，要求 LLM 在回答末尾附上：
  ```
  ---SUGGESTIONS---
  1. 問題一
  2. 問題二
  3. 問題三
  ```
- `query.ts` 解析回答，拆出 `answer` 與 `suggested_questions`，前者去除分隔符號後的內容

**捨棄方案**：
- 獨立 LLM 呼叫：多一次 API 呼叫延遲，費用更高
- JSON structured output：Gemma-3-12b 對嚴格 JSON 輸出穩定性差
- 前端關鍵字比對：建議品質差，維護麻煩

**Fallback**：若 LLM 未輸出分隔符號，`suggested_questions` 回傳空陣列，前端不顯示建議列。

---

### 2. 對話記憶：前端 localStorage vs. 後端 D1

**決定**：後端 D1 儲存，需登入才能使用。

**Schema**：
```sql
-- migration 0047
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,               -- UUID
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,               -- 取自第一則 user 訊息（前 50 字）
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,               -- UUID
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  suggested_questions TEXT,          -- JSON array，僅 assistant 訊息使用
  query_id TEXT,                     -- 對應 ai_query_logs.id，僅 assistant 訊息
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id, updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id, created_at ASC);
```

**捨棄方案**：
- localStorage：跨裝置無法同步，清快取即消失，不符合長期產品定位

---

### 3. 新增 API 端點設計

所有 session API 需 `authMiddleware`（登入才能存取）。

```
POST   /ai/sessions                    建立新 session（回傳 session id）
GET    /ai/sessions                    取得我的 session 列表（最新 20 個）
GET    /ai/sessions/:id/messages       取得指定 session 的所有訊息
DELETE /ai/sessions/:id                刪除 session（含訊息）
POST   /ai/sessions/:id/messages       儲存一則訊息（user 或 assistant）
```

**訊息儲存時機**：
- 使用者送出後，前端呼叫 `POST /ai/sessions/:id/messages` 儲存 user 訊息
- AI 回應到達後，前端呼叫 `POST /ai/sessions/:id/messages` 儲存 assistant 訊息（含 `suggested_questions`、`query_id`）
- 好處：後端邏輯不需修改，session 管理完全由前端驅動

---

### 4. 重新生成：前端 vs. 後端

**決定**：純前端實作。

**做法**：
- 取最後一則 user 訊息的 content
- 移除最後一則 assistant 訊息（從 state 移除）
- 若有 session：呼叫後端 DELETE 最後一則 assistant 訊息（或直接覆蓋）
- 重新呼叫 `askAI`

---

### 5. 輪播建議：前端隨機取樣

**決定**：維護一個約 12 個問題的題庫陣列，每次 widget 開啟時隨機取 3 個。

**理由**：純 UI 功能，不需後端支援，實作成本極低。

---

### 6. Markdown 優化：擴充手寫 parser

**決定**：在現有 `MarkdownContent` 元件中補上程式碼塊與表格解析，不引入新套件。

**新增支援**：
- 程式碼塊：偵測 ` ``` ` 開頭/結尾行，以 `<pre><code>` 渲染，顯示語言標籤
- 行內程式碼：偵測 `` `code` ``，以 `<code>` 渲染（已部分支援，需補完）
- 表格：偵測 `| col | col |` 格式，以 `<table>` 渲染

## Risks / Trade-offs

- **LLM 建議問題解析失敗** → Fallback 空陣列，前端不顯示，不影響主回答
- **`suggested_questions` 增加 token 使用量** → 約增加 50-100 tokens/次，成本可接受
- **Session API 增加前端複雜度** → 需管理 `currentSessionId` 狀態，widget 開啟時需先取得或建立 session
- **刪除訊息的時機** → 重新生成時若網路失敗，前端 state 與後端可能不一致；以「前端 state 為主，後端非同步更新」策略處理，不做強一致性保證

## Migration Plan

1. 執行 migration `0047_create_chat_tables.sql`（本地 + remote）
2. 部署後端（新 API + `/ai/ask` 回傳 `suggested_questions`）
3. 部署前端（整合新功能）
4. Rollback：前端可直接 revert，後端 API 向下相容（`suggested_questions` 為可選欄位）
