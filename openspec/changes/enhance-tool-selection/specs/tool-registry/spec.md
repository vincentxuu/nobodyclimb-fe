## ADDED Requirements

### Requirement: ToolRegistry 類別
系統 SHALL 提供 `ToolRegistry` 類別（`backend/src/services/tool-registry.ts`），以統一管理所有 RAG 工具的 metadata。ToolRegistry SHALL 提供以下方法：
- `register(tool: RAGToolDefinition): void` — 註冊工具
- `get(name: string): RAGToolDefinition | undefined` — 取得單一工具定義
- `getAll(): RAGToolDefinition[]` — 取得所有已註冊工具
- `getValidToolNames(): string[]` — 取得所有合法工具名稱（用於 LLM 輸出驗證）
- `generatePromptBlock(): string` — 動態生成 TOOL_SELECTION_PROMPT 的工具描述區塊

#### Scenario: 註冊並取得工具
- **WHEN** 呼叫 `registry.register({ name: 'search_routes', ... })` 後呼叫 `registry.get('search_routes')`
- **THEN** 回傳對應的 `RAGToolDefinition` 物件

#### Scenario: 取得不存在的工具
- **WHEN** 呼叫 `registry.get('nonexistent')`
- **THEN** 回傳 `undefined`

#### Scenario: 取得所有合法工具名稱
- **WHEN** 註冊 5 個工具後呼叫 `registry.getValidToolNames()`
- **THEN** 回傳 `['search_routes', 'search_crags', 'general_knowledge', 'search_sql', 'hybrid']`

### Requirement: RAGToolDefinition 介面
每個 RAG 工具 SHALL 以 `RAGToolDefinition` 介面定義，包含以下欄位：
- `name: string` — 工具識別名（kebab 或 snake_case）
- `displayName: string` — 管理介面顯示名稱
- `description: string` — 工具描述文字（注入 prompt 使用）
- `triggerSignals: string[]` — 觸發信號詞列表（如 `['有幾條', '幾條路線']`）
- `parameters: ToolParameter[]` — 支援的參數定義
- `queryType: string` — 對應的 pipeline queryType（如 `'simple'`、`'sql'`）
- `llmModel: 'main' | 'lightweight'` — 此工具使用的模型層級

#### Scenario: 工具定義包含完整 metadata
- **WHEN** 定義 `search_sql` 工具
- **THEN** `RAGToolDefinition` SHALL 包含 name=`'search_sql'`、queryType=`'sql'`、llmModel=`'lightweight'`，以及至少 3 個 triggerSignals

### Requirement: 動態 Prompt 生成
`generatePromptBlock()` SHALL 從所有已註冊工具動態生成格式化的**工具描述文字區塊**。此方法**僅負責工具列表描述**，不包含 `TOOL_SELECTION_PROMPT` 中的規則邏輯區塊（選擇規則、判斷信號、query_type 規則）和模板變數（`{crags}`、`{areas}`、`{regions}`、`{query}`）。生成的文字 SHALL 包含每個工具的 name、description、triggerSignals、parameters（含 enum 值）。每個工具的描述格式 SHALL 包含：工具編號、名稱、用途描述、適用信號詞列表、可用參數及其說明。輸出格式 SHALL 與現有 `TOOL_SELECTION_PROMPT` 中的工具描述結構等效，確保 LLM 可正確解析。

#### Scenario: 動態生成等效於現有靜態 prompt 的工具描述區塊
- **WHEN** 註冊現有 5 個工具後呼叫 `generatePromptBlock()`
- **THEN** 輸出的工具描述文字涵蓋所有 5 個工具的 name、description、可用 params、enum 值和觸發信號，格式與現有 TOOL_SELECTION_PROMPT 中靜態寫死的工具描述區塊等效

#### Scenario: 新增工具後 prompt 自動包含
- **WHEN** 額外註冊一個新工具 `popularity_search` 後呼叫 `generatePromptBlock()`
- **THEN** 輸出的文字 SHALL 包含 6 個工具的描述（含新增的 `popularity_search`）

#### Scenario: 生成結果不含規則邏輯和模板變數
- **WHEN** 呼叫 `generatePromptBlock()`
- **THEN** 輸出 SHALL 不包含 `{crags}`、`{areas}`、`{regions}`、`{query}` 等佔位符，也不包含選擇規則和 query_type 判斷邏輯

### Requirement: 現有工具遷移
系統 SHALL 將現有 5 個工具（`search_routes`、`search_crags`、`general_knowledge`、`search_sql`、`hybrid`）遷移至 ToolRegistry 註冊。遷移後 `TOOL_SELECTION_PROMPT` SHALL 使用 `{tools}` 佔位符，由 `generatePromptBlock()` 在執行時填入。

#### Scenario: 遷移後 Tool Selection 行為不變
- **WHEN** 將 5 個工具遷移至 ToolRegistry 後，對相同查詢執行 Tool Selection
- **THEN** LLM 選擇的工具 SHALL 與遷移前一致（功能等效）

### Requirement: ToolParameter 介面
每個工具參數 SHALL 以 `ToolParameter` 介面定義，包含：
- `name: string` — 參數名稱（如 `'crag_name'`）
- `description: string` — 參數說明
- `required: boolean` — 是否必填
- `enum?: string[]` — 可選值列表（如 route_type 的 `['sport', 'trad', 'boulder', 'mixed']`）

#### Scenario: 參數定義用於 prompt 生成
- **WHEN** 工具 `search_routes` 定義含 `{ name: 'crag_name', description: '岩場名稱', required: false }` 參數
- **THEN** `generatePromptBlock()` 的輸出 SHALL 包含 `crag_name` 參數說明
