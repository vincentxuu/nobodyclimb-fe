## 1. TypeScript 型別定義（packages/types）

- [x] 1.1 新增 `packages/types/src/quiz.ts`，定義 `QuizAxis` 聯合型別（`'body' | 'motive' | 'mind'`）
- [x] 1.2 定義 `QuizDirection` 型別（`'left' | 'right'`）
- [x] 1.3 定義 `PersonalityTypeCode` 聯合型別（`'PGB' | 'PGS' | 'PFB' | 'PFS' | 'TGB' | 'TGS' | 'TFB' | 'TFS'`）
- [x] 1.4 定義 `QuizQuestion` interface（id: string, axis: QuizAxis, direction: QuizDirection, textZh: string, order: number）
- [x] 1.5 定義 `QuizAnswer` interface（questionId: string, value: 1 | 2 | 3 | 4 | 5）
- [x] 1.6 定義 `AxisScore` interface（axis: QuizAxis, score: number, direction: string）
- [x] 1.7 定義 `QuizResult` interface（typeCode: PersonalityTypeCode, axisScores: AxisScore[], gritIndex: number, flowIndex: number）
- [x] 1.8 定義 `PersonalityType` interface（code: PersonalityTypeCode, nameZh: string, nameEn: string, color: string, description: string, keywords: string[]）
- [x] 1.9 定義訓練計畫相關型別：`TrainingExercise`（name, description）、`TrainingDay`（dayNumber, title, description, duration, exercises）、`TrainingWeek`（weekNumber, theme, days）、`TrainingPlan`（typeCode, weeks）
- [x] 1.10 在 `packages/types/src/index.ts` 新增 `export * from './quiz'`

## 2. 軸向與類型定義（packages/constants）

- [x] 2.1 建立 `packages/constants/src/quiz/` 目錄
- [x] 2.2 新增 `packages/constants/src/quiz/types.ts`，定義 3 個軸向常數物件（QUIZ_AXES），每軸含 id、nameZh、nameEn、left、right
- [x] 2.3 在 `types.ts` 定義 8 個人格類型常數物件（PERSONALITY_TYPES），每型含 code、nameZh、nameEn、color、description、keywords
- [x] 2.4 匯出 `getPersonalityType(code)` 輔助函式，以代碼查找類型定義

## 3. 色彩常數（packages/constants）

- [x] 3.1 新增 `packages/constants/src/quiz/colors.ts`，定義 `PERSONALITY_COLORS` 常數（Record<PersonalityTypeCode, string>），8 型色彩 HEX 值
- [x] 3.2 匯出 `getPersonalityColor(code)` 輔助函式，以代碼查找色彩

## 4. 題庫定義（packages/constants）

- [x] 4.1 新增 `packages/constants/src/quiz/questions.ts`，定義 `QUIZ_QUESTIONS` 常數陣列（24 題）
- [x] 4.2 定義 Body 軸 8 題：左方向（Power）4 題 + 右方向（Technique）4 題，設定 id、axis、direction、textZh、order
- [x] 4.3 定義 Motive 軸 8 題：左方向（Goal）4 題 + 右方向（Free）4 題
- [x] 4.4 定義 Mind 軸 8 題：左方向（Bold）4 題 + 右方向（Steady）4 題
- [x] 4.5 匯出 `getQuestionsByAxis(axis)` 輔助函式，篩選特定軸向的題目

## 5. 計分引擎（packages/constants）

- [x] 5.1 新增 `packages/constants/src/quiz/scoring.ts`，實作 `calculateAxisScore(answers, axis, questions)` 內部函式：處理分數反轉並加總
- [x] 5.2 實作 `determineDirection(axisScore)` 內部函式：> 24 取左方向、< 24 取右方向、= 24 取左方向
- [x] 5.3 實作主函式 `calculateQuizResult(answers: QuizAnswer[]): QuizResult`：驗證答案數量、計算 3 軸分數、判定方向、組合類型代碼、計算 Grit/Flow 指標
- [x] 5.4 實作 Grit 指標計算：`(motiveAxisScore - 8) / 32 * 100`
- [x] 5.5 實作 Flow 指標計算：`(40 - motiveAxisScore) / 32 * 100`
- [x] 5.6 答案數量不足 24 題時拋出含 "24" 的錯誤訊息

## 6. 訓練計畫內容（packages/constants）

- [x] 6.1 新增 `packages/constants/src/quiz/training.ts`，定義 `TRAINING_PLANS` 常數（Record<PersonalityTypeCode, TrainingPlan>）
- [x] 6.2 定義 PGB（碎岩者）訓練計畫：4 週 × 3 天，著重力量與爆發力訓練
- [x] 6.3 定義 PGS（鍛造者）訓練計畫：4 週 × 3 天，著重力量與耐力漸進
- [x] 6.4 定義 PFB（野火）訓練計畫：4 週 × 3 天，著重力量與多樣化嘗試
- [x] 6.5 定義 PFS（恆者）訓練計畫：4 週 × 3 天，著重力量與穩定基礎
- [x] 6.6 定義 TGB（狙擊手）訓練計畫：4 週 × 3 天，著重技巧與精準目標
- [x] 6.7 定義 TGS（解碼者）訓練計畫：4 週 × 3 天，著重技巧與系統分析
- [x] 6.8 定義 TFB（浪人）訓練計畫：4 週 × 3 天，著重技巧與探索多元路線
- [x] 6.9 定義 TFS（禪者）訓練計畫：4 週 × 3 天，著重技巧與身心平衡
- [x] 6.10 匯出 `getTrainingPlan(code)` 輔助函式，以類型代碼查找訓練計畫

## 7. 模組匯出

- [x] 7.1 新增 `packages/constants/src/quiz/index.ts`，統一 re-export types、colors、questions、scoring、training
- [x] 7.2 在 `packages/constants/src/index.ts` 新增 `export * from './quiz'`

## 8. 單元測試

- [x] 8.1 新增 `packages/constants/src/quiz/scoring.test.ts`（或 `__tests__/scoring.test.ts`），設定測試環境
- [x] 8.2 測試案例：全選 5 分 → 各軸 24 分 → 平手取左方向 → PGB
- [x] 8.3 測試案例：左方向題 1 分、右方向題 5 分 → 各軸 8 分 → 偏右 → TFS
- [x] 8.4 測試案例：左方向題 5 分、右方向題 1 分 → 各軸 40 分 → 偏左 → PGB
- [x] 8.5 測試案例：Body 軸偏 T、其餘偏 G/B → TGB
- [x] 8.6 測試案例：Grit 指標 = (36-8)/32*100 = 87.5（Motive 軸分數 36）
- [x] 8.7 測試案例：Flow 指標 = (40-12)/32*100 = 87.5（Motive 軸分數 12）
- [x] 8.8 測試案例：gritIndex + flowIndex = 100
- [x] 8.9 測試案例：傳入少於 24 題時拋出錯誤

## 9. 建置驗證

- [x] 9.1 執行 `pnpm build` 確認 `packages/constants` 和 `packages/types` 建置成功
- [x] 9.2 執行 `pnpm typecheck` 確認無型別錯誤
- [x] 9.3 執行計分引擎單元測試，確認全部通過
