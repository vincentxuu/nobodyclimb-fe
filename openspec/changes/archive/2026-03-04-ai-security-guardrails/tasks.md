## 1. DB Migration

- [x] 1.1 新增 migration 檔案，在 `user_ranks` 表加入 `daily_token_used INTEGER NOT NULL DEFAULT 0` 欄位
- [x] 1.2 新增 migration 檔案，在 `user_ranks` 表加入 `daily_token_limit INTEGER NOT NULL DEFAULT 5000` 欄位
- [x] 1.3 新增 migration 檔案，在 `ai_query_logs` 表加入 `is_high_consumption INTEGER NOT NULL DEFAULT 0` 欄位
- [x] 1.4 更新 `resetDailyUsage()` 函數，一併重置 `daily_token_used = 0`
- [x] 1.5 更新 `initUserRank()` 函數，依 rank 設定 `daily_token_limit`（麓 5000、壁 15000、稜 30000、巔 60000）

## 2. Guardrails 模組

- [x] 2.1 建立 `backend/src/utils/guardrails.ts`，定義 `GuardrailError` 錯誤類別
- [x] 2.2 實作 `checkInput(query: string, db: D1Database): Promise<void>`，拋出 `GuardrailError` 表示驗證失敗
- [x] 2.3 加入 prompt injection 關鍵字清單（`ignore previous instructions`、`you are now`、`pretend to be`、`DAN`、`jailbreak` 等）
- [x] 2.4 加入 jailbreak pattern 清單（`act as`、`roleplay as`、`simulate`、`扮演`、`假裝你是` 等）
- [x] 2.5 加入無效輸入檢查：10 個以上連續相同字元、純符號組成（regex 判斷）
- [x] 2.6 支援從 `ai_config` 表動態載入額外黑名單（`key = 'input_blocklist'`，JSON 陣列格式）
- [x] 2.7 實作 `checkOutput(response: string): string`，回傳過濾後的回應
- [x] 2.8 加入 system prompt leakage 偵測（掃描 `SYSTEM_PROMPT`、`You are a climbing assistant`、`你是一個攀岩助理` 等特徵字串）；命中時替換為通用錯誤訊息
- [x] 2.9 加入 PII regex 過濾：email（`\S+@\S+\.\S+`）、台灣電話（`\b0\d{1,2}-?\d{6,8}\b`，加 word boundary 避免誤判路線編號）；命中時替換為 `[已隱藏]`
- [x] 2.10 加入回應長度截斷：超過 3,000 字元時截斷並附加提示訊息

## 3. Token Budget

- [x] 3.1 更新 `backend/src/types.ts`，在 `UserRank` 型別加入 `daily_token_used` 和 `daily_token_limit` 欄位
- [x] 3.2 在 `backend/src/services/rank.ts` 新增 `deductQuotaAndToken(userId, estimatedTokens, db)` 函數，將次數扣除與 token 扣除合併為單一原子 SQL（`daily_ai_used + 1` 且 `daily_token_used + estimatedTokens`，兩個條件同時成立才成功）
- [x] 3.3 在 `backend/src/services/rank.ts` 新增 `getUserQuotaStatus(userId, db)` 輔助函數，用於原子操作失敗時判斷是次數耗盡還是 token 耗盡（回傳兩者各自狀態）
- [x] 3.4 在 `backend/src/services/rank.ts` 新增 `addTokenUsage(userId, actualTokens, db)` 函數，LLM 完成後更新實際消耗

## 4. 整合至路由

- [x] 4.1 在 `backend/src/routes/ai.ts` 的 `/ask` 路由，於次數配額檢查前加入獨立的 `checkInput()` 呼叫（try-catch 明確捕捉 `GuardrailError`，返回 400；其他 Error 繼續拋出）
- [x] 4.2 移除原有的次數原子扣除邏輯，改呼叫 `deductQuotaAndToken(userId, estimatedTokens, db)`；estimatedTokens 計算為 `ceil((SYSTEM_PROMPT.length + estimatedContextLength + query.length + historyLength) / 2)`
- [x] 4.3 原子操作失敗（changes = 0）時，呼叫 `getUserQuotaStatus()` 判斷是次數耗盡（`error: "quota_exceeded"`）還是 token 耗盡（`error: "token_quota_exceeded"`），返回對應 429
- [x] 4.4 在 `backend/src/routes/ai.ts`，LLM 呼叫成功後呼叫 `addTokenUsage()` 更新實際消耗
- [x] 4.5 在 `backend/src/routes/ai.ts`，AI 呼叫失敗時退還預扣次數與 token（`daily_ai_used - 1`、`daily_token_used - estimatedTokens`，最小值為 0）
- [x] 4.6 在 `backend/src/routes/ai.ts`，`QueryService.ask()` 返回後呼叫 `checkOutput()` 過濾回應
- [x] 4.7 在 `backend/src/routes/ai.ts`，logQuery 時若 tokenCount > 1000 則標記 `is_high_consumption = true`
- [x] 4.8 更新 `GET /quota/me` 回應，加入 `token_limit`、`token_used`、`token_remaining` 欄位

## 5. 更新 logQuery

- [x] 5.1 更新 `backend/src/services/query.ts` 的 `logQuery()` 函數，支援 `is_high_consumption` 參數
- [x] 5.2 更新對應的 INSERT SQL，加入 `is_high_consumption` 欄位

## 6. 驗證

- [x] 6.1 本地測試：送出含 `ignore previous instructions` 的查詢，確認返回 400 且配額不扣除
- [x] 6.2 本地測試：送出正常攀岩問題，確認通過 guardrails 並正常回應
- [x] 6.3 本地測試：模擬 token 超限情境，確認返回 429（`token_quota_exceeded`）
- [x] 6.4 執行 `pnpm db:migrate` 確認 migration 無誤
- [x] 6.5 執行 `pnpm typecheck` 確認型別無誤
