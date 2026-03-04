## ADDED Requirements

### Requirement: 查詢類型分類
系統 SHALL 將每個查詢分類為 `simple`、`complex`、`general-knowledge` 三種類型之一，並以此決定後續 pipeline 路由。分類邏輯整合於現有 Tool Calling（LLM A）呼叫中，由 TOOL_SELECTION_PROMPT 的輸出 schema 新增 `query_type` 欄位。

#### Scenario: 分類簡單 lookup 查詢
- **WHEN** 查詢為「龍洞有哪些 5.10 的路線」
- **THEN** 分類器輸出 `query_type = 'simple'`

#### Scenario: 分類複雜比較推薦查詢
- **WHEN** 查詢為「幫我比較台中幾個岩場的特色並推薦」
- **THEN** 分類器輸出 `query_type = 'complex'`

#### Scenario: 分類失敗時的 fallback
- **WHEN** Tool Calling 未輸出有效的 `query_type`
- **THEN** 系統預設使用 `query_type = 'complex'`（確保品質下限）

### Requirement: 依複雜度選擇 LLM 模型
系統 SHALL 依據 `query_type` 選擇不同的 LLM 模型進行回答生成。

#### Scenario: 簡單查詢使用輕量模型
- **WHEN** `query_type = 'simple'`
- **THEN** 系統使用 `@cf/meta/llama-3.1-8b-instruct` 生成回答

#### Scenario: 複雜查詢使用完整模型
- **WHEN** `query_type = 'complex'`
- **THEN** 系統使用 `ai_config` 表中設定的 `llm_model`（預設 `@cf/google/gemma-3-12b-it`）生成回答

#### Scenario: general-knowledge 使用輕量模型
- **WHEN** `query_type = 'general-knowledge'`
- **THEN** 系統使用 `@cf/meta/llama-3.1-8b-instruct` 生成回答

### Requirement: 依查詢類型路由 Pipeline
系統 SHALL 依據 `query_type` 決定 RAG pipeline 的執行步驟。

#### Scenario: 簡單查詢跳過 HyDE
- **WHEN** `query_type = 'simple'`
- **THEN** 系統跳過 HyDE 文件生成，僅使用 query embedding 進行單路 Vectorize 搜尋

#### Scenario: 複雜查詢執行完整 Pipeline
- **WHEN** `query_type = 'complex'`
- **THEN** 系統執行完整流程：HyDE 生成 + 雙路 Vectorize + RRF + Cross-encoder Reranking + MMR

#### Scenario: Tool Calling 輸出包含 query_type
- **WHEN** LLM A（Tool Calling）解析查詢意圖
- **THEN** 回應包含 `query_type` 欄位，與現有 `tool`、`parameters` 並列輸出
