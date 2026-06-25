## Why

目前 `add-quiz-training-ui` 的訓練計畫是靜態模板——8 種人格類型各對應固定的 4 週 × 3 天內容。但每個攀岩者的實際能力、訓練進度、攀登紀錄差異極大，靜態計畫無法針對個人弱點調整強度與內容。

然而，攀岩訓練不是一個統一的知識體系——六大學派（Horst、Anderson、MacLeod、Bechtel、Climbing Bible、日本學派）之間存在真實的方法論分歧。用 LLM 從零生成訓練計畫有品質不穩定和安全風險（可能生成導致受傷的計畫）。

因此本 change 採用「**模板 + AI 微調**」架構：以人工審核過的學派模板作為安全基線，AI 只在安全範圍內做個人化調整（組數/強度/替換練習/個人化鼓勵），不動核心訓練結構。

## What Changes

- 新增 `backend/src/services/ai-training.ts`：AI 訓練微調服務，基於模板 + 用戶數據做個人化調整
- 新增 `POST /api/v1/training/ai/generate` 端點：產生微調版週訓練計畫
- 新增 `GET /api/v1/training/ai/plan` 端點：取得最新 AI 微調的計畫（含快取）
- 新增 `POST /api/v1/training/ai/feedback` 端點：用戶回饋（太難/太簡單/剛好），影響下次微調
- 新增 D1 migration：`ai_training_plans`（儲存微調結果）、`ai_training_feedback`
- AI 可調整：組數和強度、替換等價練習（根據可用設備）、難度描述（配合用戶等級）、個人化鼓勵文字、根據上週表現調整本週重點
- AI 不可調整：訓練階段順序（週期化結構）、核心練習類型（安全基線）、休息日安排（避免過度訓練）
- Fallback：攀登紀錄 < 5 筆或 AI 不可用時，直接回傳原始模板
- Prompt 結構：將模板計畫 + 用戶數據 + 可調範圍 + 不可動範圍作為 context，要求 AI 產出微調版

## Capabilities

### New Capabilities

- `quiz-ai-training`：AI 訓練計畫微調——基於人格型態對應的學派模板（`packages/constants/src/quiz/training.ts` + `training-programs.ts`），透過 Workers AI 根據用戶攀登紀錄、訓練完成率、回饋做個人化調整。含 fallback 至原始模板、難度自適應、可調/不可調邊界定義。

## Impact

**資料庫**：新增 `ai_training_plans` 表、`ai_training_feedback` 表

**後端**：`backend/src/services/ai-training.ts`（新增）、`backend/src/routes/training.ts`（新增 3 端點）

**依賴**：
- `add-quiz-backend`（training_progress、quiz_results）
- `add-quiz-personality-model`（模板計畫 + 訓練資料庫 `training-programs.ts`）
- Cloudflare Workers AI binding（`@cf/google/gemma-3-12b-it`）
