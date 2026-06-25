## 1. D1 Migration

- [x] 1.1 建立 `backend/migrations/XXXX_ai_training.sql`，包含：
  - `CREATE TABLE ai_training_plans`（id, user_id, personality_type, week_number, difficulty_level DEFAULT 2, plan_content TEXT, source TEXT DEFAULT 'ai', model_id, prompt_tokens, completion_tokens, generated_at, UNIQUE(user_id, personality_type, week_number)）
  - `CREATE TABLE ai_training_feedback`（id, user_id, plan_id REFERENCES ai_training_plans, rating TEXT, comment, created_at）
  - 對應 indexes
- [ ] 1.2 preview 環境執行 migration 驗證

## 2. 人格 × 學派對照表

- [x] 2.1 在 `packages/constants/src/quiz/training.ts` 或新增檔案，為每個人格型態定義 `trainingSchool` 欄位：
  - PGB → MacLeod + Climbing Bible 技巧篇
  - PGS → Anderson 嚴格週期化
  - PFB → Bechtel 非線性週期化
  - PFS → Horst 工具箱 + 目標設定
  - TGB → Beastmaking + 力量補強
  - TGS → Climbing Bible + Strong Mind
  - TFB → 日本學派（チバトレ身體感覺）
  - TFS → Anderson（用結構打破舒適圈）
- [x] 2.2 為每型態定義 `antiStyleProtocolId`，對應 `ANTI_STYLE_PROTOCOLS` 中的 ID
- [x] 2.3 為每型態定義 `adjustableFields`（AI 可調的欄位列表）和 `fixedFields`（AI 不可動的欄位列表）

## 3. AI 訓練微調服務（backend/src/services/ai-training.ts）

- [x] 3.1 建立 `AITrainingService` class
- [x] 3.2 實作 `getAscentSummary(userId, env)`：查詢用戶攀登紀錄統計（筆數、最高難度、偏好類型、近 30 天活躍度）
- [x] 3.3 實作 `getTrainingCompletion(userId, type, env)`：查詢訓練進度完成率
- [x] 3.4 實作 `getLatestFeedback(userId, type, env)`：查詢最近回饋 rating
- [x] 3.5 實作 `calculateDifficultyLevel(ascentSummary, completionRate, feedback, currentLevel)` 純函式：
  - 初始：根據最高難度對應 level 1-5
  - 調整：完成率 100% + too_easy → +1；完成率 < 50% 或 too_hard → -1
  - clamp(1, 5)
- [x] 3.6 實作 `getBaseTemplate(typeCode, weekNumber)`：從 `@nobodyclimb/constants` 取得該型態該週的模板計畫
- [x] 3.7 實作 `getRelevantExercises(typeCode)`：從 `ANTI_STYLE_PROTOCOLS` + `EXERCISE_PROTOCOLS` 取得該型態對應的練習清單（含 sets/reps/rest 細節）
- [x] 3.8 實作 `buildPrompt(template, exercises, ascentSummary, completionRate, feedback, difficultyLevel)` — 組合微調 prompt：
  - System：「你是攀岩訓練調整助手。以下是基礎訓練計畫，根據用戶數據做微調，不要改變核心結構。」
  - 基礎計畫：原始模板內容（週主題 + 3 天詳細內容）
  - 可用練習庫：相關的 EXERCISE_PROTOCOLS（含具體 sets/reps/rest）
  - 用戶數據：等級、攀爬頻率、完成率、回饋
  - 可調範圍：「✓ 調整組數和強度 ✓ 替換等價練習 ✓ 調整難度描述 ✓ 加個人化鼓勵」
  - 不可調範圍：「✗ 不要改訓練階段順序 ✗ 不要改核心練習類型 ✗ 不要改休息日安排」
  - 輸出格式：JSON `{ days: [{ title, description, duration, exercises: [{ name, sets, reps, notes }] }] }`
- [x] 3.9 實作 `generatePlan(userId, typeCode, weekNumber, force, env)` 主方法：
  - 檢查快取（非 force 且有記錄 → 回傳）
  - 檢查攀登紀錄 < 5 → fallback 回模板
  - 收集用戶數據
  - getBaseTemplate + getRelevantExercises
  - buildPrompt
  - 呼叫 `env.AI.run('@cf/google/gemma-3-12b-it', { messages, response_format: { type: 'json' } })`
  - Zod 驗證回傳 JSON
  - 驗證通過 → INSERT/REPLACE ai_training_plans, source='ai'
  - 驗證失敗 → fallback 回模板, source='template'
  - AI 呼叫失敗 → fallback, console.error
- [x] 3.10 實作 `checkForceRateLimit(userId, env)`：每日 force 上限 3 次

## 4. Zod Schema

- [x] 4.1 定義 AI 回傳驗證 schema：AIDayPlanSchema（title, description, duration, exercises[]）、AIWeekPlanSchema（days[] 長度 3）
- [x] 4.2 定義 API request schema：GenerateRequestSchema、FeedbackRequestSchema

## 5. API 端點

- [x] 5.1 `POST /api/v1/training/ai/generate`（Auth Required）：Zod 驗證 → generatePlan() → 回傳 `{ plan, source, difficulty_level }`
- [x] 5.2 `GET /api/v1/training/ai/plan`（Auth Required）：查詢最新 AI 微調計畫
- [x] 5.3 `POST /api/v1/training/ai/feedback`（Auth Required）：驗證 plan_id 屬於該用戶 → INSERT feedback
- [x] 5.4 修改既有 `GET /api/v1/training/plan/:type`：已登入用戶有 AI 計畫時回傳中加入 `ai_available: true`
- [x] 5.5 所有端點加 hono-openapi route decorator

## 6. Workers AI Binding

- [x] 6.1 確認 `backend/wrangler.toml` 有 AI binding
- [x] 6.2 確認 Env type 包含 `AI: Ai`

## 7. 整合驗證

- [x] 7.1 端對端：有足夠紀錄 → generate → source='ai'，回傳內容基於模板但有個人化調整
- [x] 7.2 Fallback：紀錄 < 5 → source='template'，回傳原始模板
- [x] 7.3 快取：同一週第二次 generate (force=false) → 回傳快取
- [x] 7.4 強制重生成：force=true → 重新呼叫 AI
- [x] 7.5 速率限制：同天 force 第 4 次 → 429
- [x] 7.6 回饋影響：too_easy → 下次 difficulty +1
- [x] 7.7 AI 不可用 fallback：模擬 AI 錯誤 → 回傳模板
- [x] 7.8 驗證 AI 回傳的核心結構未被改動（訓練類型和順序與模板一致）
- [x] 7.9 OpenAPI 文件驗證
