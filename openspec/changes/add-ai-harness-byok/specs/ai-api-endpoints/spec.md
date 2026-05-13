## ADDED Requirements

### Requirement: 管理員平台策略與基礎額度設定
系統 SHALL 提供僅管理員可操作的 AI Harness 平台設定端點，用於管理 baseline quota、預設 provider 與 fallback 策略；一般使用者不得存取。

#### Scenario: 管理員更新 baseline quota
- **WHEN** 管理員呼叫 `PUT /admin/ai/harness/policy`，提交 `{ "baseline_daily_requests": 6, "baseline_daily_tokens": 15000 }`
- **THEN** 系統更新平台基礎額度設定，後續未啟用 BYOK 或 `usage_mode=platform` 的請求依此扣額度

#### Scenario: 管理員設定 fallback 策略
- **WHEN** 管理員呼叫 `PUT /admin/ai/harness/policy`，提交 `{ "default_provider": "workers-ai", "allow_fallback_to_platform": true }`
- **THEN** ask/stream 流程在使用者 key 不可用時，依策略 fallback 到平台 provider

#### Scenario: 管理員讀取當前策略
- **WHEN** 管理員呼叫 `GET /admin/ai/harness/policy`
- **THEN** 回傳目前 baseline quota、fallback 設定、default provider、updated_by、updated_at

#### Scenario: 非管理員被拒絕
- **WHEN** 一般使用者呼叫任一 `/admin/ai/harness/*` 端點
- **THEN** 回傳 403

### Requirement: 使用者 BYOK Harness 管理端點
系統 SHALL 提供已登入使用者管理自有 LLM 供應商金鑰的端點，至少包含新增/更新、查詢、刪除、連線測試；所有回應 SHALL 僅包含遮罩後 key 資訊，不得回傳明文。

#### Scenario: 新增或更新供應商金鑰
- **WHEN** 已登入使用者呼叫 `POST /api/v1/ai/harness/keys`，提交 `{ "provider": "openai", "api_key": "sk-...", "model": "gpt-4.1-mini" }`
- **THEN** 系統儲存加密後 key，回傳 `{ "success": true, "data": { "provider": "openai", "masked_key": "sk-***abcd", "status": "pending_test" } }`

#### Scenario: 查詢已設定金鑰
- **WHEN** 已登入使用者呼叫 `GET /api/v1/ai/harness/keys`
- **THEN** 回傳該使用者所有供應商設定，欄位僅含 provider、model、masked_key、status、last_tested_at、usage_mode

#### Scenario: 刪除供應商金鑰
- **WHEN** 已登入使用者呼叫 `DELETE /api/v1/ai/harness/keys?provider=anthropic`
- **THEN** 系統以 soft delete 停用該供應商 key，保留審計資訊，後續 ask 流程不再使用該 key

#### Scenario: 金鑰輪替
- **WHEN** 已登入使用者以同一 provider 再次呼叫 `POST /api/v1/ai/harness/keys` 提交新 key
- **THEN** 系統建立新版本 key 並停用舊版本；進行中的請求維持舊 key 到本次請求結束，新請求使用新 key

#### Scenario: 未登入使用者操作被拒絕
- **WHEN** 未驗證用戶呼叫任一 `/api/v1/ai/harness/*` 端點
- **THEN** 回傳 401

### Requirement: BYOK 連線測試端點
系統 SHALL 提供 `POST /api/v1/ai/harness/test`，用以驗證指定 provider/model/key 可用性，並更新 key 狀態。

#### Scenario: 測試成功
- **WHEN** 已登入使用者提交可用的 provider、model 與 key
- **THEN** 回傳 `{ "success": true, "data": { "status": "active" } }`，並更新 `last_tested_at`

#### Scenario: 測試失敗
- **WHEN** key 無效、模型不存在或權限不足
- **THEN** 回傳 400，body 含標準化錯誤碼（如 `invalid_api_key`、`model_not_allowed`），並將狀態標示為 `invalid`

#### Scenario: Provider 流量或餘額異常
- **WHEN** 測試時遇到供應商 rate limit、timeout 或餘額不足
- **THEN** 回傳 429/504/402 對應狀態，並使用標準化錯誤碼 `provider_rate_limited`、`provider_timeout`、`insufficient_balance`

### Requirement: Ask 端點支援 Harness provider 路由
`POST /api/v1/ai/ask`（含 `stream=true`）SHALL 支援使用者 BYOK Harness 設定；當使用者啟用且 key 有效時優先使用使用者 key，否則依策略 fallback。

#### Scenario: 非串流請求使用 BYOK
- **WHEN** 使用者已啟用 openai key 且狀態 active，呼叫 `POST /api/v1/ai/ask`
- **THEN** 問答流程使用使用者 key 執行，回應仍維持既有 JSON 結構

#### Scenario: 串流請求使用 BYOK
- **WHEN** 使用者已啟用 anthropic key 且狀態 active，呼叫 `POST /api/v1/ai/ask?stream=true`
- **THEN** 後端以該 provider 執行模型生成，並維持既有 SSE `token/done/error` 事件格式

#### Scenario: 使用者 key 失效時 fallback
- **WHEN** ask 流程發現使用者 key 已失效或 provider 暫時不可用
- **THEN** 系統依設定 fallback 到平台預設 key；若 fallback 關閉則回傳可理解錯誤訊息與錯誤碼

### Requirement: 雙層額度與使用量來源
系統 SHALL 在 ask/stream 請求中區分「管理員平台 baseline quota」與「使用者 BYOK 使用量」，並可依使用者設定決定扣額來源。

#### Scenario: usage_mode=platform 使用平台額度
- **WHEN** 使用者有設定 BYOK key，但 `usage_mode` 為 `platform`
- **THEN** 請求由使用者 key 執行模型，但請求次數/token 仍扣管理員設定的 baseline quota

#### Scenario: usage_mode=user 使用者自有使用量
- **WHEN** 使用者有設定 BYOK key，且 `usage_mode` 為 `user`
- **THEN** 系統記錄此次請求為 `key_source=user_key`，不扣平台 baseline token quota，但扣 1 次 baseline request quota 作為防濫用

#### Scenario: 回傳額度來源資訊
- **WHEN** ask 或 stream 請求完成
- **THEN** 回應或 done 事件包含 `quota_source`（`platform` 或 `user`）以供前端顯示本次使用量來源

### Requirement: BYOK 安全與審計
系統 SHALL 對 BYOK 全流程提供最小必要安全控制與可追溯性。

#### Scenario: 金鑰儲存安全
- **WHEN** 任一 key 被寫入資料庫
- **THEN** key MUST 先加密後再儲存，資料庫中不得出現明文 key

#### Scenario: 回應資料遮罩
- **WHEN** API 回傳 key 相關欄位
- **THEN** 系統 MUST 僅回傳遮罩字串，不得包含可復原明文的資訊

#### Scenario: 問答審計
- **WHEN** ask 或 stream 請求完成（成功或失敗）
- **THEN** 系統記錄審計欄位至少包含 user_id、provider、model、key_source（`user_key` 或 `platform_key`）、timestamp、result

#### Scenario: 管理策略異動審計
- **WHEN** 管理員更新 Harness policy
- **THEN** 系統記錄審計欄位至少包含 admin_user_id、before_policy、after_policy、timestamp、change_reason
