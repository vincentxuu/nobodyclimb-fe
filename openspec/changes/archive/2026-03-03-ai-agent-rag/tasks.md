## 1. 基礎設施設定

- [x] 1.1 建立 Vectorize 索引 `nobodyclimb-routes-preview`（1024 維度，cosine 距離度量）
- [x] 1.2 建立 Vectorize 索引 `nobodyclimb-routes` 用於正式環境
- [x] 1.3 建立 metadata 索引用於 grade_numeric、crag、type 欄位
- [x] 1.4 在 Cloudflare Dashboard 建立 AI Gateway `nobodyclimb-preview` 和 `nobodyclimb`
- [x] 1.5 更新 `backend/wrangler.toml` 加入預覽環境的 AI、Vectorize bindings（需先完成 1.1 取得 index ID）：於 `[env.preview]` 區塊加入 `[env.preview.ai] binding = "AI"` 及 `[[env.preview.vectorize]] binding = "VECTOR_INDEX" index_name = "nobodyclimb-routes-preview"`
- [x] 1.6 更新 `backend/wrangler.toml` 加入正式環境的 AI、Vectorize bindings（需先完成 1.2 取得 index ID）：於 `[env.production]` 區塊加入 `[env.production.ai] binding = "AI"` 及 `[[env.production.vectorize]] binding = "VECTOR_INDEX" index_name = "nobodyclimb-routes"`

## 2. 資料庫結構

- [x] 2.1 建立遷移檔案 `migrations/0046_create_ai_tables.sql`
- [x] 2.2 新增 ai_documents 表格，包含 id、type、source_id、text、metadata、embedding_id、timestamps 欄位
- [x] 2.3 新增 ai_query_logs 表格，包含 id、user_id、query、response、sources、latency_ms、feedback 欄位
- [x] 2.4 新增 ai_prompts 表格，包含 id、name、version、content、variables、status 欄位
- [x] 2.5 新增 ai_tools 表格，包含 id、name、description、parameters、enabled 欄位
- [x] 2.6 新增 ai_config 表格，包含 key、value 欄位
- [x] 2.7 在預覽環境執行遷移
- [x] 2.8 在正式環境執行遷移

## 3. 後端型別定義

- [x] 3.1 在 `backend/src/types.ts` 加入 AI binding 型別
- [x] 3.2 加入 VectorizeIndex 型別定義
- [x] 3.3 加入 AIDocument 和 AIDocumentMetadata 介面
- [x] 3.4 加入 AIQueryLog 介面
- [x] 3.5 加入 AIAskRequest/Response、AISearchRequest、AIFeedbackRequest 介面
- [x] 3.6 加入 AISource 介面
- [x] 3.7 更新 Env 介面，加入 AI、VECTOR_INDEX、AI_GATEWAY_SLUG

## 4. Embedding 服務

- [x] 4.1 建立 `backend/src/services/embedding.ts`
- [x] 4.2 實作 EmbeddingService 類別，使用 env 建構函式
- [x] 4.3 實作 `embed(text: string)` 方法，用於單一文字轉向量
- [x] 4.4 實作 `embedBatch(texts: string[])` 方法，自動分批處理（每批最多 100 個）
- [x] 4.5 加入 Workers AI 失敗的錯誤處理

## 5. 索引服務

- [x] 5.1 建立 `backend/src/services/indexing.ts`
- [x] 5.2 實作 IndexingService 類別，依賴 EmbeddingService
- [x] 5.3 實作 `createRouteDocument()` 方法，使用文件模板
- [x] 5.4 實作 `createCragDocument()` 方法，使用文件模板
- [x] 5.5 實作 `indexRoutes()` 方法，從 D1 索引所有路線
- [x] 5.6 實作 `indexCrags()` 方法，從 D1 索引所有岩場
- [x] 5.7 實作 `indexDocuments()` 私有方法，執行 Vectorize upsert + D1 insert
- [x] 5.8 實作 `gradeToNumeric()` 工具函式，轉換 YDS 等級為數值
- [x] 5.9 實作 `reindexAll()` 方法，支援 type 參數
- [x] 5.10 實作 `clearType()` 私有方法，刪除現有文件

## 6. 查詢服務

- [x] 6.1 建立 `backend/src/services/query.ts`
- [x] 6.2 實作 QueryService 類別，依賴 EmbeddingService
- [x] 6.3 實作 `ask()` 方法，包含完整 RAG 流程（embed → search → retrieve → generate）
- [x] 6.4 實作 `search()` 方法，執行純向量搜尋
- [x] 6.5 實作 KV 快取檢查和儲存邏輯，TTL 設為 1 小時
- [x] 6.6 實作 `extractLocationFilter()`（查 D1 偵測區域/岩場/地區）、`extractGradeFilter()`（YDS → grade_numeric 範圍）、`extractTypeFilter()`（文件類型）三個智慧過濾方法，取代原規劃的 `buildFilter()`
- [x] 6.7 實作 `getDocuments()` 方法，從 D1 取得完整文字
- [x] 6.8 實作 `extractTitle()` 和 `buildUrl()` 輔助方法
- [x] 6.9 實作 `logQuery()` 方法，插入 ai_query_logs
- [x] 6.10 實作 `hashQuery()` 工具函式，生成快取鍵
- [x] 6.11 實作 `hasSimilarRouteIntent()` 偵測「推薦相似路線」意圖
- [x] 6.12 實作 `extractRouteReference()` 擷取被提及路線的岩場 + 難度，以大等級公式（majorGrade×10 到 (majorGrade+1)×10）解決 YDS 跨等級跳躍問題

## 7. Prompt 模板

- [x] 7.1 建立 `backend/src/utils/ai-prompts.ts`
- [x] 7.2 定義 SYSTEM_PROMPT 常數，包含 NobodyClimb AI 助理指示
- [x] 7.3 定義 QUERY_TEMPLATE 常數，包含 {context} 和 {query} 佔位符

## 8. API 路由

- [x] 8.1 建立 `backend/src/routes/ai.ts`
- [x] 8.2 實作 `POST /ask` 端點，包含請求驗證和 QueryService 呼叫
- [x] 8.3 實作 `GET /search` 端點，解析查詢參數
- [x] 8.4 實作 `POST /feedback` 端點，更新 ai_query_logs
- [x] 8.5 實作 `POST /index` 端點，加入管理員認證中介層
- [x] 8.6 實作 `GET /health` 端點，測試 Workers AI 呼叫
- [x] 8.7 加入錯誤處理中介層，統一錯誤回應格式
- [x] 8.8 在 `backend/src/index.ts` 註冊 AI 路由於 `/api/v1/ai`

## 9. 前端 API 客戶端

- [x] 9.1 建立 `apps/web/src/lib/api/ai.ts`
- [x] 9.2 定義 TypeScript 介面（AIAskRequest、AIAskResponse、AISource 等）
- [x] 9.3 實作 `askAI()` 函式，呼叫 POST /api/v1/ai/ask
- [x] 9.4 實作 `searchAI()` 函式，呼叫 GET /api/v1/ai/search
- [x] 9.5 實作 `submitFeedback()` 函式，呼叫 POST /api/v1/ai/feedback
- [x] 9.6 實作 `checkAIHealth()` 函式，呼叫 GET /api/v1/ai/health
- [x] 9.7 建立 `useAskAI` mutation hook，使用 TanStack Query
- [x] 9.8 建立 `useSearchAI` query hook，使用 TanStack Query
- [x] 9.9 建立 `useSubmitFeedback` mutation hook

## 10. ChatWidget 元件

- [x] 10.1 建立 `apps/web/src/components/ai/ChatWidget.tsx`
- [x] 10.2 實作浮動觸發按鈕，固定定位
- [x] 10.3 實作對話視窗容器，包含標題、訊息區、輸入欄
- [x] 10.4 實作開啟/關閉狀態，使用 CSS `transition-all`（非 Framer Motion）
- [x] 10.5 實作訊息輸入，支援 Enter 鍵和按鈕提交
- [x] 10.6 實作載入狀態，顯示「思考中...」轉圈動畫
- [x] 10.7 實作建議按鈕，用於空白狀態
- [x] 10.8 實作行動裝置響應式佈局（行動裝置全螢幕）
- [x] 10.9 加入鍵盤無障礙功能（焦點管理、Escape 關閉）

## 11. ChatMessage 元件

- [x] 11.1 建立 `apps/web/src/components/ai/ChatMessage.tsx`
- [x] 11.2 實作使用者訊息氣泡（右對齊，主色）
- [x] 11.3 實作助理訊息氣泡（左對齊，次要色）
- [x] 11.4 實作來源卡片顯示於助理訊息下方
- [x] 11.5 實作回饋按鈕（讚/倒讚），整合 API
- [x] 11.6 實作回饋已提交狀態（「感謝您的回饋！」）

## 12. SourceCard 元件

- [x] 12.1 建立 `apps/web/src/components/ai/SourceCard.tsx`
- [x] 12.2 實作卡片佈局，包含圖示、標題、類型標籤
- [x] 12.3 實作類型特定圖示（路線用 Mountain、岩場用 MapPin、影片用 Video）
- [x] 12.4 實作內部連結處理，使用 Next.js Link
- [x] 12.5 實作外部連結處理（YouTube），使用 target="_blank"

## 13. 元件整合

- [x] 13.1 建立 `apps/web/src/components/ai/index.ts` 匯出檔案
- [x] 13.2 將 ChatWidget 加入 `apps/web/src/app/layout.tsx`
- [x] 13.3 加入功能旗標環境變數，控制 ChatWidget 啟用/停用
- [x] 13.4 建立 `apps/web/src/components/ai/AdminChatWidget.tsx` — 管理員限定包裝元件（檢查 `user.role === 'admin'`），並以 `NEXT_PUBLIC_ENABLE_AI_CHAT` 環境變數控制整體開關

## 14. Admin Dashboard - 基礎

- [x] 14.1 建立 `apps/web/src/app/admin/ai/page.tsx` 儀表板頁面
- [x] 14.2 實作 KPI 卡片（查詢數、延遲、成功率、Token 用量）
- [x] 14.3 實作健康狀態指示器
- [x] 14.4 實作查詢量圖表（過去 7 天）
- [x] 14.5 實作熱門查詢列表

## 15. Admin Dashboard - 日誌

- [x] 15.1 建立 `apps/web/src/app/admin/ai/logs/page.tsx`
- [x] 15.2 實作查詢日誌表格，包含分頁
- [x] 15.3 實作日期範圍和回饋分數篩選器
- [x] 15.4 建立 `apps/web/src/app/admin/ai/logs/[logId]/page.tsx` 詳細頁面
- [x] 15.5 實作時間分解顯示
- [x] 15.6 實作 CSV 匯出功能

## 16. Admin Dashboard - 知識庫

- [x] 16.1 建立 `apps/web/src/app/admin/ai/knowledge/page.tsx`
- [x] 16.2 實作資料來源表格（路線、岩場、影片），顯示狀態
- [x] 16.3 實作手動重新索引觸發按鈕，包含確認對話框
- [x] 16.4 實作索引進度指示器

## 17. Admin Dashboard - Prompts

- [x] 17.1 建立 `apps/web/src/app/admin/ai/prompts/page.tsx`
- [x] 17.2 實作 prompts 列表表格
- [x] 17.3 建立 `apps/web/src/app/admin/ai/prompts/[promptId]/page.tsx` 編輯器頁面
- [x] 17.4 實作 prompt 編輯器，包含語法高亮
- [x] 17.5 實作版本歷史和回滾功能
- [x] 17.6 實作發布到正式環境的工作流程

## 18. Admin Dashboard - 設定

- [x] 18.1 建立 `apps/web/src/app/admin/ai/settings/page.tsx`
- [x] 18.2 實作模型設定表單
- [x] 18.3 實作快取設定表單
- [x] 18.4 實作速率限制設定

## 19. Admin API 端點

- [x] 19.1 建立 `GET /api/v1/admin/ai/dashboard` 用於 KPI 資料
- [x] 19.2 建立 `GET /api/v1/admin/ai/logs`，支援分頁和篩選
- [x] 19.3 建立 `GET /api/v1/admin/ai/logs/:id` 用於單一日誌詳情
- [x] 19.4 建立 `GET /api/v1/admin/ai/knowledge` 用於資料來源狀態
- [x] 19.5 建立 `GET /api/v1/admin/ai/prompts` 和 CRUD 端點
- [x] 19.6 建立 `GET /api/v1/admin/ai/config` 和 `PUT /api/v1/admin/ai/config`
- [x] 19.7 建立 `backend/src/routes/admin-ai.ts` 並在 `backend/src/index.ts` 以 `v1.route('/admin/ai', adminAiRoutes)` 方式註冊，對齊現有 `/admin/questions`、`/admin/crags`、`/admin/import` 的路由命名慣例

## 20. 初始資料索引

- [x] 20.1 在預覽環境執行路線索引
- [x] 20.2 驗證 Vectorize 向量數量與路線數量相符
- [x] 20.3 在預覽環境執行岩場索引
- [x] 20.4 在預覽環境測試語義搜尋查詢
- [x] 20.5 在正式環境執行路線和岩場索引

## 21. 測試

- [x] 21.1 測試 embedding 服務與繁體中文文字
- [x] 21.2 測試 RAG 查詢，使用 proposal 中的範例問題
- [x] 21.3 測試向量搜尋與 metadata 篩選
- [x] 21.4 測試回饋提交流程
- [x] 21.5 測試 ChatWidget 開啟/關閉和訊息流程
- [x] 21.6 測試管理員儀表板資料顯示
- [x] 21.7 測試從管理面板重新索引功能

## 22. 部署

- [x] 22.1 部署後端到預覽環境
- [x] 22.2 部署前端到預覽環境
- [x] 22.3 驗證預覽環境的 AI 功能端對端運作
- [x] 22.4 部署後端到正式環境
- [x] 22.5 部署前端到正式環境（ChatWidget 停用）
- [x] 22.6 內部測試後透過功能旗標啟用 ChatWidget
