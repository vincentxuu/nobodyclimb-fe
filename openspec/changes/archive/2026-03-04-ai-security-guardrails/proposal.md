## Why

AI 問答功能已上線供用戶使用，但目前缺乏輸入/輸出安全防護層，對應 OWASP LLM Top 10 2025 的高風險威脅（LLM01 Prompt Injection、LLM07 System Prompt Leakage、LLM10 Unbounded Consumption），需在系統遭惡意利用前補齊安全防護。

## What Changes

- 新增 `backend/src/utils/guardrails.ts` 模組，實作輸入層防護（prompt injection 過濾、jailbreak pattern 偵測、亂碼/純符號拒絕）
- 新增輸出層防護：system prompt leakage 偵測、PII 過濾、回應長度上限
- 新增每用戶每日 token 消耗硬上限（獨立於現有請求次數配額），各 rank 對應不同限額
- 新增 Admin 高消耗告警記錄

## Capabilities

### New Capabilities

- `ai-input-guardrails`：輸入層安全防護，在 LLM 呼叫前攔截惡意輸入；包含 prompt injection 關鍵字過濾、jailbreak pattern 偵測、無效輸入拒絕；驗證失敗返回 400 且不消耗配額
- `ai-output-guardrails`：輸出層安全過濾，在回應返回前端前掃描；包含 system prompt leakage 偵測、PII regex 過濾、回應長度截斷（3,000 字元上限）
- `ai-token-budget`：每用戶每日 token 消耗追蹤與硬上限；在 `user_ranks` 表新增 token 相關欄位，各 rank 設定對應上限（麓 5K、壁 15K、稜 30K、巔 60K）；超限時返回 429

### Modified Capabilities

- `ai-api-endpoints`：`POST /ask` 端點新增 pre-LLM 輸入驗證步驟與 post-LLM 輸出過濾步驟；token 消耗檢查整合至現有配額流程
- `ai-query-service`：`QueryService.ask()` 整合輸入/輸出 guardrails 呼叫

## Impact

- **新增檔案**：`backend/src/utils/guardrails.ts`
- **修改檔案**：`backend/src/routes/ai.ts`、`backend/src/services/query.ts`
- **DB 變更**：`user_ranks` 表新增 `daily_token_used`、`daily_token_limit` 欄位；需新增 migration
- **無 API breaking change**：現有 request/response schema 不變，僅新增錯誤情境
