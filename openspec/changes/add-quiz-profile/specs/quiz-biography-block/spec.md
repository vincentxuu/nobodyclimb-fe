## ADDED Requirements

### Requirement: Biography 人格展示區塊

系統 SHALL 在 Biography 詳細頁新增人格類型展示區塊，僅對已測驗用戶顯示，位於 Identity Tags 之後、Quick Intro 之前。

#### Scenario: 已測驗用戶顯示人格區塊

- **WHEN** Biography 頁載入，且該用戶 `personality_type` 不為 null
- **THEN** 在 Tags 區塊與 One-Liners 區塊之間插入人格展示區塊
- **THEN** 區塊包含以下元素：
  1. Lottie 動畫（三層完整，尺寸 120x120，自動循環播放）
  2. 類型全名（英文代號 + 中文名稱，如「PGB 粉碎者 Crusher」）
  3. 一句話語錄（斜體，類型主色底線裝飾）
  4. 三軸雷達圖（Power / Goal / Bold，百分比數值）
  5. 最佳狀態標籤（「Flow 型」或「Clutch 型」，帶對應圖標）

#### Scenario: 未測驗用戶不顯示

- **WHEN** Biography 頁載入，且該用戶 `personality_type` 為 null
- **THEN** 不渲染人格區塊，頁面結構與原本一致（Tags 直接接 One-Liners）

### Requirement: Lottie 動畫播放

系統 SHALL 使用 `lottie-web` 播放人格類型動畫，支援循環與效能優化。

#### Scenario: 動畫載入與播放

- **WHEN** 人格區塊進入可視區域（Intersection Observer）
- **THEN** 載入對應類型的 Lottie JSON（路徑：`/quiz/lottie/{type}.json`）
- **THEN** 以 `svg` renderer 自動播放，循環模式

#### Scenario: 動畫離開可視區域暫停

- **WHEN** 人格區塊滾動離開可視區域
- **THEN** 暫停 Lottie 動畫播放以節省資源

#### Scenario: 動畫載入失敗降級

- **WHEN** Lottie JSON 檔案載入失敗
- **THEN** 降級顯示對應類型的 SVG 靜態圖標（96x96，三層完整）

### Requirement: 三軸雷達圖

系統 SHALL 以 SVG 雷達圖呈現使用者的三軸分數（Power / Goal / Bold）。

#### Scenario: 雷達圖繪製

- **WHEN** 人格區塊渲染
- **THEN** 以等邊三角形為基底繪製雷達圖，三軸為 Power（力量傾向）、Goal（目標傾向）、Bold（冒險傾向）
- **THEN** 數值填充區域使用類型主色（opacity 0.3），邊線使用類型主色（opacity 0.8）
- **THEN** 各軸端點顯示百分比數值

#### Scenario: 雷達圖數值來源

- **WHEN** 需要雷達圖數值
- **THEN** 從 Biography 的 user 物件關聯的最新 quiz result 取得 `power_pct`、`goal_pct`、`bold_pct`

### Requirement: 區塊視覺風格

系統 SHALL 確保人格區塊與 Biography 頁面整體風格一致。

#### Scenario: 區塊樣式

- **WHEN** 人格區塊渲染
- **THEN** 背景為白色圓角卡片（`rounded-2xl`），與其他 Biography 區塊一致
- **THEN** 內部佈局：左側 Lottie 動畫 + 雷達圖，右側文字資訊（名稱、語錄、最佳狀態）
- **THEN** 行動版改為垂直堆疊：動畫居中 -> 名稱語錄 -> 雷達圖 -> 最佳狀態

#### Scenario: 區塊標題

- **WHEN** 人格區塊渲染
- **THEN** 區塊標題為「攀岩人格」，樣式與其他區塊標題（如「關於我」「一句話」）一致
