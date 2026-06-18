## ADDED Requirements

### Requirement: 前端分享卡生成

系統 SHALL 在結果頁提供分享卡生成功能，使用 Canvas API 在前端動態產生 PNG 圖片。

分享卡 SHALL 包含：型態圖示（SVG 靜態版）、代號 + 名稱、金句、雷達圖、恆毅力/心流指數、稀有度、最佳狀態、QR Code 或 URL（nobodyclimb.cc/quiz）。

支援 3 種尺寸：
- 1080×1080（1:1，IG/FB Post）
- 1080×1920（9:16，IG Story / LINE）
- 1200×628（1.91:1，OG / Twitter）

每型態使用對應的背景色調。

#### Scenario: 使用者下載 Story 尺寸圖卡

- **WHEN** 使用者在結果頁點選「分享」→「IG Story (9:16)」
- **THEN** 前端生成 1080×1920 PNG，觸發下載，檔名為 `nobodyclimb-PGB-crusher.png`

#### Scenario: 生成速度

- **WHEN** 使用者點選分享按鈕
- **THEN** 圖卡生成 SHALL 在 500ms 內完成

### Requirement: 分享方式選擇

系統 SHALL 提供分享方式選擇 Modal，包含：
- IG Story（9:16 下載）
- IG/FB Post（1:1 下載）
- 複製連結
- 下載圖片

Mobile 環境 SHALL 優先使用 Web Share API（navigator.share）。

#### Scenario: 手機分享

- **WHEN** 使用者在手機瀏覽器點選「分享結果」
- **THEN** 若支援 Web Share API，直接呼叫系統分享面板；否則顯示下載選項

#### Scenario: 桌面分享

- **WHEN** 使用者在桌面瀏覽器點選「分享結果」
- **THEN** 顯示 Modal，列出 4 種分享方式

### Requirement: OG Meta Tag

每個結果頁（`/quiz/result/[type]`）SHALL 設定正確的 OG meta tag：
- `og:title`: 「我是碎岩者 The Crusher — NobodyClimb 攀岩人格測驗」
- `og:description`: 金句 + 稀有度
- `og:image`: 對應型態的 OG 圖片（1200×628）

#### Scenario: LINE 分享連結預覽

- **WHEN** 使用者將 `/quiz/result/PGB` 貼到 LINE 聊天
- **THEN** LINE 顯示碎岩者的 OG 預覽圖（1200×628）、標題、描述

### Requirement: OG 圖片生成

Phase 1 SHALL 使用 8 張預生成的靜態 OG 圖片（放在 `public/quiz/og/`）。Phase 2 可升級為後端 Satori 動態生成（含個人化雷達圖）。

#### Scenario: OG 圖片載入

- **WHEN** 社群平台爬取 `/quiz/result/PGB` 的 og:image
- **THEN** 回傳對應的 PGB OG 圖片，格式為 PNG，尺寸 1200×628
