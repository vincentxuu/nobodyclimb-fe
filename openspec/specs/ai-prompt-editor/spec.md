## ADDED Requirements

### Requirement: Prompt 管理頁面（單頁手風琴式）
系統 SHALL 在 `/admin/ai/prompts` 提供 prompt 模板管理頁面，以手風琴展開方式顯示 10 個固定的 AI pipeline prompt 模板，支援直接在頁面內瀏覽與編輯。

#### Scenario: 顯示所有 prompt 模板
- **WHEN** 管理員造訪 `/admin/ai/prompts`
- **THEN** 頁面以可展開卡片顯示 10 個固定 prompt：system_prompt、tool_selection_prompt、general_knowledge_system_prompt、hyde_prompt、judge_prompt、self_reflection_prompt、contextual_chunk_prompt、multi_query_expansion_prompt、agentic_decision_prompt、query_template

#### Scenario: 顯示各 prompt 狀態資訊
- **WHEN** 列表頁載入完成
- **THEN** 每個 prompt 項目 SHALL 顯示：中文名稱、prompt name（monospace）、目前 active 版本號（若無自訂版本則顯示「使用預設」）、最後更新時間

#### Scenario: 點擊展開內嵌編輯器
- **WHEN** 管理員點擊某個 prompt 項目
- **THEN** 該卡片展開顯示內嵌的編輯器面板（含編輯 / 歷史分頁），不導航至子頁面

### Requirement: Prompt 編輯器
系統 SHALL 在展開的 prompt 卡片內提供內嵌編輯器，讓管理員可直接修改 prompt 模板內容。

#### Scenario: 載入 prompt 內容
- **WHEN** 管理員展開某個 prompt 且該 prompt 在 ai_prompts 表有 active 版本
- **THEN** 編輯器 SHALL 顯示 DB 中的 active 版本內容

#### Scenario: 載入 prompt 預設內容
- **WHEN** 管理員展開某個 prompt 且該 prompt 在 ai_prompts 表無任何記錄
- **THEN** 編輯器 SHALL 顯示硬編碼預設內容（從 `/admin/ai/prompts/defaults` API 載入），並標示「預設模板」

#### Scenario: 編輯器元件結構
- **WHEN** prompt 展開後編輯器載入完成
- **THEN** 編輯器 SHALL 包含：上方 prompt 名稱（唯讀）與目前版本號、全寬 monospace textarea 編輯區（可調整高度）、上方的變數提示按鈕列

#### Scenario: 變數提示面板
- **WHEN** 編輯器載入完成
- **THEN** 變數面板 SHALL 顯示該 prompt 定義的所有可用變數（如 `{query}`、`{context}`），每個變數為可點擊的按鈕

#### Scenario: 點擊變數插入到編輯器
- **WHEN** 管理員點擊變數面板中的某個變數按鈕
- **THEN** 該變數文字 SHALL 插入到 textarea 的目前游標位置

### Requirement: Prompt 儲存與版本建立
系統 SHALL 在每次儲存 prompt 時建立新版本，並自動將舊版本歸檔。

#### Scenario: 儲存 prompt 變更
- **WHEN** 管理員修改 prompt 內容後點擊「儲存」
- **THEN** 系統 SHALL 調用 `POST /admin/ai/prompts` 建立新版本，新版本 status 為 active，同名舊版本自動降為 archived

#### Scenario: 儲存前變數驗證警告
- **WHEN** 管理員儲存的 prompt 內容缺少該模板定義的必要變數（如 system_prompt 不含必要的回應格式指示）
- **THEN** 系統 SHALL 顯示警告提示（如「注意：此模板缺少變數 {query}」），但不阻擋儲存

#### Scenario: 儲存成功回饋
- **WHEN** prompt 儲存成功
- **THEN** 頁面 SHALL 顯示成功訊息、更新版本號顯示，且新內容立即生效於後續 AI 查詢

### Requirement: Prompt 版本歷史
系統 SHALL 提供同一 prompt 的版本歷史列表，支援檢視與回滾。

#### Scenario: 顯示版本歷史
- **WHEN** 管理員在展開的編輯器內切換到「歷史」分頁
- **THEN** 系統 SHALL 顯示該 prompt 的所有版本列表，每筆含：版本號、狀態（active/archived）、更新時間，按版本號降序排列

#### Scenario: 預覽歷史版本內容
- **WHEN** 管理員點擊版本歷史中的某個版本
- **THEN** 系統 SHALL 顯示該版本的完整 prompt 內容（唯讀預覽）

#### Scenario: 回滾到歷史版本
- **WHEN** 管理員在歷史版本預覽中點擊「回滾到此版本」
- **THEN** 系統 SHALL 建立一個內容與該歷史版本相同的新版本，設為 active，效果等同於複製舊內容建新版本

#### Scenario: 回滾確認
- **WHEN** 管理員點擊回滾按鈕
- **THEN** 系統 SHALL 顯示確認對話框，說明即將以此版本內容建立新的 active 版本

### Requirement: Prompt 預設重置
系統 SHALL 允許管理員將 prompt 重置回硬編碼預設值。

#### Scenario: 重置為預設
- **WHEN** 管理員在展開的編輯器內點擊「重置為預設」
- **THEN** 系統 SHALL 顯示確認對話框，確認後以硬編碼預設內容建立新的 active 版本

### Requirement: Prompt 變數定義
系統 SHALL 為每個固定 prompt 定義其可用的變數清單。

#### Scenario: 各 prompt 的變數對應
- **WHEN** 系統載入 prompt 編輯器
- **THEN** 變數面板 SHALL 根據 prompt name 顯示對應變數：
  - `system_prompt`：無變數（純系統指示）
  - `tool_selection_prompt`：`{query}`、`{crags}`、`{areas}`、`{regions}`
  - `general_knowledge_system_prompt`：無變數
  - `hyde_prompt`：`{query}`
  - `judge_prompt`：`{context}`、`{query}`、`{response}`
  - `self_reflection_prompt`：`{query}`、`{answer}`
  - `contextual_chunk_prompt`：`{type}`、`{content}`
  - `multi_query_expansion_prompt`：`{query}`、`{count}`
  - `agentic_decision_prompt`：`{query}`、`{count}`、`{evidence_summary}`、`{min_docs}`、`{remaining_steps}`
  - `query_template`：`{context}`、`{query}`
