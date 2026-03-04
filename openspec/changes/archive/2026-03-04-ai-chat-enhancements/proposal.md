## Why

現有 AI 聊天助理功能過於基礎，缺乏現代 AI 助理的標準體驗（對話記憶、Markdown 渲染、回饋機制等），導致用戶無法有效利用對話歷史或獲得良好的互動體驗。趁 AI 功能已穩定運作之際，補齊這些體驗功能以提升用戶留存。

## What Changes

- **輪播建議**：ChatWidget 初始畫面的靜態建議問題改為每次開啟隨機輪播顯示
- **動態後續建議**：AI 每次回答後，自動顯示 2-3 個相關追問建議（由後端 LLM 同步生成，隨 `/ai/ask` response 一併回傳 `suggested_questions` 欄位）
- **對話記憶**：對話儲存於後端 D1 資料庫，登入用戶重新整理或跨裝置後對話仍保留
- **聊天記錄**：可查看並切換過去的對話 session（依時間排列）
- **清除對話**：一鍵清除當前對話（含確認提示），呼叫後端 DELETE API
- **重新生成回應**：最後一則 AI 回應旁加「重新生成」按鈕，重新呼叫 API
- **Markdown 優化**：擴充現有手寫 parser，補上程式碼塊（\`\`\`）與表格支援
- ~~複製按鈕~~：已完成（`ChatMessage.tsx`）
- ~~評分回饋~~：已完成（`ChatMessage.tsx` + `/ai/feedback` API）

## Capabilities

### New Capabilities
- `ai-chat-persistence`: 對話記憶與聊天記錄管理（後端 D1 儲存、session 切換、清除）
- `ai-chat-suggestions`: 建議問題系統（輪播建議 + 動態後續建議）
- `ai-chat-message-actions`: 訊息互動操作（重新生成、Markdown 優化；複製與評分已完成）

### Modified Capabilities
- `ai-chat-widget`: ChatWidget 與 ChatMessage 元件需整合上述新能力，UI 結構有所調整

## Impact

- **前端**：`apps/web/src/components/ai/ChatWidget.tsx`、`ChatMessage.tsx` 重構，新增 `useChatHistory` hook
- **依賴**：無新增套件（Markdown 沿用手寫 parser 擴充）
- **後端（新 API）**：
  - `POST /ai/sessions` — 建立新對話 session
  - `GET /ai/sessions` — 取得用戶歷史 session 列表
  - `GET /ai/sessions/:id/messages` — 取得指定 session 的訊息
  - `DELETE /ai/sessions/:id` — 刪除指定 session
  - `POST /ai/sessions/:id/messages` — 儲存訊息（user + assistant）
- **後端（修改）**：`query.ts` 修改 LLM prompt 同步產生建議問題，`/ai/ask` response 新增 `suggested_questions: string[]` 欄位
- **資料庫**：新增 `chat_sessions`、`chat_messages` 兩張 D1 table
