## Why

用戶完攀路線後，系統目前沒有提供任何後續建議，錯失了最佳的個人化推薦時機（用戶剛完成一條路線，最有動力探索下一條）。透過在完攀後自動觸發 AI 推薦，可以提升用戶留存並讓 AI 功能從被動問答進化為主動協助。

## What Changes

- **新增 `user_recommendations` 資料表**：永久儲存每筆推薦紀錄（`id`、`user_id`、`recommendation` JSON、`triggered_by`、`created_at`），不覆蓋舊紀錄
- **新增後端推薦生成服務**：呼叫 AI（RAG）依用戶近期完攀紀錄產生路線推薦，不消耗用戶配額（系統觸發時）
- **新增 `POST /api/v1/ai/recommendations` 端點**：系統與用戶皆可觸發，`triggered_by` 區分 `ascent` | `manual`
- **新增 `GET /api/v1/ai/recommendations` 端點**：取得用戶推薦歷史（最新在前）
- **完攀後自動觸發（ascent hook）**：`POST /api/v1/ascents` 成功後，非同步呼叫推薦生成
- **新增個人頁面「推薦」Tab**：顯示推薦歷史，複用 `SourceCard` 元件
- **完攀確認頁面 inline 顯示**：最新推薦卡片 + 「查看完整推薦」連結

## Capabilities

### New Capabilities
- `ai-route-recommendation`: AI 路線推薦的生成、儲存、觸發機制及 API 端點（系統觸發不消耗配額、用戶手動觸發消耗配額）
- `recommendation-profile-tab`: 個人頁面「推薦」Tab 及完攀確認頁面的 inline 推薦卡片 UI

### Modified Capabilities
- `ai-quota-enforcement`: 新增系統觸發類型，系統觸發（`triggered_by: 'ascent'`）不計入用戶每日配額；手動觸發（`triggered_by: 'manual'`）正常計入配額

## Impact

- **後端新增**: `backend/migrations/0049_create_user_recommendations.sql`、`backend/src/routes/ai-recommendations.ts`、`backend/src/services/recommendation.ts`
- **後端修改**: `backend/src/routes/ascents.ts`（完攀後 hook）、`backend/src/index.ts`（路由掛載）、`backend/src/routes/ai.ts`（配額邏輯擴充）
- **前端新增**: `apps/web/src/components/profile/RecommendationTab.tsx`、`apps/web/src/components/ascents/AscentsConfirmRecommendation.tsx`
- **前端修改**: 個人頁面 Tab 列、完攀確認流程頁面
- **依賴**: 現有 RAG pipeline（`backend/src/services/query.ts`）、`SourceCard` 元件、`ai-quota-enforcement` spec
