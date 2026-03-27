## 1. Backend：filter trace 擴充

- [x] 1.1 在 `backend/src/services/query.ts` 的 filter building 邏輯（Stage 2）中，補充 `trace.filter.matched_texts`：記錄 LLM 抽取的 area_name、crag_name、grade、route_type 各欄位對應的原始文字
- [x] 1.2 補充 `trace.filter.resolved_ids`：在 `buildFiltersFromParsed` 完成 DB 查詢後，將解析到的 area_id / crag_id 寫入 trace
- [x] 1.3 補充 `trace.query_parsing.fallback_used`：LLM 解析失敗時設為 `true`，成功時設為 `false`

## 2. Backend：retrieval 子步驟 trace 擴充

- [x] 2.1 在 `mergeResults` / RRF 合併完成後，寫入 `trace.retrieval.rrf`：`{ paths_count, merged_count, min_score_threshold, after_threshold_count }`
- [x] 2.2 在 CRAG fallback 每次重試後，追加 `trace.retrieval.crag_fallback_detail`：`{ trigger_reason, retries: [{ removed_filter, candidates_after }] }`
- [x] 2.3 在 cross-encoder reranking 完成後，寫入 `trace.retrieval.reranker`：`{ input_count, top_scores: [{ title, score }] }`；若未執行寫 `{ skipped_reason }`

## 3. Backend：mmr_selection trace 新增

- [x] 3.1 在 `applyMMR` 呼叫後、熱門度排序完成後，寫入 `trace.mmr_selection`：`{ lambda, input_count, selected_count, popularity_weight, top_selected: [{ title, relevance_score, popularity_score, final_score }] }`（最多 5 筆）

## 4. Backend：self_reflection trace 因果鏈擴充

- [x] 4.1 在第一次 judge 評分完成後（判斷是否觸發 regen 之前），記錄 `first_judge_quality` 和 `first_judge_groundedness` 至 `trace.self_reflection`
- [x] 4.2 觸發 regen 時記錄 `regen_reason`（`'quality_below_threshold'` / `'groundedness_below_threshold'` / `'both'`）
- [x] 4.3 regen judge 完成後，記錄 `second_judge_quality`、`second_judge_groundedness`、`acceptance_reason`（`'regen_accepted'` / `'original_kept'`）

## 5. Backend：generation / judge / agentic trace 補充

- [x] 5.1 在 generation 執行前，寫入 `trace.generation.context_doc_titles`（實際注入 prompt 的文件標題陣列，最多 10 筆）
- [x] 5.2 寫入 `trace.generation.prompt_template`（`'personalized'` 或 `'default'`）與 `trace.generation.memory_summary_preview`（前 200 字，無則 null）
- [x] 5.3 在 judge 評判完成後，將各向度分數寫入 `trace.judge_detail = { raw_scores, criteria }`（注意：寫到 pipeline_trace，不是 pipeline 物件；admin-ai.ts 中 pipeline.judge 已 spread pt.judge_detail）
- [x] 5.4 在 `backend/src/routes/admin-ai.ts` 的 `pipeline.judge` 物件中，補充 `...((pt?.judge_detail as Record<string, unknown>) ?? {})`，讓前端可讀到 raw_scores / criteria
- [x] 5.5 在 agentic 每個 step 完成後，補充 `docs_retrieved`；agentic 迴圈結束時寫入 `termination_reason`

## 6. Frontend：pipeline stage 順序與新增 stage

- [x] 6.1 在 `[logId]/page.tsx` 的靜態 `pipelineStages` 陣列中，在 `'hyde'` 後、`'embedding'` 前插入 `'filter'`（結果順序：hyde → [agentic] → [multi_query] → filter → embedding）
- [x] 6.2 在動態 stage 插入邏輯中（`if (key === 'retrieval')` 區段），當 `pipelineTrace?.mmr_selection` 存在時，在 `retrieval` 後動態插入 `{ key: 'mmr_selection', isTraceOnly: true }`（與 agentic/multi_query 相同模式）
- [x] 6.3 更新 `STAGE_LABELS`、`StageIcon` 加入 `filter` 與 `mmr_selection` 的標籤與 icon
- [x] 6.4 更新 `StageTraceDetail` 分發邏輯，加入 `filter` → `FilterTrace`、`mmr_selection` → `MMRSelectionTrace`
- [x] 6.5 在 `backend/src/routes/admin-ai.ts` 的 `pipeline` 物件中，新增 `filter` key：`filter: { service: 'services/query.ts', description: '建構 Vectorize metadata filter', skipped: isCacheHit || queryType === 'general-knowledge', ...((pt?.filter as Record<string, unknown>) ?? {}) }`

## 7. Frontend：新增 FilterTrace 元件

- [x] 7.1 建立 `FilterTrace` 元件：Input 顯示 params（area_name、crag_name、grade、route_type）；Decision 顯示 filter 來源 badge + matched_texts（各欄位觸發文字）+ resolved_ids；Output 顯示最終 filter JSON（`pre` 格式化）
- [x] 7.2 處理 `history_supplemented = true` 時的額外提示（從對話歷史補充位置）

## 8. Frontend：新增 MMRSelectionTrace 元件

- [x] 8.1 建立 `MMRSelectionTrace` 元件：Input 顯示 input_count + lambda + popularity_weight；Decision 顯示 MMR 多樣性選取說明；Output 顯示 selected_count + top_selected 清單（title / relevance / popularity / final score 各欄）

## 9. Frontend：RetrievalTrace 子步驟擴充

- [x] 9.1 在 `RetrievalTrace` 的 Decision 區段內新增「多路搜尋」子步驟：顯示搜尋路徑 badges（query_vec / hyde_vec / expanded × N / BM25）與各路候選數
- [x] 9.2 新增「RRF 融合」子步驟：顯示 `rrf.paths_count`、`merged_count`、`min_score_threshold`（設定值）、`after_threshold_count`
- [x] 9.3 新增「CRAG Fallback」子步驟：若 `crag_fallback_detail` 存在，顯示 trigger_reason + 每次重試移除的 filter 與候選數；未觸發顯示「未觸發」
- [x] 9.4 新增「Cross-encoder」子步驟：若 `reranker.top_scores` 存在，顯示前 5 筆文件 title + score；若 skipped_reason 存在顯示未執行原因

## 10. Frontend：SelfReflectionTrace 因果鏈更新

- [x] 10.1 在 `SelfReflectionTrace` 的 Decision 區段改為因果鏈格式：「第一次 Judge：quality X / groundedness Y → 觸發原因：Z → 重生成執行 → 第二次 Judge：quality A / groundedness B → 選擇：接受/拒絕（原因）」
- [x] 10.2 更新未觸發情境：顯示「第一次 Judge quality 高於閾值（X > threshold），使用原始回答」

## 11. Frontend：JudgeTrace 與 GenerationTrace 更新

- [x] 11.1 更新 `JudgeTrace`：在現有 groundedness / auto_score 基礎上，新增 `raw_scores`（各向度分數）與 `criteria` 顯示
- [x] 11.2 更新 `GenerationTrace` Input 區段：新增 `context_doc_titles` 清單顯示、`prompt_template` badge、`memory_summary_preview` 折疊文字

## 12. Frontend：Decision Narrative 元件

- [x] 12.1 建立 `DecisionNarrative` 元件，接受 `pipeline_trace`、`pipeline`、`latency` 為 props，組合單行敘事文字
- [x] 12.2 實作快取命中敘事（`KV 快取命中 → 直接回傳` / `語義快取命中`）
- [x] 12.3 實作通識查詢敘事（`通識查詢 → 跳過向量搜尋 → LLM 直接生成`）
- [x] 12.4 實作完整 RAG 查詢敘事（依序串接：查詢類型 → filter 關鍵詞 → 搜尋路徑數 → RRF 前後候選數 → CRAG 狀態 → cross-encoder → MMR 選取數 → Judge 分數 → groundedness）
- [x] 12.5 在 `[logId]/page.tsx` 頁面頂部（query/response 卡片上方）插入 `<DecisionNarrative />`

## 13. Frontend：AILogDetail 型別更新

- [x] 13.1 在 `apps/web/src/lib/api/admin-ai.ts` 的 `AILogDetail.pipeline_trace` 型別中，新增所有本次擴充的欄位型別定義（filter.matched_texts / filter.resolved_ids / retrieval.rrf / retrieval.crag_fallback_detail / retrieval.reranker / mmr_selection / self_reflection 因果鏈欄位 / generation 補充欄位）
