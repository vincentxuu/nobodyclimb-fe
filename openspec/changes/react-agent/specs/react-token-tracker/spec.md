## ADDED Requirements

### Requirement: Per-model token 追蹤
系統 SHALL 追蹤每個 provider + 模型組合的 token 使用量。

#### Scenario: 記錄 orchestrator token
- **WHEN** orchestrator LLM 完成一次呼叫
- **THEN** 系統記錄該 provider + 模型的 inputTokens、outputTokens、呼叫次數

#### Scenario: 記錄 tool 內部 LLM token
- **WHEN** tool 內部使用 LLM（如 hyde 用 Workers AI 8B 模型）
- **THEN** 系統記錄該觸點 provider + 模型的 token 使用量，歸類到對應的 tool call

### Requirement: Per-turn 追蹤
系統 SHALL 追蹤每一輪（turn = 1 次 orchestrator LLM call）的詳細資訊。

#### Scenario: 記錄 turn 詳情
- **WHEN** ReAct loop 完成一輪
- **THEN** 系統記錄：orchestrator token 用量、tool calls（名稱、耗時、內部 LLM token）

### Requirement: 累計統計
系統 SHALL 提供整個 query 的累計 token 統計。

#### Scenario: Query 完成後的統計
- **WHEN** ReAct loop 結束
- **THEN** 系統提供 totalInputTokens、totalOutputTokens、totalDuration、perModel 明細（含 provider 名稱）

### Requirement: Langfuse trace 整合
系統 SHALL 將 token 追蹤資訊寫入 Langfuse trace，遵循以下 span 層級結構。

#### Scenario: Langfuse span 記錄
- **WHEN** 每次 LLM 呼叫完成
- **THEN** 系統在 Langfuse trace 建立 span，包含 provider 名稱、模型名稱、token 用量、耗時
- **THEN** 層級結構為：trace(react-agent) → span(turn-N) → generation(orchestrator-call) + span(tool:name) → generation(internal-llm)
- **THEN** tool call 作為子 span 嵌套在 turn span 下

### Requirement: Provider-Level 成本追蹤（USD + TWD）
系統 SHALL 根據 provider + model 的定價表，將 token 用量換算為 USD 成本，並以匯率轉換為 TWD。

#### Scenario: 計算單次 LLM 呼叫成本
- **WHEN** orchestrator 使用 Anthropic Claude Sonnet 完成一次呼叫（1000 input + 500 output tokens）
- **THEN** 系統計算 USD 成本：(1000 * 3 + 500 * 15) / 1_000_000 = $0.0105
- **THEN** 系統計算 TWD 成本：$0.0105 * 匯率（如 32.0）= NT$0.336

#### Scenario: 免費 provider 成本為零
- **WHEN** 觸點使用 Workers AI 或 GitHub Models
- **THEN** 該觸點的 USD 和 TWD 成本均記錄為 0

#### Scenario: Query 總成本
- **WHEN** ReAct loop 結束
- **THEN** 系統提供 totalCostUSD、totalCostTWD（所有觸點的成本加總）和 perProvider 成本明細（含 USD + TWD）

#### Scenario: Fallback 成本歸屬
- **WHEN** 某觸點從 Workers AI fallback 到 Anthropic
- **THEN** 成本按 Anthropic 的定價計算（實際執行的 provider），不按 Workers AI

#### Scenario: 匯率配置
- **WHEN** 系統計算 TWD 成本
- **THEN** 從 DB 讀取 `react_usd_to_twd` 匯率（預設 32.0）
- **THEN** admin 可在 dashboard 手動更新匯率

### Requirement: 寫入 ai_query_logs
系統 SHALL 在 query 完成後將 token 統計與成本寫入 ai_query_logs。

#### Scenario: 記錄到 DB
- **WHEN** ReAct loop 結束且回答已生成
- **THEN** 系統將 totalTokens、totalCostUSD、totalCostTWD、perModel 明細（含 provider + USD/TWD 成本）、turn 數、tool call 次數、fallback 次數寫入 ai_query_logs 表
