## ADDED Requirements

### Requirement: 重新生成回應
系統 SHALL 允許用戶對最後一則 AI 回應要求重新生成。

#### Scenario: 顯示重新生成按鈕
- **WHEN** 最後一則訊息為 AI 回應且系統非載入中狀態
- **THEN** 操作按鈕列顯示「重新生成」按鈕（僅最後一則 AI 訊息顯示）

#### Scenario: 非最後一則不顯示
- **WHEN** AI 訊息不是對話中最後一則訊息
- **THEN** 不顯示重新生成按鈕

#### Scenario: 執行重新生成
- **WHEN** 用戶點擊重新生成按鈕
- **THEN** 系統移除最後一則 AI 訊息，以相同的前一則 user 問題重新呼叫 `/ai/ask`，顯示載入狀態

#### Scenario: 載入中停用按鈕
- **WHEN** 系統正在等待 AI 回應
- **THEN** 重新生成按鈕停用（disabled）

### Requirement: Markdown 程式碼塊渲染
系統 SHALL 正確渲染 AI 回應中的程式碼塊。

#### Scenario: 多行程式碼塊
- **WHEN** AI 回應包含 \`\`\`語言\n程式碼內容\n\`\`\` 格式
- **THEN** 以等寬字型、灰底背景渲染程式碼，左上角顯示語言標籤

#### Scenario: 無語言標籤的程式碼塊
- **WHEN** AI 回應包含 \`\`\`\n程式碼內容\n\`\`\` 格式（無語言）
- **THEN** 正常渲染程式碼，不顯示語言標籤

#### Scenario: 行內程式碼
- **WHEN** AI 回應包含 \`code\` 格式
- **THEN** 以等寬字型、灰底小膠囊渲染

### Requirement: Markdown 表格渲染
系統 SHALL 正確渲染 AI 回應中的 Markdown 表格。

#### Scenario: 標準表格渲染
- **WHEN** AI 回應包含 `| 欄位 | 欄位 |` 格式的表格
- **THEN** 以有框線的 `<table>` 渲染，標題列（第一行）加底色區分

#### Scenario: 表格可水平捲動
- **WHEN** 表格欄位過多超出 widget 寬度
- **THEN** 表格容器可水平捲動，不破版
