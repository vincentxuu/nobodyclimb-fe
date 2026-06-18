## ADDED Requirements

### Requirement: 已測驗用戶 Profile 人格徽章

系統 SHALL 在 Profile 頁頭像區域下方顯示人格類型徽章，與 Climber Rank 並排。

#### Scenario: 徽章基本呈現

- **WHEN** 已測驗用戶的 Profile 頁載入，且 `users.personality_type` 不為 null
- **THEN** 顯示人格徽章，包含：
  - SVG 圖標（40x40, 兩層：L1 把手外框 + L2 抽象符號）
  - 類型代號文字（如 `PGB`），使用該類型主色
  - 中文名稱（如「粉碎者」）
  - 指標進度條：Goal 型顯示 Grit Index、Free 型顯示 Flow Index，進度條填充色為類型主色

#### Scenario: 徽章點擊展開描述

- **WHEN** 使用者點擊人格徽章
- **THEN** 展開面板顯示完整人格描述，包含：類型全名（英文 + 中文）、一句話語錄、優勢列表、弱點列表、最佳狀態（Flow/Clutch）
- **THEN** 再次點擊或點擊外部區域收合面板

#### Scenario: 他人 Profile 檢視已測驗用戶

- **WHEN** 訪客檢視他人已測驗的 Profile 頁
- **THEN** 同樣顯示人格徽章（唯讀，點擊可展開描述）

### Requirement: 未測驗用戶 CTA

系統 SHALL 在未測驗用戶檢視自己的 Profile 時，顯示測驗引導。

#### Scenario: 本人未測驗顯示 CTA

- **WHEN** 使用者檢視自己的 Profile，且 `users.personality_type` 為 null
- **THEN** 在徽章區域顯示「測測你的攀岩人格」CTA 按鈕
- **THEN** 點擊按鈕導航至測驗頁面 `/quiz`

#### Scenario: 他人未測驗不顯示

- **WHEN** 訪客檢視他人 Profile，且該用戶 `personality_type` 為 null
- **THEN** 不顯示徽章區域，不顯示 CTA，版面與原本一致

### Requirement: 徽章資料來源

系統 SHALL 使用 user 物件上的 `personality_type` 欄位判斷是否顯示徽章，並從本地常數映射取得類型詳細資訊。

#### Scenario: 從 user 物件取得類型

- **WHEN** Profile 頁元件渲染
- **THEN** 讀取 user 物件的 `personality_type`（3 字母代號）與 `personality_taken_at`
- **THEN** 根據代號從 `PERSONALITY_TYPES` 常數映射取得中文名稱、主色、語錄等靜態資料

#### Scenario: 指標數值來源

- **WHEN** 需要顯示 Grit/Flow Index 進度條
- **THEN** 呼叫 `GET /api/v1/quiz/results/me` 取得 `latest` 結果中的 `grit_index` 或 `flow_index`
- **THEN** 若 API 尚未回傳，進度條顯示載入骨架（skeleton）

### Requirement: 響應式佈局

系統 SHALL 確保人格徽章在桌面與行動裝置上正確顯示。

#### Scenario: 桌面版佈局

- **WHEN** 視窗寬度 >= 768px
- **THEN** 徽章與 Climber Rank 水平並排顯示於頭像下方

#### Scenario: 行動版佈局

- **WHEN** 視窗寬度 < 768px
- **THEN** 徽章與 Climber Rank 垂直堆疊，徽章在 Rank 下方
