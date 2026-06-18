# Tasks: Web Profile 人格徽章與 Biography 人格區塊

## 1. 共用基礎建設

- [ ] 在 `packages/constants/` 或 `apps/web/src/lib/constants/` 新增 `personality-types.ts`，定義 `PERSONALITY_TYPES` 映射（code -> name, color, quote, strengths, weaknesses, bestState, indexType）
- [ ] 在 `apps/web/src/lib/hooks/` 新增 `useQuizResult.ts`，封裝 `GET /api/v1/quiz/results/me` 的 TanStack Query hook
- [ ] 定義 `QuizResult` TypeScript 型別（與後端 API 回傳對齊）

## 2. Profile 人格徽章

- [ ] 新增 `apps/web/src/components/profile/PersonalityBadge.tsx`
  - [ ] 實作 SVG 圖標（40x40, 兩層）+ 代號 + 中文名稱
  - [ ] 實作 Grit/Flow Index 進度條（類型主色填充）
  - [ ] 實作點擊展開/收合面板（完整描述：語錄、優勢、弱點、最佳狀態）
- [ ] 新增 `apps/web/src/components/profile/PersonalityCTA.tsx`
  - [ ] 實作「測測你的攀岩人格」按鈕，連結至 `/quiz`
- [ ] 修改 `apps/web/src/components/profile/BiographyAvatarSection.tsx`
  - [ ] 在頭像下方、Climber Rank 旁整合徽章/CTA 元件
  - [ ] 條件判斷：isOwner + 未測驗 -> CTA，已測驗 -> Badge，非 owner + 未測驗 -> 不顯示
- [ ] 響應式佈局：桌面水平並排、行動版垂直堆疊

## 3. Biography 人格區塊

- [ ] 新增 `apps/web/src/components/biography/display/BiographyPersonality.tsx`
  - [ ] 整合 `lottie-web`：Intersection Observer 控制播放/暫停，載入失敗降級為 SVG
  - [ ] 實作 SVG 雷達圖元件（三軸：Power/Goal/Bold，類型主色填充）
  - [ ] 實作類型名稱 + 語錄 + 最佳狀態標籤
  - [ ] 響應式佈局：桌面左右分欄、行動版垂直堆疊
- [ ] 修改 `apps/web/src/components/biography/display/BiographyDetailPage.tsx`
  - [ ] 在 `BiographyTags` 與 `BiographyOneLiners` 之間條件渲染 `BiographyPersonality`
  - [ ] 傳入 biography user 的 personality_type 與 quiz result 數值
- [ ] 更新 `apps/web/src/components/biography/display/index.ts` 匯出新元件

## 4. 安裝依賴

- [ ] 確認 `lottie-web` 已安裝於 `apps/web`，若未安裝則 `pnpm add lottie-web`

## 5. 驗證

- [ ] Profile 頁：已測驗用戶顯示徽章、點擊展開描述正常
- [ ] Profile 頁：本人未測驗顯示 CTA、他人未測驗不顯示
- [ ] Biography 頁：已測驗用戶顯示人格區塊（動畫、雷達圖、文字）
- [ ] Biography 頁：未測驗用戶不顯示人格區塊
- [ ] 響應式：桌面與行動版佈局皆正確
- [ ] Lottie 載入失敗降級為 SVG 靜態圖
