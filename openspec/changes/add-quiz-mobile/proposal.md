## Why

Web 版攀岩人格測驗（`add-quiz-web-flow`）已規劃完成，但 Mobile App 用戶佔社群分享的主力——手機用戶更傾向直接透過原生 Share Sheet 分享圖片至 IG Story / LINE。React Native 原生體驗（流暢手勢切換、Haptic feedback、Lottie 動畫、原生分享面板）遠優於手機瀏覽器，且 `react-native-view-shot` 能直接截圖結果頁生成分享圖片，省去 Canvas API 的複雜度。Mobile 版測驗是病毒式傳播的關鍵通路。

## What Changes

- 新增 `apps/mobile/app/quiz/` 路由群組：Landing（`index.tsx`）、測驗（`test.tsx`）、結果（`result/[type].tsx`）、專用 Layout（`_layout.tsx`）
- 新增 `apps/mobile/src/components/quiz/` 元件群（8+ 元件）：QuizLanding、QuizQuestion、QuizProgressBar、QuizRadarChart、QuizResultHero、QuizResultCard、QuizShareSheet、QuizProfileBadge
- 新增 Zustand quiz store（`apps/mobile/src/store/quizStore.ts`）：24 題答案管理、MMKV 持久化
- 結果頁整合 `lottie-react-native` 播放型態動畫 + SVG 雷達圖
- 分享功能：`react-native-view-shot` 截圖結果區塊 → `expo-sharing` / `react-native-share` 觸發原生 Share Sheet
- Profile 頁面新增人格徽章：SVG 圖示 + 型態代碼，未測驗者顯示「測測看」CTA

## Capabilities

### New Capabilities

- `quiz-mobile-flow`：Mobile 測驗流程——Landing page、24 題逐題作答（Reanimated 切換動畫、Haptic feedback）、結果頁（Lottie + 雷達圖 + 型態描述）。3 個新路由 + 專用 Layout + Zustand store + 8 元件
- `quiz-mobile-share`：Mobile 分享功能——`react-native-view-shot` 截圖結果卡 → 原生 Share Sheet 分享至 IG Story / LINE / 任意 App
- `quiz-mobile-profile`：Profile 人格徽章——已測驗用戶顯示 SVG 圖示 + 型態代碼，未測驗用戶顯示 CTA 按鈕導向測驗

### Modified Capabilities

（無——不修改現有功能）

## Impact

**Mobile App**（`apps/mobile/`）：

- `app/quiz/`：新增路由群組（3 頁面 + layout）
- `src/components/quiz/`：新增元件群（8+ 元件）
- `src/store/quizStore.ts`：新增 Zustand store
- `app/(tabs)/profile.tsx`：修改，新增人格徽章區塊

**新增依賴**：

- `lottie-react-native`：Lottie 動畫播放
- `react-native-view-shot`：截圖生成分享圖
- `react-native-share` 或 `expo-sharing`：原生分享面板

**依賴其他 Change**：

- `add-quiz-personality-model`：`@nobodyclimb/constants` 計分引擎、題庫、型態定義
- `add-quiz-visual-identity`：Lottie JSON 動畫檔、SVG 圖示
- `add-quiz-backend`：`POST /api/v1/quiz/results` 儲存結果、`GET /api/v1/quiz/results/me` 查詢歷史
