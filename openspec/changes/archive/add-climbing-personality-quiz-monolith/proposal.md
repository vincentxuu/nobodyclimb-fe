## Why

NobodyClimb 需要一個低門檻的病毒式入口來獲取新用戶。攀岩人格測驗（類似 Hana Climb Energy、16Personalities）能在零登入的情況下讓用戶完成測驗、分享結果，並透過「解鎖訓練計畫」CTA 導流至主站註冊。同時，測驗結果可以整合進現有的 Profile、AI 推薦、Climber Rank 系統，增加用戶留存和參與度。目前全球不存在任何學術級的「攀岩專用心理測驗」，NobodyClimb 有機會成為第一個。

## What Changes

- 新增 3 軸 8 型攀岩人格模型（Power/Technique × Goal/Free × Bold/Steady），24 題 5 級 Likert 量表
- 新增 Web 測驗流程：Landing → 24 題測驗 → 結果頁 → 分享圖卡
- 新增共用計分引擎（packages/constants），Web 和 Mobile 共用題目定義與計分邏輯
- 新增分享卡前端生成（Canvas → PNG，3 種尺寸：1:1、9:16、1.91:1 OG）
- 新增 8 型態視覺識別（三層設計：岩點外框 + 抽象符號 + 動物圖騰，Lottie + SVG）
- 新增 Backend API：儲存測驗結果、全站統計、型態排名、動態 OG 圖片
- 新增 D1 表：`quiz_results`、`training_progress`
- 新增 8 型模板化訓練計畫（4 週 × 3 天，登入後解鎖完整內容）
- 新增 Profile 人格徽章顯示（Web + Mobile）
- users 表新增 `personality_type`、`personality_taken_at` 欄位

## Capabilities

### New Capabilities

- `quiz-personality-model`: 人格模型核心 — 3 軸定義、8 型態定義、24 題題庫、計分引擎、Grit/Flow 指數計算。放在 packages/constants 供 Web/Mobile 共用
- `quiz-web-flow`: Web 測驗流程 — Landing page、測驗頁（Zustand 狀態管理）、結果頁、Collection 總覽頁。純前端 CSR/SSG，Phase 1 不需後端
- `quiz-share-card`: 分享卡系統 — Canvas 動態生成 PNG（3 尺寸）、Web Share API 整合、OG meta tag、後端 Satori 動態 OG 圖片
- `quiz-visual-identity`: 視覺識別系統 — 8 型 Lottie 動畫 + SVG 靜態圖示、三層設計（岩點/符號/動物）、8 色配色系統、多精度呈現（大/中/小）
- `quiz-backend-api`: 後端 API — 結果儲存、全站統計（KV cache）、型態排名、訓練進度追蹤。Hono 路由 + D1 + KV
- `quiz-training-plan`: 訓練計畫系統 — 8 型 × 4 週模板化計畫、登入解鎖機制、每日完成追蹤、畢業測試
- `quiz-profile-integration`: Profile 整合 — 人格徽章顯示（Web + Mobile）、Biography 顯示、Climber Rank 積分連動

### Modified Capabilities

- `climber-rank`: 新增測驗完成 +5 積分、訓練計畫完成 +15 積分的積分來源

## Impact

- **Web Frontend** (`apps/web/`): 新增 `/quiz` 路由群組（4 頁面）、新增 `components/quiz/` 元件群（12+ 元件）
- **Mobile App** (`apps/mobile/`): Phase 2 新增 `app/quiz/` 路由、Profile 頁新增人格徽章
- **Backend** (`backend/`): 新增 `routes/quiz.ts`、`routes/training.ts`、2 張 D1 migration、users 表 schema 變更
- **Shared Packages** (`packages/`): `constants/` 新增 `quiz/` 模組、`types/` 新增 Quiz 相關型別、`schemas/` 新增驗證 schema
- **Assets**: 新增 `assets/personality/` 目錄（8 Lottie JSON + 8 SVG + 預生成 OG 圖片）
- **Dependencies**: 可能新增 `lottie-react`（Web）、`@vercel/og` 或 `satori`（OG 圖片生成）
