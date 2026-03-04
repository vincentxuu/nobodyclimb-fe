## 1. 資料庫 Migration

- [x] 1.1 新增 `backend/migrations/0047_climber_rank_system.sql`：建立 `climber_ranks` 資料表（id, name, display_name, min_score, daily_ai_limit, color, description）
- [x] 1.2 在 migration 中插入四個預設等級資料：麓（0分/2次）、壁（25分/6次）、稜（55分/12次）、巔（85分/24次）
- [x] 1.3 在 migration 中建立 `user_ranks` 資料表（user_id PK, score, rank_id, daily_ai_used, daily_ai_limit, last_reset_date, last_score_calculated_at, rank_override_id）
- [x] 1.4 在 `user_ranks` 加入 FK constraint 至 `users` 和 `climber_ranks`，及 `user_id` index
- [x] 1.5 執行 migration 在 preview 環境（wrangler d1 execute --remote --env preview）

## 2. 後端 - 等級服務

- [x] 2.1 新增 `backend/src/services/rank.ts`，實作 `calculateUserScore(userId, db)` 函式：以多條 SELECT 查詢各積分來源，加總並套用各模組上限
- [x] 2.2 實作 `getUserRank(userId, db)` 函式：查詢 `user_ranks` 單筆記錄，不存在時回傳 null
- [x] 2.3 實作 `initUserRank(userId, db)` 函式：`INSERT OR IGNORE` 建立麓等級預設記錄
- [x] 2.4 實作 `updateUserRank(userId, db)` 函式：重算積分後更新 `user_ranks`（跳過有 `rank_override_id` 的用戶）
- [x] 2.5 實作 `resetDailyUsage(db)` 函式：批次 UPDATE 所有 `user_ranks` 的 `daily_ai_used = 0, last_reset_date = today`
- [x] 2.6 實作 `recalculateAllRanks(db)` 函式：依序重算所有 `is_active = 1` 且無 `rank_override_id` 的用戶積分與等級

## 3. 後端 - AI 路由整合配額

- [x] 3.1 修改 `backend/src/routes/ai.ts` 的 `POST /ask`：加入 JWT auth middleware，未登入回傳 401
- [x] 3.2 在 ask 處理邏輯前加入 `initUserRank`（若無記錄）及 lazy reset（`last_reset_date` 非今日時先重置）
- [x] 3.3 以原子 UPDATE 扣除配額（`daily_ai_used + 1 WHERE daily_ai_used < daily_ai_limit`），影響 0 行時回傳 429 含 quota_exceeded 資訊
- [x] 3.4 成功 AI 回應中附加 `quota` 物件（tier, tier_display, daily_limit, daily_used, remaining）
- [x] 3.5 新增 `GET /api/v1/ai/quota/me` 端點：需登入，回傳當前等級、積分、今日使用量、重置時間

## 4. 後端 - Admin 等級管理端點

- [x] 4.1 在 `backend/src/routes/admin-ai.ts` 新增 `GET /admin/ai/users/:userId/rank`：回傳用戶等級、積分總分與各模組分解
- [x] 4.2 新增 `PUT /admin/ai/users/:userId/rank-override`：接受 `{ rank: string | null }`，更新 `rank_override_id` 並即時生效 `daily_ai_limit`
- [x] 4.3 新增 `POST /admin/ai/recalculate-ranks`：接受 `{ user_id: string | "all" }`，單一用戶立即重算並回傳結果，`"all"` 時觸發批次重算

## 5. 後端 - Cron Trigger 設定

- [x] 5.1 修改 `backend/wrangler.toml`，在 `[triggers]` 區塊加入 `crons = ["0 16 * * *"]`
- [x] 5.2 在 `backend/src/index.ts` 新增 `scheduled()` export handler，呼叫 `resetDailyUsage()` 再呼叫 `recalculateAllRanks()`
- [x] 5.3 以 `wrangler dev` 本地測試 Cron handler 可被觸發（`wrangler dev --test-scheduled`）

## 6. 共享套件 - 型別定義

- [x] 6.1 在 `packages/types/` 新增 `ClimberRank` 型別（id, name, display_name, min_score, daily_ai_limit, color）
- [x] 6.2 新增 `UserRank` 型別（user_id, score, rank_id, daily_ai_used, daily_ai_limit, last_reset_date, rank_override_id）
- [x] 6.3 新增 `AiQuota` 型別（tier, tier_display, daily_limit, daily_used, remaining, score, resets_at）

## 7. 前端 - API Client 更新

- [x] 7.1 修改 `apps/web/src/lib/api/ai.ts`：在 ask 回應型別加入 `quota?: AiQuota` 欄位
- [x] 7.2 新增 `getMyQuota()` 函式：GET `/api/v1/ai/quota/me`，回傳 `AiQuota`

## 8. 前端 - 等級 Badge 組件

- [x] 8.1 新增 `apps/web/src/components/rank/RankBadge.tsx`：接受 `tier`、`size`（sm/md/lg）props，依等級顯示對應顏色與名稱
- [x] 8.2 定義等級顏色 mapping：麓（stone）、壁（slate）、稜（amber）、巔（indigo）
- [x] 8.3 新增 `RankBadge` 的 tooltip variant（顯示積分說明，供人物誌公開頁使用）

## 9. 前端 - ChatWidget 整合配額

- [x] 9.1 修改 `apps/web/src/components/ai/ChatWidget.tsx`：掛載時呼叫 `getMyQuota()` 取得初始配額狀態
- [x] 9.2 在對話視窗頂部或輸入框旁顯示等級 badge + 剩餘次數（如「稜 · 剩餘 10/12」）
- [x] 9.3 當 AI 回應含 `quota` 欄位時，即時更新顯示的剩餘次數
- [x] 9.4 當收到 429 quota_exceeded 時，顯示提示訊息（說明今日配額耗盡、明日重置，並引導用戶充實內容以升段）

## 10. 前端 - Profile 頁等級顯示

- [x] 10.1 找到個人 Profile 頁組件（`apps/web/src/components/ProfileSidebar.tsx`）
- [x] 10.2 在 Profile 頁呼叫 `useMyQuota()` hook 取得等級
- [x] 10.3 在 avatar 下方加入 `<RankBadge tier={quota.tier} size="md" />`

## 11. 前端 - 留言旁等級標籤

- [x] 11.1 找到留言/互動相關組件（biography comments、route stories 等）
- [x] 11.2 更新後端 getComments SQL LEFT JOIN user_ranks，ContentComment 介面加入 user_rank_id
- [x] 11.3 在留言作者名稱旁加入 `<RankBadge />` 小型標籤，等級為「麓」時不顯示（`tier !== 'foothill'`）

## 12. 前端 - 人物誌公開頁等級

- [x] 12.1 找到人物誌公開頁組件（`apps/web/src/app/biography/profile/[slug]/ProfileClient.tsx`）
- [x] 12.2 更新後端 findById/findBySlug JOIN user_ranks，前端 Biography 型別加入 user_rank_id
- [x] 12.3 在公開人物誌人名旁加入含 tooltip 的 `<RankBadge showTooltip />`（麓等級不顯示）
