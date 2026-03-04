## 1. 資料庫 Migration

- [x] 1.1 建立 `0049_create_user_recommendations.sql`：新增 `user_recommendations` 表，欄位包含 `id`、`user_id`、`triggered_by`（`'ascent' | 'manual'`）、`status`（`'success' | 'failed'`）、`recommendation`（TEXT，存 JSON）、`created_at`
- [x] 1.2 在 `user_recommendations(user_id, created_at DESC)` 新增複合索引以優化分頁查詢
- [x] 1.3 執行 `pnpm db:migrate` 套用本地 migration，確認 schema 正確

## 2. 後端：推薦服務

- [x] 2.1 建立 `backend/src/services/recommendation.ts`，實作 `RecommendationService` class，注入 `Env`（DB、AI、VECTORIZE、CACHE）
- [x] 2.2 實作 `checkDailySystemLimit(userId)` 方法：查詢當日 `triggered_by='ascent'` 的推薦筆數，超過 3 筆回傳 false
- [x] 2.3 實作 `buildRecommendationQuery(recentAscents)` 方法：依最近 5 條完攀紀錄（路線名稱、難度）組成推薦查詢字串；無紀錄時使用預設通用查詢
- [x] 2.4 實作 `generate(userId, triggeredBy)` 主方法：取用戶近 5 條完攀 → 構建查詢 → 呼叫 `QueryService.ask()` → 將結果（`answer`、`sources`、`query`、`context_ascents`）寫入 `user_recommendations` 表
- [x] 2.5 `generate()` 中加入 try/catch：失敗時寫入 `status: 'failed'`、`recommendation: null` 的記錄，不拋出例外

## 3. 後端：完攀 Hook（Ascents 觸發）

- [x] 3.1 在 `backend/src/routes/ascents.ts` 的 `POST /` 成功寫入後，讀取 `c.executionCtx`，使用 `waitUntil(recommendationService.generate(userId, 'ascent'))` 非同步觸發推薦
- [x] 3.2 在觸發前呼叫 `checkDailySystemLimit()`，超限時不觸發，ascent API 回應不含任何推薦相關欄位（引導訊息由前端本地計數決定）

## 4. 後端：推薦 API 端點

- [x] 4.1 在現有 `backend/src/routes/ai.ts` 中新增 `POST /recommendations` 子路由（不建立新檔案）：套用 `authMiddleware`、複用同檔案現有的原子配額扣除邏輯、呼叫 `RecommendationService.generate(userId, 'manual')`、回傳新推薦紀錄，HTTP 201
- [x] 4.2 在現有 `backend/src/routes/ai.ts` 中新增 `GET /recommendations` 子路由：套用 `authMiddleware`、支援 `limit`（預設 10，上限 50）與 `offset` query params、查詢 `user_recommendations WHERE user_id = ? AND status = 'success' ORDER BY created_at DESC`、回傳分頁結果與 `total`
- [x] 4.3 為兩個端點加入 OpenAPI `describeRoute` 裝飾器（tags: `['AI']`，與現有端點一致）

## 5. 前端：推薦 API Client

- [x] 5.1 在 `apps/web/src/lib/api/` 新增 `recommendations.ts`，封裝 `fetchRecommendations(params)` 與 `triggerManualRecommendation()` axios 函數
- [x] 5.2 建立 TanStack Query hooks：`useRecommendations()` 與 `useTriggerRecommendation()`（mutation），後者成功後 invalidate recommendations cache

## 6. 前端：個人頁面「推薦」Tab

- [x] 6.1 建立 `apps/web/src/components/profile/RecommendationTab.tsx`：顯示最新推薦的 `answer` 文字與 `sources` 路線卡片（複用 `SourceCard` 元件）
- [x] 6.2 實作空狀態：推薦歷史為空時顯示引導文案「完成第一筆完攀後，AI 將為你推薦下一條路線」
- [x] 6.3 實作骨架屏（Skeleton）與「推薦生成中...」提示：isLoading 時顯示，前端每 2 秒 polling（最多 3 次）後放棄並顯示空狀態
- [x] 6.4 實作「載入更多」按鈕：點擊後以 `offset += 10` 發送分頁請求，追加結果至列表底部
- [x] 6.5 實作「重新推薦」按鈕：呼叫 `useTriggerRecommendation()`，成功後新推薦顯示於列表頂部；配額不足時顯示 Toast 通知「今日 AI 配額已用完，明日重置」
- [x] 6.6 在個人資料頁面的 Tab 列中新增「推薦」Tab，整合 `RecommendationTab` 元件

## 7. 前端：完攀確認頁 Inline 引導

- [x] 7.1 在完攀紀錄新增成功後的確認 UI 中，讀取 sessionStorage 的 `daily_recommendation_count` 計數（無則視為 0）
- [x] 7.2 計數 < 3 時，在確認頁底部顯示引導訊息「AI 正在為你推薦下一條路線，稍後至個人頁面查看」，附「前往查看」連結（導向個人頁面推薦 Tab），並將計數遞增後寫回 sessionStorage
- [x] 7.3 計數 >= 3 時，不顯示任何推薦引導訊息

## 8. 測試與驗收

- [x] 8.1 手動測試：新增完攀 → 確認完攀確認頁顯示推薦引導訊息 → 等待約 5 秒 → 個人頁面推薦 Tab 出現新推薦，含 `answer` 文字與 `SourceCard` 路線卡片
- [x] 8.2 手動測試：同一 session 連續完攀 4 次 → 第 4 次完攀確認頁不顯示推薦引導（sessionStorage 計數達 3）
- [x] 8.3 手動測試：確認 ascent API 回應 body 不含 `ai_recommendation_triggered` 欄位（職責分離）
- [x] 8.4 手動測試：點擊「重新推薦」→ 確認配額扣除，新推薦出現在列表頂部
- [x] 8.5 手動測試：耗盡配額後點擊「重新推薦」→ 確認顯示 Toast 通知
- [x] 8.6 執行 `pnpm db:migrate:remote` 套用 production migration
