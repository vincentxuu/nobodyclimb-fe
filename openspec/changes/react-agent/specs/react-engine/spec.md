## ADDED Requirements

### Requirement: 查詢分類快速路徑
系統 SHALL 在 ReAct loop 前執行規則式查詢分類，閒聊和通用知識問題跳過 orchestrator，直接回應。

#### Scenario: 打招呼
- **WHEN** 用戶輸入匹配打招呼 pattern（「你好」「嗨」「hello」等）
- **THEN** 系統回傳固定歡迎訊息，0 LLM call，不進 ReAct loop

#### Scenario: 系統問題
- **WHEN** 用戶輸入匹配系統問題 pattern（「你是誰」「你會什麼」「功能介紹」等）
- **THEN** 系統回傳固定功能介紹訊息，0 LLM call

#### Scenario: 通用攀岩知識
- **WHEN** 用戶輸入匹配通用知識 pattern（「難度分級」「什麼是 flash」「RP 是什麼意思」等）且不包含特定岩場/路線/用戶相關關鍵字
- **THEN** 系統使用 ModelMap 的 hyde 觸點（小模型）直接回答，不進 ReAct loop
- **THEN** 成本記錄在 hyde 觸點，不記在 orchestrator

#### Scenario: 分類為需要資料查詢
- **WHEN** 用戶輸入包含岩場名稱、路線名稱、天氣、推薦、個人化等關鍵字
- **THEN** 分類為「需要 tool」，正常進入 ReAct loop

#### Scenario: 分類不確定
- **WHEN** 規則式分類無法明確判斷
- **THEN** 預設進入 ReAct loop（寧可多花一次 orchestrator call，不可漏回答）

### Requirement: ReAct loop 核心執行
系統 SHALL 實作 ReAct（Reason-Act-Observe）迴圈，透過 LLM tool_use API 動態選擇工具、執行、觀察結果，直到 LLM 決定生成最終回答或達到上限。

#### Scenario: 簡單問題直接回答
- **WHEN** 用戶提問一個簡單的通用知識問題（如「攀岩的難度分級有哪些？」）
- **THEN** LLM 在第一輪直接生成回答，不呼叫任何 tool（0 tool calls）

#### Scenario: 單工具查詢
- **WHEN** 用戶提問需要單一資料源的問題（如「龍洞有哪些 5.10 的路線？」）
- **THEN** LLM 呼叫一個 tool（如 search_routes），觀察結果後生成回答

#### Scenario: 多工具組合查詢
- **WHEN** 用戶提問需要多個資料源的問題（如「龍洞最近適合去嗎？有什麼適合我的路線？」）
- **THEN** LLM 跨多輪呼叫多個 tool（如 weather + user_profile + search_routes），組合結果生成回答

#### Scenario: 一次呼叫多個 tool
- **WHEN** LLM 在單一回應中返回多個 tool_use blocks
- **THEN** 系統根據各 tool 的 concurrencySafe 宣告，並行執行 safe tools（Promise.all），串行執行 unsafe tools（按回傳順序依次執行）

### Requirement: Turn 計算與上限守衛
系統 SHALL 強制 maxTurns 上限（從 config 讀取），1 turn = 1 次 orchestrator LLM call（無論呼叫幾個 tool）。

#### Scenario: 達到 maxTurns
- **WHEN** ReAct loop 的 orchestrator LLM call 次數達到 maxTurns（預設 3）
- **THEN** 系統停止迴圈，用累積的 tool results 作為 context 請 LLM 生成最終回答

#### Scenario: 一輪多 tool 不增加 turn 數
- **WHEN** LLM 在 turn 1 同時呼叫 search_routes + weather + user_profile
- **THEN** 此次算 1 turn，不算 3 turn

### Requirement: Token budget 守衛
系統 SHALL 追蹤累計 token 使用量，超過 budget 時停止迴圈。Token budget 優先於 maxTurns。

#### Scenario: 達到 token budget
- **WHEN** 累計 input + output tokens 超過設定的 tokenBudget（預設 8000）
- **THEN** 系統停止迴圈，用已有結果生成回答

### Requirement: 守衛優先順序
系統 SHALL 按以下順序檢查守衛：semantic_cache → embedding_cache → input_guard →（進入 loop）→ tool_result_cache → token_budget → maxTurns → end_turn。

#### Scenario: 多個守衛同時觸發
- **WHEN** token budget 和 maxTurns 同時在某輪達到
- **THEN** 系統以 token_budget 為優先原因停止（因為 token 花光比輪數到更緊急）

### Requirement: Tool 錯誤不中斷迴圈 + 重複失敗保護
系統 SHALL 在 tool 執行失敗時將錯誤包裝為 `is_error: true` 的 tool_result 送回 LLM，迴圈繼續。同一個 tool 連續失敗 2 次時，自動從當次可用 tool 列表移除。

#### Scenario: Tool 執行失敗
- **WHEN** 某個 tool 的 execute() 拋出 error
- **THEN** 系統捕獲 error，包裝成 `{ is_error: true, content: error.message }` 送回 LLM
- **THEN** LLM 可根據錯誤訊息選擇其他 tool 或直接回答，迴圈不中斷

#### Scenario: 同一 tool 連續失敗
- **WHEN** search_routes 在 turn 1 失敗，LLM 在 turn 2 再次呼叫 search_routes 又失敗
- **THEN** 系統在 turn 2 的 tool_result 中附加「此 tool 已連續失敗 2 次，建議使用其他 tool」
- **THEN** 後續 turn 的 tool 列表中暫時移除 search_routes

### Requirement: 防禦性 tool_use 解析
系統 SHALL 對 LLM 回傳的 tool_use blocks 做 robust parsing，處理各 provider 可能的格式不一致。

#### Scenario: 格式不標準的 tool call
- **WHEN** LLM 回傳的 tool call 格式不標準（如 input 是 JSON string 而非 object、tool name 有多餘空格、JSON 被 markdown 包裹）
- **THEN** 系統嘗試多種解析策略修正格式
- **THEN** 全部解析失敗時視為 end_turn，用已有結果生成回答

### Requirement: Semantic cache 前置檢查（區分 strategy）
系統 SHALL 在進入 ReAct loop 前檢查 semantic cache，cache key 包含 rag_strategy 標籤。

#### Scenario: Cache 命中
- **WHEN** 用戶查詢的向量相似度超過快取閾值且 strategy 標籤為 'react'
- **THEN** 系統直接回傳快取的回答，不進入 ReAct loop

#### Scenario: 不同 strategy 的快取不互通
- **WHEN** 同一查詢在 baseline strategy 已有快取
- **THEN** react strategy 不會命中該快取，會正常進入 ReAct loop

### Requirement: Embedding cache
系統 SHALL 在執行 embedding 前檢查 cache，避免同一文字被重複向量化。

#### Scenario: Embedding cache 命中
- **WHEN** 系統需要 embed 一段文字，且 `cache.get('embedding', hash(text + model))` 命中
- **THEN** 直接使用快取的向量，不呼叫 embedding API

#### Scenario: Embedding cache miss
- **WHEN** cache miss
- **THEN** 呼叫 embedding API，將結果寫入 cache，TTL 為 24 小時

#### Scenario: 不同 model 的 embedding 不互通
- **WHEN** 同一文字使用不同 embedding model
- **THEN** cache key 包含 model 名稱，不會命中不同 model 的快取

### Requirement: Tool result cache
系統 SHALL 在 tool execute() 前檢查 cache，相同參數的 tool 呼叫直接回傳快取結果。

#### Scenario: Tool result cache 命中
- **WHEN** engine 準備執行 tool，且 `cache.get('tool:{name}', hash(params))` 命中
- **THEN** 跳過 execute()，直接使用快取的 ToolResult
- **THEN** 在 Langfuse span 標記 `cache: hit`

#### Scenario: Tool result cache miss
- **WHEN** cache miss
- **THEN** 正常執行 tool，將 formatResult() 的結果寫入 cache
- **THEN** TTL 由各 tool 的 `cacheTTL` 欄位決定

#### Scenario: Per-tool TTL 配置
- **WHEN** 系統初始化 tool result cache
- **THEN** 各 tool 的 TTL SHALL 為：
  - `weather`: 1800 秒（30 分鐘）
  - `crag_info`: 21600 秒（6 小時）
  - `search_crags`: 21600 秒（6 小時）
  - `search_routes`: 3600 秒（1 小時）
  - `user_profile`: 600 秒（10 分鐘）
  - `recommend`: 300 秒（5 分鐘）
  - `sql_query`: 300 秒（5 分鐘）

#### Scenario: Cache 不影響錯誤的 tool result
- **WHEN** tool execute() 拋出 error（is_error: true）
- **THEN** 錯誤結果不寫入 cache

### Requirement: 用戶記憶注入
系統 SHALL 在 ReAct loop 啟動前載入用戶記憶，注入 orchestrator 的 system prompt。

#### Scenario: 載入記憶與攀登紀錄
- **WHEN** runReactAgent() 初始化
- **THEN** 系統並行載入 `getMemoriesSummary(userId, db)` 和 `getRecentAscents(userId, db)`
- **THEN** 將 memorySummary、ascentContext、abilityLevel 注入 orchestrator system prompt（複用現有 `buildPersonalizedSystemPrompt()` 邏輯）

#### Scenario: 記憶影響 LLM 的 tool 選擇
- **WHEN** system prompt 包含 `preferred_crag: 龍洞` 且用戶問「有什麼適合我的路線？」
- **THEN** LLM 可自行決定是否在 search_routes 的 crag 參數填入「龍洞」
- **THEN** 記憶僅作為 LLM 的參考，不由 tool 自動套用

### Requirement: 非同步記憶提取
系統 SHALL 在 ReAct loop 結束後，非同步從用戶查詢中提取記憶，不阻塞回應。

#### Scenario: 提取記憶
- **WHEN** ReAct loop 產生最終回答後
- **THEN** 系統以 `waitUntil()` 非同步執行 `extractMemoriesFromQuery()`（複用現有 memory-extractor 邏輯）
- **THEN** 不等待提取完成，直接回傳回答給用戶

### Requirement: 漸進式回應（Progress Events）
系統 SHALL 在 tool 執行階段透過 SSE 推送進度事件，讓前端顯示即時狀態。

#### Scenario: Tool 開始執行
- **WHEN** engine 準備執行某個 tool
- **THEN** 系統送出 SSE event `{ type: 'progress', tool: toolName, status: 'executing' }`

#### Scenario: Tool 執行完成
- **WHEN** tool execute() 完成（成功或失敗）
- **THEN** 系統送出 SSE event `{ type: 'progress', tool: toolName, status: 'done' }`

#### Scenario: 並行 tool 的 progress
- **WHEN** LLM 一次呼叫多個 concurrencySafe tool（如 weather + search_routes + user_profile）
- **THEN** 系統在各 tool 開始前各送一個 executing event，完成時各送一個 done event
- **THEN** 前端可同時顯示多個進行中的狀態

#### Scenario: Cache 命中不送 progress
- **WHEN** tool result cache 命中，跳過 execute()
- **THEN** 不送 progress event（因為瞬間完成，送了反而閃爍）

#### Scenario: 0 tool call 不送 progress
- **WHEN** LLM 第一輪直接回答，不呼叫任何 tool
- **THEN** 不送任何 progress event，直接進入 streaming 最終回答

### Requirement: 最後一輪 streaming
系統 SHALL 在 LLM 生成最終回答時支援 streaming（token-by-token），但 tool 執行階段不 streaming。「最後一輪」定義為 LLM 回應的 stopReason = end_turn 且不包含 tool_use blocks。

#### Scenario: Streaming 最終回答
- **WHEN** LLM 決定不再呼叫 tool（stopReason = end_turn，無 tool_use blocks）且 streaming 模式啟用
- **THEN** 系統以 SSE 串流方式逐 token 回傳最終回答，複用現有 ai streaming SSE 格式
