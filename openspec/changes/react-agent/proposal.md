## Why

現有 AI 系統（pipeline engine + ai-graph）的回答品質受限於「一次性分類」架構——LLM 只在入口做一次 tool selection，之後走固定管線，無法在看到中間結果後改變策略或組合多個資料源。參考 Claude Code 的 ReAct + Tool Use 架構，建立新的 agent 系統，讓 LLM 每一步都能動態選擇工具、觀察結果、決定下一步，從根本上提升回答品質。

## What Changes

- 新增 ReAct orchestrator engine，使用 LLM tool_use API 動態選擇工具
- 新增 Tool 抽象層（參考 Claude Code 的 Tool interface），支援動態 prompt、並行/串行宣告、結果大小控制、標籤分類
- 新增 Tool Registry，管理 tool 集合與 API schema 轉換
- 新增 7 個 Tool 實作：search-routes、search-crags、sql-query、weather、user-profile、recommend、crag-info
- 擴展現有 AI Provider 介面，新增 `chatWithTools()` method，支援 Workers AI、Anthropic、OpenAI、Google、GitHub Models 各家 function calling 格式統一
- 新增多模型配置：每個 LLM 觸點（orchestrator、hyde、multi-query、text-to-sql、rerank、judge、embedding）可獨立配置 provider + 模型，存於 DB 即時切換（如 orchestrator 用 Anthropic Claude 或 GitHub Models GPT-4o，tool 內部用 Workers AI Llama 8B）
- 新增 per-model / per-turn token 追蹤
- 新增品質守衛：規則式同步檢查 + LLM judge 非同步評分
- 新增 `react` 作為 `rag_strategy` 選項，與現有 baseline/agentic/plan-execute 三套並行，透過 config 切換 A/B 測試

## Capabilities

### New Capabilities
- `react-engine`: ReAct orchestrator loop 核心引擎，包含 tool 並行/串行執行、錯誤處理（is_error 送回 LLM）、結果大小截斷、token budget 守衛
- `react-tool-system`: Tool 抽象層與 Registry，定義 Tool interface（prompt()、execute()、formatResult()、concurrencySafe、maxResultChars、tags、alwaysLoad）及 API schema 轉換
- `react-tools`: 7 個 Tool 實作，複用現有 pipeline steps 和 services 的邏輯
- `react-model-map`: 多模型多 provider 配置系統，per-LLM-觸點獨立選 provider + 模型，DB 儲存即時切換
- `react-provider-tooluse`: AI Provider 擴展，所有 provider（Workers AI、Anthropic、OpenAI、Google、GitHub Models）新增 chatWithTools()，統一 tool_use 回傳格式
- `react-quality-guards`: 品質守衛系統，規則式快速檢查（同步）+ LLM judge 評分（非同步）
- `react-token-tracker`: Per-model、per-turn、per-tool-internal 的 token 與延遲追蹤，含 USD + TWD 成本換算
- `react-cache`: 多層 cache 體系（semantic cache、embedding cache、tool result cache），per-tool TTL，底層 Cloudflare KV
- `react-provider-resilience`: Provider retry（exponential backoff）+ fallback chain + circuit breaker，確保 multi-provider 環境的穩定度
- `react-query-classifier`: 查詢分類快速路徑，閒聊/通用知識跳過 ReAct loop 直接回應，省 orchestrator 成本
- `react-observability`: Admin 成本 dashboard（按 strategy/provider/觸點分）+ 異常告警（成本、錯誤率、品質分數）

### Modified Capabilities
- `ai-pipeline-flow`: 新增 `react` 作為 rag_strategy 選項，路由到 react-agent engine

## Impact

- **新增目錄**: `backend/src/services/react-agent/` 及 `backend/src/services/react-agent/tools/`
- **修改檔案**: `backend/src/routes/ai.ts`（新增 react strategy 路由）、`backend/src/services/ai-graph/providers/`（新增 chatWithTools）
- **DB 設定**: `ai_config` 新增 react 相關欄位（react_models、react_max_turns、react_token_budget、react_usd_to_twd、react_alert_* 告警閾值）
- **依賴**: 無新外部依賴，複用現有 AI providers（Workers AI、Anthropic、OpenAI、Google）+ 新增 GitHub Models provider，複用現有 services
- **並行運作**: 現有 pipeline engine 和 ai-graph 不受影響，三套系統透過 config 切換共存
