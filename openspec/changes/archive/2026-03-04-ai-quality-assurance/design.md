## Context

目前 AI RAG pipeline 由 `QueryService`（`backend/src/services/query.ts`）執行，包含 Tool Calling 意圖解析 → HyDE 假設文件生成 → RRF 雙路向量搜尋 → Cross-encoder Reranking → MMR 多樣性選取 → LLM 生成回答。整個流程完成後，`logQuery()` 將查詢結果寫入 `ai_query_logs` 資料表（目前 9 個欄位）。

系統目前完全沒有對「回答品質」的自動評估：無法知道 LLM 是否幻覺、哪個階段佔了最多延遲、哪些回答應標記為人工審查。

## Goals / Non-Goals

**Goals:**
- 每次 RAG 回應後執行 groundedness 評分（0–1），低分時注入免責聲明
- 對每個回答執行 LLM-as-Judge 品質評分（1–4 分）
- 追蹤 RAG 各階段耗時（embedding_ms、retrieval_ms、generation_ms）
- 低分自動寫入 `ai_flagged_responses` 審核佇列
- Admin API 端點回傳品質 KPI 統計

**Non-Goals:**
- Streaming 回應（Phase 2.1，另行實作）
- 前端顯示 groundedness 信心標示（依賴 Phase 3.1.1 完成後的後續工作）
- Real-time Admin 通知（Phase 4.2.2）
- 在 Vectorize 的 semantic cache（Phase 2.2）

## Decisions

### 決策 1：合併 groundedness + quality 為單一 judge LLM 呼叫

**選擇**：一次 LLM 呼叫同時取得 `groundedness`（0–1）與 `quality`（1–4），回傳 JSON。

**替代方案**：兩次獨立呼叫，各自取得一個分數。

**理由**：兩次獨立呼叫的延遲約 600–1000ms，合併後約 300–500ms。Judge prompt 可在同一個 context 中評估兩個維度，準確度不會明顯下降。JSON 格式輸出容易解析。

**格式**：
```json
{ "groundedness": 0.85, "quality": 3 }
```

若 LLM 回傳格式錯誤，視為評分失敗（不影響主回答的返回）。

---

### 決策 2：Judge 呼叫同步執行（在回傳回應前完成）

**選擇**：Judge 呼叫在 LLM 生成完成後、`logQuery()` 之前同步執行，讓 groundedness 分數可以注入回答的免責聲明。

**替代方案**：用 `ctx.waitUntil()` 非同步執行（不阻塞回應）。

**理由**：免責聲明需在回應送出前注入（tasks 3.1.1 的需求）。若改為非同步，免責聲明無法附加到當次回答。雖然增加延遲，但 judge 的輸入（query + context + response）已在記憶體中，不需要額外 DB 查詢，實際延遲以輕量模型（llama-3.1-8b）約 300–500ms。

**保護措施**：judge 呼叫設 3 秒 timeout；超時時 `groundedness = null`、`quality = null`，主回答正常返回，不注入免責聲明。

---

### 決策 3：分段計時使用 `Date.now()` 差值，包裝現有方法呼叫

**選擇**：在 `QueryService` 的 `executeQuery()` 主流程中，直接在各個步驟呼叫前後記錄 `Date.now()` 差值。

**替代方案**：引入外部 APM（Sentry、Datadog Tracing）或 Cloudflare Logpush。

**理由**：不需要新增外部相依；數據存在現有 D1 便於查詢；Cloudflare Workers 中 `Date.now()` 為 wall clock time，在同一 Isolate 內足夠精確（誤差 < 5ms）。只追蹤三個關鍵階段（embedding、retrieval、generation），不過度細化。

---

### 決策 4：資料庫變更使用一個新 migration

**選擇**：
1. `ALTER TABLE ai_query_logs ADD COLUMN ...`（5 個新欄位，全部 nullable）
2. 新建 `ai_flagged_responses` 資料表

使用單一 migration 檔案 `0049_ai_quality_assurance.sql`（依序號延續現有 migration）。

**理由**：D1 支援 `ALTER TABLE ADD COLUMN`；所有欄位設為 nullable 保持向後相容；舊有 `logQuery()` 呼叫不需改動簽名（只擴充新參數為 optional）。

**新欄位**（全部 nullable）：
- `groundedness_score REAL` — 0.0–1.0，null 代表未評分
- `auto_score INTEGER` — 1–4，null 代表未評分
- `embedding_ms INTEGER` — embedding 階段耗時
- `retrieval_ms INTEGER` — vector search + rerank 階段耗時
- `generation_ms INTEGER` — LLM generation 階段耗時

---

### 決策 5：低分觸發條件

觸發「寫入 `ai_flagged_responses`」的條件（OR 關係）：
- `groundedness_score < 0.5`
- `feedback_score <= 2`（用戶評分，既有欄位）
- `auto_score <= 1`

`ai_flagged_responses` 資料表：
```sql
id, query_log_id (FK), flag_reason, is_reviewed, created_at
```

`flag_reason` 為 `low_groundedness` | `low_feedback` | `low_auto_score`。

同一 `query_log_id` 可有多筆（不同原因），Admin 依 `is_reviewed = false` 過濾待審項目。

---

### 決策 6：Judge Prompt 輸入截斷

Judge prompt 的輸入包含 context（retrieved chunks）+ response，可能很長。若超過 1,500 tokens，截斷 context 保留前 800 字元，確保 judge 模型收到完整的 query 和 response。

---

### 決策 7：Judge Model 選擇

使用 `@cf/meta/llama-3.1-8b-instruct` 作為 judge，而非主要 LLM `@cf/google/gemma-3-12b-it`。

**理由**：更快（參數少 33%）；judge 任務只需 JSON 格式輸出，不需要多語言能力；降低 Gemma 3 的並發佔用，避免影響主要 RAG 的 rate limit。

## Risks / Trade-offs

| 風險 | 緩解措施 |
|------|----------|
| Judge 呼叫增加約 300–500ms 延遲 | 設 3 秒 timeout；judge 失敗時主回答正常返回 |
| Judge 回傳非 JSON 格式 | try/catch + regex fallback 解析；失敗時設 null |
| D1 ALTER TABLE migration 失敗 | 先在 preview 執行驗證；migration 是 idempotent（加 IF NOT EXISTS 保護） |
| 低分誤判導致大量錯誤標記 | 初期設保守門檻（groundedness < 0.5），觀察兩週後視需要調整 |
| Judge 自我評分 LLM 幻覺（Gemma 3 生成的回答用 llama 評估可能系統性偏低） | 記錄 auto_score 時一律標注 model_used；初期僅供參考，不用於自動封鎖回答 |

## Migration Plan

1. 部署 `0049_ai_quality_assurance.sql` migration（preview 先行驗證）
2. 部署後端程式碼更新：`query.ts`（計時 + judge）、`ai-prompts.ts`（judge prompt）、`admin-ai.ts`（品質 KPI 端點）
3. 舊 `logQuery()` 呼叫不受影響（新欄位全部 nullable）
4. Rollback：新欄位可留空，移除 judge 邏輯即恢復原行為；`ai_flagged_responses` 可直接 DROP（不影響核心功能）

## Open Questions

- `generation_ms` 的計時應包含 `parseSuggestedQuestions()` 的後處理時間嗎？（建議：包含，因為用戶感受的是完整延遲）
- Admin KPI 端點是加在現有 `admin-ai.ts` 的新 route，還是獨立檔案？（建議：加在現有檔案，保持一致性）
- groundedness 免責聲明的具體中文措辭需要 PM/設計確認。
