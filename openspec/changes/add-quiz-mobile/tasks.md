## 1. 環境準備與依賴安裝

- [x] 安裝 `lottie-react-native`（Lottie 動畫播放器）
- [x] 安裝 `react-native-view-shot`（截圖生成分享圖）
- [x] 確認 `expo-sharing` 或安裝 `react-native-share`（原生分享面板）
- [x] 確認 `expo-haptics` 已安裝（觸覺回饋）
- [x] 確認 `expo-clipboard` 已安裝（複製連結）
- [x] 確認 `react-native-svg` 已安裝（雷達圖）
- [x] 將 Lottie JSON 檔案複製至 `apps/mobile/assets/quiz/lottie/`（8 檔）
- [x] 將 SVG 圖示複製至 `apps/mobile/assets/quiz/svg/`（8 檔）

## 2. Zustand Store

- [x] 建立 `apps/mobile/src/store/quizStore.ts`
- [x] 實作 state：answers (24 slots)、currentIndex、result
- [x] 實作 actions：setAnswer、goNext、goPrev、complete（呼叫 calculateResult）、reset
- [x] 整合 `zustand/middleware` persist + MMKV storage adapter
- [x] 驗證：App 被殺後重啟可恢復答題進度

## 3. Quiz 路由與 Layout

- [x] 建立 `apps/mobile/app/quiz/_layout.tsx`（Stack layout，headerShown: false）
- [x] 確認進入 `/quiz` 時底部 Tab Bar 自動隱藏

## 4. Landing Page

- [x] 建立 `apps/mobile/app/quiz/index.tsx`
- [x] 實作 Hero 區塊：標題、副標題、8 型態 SVG 預覽
- [x] 實作「開始測驗」CTA 按鈕（導航至 `/quiz/test`）
- [x] 使用 SafeAreaView + ScrollView 佈局
- [x] 套用 SEMANTIC_COLORS / SPACING / RADIUS 設計規範

## 5. 測驗頁

- [x] 建立 `apps/mobile/app/quiz/test.tsx`
- [x] 實作 QuizProgressBar 元件（進度條 + 題號）
- [x] 實作 QuizQuestion 元件（題目文字 + 5 個 Likert 選項按鈕）
- [x] 整合 Reanimated 切換動畫（SlideInRight / SlideOutLeft）
- [x] 整合 expo-haptics（選答時 impactAsync Light）
- [x] 實作「上一題」按鈕功能
- [x] 實作選答後 0.3 秒自動進下一題
- [x] 實作第 24 題完成後自動計分跳轉結果頁
- [x] 實作返回按鈕 + ConfirmDialog（「確定要離開？進度會保留」）
- [x] 從 `@nobodyclimb/constants` 引入 QUIZ_QUESTIONS 和 calculateResult

## 6. 結果頁

- [x] 建立 `apps/mobile/app/quiz/result/[type].tsx`
- [x] 實作 QuizResultHero 元件（Lottie 動畫 + 型態名稱 + 金句 + LinearGradient 背景）
- [x] 實作 QuizRadarChart 元件（react-native-svg 3 軸雷達圖）
- [x] 實作 ResultProfile 區塊（恆毅力/心流指數 + 描述 + Flow/Clutch）
- [x] 實作 ResultStrengths 區塊（優勢 x3 + 盲點 x3）
- [x] 實作 ResultCompat 區塊（最佳拍檔 + 最大剋星，可點擊）
- [x] 實作底部操作列：分享按鈕、重新測驗、回首頁
- [x] Lottie 載入中以 SVG 靜態圖示作為 fallback
- [x] 已登入用戶到達時靜默呼叫 POST /api/v1/quiz/results 儲存
- [x] 未登入用戶顯示「登入保存結果」CTA

## 7. 分享功能

- [x] 實作 QuizShareCard 元件（off-screen 分享截圖用 View）
- [x] 包含：漸層背景、SVG 圖示、名稱、金句、雷達圖、指數、品牌 logo
- [x] 整合 react-native-view-shot 的 captureRef 截圖邏輯
- [x] 整合 expo-sharing / react-native-share 觸發原生 Share Sheet
- [x] 分享預設文字：「我是{中文名} {英文名}！你是哪種攀岩者？」
- [x] 截圖生成期間顯示 loading indicator
- [x] 截圖失敗時顯示 Toast 錯誤提示
- [x] 實作「複製連結」按鈕（expo-clipboard + Toast 提示）

## 8. Profile 人格徽章

- [x] 建立 `apps/mobile/src/components/quiz/QuizProfileBadge.tsx`
- [x] 實作已測驗樣式：SVG 圖示 + 型態代碼 + 中文名稱 + 型態淺色背景
- [x] 實作未測驗 CTA 樣式：「探索你的攀岩人格」+ 「測測看」按鈕
- [x] 支援 size prop（sm / md）
- [x] 在 `app/(tabs)/profile.tsx` 中整合 QuizProfileBadge 元件
- [x] 已登入 + 已測驗 → 顯示徽章（點擊可看結果）
- [x] 已登入 + 未測驗 → 顯示 CTA（點擊導向 /quiz）
- [x] 未登入 → 不顯示

## 9. 元件索引與匯出

- [x] 建立 `apps/mobile/src/components/quiz/index.ts` 統一 re-export
- [x] 確認所有元件從 `@nobodyclimb/constants` 引入型態定義（不在 Mobile 端重複定義）
