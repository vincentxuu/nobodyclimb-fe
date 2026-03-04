## Why

NobodyClimb 平台擁有豐富的攀岩資料（946 條路線、5 個岩場、9,582 支影片），但使用者面臨兩個核心痛點：

1. **找不到適合自己程度的路線** - 現有搜尋只能依靠關鍵字，無法理解「適合新手」、「5.10 左右」等自然語言描述
2. **不知道該練什麼** - 缺乏根據個人程度提供訓練建議的功能

透過建構基於 Cloudflare AI 技術棧的 RAG（Retrieval-Augmented Generation）問答系統，使用者可以用自然語言詢問攀岩問題，系統根據平台現有資料提供精準、有來源依據的回答。

## What Changes

### 核心功能

- **語義搜尋**：使用向量相似度搜尋，理解「適合新手的龍洞路線」這類自然語言查詢
- **智慧問答**：結合 LLM 生成自然語言回答，附帶來源連結
- **多資料來源整合**：統一搜尋岩場、路線、影片資料
- **使用者回饋收集**：收集評分改善回答品質

### 使用場景

| 查詢類型 | 範例 |
|---------|------|
| 地區+難度 | 「北部有什麼適合 5.10 的戶外路線？」 |
| 岩場推薦 | 「推薦適合新手的龍洞岩場路線」 |
| 季節查詢 | 「冬天可以爬的岩場有哪些？」 |
| 影片搜尋 | 「有關於 5.12 路線的教學影片嗎？」 |
| 裝備建議 | 「這條路線需要什麼裝備？」 |

### 系統變更

- 新增 AI 語義搜尋 API（`POST /api/v1/ai/search`）
- 新增 RAG 問答端點（`POST /api/v1/ai/ask`）
- 新增回饋端點（`POST /api/v1/ai/feedback`）
- 新增前端 ChatWidget 浮動對話元件
- 新增 Admin AI 管理介面（Dashboard、知識庫、Prompt 管理、日誌分析）
- 新增 Cloudflare Vectorize 索引，儲存路線/岩場/影片的 embedding
- 新增 D1 資料表：`ai_documents`、`ai_query_logs`、`ai_prompts`、`ai_tools`、`ai_config`

### MVP 範圍

**Phase 1 實作**：
- 語義路線搜尋（自然語言查詢 + 等級/岩場/類型過濾）
- 基礎 RAG 問答
- ChatWidget 前端元件
- 基礎 Admin Dashboard（監控 + 日誌）

**暫不實作**：
- 多輪對話記憶
- 用戶攀爬歷史分析
- 語音介面
- A/B 測試
- 進階訓練建議

## Capabilities

### New Capabilities

- `ai-embedding-service`: Embedding 生成服務
  - 使用 `@cf/baai/bge-m3` 模型（1024 維，支援繁體中文）
  - 支援單一/批次文字轉向量
  - 批次處理限制：100 個文字/次

- `ai-indexing-service`: 資料索引服務
  - 將路線/岩場/影片資料轉換為可搜尋文件
  - 文件模板：組合名稱、等級、地區、描述等欄位
  - 儲存至 Vectorize（向量）+ D1（原文）
  - 支援增量索引與完整重建

- `ai-query-service`: RAG 查詢服務
  - 向量搜尋（Top-K 相似度）
  - Metadata 過濾（難度、岩場、類型）+ 自動 NLP 位置/難度/意圖偵測
  - LLM 生成（`@cf/google/gemma-3-12b-it`）
  - KV 快取（TTL 1 小時）
  - 查詢日誌記錄

- `ai-api-endpoints`: AI 相關 API 端點
  - `POST /api/v1/ai/ask` - RAG 問答
  - `GET /api/v1/ai/search` - 語義搜尋
  - `POST /api/v1/ai/feedback` - 使用者回饋
  - `POST /api/v1/ai/index` - 管理員索引（需驗證）
  - `GET /api/v1/ai/health` - 健康檢查

- `ai-chat-widget`: 前端浮動對話元件
  - 右下角浮動按鈕觸發（透過 createPortal 掛載至 body）
  - 對話歷史顯示
  - 來源卡片連結
  - 回饋按鈕（讚/倒讚）
  - 建議問題快捷按鈕（點擊直接送出）
  - 響應式設計（桌面 400px × 600px / 行動版全螢幕）
  - **MVP 限定**：透過 `AdminChatWidget` 包裝，僅管理員可見（`NEXT_PUBLIC_ENABLE_AI_CHAT` 控制）

- `ai-admin-dashboard`: Admin AI 管理介面
  - Dashboard：KPIs（查詢數、延遲、成功率、Token 用量）、健康狀態
  - Knowledge Base：資料來源管理、索引狀態、文件模板編輯
  - Prompts：版本控制、編輯器、發布流程
  - Logs：查詢日誌列表、單一查詢詳情（Trace）
  - Settings：模型設定、快取設定

### Modified Capabilities

（無既有 spec 需要修改）

## Impact

### Backend (`backend/`)

**新增檔案**：
- `src/routes/ai.ts` - AI API 路由
- `src/services/embedding.ts` - Embedding 服務
- `src/services/indexing.ts` - 索引服務
- `src/services/query.ts` - 查詢服務
- `src/utils/ai-prompts.ts` - Prompt 模板
- `migrations/0031_create_ai_documents.sql` - AI 資料表

**修改檔案**：
- `wrangler.toml` - 新增 AI、Vectorize bindings
- `src/types.ts` - 新增 AI 相關型別
- `src/index.ts` - 註冊 AI 路由

### Frontend (`apps/web/`)

**新增檔案**：
- `src/components/ai/ChatWidget.tsx` - 對話主元件
- `src/components/ai/AdminChatWidget.tsx` - 管理員限定包裝元件
- `src/components/ai/ChatMessage.tsx` - 訊息元件
- `src/components/ai/SourceCard.tsx` - 來源卡片
- `src/components/ai/index.ts` - 匯出
- `src/lib/api/ai.ts` - AI API 客戶端 + React Query hooks
- `src/app/admin/ai/page.tsx` - Dashboard
- `src/app/admin/ai/knowledge/page.tsx` - 知識庫
- `src/app/admin/ai/prompts/page.tsx` - Prompt 管理
- `src/app/admin/ai/logs/page.tsx` - 日誌

**修改檔案**：
- `src/app/layout.tsx` - 加入 `<AdminChatWidget />`（需 `NEXT_PUBLIC_ENABLE_AI_CHAT=true`）

### Cloudflare Services

| 服務 | 用途 | 設定 |
|------|------|------|
| Workers AI | Embedding + LLM | `AI` binding |
| Vectorize | 向量搜尋 | `VECTOR_INDEX` binding, 1024 維, cosine |
| AI Gateway | 監控日誌 | `nobodyclimb` gateway (可選) |
| D1 | 原文儲存 | 現有 `DB` binding |
| KV | 查詢快取 | 現有 `CACHE` binding |

### 成本估算

全部在 Cloudflare 免費額度內運行：

| 服務 | 免費額度 | 預估使用量 |
|------|---------|-----------|
| Workers AI | 10,000 Neurons/日 | ~3,500/日 |
| Vectorize | 5 索引，各 200K 向量 | 1 索引，~11K 向量 |
| D1 | 5GB 儲存 | ~100MB |
| AI Gateway | 100K 日誌/月 | ~50K/月 |

**預估月費: $0**（MVP 階段）

### Dependencies

- 無新增外部套件依賴
- 全部使用 Cloudflare 內建服務
- 需要 Cloudflare Workers Paid Plan（已有）
