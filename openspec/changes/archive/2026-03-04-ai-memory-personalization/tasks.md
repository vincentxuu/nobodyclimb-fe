## 1. 資料庫 Migration

- [x] 1.1 新增 migration 檔案，建立 `user_ai_memory` 表：`id`（TEXT PK）、`user_id`（TEXT NOT NULL）、`memory_key`（TEXT NOT NULL）、`memory_type`（TEXT：preference/behavior/fact）、`content`（TEXT）、`updated_at`（TEXT）
- [x] 1.2 在 `user_ai_memory` 加入唯一索引：`(user_id, memory_key)`
- [x] 1.3 執行 `pnpm db:migrate` 確認 migration 正確套用

## 2. 後端 - Memory Repository

- [x] 2.1 建立 `backend/src/repositories/memory.ts`，實作 `getUserMemories(userId, db)` → 返回所有記憶，依 `updated_at` 倒序
- [x] 2.2 實作 `upsertMemory(userId, memoryKey, memoryType, content, db)` → 以 `(user_id, memory_key)` UPSERT，更新 `content` 與 `updated_at`
- [x] 2.3 實作 `deleteMemory(userId, memoryId, db)` → 只刪除屬於 `userId` 的記憶；若不存在或不屬於該用戶，不刪除（靜默處理）
- [x] 2.4 實作 `getMemoriesSummary(userId, db)` → 返回格式化字串，供注入 system prompt（例：「攀岩程度：5.11a\n偏好地區：台中\n攀岩類型：運攀」）；無記憶時返回 null

## 3. 後端 - 完攀紀錄個人化

- [x] 3.1 建立 `backend/src/services/personalization.ts`，實作 `getRecentAscents(userId, db)` → 從 `user_route_ascents` JOIN `routes` 取最近 10 條，返回路線名稱與 grade_numeric
- [x] 3.2 實作 `buildAscentContext(ascents)` → 組成文字：「已完攀：龍洞青蛙石（5.10a）、玉山峭壁（5.11b）...」；少於 1 條時返回 null
- [x] 3.3 實作 `estimateAbilityLevel(ascents)` → 從**成功完攀**（redpoint/flash/onsight/toprope/lead/repeat）的 grade_numeric 取 P75；少於 3 條返回 null
- [x] 3.4 實作 `buildPersonalizedSystemPrompt(memorySummary, ascentContext, abilityLevel)` → 組成個人化 prompt 前綴，拼接至 `SYSTEM_PROMPT`；三個參數皆為 null 時直接返回原 `SYSTEM_PROMPT`

## 4. 後端 - 記憶自動提取

- [x] 4.1 建立 `backend/src/services/memory-extractor.ts`，實作 `extractMemoriesFromQuery(query, userId, db, ai, gatewayOptions)` → 僅傳入用戶問題（不含 answer），呼叫 llama-3.1-8b 提取結構化記憶
- [x] 4.2 設計記憶提取 prompt：要求 LLM **只從用戶問題本身**識別用戶資訊（不推斷 AI 回答的內容），輸出 JSON 陣列（每項含 `memory_key`、`memory_type`、`content`），最多 3 條；memory_key 限定清單：`climbing_level`、`preferred_region`、`preferred_style`、`preferred_crag`、`goals`
- [x] 4.3 解析 LLM 回傳 JSON，呼叫 `upsertMemory()` 寫入有效的記憶（跳過解析失敗或 content 為空的項目）
- [x] 4.4 整個提取流程需有 try/catch，提取失敗不應影響主查詢（靜默忽略錯誤）

## 5. 後端 - QueryService 整合

- [x] 5.1 修改 `QueryService.ask()` 簽章，接受 `ctx?: ExecutionContext`（供 `waitUntil` 使用）；在 `backend/src/routes/ai.ts` 的 `/ask` 路由中，明確傳入 `c.executionCtx`：`queryService.ask(request, userId, c.executionCtx)`；本地開發無 `executionCtx` 時，`ctx?.waitUntil()` 會靜默 skip
- [x] 5.2 在 ask() 的快取鍵邏輯中，已登入用戶的鍵改為 `ai:ask:{userId}:{hash(query)}{historyHash}:{hash(personalizedContext)}`（personalizedContext 為記憶摘要 + 完攀 context 合併字串，皆為空時省略此段）
- [x] 5.3 在 LLM 呼叫前（已取得完攀紀錄後），並行執行：`getMemoriesSummary(userId)` + `getRecentAscents(userId)` + `estimateAbilityLevel()`
- [x] 5.4 以 `buildPersonalizedSystemPrompt()` 組成動態 system prompt，傳入 LLM messages
- [x] 5.5 LLM 回應後，使用 `ctx?.waitUntil()` 非同步呼叫 `extractMemoriesFromQuery(query, userId, ...)`（僅對已登入用戶執行；只傳 query，不傳 answer）

## 6. 後端 - 記憶管理 API

- [x] 6.1 在 `backend/src/routes/ai.ts` 新增 `GET /api/v1/ai/memory`：需 JWT 認證；呼叫 `getUserMemories(userId)`；返回 `{ success: true, data: [...] }`
- [x] 6.2 新增 `DELETE /api/v1/ai/memory/:id`：需 JWT 認證；呼叫 `deleteMemory(userId, id)`；返回 204；記憶不存在或不屬於該用戶時返回 404

## 7. 前端 - 記憶管理頁面

- [x] 7.1 建立 `apps/web/src/app/profile/ai-memory/page.tsx`，需登入保護（未登入重導至 `/login`）
- [x] 7.2 使用 TanStack Query 呼叫 `GET /api/v1/ai/memory` 取得記憶清單
- [x] 7.3 渲染記憶列表：每筆顯示 `memory_type` 標籤（preference/behavior/fact）、`content` 文字、`updated_at` 相對時間
- [x] 7.4 實作刪除功能：點擊刪除按鈕後 confirm dialog，確認後呼叫 `DELETE /api/v1/ai/memory/:id`，成功後 invalidate 查詢
- [x] 7.5 空狀態：無記憶時顯示說明文字（「AI 會在你提問後自動學習你的偏好，目前尚無記憶」）
- [x] 7.6 在 `/profile` 頁面的 nav 加入「AI 記憶」連結入口

## 8. 驗證

- [x] 8.1 本地測試：已登入用戶提問後確認 `user_ai_memory` 有新增記憶（等待 waitUntil 完成）
- [x] 8.2 本地測試：再次提問時確認 system prompt 包含用戶記憶摘要，回答有個人化內容
- [x] 8.3 本地測試：有完攀紀錄的用戶提問確認 ascent context 注入
- [x] 8.4 本地測試：GET/DELETE memory API 正確運作，刪除他人記憶返回 404
- [x] 8.5 執行 `pnpm typecheck` 確認型別無誤
