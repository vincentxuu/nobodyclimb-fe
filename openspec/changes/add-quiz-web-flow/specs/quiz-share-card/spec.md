## ADDED Requirements

### Requirement: 前端分享卡生成

系統 SHALL 在結果頁提供分享卡生成功能，使用原生 Canvas API 在前端動態產生 PNG 圖片。

分享卡 SHALL 包含：
- 背景漸層（以型態主色為基調）
- 型態 SVG 圖示
- 代號 + 中英文名稱
- 金句
- 3 軸雷達圖（與結果頁共用繪製邏輯）
- 恆毅力/心流指數
- URL 文字（nobodyclimb.cc/quiz）

支援 3 種尺寸：
- 1080x1080（1:1，IG/FB Post）
- 1080x1920（9:16，IG Story / LINE）
- 1200x628（1.91:1，OG / Twitter）

每型態使用對應的背景色調。

#### Scenario: 使用者下載 Story 尺寸圖卡

- **WHEN** 使用者在結果頁點選「分享」→「IG Story (9:16)」
- **THEN** 前端生成 1080x1920 PNG 並觸發下載，檔名格式為 `nobodyclimb-[type]-[name].png`（如 `nobodyclimb-PGB-crusher.png`）

#### Scenario: 生成速度

- **WHEN** 使用者點選任一尺寸的分享按鈕
- **THEN** 圖卡生成 SHALL 在 500ms 內完成

#### Scenario: 個人化雷達圖

- **WHEN** 結果頁有 `?s` 參數
- **THEN** 分享卡的雷達圖 SHALL 使用個人化百分比繪製（與結果頁雷達圖一致）

### Requirement: 分享方式選擇

系統 SHALL 提供 ShareModal 分享方式選擇介面，包含：
- IG Story 下載（9:16 尺寸）
- IG/FB Post 下載（1:1 尺寸）
- 複製連結（帶 `?s` 參數的結果頁 URL）
- 下載圖片（選擇尺寸後下載）

Mobile 環境 SHALL 優先使用 Web Share API（`navigator.share`）。

#### Scenario: 手機瀏覽器分享

- **WHEN** 使用者在手機瀏覽器點選「分享結果」
- **THEN** 若瀏覽器支援 `navigator.share`，直接呼叫系統分享面板（傳遞 PNG 檔案 + URL）；否則顯示 ShareModal

#### Scenario: 桌面瀏覽器分享

- **WHEN** 使用者在桌面瀏覽器點選「分享結果」
- **THEN** 顯示 ShareModal，列出所有分享方式

#### Scenario: 複製連結

- **WHEN** 使用者在 ShareModal 選擇「複製連結」
- **THEN** 將帶 `?s` 參數的結果頁完整 URL 複製到剪貼簿，顯示「已複製」提示

### Requirement: OG Meta Tag

每個結果頁（`/quiz/result/[type]`）SHALL 在 SSG 階段設定正確的 OG meta tag：
- `og:title`: 「我是[中文名] [英文名] — NobodyClimb 攀岩人格測驗」
- `og:description`: 金句 + 型態簡短描述
- `og:image`: 對應型態的預生成 OG 圖片 URL（`/quiz/og/[type].png`，1200x628）
- `og:url`: 結果頁 URL（不含 `?s` 參數）

Landing Page（`/quiz`）SHALL 設定通用 OG meta tag（使用 `default.png`）。
Collection 頁（`/quiz/collection`）SHALL 設定總覽 OG meta tag。

#### Scenario: LINE 分享連結預覽

- **WHEN** 使用者將 `/quiz/result/PGB` 貼到 LINE 聊天
- **THEN** LINE 顯示碎岩者的 OG 預覽圖（1200x628）、標題「我是碎岩者 Crusher — NobodyClimb 攀岩人格測驗」、描述

#### Scenario: Facebook 分享預覽

- **WHEN** 使用者在 Facebook 分享 `/quiz/result/TFS`
- **THEN** Facebook 顯示禪者的 OG 預覽圖、標題、描述

### Requirement: 預生成靜態 OG 圖片

Phase 1 SHALL 使用 8 張預生成的靜態 OG 圖片 + 1 張 Landing 通用圖，放置於 `apps/web/public/quiz/og/`：
- `default.png`（Landing Page 用）
- `pgb.png`、`pgs.png`、`pfb.png`、`pfs.png`、`tgb.png`、`tgs.png`、`tfb.png`、`tfs.png`

所有圖片 SHALL 為 1200x628 PNG 格式，包含型態圖示、名稱、金句、NobodyClimb 品牌識別。

#### Scenario: OG 圖片載入

- **WHEN** 社群平台爬取 `/quiz/result/PGB` 的 og:image URL
- **THEN** 回傳 `pgb.png` 靜態檔案，格式 PNG，尺寸 1200x628
