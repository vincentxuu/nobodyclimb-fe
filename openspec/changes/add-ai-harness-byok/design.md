## Context
需求是讓使用者可自行貼上不同家 LLM 供應商 API Key，並在既有 RAG 問答流程中直接使用，且不破壞既有配額、SSE 串流、輸入輸出 guardrails。

## Goals / Non-Goals
- Goals:
  - 支援多供應商 BYOK（至少 OpenAI、Anthropic、Google）
  - 區分管理員 baseline quota 與使用者自帶 key 的 quota/usage 來源
  - 使用者可自行管理 key，且服務端僅儲存加密版本
  - `ask` 與 `ask?stream=true` 共用同一套 Harness 決策
- Non-Goals:
  - 不在本變更新增計費功能
  - 不開放任意自訂 base URL（避免 SSRF 與濫用）

## Decisions
- Decision: 新增雙層設定模型（AdminPolicy + UserHarnessConfig）。
  - `AdminPolicy`：管理員可設定平台基礎額度、預設 provider、fallback 開關。
  - `UserHarnessConfig`：使用者設定自有 provider key 與預設模型，並可選擇 `usage_mode`（`platform` 或 `user`）。
- Decision: 新增 `AiHarnessService` 作為 QueryService 前置決策層。
  - 根據使用者設定選擇 provider/model/client。
  - 若設定無效，依 `AdminPolicy` fallback 平台預設或直接回傳可操作錯誤。
- Decision: 使用 KMS/環境金鑰進行 server-side encryption 後存 DB。
  - API 僅回傳 `masked_key`（例如 `sk-***abcd`），不回傳明文。
- Decision: 提供 `POST /api/v1/ai/harness/test` 執行最小化 test prompt 驗證。
  - 成功才把 key 狀態標示為 active。

## Risks / Trade-offs
- 風險：供應商 SDK 差異造成串流事件格式不一致。
  - 緩解：在 Harness 層統一轉成既有 SSE token/done/error 事件格式。
- 風險：使用者頻繁測試 key 可能造成額外成本。
  - 緩解：加入測試頻率限制與最小 token prompt。

## Migration Plan
1. DB migration 新增 `user_ai_provider_keys`（使用者 BYOK 金鑰）與 `ai_provider_policies`（管理員策略）資料表。
2. 上線後預設仍走平台 key；僅當使用者啟用 BYOK 才切換。
3. 若 Harness service 出錯，回退平台路徑（可由 feature flag 關閉 BYOK）。

## Open Questions
- 每位使用者允許同時啟用多個 provider，並可設定優先序；預設最多 3 個啟用中的 provider。
- `usage_mode=user` 不扣平台 baseline token quota，但仍扣 1 次平台 baseline request quota 作為防濫用機制。
