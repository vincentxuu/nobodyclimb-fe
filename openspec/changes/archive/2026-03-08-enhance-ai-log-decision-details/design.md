## Context

NobodyClimb AI 問答系統的查詢 Pipeline 共有 17 個執行階段（含子步驟），但 admin/ai/logs 詳情頁目前只顯示其中 12 個，且多個核心決策步驟的細節資訊不足。管理員在調優 AI 服務參數（閾值、權重、fallback 策略）時，無法從 logs 追蹤到問題根源。

**技術約束：**
- `pipeline_trace` 欄位已為 TEXT（JSON），擴充完全向後相容，不需 DB migration
- 後端跑在 Cloudflare Workers，寫 trace 不能有額外的 async I/O，只能在現有計算流程中插入 trace 賦值
- 前端頁面已有完整的 stage card + IOFlow 元件架構，新增 stage 只需插入 `pipelineStages` 陣列 + 新增 Trace 元件

---

## Goals / Non-Goals

**Goals:**
- 讓每個 pipeline stage 都能回答「輸入是什麼 → 做了什麼決定 → 結果是什麼」
- 在頁面頂部用一行 Decision Narrative 串連整條 pipeline 的關鍵決策
- 補齊前端 `pipelineStages` 缺少的 `filter` stage
- 讓 `retrieval` 卡片展開時能看到多路搜尋、RRF、CRAG、cross-encoder 各子步驟
- 新增 `mmr_selection` stage（後端 trace + 前端顯示）
- 修正 judge / self_reflection 因果鏈呈現順序

**Non-Goals:**
- 不修改 AI pipeline 邏輯（只加 trace 記錄，不改決策）
- 不修改資料庫 schema
- 不改變任何對外 API 回應格式
- 不在 `pipeline_trace` 儲存完整 prompt 文字（避免 DB 空間膨脹）
- 不對歷史舊記錄做回填（舊 log 缺失欄位顯示 fallback 文字）

---

## Decisions

### D1：retrieval 用「內嵌子步驟時間軸」而非新增獨立 stage cards

**選項 A（選用）：** `retrieval` 卡片展開後，顯示 4 個內嵌子步驟（multi-path search → RRF → CRAG → cross-encoder），每個子步驟有自己的 Input/Decision/Output 區段。

**選項 B：** 把 `retrieval` 拆成 4 個完全獨立的 stage cards（`vector_search`、`rrf_fusion`、`crag_fallback`、`reranking`）。

**選用 A 的理由：**
- 這 4 個子步驟在後端是同一個函式呼叫的不同階段（沒有跨 function 邊界），天然屬於同一個「retrieval」概念
- 拆成 4 張 cards 會讓 pipeline 從目前 14 個 stage 變成 17 個，頁面過長且難以掃視
- 子步驟時間軸符合 pipeline 的「局部 zoom in」語意，而非把子步驟提升為一等公民

### D2：mmr_selection 作為獨立 stage card

MMR + 熱門度排序是 retrieval 之後、generation 之前的獨立決策（決定哪些文件最終進入 LLM context），且目前完全不可見，用獨立 stage card 可以清楚展示「從 N 筆候選選 K 筆送入 LLM」的決策點。

### D3：filter stage 需要前端 + backend 同時新增

`filter` 的**資料骨架**（`applied`、`source`、`history_supplemented`）已存在 `pipeline_trace.filter`，但要顯示為 stage card 需要兩件事：

**前端**：
- `pipelineStages` 陣列在 `'hyde'` 後、`'embedding'` 前插入 `'filter'`（靜態 stage，非 trace-only）
- 在 `admin-ai.ts` 的 `pipeline` 物件加入 `filter` key（spread `pt.filter`），frontend 才能讀到 `pipelineStage.skipped` 等

**後端（query.ts）**：額外補充兩個 trace 欄位讓 Decision 區段有足夠資訊：
- `matched_texts`：觸發各過濾條件的原始文字片段
- `resolved_ids`：DB 查詢解析結果（area_id、crag_id 字串）

### D3b：mmr_selection 採 trace-only 動態插入（不加進靜態 pipelineStages）

與 `agentic`、`multi_query` 相同策略：`mmr_selection` 僅在 `pipeline_trace.mmr_selection` 存在時才動態插入 stage card（在 `'retrieval'` 後）。好處：舊記錄不會出現空白的 mmr_selection 卡片。

### D3c：judge 詳細分數寫入 pipeline_trace.judge_detail，再 spread 到 pipeline.judge

**為什麼不直接寫到 `pipeline.judge`？** `pipeline` 物件在 `admin-ai.ts` 建構時才存在，`query.ts` 只能寫 `pipeline_trace`。

**做法**：
1. `query.ts` 寫 `trace.judge_detail = { raw_scores, criteria }`
2. `admin-ai.ts` 的 `pipeline.judge` 物件 spread `pt.judge_detail`（與 guardrails_input、quota_check 相同模式）
3. 前端從 `pipelineStage.raw_scores`、`pipelineStage.criteria` 讀取

### D4：judge / self_reflection 採用「因果鏈」呈現，不調整 stage 順序

目前 stage 順序是 `self_reflection → judge`，這個順序實際上是「先看重生成過程，再看最終品質分數」，是合理的閱讀流程（先因後果），但描述不清楚。

決定：保持現有 stage 順序，但在 `self_reflection` 的 Decision 區段明確顯示：
- 第一次 judge 分數（觸發條件）
- 觸發原因（`quality_below_threshold` / `groundedness_below_threshold` / `both`）
- 第二次 judge 分數
- 最終選擇原因（`regen_accepted` / `original_kept`）

這需要後端在 `trace.self_reflection` 中補充 `first_judge_quality`、`first_judge_groundedness`、`regen_reason`、`second_judge_quality`、`second_judge_groundedness`、`acceptance_reason` 欄位。

### D5：Decision Narrative 純前端組合

不在後端生成敘事文字，純前端從 `pipeline_trace` 資料推算。優點：不增加 LLM 呼叫、不占用 DB 空間、顯示邏輯可隨時迭代。格式採用 `→` 分隔的短語串，例：

```
複雜查詢 → filter:中正岩場 → 3路搜尋+BM25 → RRF:23筆→9筆 → cross-encoder → MMR(5筆) → Judge 3.2→重生成→4.1 → groundedness 87%
```

---

## Risks / Trade-offs

**[Risk] 舊記錄缺少新 trace 欄位** → 所有新欄位採 optional 設計，前端顯示時加 `?? null` fallback，缺失欄位顯示「—」或「舊記錄無此資料」，不影響既有 log 可讀性。

**[Risk] retrieval 子步驟 trace 增加 backend 計算時路徑上的程式碼複雜度** → 只在現有計算結果後插入 trace 賦值（不新增計算），不影響效能。RRF 計算結果本來就有，只需截取前 5 筆記錄。

**[Risk] mmr_selection trace 記錄的 `top_selected` 資料量** → 限制最多記錄 5 筆文件的摘要（title + scores），不儲存文件全文，控制 JSON 大小。

**[Trade-off] 不儲存完整 prompt** → 管理員無法重現精確的 LLM 呼叫，但可以看到 context 文件清單 + 模板名稱，足以診斷大多數品質問題。完整 prompt 可能達數千字元，不適合塞進 pipeline_trace。

---

## Migration Plan

1. 後端先部署（新 trace 欄位向後相容，舊前端不受影響）
2. 前端再部署（顯示新欄位，舊記錄優雅降級為「—」）
3. 無 rollback 風險（純增量，不刪除既有欄位）

---

## Open Questions

- `matched_texts` 欄位中，若 filter 來源是 regex fallback（非 LLM），是否需要顯示 regex 匹配到的文字片段？（目前設計：顯示）
- MMR `top_selected` 要記錄幾筆合適？（目前設計：5 筆）
- Decision Narrative 是否需要支援 i18n？（目前設計：固定中文）
