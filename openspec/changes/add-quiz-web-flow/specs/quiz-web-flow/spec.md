## ADDED Requirements

### Requirement: Landing Page

系統 SHALL 在 `/quiz` 提供測驗 Landing Page，包含：
- 標題（「你是哪種攀岩者？」）
- 副標題說明測驗內容（24 題、3-5 分鐘）
- 8 型態 SVG 圖示預覽
- 「開始測驗」CTA 按鈕
- 不需要登入即可開始

頁面 SHALL 使用 SSG 預渲染。

#### Scenario: 訪客進入 Landing Page

- **WHEN** 未登入用戶訪問 `/quiz`
- **THEN** 頁面顯示完整 Landing 內容和「開始測驗」按鈕，不要求登入

#### Scenario: SEO meta tag

- **WHEN** 搜尋引擎爬取 `/quiz`
- **THEN** 頁面包含 title、description、og:image（指向 `public/quiz/og/default.png`）等 meta tag

### Requirement: 測驗頁

系統 SHALL 在 `/quiz/test` 提供 24 題測驗體驗：

- 每次顯示一題，5 級 Likert 量表（非常不同意 → 非常同意）
- 頂部顯示進度條和題號（如「3 / 24」）
- 點選答案後自動進入下一題，帶切換動畫（Framer Motion slide/fade）
- 支援「上一題」按鈕回改答案
- 答案暫存於 Zustand store，同步備份至 sessionStorage
- 24 題全部作答完成後自動計分並跳轉結果頁

#### Scenario: 使用者作答一題

- **WHEN** 使用者點選「同意」
- **THEN** 答案存入 Zustand store，進度條更新，自動顯示下一題（帶切換動畫）

#### Scenario: 使用者修改前一題

- **WHEN** 使用者在第 5 題點選「上一題」
- **THEN** 畫面回到第 4 題，顯示先前選擇的答案，可重新選擇

#### Scenario: 使用者完成所有 24 題

- **WHEN** 使用者回答完第 24 題
- **THEN** 前端呼叫 `calculateResult(answers)` 計分，將 3 軸百分比和指數以 base64url 編碼為 `?s` 參數，跳轉至 `/quiz/result/[type]?s=[encodedScores]`

#### Scenario: 頁面意外關閉後恢復

- **WHEN** 使用者在第 15 題時關閉瀏覽器，重新開啟 `/quiz/test`
- **THEN** 從 sessionStorage 恢復 Zustand store 狀態，從第 15 題繼續作答

### Requirement: 結果頁

系統 SHALL 在 `/quiz/result/[type]` 顯示人格測驗結果。8 個型態頁面 SHALL 以 SSG 預渲染（`generateStaticParams`），個人化數據透過 URL `?s` 參數在 client-side 解碼繪製。

結果頁 SHALL 依序包含以下區塊：
1. **ResultHero**：型態 Lottie 動畫（三層設計）+ 代號 + 中英文名稱 + 金句
2. **ResultRadar**：3 軸雷達圖（Canvas 或 SVG），根據 `?s` 參數顯示個人化百分比；無 `?s` 時顯示型態預設值
3. **ResultProfile**：恆毅力指數（Goal 端型態）或心流指數（Free 端型態）+ 人格描述（2-3 段）+ Flow/Clutch 最佳狀態
4. **ResultStrengths**：優勢 x3 + 盲點 x3
5. **ResultTraining**：訓練預覽 — Week 1 標題 + Day 1 摘要清楚可見，Week 2-4 以 CSS blur 模糊化 + overlay，底部「登入解鎖完整訓練計畫」CTA
6. **ResultCompat**：最佳拍檔 + 最大剋星（含圖示和連結至對方結果頁）
7. **底部操作**：分享按鈕（→ ShareModal）+ 「重新測驗」按鈕 + 「加入 NobodyClimb」CTA

#### Scenario: 測驗完成跳轉結果頁

- **WHEN** 使用者從測驗頁跳轉至 `/quiz/result/PGB?s=eyJiIjo3MywiLi4ufQ`
- **THEN** 頁面解碼 `?s` 參數（base64url → JSON → `{ b: 73, m: 62, d: 85, g: 96 }`），ResultRadar 顯示個人化百分比，ResultProfile 顯示對應指數

#### Scenario: 直接訪問結果頁（無 ?s 參數）

- **WHEN** 使用者直接訪問 `/quiz/result/PGB`（來自分享連結或搜尋）
- **THEN** 顯示碎岩者完整描述，雷達圖使用型態預設值，底部額外顯示「測測你自己」CTA 按鈕

#### Scenario: 訓練預覽顯示

- **WHEN** 使用者查看結果頁的訓練區塊
- **THEN** Week 1 標題和 Day 1 摘要清楚可見，Week 2-4 內容模糊化不可閱讀，底部顯示「登入解鎖完整訓練計畫」CTA

#### Scenario: 無效的 ?s 參數

- **WHEN** URL 的 `?s` 參數無法正確解碼（格式錯誤或損壞）
- **THEN** 忽略 `?s` 參數，以型態預設值顯示雷達圖，不報錯

### Requirement: Collection 總覽頁

系統 SHALL 在 `/quiz/collection` 以卡片形式展示所有 8 個型態，每型顯示 SVG 圖示、中英文名稱、金句、簡短描述。頁面 SHALL 使用 SSG 預渲染。

#### Scenario: 訪客瀏覽 Collection

- **WHEN** 使用者訪問 `/quiz/collection`
- **THEN** 頁面以卡片網格展示 8 個型態，每張卡片可點擊連結至該型態結果頁（`/quiz/result/[type]`，不帶 `?s` 參數）

### Requirement: Quiz 專用 Layout

`/quiz` 路由群組 SHALL 使用獨立的 `layout.tsx`，不含主站的導覽列和 footer。Layout SHALL 僅顯示 NobodyClimb logo（可點擊回首頁）。

#### Scenario: 測驗頁面不顯示主站導覽

- **WHEN** 使用者在 `/quiz/test` 頁面
- **THEN** 頁面不顯示主站的 header/nav/footer，僅有簡潔的 Quiz layout 和 NobodyClimb logo

#### Scenario: Logo 導航

- **WHEN** 使用者在 Quiz 任一頁面點擊 NobodyClimb logo
- **THEN** 導航回主站首頁（`/`）

### Requirement: Zustand 測驗狀態管理

系統 SHALL 使用 Zustand store 管理測驗狀態，包含 answers（24 slots，值為 1-5 或 null）、currentIndex。Store SHALL 透過 Zustand `persist` middleware 同步備份至 sessionStorage。

#### Scenario: Store 初始化

- **WHEN** 使用者首次進入 `/quiz/test`
- **THEN** 建立新的 quiz store：24 個 null answers、currentIndex = 0

#### Scenario: 測驗完成後清除

- **WHEN** 使用者完成測驗跳轉至結果頁
- **THEN** store 執行 reset，清除 sessionStorage 中的測驗數據
