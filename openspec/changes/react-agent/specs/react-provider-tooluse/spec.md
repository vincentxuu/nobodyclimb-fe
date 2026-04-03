## ADDED Requirements

### Requirement: chatWithTools method
AIProvider interface SHALL 新增 `chatWithTools()` method，支援帶 tool definitions 的 LLM 呼叫。所有 provider（Workers AI、Anthropic、OpenAI、Google、GitHub Models）MUST 實作此 method。

#### Scenario: 呼叫帶 tools 的 LLM
- **WHEN** 系統呼叫 `provider.chatWithTools(messages, tools, opts)`
- **THEN** provider 將 tool definitions 轉為底層 API 格式，發送請求，回傳統一的 ToolUseResponse

### Requirement: 統一 ToolUseResponse 格式
chatWithTools() SHALL 回傳統一的 ToolUseResponse 格式，遮蔽不同 provider 的差異。

#### Scenario: LLM 要呼叫 tool
- **WHEN** LLM 回應包含 tool call
- **THEN** ToolUseResponse 包含 `{ content?: string, toolCalls: [{ id, name, input }], stopReason: 'tool_use', usage: { input, output } }`

#### Scenario: LLM 直接回答
- **WHEN** LLM 回應不包含 tool call
- **THEN** ToolUseResponse 包含 `{ content: string, toolCalls: [], stopReason: 'end_turn', usage: { input, output } }`

### Requirement: Workers AI function calling adapter
系統 SHALL 實作 Workers AI 的 function calling adapter，處理其特有的 tool_use 格式。

#### Scenario: Workers AI tool call 解析
- **WHEN** Workers AI 回傳 function calling 格式的回應
- **THEN** adapter 將其轉換為統一的 ToolUseResponse 格式

### Requirement: Anthropic tool_use adapter
系統 SHALL 實作 Anthropic 的 tool_use adapter，處理其 content blocks 格式。

#### Scenario: Anthropic tool_use 解析
- **WHEN** Anthropic API 回傳包含 `type: 'tool_use'` content blocks 的回應
- **THEN** adapter 將 content blocks 轉換為統一的 ToolUseResponse 格式

### Requirement: OpenAI function calling adapter
系統 SHALL 實作 OpenAI 的 function calling adapter，處理其 tool_calls + JSON string arguments 格式。

#### Scenario: OpenAI function calling 解析
- **WHEN** OpenAI API 回傳包含 `tool_calls[].function.arguments` (JSON string) 的回應
- **THEN** adapter 解析 arguments JSON string 並轉換為統一的 ToolUseResponse 格式

### Requirement: Google function calling adapter
系統 SHALL 實作 Google AI 的 function calling adapter。

#### Scenario: Google function calling 解析
- **WHEN** Google AI API 回傳 function call 格式的回應
- **THEN** adapter 將其轉換為統一的 ToolUseResponse 格式

### Requirement: GitHub Models function calling adapter
系統 SHALL 實作 GitHub Models 的 function calling adapter。GitHub Models 使用 OpenAI 相容 API，adapter 可大部分複用 OpenAI adapter。

#### Scenario: GitHub Models function calling 解析
- **WHEN** GitHub Models API 回傳 OpenAI 相容格式的 function calling 回應
- **THEN** adapter 將其轉換為統一的 ToolUseResponse 格式

#### Scenario: GitHub Models endpoint 差異
- **WHEN** 系統使用 GitHub Models provider
- **THEN** 系統使用 GitHub Models 的 API endpoint（https://models.github.ai/inference）和 GitHub token 認證，而非 OpenAI endpoint

### Requirement: Retry with Exponential Backoff
chatWithTools() SHALL 在可重試的錯誤上自動重試，最多 2 次，使用 exponential backoff + jitter。

#### Scenario: 暫時性錯誤重試成功
- **WHEN** provider API 回傳 HTTP 502
- **THEN** 系統等待 1s + random(0-500ms) 後重試
- **THEN** 重試成功時回傳正常 ToolUseResponse

#### Scenario: 重試 2 次後仍失敗
- **WHEN** provider API 連續 3 次回傳 5xx 錯誤
- **THEN** 系統觸發 fallback provider（如有配置）
- **THEN** fallback provider 也失敗時，拋出錯誤讓 engine 處理

#### Scenario: 可重試的錯誤類型
- **WHEN** provider API 回傳 HTTP 429（rate limit）、500、502、503、504，或 network timeout / connection refused
- **THEN** 系統判定為可重試，執行 backoff 重試

#### Scenario: 不可重試的錯誤
- **WHEN** provider API 回傳 HTTP 400、401、403、413
- **THEN** 系統不重試，直接觸發 fallback 或拋出錯誤

#### Scenario: Backoff 時間計算
- **WHEN** 第 N 次重試（N=1,2）
- **THEN** 等待時間為 `2^(N-1) * 1000 + random(0, 500)` 毫秒

### Requirement: Provider Fallback Chain
系統 SHALL 在 provider API 呼叫最終失敗（重試耗盡）時，自動切換到 ModelConfig 中配置的 fallback provider。

#### Scenario: 主要 provider 失敗，fallback 成功
- **WHEN** Workers AI API 重試耗盡仍然失敗，且 ModelConfig 配置了 `fallback: { provider: 'github', model: 'gpt-4o-mini' }`
- **THEN** 系統使用 fallback 配置呼叫 GitHub Models API
- **THEN** 在 Langfuse span 標記 `fallback: true` 和原始 provider 名稱

#### Scenario: Fallback chain 多層
- **WHEN** fallback provider 也失敗，且 fallback 的 ModelConfig 也有 fallback 配置
- **THEN** 系統繼續嘗試下一層 fallback

#### Scenario: 無 fallback 配置
- **WHEN** provider API 失敗且 ModelConfig 未配置 fallback
- **THEN** 系統拋出錯誤，由 engine 的 tool 錯誤處理機制接管（包成 is_error tool_result）

#### Scenario: Fallback 不影響 token 追蹤
- **WHEN** fallback 觸發且成功
- **THEN** token 用量記錄在實際執行的 fallback provider + model 下，不記在原始配置下

### Requirement: Circuit Breaker
系統 SHALL 為每個 provider 維護 circuit breaker 狀態，連續失敗超過閾值時短時間內跳過該 provider。

#### Scenario: 正常狀態（CLOSED）
- **WHEN** provider 運作正常
- **THEN** circuit breaker 狀態為 CLOSED，所有請求正常發送

#### Scenario: 觸發熔斷（CLOSED → OPEN）
- **WHEN** 同一 provider 連續失敗 >= 3 次（含 retry 後仍失敗）
- **THEN** circuit breaker 狀態切換為 OPEN
- **THEN** 後續請求直接跳過該 provider，走 fallback，不嘗試 retry

#### Scenario: 冷卻後試探（OPEN → HALF_OPEN）
- **WHEN** circuit breaker 處於 OPEN 狀態超過 30 秒
- **THEN** 狀態切換為 HALF_OPEN，允許下一個請求試探

#### Scenario: 試探成功（HALF_OPEN → CLOSED）
- **WHEN** HALF_OPEN 狀態下的試探請求成功
- **THEN** 狀態切換回 CLOSED，恢復正常使用
- **THEN** 連續失敗計數器歸零

#### Scenario: 試探失敗（HALF_OPEN → OPEN）
- **WHEN** HALF_OPEN 狀態下的試探請求失敗
- **THEN** 狀態切換回 OPEN，重新開始 30 秒冷卻

#### Scenario: Circuit breaker 狀態存儲
- **WHEN** 系統管理 circuit breaker 狀態
- **THEN** 狀態存於 in-memory（Workers isolate 級別），不跨 request 持久化

### Requirement: Tool result 回傳格式
系統 SHALL 將 tool execution 結果轉為 LLM 可讀的 tool_result message 格式。

#### Scenario: 正常結果
- **WHEN** tool 執行成功
- **THEN** 系統將結果包裝為 `{ role: 'tool', tool_use_id, content: formattedResult }`

#### Scenario: 錯誤結果
- **WHEN** tool 執行失敗
- **THEN** 系統將錯誤包裝為 `{ role: 'tool', tool_use_id, content: errorMessage, is_error: true }`
