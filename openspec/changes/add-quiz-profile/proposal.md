# Change: Web Profile 人格徽章與 Biography 人格區塊

## Why

攀岩人格測驗完成後，結果需要在使用者最常造訪的兩個頁面——Profile 與 Biography——可見。目前這兩個頁面沒有任何人格類型的展示元件，導致測驗結果無處呈現、使用者缺乏「被辨識」的感受，也無法吸引未測驗者參與。

## What Changes

1. **Profile 人格徽章**：在個人檔案頁頭像下方（Climber Rank 旁）新增人格徽章區，包含 SVG 圖標（40x40, 兩層）、類型代號、中文名稱、指標進度條（Grit/Flow index）。點擊展開完整人格描述。未測驗的本人顯示 CTA 按鈕，他人檔案則不顯示。
2. **Biography 人格區塊**：在 Biography 詳細頁新增獨立區塊，包含 Lottie 三層動畫、類型名稱與語錄、三軸雷達圖（Power/Goal/Bold）、最佳狀態標籤（Flow/Clutch）。僅已測驗者顯示。

## Capabilities

- `quiz-profile-badge`：Profile 頁人格徽章展示與 CTA
- `quiz-biography-block`：Biography 頁人格完整展示區塊

## Impact

- **Affected code**：
  - `apps/web/src/components/profile/` — 新增 `PersonalityBadge.tsx`、修改 `BiographyAvatarSection.tsx`
  - `apps/web/src/components/biography/display/` — 新增 `BiographyPersonality.tsx`、修改 `BiographyDetailPage.tsx`
  - `apps/web/src/lib/hooks/` — 新增 `useQuizResult.ts`（封裝 quiz results API 呼叫）
- **Dependencies**：
  - `add-quiz-visual-identity`（SVG/Lottie 素材檔案路徑）
  - `add-quiz-backend`（`GET /api/v1/quiz/results/me`、`users.personality_type` 欄位）
