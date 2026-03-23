## Why

admin/ai/logs 詳情頁的 Pipeline 流程顯示與系統文件記載的「完整 12 步查詢 Pipeline」存在嚴重落差：多個關鍵步驟完全不可見（filter 建構、MMR 選取）、重要的子步驟被塞進同一張卡片（多路搜尋、RRF 融合、CRAG 放寬、Cross-encoder 全部隱藏在 `retrieval` 一張卡裡）、部分決策因果關係呈現混淆（judge 與 self_reflection 的觸發順序顛倒）。

管理員無法從 logs 回答「這次查詢品質差，究竟是哪一步出了問題？」，也無法用 logs 系統性地優化 AI 服務的各個參數（閾值、權重、fallback 策略）。

## What Changes

### 1. 頁面頂部：決策敘事摘要（Decision Narrative）

在日誌詳情頁頂部新增機器組合的單行敘事，串連整條 pipeline 關鍵決策結果。
- 例：`複雜查詢 → filter:中正 → 3路搜尋+BM25 → 23→9筆 → HyDE → cross-encoder → MMR(5筆) → Judge 3.2 觸發regen → regen接受(4.1) → groundedness 87%`
- 純前端組合，從 pipeline_trace 推算，不需後端新增欄位

### 2. 新增 `filter` 為獨立 Pipeline Stage（前端 + 小量後端）

`filter` 的基礎資料（applied filter JSON）已存在 pipeline_trace，但前端 `pipelineStages` 陣列根本沒有它，導致完全不可見。需要：
- `admin-ai.ts`：在 `pipeline` 物件中新增 `filter` key（spread `pt.filter`）
- `[logId]/page.tsx`：在 `pipelineStages` 中插入 `'filter'`、新增 `FilterTrace` 元件
- `query.ts`：補充 `matched_texts` 和 `resolved_ids` 讓 Decision 區段有足夠決策細節

`FilterTrace` 元件顯示：
  - **Input**：LLM 抽取的 params（area_name, crag_name, grade, route_type）
  - **Decision**：DB 查詢 area_id / crag_id 的解析過程、各 NLP 方法（llm_parsed / regex_fallback / sim_route / history_supplemented）
  - **Output**：最終 Vectorize metadata filter 物件（JSON）

### 3. 拆解 `retrieval` 為子步驟時間軸（前端 + 後端 trace 擴充）

目前 `retrieval` 一張卡隱藏了 5 個不同決策點。改為在 `retrieval` 卡片展開時顯示內嵌子步驟時間軸：

**子步驟 A：多路搜尋**（前端顯示改善，無需新增後端欄位）
- 顯示搜尋路徑：`query_vec` + `hyde_vec`（complex）+ `expanded × N`（complex）+ `BM25`
- 各路搜尋候選數

**子步驟 B：RRF 合併**（後端新增 `rrf` trace 欄位）
- `paths_count`：參與合併的路徑數
- `merged_count`：合併後總候選數
- `min_score_threshold`：套用的最低 RRF 分數閾值（`min_rrf_score` 或 `min_rrf_score_filtered`）
- `after_threshold_count`：通過閾值的候選數

**子步驟 C：CRAG Fallback**（後端擴充現有 `crag_fallback` 欄位）
- 觸發原因：`'no_results_with_grade_filter'` / `'no_results_with_type_filter'`
- 每次重試時移除哪個 filter
- 最終重試後的候選數

**子步驟 D：Cross-encoder Reranking**（後端新增 `reranker` trace 欄位）
- `input_count`：送入 cross-encoder 的候選數
- `top_scores`：前 5 筆候選的 cross-encoder 分數（title + score）
- `skipped_reason`：若未啟用，原因（`'disabled'` / `'too_few_candidates'`）

### 4. 新增 `mmr_selection` 為獨立 Pipeline Stage（後端 trace + 前端）

MMR + 熱門度加權選取目前完全未記錄。

**後端**：在 `applyMMR` + 熱門度排序後寫入 `trace.mmr_selection`：
```typescript
trace.mmr_selection = {
  lambda: pipelineCfg.mmr_lambda,
  input_count: scoredCandidates.length,
  selected_count: mmrSelected.length,
  popularity_weight: pipelineCfg.popularity_weight,
  top_selected: mmrSelected.slice(0, 5).map(m => ({
    title: m.title,
    relevance_score: m.score,
    popularity_score: m.popularityScore,
    final_score: m.finalScore,
  })),
}
```

**前端**：在 `retrieval` 後插入 `mmr_selection` stage card，新增 `MMRSelectionTrace` 元件，顯示 MMR 多樣性選取邏輯（輸入 N 筆 → 選出 K 筆，每筆的相關性 vs 多樣性分數）。

### 5. 修正 `judge` 與 `self_reflection` 的因果鏈呈現

目前順序：`generation → self_reflection → judge`（誤導性，讓人以為 self_reflection 在 judge 之前）

實際流程：
```
generation → [第一次 judge 評估品質] → (若 quality ≤ 閾值 → self_reflection 重生成) → [第二次 judge] → 比較 groundedness 取較高者
```

**修正**：
- `self_reflection` stage 展示時，清楚顯示「第一次 judge 分數 → 觸發原因 → 重生成 → 第二次 judge 分數 → 最終選擇原因」的完整因果鏈
- 新增 `quality_threshold`、`regen_reason`、`acceptance_reason` 欄位至後端 self_reflection trace

### 6. 各決策階段：補充 Decision 細節欄位（後端 trace 擴充）

**query_parsing**：
- 移除硬編碼 `alternatives`，改記錄 `chosen_tool_reason`（LLM 選擇該工具的推論摘要，若 LLM 有提供）
- 新增 `fallback_used: boolean`（是否因 LLM 失敗而改用 regex fallback）

**generation**：
- 新增 `context_doc_titles`：實際注入 prompt 的文件標題陣列
- 新增 `prompt_template`：使用的 system prompt 模板（`'personalized'` / `'default'`）
- 新增 `memory_summary_preview`：記憶摘要前 200 字（已注入時才顯示）

**judge**：
- 新增 `criteria`：本次評判使用的向度清單
- 新增 `raw_scores`：各向度個別分數（relevance, groundedness, helpfulness）

**agentic**（若走 agentic 路徑）：
- 每個 step 新增 `docs_retrieved`
- 新增 `termination_reason`

## Capabilities

### New Capabilities

（無全新 capability）

### Modified Capabilities

- `ai-rag-tracing`：pipeline_trace 需新增 `rrf`、`reranker`、`mmr_selection`、`crag_fallback` 擴充欄位，以及 `query_parsing`、`generation`、`judge`、`self_reflection` 的補充欄位
- `ai-admin-dashboard`：日誌詳情頁需新增 Decision Narrative、`filter` / `mmr_selection` stage cards、`retrieval` 子步驟展開、修正 judge/self_reflection 因果鏈顯示

## Impact

- `backend/src/services/query.ts`：在 `applyMMR`、`mergeResults`、cross-encoder reranking、self_reflection 等環節補寫 trace 欄位（約 8 處新增）
- `apps/web/src/app/admin/ai/logs/[logId]/page.tsx`：
  - 新增 `DecisionNarrative` 元件
  - 新增 `FilterTrace`、`MMRSelectionTrace` 元件
  - 擴充 `RetrievalTrace`（子步驟時間軸）
  - 更新 `SelfReflectionTrace`（完整因果鏈）
  - 更新 `JudgeTrace`（各向度分數）
  - 修改 `pipelineStages` 陣列插入 `filter`、`mmr_selection`
- `apps/web/src/lib/api/admin-ai.ts`：擴充 AILogDetail pipeline_trace 型別
- 不需要 DB migration（pipeline_trace 為 TEXT/JSON，完全向後相容）
- 不影響任何對外 API 行為，純屬 admin 觀測介面改善
