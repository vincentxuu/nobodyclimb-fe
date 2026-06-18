## ADDED Requirements

### Requirement: Profile 人格徽章

系統 SHALL 在用戶 Profile 頁顯示人格型態徽章，包含：
- 型態 SVG 圖示（40×40px）
- 代號 + 中文名（如「PGB 碎岩者」）
- 恆毅力或心流指數進度條

徽章位置：avatar 下方，Climber Rank 旁邊。

#### Scenario: 已測驗用戶的 Profile

- **WHEN** 查看已完成測驗用戶的 Profile
- **THEN** 顯示人格徽章，點擊可展開完整人格描述

#### Scenario: 未測驗用戶的 Profile

- **WHEN** 查看未測驗用戶的 Profile
- **THEN** 不顯示人格徽章區塊（不顯示空白或佔位符）

#### Scenario: 自己的 Profile 未測驗

- **WHEN** 未測驗用戶查看自己的 Profile
- **THEN** 顯示「測測你的攀岩人格」CTA 按鈕

### Requirement: Biography 人格展示

系統 SHALL 在用戶 Biography 頁面展示人格型態，包含：
- Lottie 動畫圖示（三層完整版）
- 型態名稱 + 金句
- 雷達圖（3 軸百分比）
- 最佳狀態標籤

#### Scenario: Biography 顯示人格區塊

- **WHEN** 查看已測驗用戶的 Biography
- **THEN** 在 Biography 內容中顯示「攀岩人格」區塊，含 Lottie 動畫和雷達圖

### Requirement: Mobile Profile 整合

Mobile App SHALL 在 Profile 頁面顯示與 Web 相同的人格徽章資訊。

入口方式：
- Profile 頁 →「測測你的攀岩人格」按鈕（未測驗）
- Profile 頁 → 點擊徽章可查看完整結果（已測驗）

#### Scenario: Mobile 用戶測驗入口

- **WHEN** 未測驗用戶在 Mobile App 的 Profile 頁
- **THEN** 顯示「測測你的攀岩人格」按鈕，點擊進入 in-app 測驗流程

#### Scenario: Mobile 用戶已測驗

- **WHEN** 已測驗用戶在 Mobile App 的 Profile 頁
- **THEN** 顯示人格徽章（SVG），點擊展開完整結果頁
