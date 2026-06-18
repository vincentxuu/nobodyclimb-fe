## ADDED Requirements

### Requirement: Quiz 專用 Layout

`apps/mobile/app/quiz/_layout.tsx` SHALL 使用獨立的 `Stack` layout，headerShown: false。所有 quiz 路由共用此 layout，不顯示底部 Tab Bar。

#### Scenario: 進入測驗隱藏 Tab Bar

- **WHEN** 使用者從任何頁面導航至 `/quiz`
- **THEN** 底部 Tab Bar 消失，僅顯示 Quiz 頁面內容

#### Scenario: 離開測驗恢復 Tab Bar

- **WHEN** 使用者從 Quiz 頁面返回（router.back 或完成測驗後導航回首頁）
- **THEN** 底部 Tab Bar 恢復顯示

### Requirement: Landing Page

系統 SHALL 在 `app/quiz/index.tsx` 提供測驗入口頁，包含：
- 頂部返回按鈕（`ChevronLeft`，router.back）
- Hero 區塊：標題「你是哪種攀岩者？」、副標題（24 題、3-5 分鐘）
- 8 型態 SVG 圖示預覽（2x4 網格或水平捲動）
- 「開始測驗」CTA 按鈕（`Button` 元件，導航至 `/quiz/test`）
- 不需登入即可進入

頁面使用 `SafeAreaView` + `ScrollView` 佈局，遵循現有 Mobile 設計規範（`SEMANTIC_COLORS`、`SPACING`、`RADIUS`）。

#### Scenario: 訪客進入 Landing

- **WHEN** 未登入用戶開啟 `/quiz`
- **THEN** 顯示完整 Landing 內容和「開始測驗」按鈕，不要求登入

#### Scenario: 點擊開始測驗

- **WHEN** 使用者點擊「開始測驗」
- **THEN** 導航至 `/quiz/test`，quiz store 初始化為空白狀態

### Requirement: 測驗頁

系統 SHALL 在 `app/quiz/test.tsx` 提供 24 題測驗體驗：

- 每次顯示一題，5 級 Likert 量表（非常不同意 → 非常同意）
- 頂部：返回按鈕 + 進度條（`ProgressBar` 元件）+ 題號（如「3 / 24」）
- 題目文字使用 `Text` 元件，字級 `lg` 或 `xl`
- 5 個選項以直排按鈕呈現，點選後以 Haptic feedback（`expo-haptics`，`impactAsync(Light)`）確認
- 選答後自動進入下一題，帶 Reanimated `SlideInRight` / `SlideOutLeft` 切換動畫
- 支援「上一題」按鈕回改答案
- 答案存入 Zustand store，同步備份至 MMKV（`zustand/middleware` persist）
- 24 題全部作答完成後自動計分並跳轉結果頁

題庫來自 `@nobodyclimb/constants`（`QUIZ_QUESTIONS`），計分引擎來自 `calculateResult(answers)`。

#### Scenario: 作答一題

- **WHEN** 使用者點選「同意」
- **THEN** 觸發 Haptic feedback，答案存入 store，進度條更新，0.3 秒後自動顯示下一題（帶 Reanimated 動畫）

#### Scenario: 修改前一題

- **WHEN** 使用者在第 5 題點選「上一題」
- **THEN** 畫面回到第 4 題，顯示先前選擇的答案（對應按鈕 highlighted），可重新選擇

#### Scenario: 完成 24 題

- **WHEN** 使用者回答完第 24 題
- **THEN** 呼叫 `calculateResult(answers)` 計分，取得 `PersonalityTypeCode` 和 3 軸百分比，導航至 `/quiz/result/[type]`，傳遞分數資料（route params 或 store）

#### Scenario: App 意外關閉後恢復

- **WHEN** 使用者在第 15 題時 App 被系統殺掉，重新開啟進入 `/quiz/test`
- **THEN** 從 MMKV 恢復 store 狀態，從第 15 題繼續作答

#### Scenario: 主動放棄測驗

- **WHEN** 使用者在測驗中點擊返回按鈕
- **THEN** 顯示 `ConfirmDialog`：「確定要離開？進度會保留」，確認後 router.back，store 保留（下次進入可恢復）

### Requirement: 結果頁

系統 SHALL 在 `app/quiz/result/[type].tsx` 顯示人格測驗結果。接收 route param `type`（PersonalityTypeCode）。

結果頁 SHALL 使用 `SafeAreaView` + `ScrollView`，依序包含以下區塊：

1. **ResultHero**（`QuizResultHero`）：Lottie 動畫（`lottie-react-native`，自動播放循環）+ 代號 + 中英文名稱 + 金句。背景使用型態主色漸層（`LinearGradient`）
2. **ResultRadar**（`QuizRadarChart`）：3 軸雷達圖（SVG，使用 `react-native-svg`），顯示個人化百分比
3. **ResultProfile**：恆毅力指數（Goal 型）或心流指數（Free 型）+ 人格描述 + Flow/Clutch 最佳狀態
4. **ResultStrengths**：優勢 x3 + 盲點 x3（`Card` 元件）
5. **ResultCompat**：最佳拍檔 + 最大剋星（SVG 圖示 + 名稱 + 可點擊連結至對方結果頁）
6. **底部操作**：「分享結果」按鈕（→ Share 流程）+ 「重新測驗」按鈕 + 「回首頁」按鈕

#### Scenario: 測驗完成跳轉結果頁

- **WHEN** 從測驗頁導航至 `/quiz/result/PGB`
- **THEN** 顯示碎岩者完整結果：Lottie 動畫播放、雷達圖顯示個人化百分比、型態描述、優勢/盲點

#### Scenario: 已登入用戶到達結果頁

- **WHEN** 已登入用戶到達結果頁
- **THEN** 自動呼叫 `POST /api/v1/quiz/results` 儲存結果至後端（靜默，不阻塞 UI），失敗時不影響用戶體驗

#### Scenario: 未登入用戶到達結果頁

- **WHEN** 未登入用戶到達結果頁
- **THEN** 結果僅存在本地 store，底部額外顯示「登入保存結果」CTA

#### Scenario: 點擊重新測驗

- **WHEN** 使用者點擊「重新測驗」
- **THEN** quiz store 執行 reset，導航至 `/quiz/test`

#### Scenario: Lottie 動畫載入

- **WHEN** Lottie JSON 檔案載入中
- **THEN** 顯示型態 SVG 靜態圖示作為 fallback，Lottie 載入完成後替換

### Requirement: Zustand 測驗狀態管理

系統 SHALL 使用 Zustand store（`apps/mobile/src/store/quizStore.ts`）管理測驗狀態：

```typescript
interface QuizState {
  answers: (number | null)[]  // 24 slots, 1-5 or null
  currentIndex: number
  result: QuizResult | null   // 計分結果
  setAnswer: (index: number, value: number) => void
  goNext: () => void
  goPrev: () => void
  complete: () => void        // 計分 + 設定 result
  reset: () => void
}
```

Store SHALL 透過 `zustand/middleware` 的 `persist` 搭配 MMKV storage adapter 持久化。

#### Scenario: Store 初始化

- **WHEN** 使用者首次進入 `/quiz/test` 且無持久化資料
- **THEN** 建立新 store：24 個 null answers、currentIndex = 0、result = null

#### Scenario: 測驗完成後清除

- **WHEN** 使用者在結果頁點擊「重新測驗」或「回首頁」
- **THEN** store 執行 reset，清除 MMKV 中的測驗數據
