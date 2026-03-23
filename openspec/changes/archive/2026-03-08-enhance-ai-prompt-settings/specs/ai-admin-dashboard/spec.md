## MODIFIED Requirements

### Requirement: 設定頁面
系統應在 `/admin/ai/settings` 提供 AI 設定配置，使用分頁式（Tabs）介面組織設定項，取代原有的單一長頁面。

#### Scenario: 分頁式介面結構
- **WHEN** 管理員造訪 `/admin/ai/settings`
- **THEN** 頁面 SHALL 使用 Tabs 元件顯示 6 個分頁：模型設定、搜尋與排名、品質與 Token、對話與快取、Agentic 模式、防護設定

#### Scenario: 預設顯示第一個分頁
- **WHEN** 管理員造訪 `/admin/ai/settings`（無 URL hash）
- **THEN** 預設顯示「模型設定」分頁

#### Scenario: URL hash 同步分頁
- **WHEN** 管理員切換到「搜尋與排名」分頁
- **THEN** URL SHALL 更新為 `/admin/ai/settings#search`，重新載入頁面時 SHALL 自動切換到該分頁

#### Scenario: 分頁內容對應
- **WHEN** 各分頁載入完成
- **THEN** 分頁內容 SHALL 按以下對應顯示設定欄位：
  - 「模型設定」(#models)：模型設定區塊（5 個欄位）
  - 「搜尋與排名」(#search)：搜尋與檢索（7 個欄位）+ 排名與多樣性（3 個欄位）
  - 「品質與 Token」(#quality)：Token 限制（3 個欄位）+ 品質閾值（3 個欄位）+ Judge 設定（3 個欄位）+ Self-Reflection（1 個欄位）
  - 「對話與快取」(#chat)：對話與快取（3 個欄位）+ 語義快取（2 個欄位）
  - 「Agentic 模式」(#agentic)：Agentic 模式（3 個欄位）
  - 「防護設定」(#guardrails)：防護設定（1 個欄位）+ 4 組 guardrail 列表

#### Scenario: 每個分頁獨立儲存
- **WHEN** 管理員在「模型設定」分頁修改設定並點擊儲存
- **THEN** 系統 SHALL 只送出該分頁包含的設定 key（如 llm_model、simple_model 等），不影響其他分頁的設定值

#### Scenario: 獨立儲存成功回饋
- **WHEN** 分頁設定儲存成功
- **THEN** 該分頁 SHALL 顯示「已儲存」成功提示，其他分頁不受影響

## ADDED Requirements

### Requirement: Guardrail 標籤式編輯
系統 SHALL 將 guardrail 列表從 textarea 改為標籤式（tag input）編輯元件。

#### Scenario: 顯示現有關鍵字為標籤
- **WHEN** 防護設定分頁載入完成
- **THEN** 每個 guardrail 列表的現有關鍵字 SHALL 顯示為獨立的 chip/tag，每個 tag 帶有 × 刪除按鈕

#### Scenario: 新增關鍵字
- **WHEN** 管理員在 tag input 的輸入框中輸入文字並按 Enter
- **THEN** 系統 SHALL 將輸入文字新增為一個新 tag，輸入框清空

#### Scenario: 刪除關鍵字
- **WHEN** 管理員點擊某個 tag 的 × 按鈕
- **THEN** 該 tag SHALL 被移除

#### Scenario: 批次貼上
- **WHEN** 管理員在輸入框中貼上包含換行符號的多行文字
- **THEN** 系統 SHALL 自動依換行符號分割，每行建立一個 tag（忽略空行）

#### Scenario: 顯示項目數量
- **WHEN** guardrail 列表載入完成
- **THEN** 每個列表 SHALL 顯示目前的項目數量（如「目前共 12 個」）

#### Scenario: 儲存格式
- **WHEN** 管理員儲存防護設定分頁
- **THEN** 各 guardrail 列表 SHALL 以 JSON array 字串格式儲存到 ai_config 表（與現有格式相容）
