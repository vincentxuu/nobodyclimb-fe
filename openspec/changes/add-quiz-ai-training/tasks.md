## 1. D1 Migration

- [ ] 1.1 建立 `backend/migrations/XXXX_ai_training.sql`（migration 編號依當時順序），包含：
  - `CREATE TABLE ai_training_plans`（id TEXT PK, user_id TEXT NOT NULL, personality_type TEXT NOT NULL, week_number INTEGER NOT NULL, difficulty_level INTEGER NOT NULL DEFAULT 2, plan_content TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'ai', model_id TEXT, prompt_tokens INTEGER, completion_tokens INTEGER, generated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, personality_type, week_number)）
  - `CREATE INDEX idx_ai_plan_user ON ai_training_plans(user_id)`
  - `CREATE INDEX idx_ai_plan_type ON ai_training_plans(personality_type)`
  - `CREATE TABLE ai_training_feedback`（id TEXT PK, user_id TEXT NOT NULL, plan_id TEXT NOT NULL REFERENCES ai_training_plans(id), rating TEXT NOT NULL, comment TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))）
  - `CREATE INDEX idx_ai_feedback_user ON ai_training_feedback(user_id)`
  - `CREATE INDEX idx_ai_feedback_plan ON ai_training_feedback(plan_id)`
- [ ] 1.2 在 preview 環境執行 migration 驗證（`pnpm db:migrate` 或 `wrangler d1 execute --remote --env preview`）

## 2. AI 訓練生成服務（backend/src/services/ai-training.ts）

- [ ] 2.1 建立 `backend/src/services/ai-training.ts`，定義 `AITrainingService` class
- [ ] 2.2 實作 `getAscentSummary(userId, env)` 方法：查詢用戶攀登紀錄統計（筆數、最高難度、偏好路線類型、近 30 天活躍度）
- [ ] 2.3 實作 `getTrainingCompletion(userId, type, env)` 方法：查詢用戶訓練進度完成率（已完成天數 / 總天數）
- [ ] 2.4 實作 `getLatestFeedback(userId, type, env)` 方法：查詢用戶最近一次回饋的 rating
- [ ] 2.5 實作 `calculateDifficultyLevel(ascentSummary, completionRate, latestFeedback, currentLevel)` 純函式：
  - 初始推算：根據最高完攀難度對應 level 1~5
  - 調整規則：完成率 100% + 回饋 too_easy → +1；完成率 < 50% 或回饋 too_hard → -1
  - 邊界：clamp(1, 5)
- [ ] 2.6 實作 `buildPrompt(personalityType, ascentSummary, completionRate, feedbackRating, difficultyLevel)` 方法：組合結構化 prompt
  - System prompt：攀岩訓練教練角色設定
  - 用戶資料區：性格類型名稱與描述、攀登紀錄摘要、訓練進度、回饋
  - 輸出格式指示：要求 JSON，結構為 `{ title, description, duration, exercises: [{ name, sets, reps, notes }] }` x 3 天
  - 難度等級指示：level 1~5 對應的強度描述
- [ ] 2.7 實作 `generatePlan(userId, personalityType, weekNumber, force, env)` 主方法：
  - 檢查快取：查 `ai_training_plans` WHERE user_id, personality_type, week_number；非 force 且有記錄則回傳
  - 檢查攀登紀錄筆數，< 5 則 fallback
  - 收集用戶資料：ascentSummary + completionRate + latestFeedback
  - 計算 difficultyLevel
  - 組合 prompt 並呼叫 `env.AI.run('@cf/google/gemma-3-12b-it', { messages, response_format: { type: 'json' } })`
  - 解析回傳 JSON，用 Zod schema 驗證
  - 驗證通過：INSERT/REPLACE ai_training_plans，回傳 plan + source: "ai"
  - 驗證失敗：fallback 至靜態模板，source: "template"
  - AI 呼叫失敗：catch error，fallback，記錄 console.error
- [ ] 2.8 實作 `checkForceRateLimit(userId, env)` 方法：查詢當日 force 生成次數，>= 3 則拋出 429 錯誤

## 3. Zod Schema 驗證

- [ ] 3.1 在 `backend/src/services/ai-training.ts` 或獨立檔案中定義 AI 回傳驗證 schema：
  - `AIExerciseSchema`：`{ name: string, sets: number, reps: string, notes?: string }`
  - `AIDayPlanSchema`：`{ title: string, description: string, duration: string, exercises: AIExerciseSchema[] }`
  - `AIWeekPlanSchema`：`AIDayPlanSchema[]`（長度 3）
- [ ] 3.2 定義 API request schema：
  - `GenerateRequestSchema`：`{ personality_type: PersonalityTypeCode, week_number: 1~4, force?: boolean }`
  - `FeedbackRequestSchema`：`{ plan_id: string, rating: 'too_easy' | 'just_right' | 'too_hard', comment?: string }`

## 4. AI 訓練 API 端點（backend/src/routes/training.ts）

- [ ] 4.1 在既有 `backend/src/routes/training.ts` 新增 `POST /api/v1/training/ai/generate` 端點：
  - Auth: Required
  - Zod 驗證 request body（GenerateRequestSchema）
  - 呼叫 `AITrainingService.generatePlan()`
  - 回傳 `{ success: true, data: { plan, source, difficulty_level } }`
  - hono-openapi route decorator
- [ ] 4.2 新增 `GET /api/v1/training/ai/plan` 端點：
  - Auth: Required
  - Query param: `type`（選填，PersonalityTypeCode）
  - 查詢 ai_training_plans WHERE user_id = ? ORDER BY generated_at DESC
  - 若指定 type 則加 WHERE personality_type = ?
  - 回傳 `{ success: true, data: { plan, source, difficulty_level, generated_at } | null }`
  - hono-openapi route decorator
- [ ] 4.3 新增 `POST /api/v1/training/ai/feedback` 端點：
  - Auth: Required
  - Zod 驗證 request body（FeedbackRequestSchema）
  - 檢查 plan_id 存在且屬於該用戶，否則 404
  - INSERT ai_training_feedback
  - 回傳 200 `{ success: true }`
  - hono-openapi route decorator
- [ ] 4.4 修改既有 `GET /api/v1/training/plan/:type` 端點：
  - 加入 optionalAuthMiddleware
  - 若已登入，查詢該用戶是否有對應型態的 ai_training_plans 記錄
  - 有則在回傳中加入 `ai_available: true`

## 5. Workers AI Binding 確認

- [ ] 5.1 確認 `backend/wrangler.toml` 已配置 `[ai]` binding（若尚未有，新增 `ai = { binding = "AI" }` 或 `[ai]` 區塊）
- [ ] 5.2 確認 `backend/src/index.ts` 的 Env type 包含 `AI: Ai`（Cloudflare Workers AI binding 型別）

## 6. 整合驗證

- [ ] 6.1 端對端流程測試：有足夠攀登紀錄的用戶 → POST /ai/generate → 取得 AI 生成計畫 → source: "ai"
- [ ] 6.2 Fallback 流程測試：攀登紀錄 < 5 筆 → POST /ai/generate → 取得靜態模板 → source: "template"
- [ ] 6.3 快取測試：同一週第二次 POST /ai/generate（force: false）→ 回傳快取結果，不呼叫 AI
- [ ] 6.4 強制重新生成測試：force: true → 重新呼叫 AI → 更新快取
- [ ] 6.5 速率限制測試：同一天 force: true 第 4 次 → 429
- [ ] 6.6 回饋流程測試：POST /ai/feedback → 建立記錄 → 下次生成時 difficulty 調整正確
- [ ] 6.7 難度自適應測試：完成率 100% + too_easy → level +1；完成率 < 50% + too_hard → level -1
- [ ] 6.8 OpenAPI 文件驗證：所有新端點在 `/api/v1/docs` 正確顯示
