## ADDED Requirements

### Requirement: Per-觸點 provider + 模型配置
系統 SHALL 支援每個 LLM 觸點獨立配置 provider 和模型，配置存於 DB（ai_config），可即時切換。

#### Scenario: 讀取模型配置
- **WHEN** react-agent 啟動處理 query
- **THEN** 系統從 DB 讀取 `react_models` 配置（TEXT 欄位，JSON 格式），包含以下 7 個觸點的設定：orchestrator、hyde、multiQuery、textToSql、rerank、judge、embedding，每個觸點可選擇不同的 provider（workers-ai、anthropic、openai、google、github）

#### Scenario: Admin 即時切換 provider 和模型
- **WHEN** admin 在 dashboard 修改某觸點的 provider（如從 workers-ai 改為 anthropic）和模型
- **THEN** 下一個 query 即使用新 provider + 模型，無需重新部署

#### Scenario: 混合 provider 配置
- **WHEN** admin 設定 orchestrator 用 github/gpt-4o，hyde 用 workers-ai/@cf/meta/llama-3.1-8b-instruct，judge 用 anthropic/claude-sonnet-4-20250514
- **THEN** 系統在 orchestrator 呼叫時使用 GitHub Models provider，在 hyde 呼叫時使用 Workers AI provider，在 judge 呼叫時使用 Anthropic provider

### Requirement: ModelConfig 結構
每個觸點的 ModelConfig SHALL 包含 provider、model 名稱、可選的 temperature 和 maxTokens、及可選的 fallback 備援配置。

#### Scenario: 完整配置
- **WHEN** 系統讀取 `react_models.orchestrator`
- **THEN** 取得 `{ provider: "workers-ai", model: "@cf/meta/llama-4-scout-17b-16e-instruct", temperature: 0.7, maxTokens: 4096 }`

#### Scenario: Anthropic provider 配置
- **WHEN** 系統讀取 `react_models.orchestrator` 且 provider 為 anthropic
- **THEN** 取得 `{ provider: "anthropic", model: "claude-sonnet-4-20250514", temperature: 0.7, maxTokens: 4096 }`

#### Scenario: 帶 fallback 的配置
- **WHEN** 系統讀取 orchestrator 配置
- **THEN** 取得 `{ provider: "workers-ai", model: "llama-4-scout", fallback: { provider: "github", model: "gpt-4o-mini", fallback: { provider: "anthropic", model: "claude-haiku" } } }`
- **THEN** 失敗時按 Workers AI → GitHub Models → Anthropic 順序嘗試

### Requirement: 預設模型配置
系統 SHALL 提供具體的預設模型配置，DB 無設定時使用預設值。

#### Scenario: DB 無 react_models 設定
- **WHEN** ai_config 中未設定 react_models
- **THEN** 系統使用以下預設配置：
  - orchestrator: `workers-ai / @cf/meta/llama-4-scout-17b-16e-instruct`
  - hyde: `workers-ai / @cf/meta/llama-3.1-8b-instruct`
  - multiQuery: `workers-ai / @cf/meta/llama-3.1-8b-instruct`
  - textToSql: `workers-ai / @cf/meta/llama-3.1-8b-instruct`
  - rerank: `workers-ai / @cf/baai/bge-reranker-v2-m3`
  - judge: `workers-ai / @cf/meta/llama-3.1-8b-instruct`
  - embedding: `workers-ai / @cf/baai/bge-m3`

### Requirement: DB Schema
ai_config table SHALL 新增以下欄位。

#### Scenario: 新增 react 欄位
- **WHEN** migration 執行
- **THEN** ai_config table 新增：
  - `react_models`: TEXT（JSON 格式的 ModelMap，null 時用預設值）
  - `react_max_turns`: INTEGER（預設 3）
  - `react_token_budget`: INTEGER（預設 8000）
  - `react_usd_to_twd`: REAL（USD → TWD 匯率，預設 32.0）— 此欄位在成本追蹤階段（task 12.4）的 migration 新增，不在初始 migration（task 8.1）中
