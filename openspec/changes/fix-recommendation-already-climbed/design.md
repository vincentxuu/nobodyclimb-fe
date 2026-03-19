## Context

路線推薦系統目前有兩個獨立問題：

1. **Retrieval 層無排除機制**：`buildRecommendationQuery()` 將完攀路線名稱直接嵌入查詢字串，導致向量搜尋給已完攀路線 cosine similarity ≈ 0.993–0.998，MMR 必然選入。即使走 hybrid 路徑，`queryCandidates()` SQL 也沒有 `NOT IN` 過濾。
2. **Judge 評估維度缺失**：`JUDGE_PROMPT` 只評估 groundedness（文件支撐度）與 quality（完整性/相關性），完全沒有 constraint satisfaction（約束滿足度）。推薦已完攀路線的回答拿到 groundedness=1.0, quality=4/4。

兩個問題相互放大：retrieval 讓錯誤進來，judge 沒有抓到錯誤。

## Goals / Non-Goals

**Goals:**
- 確保推薦結果不包含使用者已完攀的路線（Agentic RAG 路徑 + Hybrid SQL 路徑都處理）
- Judge 能偵測「推薦了已完攀路線」並給出低分，觸發 self-reflection 或 flag

**Non-Goals:**
- 改變推薦觸發機制（ascent 後非同步觸發）
- 修改 MMR λ / 熱門度加權公式
- 處理非推薦類問題的 Judge 評估

## Decisions

### Decision 1：query 改寫策略（解法 D）

**選擇**：`buildRecommendationQuery()` 改為只描述攀登能力程度，不帶路線名稱。

```
// 舊
"我最近完攀了：閃電（5.12a）、泡泡龍（5.11b）..."

// 新
"我的攀登程度約 5.11d，請推薦難度在 5.12a–5.12b 的運攀路線，
 或類型不同的路線（傳攀/抱石）。"
```

**為何不帶路線名稱**：路線名稱是向量搜尋的強信號，mention 即被撈出，任何後續過濾都是補救措施，不如從源頭移除。

**難度範圍計算**：以最近 5 筆完攀的最高難度為基準，+1 級（如 5.11d → 5.12a，5.12a → 5.12b）作為推薦目標範圍。

### Decision 2：pipeline context 注入 climbed_route_ids（解法 A）

**選擇**：`RecommendationService.generate()` 撈取完攀的 `route_id` 列表，作為 `climbed_route_ids: string[]` 注入 pipeline context。

context 擴充：`context.ts` 加入 `climbed_route_ids: string[] | null`，預設 null。

**過濾點**（只加其中一層，選 popularity-rerank 前）：在 `popularity-rerank.ts` 執行 MMR 前，先把 `climbed_route_ids` 中的文件從候選集移除。這個位置最接近最終輸出，無論走哪條 retrieval 路徑都能攔截。

hybrid 路徑的 `queryCandidates()` 也加 `excluded_ids` 參數，SQL 加 `NOT IN`，作為第二道防線（雖然本次 bug 走的是 Agentic RAG，但 hybrid 路徑未來也需要保護）。

### Decision 3：Judge 加入 constraint_ok 維度

**選擇**：在 `JUDGE_PROMPT` 加入第三個輸出欄位 `constraint_ok`（boolean）。

邏輯：若問題中包含「尚未爬過」「未爬過」「沒爬過」等關鍵詞，且回答中出現問題前文提到的已完攀路線名稱，則 `constraint_ok = false`。

`constraint_ok = false` 時，Judge 將 quality 強制降為 1。

DB 記錄：`ai_query_logs.auto_score` 欄位已存在，不需新欄位；`constraint_ok` 只在 trace 層記錄，不寫入 DB（避免 schema migration）。

**為何不加新 DB 欄位**：本次修正優先修復功能問題；需要 schema migration 的監控改進可在後續 change 中做。

## Risks / Trade-offs

- [Judge 複雜度提升] → 新增 constraint_ok 邏輯讓 prompt 變長，llama-3.1-8b 可能解析不穩定 → 用 regex 後處理做兜底（解析失敗時 constraint_ok 預設 true，不影響現有流程）
- [query 改寫損失個人化] → 不帶路線名稱可能讓推薦結果更泛用，個人化程度略降 → 可接受，正確性比個人化重要
- [hybrid 路徑 excluded_ids 傳遞] → queryCandidates() 需要 userId，目前 handleHybridPath() 可從 ctx.userId 取得，但需確認 recommendation 觸發時有帶 userId → RecommendationService.generate() 已有 userId，需確保注入 pipeline options
