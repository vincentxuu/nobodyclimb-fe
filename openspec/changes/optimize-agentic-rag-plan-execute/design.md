## Context

目前 Agentic RAG 系統已實作 ReAct 策略（`agenticRetrieve()`），支援 ANSWER / RETRIEVE / BROADEN 三種動作，透過 `rag_strategy: 'agentic'` 啟用，僅對 `complex` 查詢類型生效。ReAct 是循序式決策：每步 LLM 判斷 → 執行 → 觀察，適合探索性查詢但對結構明確的多實體查詢效率低。

現有架構優勢：
- Pipeline Engine 已支援並行分支（`cloneBranchContext` + `Promise.all` + fusion）
- 模型分層已落實（Gemma 12B 主模型 + Llama 8B 輕量模型）
- `ai_config` 支援動態配置，`ai_prompts` 支援 DB prompt 管理
- `hybrid-search` 步驟已有 baseline / agentic 雙路分支邏輯

約束：
- Cloudflare Workers 30s 硬限制，Plan-and-Execute 需額外 LLM 呼叫（planning + synthesis），須控制總延遲
- Workers AI 無 per-token 計費，成本非主要考量
- 攀岩知識問答場景，多數查詢為 simple/complex 探索性，多實體比較查詢佔比較低

## Goals / Non-Goals

**Goals:**
- 新增 Plan-and-Execute 策略：先產生結構化計畫，再並行執行子任務，最後合併結果
- 新增 Adaptive Plan 機制：執行中途可根據子任務結果動態調整剩餘計畫
- 實作策略自動選擇（`rag_strategy: 'auto'`）：根據查詢特性自動選擇 baseline / ReAct / Plan-and-Execute
- 完整整合現有 Pipeline Engine 架構，復用現有 step 和配置機制
- 可透過 `ai_config` 動態啟停和調參，無需部署

**Non-Goals:**
- 不實作 Graph RAG（攀岩領域關係簡單，不需要多跳實體推理）
- 不實作 Multi-Agent 架構（Pipeline 模組化已覆蓋多數價值）
- 不重構現有 ReAct 策略（共存而非取代）
- 不建立 A/B 測試框架（屬獨立 change，可後續建立）
- 不修改前端 API 介面（trace 格式擴充向下相容）

## Decisions

### 決策 1：Plan-and-Execute 整合位置 — 在 `hybrid-search` 步驟內新增第三分支

**選擇**：在 `hybrid-search.ts` 的 `execute()` 方法中新增 `plan-execute` 分支，與現有 baseline / agentic 分支平行。

**替代方案**：
- A. 新增獨立 pipeline step `plan-execute`：需修改 registry、skipWhen 邏輯，且 planning 階段需要在 retrieval phase 之前（pre-retrieval），但 execution 階段又需要 retrieval 能力，跨 phase 困難
- B. 在 `query.ts` 的 `ask()` 方法層級實作：繞過 Pipeline Engine，失去步驟管理、trace、DB 配置等好處

**理由**：`hybrid-search` 已有根據 `rag_strategy` 分支的模式（baseline / agentic），新增第三分支最自然。Plan-and-Execute 的 planning、execution、synthesis 三階段都在 retrieval phase 內完成，下游 post-retrieval 步驟（reranking、MMR）照常處理合併後的結果。

### 決策 2：Planning 使用強模型，Execution 使用輕量模型

**選擇**：
- `planQuery()`：使用 `cfg.llm_model`（Gemma 12B），需要深度理解查詢結構
- `executePlan()` 的子查詢：復用現有檢索管線（embedding → vector search → BM25 或 TextToSqlService），不需額外 LLM
- `synthesize()`：使用 `cfg.llm_model`（Gemma 12B），智慧合併多源結果為結構化 context（非最終答案）
- 最終答案：由下游 `llm-generation` 步驟統一生成，確保與現有 pipeline 一致

**理由**：Planning 需要高品質推理來分解查詢。Execution 本質是檢索操作，不需 LLM。Synthesis 負責將多個子任務的檢索結果智慧組織為結構化 context（按實體分段、標註來源、處理矛盾），但**不生成最終回答**——最終回答統一由 `llm-generation` 步驟產出，這樣可以復用現有的 system prompt、個人化注入、output guardrails 等機制，避免重複生成。

### 決策 3：Adaptive Plan — 輕量級中途修改機制

**選擇**：在每個子任務完成後檢查結果是否為空。若某子任務結果為 0 筆：
1. 使用輕量模型快速判斷是否需要修改剩餘計畫
2. 若需要，生成替代子任務（如放寬過濾條件或切換工具）
3. 最多觸發 1 次 replan，避免延遲失控

**替代方案**：
- A. 每步都 replan（完整 Adaptive Plan）：延遲過高，接近 ReAct
- B. 不做 replan（純 Plan-and-Execute）：遇到檢索失敗時無法補救

**理由**：僅在子任務失敗（0 筆結果）時觸發 replan，平衡了適應性和延遲。多數情況下計畫正常執行，只有異常情況才啟動輕量 replan。

### 決策 4：策略自動選擇邏輯 — 在 tool-selection 步驟中判斷

**選擇**：在 `tool-selection` 步驟的 LLM 呼叫中，擴充 `TOOL_SELECTION_PROMPT` 輸出新欄位 `strategy_hint`，指示建議的 RAG 策略。

策略選擇規則：
- `simple` 查詢 → 永遠 `baseline`
- `complex` + 涉及 2+ 個明確實體比較 → `plan-execute`
- `complex` + 探索性/模糊意圖 → `agentic`（ReAct）
- `sql` / `hybrid` / `general-knowledge` → `baseline`（不需 agentic 策略）

**理由**：tool-selection 步驟已有 LLM 呼叫做查詢分類，在同一次呼叫中加入策略建議幾乎零額外成本。當 `rag_strategy: 'auto'` 時使用此 hint；指定具體策略時忽略 hint。

### 決策 5：子任務執行復用現有檢索基礎設施

**選擇**：每個子任務直接呼叫 `QueryService` 的 embedding + vector search + BM25 方法（與 `runAgenticSearch()` 同層級），而非遞迴呼叫完整 pipeline。

**理由**：
- 避免巢狀 pipeline 的複雜度和效能開銷
- 子任務只需檢索（embedding + search + merge），不需 HyDE、multi-query expansion 等前處理
- 每個子任務已由 planning 階段精確定義查詢和工具，不需再分類

### 決策 6：新增 Prompt 模板 — PLANNING_PROMPT 和 SYNTHESIS_PROMPT

**PLANNING_PROMPT** 輸出格式：
```json
{
  "steps": [
    { "id": 1, "query": "子查詢文字", "tool": "search_routes|search_crags|sql_query", "filters": {}, "depends_on": [] },
    { "id": 2, "query": "...", "tool": "...", "depends_on": [1] }
  ],
  "execution_mode": "parallel|sequential|mixed"
}
```

**SYNTHESIS_PROMPT** 接收所有子任務的檢索結果，將它們智慧合併為結構化 context（按實體分段、標註來源、處理矛盾資訊）。注意：Synthesis 的輸出是 context 而非最終回答，最終回答由 `llm-generation` 步驟統一生成。

兩個 prompt 均支援 `ai_prompts` DB 管理，可動態調整。

## Risks / Trade-offs

**[延遲增加]** Plan-and-Execute 多了 planning + synthesis 兩次 LLM 呼叫（各約 1-3s），總延遲可能比 baseline 多 2-6s。
→ 緩解：子任務並行執行（`Promise.all`）抵消部分延遲；設定 planning_timeout_ms 和 synthesis_timeout_ms 上限；超時降級為 ReAct 或 baseline。

**[Planning 品質]** Gemma 12B 可能無法穩定產生有效的結構化計畫（JSON 格式錯誤、子任務分解不合理）。
→ 緩解：JSON 解析失敗時 fallback 到 ReAct 策略；限制最大子任務數（`plan_execute_max_steps`，預設 4）；prompt 提供充足的 few-shot 範例。

**[Workers 30s 限制]** Plan-and-Execute 的完整流程（planning + 並行 execution + synthesis + judge）可能接近 30s 上限。
→ 緩解：每階段有獨立 timeout；planning 超時 → 直接 fallback；子任務超時 → 用已完成的結果繼續 synthesis。

**[策略選擇誤判]** `auto` 模式可能將不適合 Plan-and-Execute 的查詢錯誤路由。
→ 緩解：初期保守設定（僅在檢測到 2+ 個明確實體比較時才觸發）；`strategy_hint` 僅為建議，可被 `rag_strategy` 硬設定覆蓋。

**[Adaptive Plan 複雜度]** Replan 邏輯增加 code path 和測試複雜度。
→ 緩解：replan 限制最多 1 次；初期可透過 `adaptive_plan_enabled: false` 停用，僅用純 Plan-and-Execute。

**[SSE Streaming 延遲]** Plan-and-Execute 的 planning + execution 階段無法串流，time to first token 比 baseline 多 3-8s。
→ 緩解：planning 和 execution 完成後，將結構化 context 交給 `llm-generation` 步驟，該步驟在 streaming 模式下正常串流回答。用戶感受為「等待較久後開始收到串流」，非整體無串流。

**[SQL 子任務與 reranking 相容性]** 子任務可能混合 vector search 和 SQL 結果，SQL 結果無 embedding 向量，`cross-encoder` reranking 可能無法正確處理。
→ 緩解：`synthesize()` 在合併 context 時已按子任務結構化組織，SQL 結果以文字形式嵌入 context。若下游 reranking 步驟收到的 candidateMatches 中 SQL 結果缺少向量，標記為 `skip_rerank` 保留原排序。

## Migration Plan

1. **Phase 1 — 基礎設施**：新增 `planQuery()`、`executePlan()`、`synthesize()` 方法於 `query.ts`，新增 PLANNING_PROMPT 和 SYNTHESIS_PROMPT 於 `ai-prompts.ts`
2. **Phase 2 — Pipeline 整合**：在 `hybrid-search.ts` 新增 `plan-execute` 分支，新增 `ai_config` 配置項
3. **Phase 3 — 策略選擇**：擴充 `tool-selection.ts` 的 prompt 輸出 `strategy_hint`，實作 `auto` 模式邏輯
4. **Phase 4 — Adaptive Plan**：在 executePlan 中加入子任務失敗時的 replan 邏輯
5. **Rollback**：所有功能由 `rag_strategy` 配置控制，設回 `'baseline'` 或 `'agentic'` 即可完全停用 Plan-and-Execute，無需程式碼變更

## Open Questions

1. ~~Plan-and-Execute 是否需要獨立的 `max_steps` 配置，還是復用 `agentic_max_steps`？~~ → 使用獨立的 `plan_execute_max_steps`，兩種策略的步驟數含義不同
2. 多實體比較查詢在實際流量中的佔比未知，需在上線後收集數據評估 Plan-and-Execute 的觸發頻率和效果
3. Synthesis 階段是否需要像 Judge 一樣做 groundedness 評估？初期由下游 judge step 統一處理
