## Why

目前 `add-quiz-training-ui` 與 `add-quiz-backend` 的訓練計畫是靜態模板——8 種人格類型各對應固定的 4 週 x 3 天內容。但每個攀岩者的實際能力、訓練進度、攀登紀錄差異極大，靜態計畫無法針對個人弱點調整強度與內容。透過 Workers AI（`@cf/google/gemma-3-12b-it`）分析用戶的攀登紀錄、性格類型、訓練完成率與回饋，動態產生個人化週訓練建議，讓訓練計畫從「一刀切」進化為「因人而異」，提升訓練效果與用戶黏著度。

## What Changes

- 新增 `backend/src/services/ai-training.ts`：AI 訓練生成服務，整合 Workers AI 呼叫
- 新增 `POST /api/v1/training/ai/generate` 端點：根據用戶資料生成個人化週訓練計畫
- 新增 `GET /api/v1/training/ai/plan` 端點：取得最新 AI 生成的訓練計畫（含快取）
- 新增 `POST /api/v1/training/ai/feedback` 端點：用戶對 AI 計畫的回饋（太難/太簡單/剛好），影響下次生成
- 新增 D1 migration：`ai_training_plans` 資料表（儲存 AI 生成結果）、`ai_training_feedback` 資料表
- 實作 fallback 機制：攀登紀錄 < 5 筆或 AI 不可用時，退回靜態模板計畫
- 實作難度自適應：根據完成率與回饋自動調整下週訓練強度

## Capabilities

### New Capabilities

- `quiz-ai-training`：AI 動態訓練計畫生成——分析用戶攀登紀錄、性格類型、訓練進度與回饋，透過 Workers AI 產生個人化週訓練建議。含 fallback 至靜態模板、難度自適應、生成結果快取。

### Modified Capabilities

- `training-api`：新增 AI 生成相關端點（`/ai/generate`、`/ai/plan`、`/ai/feedback`），與既有靜態計畫端點共存於 `backend/src/routes/training.ts`。

## Impact

**資料庫**：

- 新增 migration：`ai_training_plans` 表（id, user_id, personality_type, week_number, plan_content, difficulty_level, generated_at）、`ai_training_feedback` 表（id, user_id, plan_id, rating, comment, created_at）

**後端**：

- `backend/src/services/ai-training.ts`：新增 AI 訓練生成服務
- `backend/src/routes/training.ts`：新增 3 個 AI 相關端點
- `backend/src/index.ts`：無需額外註冊（training router 已存在）

**依賴**：

- 依賴 `add-quiz-backend`（training_progress 資料表、quiz_results 資料表、training router）
- 依賴 `add-quiz-training-ui`（訓練計畫頁面消費 AI 生成結果）
- 使用 Cloudflare Workers AI binding（`AI`）呼叫 `@cf/google/gemma-3-12b-it`
