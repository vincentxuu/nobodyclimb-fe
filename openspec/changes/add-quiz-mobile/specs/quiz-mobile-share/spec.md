## ADDED Requirements

### Requirement: 結果頁截圖生成

系統 SHALL 使用 `react-native-view-shot` 將結果頁的分享區塊截圖為 PNG 圖片。

分享區塊（`QuizShareCard`）SHALL 是一個獨立的 View 元件，包含：
- 背景漸層（型態主色）
- 型態 SVG 圖示
- 代號 + 中英文名稱
- 金句
- 3 軸雷達圖
- 恆毅力/心流指數
- NobodyClimb 品牌 logo + URL 文字

此 View 可能是隱藏的（off-screen 或 opacity: 0），專為截圖用途，不影響結果頁正常滾動佈局。

#### Scenario: 截圖生成

- **WHEN** 使用者點擊「分享結果」按鈕
- **THEN** `react-native-view-shot` 對 `QuizShareCard` 元件執行 `captureRef()`，生成 PNG 圖片（解析度 1080 寬），存至臨時路徑

#### Scenario: 截圖生成速度

- **WHEN** 觸發截圖
- **THEN** 生成 SHALL 在 1 秒內完成，期間顯示 loading indicator

#### Scenario: 截圖失敗

- **WHEN** `captureRef()` 拋出錯誤
- **THEN** 顯示 Toast 錯誤提示「分享圖片生成失敗」，不中斷 App

### Requirement: 原生分享面板

系統 SHALL 使用 `expo-sharing`（或 `react-native-share`）觸發原生 Share Sheet，傳遞截圖 PNG + 預設文字。

分享預設文字：
```
我是{中文名} {英文名}！你是哪種攀岩者？
來測測看 → nobodyclimb.cc/quiz
```

#### Scenario: 分享至任意 App

- **WHEN** 使用者點擊「分享結果」→ 截圖生成完成
- **THEN** 彈出原生 Share Sheet，預載圖片 + 文字，使用者可選擇 LINE / IG Story / Facebook / 任意 App

#### Scenario: IG Story 分享

- **WHEN** 使用者從 Share Sheet 選擇 Instagram Story
- **THEN** 圖片以背景圖形式開啟 IG Story 編輯器

#### Scenario: LINE 分享

- **WHEN** 使用者從 Share Sheet 選擇 LINE
- **THEN** 圖片 + 文字傳送至 LINE 對話或貼文

#### Scenario: 使用者取消分享

- **WHEN** 使用者開啟 Share Sheet 後取消
- **THEN** 回到結果頁，不執行任何動作

### Requirement: 複製連結

結果頁 SHALL 另外提供「複製連結」按鈕，將 Web 版結果頁 URL 複製至剪貼簿。

URL 格式：`https://nobodyclimb.cc/quiz/result/[type]`（不含個人化 `?s` 參數，因 Mobile 端分享以圖片為主）。

#### Scenario: 複製連結

- **WHEN** 使用者點擊「複製連結」
- **THEN** URL 複製至系統剪貼簿（`expo-clipboard`），顯示 Toast「連結已複製」
