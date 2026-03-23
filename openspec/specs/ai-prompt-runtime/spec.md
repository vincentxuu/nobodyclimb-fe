## ADDED Requirements

### Requirement: Prompt 載入函數
後端 SHALL 提供 `loadPrompts(db)` 函數，從 `ai_prompts` 表讀取所有 active 狀態的 prompt，回傳 prompt name 到 content 的對應表。

#### Scenario: 讀取 active prompts
- **WHEN** `loadPrompts(db)` 被呼叫
- **THEN** 函數 SHALL 執行 `SELECT name, content FROM ai_prompts WHERE status = 'active'`，回傳 `Record<string, string>` 格式（key 為 prompt name，value 為 content）

#### Scenario: 同名多版本只取 active
- **WHEN** ai_prompts 表中同一 name 有多個版本
- **THEN** 函數 SHALL 只回傳 status = 'active' 的版本內容

#### Scenario: 無自訂 prompt 時回傳空物件
- **WHEN** ai_prompts 表無任何 active 記錄
- **THEN** 函數 SHALL 回傳空物件 `{}`，呼叫端使用 fallback 預設值

### Requirement: Prompt 使用 fallback 機制
Query service SHALL 優先使用 DB 中的 active prompt，若不存在則 fallback 到 `ai-prompts.ts` 的硬編碼常數。

#### Scenario: 使用 DB 中的自訂 prompt
- **WHEN** `loadPrompts` 回傳的物件中包含 `system_prompt` key
- **THEN** pipeline 的 Stage 8 generation SHALL 使用該 DB 內容作為 system prompt，而非硬編碼的 SYSTEM_PROMPT 常數

#### Scenario: Fallback 到硬編碼預設
- **WHEN** `loadPrompts` 回傳的物件中不包含 `tool_selection_prompt` key
- **THEN** pipeline 的 Stage 1a tool calling SHALL 使用硬編碼的 TOOL_SELECTION_PROMPT 常數

#### Scenario: 所有 10 個 prompt 皆支援 fallback
- **WHEN** pipeline 執行各階段
- **THEN** 以下 10 個 prompt 皆 SHALL 支援 DB 優先 + 硬編碼 fallback：system_prompt、tool_selection_prompt、general_knowledge_system_prompt、hyde_prompt、judge_prompt、self_reflection_prompt、contextual_chunk_prompt、multi_query_expansion_prompt、agentic_decision_prompt、query_template

### Requirement: Prompt 載入與 config 並行
系統 SHALL 將 `loadPrompts(db)` 與 `loadPipelineConfig(db)` 並行執行，不增加查詢延遲。

#### Scenario: 並行載入
- **WHEN** `processQuery()` 或 `processStreamingQuery()` 被呼叫
- **THEN** `loadPrompts(db)` 與 `loadPipelineConfig(db)` SHALL 透過 `Promise.all` 並行執行

#### Scenario: loadPrompts 失敗不影響查詢
- **WHEN** `loadPrompts(db)` 拋出異常（如 DB 連線錯誤）
- **THEN** 系統 SHALL catch 異常，所有 prompt 皆 fallback 到硬編碼預設值，查詢流程正常繼續

### Requirement: Prompt 變數替換
系統 SHALL 在使用 prompt 時正確替換變數佔位符。

#### Scenario: 替換成功
- **WHEN** prompt 內容包含 `{query}` 且呼叫端提供 query 值
- **THEN** 系統 SHALL 將 `{query}` 替換為實際的 query 文字

#### Scenario: 變數替換失敗 fallback
- **WHEN** 自訂 prompt 內容格式異常導致變數替換後結果明顯錯誤（如替換後內容為空）
- **THEN** 系統 SHALL fallback 使用硬編碼預設 prompt 進行該階段處理

### Requirement: API 支援 name 篩選
`GET /admin/ai/prompts` 端點 SHALL 支援 `name` query parameter，回傳指定 prompt 的所有版本。

#### Scenario: 依 name 篩選版本
- **WHEN** 管理員呼叫 `GET /admin/ai/prompts?name=system_prompt`
- **THEN** API SHALL 回傳 name = 'system_prompt' 的所有版本（包含 active 和 archived），按 version 降序排列

#### Scenario: 不帶 name 回傳所有 prompt
- **WHEN** 管理員呼叫 `GET /admin/ai/prompts`（不帶 name 參數）
- **THEN** API SHALL 回傳所有 prompt 記錄，維持現有行為

### Requirement: 建立新版本自動歸檔舊版本
`POST /admin/ai/prompts` 端點 SHALL 在建立新版本時自動將同名舊版本設為 archived。

#### Scenario: 自動歸檔
- **WHEN** 管理員呼叫 `POST /admin/ai/prompts` 建立 name = 'system_prompt' 的新版本
- **THEN** 系統 SHALL 先將 ai_prompts 表中所有 name = 'system_prompt' 且 status = 'active' 的記錄更新為 status = 'archived'，再插入新記錄（status = 'active'）

#### Scenario: 首次建立不影響
- **WHEN** ai_prompts 表中無 name = 'hyde_prompt' 的記錄，管理員建立新版本
- **THEN** 系統 SHALL 直接插入新記錄，不執行歸檔操作
