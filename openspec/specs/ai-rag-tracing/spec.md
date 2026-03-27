## ADDED Requirements

### Requirement: RAG 分段 Latency 追蹤
系統 SHALL 在 RAG 查詢執行過程中，分別記錄三個關鍵階段的耗時（毫秒）：embedding 階段、retrieval 階段（向量搜尋 + reranking + MMR）、generation 階段（LLM 生成 + 回答後處理）。計時使用 `Date.now()` 差值，精度約 ±5ms。

#### Scenario: 完整 RAG pipeline 計時
- **WHEN** 查詢走完整 RAG 流程（embedding → search → LLM）
- **THEN** 系統記錄 embedding_ms、retrieval_ms、generation_ms 三個數值，皆為正整數

#### Scenario: 快取命中時不計時
- **WHEN** 查詢命中 KV 快取，直接返回快取結果
- **THEN** embedding_ms、retrieval_ms、generation_ms 皆記錄為 null（無實際計算）

#### Scenario: General knowledge 路徑計時
- **WHEN** 查詢走 general_knowledge 路徑（無向量搜尋）
- **THEN** embedding_ms = null、retrieval_ms = null，generation_ms 記錄 LLM 呼叫耗時

#### Scenario: Generation 計時包含後處理
- **WHEN** LLM 生成完成後執行 parseSuggestedQuestions() 後處理
- **THEN** generation_ms 包含 LLM 呼叫 + parseSuggestedQuestions() 的完整耗時（反映用戶感受的延遲）

### Requirement: 分段延遲記錄
系統 SHALL 將三個分段延遲值寫入 `ai_query_logs` 的對應欄位（`embedding_ms`、`retrieval_ms`、`generation_ms`，INTEGER 型別，皆 nullable）。

#### Scenario: 三段延遲全部寫入
- **WHEN** 完整 RAG pipeline 執行完畢
- **THEN** logQuery() 呼叫包含三個延遲值，且均寫入 DB

#### Scenario: 延遲值不為負數
- **WHEN** 任何分段計時結果為負數（時鐘異常）
- **THEN** 該欄位記錄為 null，不寫入負值

### Requirement: 低分 Feedback 自動標記
系統 SHALL 在用戶提交 feedback_score <= 2 時，自動向 `ai_flagged_responses` 新增 flag_reason = `low_feedback` 的標記記錄。

#### Scenario: 低評分觸發標記
- **WHEN** 用戶提交 feedback_score = 1 或 2
- **THEN** 系統向 ai_flagged_responses 新增記錄：flag_reason = `low_feedback`，is_reviewed = false

#### Scenario: 中高評分不觸發標記
- **WHEN** 用戶提交 feedback_score >= 3
- **THEN** 系統不新增 low_feedback 標記

#### Scenario: 同一 query 可有多個 flag 原因
- **WHEN** 同一查詢同時符合 low_groundedness 和 low_feedback 條件
- **THEN** ai_flagged_responses 新增兩筆記錄，各有不同的 flag_reason，皆為獨立審核項目

### Requirement: 標記審核管理
`ai_flagged_responses` 資料表 SHALL 支援管理員標記「已處理」以追蹤審核進度。

#### Scenario: 管理員標記已處理
- **WHEN** 管理員審核完一筆標記記錄後呼叫更新端點
- **THEN** 該記錄的 is_reviewed = true，不再出現在「待審核」篩選結果中

#### Scenario: 未審核標記查詢
- **WHEN** Admin API 查詢 is_reviewed = false 的標記
- **THEN** 只回傳尚未審核的記錄，依 created_at 降序排列

### Requirement: filter stage trace 記錄

系統 SHALL 在 `pipeline_trace.filter` 中記錄 filter 建構的決策細節，包含觸發各過濾條件的原始文字片段與 DB 查詢解析結果。

#### Scenario: LLM 解析路徑記錄 matched_texts
- **WHEN** query_parsing 使用 LLM Tool Calling 成功解析並建構 filter
- **THEN** `pipeline_trace.filter.matched_texts` 記錄各欄位對應的原始 query 文字片段（area_name、crag_name、grade、route_type，僅記錄 LLM 抽取的值，未抽取則省略該鍵）

#### Scenario: filter 記錄 DB 解析的 ID
- **WHEN** filter building 完成 area_id 或 crag_id 的 DB 查詢
- **THEN** `pipeline_trace.filter.resolved_ids` 記錄實際解析出的 ID 值（`{ area_id?: string, crag_id?: string | string[] }`），未找到則為 null

#### Scenario: regex fallback 路徑記錄 source
- **WHEN** LLM 解析失敗改用 regex fallback 建構 filter
- **THEN** `pipeline_trace.filter.source` 為 `'regex_fallback'`，`matched_texts` 記錄 regex 匹配到的文字片段

#### Scenario: 對話歷史補充位置記錄
- **WHEN** query 含指代詞且從對話歷史補充 crag/region 位置
- **THEN** `pipeline_trace.filter.history_supplemented` 為 `true`，`matched_texts.from_history` 記錄補充來源文字

---

### Requirement: retrieval stage trace 子步驟擴充

系統 SHALL 在 `pipeline_trace.retrieval` 中記錄 RRF 融合、CRAG fallback、Cross-encoder 各子步驟的決策細節。

#### Scenario: RRF 融合記錄閾值與過濾結果
- **WHEN** 多路搜尋結果完成 RRF 合併
- **THEN** `pipeline_trace.retrieval.rrf` 記錄：`paths_count`（參與合併的路徑數）、`merged_count`（合併後候選總數）、`min_score_threshold`（套用的 RRF 分數閾值）、`after_threshold_count`（通過閾值的候選數）

#### Scenario: CRAG fallback 記錄每次重試細節
- **WHEN** 第一次搜尋無結果，觸發 CRAG fallback
- **THEN** `pipeline_trace.retrieval.crag_fallback_detail` 記錄：`trigger_reason`（`'no_results_with_grade_filter'` / `'no_results_with_type_filter'`）、`retries`（陣列，每次重試移除的 filter key 與重試後候選數）

#### Scenario: Cross-encoder 記錄輸入輸出
- **WHEN** cross-encoder reranking 執行
- **THEN** `pipeline_trace.retrieval.reranker` 記錄：`input_count`（送入候選數）、`top_scores`（前 5 筆的 `{ title, score }` 陣列）
- **WHEN** cross-encoder 未執行
- **THEN** `pipeline_trace.retrieval.reranker` 記錄：`skipped_reason`（`'disabled'` / `'too_few_candidates'`）

#### Scenario: query_parsing fallback_used 記錄
- **WHEN** LLM Tool Calling 解析失敗改用 regex fallback
- **THEN** `pipeline_trace.query_parsing.fallback_used` 為 `true`
- **WHEN** LLM Tool Calling 成功
- **THEN** `pipeline_trace.query_parsing.fallback_used` 為 `false`

---

### Requirement: mmr_selection stage trace 記錄

系統 SHALL 在 `pipeline_trace.mmr_selection` 中記錄 MMR 多樣性選取與熱門度加權排序的決策細節。目前此步驟完全未記錄至 trace。

#### Scenario: MMR 選取記錄輸入輸出
- **WHEN** MMR 選取完成
- **THEN** `pipeline_trace.mmr_selection` 記錄：`lambda`（mmr_lambda 設定值）、`input_count`（cross-encoder 後候選數）、`selected_count`（MMR 選出的文件數）、`popularity_weight`（熱門度加權設定值）

#### Scenario: MMR 記錄最終選取文件
- **WHEN** MMR + 熱門度排序完成
- **THEN** `pipeline_trace.mmr_selection.top_selected` 記錄前 5 筆文件的 `{ title, relevance_score, popularity_score, final_score }`

---

### Requirement: self_reflection stage trace 因果鏈擴充

系統 SHALL 在 `pipeline_trace.self_reflection` 中記錄觸發重生成的判斷依據與最終選擇原因，使因果鏈完整可追蹤。

#### Scenario: 記錄第一次 judge 分數（觸發判斷依據）
- **WHEN** self_reflection 被觸發（quality ≤ threshold）
- **THEN** `pipeline_trace.self_reflection.first_judge_quality` 記錄第一次 judge 的 quality 分數，`pipeline_trace.self_reflection.first_judge_groundedness` 記錄 groundedness 分數

#### Scenario: 記錄觸發原因
- **WHEN** self_reflection 被觸發
- **THEN** `pipeline_trace.self_reflection.regen_reason` 記錄 `'quality_below_threshold'` / `'groundedness_below_threshold'` / `'both'`

#### Scenario: 記錄最終選擇原因
- **WHEN** self_reflection 完成（regen 被接受或拒絕）
- **THEN** `pipeline_trace.self_reflection.second_judge_quality` 記錄重生成後的 quality 分數，`pipeline_trace.self_reflection.second_judge_groundedness` 記錄 groundedness 分數，`pipeline_trace.self_reflection.acceptance_reason` 記錄 `'regen_accepted'` / `'original_kept'`

---

### Requirement: generation stage trace 擴充

系統 SHALL 在 `pipeline_trace.generation` 中記錄實際注入 LLM prompt 的文件清單與 prompt 模板資訊。

#### Scenario: 記錄 context 文件清單
- **WHEN** LLM generation 執行
- **THEN** `pipeline_trace.generation.context_doc_titles` 記錄實際注入 prompt 的文件標題陣列（最多 10 筆）

#### Scenario: 記錄 prompt 模板名稱
- **WHEN** LLM generation 執行
- **THEN** `pipeline_trace.generation.prompt_template` 記錄使用的 system prompt 模板（`'personalized'` 若有注入記憶/攀登 context，否則 `'default'`）

#### Scenario: 記錄記憶摘要預覽
- **WHEN** 個人化 memory_summary 已注入
- **THEN** `pipeline_trace.generation.memory_summary_preview` 記錄 memory_summary 的前 200 字元
- **WHEN** 未注入記憶摘要
- **THEN** `pipeline_trace.generation.memory_summary_preview` 為 `null`

---

### Requirement: judge stage trace 各向度分數記錄

系統 SHALL 在 `pipeline_trace.judge_detail` 中記錄各評判向度的個別分數，再由 `admin-ai.ts` 的 pipeline.judge 物件 spread 後暴露給前端。

#### Scenario: 記錄各向度原始分數
- **WHEN** Judge LLM 完成評判輸出
- **THEN** `pipeline_trace.judge_detail.raw_scores` 記錄各向度分數（依 judge prompt 定義的向度，例如 `{ relevance, groundedness, helpfulness }`）

#### Scenario: 記錄評判向度清單
- **WHEN** Judge LLM 完成評判輸出
- **THEN** `pipeline_trace.judge_detail.criteria` 記錄本次使用的評判向度名稱陣列

#### Scenario: admin-ai.ts 正確 spread judge_detail
- **WHEN** admin-ai.ts 建構 pipeline.judge 物件
- **THEN** `pipeline.judge` spread `pt.judge_detail`，使前端可從 `pipelineStage.raw_scores` 與 `pipelineStage.criteria` 直接讀取

---

### Requirement: agentic stage trace 擴充

系統 SHALL 在 `pipeline_trace.agentic.steps` 的每個步驟中記錄該步驟的文件檢索數，並記錄 agentic 迴圈的終止原因。

#### Scenario: 每步記錄 docs_retrieved
- **WHEN** agentic 每個步驟的搜尋完成
- **THEN** 對應 step 物件的 `docs_retrieved` 記錄該步驟取回的文件數

#### Scenario: 記錄終止原因
- **WHEN** agentic 迴圈結束
- **THEN** `pipeline_trace.agentic.termination_reason` 記錄 `'enough_docs'` / `'max_steps'` / `'no_improvement'`
