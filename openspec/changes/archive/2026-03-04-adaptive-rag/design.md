## Context

現有 `QueryService.ask()` 對所有查詢套用完整的 7 段 RAG pipeline（HyDE + 雙路 Vectorize + RRF + Reranker + MMR + LLM）。系統已有 Tool Calling（LLM A）解析查詢意圖，但未利用此分析決定 pipeline 路徑，所有查詢一律耗費相同的 embedding 次數與推論成本。

目前 query.ts 的流程入口：
1. Tool Calling → `parsedQuery.tool` 決定 `general_knowledge` vs. RAG
2. 相似路線意圖偵測 → `hasSimilarRouteIntent()`（heuristic）

本變更在此基礎上加入第三個路由維度：**簡單 vs. 複雜**，並在 retrieval 與 generation 兩個階段加入自我修正能力。

## Goals / Non-Goals

**Goals:**
- 簡單查詢（直接 lookup）跳過 HyDE，節省 ~1 次 embedding + LLM call
- 依查詢複雜度選擇模型：簡單用輕量模型，複雜用 gemma-3-12b-it
- CRAG：retrieval 無結果時自動放寬過濾條件重新搜尋（最多 1 次）
- Self-reflection：僅對複雜查詢，生成後評估是否真正回答問題（最多 1 次重試）
- Query log 追蹤新欄位：`query_type`、`model_used`、`retrieval_score`、`self_reflection_triggered`

**Non-Goals:**
- 不變更 API 合約（前端無需修改）
- 不引入外部 judge LLM 服務（用 Cloudflare AI Workers AI 現有模型）
- 不實作完整 RAGAS 評估框架（屬 Phase 3 範疇）
- 不修改 embedding service 或 vectorize schema

## Decisions

### D1：分類來源 — 擴展 Tool Calling 而非獨立呼叫

**選擇**：在現有 `TOOL_SELECTION_PROMPT` 中加入 `query_type` 輸出欄位，讓 LLM A 在解析意圖的同時輸出分類，不增加額外 LLM 呼叫。

**理由**：Tool Calling 已語意理解查詢，分類僅需在同一次呼叫中多輸出一個欄位。獨立呼叫會增加 100-300ms 延遲且浪費 token。

**分類定義**：
- `simple`：直接 lookup（「X 岩場有哪些路線」、「Y 路線的難度」）
- `complex`：比較、推薦、多條件分析（「比較A和B的特色」、「推薦適合我的路線」）
- `general-knowledge`：已存在，不在此次變更範圍

**拒絕方案**：使用關鍵字 heuristic 分類（速度快但準確率低，複雜繁中語意難以 regex 捕捉）。

---

### D2：簡單查詢的 pipeline 精簡策略

**選擇**：`simple` 查詢跳過 HyDE 生成步驟，直接用 query embedding 進行單路 Vectorize 搜尋，並使用 `@cf/meta/llama-3.1-8b-instruct` 生成回答。

**理由**：
- HyDE 的目的是改善「語意漂移」問題（query 語意 ≠ document 語意），簡單 lookup 不存在此問題
- 省去 HyDE LLM 呼叫（~200-400ms）+ HyDE embedding（~100ms）
- 輕量模型對 lookup 型問答品質差異不大，但推論速度快 2-3 倍

**保留**：Cross-encoder reranking 仍執行（即使只有單路，reranking 能提升準確性）；MMR 可選擇性跳過（single-crag lookup 多樣性需求低）。

---

### D3：CRAG 觸發條件 — 使用現有 RRF threshold 作為代理

**選擇**：當 RRF 過濾後無任何文件存活（即 `filteredDocs.length === 0`），觸發 CRAG retry；retry 策略為移除最嚴格的過濾條件（`grade_numeric`），保留位置 filter（`crag_id` / `area_id` / `region`）。

**理由**：
- 現有 MIN_RRF_SCORE 已是品質門檻；「無文件存活」是最明確的 retrieval 失敗信號
- 移除 grade filter 是最有效的放寬策略（grade 過濾最容易過嚴）
- 避免引入額外 LLM-as-judge 呼叫（節省成本，RAGAS 評估屬 Phase 3）

**拒絕方案**：使用輕量 LLM 評估每個 chunk 的相關性（準確但昂貴，每次查詢增加 ~500ms）。

---

### D4：Self-reflection — 輕量二元判斷

**選擇**：僅對 `complex` 查詢，在 LLM 生成回答後，以同一模型發送單一確認 prompt（「這個回答是否完整回答了問題？只回覆 YES 或 NO」），若為 NO 則重新生成（最多 1 次）。

**理由**：
- `simple` 查詢的 lookup 回答易於評估（有/無資料），self-reflection 價值低
- 二元 YES/NO 比 1-5 分評分更穩定，模型較不易輸出格式錯誤
- 限制 1 次重試防止無限迴圈與超出 token 預算

**觸發條件**：僅當 self-reflection 回傳 NO 且原始回答長度 < 50 字元（避免對合理的「無資料」回答重試）。

---

### D5：D1 migration — 新增追蹤欄位

`ai_query_logs` 表新增欄位（均為 nullable，向下相容）：
```sql
ALTER TABLE ai_query_logs ADD COLUMN query_type TEXT;        -- 'simple' | 'complex' | 'general-knowledge'
ALTER TABLE ai_query_logs ADD COLUMN model_used TEXT;        -- 實際使用的 LLM 模型 ID
ALTER TABLE ai_query_logs ADD COLUMN retrieval_score REAL;   -- CRAG 觸發前最高 RRF 分數（或 0 表示無結果）
ALTER TABLE ai_query_logs ADD COLUMN self_reflection_triggered INTEGER DEFAULT 0; -- 0/1
```

## Risks / Trade-offs

**[風險] Tool Calling 分類不準確** → Mitigation：`complex` 作為 fallback 預設，分類失敗時走完整 pipeline，確保品質下限。

**[風險] CRAG retry 拉長 p95 latency** → Mitigation：retry 僅在 0 結果時觸發（罕見情況），且 retry 時已有 query embedding 可複用（只需重新 query Vectorize）。

**[Trade-off] 簡單查詢放棄 HyDE 可能降低準確性** → 對 lookup 型查詢（有明確岩場/難度）影響最小；對語意模糊的 `simple` 查詢有些許影響，可透過後續監控 groundedness score 調整分類邏輯。

**[風險] Self-reflection 模型輸出不穩定（非 YES/NO）** → Mitigation：使用嚴格 regex 解析回應，非標準輸出視為 YES（不重試），不影響正常流程。

## Migration Plan

1. 新增 D1 migration SQL（`ai_query_logs` 新增 4 欄位）
2. 更新 `TOOL_SELECTION_PROMPT` 加入 `query_type` 欄位
3. 新增 `RETRIEVAL_JUDGE_PROMPT`（CRAG）、`SELF_REFLECTION_PROMPT` 至 `ai-prompts.ts`
4. 重構 `QueryService.ask()` 加入 routing 邏輯
5. 部署 migration：`pnpm db:migrate:remote`

**Rollback**：migration 欄位均為 nullable，舊版 code 寫入不帶新欄位的 log 仍相容；若 routing 邏輯有問題，可透過 `ai_config` 表新增 `adaptive_rag_enabled = false` flag 快速停用（待 Phase 2 完成後考慮加入）。

## Open Questions

- `query_type` 分類準確率預期多少？是否需要記錄 classifier 信心分數供後續分析？（建議第一版先不加，觀察 log 後再決定）
- CRAG retry 放寬策略是否應同時考慮放寬 `type` filter？（目前僅放寬 `grade_numeric`）
