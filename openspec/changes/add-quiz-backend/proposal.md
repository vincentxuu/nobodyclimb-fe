## Why

攀岩性格測驗的前端流程與共用模型（`add-quiz-personality-model`、`add-quiz-web-flow`）已規劃完成，但測驗結果目前僅存在瀏覽器端，無法持久化、無法跨裝置同步、無法產生全站統計或排名。需要後端 API 層來儲存測驗結果、提供統計與排名、管理訓練進度，並將測驗完成納入 Climber Rank 積分體系，激勵用戶完成測驗與訓練計畫。

## What Changes

- 新增 D1 migration：`quiz_results` 資料表、`training_progress` 資料表、`users` 表新增 `personality_type` 與 `personality_taken_at` 欄位
- 新增 `backend/src/routes/quiz.ts`：測驗結果儲存（POST）、個人結果查詢（GET /me）、全站統計（GET /stats，KV cache 1hr）
- 新增 `backend/src/routes/training.ts`：訓練計畫取得（GET /plan/:type）、訓練進度記錄（POST /progress）、個人進度查詢（GET /progress/me）
- 新增排名端點：`GET /api/v1/quiz/ranking/:type`，同型態用戶依攀登表現排序
- 修改 Climber Rank 積分計算：測驗完成 +5 分、訓練計畫完成 +15 分（每型態一次）

## Capabilities

### New Capabilities

- `quiz-db-schema`：D1 資料表結構——quiz_results（測驗結果）、training_progress（訓練進度）、users 表新增性格欄位，含索引
- `quiz-results-api`：測驗結果 CRUD API——POST 儲存結果（Optional auth）、GET /me 個人歷史（Required auth）、GET /stats 全站統計（KV cache）
- `quiz-ranking-api`：同型態用戶排名 API——GET /ranking/:type，依攀登表現排序
- `training-api`：訓練計畫與進度 API——GET /plan/:type 取得計畫內容、POST /progress 記錄完成、GET /progress/me 查詢進度

### Modified Capabilities

- `climber-rank-quiz`：Climber Rank 積分新增測驗完成（+5）與訓練完成（+15/型態）兩項來源，修改 `calculateUserScore` 函式

## Impact

**資料庫**：

- 新增 migration `0069_quiz_system.sql`：`quiz_results` 表、`training_progress` 表、`users` 欄位擴充、索引

**後端**：

- `backend/src/routes/quiz.ts`：新增測驗結果與統計端點
- `backend/src/routes/training.ts`：新增訓練計畫與進度端點
- `backend/src/services/rank.ts`：修改積分計算，新增 quiz 與 training 積分來源
- `backend/src/index.ts`：註冊新路由

**依賴**：

- 依賴 `add-quiz-personality-model`（`@nobodyclimb/constants` 的計分引擎與訓練計畫定義、`@nobodyclimb/types` 的型別）
