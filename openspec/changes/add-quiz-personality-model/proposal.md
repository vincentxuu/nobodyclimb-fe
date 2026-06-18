## Why

攀岩性格測驗需要一套共用的性格模型作為基礎：3 軸 8 型的定義、24 題題庫、計分引擎、色彩常數、訓練計畫內容。這些資料結構會被 Web 測驗流程、Mobile App、後端 API、AI 推薦系統等多個消費端使用。將模型定義集中在 `packages/constants` 和 `packages/types`，確保所有端共享同一套 single source of truth，避免定義分散導致不一致。

## What Changes

- 在 `packages/types/src/quiz.ts` 新增完整型別定義：軸向、方向、人格類型代碼、題目、作答結果、計分結果、訓練計畫等 TypeScript interfaces/types
- 在 `packages/constants/src/quiz/` 新增子模組：
  - `types.ts`：8 種人格類型定義（名稱、代碼、色彩、描述、關鍵詞）
  - `questions.ts`：24 題題庫（每軸 8 題，各方向 4 題），含 5 點 Likert 量表權重
  - `scoring.ts`：純函式計分引擎（軸向分數、類型判定、Grit/Flow 指標）+ 單元測試
  - `colors.ts`：8 型色彩常數與輔助函式
  - `training.ts`：8 型 × 4 週 × 3 天的訓練計畫內容定義
  - `index.ts`：統一 re-export

## Capabilities

### New Capabilities

- `quiz-personality-model`：攀岩性格測驗的核心模型——3 軸 8 型定義、24 題題庫、5 點 Likert 計分、純函式計分引擎、Grit/Flow 附加指標、色彩常數、4 週訓練計畫內容。所有定義位於 `packages/constants` 和 `packages/types`，不涉及 API 端點或 UI。

### Modified Capabilities

（無——此變更僅新增共用套件，不修改任何現有功能的行為規格）

## Impact

**共享套件**：

- `packages/types/src/quiz.ts`：新增所有測驗相關型別（QuizAxis, QuizDirection, PersonalityTypeCode, QuizQuestion, QuizAnswer, QuizResult, TrainingDay, TrainingWeek, TrainingPlan 等）
- `packages/types/src/index.ts`：新增 `export * from './quiz'`
- `packages/constants/src/quiz/`：新增整個子模組（types, questions, scoring, colors, training, index）
- `packages/constants/src/index.ts`：新增 `export * from './quiz'`

**測試**：

- `packages/constants/src/quiz/scoring.test.ts`：計分引擎單元測試（軸向分數計算、類型判定、邊界情境、Grit/Flow 指標）

**不影響**：

- 不影響 Web / Mobile / Backend 任何現有程式碼
- 不新增資料表或 API 端點
- 不引入外部依賴
