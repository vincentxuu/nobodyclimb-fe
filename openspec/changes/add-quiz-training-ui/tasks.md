## 1. API 層與型別

- [x] 1.1 新增 `apps/web/src/lib/api/training.ts`，封裝三個 API 呼叫函式：`fetchTrainingPlan(type)`、`fetchTrainingProgress(type)`、`updateTrainingProgress(payload)`
- [x] 1.2 定義 API 回傳型別（或從 `@nobodyclimb/types` 引入 `TrainingPlan`、`TrainingWeek`、`TrainingDay`、`TrainingProgressRecord`）

## 2. TanStack Query Hooks

- [x] 2.1 新增 `apps/web/src/lib/hooks/useTrainingPlan.ts`：`useQuery` 包裝 `fetchTrainingPlan`，`staleTime: Infinity`（靜態內容）
- [x] 2.2 新增 `apps/web/src/lib/hooks/useTrainingProgress.ts`：`useQuery` 包裝 `fetchTrainingProgress`
- [x] 2.3 新增 `apps/web/src/lib/hooks/useUpdateProgress.ts`：`useMutation` 包裝 `updateTrainingProgress`，實作 optimistic update 與 error rollback，成功後 invalidate `training-progress` query key

## 3. 路由與頁面

- [x] 3.1 新增 `apps/web/src/app/[locale]/quiz/training/[type]/page.tsx`：訓練計畫頁面容器，驗證 `[type]` 為合法 PersonalityTypeCode，無效時回傳 404
- [x] 3.2 實作登入保護：未登入用戶導向登入頁，登入後 redirect 回原路徑
- [x] 3.3 設定頁面 metadata（title: `[型態名稱] 訓練計畫 — NobodyClimb`）

## 4. 頂部資訊區元件

- [x] 4.1 新增 `apps/web/src/components/quiz/training/TrainingHeader.tsx`：型態圖示 + 中文名稱 + 計畫主題 + 整體進度環（圓環圖，完成天數/12）

## 5. 週導覽與內容元件

- [x] 5.1 新增 `apps/web/src/components/quiz/training/WeekTabs.tsx`：Week 1-4 標籤切換，顯示各週 mini 進度條（0-3 天），已完成的週顯示勾勾
- [x] 5.2 預設展開邏輯：無進度 → Week 1；有進度 → 當前進行中的週（第一個未全部完成的週）

## 6. 每日訓練卡片元件

- [x] 6.1 新增 `apps/web/src/components/quiz/training/DayCard.tsx`：單天訓練卡片，顯示 title、description、duration、exercises 列表
- [x] 6.2 實作完成勾選框：checkbox + 完成/未完成樣式切換（完成時淡化 + 勾勾圖示），觸發 `useUpdateProgress` mutation
- [x] 6.3 實作 optimistic update：勾選立即更新 UI，API 失敗則回滾並顯示 error toast
- [x] 6.4 實作筆記區：可展開的 textarea，有「儲存」按鈕，已有筆記時卡片顯示筆記圖示

## 7. 進度視覺化元件

- [x] 7.1 新增 `apps/web/src/components/quiz/training/ProgressRing.tsx`：SVG 圓環進度圖，接收 `completed` 和 `total` props，帶動畫過渡
- [x] 7.2 天數統計文字：「已完成 N / 12 天」

## 8. 開始計畫引導

- [x] 8.1 新增 `apps/web/src/components/quiz/training/StartGuide.tsx`：首次進入時的引導卡片，說明 4 週結構、核心理念（訓練你的反面）、預估時長
- [x] 8.2 當用戶已有任何進度記錄時隱藏此元件

## 9. 畢業徽章

- [x] 9.1 新增 `apps/web/src/components/quiz/training/GraduationBadge.tsx`：畢業徽章元件，顯示徽章圖示與完成日期
- [x] 9.2 實作畢業慶祝動畫：完成第 12 天時觸發 confetti 效果 + 徽章浮現動畫（Framer Motion）
- [x] 9.3 畢業狀態判定：檢查該型態 12 天是否全部 `completed = true`

## 10. 結果頁 CTA 更新

- [x] 10.1 修改 `apps/web/src/components/quiz/ResultTraining.tsx`：已登入用戶 CTA 改為「前往訓練計畫」，連結至 `/quiz/training/[type]`
- [x] 10.2 已登入用戶時 Week 2-4 內容取消模糊化

## 11. 整合驗證

- [ ] 11.1 端對端流程測試：結果頁 CTA → 登入 → 訓練計畫頁 → 勾選完成 → 進度更新（⚠️ 需 backend API 連線）
- [ ] 11.2 Optimistic update 驗證：勾選後 UI 立即反映、API 失敗時正確回滾（⚠️ 需 backend API 連線）
- [ ] 11.3 畢業流程驗證：完成 12/12 天 → 慶祝動畫 → 徽章顯示 → 取消最後一天 → 徽章消失（⚠️ 需 backend API 連線）
- [x] 11.4 登入保護驗證：未登入訪問 `/quiz/training/pgb` → 導向登入頁（瀏覽器驗證通過）
- [ ] 11.5 行動裝置 RWD 測試：訓練計畫頁在手機上正常顯示，卡片可勾選（⚠️ 需手動測試）
- [x] 11.6 無效型態代碼驗證：`/quiz/training/xxx` 顯示 404（瀏覽器驗證通過）
- [x] 11.7 修復 generateStaticParams bug：PERSONALITY_TYPES 是陣列非 Record，改用 `.map(t => t.code.toLowerCase())`
