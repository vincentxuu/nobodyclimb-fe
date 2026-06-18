## 1. Shared Packages — 人格模型核心

- [ ] 1.1 建立 `packages/types/src/quiz.ts`：定義 QuizAnswer、QuizResult、PersonalityType、QuizScores、TrainingPlan 等型別
- [ ] 1.2 建立 `packages/constants/src/quiz/questions.ts`：24 題題庫定義（id、text、axis、direction），含打散順序
- [ ] 1.3 建立 `packages/constants/src/quiz/types.ts`：8 型態完整定義（名稱、金句、描述、Flow/Clutch 最佳狀態、優勢、盲點、訓練處方摘要、拍檔/剋星、配色）
- [ ] 1.4 建立 `packages/constants/src/quiz/scoring.ts`：計分引擎純函數（calculateResult、calcGrit、calcFlow），含邊界處理（50% 平手時取 left）
- [ ] 1.5 建立 `packages/constants/src/quiz/training.ts`：8 型 × 4 週 × 3 天訓練計畫內容定義
- [ ] 1.6 建立 `packages/constants/src/quiz/colors.ts`：8 型配色常數
- [ ] 1.7 為計分引擎撰寫單元測試（全選同意、全選中立、全選不同意、邊界值 50%）

## 2. Visual Assets — 視覺識別

- [ ] 2.1 設計並匯出 8 個 SVG 靜態圖示（三層設計：岩點外框 + 抽象符號 + 動物隱藏），放入 `assets/personality/svg/`
- [ ] 2.2 製作 8 個 Lottie JSON 動畫（2-3 秒 loop，每檔 < 30KB），放入 `assets/personality/lottie/`
- [ ] 2.3 預生成 8 張 OG 靜態圖片（1200×628 PNG），放入 `public/quiz/og/`
- [ ] 2.4 建立通用 OG 圖片（`public/quiz/og/default.png`）用於 `/quiz` Landing Page

## 3. Web Frontend — Quiz Landing Page

- [ ] 3.1 建立 `/quiz` 路由群組和 Quiz 專用 layout（無主站 nav/footer，僅 logo）
- [ ] 3.2 實作 `QuizLanding.tsx`：Hero 區塊（標題、副標、8 圖示動畫、CTA 按鈕）
- [ ] 3.3 設定 `/quiz` 的 SEO meta tag 和 OG image

## 4. Web Frontend — 測驗流程

- [ ] 4.1 建立 Zustand quiz store：answers 陣列、currentIndex、sessionStorage 同步
- [ ] 4.2 實作 `QuizQuestion.tsx`：單題卡片 + 5 級 Likert 按鈕
- [ ] 4.3 實作 `QuizProgress.tsx`：進度條 + 題號顯示
- [ ] 4.4 實作 `QuizTransition.tsx`：題目切換動畫（slide / fade）
- [ ] 4.5 實作 `/quiz/test/page.tsx`：組合以上元件、上一題功能、24 題完成後計分跳轉
- [ ] 4.6 實作 sessionStorage 持久化：頁面重整恢復進度

## 5. Web Frontend — 結果頁

- [ ] 5.1 實作 `ResultHero.tsx`：Lottie 三層動畫 + 代號 + 名稱 + 金句
- [ ] 5.2 實作 `ResultRadar.tsx`：3 軸雷達圖（Canvas 或 SVG），支援 `?s` 參數個人化
- [ ] 5.3 實作 `ResultProfile.tsx`：稀有度 + 信譽區間 + 恆毅力/心流指數 + 人格描述 + Flow/Clutch 最佳狀態
- [ ] 5.4 實作 `ResultStrengths.tsx`：優勢 × 3 + 盲點 × 3
- [ ] 5.5 實作 `ResultTraining.tsx`：訓練處方摘要 + 模糊化 4 週預覽 + 登入 CTA
- [ ] 5.6 實作 `ResultCompat.tsx`：最佳拍檔 + 最大剋星（含對方圖示和連結）
- [ ] 5.7 實作 `/quiz/result/[type]/page.tsx`：組合以上元件，SSG 預渲染 8 頁，設定各型 OG meta
- [ ] 5.8 實作 URL query `?s` 參數解碼（base64 → 3 軸百分比 + 指數）

## 6. Web Frontend — 分享系統

- [ ] 6.1 實作 `ShareCard.tsx`：Canvas API 動態生成 PNG（含雷達圖、型態資訊、QR/URL）
- [ ] 6.2 支援 3 種尺寸生成：1080×1080、1080×1920、1200×628
- [ ] 6.3 實作 `ShareModal.tsx`：分享方式選擇（Story / Post / 複製連結 / 下載），Web Share API 偵測
- [ ] 6.4 結果頁整合分享按鈕 + 重新測驗按鈕

## 7. Web Frontend — Collection 頁

- [ ] 7.1 實作 `/quiz/collection/page.tsx`：8 型態卡片總覽，SSG 預渲染
- [ ] 7.2 每張卡片含 SVG 圖示、名稱、金句、簡短描述，點擊連結至結果頁

## 8. Backend — D1 Migration

- [ ] 8.1 建立 migration：`quiz_results` 表 + index
- [ ] 8.2 建立 migration：`users` 表新增 `personality_type` 和 `personality_taken_at` 欄位
- [ ] 8.3 建立 migration：`training_progress` 表
- [ ] 8.4 本地和 preview 環境執行 migration 驗證

## 9. Backend — Quiz API

- [ ] 9.1 實作 `POST /api/v1/quiz/results`：儲存測驗結果（Zod 驗證、Optional auth、寫入 quiz_results + 更新 users）
- [ ] 9.2 實作 `GET /api/v1/quiz/results/me`：查詢個人最新結果 + 歷史
- [ ] 9.3 實作 `GET /api/v1/quiz/stats`：全站統計（型態分佈、總測驗數），KV cache 1 小時
- [ ] 9.4 實作 `GET /api/v1/quiz/ranking/:type`：同型態用戶排名（依攀登表現）

## 10. Backend — Training API

- [ ] 10.1 實作 `GET /api/v1/training/plan/:type`：回傳型態對應的 4 週訓練計畫
- [ ] 10.2 實作 `POST /api/v1/training/progress`：記錄每日完成狀態
- [ ] 10.3 實作 `GET /api/v1/training/progress/me`：查詢個人訓練進度

## 11. Climber Rank 積分整合

- [ ] 11.1 修改積分計算邏輯：新增 quiz_results 完成 +5 分（僅計一次）
- [ ] 11.2 修改積分計算邏輯：新增 training_progress 完成 +15 分（每型計畫計一次）

## 12. Profile 整合

- [ ] 12.1 Web Profile 頁新增人格徽章元件（SVG 圖示 + 代號 + 名稱 + 指數），已測驗顯示/未測驗顯示 CTA
- [ ] 12.2 Web Biography 頁新增人格區塊（Lottie + 雷達圖 + 金句 + 最佳狀態）
- [ ] 12.3 Mobile Profile 頁新增人格徽章（SVG + 代號），未測驗顯示 CTA 按鈕

## 13. Mobile — Quiz 流程（Phase 2）

- [ ] 13.1 建立 `app/quiz/index.tsx`：Landing + CTA
- [ ] 13.2 建立 `app/quiz/test.tsx`：24 題測驗（共用 packages 計分引擎）
- [ ] 13.3 建立 `app/quiz/result/[type].tsx`：結果頁（Lottie + 雷達圖 + 分享）
- [ ] 13.4 分享功能：`react-native-view-shot` → Share Sheet

## 14. 整合測試 & 上線

- [ ] 14.1 E2E 測試：完整測驗流程（Landing → 24 題 → 結果 → 分享卡生成）
- [ ] 14.2 驗證 8 個結果頁的 OG meta tag 和預覽圖
- [ ] 14.3 驗證 sessionStorage 持久化（中途離開 → 恢復）
- [ ] 14.4 行動裝置 RWD 測試（結果頁、分享卡、雷達圖）
- [ ] 14.5 部署 preview 環境驗證，確認 Cloudflare Workers SSG 正常
