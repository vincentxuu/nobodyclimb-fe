# Change: 新增 AI Harness BYOK（Bring Your Own Key）能力

## Why
目前 AI 問答僅能使用平台預設供應商與憑證，當供應商額度受限或使用者偏好特定模型時，無法快速切換。需要提供「使用者自行貼上不同供應商 API Key 即可使用」的能力，以提升可用性與彈性。

## What Changes
- 明確區分「服務管理員設定」與「使用者設定」兩層：
  - 管理員設定平台基礎額度（baseline quota）與預設 provider 策略。
  - 使用者可設定自己的 provider key，用於增加可用額度池或改用自己的使用量來源。
- 新增使用者級別的 AI Harness 設定流程，支援貼上多家供應商 API Key（例如 OpenAI、Anthropic、Google）。
- 新增資料模型命名：`user_ai_provider_keys`（使用者金鑰設定）與 `ai_provider_policies`（管理員策略）。
- 新增 API 端點供前端儲存、更新、檢視、刪除使用者自己的供應商憑證（僅回傳遮罩後資訊）。
- 在 `POST /api/v1/ai/ask` 與 `stream=true` 模式加入 Harness 路由邏輯：優先使用使用者選定供應商；若不可用再 fallback 平台預設。
- 新增供應商與模型白名單驗證、連線測試、錯誤碼標準化，避免不支援模型或無效 key 造成不明錯誤。
- 新增審計與安全需求：金鑰加密儲存、禁止明文回傳、記錄 key 來源（user_key vs platform_key）與供應商。

## Impact
- Affected specs: `ai-api-endpoints`
- Affected code:
  - `backend/src/routes/ai.ts`（新增 harness 管理端點與 ask 路由整合）
  - `backend/src/routes/admin/ai.ts`（新增管理員 baseline quota 與平台策略設定）
  - `backend/src/services/query-service.ts`（模型供應商抽象與執行路由）
  - `backend/src/repositories/*`（使用者金鑰設定存取）
  - `web/src/components/*`（設定 UI 與供應商選擇）
