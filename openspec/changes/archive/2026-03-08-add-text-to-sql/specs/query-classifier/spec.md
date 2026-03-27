## MODIFIED Requirements

### Requirement: 查詢類型分類
系統 SHALL 將每個查詢分類為 `simple`、`complex`、`general-knowledge`、`sql`、`hybrid`、`clarification-needed` 六種類型之一，並以此決定後續 pipeline 路由。分類邏輯整合於 `tool-selection` pipeline step 的 Tool Calling LLM 呼叫中，由 TOOL_SELECTION_PROMPT 的輸出 schema 輸出 `query_type` 欄位。`tool-selection` step 設定 `ctx.queryType` 後，engine 的 `skipWhen` 條件路由自動跳過不相關的 step。

#### Scenario: 分類簡單 lookup 查詢
- **WHEN** 查詢為「龍洞有哪些 5.10 的路線」（語義搜尋）
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'simple'`

#### Scenario: 分類複雜比較推薦查詢
- **WHEN** 查詢為「幫我比較台中幾個岩場的特色並推薦」
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'complex'`

#### Scenario: 分類計數統計查詢為 sql
- **WHEN** 查詢為「龍洞有幾條路線？」或「哪個岩場路線最多？」
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'sql'`，並設定 `ctx.sqlTemplate` 與 `ctx.sqlParams`

#### Scenario: 分類推薦型查詢為 hybrid
- **WHEN** 查詢為「推薦我幾條龍洞的初級路線」
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'hybrid'`，並設定 `ctx.sqlParams`

#### Scenario: 分類模糊查詢為 clarification-needed
- **WHEN** 查詢為「找路線」或「列出 5.11 以上的運攀路線」（未指定岩場）
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'clarification-needed'`，並設定 `ctx.clarificationType`

#### Scenario: 語義問題維持原有分類
- **WHEN** 查詢為「龍洞適合初學者嗎？」或「攀岩前要注意什麼？」
- **THEN** `tool-selection` step 設定 `ctx.queryType = 'simple'` 或 `'complex'`，不觸發 SQL 路徑

#### Scenario: 分類失敗時的 fallback
- **WHEN** Tool Calling 未輸出有效的 `query_type`
- **THEN** `tool-selection` step 預設使用 `ctx.queryType = 'complex'`（確保品質下限）

### Requirement: 依複雜度選擇 LLM 模型
系統 SHALL 依據 `ctx.queryType` 選擇不同的 LLM 模型進行回答生成。

#### Scenario: 簡單查詢使用輕量模型
- **WHEN** `ctx.queryType = 'simple'`
- **THEN** `tool-selection` step 設定 `ctx.effectiveLlmModel = '@cf/meta/llama-3.1-8b-instruct'`

#### Scenario: 複雜查詢使用完整模型
- **WHEN** `ctx.queryType = 'complex'`
- **THEN** `tool-selection` step 設定 `ctx.effectiveLlmModel` 為 `ai_config` 中的 `llm_model`（預設 `@cf/google/gemma-3-12b-it`）

#### Scenario: general-knowledge 使用輕量模型
- **WHEN** `ctx.queryType = 'general-knowledge'`
- **THEN** `tool-selection` step 設定 `ctx.effectiveLlmModel = '@cf/meta/llama-3.1-8b-instruct'`

#### Scenario: sql 查詢使用輕量 LLM 組裝回答
- **WHEN** `ctx.queryType = 'sql'`
- **THEN** `text-to-sql` step 執行 SQL 模板後，由輕量 LLM 組裝自然語言回答（非完整 RAG 生成流程）

### Requirement: 依查詢類型路由 Pipeline（透過 skipWhen 條件路由）
系統 SHALL 依據 `ctx.queryType` 透過 engine 的 `skipWhen` 條件路由決定各 pipeline step 的執行。

#### Scenario: 簡單查詢跳過 HyDE
- **WHEN** `ctx.queryType = 'simple'`
- **THEN** `hyde` step 內部業務邏輯跳過 HyDE 文件生成，僅使用 query embedding 進行單路 Vectorize 搜尋

#### Scenario: 複雜查詢執行完整 Pipeline
- **WHEN** `ctx.queryType = 'complex'`
- **THEN** pipeline 執行完整流程：所有 RAG step 正常執行

#### Scenario: sql 查詢由 text-to-sql step 處理並 earlyReturn
- **WHEN** `ctx.queryType = 'sql'`
- **THEN** `text-to-sql` step 執行 SQL 模板，設定 `ctx.earlyReturn`，pipeline 停止。後續 RAG step 不會被執行

#### Scenario: hybrid 查詢跳過 RAG retrieval step
- **WHEN** `ctx.queryType = 'hybrid'`
- **THEN** `text-to-sql` step 撈取 SQL 候選集存入 context，後續 RAG step（hyde 至 popularity-rerank）被 skipWhen 跳過，`llm-generation` step 使用 SQL 候選集作為 context 生成推薦

#### Scenario: clarification-needed 由 text-to-sql step 回傳問句
- **WHEN** `ctx.queryType = 'clarification-needed'`
- **THEN** `text-to-sql` step 組裝澄清問句，設定 `ctx.earlyReturn`，pipeline 停止

#### Scenario: Tool Calling 輸出包含 query_type
- **WHEN** LLM A（Tool Calling）解析查詢意圖
- **THEN** 回應包含 `query_type` 欄位，與現有 `tool`、`parameters` 並列輸出

## ADDED Requirements

### Requirement: SQL 路由輸出結構
`tool-selection` step SHALL 在 Tool Calling 輸出 `query_type = 'sql'` 或 `'hybrid'` 時，同時解析並設定 `ctx.sqlTemplate`（模板 ID）與 `ctx.sqlParams`（模板所需參數）。

#### Scenario: sql 路由設定模板 ID 至 context
- **WHEN** Tool Calling 將查詢分類為 `sql`
- **THEN** `tool-selection` step 設定 `ctx.sqlTemplate`（如 `'COUNT_ROUTES_AT_CRAG'`）與 `ctx.sqlParams`（如 `{ crag_name: '龍洞' }`）

#### Scenario: clarification-needed 設定分類原因至 context
- **WHEN** Tool Calling 將查詢分類為 `clarification-needed`
- **THEN** `tool-selection` step 設定 `ctx.clarificationType`（`'intent'` 或 `'missing-crag'`）
