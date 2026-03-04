## 1. 資料庫 Migration

- [x] 1.1 建立 `backend/migrations/0047_create_chat_tables.sql`，新增 `chat_sessions`、`chat_messages` table 與索引
- [x] 1.2 執行本地 migration：（跳過，僅跑 preview）
- [x] 1.3 執行 preview migration

## 2. 後端：動態後續建議

- [x] 2.1 修改 `backend/src/services/query.ts` Stage 5 system prompt，加入建議問題輸出指令（分隔符號格式）
- [x] 2.2 在 `query.ts` 實作 `parseSuggestedQuestions(rawAnswer: string): { answer: string, suggested_questions: string[] }` 解析函式
- [x] 2.3 更新 `backend/src/types.ts` 的 `AIAskResponse`，新增 `suggested_questions: string[]` 欄位
- [x] 2.4 更新 `backend/src/routes/ai.ts` POST `/ask` response schema，回傳 `suggested_questions`
- [x] 2.5 更新 `apps/web/src/lib/api/ai.ts` 的 `AIAskResponse` interface，新增 `suggested_questions: string[]`

## 3. 後端：Chat Session API

- [x] 3.1 在 `backend/src/routes/ai.ts` 新增 `POST /ai/sessions`（需 authMiddleware，建立 session 回傳 id）
- [x] 3.2 新增 `GET /ai/sessions`（需 authMiddleware，回傳用戶最新 20 個 session 列表）
- [x] 3.3 新增 `GET /ai/sessions/:id/messages`（需 authMiddleware，驗證 session 歸屬，回傳訊息列表）
- [x] 3.4 新增 `DELETE /ai/sessions/:id`（需 authMiddleware，驗證 session 歸屬，CASCADE 刪除訊息）
- [x] 3.5 新增 `POST /ai/sessions/:id/messages`（需 authMiddleware，儲存一則訊息）
- [x] 3.6 在 `apps/web/src/lib/api/ai.ts` 新增對應的 API 函式與 TanStack Query hooks

## 4. 前端：輪播建議

- [x] 4.1 在 `ChatWidget.tsx` 將 `SUGGESTIONS` 陣列擴充至 12 題
- [x] 4.2 將取樣邏輯改為 `useMemo` 或 `useEffect` 每次 widget 開啟時隨機取 3 題

## 5. 前端：對話記憶與聊天記錄

- [x] 5.1 在 `ChatWidget.tsx` 新增 `currentSessionId` state，開啟時依登入狀態建立或載入 session
- [x] 5.2 在 `handleSubmit` 送出後，呼叫 API 儲存 user 訊息至當前 session
- [x] 5.3 在 AI 回應到達後，呼叫 API 儲存 assistant 訊息（含 `suggested_questions`、`query_id`）
- [x] 5.4 在標題列新增「歷史」圖示按鈕（已登入用戶才顯示）
- [x] 5.5 實作歷史 session 列表 UI（側拉或展開面板），顯示 title 與相對時間
- [x] 5.6 實作點擊 session 切換：呼叫 API 載入訊息，替換當前對話 state

## 6. 前端：清除對話

- [x] 6.1 在標題列新增「清除」圖示按鈕（已登入用戶才顯示）
- [x] 6.2 實作確認對話框（inline confirm 或 window.confirm）
- [x] 6.3 確認後呼叫 `DELETE /ai/sessions/:id`，清空訊息 state，建立新 session

## 7. 前端：重新生成回應

- [x] 7.1 在 `ChatMessage.tsx` 新增 `isLast` prop，控制是否顯示重新生成按鈕
- [x] 7.2 在 `ChatWidget.tsx` 傳入 `onRegenerate` callback 給最後一則 AI 訊息
- [x] 7.3 實作重新生成邏輯：移除最後一則 AI 訊息 state，以上一則 user 訊息重新呼叫 `askAI`
- [x] 7.4 載入中時停用重新生成按鈕

## 8. 前端：動態後續建議 UI

- [x] 8.1 在 `ChatWidget.tsx` 新增 `suggestedQuestions` state，AI 回應到達時更新
- [x] 8.2 在最後一則 AI 訊息下方渲染建議按鈕列
- [x] 8.3 點擊建議後呼叫 `handleSubmit`，並清空 `suggestedQuestions`
- [x] 8.4 用戶自行送出新問題時清空 `suggestedQuestions`

## 9. 前端：Markdown 優化

- [x] 9.1 在 `ChatMessage.tsx` 的 `MarkdownContent` 新增程式碼塊解析（偵測 ` ``` ` 開頭/結尾行）
- [x] 9.2 渲染程式碼塊為 `<pre><code>` 加等寬字型、灰底，顯示語言標籤
- [x] 9.3 補完行內程式碼 `` `code` `` 渲染（灰底小膠囊）
- [x] 9.4 新增表格解析（偵測 `| ... |` 格式行），渲染為有框線 `<table>`，標題列加底色
- [x] 9.5 表格容器加 `overflow-x-auto` 防止破版

## 10. 測試與部署

- [x] 10.1 手動測試：輪播建議每次開啟結果不同
- [x] 10.2 手動測試：送出問題後出現後續建議，點擊建議可送出
- [x] 10.3 手動測試：對話記憶——重新整理後訊息仍保留
- [x] 10.4 手動測試：切換歷史 session、清除對話
- [x] 10.5 手動測試：重新生成，新回答取代舊回答
- [x] 10.6 手動測試：程式碼塊與表格正確渲染
- [x] 10.7 部署後端 preview，確認新 API 正常
- [x] 10.8 部署前端 preview，完整 E2E 驗證

