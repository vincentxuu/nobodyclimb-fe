## Context

AI 問答功能（`POST /api/v1/ai/ask`）已上線，當前請求流程為：
1. JWT 驗證 → 配額檢查（次數）→ `QueryService.ask()` → LLM 呼叫 → 回應

目前完全沒有輸入/輸出安全檢查。惡意用戶可透過 prompt injection 操控 LLM 行為，或透過大量 token 消耗造成非預期費用。

## Goals / Non-Goals

**Goals:**
- 在 LLM 呼叫前攔截已知惡意輸入模式（prompt injection、jailbreak）
- 在回應返回前掃描輸出，防止 system prompt 洩漏與 PII 外洩
- 加入每用戶每日 token 消耗硬上限，控制成本

**Non-Goals:**
- 不使用外部 AI Safety API（避免增加延遲與成本）
- 不實作語意層級的意圖分類（規則型過濾已足夠當前規模）
- 不修改前端 UI

## Decisions

### D1：Guardrails 作為純函數模組，不作為 middleware

**決定**：建立 `backend/src/utils/guardrails.ts`，匯出純函數（`checkInput()`、`checkOutput()`），在 `routes/ai.ts` 明確呼叫，而非 Hono middleware。

**理由**：guardrails 邏輯只需套用在 `/ask` 路由，不是跨路由需求；middleware 會增加不必要的複雜度。純函數更易測試與維護。

**替代方案**：Hono middleware → 棄用，over-engineering。

---

### D2：規則型過濾，不用 LLM-as-guardrail

**決定**：使用關鍵字清單與 regex pattern 實作過濾，不呼叫第二個 LLM 做意圖判斷。

**理由**：LLM-as-guardrail 會增加 ~1-2 秒延遲與額外費用；當前攻擊模式以已知關鍵字為主，規則型過濾準確率足夠；誤判（false positive）代價低，用戶可重新措辭。

**替代方案**：呼叫 LLM 判斷輸入安全性 → 棄用，延遲與成本不合比例。

---

### D3：Token 上限獨立於請求次數配額，分開追蹤

**決定**：在 `user_ranks` 表新增 `daily_token_used`、`daily_token_limit` 欄位，與現有 `daily_ai_used`/`daily_ai_limit`（次數）並行運作。

**理由**：次數限制無法防止單次超大 token 消耗（長 context + 長回答）。兩種限制互補：次數限制防止頻繁呼叫，token 限制防止單次高消耗。

**重置策略**：與現有次數配額共用每日重置機制（`resetDailyUsage()`）。

---

### D4：Token 估算用字元長度，不等 LLM 回傳 usage

**決定**：在 LLM 呼叫前，以完整 prompt 長度估算 input token 預算：
```
estimatedTokens = ceil((SYSTEM_PROMPT.length + contextLength + query.length + historyLength) / 2)
```
超過 `daily_token_limit` 即拒絕。實際消耗在 LLM 回傳後更新（用 `usage.total_tokens` 或估算值）。

**理由**：Workers AI binding 不保證回傳 `usage.total_tokens`（目前已用估算法）；估算需涵蓋完整 context，否則嚴重低估導致用戶繞過 token 限制。

**替代方案**：只用 `query.length / 2` → 棄用，未含 system prompt 與 context，低估約 5-10 倍。

---

### D6：次數配額與 Token 配額合併為單一原子 SQL

**決定**：將次數扣除與 token 扣除合併為一條 UPDATE，避免競態條件：
```sql
UPDATE user_ranks SET
  daily_ai_used = daily_ai_used + 1,
  daily_token_used = daily_token_used + ?
WHERE user_id = ?
  AND daily_ai_used < daily_ai_limit
  AND daily_token_used + ? <= daily_token_limit
```
失敗（changes = 0）時需區分是次數耗盡還是 token 耗盡（先個別查詢當前值判斷）。

**理由**：兩個獨立 SQL 存在 TOCTOU 競態條件，高並發時可能同時通過兩道檢查。

**替代方案**：兩個獨立 SQL + 應用層鎖 → 棄用，Cloudflare Workers 無共享記憶體。

---

### D5：高消耗告警寫入 query log，不發即時通知

**決定**：單次請求超過 1,000 tokens 時，在 `ai_query_logs` 新增 `is_high_consumption` 布林欄位標記，Admin dashboard 過濾查詢。

**理由**：目前無 WebSocket/push 基礎設施；告警記錄足夠讓 Admin 事後分析，不需即時通知。

## Risks / Trade-offs

- **False positive**：合法的長問題可能被截斷或拒絕 → 錯誤訊息明確提示用戶縮短問題
- **Keyword list 維護**：新型 jailbreak 模式需人工更新黑名單 → 設計為可從 `ai_config` 表動態載入，不需重新部署
- **Token 估算誤差**：估算值與實際值可能有 ±20% 差異 → 上限設計有 buffer（實際允許略超估算上限）

## Migration Plan

1. 新增 DB migration：`user_ranks` 加入 token 欄位（`daily_token_used` 預設 0，`daily_token_limit` 依 rank 設定）
2. 部署 `guardrails.ts` 與修改後的 `routes/ai.ts`
3. 現有用戶 token 欄位初始值為 0，不影響既有操作
4. Rollback：移除 guardrails 呼叫即可還原，DB 欄位可保留

## Open Questions

- Keyword 黑名單初始清單由誰維護？（目前由工程師硬編碼，後續移至 `ai_config` 表）
- Token 上限各 rank 數值是否需要依實際使用情況調整？（初始值：麓 5K、壁 15K、稜 30K、巔 60K）
