## ADDED Requirements

### Requirement: Tool Selection 信心分數
`tool-selection` step SHALL 在 Tool Calling LLM 呼叫的輸出 JSON 中新增 `confidence` 欄位（0.0-1.0），表示對工具選擇的信心程度。

#### Scenario: LLM 回傳包含 confidence 的 JSON
- **WHEN** Tool Calling LLM 解析查詢意圖
- **THEN** 輸出 JSON 包含 `"confidence": 0.0-1.0` 欄位，與現有 `tool`、`query_type`、`params` 並列

#### Scenario: confidence 欄位缺失時使用預設值
- **WHEN** LLM 回傳的 JSON 未包含 `confidence` 欄位
- **THEN** 系統預設 `confidence = 1.0`（向後相容，視為完全信心），不阻斷流程

#### Scenario: confidence 值為非數字時使用預設值
- **WHEN** LLM 回傳的 `confidence` 值為非數字（如 `"high"`、`null`、`true`）
- **THEN** 系統預設 `confidence = 1.0`，不阻斷流程

#### Scenario: confidence 值超出範圍時 clamp 至合法區間
- **WHEN** LLM 回傳的 `confidence` 值為數字但超出 0.0-1.0 範圍（如 `1.5` 或 `-0.3`）
- **THEN** 系統將值 clamp 至 `[0.0, 1.0]`（`Math.max(0, Math.min(1, value))`）

#### Scenario: confidence 記錄至 trace
- **WHEN** Tool Selection 完成
- **THEN** `trace.query_parsing` 記錄 `confidence` 欄位值（含 fallback 後的最終值）

### Requirement: 低信心三層 fallback
`tool-selection` step SHALL 根據 Tool Selection 信心分數實施三層 fallback 策略，平衡檢索品質與資源使用。

#### Scenario: 高信心時直接使用選中工具
- **WHEN** `confidence >= 0.8`
- **THEN** 系統正常使用 LLM 選中的工具和參數，不做任何調整

#### Scenario: 中等信心時啟用空結果 fallback
- **WHEN** `tool_confidence_threshold <= confidence < 0.8`（`tool_confidence_threshold` 預設 0.7）
- **THEN** 系統使用 LLM 選中的工具，但設定 `ctx.fallbackEnabled = true`——若檢索結果為空，自動切換到 `ctx.alternativeTool`

#### Scenario: 低信心時降級為 general_knowledge
- **WHEN** `confidence < tool_confidence_threshold` 且 LLM 選中的工具非 `general_knowledge`
- **THEN** 系統覆寫工具選擇為 `general_knowledge`，設定 `ctx.queryType = 'general-knowledge'`，並在 trace 記錄 `confidence_fallback: true` 和 `original_tool`

#### Scenario: general_knowledge 工具不受信心閾值影響
- **WHEN** LLM 選中 `general_knowledge` 且 `confidence < tool_confidence_threshold`
- **THEN** 系統仍使用 `general_knowledge`（已是最低級別路由，無需再降級）

#### Scenario: 安全網 regex 優先於信心 fallback
- **WHEN** 個人查詢 regex 或 SQL 計數 regex 命中
- **THEN** 系統使用 regex 推斷的工具，跳過信心 fallback 邏輯（regex 是確定性判斷，優先於 LLM 信心）

### Requirement: Tool Selection 信心閾值可配置
系統 SHALL 透過 `ai_config` 表提供 `tool_confidence_threshold` 參數，管理員可即時調整。

#### Scenario: 管理員調整信心閾值
- **WHEN** 管理員將 `tool_confidence_threshold` 從 0.7 調整為 0.5
- **THEN** 後續查詢使用新閾值 0.5 判斷是否觸發 fallback

## MODIFIED Requirements

### Requirement: 查詢類型分類
系統 SHALL 將每個查詢分類為 `simple`、`complex`、`general-knowledge`、`sql`、`hybrid`、`clarification-needed` 六種類型之一，並以此決定後續 pipeline 路由。分類邏輯整合於 `tool-selection` pipeline step 的 Tool Calling LLM 呼叫中，由 TOOL_SELECTION_PROMPT 的輸出 schema 輸出 `query_type` 和 `confidence` 欄位。`tool-selection` step 設定 `ctx.queryType` 後，engine 的 `skipWhen` 條件路由自動跳過不相關的 step。低信心分類（`confidence < tool_confidence_threshold`）SHALL 自動降級為 `general-knowledge` 類型。

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

#### Scenario: 低信心分類自動降級
- **WHEN** LLM 分類為 `search_routes`（`ctx.queryType = 'simple'`）但 `confidence = 0.4`（低於 `tool_confidence_threshold` 預設 0.7）
- **THEN** `tool-selection` step 覆寫 `ctx.queryType = 'general-knowledge'`，使用輕量模型直接回答，trace 記錄 `confidence_fallback: true` 和原始分類 `original_tool: 'search_routes'`

#### Scenario: 中等信心分類啟用 fallback
- **WHEN** LLM 分類為 `search_routes` 但 `confidence = 0.75`（介於 `tool_confidence_threshold` 和 0.8 之間）
- **THEN** `tool-selection` step 使用 `search_routes` 但設定 `ctx.fallbackEnabled = true`，若後續檢索結果為空則自動切換至備選工具
