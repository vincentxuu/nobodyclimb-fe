# Change: 訓練計畫頁面 UI

## Why

測驗結果頁的訓練預覽區塊（Week 1 可見、Week 2-4 模糊）已在 `add-quiz-web-flow` 中實作，但用戶登入後需要一個完整的訓練計畫頁面來執行 4 週 x 3 天的訓練。本變更提供每日勾選、進度視覺化、畢業徽章等互動體驗，將「解鎖訓練計畫」CTA 的承諾兌現為實際功能，同時透過 Climber Rank 積分激勵用戶完成訓練。

## What Changes

- 新增 `/quiz/training/[type]` 訓練計畫頁面（需登入），顯示完整 4 週 x 3 天計畫內容
- 實作每日勾選完成 UI，支援記錄訓練筆記
- 實作進度追蹤視覺化（週進度條、整體完成率、天數統計）
- 實作畢業徽章：完成全部 12 天後顯示畢業慶祝動畫與徽章
- 串接後端 API（`GET /training/plan/:type`、`POST /training/progress`、`GET /training/progress/me`）
- 結果頁訓練預覽區塊的「解鎖」CTA 連結至訓練計畫頁

## Capabilities

### New Capabilities

- `quiz-training-page`：訓練計畫完整頁面 — 4 週分頁展示、每日勾選與筆記、進度視覺化、畢業徽章。路由 `/quiz/training/[type]`，需登入保護，使用 TanStack Query 管理 API 狀態。

### Modified Capabilities

- `quiz-web-flow`（來自 add-quiz-web-flow）：結果頁 `ResultTraining` 區塊的「登入解鎖完整訓練計畫」CTA 連結改為指向 `/quiz/training/[type]`；已登入用戶直接顯示「前往訓練計畫」按鈕。

## Impact

- **Web Frontend** (`apps/web/`):
  - 新增 `src/app/[locale]/quiz/training/[type]/page.tsx`（訓練計畫頁面）
  - 新增 `src/components/quiz/training/` 元件群（5-7 個元件）
  - 新增 `src/lib/api/training.ts`（API 呼叫函式）
  - 修改 `src/components/quiz/ResultTraining.tsx`（CTA 連結更新）
- **Dependencies**：
  - 依賴 `add-quiz-web-flow`（Quiz layout、路由結構、結果頁元件）
  - 依賴 `add-quiz-backend`（training API 端點、training_progress 資料表）
  - 消費 `@nobodyclimb/constants` 的 `TRAINING_PLANS` 與 `getTrainingPlan()`
  - 消費 `@nobodyclimb/types` 的 `TrainingPlan`、`TrainingWeek`、`TrainingDay` 型別
