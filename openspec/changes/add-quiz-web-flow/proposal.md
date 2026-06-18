# Change: Web 攀岩人格測驗流程

## Why

NobodyClimb 需要一個零登入、高分享性的病毒式入口來獲取新用戶。攀岩人格測驗讓訪客在 3-5 分鐘內完成 24 題測驗、看到個人化結果、生成分享圖卡傳到社群，並透過「解鎖訓練計畫」CTA 導流至主站註冊。這是整個 Quiz 系統的 Web 前端實作，依賴 `quiz-personality-model`（計分引擎與題庫）和 `quiz-visual-identity`（Lottie/SVG 視覺資產）兩個 capability。

## What Changes

- 新增 `/quiz` Landing Page（SSG）：Hero 區塊、8 型態圖示預覽、「開始測驗」CTA
- 新增 `/quiz/test` 測驗頁（CSR）：24 題逐題作答、5 級 Likert、進度條、上一題、Zustand store + sessionStorage 備份、選答後自動進入下一題
- 新增 `/quiz/result/[type]` 結果頁（SSG + client hydration）：Lottie 動畫 + 雷達圖 + 型態描述 + Flow/Clutch 狀態 + 優勢/盲點 + 訓練預覽（W1 清楚 + W2-4 模糊 + 登入 CTA）+ 分享按鈕 + 重測按鈕 + 加入 CTA
- 新增 `/quiz/collection` 總覽頁（SSG）：8 型態卡片總覽
- 新增 Quiz 專用 layout：不含主站 nav/footer，僅 NobodyClimb logo
- 新增 Zustand quiz store：管理 24 題答案、進度、sessionStorage 同步
- 新增 Canvas API 分享卡生成：3 種尺寸（1080x1080、1080x1920、1200x628）
- 新增 ShareModal 元件：Web Share API（手機）/ 下載選項（桌面）
- 新增 8 個結果頁的 OG meta tag 和預生成靜態 OG 圖片
- 新增 URL `?s` 參數：base64 編碼 3 軸百分比 + 指數，client-side 解碼繪製個人化雷達圖

## Capabilities

### New Capabilities

- `quiz-web-flow`：Web 測驗流程 — Landing page、測驗頁（Zustand 狀態管理）、結果頁（SSG + client hydration）、Collection 總覽頁。4 個新路由、Quiz 專用 layout、12+ 元件
- `quiz-share-card`：分享卡系統 — Canvas API 動態生成 PNG（3 尺寸）、Web Share API 整合、OG meta tag、8 張預生成靜態 OG 圖片

### Dependencies

- `quiz-personality-model`（add-quiz-personality-model）：計分引擎、題庫定義、型態定義、配色常數
- `quiz-visual-identity`（add-quiz-visual-identity）：Lottie 動畫檔、SVG 靜態圖示

## Impact

- **Web Frontend** (`apps/web/`):
  - 新增 `src/app/[locale]/quiz/` 路由群組（4 頁面 + layout）
  - 新增 `src/components/quiz/` 元件群（12+ 元件）
  - 新增 `src/store/quizStore.ts`（Zustand store）
  - 新增 `public/quiz/og/` 目錄（8 張預生成 OG 圖 + 1 張 default）
- **Dependencies**: 可能新增 `lottie-react`（Web Lottie 播放器）
- **不影響**: Backend、Mobile、packages（本 change 僅消費已存在的共用套件）
