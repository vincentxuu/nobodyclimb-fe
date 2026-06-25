## ADDED Requirements

### Requirement: Circuit Breaker 狀態機
系統 SHALL 提供 Circuit Breaker 熔斷器機制，追蹤 Workers AI 服務的健康狀態。Circuit Breaker SHALL 實作三種狀態：**Closed**（正常通過）、**Open**（熔斷拒絕）、**Half-Open**（探測恢復）。狀態 SHALL 儲存在 Cloudflare KV 中（key: `circuit:workers-ai`），跨 Worker isolate 共享。

#### Scenario: Closed 狀態正常通過請求
- **WHEN** Circuit Breaker 為 Closed 狀態，用戶發送 AI 查詢
- **THEN** 請求正常通過，呼叫 Workers AI 服務

#### Scenario: 連續失敗觸發 Open 狀態
- **WHEN** Workers AI 連續失敗達到 `circuit_breaker_threshold`（預設 5 次）
- **THEN** Circuit Breaker 切換為 Open 狀態，記錄 `openedAt` 時間戳

#### Scenario: Open 狀態拒絕請求
- **WHEN** Circuit Breaker 為 Open 狀態且冷卻時間未到，用戶發送 AI 查詢
- **THEN** 直接回傳 503 錯誤「AI 服務暫時不可用，請稍後再試」，不扣除用戶配額，不呼叫 Workers AI

#### Scenario: 冷卻後進入 Half-Open 狀態
- **WHEN** Circuit Breaker 為 Open 狀態且已超過 `circuit_breaker_reset_ms`（預設 30000ms）
- **THEN** 下一個請求允許通過作為探測請求，Circuit Breaker 進入 Half-Open 狀態

#### Scenario: Half-Open 探測成功恢復 Closed
- **WHEN** Circuit Breaker 為 Half-Open 狀態，探測請求成功
- **THEN** Circuit Breaker 切換回 Closed 狀態，`failureCount` 重置為 0

#### Scenario: Half-Open 探測失敗回到 Open
- **WHEN** Circuit Breaker 為 Half-Open 狀態，探測請求失敗
- **THEN** Circuit Breaker 切換回 Open 狀態，更新 `openedAt` 時間戳

#### Scenario: KV 無記錄時視為 Closed
- **WHEN** KV 中不存在 `circuit:workers-ai` key（首次啟動或 TTL 過期）
- **THEN** Circuit Breaker 視為 Closed 狀態，請求正常通過

### Requirement: Circuit Breaker 失敗判定
Circuit Breaker SHALL 監控 Workers AI 服務呼叫（`env.AI.run()`），以下情況視為「失敗」：Workers AI API 拋出異常（網路錯誤、服務不可用）、Workers AI 呼叫超時（被 `withTimeout` 的 `TimeoutError` 中斷）。以下情況 SHALL NOT 視為失敗：Pipeline 降級成功（如 Embedding 超時但 BM25 接手）、Judge 超時回傳 null scores（已有 graceful fallback）、業務邏輯錯誤（如查詢格式不合法）。Circuit Breaker 的 `recordSuccess()` 和 `recordFailure()` SHALL 在 `embedding` step 和 `llm-generation` step 完成後呼叫（這兩個 step 直接呼叫 Workers AI）。

#### Scenario: Workers AI 拋出異常計為失敗
- **WHEN** `env.AI.run()` 拋出網路錯誤或服務不可用異常
- **THEN** 呼叫 `recordFailure()`，`failureCount` 遞增

#### Scenario: Workers AI 超時計為失敗
- **WHEN** `embedding` 或 `llm-generation` step 因 `TimeoutError` 被中斷
- **THEN** 呼叫 `recordFailure()`，`failureCount` 遞增

#### Scenario: 降級成功不計為失敗
- **WHEN** Embedding 超時但 pipeline 成功降級為 BM25 並完成回應
- **THEN** 不呼叫 `recordFailure()`（降級是預期行為，非服務故障）

#### Scenario: Workers AI 呼叫成功計為成功
- **WHEN** `env.AI.run()` 正常回傳結果
- **THEN** 呼叫 `recordSuccess()`，`failureCount` 重置為 0

### Requirement: Circuit Breaker KV 資料結構
Circuit Breaker 狀態 SHALL 以 JSON 格式儲存於 KV，key 為 `circuit:workers-ai`，TTL 為 300 秒。資料結構 SHALL 為：
```json
{
  "state": "closed" | "open" | "half-open",
  "failureCount": 0,
  "lastFailureAt": 1709900000000,
  "openedAt": 1709900000000
}
```
各欄位說明：`state` 為當前狀態、`failureCount` 為連續失敗次數、`lastFailureAt` 為最後一次失敗的時間戳（ms）、`openedAt` 為進入 Open 狀態的時間戳（ms，僅 Open/Half-Open 狀態有值）。

#### Scenario: 成功請求重置 failureCount
- **WHEN** Closed 狀態下 Workers AI 請求成功
- **THEN** `failureCount` 重置為 0

#### Scenario: 失敗請求遞增 failureCount
- **WHEN** Closed 狀態下 Workers AI 請求失敗
- **THEN** `failureCount` 遞增 1，`lastFailureAt` 更新為當前時間戳

#### Scenario: TTL 過期自動重置
- **WHEN** 300 秒內無任何 AI 請求（KV TTL 過期）
- **THEN** 下次請求時 Circuit Breaker 視為 Closed，等同自動恢復

### Requirement: Circuit Breaker 動態配置
Circuit Breaker 的觸發閾值和冷卻時間 SHALL 從 `ai_config` 表讀取，支援在線上動態調整。

#### Scenario: 預設配置值
- **WHEN** `ai_config` 中無 Circuit Breaker 相關設定
- **THEN** 使用預設值：`circuit_breaker_threshold = 5`（連續失敗次數）、`circuit_breaker_reset_ms = 30000`（冷卻時間 30s）

#### Scenario: 管理員調整閾值
- **WHEN** 管理員將 `circuit_breaker_threshold` 改為 3
- **THEN** 後續 Workers AI 連續失敗 3 次即觸發 Open 狀態

### Requirement: Circuit Breaker Trace 記錄
Circuit Breaker 的狀態變化 SHALL 記錄於 `pipelineTrace` 中，供可觀測性分析。

#### Scenario: 熔斷拒絕記錄
- **WHEN** 請求因 Circuit Breaker Open 被拒絕
- **THEN** `ai_query_logs` 記錄 `circuit_breaker: { state: 'open', action: 'rejected' }`

#### Scenario: 狀態轉換記錄
- **WHEN** Circuit Breaker 從 Closed 轉為 Open
- **THEN** `pipelineTrace` 記錄 `circuit_breaker: { transition: 'closed→open', failureCount: 5 }`
