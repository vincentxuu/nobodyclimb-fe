## ADDED Requirements

### Requirement: Landing Page

系統 SHALL 在 `/quiz` 提供測驗 Landing Page，包含：
- 標題（「你是哪種攀岩者？」）
- 副標題說明
- 8 型態小圖示動畫（Lottie）
- 「開始測驗」CTA 按鈕
- 不需要登入即可開始

頁面 SHALL 使用 SSG 預渲染，首次載入 < 1 秒。

#### Scenario: 訪客進入 Landing Page

- **WHEN** 未登入用戶訪問 `/quiz`
- **THEN** 頁面顯示完整 Landing 內容和「開始測驗」按鈕，不要求登入

#### Scenario: SEO meta tag

- **WHEN** 搜尋引擎爬取 `/quiz`
- **THEN** 頁面包含 title、description、og:image 等 meta tag

### Requirement: 測驗頁

系統 SHALL 在 `/quiz/test` 提供 24 題測驗體驗：

- 每次顯示一題，5 級 Likert 量表（非常同意→非常不同意）
- 頂部顯示進度條和題號（如「3 / 24」）
- 點選答案後自動進入下一題，帶切換動畫
- 支援「上一題」按鈕回改答案
- 答案暫存於 Zustand store，頁面重整不遺失（sessionStorage 備份）
- 24 題全部作答完成後自動跳轉結果頁

#### Scenario: 使用者作答一題

- **WHEN** 使用者點選「同意」
- **THEN** 答案存入 store，進度條更新，自動顯示下一題

#### Scenario: 使用者修改前一題

- **WHEN** 使用者在第 5 題點選「上一題」
- **THEN** 畫面回到第 4 題，顯示先前選擇的答案，可重新選擇

#### Scenario: 使用者完成所有 24 題

- **WHEN** 使用者回答完第 24 題
- **THEN** 前端執行計分引擎，計算型態和百分比，跳轉至 `/quiz/result/[type]?s=[encodedScores]`

#### Scenario: 頁面意外關閉

- **WHEN** 使用者在第 15 題時關閉瀏覽器，重新開啟 `/quiz/test`
- **THEN** 從 sessionStorage 恢復進度，從第 15 題繼續

### Requirement: 結果頁

系統 SHALL 在 `/quiz/result/[type]` 顯示人格測驗結果，包含：

1. 型態圖示（Lottie 動畫，三層設計）
2. 代號 + 名稱 + 金句
3. 稀有度百分比 + 信譽區間文字
4. 雷達圖（3 軸百分比視覺化）
5. 恆毅力指數 或 心流指數（依型態）
6. 人格描述（2-3 段）
7. 最佳狀態（Flow/Clutch 變體描述）
8. 優勢 × 3 + 盲點 × 3
9. 訓練處方摘要（完整計畫模糊化 + 登入 CTA）
10. 最佳拍檔 / 最大剋星
11. 分享按鈕（→ ShareModal）
12. 「重新測驗」按鈕
13. 「加入 NobodyClimb」CTA

雷達圖 SHALL 根據 URL query parameter `s` 中的個人化分數動態繪製。無 `s` 參數時顯示該型態的預設值。

#### Scenario: 測驗完成跳轉結果頁

- **WHEN** 使用者從測驗頁跳轉至 `/quiz/result/PGB?s=eFg3NQ`
- **THEN** 頁面解碼 `s` 參數，顯示個人化雷達圖和指數

#### Scenario: 直接訪問結果頁（無 s 參數）

- **WHEN** 使用者直接訪問 `/quiz/result/PGB`（來自分享連結）
- **THEN** 顯示碎岩者的完整描述，雷達圖使用預設值，底部顯示「測測你自己」CTA

### Requirement: Collection 總覽頁

系統 SHALL 在 `/quiz/collection` 顯示所有 8 型態的總覽，每型顯示圖示、名稱、金句、簡短描述。

#### Scenario: 訪客瀏覽 Collection

- **WHEN** 使用者訪問 `/quiz/collection`
- **THEN** 頁面以卡片形式展示 8 個型態，點擊任一卡片跳轉至該型態結果頁

### Requirement: Quiz 專用 Layout

`/quiz` 路由群組 SHALL 使用獨立的 layout，不含主站的導覽列和 footer。僅顯示 NobodyClimb logo（可點擊回首頁）和語言切換。

#### Scenario: 測驗頁面不顯示主站導覽

- **WHEN** 使用者在 `/quiz/test` 頁面
- **THEN** 頁面不顯示主站的 header/nav/footer，僅有簡潔的 quiz layout
