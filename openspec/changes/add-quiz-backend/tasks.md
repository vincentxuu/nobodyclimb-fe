## 1. D1 Migration

- [x] 1.1 建立 `backend/migrations/0069_quiz_system.sql`，包含：
  - `CREATE TABLE quiz_results`（id, user_id, personality_type, power_pct, goal_pct, bold_pct, grit_index, flow_index, answers, version, created_at）
  - `CREATE INDEX` on quiz_results(user_id), quiz_results(personality_type), quiz_results(created_at)
  - `ALTER TABLE users ADD COLUMN personality_type TEXT`
  - `ALTER TABLE users ADD COLUMN personality_taken_at TEXT`
  - `CREATE TABLE training_progress`（id, user_id, personality_type, week, day, completed, notes, created_at）含 `UNIQUE(user_id, personality_type, week, day)`
  - `CREATE INDEX` on training_progress(user_id, personality_type)
- [ ] 1.2 在 preview 環境執行 migration 驗證（`pnpm db:migrate` 或 `wrangler d1 execute --remote --env preview`）

## 2. Quiz Results API（backend/src/routes/quiz.ts）

- [x] 2.1 建立 `backend/src/routes/quiz.ts`，定義 Hono router 並匯出
- [x] 2.2 實作 `POST /api/v1/quiz/results`：
  - Zod schema 驗證 request body（answers 長度 24、值 1~5、personality_type 為合法代碼、pct 為 0~100）
  - Optional auth middleware（已登入綁 user_id，未登入設 null）
  - 以 `crypto.randomUUID()` 產生 id
  - INSERT quiz_results
  - 若已登入：UPDATE users SET personality_type, personality_taken_at
  - 回傳 201 `{ success: true, data: { id } }`
- [x] 2.3 實作 `GET /api/v1/quiz/results/me`：
  - Required auth middleware
  - 查詢 quiz_results WHERE user_id = ? ORDER BY created_at DESC
  - 回傳 `{ latest, history }`
- [x] 2.4 實作 `GET /api/v1/quiz/stats`：
  - 先查 KV cache（key: `quiz:stats:v1`）
  - Cache miss 時：COUNT(*) + GROUP BY personality_type + COUNT recent 24h
  - 寫入 KV（TTL 3600 秒）
  - 回傳 `{ totalTests, distribution, recentTests }`
- [x] 2.5 為所有端點加上 `hono-openapi` route decorator（summary、description、request/response schema）

## 3. Quiz Ranking API

- [x] 3.1 實作 `GET /api/v1/quiz/ranking/:type`：
  - 驗證 `:type` 為合法 PersonalityTypeCode，否則 400
  - Optional auth middleware
  - JOIN users + user_route_ascents WHERE users.personality_type = :type
  - GROUP BY user_id，計算 ascent_count 與 highest_grade
  - ORDER BY ascent_count DESC, highest_grade DESC，LIMIT 50
  - 已登入用戶額外計算 my_rank
  - 回傳 `{ ranking, total, my_rank? }`
- [x] 3.2 加上 OpenAPI decorator

## 4. Training API（backend/src/routes/training.ts）

- [x] 4.1 建立 `backend/src/routes/training.ts`，定義 Hono router 並匯出
- [x] 4.2 實作 `GET /api/v1/training/plan/:type`：
  - 驗證 `:type` 為合法代碼
  - 從 `@nobodyclimb/constants` import 訓練計畫定義
  - 回傳對應型態的 TrainingPlan
- [x] 4.3 實作 `POST /api/v1/training/progress`：
  - Required auth middleware
  - Zod schema 驗證 body（personality_type、week 1~4、day 1~3、completed、notes?）
  - INSERT ... ON CONFLICT(user_id, personality_type, week, day) DO UPDATE SET completed, notes
  - 回傳 200
- [x] 4.4 實作 `GET /api/v1/training/progress/me`：
  - Required auth middleware
  - 支援 `?type=PGB` query parameter 篩選
  - 查詢 training_progress WHERE user_id = ?（加 type 篩選如有）
  - 回傳進度列表
- [x] 4.5 為所有端點加上 OpenAPI decorator

## 5. Climber Rank 積分修改

- [x] 5.1 修改 `backend/src/services/rank.ts` 的 `calculateUserScore` 函式：
  - 新增查詢：`SELECT COUNT(*) FROM quiz_results WHERE user_id = ?`（有記錄 → +5 分）
  - 新增查詢：`SELECT COUNT(DISTINCT personality_type) FROM training_progress WHERE ... HAVING COUNT(*) = 12`（有完成型態 → +15 分，僅計一個）
- [x] 5.2 擴充 `RankScoreBreakdown` 型別，新增 `quiz_completed` 與 `training_completed` 欄位
- [x] 5.3 更新 breakdown 回傳值，包含新欄位

## 6. 路由註冊

- [x] 6.1 修改 `backend/src/index.ts`：import 並註冊 quiz 和 training 路由

## 7. 驗證

- [x] 7.1 本地啟動 backend（`pnpm dev`），測試所有端點回應格式正確（POST results 200、GET stats 200、GET training/plan 200、GET ranking 200、GET results/me 401、POST progress 401、ranking/XXX 400）
- [x] 7.2 驗證 OpenAPI JSON（`/api/v1/openapi.json`）包含所有 8 個新端點（quiz/results、results/me、results/user/{userId}、stats、ranking/{type}、training/plan/{type}、progress、progress/me）
- [ ] 7.3 驗證 Scalar UI（`/api/v1/docs`）可正確顯示新端點文件（⚠️ 需瀏覽器開啟）
- [x] 7.4 執行 `pnpm typecheck` 確認無型別錯誤（root turbo typecheck 通過）
- [x] 7.5 執行 `pnpm lint` 確認無 lint 錯誤（biome check 通過，僅 .omc 暫存檔 format 差異）
- [x] 7.6 確認 quiz + training 路由已在 index.ts 註冊（v1.route '/quiz' + '/training'）
- [x] 7.7 修復 CACHE optional chaining（本地無 KV binding 時不 crash）
