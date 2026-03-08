# RAG 系統面試準備指南

> 建立日期：2026-03-06 ｜ 最後更新：2026-03-08
> 對應程式碼：`backend/src/services/query.ts`、`backend/src/services/pipeline/`（模組化 RAG Pipeline）、`backend/src/services/indexing.ts`、`backend/src/services/text-to-sql.ts`、`backend/src/utils/ai-prompts.ts`、`backend/src/services/rank.ts`、`backend/src/utils/guardrails.ts`

---

## ⚡ 面試前速查表（10 分鐘掃完）

### 系統一句話
> 攀岩平台的模組化 RAG 問答系統，運行在 Cloudflare Workers，14 個可配置 pipeline step 動態組裝，結合向量 + BM25 混合搜尋、Text-to-SQL 結構化查詢、LLM 意圖分流、Judge-Guided 品質保障，讓用戶用中文自然語言查詢路線資訊。

### 技術棧記憶卡

| 角色 | 技術 |
|------|------|
| 生成 LLM | `gemma-3-12b-it`（品質強，繁中好）|
| Judge LLM | `llama-3.1-8b-instruct`（輕量，獨立評估）|
| Embedding | `bge-m3`（1024 維，多語言）|
| 向量庫 | Cloudflare Vectorize（cosine similarity）|
| 關鍵字搜尋 | D1 SQLite FTS5（BM25）|
| 快取 | KV（精確）+ Vectorize（語義）|
| Runtime | Cloudflare Workers（Edge, Serverless）|

### Modular Pipeline 14 步記憶法

```
5 Phases × 14 Steps（每步可獨立開關、排序，Admin UI 可調）

Pre-retrieval：
  ① Semantic Cache → ② Tool Selection → ③ Text-to-SQL
  → ④ HyDE → ⑤ Multi-Query → ⑥ Filter Build

Retrieval：
  ⑦ Embedding → ⑧ Hybrid Search（Vector + BM25 + RRF + CRAG + Agentic）

Post-retrieval：
  ⑨ Cross-encoder → ⑩ MMR → ⑪ Popularity Rerank

Generation：
  ⑫ LLM Generation（含 GK / SQL / Hybrid earlyReturn 路徑）

Evaluation：
  ⑬ Judge → ⑭ Self-Reflection（含 loopBack 回跳 retrieval）
```

### 核心技術一行解釋

| 技術 | 一行解釋 |
|------|---------|
| **Modular Pipeline** | 14 個 PipelineStep 動態組裝，每步可開關/排序，Admin UI 可調，engine 依 phase 順序執行 |
| **HyDE** | 先讓 LLM 生成理想答案，用理想答案的向量搜尋（比 query 向量更像文件）|
| **Multi-Query** | 用 LLM 把問題改寫成 3 個子查詢，分別搜尋後 RRF 合併，提升 Recall |
| **BM25 + 向量 Hybrid** | 術語用 BM25，語意用向量，RRF 融合取兩者之長 |
| **RRF** | 多路搜尋結果用排名融合：`score = Σ 1/(60+rank)`，不依賴分數尺度 |
| **Cross-encoder** | query + doc 一起過模型，比 bi-encoder 精準但慢，只對 Top-K 候選用 |
| **MMR** | 選文件時兼顧相關（λ）和多樣（1-λ），避免推薦一堆相似路線 |
| **Contextual RAG** | 索引時 LLM 生成語意摘要前置在 chunk 前 embed，解決 chunk 孤島 |
| **CRAG** | 搜尋無結果時，逐步移除 grade → route_type 過濾重試 |
| **Judge-Guided** | 獨立 Llama 評 Gemma 輸出，比較兩次 groundedness 決定要哪個版本 |
| **Text-to-SQL** | 統計/計算/篩選問題直接執行 SQL 模板查詢，跳過向量搜尋 |
| **loopBack** | Self-Reflection 低 groundedness 時回跳 retrieval phase 重新搜尋 |
| **語義快取** | 用 query embedding 相似度（>0.95）命中過去回答，匿名查詢才啟用 |

### 常見面試陷阱快答

| 問題 | 答案關鍵字 |
|------|----------|
| 為什麼不直接 fine-tune？ | 知識即時更新、可追蹤 sources、Workers 無法訓練 |
| Long-context LLM 出現後 RAG 還需要嗎？ | 成本/Lost in Middle/Latency，RAG+LTC 組合使用 |
| 同模型自評的問題？ | 64.5% 盲點率，本系統用獨立 Llama 當 Judge |
| BM25 負值原因？ | SQLite FTS5 設計，取負轉正再送 RRF |
| HyDE filter 為何不套 crag_id？ | 假設文件是語意泛化，過嚴 filter 反而限制語意搜尋 |
| 為什麼要做模組化 Pipeline？ | Step 可獨立開關/排序/新增，Admin UI 即時調整不需部署，降低耦合 |
| Text-to-SQL 和向量搜尋的差異？ | SQL 適合精確統計（「龍洞 5.12 以上幾條？」），向量適合語意查詢 |
| loopBack 是什麼？ | Self-Reflection 偵測低 groundedness（<0.5）時，回跳到 retrieval 重新搜尋 |
| Cloudflare Workers 最大限制？ | CPU 時間 30ms（→全程並行），無持久記憶體（→KV/D1）|
| Guardrails 為何不用 LLM 檢查？ | 每次請求都要跑，字串比對零成本；LLM 評估加 0.5–1s |
| System Prompt Leakage 為何整個替換？ | 部分替換留語意線索，整個替換最安全 |
| Input Guardrail 觸發時扣配額嗎？ | 不扣。GuardrailError 直接 400，LLM 完全不呼叫 |
| Token 怎麼計量？ | 先估算扣除（中文 1 字 ≈ 2 token），LLM 完成後用實際 usage 校正差額 |
| 配額有幾層？ | 雙重：每日請求次數 + 每日 token 上限，原子 SQL 同時檢查兩條件 |

---

## 一、系統一句話介紹

> 「為攀岩社群平台 NobodyClimb 建立的 RAG 問答系統，運行在 Cloudflare Workers 上，結合向量搜尋、BM25 全文搜尋、LLM 意圖解析等多種技術，讓使用者能用自然語言查詢路線與岩場資訊，並透過 Judge-Guided Self-Reflection 機制確保回答品質。」

---

## 二、系統架構全覽

### 技術選型

| 元件 | 技術 | 原因 |
|------|------|------|
| **Runtime** | [Cloudflare Workers](https://developers.cloudflare.com/workers/) | Edge 低延遲，與 D1/Vectorize/KV/R2 原生整合 |
| **LLM（生成）** | [`@cf/google/gemma-3-12b-it`](https://ai.google.dev/gemma/docs/core) | [Workers AI](https://developers.cloudflare.com/workers-ai/) 原生，繁中效果好，免管理 GPU |
| **LLM（輕量）** | [`@cf/meta/llama-3.1-8b-instruct`](https://ai.meta.com/blog/meta-llama-3-1/) | Judge / Contextual RAG / Simple Query 用，降低成本 |
| **Embedding** | [`@cf/baai/bge-m3`](https://huggingface.co/BAAI/bge-m3)（1024 維） | 多語言、繁中效果佳、Cloudflare 原生支援（[論文](https://arxiv.org/abs/2402.03216)） |
| **向量資料庫** | [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/) | 與 Workers 無縫整合，支援 metadata filter |
| **關鍵字搜尋** | D1 [SQLite FTS5](https://sqlite.org/fts5.html)（BM25） | 無需額外服務，精確匹配路線名稱、難度術語 |
| **快取** | [Cloudflare KV](https://developers.cloudflare.com/kv/)（精確）+ Vectorize（語義） | 兩層快取，降低重複查詢延遲 |
| **資料庫** | [Cloudflare D1](https://developers.cloudflare.com/d1/)（SQLite） | 儲存文件原文、metadata、查詢日誌 |
| **框架** | [Hono 4.6](https://hono.dev/) | 輕量 TypeScript Web Framework，適合 Workers |

### 完整查詢 Pipeline（模組化架構）

```
使用者 Query
  │
  ├─ Input Guardrails（過濾 PII、有害內容）→ 400 blocked
  ├─ KV 精確快取（hash key）→ 命中直接回傳
  ├─ Quota 額度檢查 → 429 quota_exceeded
  │
  ▼ 進入 PipelineEngine（14 個可配置 Step，依 phase 順序執行）
  │
  ╔════ Pre-retrieval Phase ════╗
  ║ [1] Semantic Cache       → 語義快取命中 → earlyReturn        ║
  ║ [2] Tool Selection       → 分類 queryType（6 種路徑）        ║
  ║ [3] Text-to-SQL          → sql/hybrid → earlyReturn/候選集   ║
  ║ [4] HyDE                 → complex 才觸發                    ║
  ║ [5] Multi-Query           → complex 才觸發                    ║
  ║ [6] Filter Build          → 提取 grade/crag/region/area      ║
  ╚═════════════════════════════╝
  │
  ╔════ Retrieval Phase ════════╗
  ║ [7] Embedding            → query + HyDE + 擴展查詢向量       ║
  ║ [8] Hybrid Search        → Vector + BM25 + RRF + CRAG        ║
  ║     （含 Agentic Multi-Step 分支）                             ║
  ╚═════════════════════════════╝
  │
  ╔════ Post-retrieval Phase ═══╗
  ║ [9] Cross-encoder         → bge-reranker-base 精排            ║
  ║ [10] MMR                  → λ=0.6 多樣性選取                  ║
  ║ [11] Popularity Rerank    → 影片數量加權 + sources/context 組合║
  ╚═════════════════════════════╝
  │
  ╔════ Generation Phase ═══════╗
  ║ [12] LLM Generation       → 含 GK earlyReturn、串流模式       ║
  ╚═════════════════════════════╝
  │
  ╔════ Evaluation Phase ═══════╗
  ║ [13] Judge                → 獨立 Llama 評估 groundedness      ║
  ║ [14] Self-Reflection      → quality ≤ 2 觸發重生成            ║
  ║      └─ loopBack          → groundedness < 0.5 回跳 retrieval ║
  ╚═════════════════════════════╝
  │
  ▼ PipelineEngine postPipelineProcessing
  ├─ KV 快取寫入 + 語義快取寫入
  ├─ logQuery + Memory extraction（waitUntil 非同步）
  ├─ 串流模式異步 Judge（waitUntil）
  └─ Response

查詢路徑分流（Tool Selection 決定）：
  ├─ general-knowledge → 跳過向量搜尋，直接 LLM（GK earlyReturn）
  ├─ simple           → 跳過 HyDE + Multi-Query，輕量模型
  ├─ complex          → 完整 pipeline，Gemma-3-12b
  ├─ sql              → Text-to-SQL 直查 D1（SQL earlyReturn）
  ├─ hybrid           → SQL 撈候選集 + 向量 rerank
  └─ clarification-needed → 追問確認（earlyReturn）
```

---

## 三、核心技術深入解析

### 3.1 Adaptive Routing（查詢分流）

**問：怎麼決定一個查詢要走哪條路徑？**

用 LLM Tool Calling 解析意圖，輸出 JSON 指定工具與參數：

```typescript
// TOOL_SELECTION_PROMPT 注入已知岩場/區域/地區清單
// LLM 選擇：search_routes / search_crags / general_knowledge / search_sql / hybrid

// 六種路徑（queryType）：
// 1. general-knowledge → 直接 LLM 回答，不查向量庫
// 2. simple → 輕量模型，跳過 HyDE + Multi-Query（降延遲）
// 3. complex → 完整 pipeline，Gemma-3-12b 生成
// 4. sql → Text-to-SQL 直接查 D1，適合統計/計算/篩選
// 5. hybrid → SQL 撈候選集 + 向量 rerank，適合排序類問題
// 6. clarification-needed → 查詢太模糊，追問確認
```

**Fallback 機制：** LLM 解析失敗時，用 regex（`extractGradeFilter`、`extractLocationFilter`、`extractTypeFilter`）補救。

---

### 3.2 HyDE（Hypothetical Document Embedding）

**問：什麼是 HyDE？為什麼有用？**

**問題：** 使用者的查詢（如「大頭峰好爬嗎？」）與資料庫文件（「路線名稱、難度、描述」）在向量空間裡距離較遠。

**解法：** 先讓 LLM 生成一個「理想答案文件」（假設性文件），再用這個文件的 embedding 做搜尋。假設性文件與真實文件的語言風格更接近，向量距離更近。

```
使用者問：「大頭峰有沒有適合初學者的路線？」
                   ↓ HyDE
LLM 生成：「大頭峰校門口區域有數條 5.8–5.9 難度的運攀路線，
           保護點充足，適合初學者練習…」
                   ↓ embed 這個假設文件
           做第二路向量搜尋
```

**實作細節：**
- 只對 `complex` 查詢觸發
- HyDE 向量做搜尋時只套 `type` filter（不限岩場），讓語意有彈性
- `generateHyDE` 失敗時靜默降級為單路搜尋

---

### 3.3 Multi-Query Expansion

**問：為什麼要展開多個查詢？**

**問題：** 單一查詢可能遺漏以不同詞彙描述的相關文件。

**解法：** LLM 從三個角度改寫查詢：
1. **語意改寫**：不同詞彙表達相同意圖
2. **技術參數**：聚焦難度等級、攀登類型
3. **使用者意圖**：目的、經驗程度、適合對象

```typescript
// 模組化 pipeline 中，HyDE 和 Multi-Query 是獨立 step（各自 skipWhen: NON_RAG_SKIP）
// 只對 complex 查詢觸發（simple/GK/sql/hybrid/clarification 跳過）

// steps/hyde.ts — Step 4
const hydeResult = await queryService.generateHyDE(query, llmModel, gatewayOptions, prompt);
ctx.hydeDoc = hydeResult.doc;

// steps/multi-query.ts — Step 5
const multiQueryResult = await queryService.generateMultipleQueries(query, count, llmModel, gatewayOptions, prompt);
ctx.expandedQueries = multiQueryResult.queries;
```

**擴展查詢的 filter 策略：** 只套 `type` filter，不限岩場/難度，確保語意搜尋有足夠彈性。

---

### 3.4 BM25 Hybrid Search（FTS5）

**問：向量搜尋已經很好了，為什麼還需要 BM25？**

**向量搜尋的盲點：** 對精確術語效果差。
- `「幻想鄉」`（路線名稱）→ 向量搜尋可能找到「夢境相關」的文件
- `「5.11b」`（精確難度）→ 向量搜尋可能找到難度相近但非 5.11b 的路線

**BM25 補足：** 業界研究顯示 Hybrid 比純向量搜尋提升 33–47% 精準度。

**實作：** D1 SQLite FTS5 虛擬表，三個同步觸發器（insert/update/delete）自動維護索引。

```sql
-- FTS5 搜尋，bm25() 回傳負值，取負轉正供 RRF 使用
SELECT doc_id, bm25(ai_documents_fts) AS bm25_score
FROM ai_documents_fts
WHERE ai_documents_fts MATCH ?
ORDER BY bm25(ai_documents_fts)
```

**Graceful Degradation：** FTS 查詢失敗時回傳空陣列，不影響向量搜尋路徑。

---

### 3.5 RRF（Reciprocal Rank Fusion）合併

**問：多路搜尋結果怎麼合併？**

RRF 是業界標準的多路排名融合算法，公式：

```
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

其中 `k=60`（常數，降低高排名的過分優勢），`rank_i` 是文件在第 i 路搜尋結果中的排名。

**優點：**
- 不依賴各路結果的分數尺度（向量相似度和 BM25 分數不可比）
- 重複出現在多路的文件得到加分
- 計算簡單，不需訓練

---

### 3.6 Cross-encoder Reranking

**問：向量搜尋後為什麼還要 Reranking？**

**Bi-encoder（向量搜尋）的限制：** Query 和文件各自獨立 embed，無法直接建模兩者間的細緻語意關係。

**Cross-encoder（Reranker）：** 將 query + 文件一起輸入模型，直接評估兩者的語意相關性，精準度更高，但計算代價大。

**兩段式架構（業界標準）：**
1. **召回階段（Recall）：** 向量搜尋快速取出 Top-K 候選（速度優先）
2. **精排階段（Precision）：** Cross-encoder 對候選重新評分（精準優先）

```typescript
// 使用 @cf/baai/bge-reranker-base（https://huggingface.co/BAAI/bge-reranker-base）
const rerankerResult = await env.AI.run(
  '@cf/baai/bge-reranker-base',
  { query, contexts: candidates.map(m => ({ text: doc.text })) }
);
```

---

### 3.7 MMR（Maximal Marginal Relevance）多樣性選取

**問：為什麼不直接取 Top-N 最高分？**

**問題：** Cross-encoder 排名後 Top-5 可能都是同一岩場的類似路線，對使用者幫助有限。

**MMR 解法（λ=0.6）：** 每次選出「與查詢相關且與已選文件不重複」的文件。

```
MMR(d) = λ * relevance(query, d) - (1-λ) * max_similarity(d, selected)
```

λ=0.6 表示相關性優先，但同時維持 40% 的多樣性考量。

---

### 3.8 Contextual RAG（索引強化）

**問：傳統 chunk 有什麼問題？**

**問題（Chunk 孤島）：** 路線資料直接 embed 後，chunk 缺乏文件級別的脈絡。例如 「保護點充足，適合初學者」這段文字，沒有脈絡就不知道是在哪個岩場、什麼難度的路線。

**Anthropic Contextual Retrieval 解法：** 索引時讓 LLM 為每個 chunk 生成語意摘要，前置在 chunk 前後再 embed。

**實作：兩階段非阻塞設計**
```
Phase 1（同步，快速）：原始文字 → embed → Vectorize + D1（立即可查）
Phase 2（背景，ctx.waitUntil）：
  LLM 生成語意摘要 → summary + 原始文字合併 → embed → Vectorize 覆寫
  D1 仍保留原始結構化文字（LLM context 用，保持乾淨）
```

**關鍵設計決策：** LLM 生成的摘要只用於 embedding（讓向量語意更準），不寫入 D1，LLM 生成回答時仍用原始結構化資料。

---

### 3.9 CRAG（Corrective RAG）放寬回退

**問：搜尋無結果時怎麼處理？**

遞進式放寬過濾條件，保留位置過濾（重要線索），移除較嚴格的難度/類型條件：

```
第一次搜尋失敗（有 grade_numeric 過濾）
  → 移除 grade_numeric，重試
第二次搜尋失敗（有 route_type 過濾）
  → 同時移除 grade_numeric + route_type，重試
```

BM25 結果在所有 CRAG 重試中都參與 RRF 合併（關鍵字搜尋不受 metadata filter 影響）。

---

### 3.10 Judge-Guided Self-Reflection

**問：如何確保 LLM 回答的品質？**

**業界常見問題（同模型自評的盲點）：** 模型傾向為自己的回答打高分，有約 64.5% 盲點率（2025 學術研究）。

**現有實作（Judge-Guided 模式）：**

```
1. Gemma 生成初始回答
2. 獨立 Llama 模型作為 Judge，輸出：
   - groundedness（0.0–1.0）：回答有多少比例基於 context 文件
   - quality（1–4）：整體品質
3. quality ≤ 2（complex 查詢）→ 觸發重生成
4. 對重生成結果再跑 Judge
5. 比較兩次的 groundedness，取較高者（避免退化替換）
```

**為什麼用獨立模型當 Judge？**
- 主模型（Gemma）負責生成，Judge 模型（Llama）負責評估，角色分離
- Judge 不受生成模型的「自我辯護」偏見影響
- 符合業界「外部 critic」最佳實踐

**免責聲明注入（依 groundedness）：**
- `< 0.6`：❓ 以下資訊基於現有資料推斷，建議實地確認
- `0.6–0.8`：⚠️ 部分資訊來自推斷，建議實地確認
- `> 0.8`：直接輸出

---

### 3.11 語義快取

**問：除了精確快取（KV hash）之外有什麼？**

**精確快取的限制：** 「龍洞有5.11的路線嗎？」和「龍洞5.11難度路線推薦」是不同 hash，但語意幾乎相同。

**語義快取：** 用 query embedding 在 Vectorize 中搜尋相似的過往查詢，相似度超過閾值（預設 0.95）則回傳快取結果。

**只對匿名且無對話歷史的查詢啟用：** 個人化查詢（含 userId 或對話歷史）有個人化 hash，不適合跨用戶命中語義快取。

---

### 3.12 個人化（Personalization）

**問：系統如何根據使用者調整回答？**

已登入用戶的查詢會注入兩種個人化資訊：

1. **Memory Summary**：從過去對話萃取的使用者偏好（如「偏好運攀」、「住北部」）
2. **Ascent Context**：最近攀登記錄，估算能力等級

```typescript
// 並行取得個人化資料
const [memories, ascents] = await Promise.all([
  getMemoriesSummary(userId, env.DB),
  getRecentAscents(userId, env.DB),
]);
const abilityLevel = estimateAbilityLevel(ascents);
// 注入 system prompt，讓 LLM 以合適的程度回答
```

個人化資訊也會影響快取 key（防止個人化回答污染通用快取）。

---

## 四、常見面試問題 Q&A

### Q1：RAG 和 Fine-tuning 的差異？何時選哪個？

| 面向 | RAG | Fine-tuning |
|------|-----|------------|
| 知識更新 | 即時（更新索引）| 需重新訓練 |
| 成本 | 推理成本 | 訓練成本高 |
| 可解釋性 | 高（可追蹤 sources）| 低（黑盒） |
| 適合場景 | 動態知識、需溯源 | 風格/格式、特定領域語言 |

**本系統選 RAG 的理由：** 路線資料隨時更新、需要顯示 sources、在 Cloudflare Workers 上無法 fine-tune。

---

### Q2：如何評估 RAG 系統品質？

我們追蹤的指標（寫入 `ai_query_logs`）：

| 指標 | 欄位 | 意義 |
|------|------|------|
| Groundedness | `groundedness_score` | 回答有多少比例基於 context（避免幻覺）|
| Quality | `auto_score` | Judge 模型的整體品質評分（1–4）|
| 延遲 | `latency_ms`（含分段）| P50/P95，分辨瓶頸在哪 |
| Self-Reflection 觸發率 | `self_reflection_triggered` | 低品質回答的比率 |
| Low Groundedness 比率 | `flagged = 'low_groundedness'` | 需要人工審視的回答 |
| Token 消耗 | `token_count`（含 `token_breakdown` 分段明細）| 成本控制，支援分段追蹤（query_parsing / hyde / multi_query / main_generation / judge）|
| 高消耗標記 | `is_high_consumption` | 超過門檻的查詢自動標記，供 Admin 成本追蹤 |
| 用戶回饋 | `feedback_score` | 真實使用者滿意度 |

---

### Q3：BM25 的 bm25() 函數回傳負值是什麼原因？

SQLite FTS5 的 `bm25()` 函數設計為回傳負值（越相關越接近 0，不相關為大負數），這是為了讓 `ORDER BY bm25()` 升冪排序時，最相關的文件排在最前面。

我們在程式中取負數轉正分（`score: -row.bm25_score`），讓 BM25 分數可以與向量相似度一起送入 RRF 合併。

---

### Q4：為什麼 HyDE 的 filter 策略和 primary query 不同？

**Primary query filter：** 套完整 filter（含 crag_id、grade_numeric）→ 精確召回。

**HyDE filter：** 只套 `type` filter（不限岩場/難度）→ 讓語意搜尋有彈性。

**原因：** HyDE 文件是假設性的，它的 embedding 代表「理想答案的語意空間」，如果加太多 filter，會限制語意搜尋的發揮，反而削弱 HyDE 的效果。

---

### Q5：系統如何處理多輪對話的上下文？

兩個機制：
1. **對話歷史注入 LLM messages**：最近 `chat_history_depth`（預設 6）則，assistant 訊息截斷至 `assistant_history_truncate` 字元
2. **指代詞補充 filter**：偵測「附近」「還有」等上下文依賴查詢，從歷史訊息補充 crag/region filter

```typescript
// 偵測指代詞查詢 + 從對話歷史補充位置 filter
if (!hasExplicitLocationFilter && recentHistory.length > 0 && this.isContextDependentQuery(query)) {
  const historyText = recentHistory.map(m => m.content).join(' ');
  const historyLocation = this.extractLocationFilter(historyText, crags, areas);
  // 補充 vectorFilter...
}
```

---

### Q6：Vectorize 的 metadata filter 怎麼設計的？

Metadata 存在向量的 metadata 欄位，支援以下 filter：
- `grade_numeric`（數值範圍）：`{ $gte: 100, $lte: 113 }`（5.10a–5.11c）
- `crag_id`（單一或多個）：`{ $eq: 'xxx' }` 或 `{ $in: ['a', 'b'] }`
- `area_id`：`{ $eq: 'xxx' }`
- `region`：`{ $eq: '北部' }`
- `route_type`：`{ $eq: 'sport' }`
- `type`：`{ $eq: 'route' }` 或 `'crag'`

難度編碼設計：`5.10a → 100, 5.10b → 101, 5.14d → 143`，方便範圍查詢。

---

### Q7：Cloudflare Workers 的限制對設計有哪些影響？

| 限制 | 因應設計 |
|------|---------|
| CPU 時間上限（30ms/請求）| 所有 I/O 並行執行（`Promise.all`） |
| 無法長時間執行 | `ctx.waitUntil()` 做背景任務（Contextual RAG 更新） |
| 無持久記憶體 | KV 做快取，D1 做持久化 |
| Cold Start | Edge 部署，縮短冷啟動 |
| 單一 Worker 分頁索引 | 分批索引（每批 100 筆），避免 timeout |

---

### Q8：如果 Vectorize 和 D1 都失敗，系統如何處理？

**Graceful Degradation 設計：**
- BM25 失敗 → 回傳空陣列，不影響向量搜尋路徑
- HyDE 失敗 → 單路向量搜尋繼續執行
- Multi-Query 失敗 → `expandedVectors = []`，降級為雙路搜尋
- Cross-encoder Reranker 失敗 → 保留原始 RRF 分數
- Judge 失敗 → 不觸發重生成，直接用原始回答
- 向量搜尋無結果 → CRAG 放寬重試

每個元件都有獨立的 try-catch，失敗時靜默降級，不影響核心流程。

---

## 五、系統設計的取捨（Trade-offs）

### 5.1 延遲 vs. 品質

| 查詢類型 | 延遲 | 觸發功能 |
|---------|------|---------|
| sql | ~0.1–0.3s | Text-to-SQL 直查 D1（earlyReturn）|
| general-knowledge | ~0.5s | 直接 LLM（earlyReturn）|
| simple | ~1.1s | 向量搜尋 + BM25（跳過 HyDE/Multi-Query）|
| hybrid | ~1.5s | SQL 撈候選 + 向量 rerank |
| complex | ~2–2.5s | HyDE + Multi-Query + 全路徑 |

**設計原則：** Pipeline step 的 `skipWhen` 條件自動控制每種路徑需要的功能子集。

### 5.2 精確快取 vs. 個人化

精確快取 key 包含 `userId` 和個人化 hash，確保個人化回答不會被其他用戶快取命中。語義快取只對匿名用戶啟用。

### 5.3 向量覆寫 vs. 雙向量儲存（Contextual RAG）

選擇「覆寫 Vectorize 向量」而非「同時儲存兩個向量（原始+contextual）」：
- **原因：** 避免 Vectorize 索引膨脹（每筆文件從 1 個向量變 2 個）
- **代價：** 背景任務執行前，新索引的文件只有原始向量的搜尋品質
- **緩解：** 背景任務通常在幾秒內完成（`waitUntil`），影響窗口極短

---

## 六、值得主動提到的亮點

1. **模組化 Pipeline 架構**：14 個 PipelineStep 動態組裝，每步可獨立開關/排序，Admin UI 即時調整不需部署，新 step 只需實作 `PipelineStep` 介面即可插入
2. **全程 Cloudflare 原生**：Workers + D1 + Vectorize + KV + R2，零基礎設施管理
3. **六種查詢路徑分流**：general-knowledge / simple / complex / sql / hybrid / clarification-needed，依意圖自動選擇最佳策略
4. **Judge 與生成模型分離**：Llama 評估 Gemma，避免同模型自評盲點
5. **Judge-Guided Self-Reflection + loopBack**：比較兩次 groundedness 決定替換；低 groundedness 時回跳 retrieval phase 重新搜尋
6. **Text-to-SQL 結構化查詢**：統計/計算/篩選問題直接執行 SQL 模板，毫秒級回應，不浪費向量搜尋資源
7. **Contextual RAG 兩階段設計**：非阻塞背景更新，不影響索引速度
8. **四路並行搜尋 + RRF**：query vec + HyDE vec + N 路子查詢 + BM25，業界最佳實踐
9. **完整 observability**：每次查詢都記錄延遲分段、groundedness、quality、分段 token 消耗（token_breakdown）
10. **Agentic Multi-Step RAG**：LLM 作為決策者控制多輪搜尋迴圈（ReAct 模式），解決多跳推理問題
11. **雙重配額 + Token 校正**：原子 SQL 同時檢查次數和 token 上限，LLM 完成後用實際 usage 校正估算差額

---

## 七、參考論文與技術來源

| 技術 | 來源 |
|------|------|
| HyDE | Gao et al., 2022 — [*Precise Zero-Shot Dense Retrieval without Relevance Labels*](https://arxiv.org/abs/2212.10496) |
| Contextual Retrieval | [Anthropic Blog, 2024](https://www.anthropic.com/news/contextual-retrieval) |
| BM25 Hybrid + RRF | [Cormack et al., 2009](https://dl.acm.org/doi/10.1145/1571941.1572114)；[Pinecone Hybrid Search Guide](https://docs.pinecone.io/guides/search/hybrid-search) |
| MMR | [Carbonell & Goldstein, 1998](https://dl.acm.org/doi/10.1145/290941.291025) |
| Cross-encoder Reranking | Nogueira & Cho, 2019 — [*Passage Re-ranking with BERT*](https://arxiv.org/abs/1901.04085) |
| CRAG（Corrective RAG） | Yan et al., 2024 — [*Corrective Retrieval Augmented Generation*](https://arxiv.org/abs/2401.15884) |
| Self-RAG | Asai et al., 2024 (ICLR) — [arXiv](https://arxiv.org/abs/2310.11511) |
| Agentic RAG / ReAct | Yao et al., 2022 — [*ReAct: Synergizing Reasoning and Acting*](https://arxiv.org/abs/2210.03629) |

---

## 八、2 分鐘口語系統介紹腳本

> 適用於「請介紹一下你做過的 AI 相關專案」開場。

---

**「我在 NobodyClimb 這個攀岩社群平台上，從零開始設計並實作了一套模組化 RAG 問答系統，讓使用者可以用中文自然語言查詢路線資訊，比如問『龍洞有沒有適合初學者的 5.10 路線？』然後直接拿到精確的推薦結果和來源連結。**

**整個系統跑在 Cloudflare Workers 上，完全 Serverless，向量搜尋用 Cloudflare Vectorize，資料庫是 D1（SQLite），生成模型用 Gemma-3-12b。**

**架構上我設計了一套模組化 Pipeline 引擎，把 RAG 流程拆成 14 個獨立的 step，分布在 5 個 phase（pre-retrieval、retrieval、post-retrieval、generation、evaluation）。每個 step 可以獨立開關和排序，管理員在後台 UI 就能即時調整，不需要重新部署。新增功能只要實作 PipelineStep 介面就能直接插入。**

**查詢根據意圖分成六種路徑：通識問題直接 LLM 回答；簡單查詢走輕量路徑；複雜查詢觸發 HyDE、Multi-Query 等強化技術；統計類問題走 Text-to-SQL 直查資料庫。這樣讓延遲從一律 2-3 秒優化到簡單查詢約 1 秒、SQL 查詢毫秒級回應。**

**品質保證方面，我用了獨立的 Llama 模型當 Judge 評估 Gemma 的輸出，避免同模型自評的盲點。如果品質分數低於門檻，就觸發重生成，再比較兩次的 groundedness 分數取較高者。更進一步，如果 groundedness 極低，系統會自動 loopBack 回跳到 retrieval phase 重新搜尋，形成自我修正迴圈。**

**目前系統全部功能已上線，包含 Agentic Multi-Step RAG 進階模式——讓 LLM 作為決策者主動決定是否需要再次搜尋，透過 ReAct 模式多輪迴圈解決多跳推理問題。」**

---

### 口語補充（視面試官反應調整深度）

| 如果對方追問... | 補充說明 |
|--------------|---------|
| 為什麼用 Cloudflare？ | 原生整合（Vectorize/D1/KV），零基礎設施管理，Edge 低延遲 |
| 模組化架構怎麼設計的？ | 14 個 PipelineStep，engine 依 phase 順序執行，step 透過 PipelineContext 共享狀態 |
| 和 LangChain 比呢？ | 見第九節 |
| 遇到什麼最難的問題？ | 見第十節 STAR 故事 |
| 怎麼評估品質？ | groundedness + quality score + latency，見第三節 |

---

## 九、追問 Q&A（面試官常問但文件第四節未覆蓋）

### Q9：為什麼不直接用 [LangChain](https://docs.langchain.com/) / [LlamaIndex](https://docs.llamaindex.ai/)？

這個問題本質是在問「你知道那些框架的 trade-off 嗎？」

**LangChain / LlamaIndex 的問題：**
- Node.js 生態支援相對薄弱（主要是 Python）
- 抽象層太多，在 Cloudflare Workers 這種限制環境下難以控制行為
- 每個元件都是黑盒，出問題難以 debug
- Bundle size 過大，Workers 有 1MB 限制

**選擇自研模組化 Pipeline 的原因：**
- 設計了 `PipelineStep` 介面 + `PipelineEngine` 引擎，14 個 step 動態組裝
- 每個 step 宣告 `requires` / `provides` / `skipWhen`，engine 自動判斷執行邏輯
- 可以精確控制每個步驟（並行時機、fallback 策略、earlyReturn 路徑）
- 完整掌握 prompt，不依賴框架預設
- 容易針對攀岩領域特化（`extractGradeFilter`、`extractLocationFilter` 都是領域專屬邏輯）
- Admin UI 可即時開關/排序 step，不需重新部署

**什麼時候用 LangChain？**
- 快速驗證原型時，框架加速開發
- 需要的功能在框架中已有成熟實作

---

### Q10：這個系統如何擴展？現在的瓶頸在哪？

**目前架構的擴展性：**
- Cloudflare Workers 本身自動橫向擴展（每個請求獨立 Worker）
- Vectorize 和 D1 由 Cloudflare 管理，不需手動擴展

**現在的瓶頸：**
1. **Workers AI 速率限制**：Contextual RAG 批次 LLM 呼叫（`CONTEXT_GENERATION_BATCH_SIZE = 5`）被此限制，大量索引時是瓶頸
2. **D1 寫入延遲**：每次索引需要逐筆寫入 D1（SQLite 不支援真正的批次 upsert）
3. **Judge 增加延遲**：非串流模式下 Judge 是同步的，增加約 500ms–1s

**如果規模更大的設計：**
- 索引改為非同步 Queue（Cloudflare Queues）
- Judge 改為純異步（只記錄日誌，不影響回應）
- 引入更強的 Embedding 服務（如 Voyage AI）

---

### Q11：Long-context LLM（如 [Gemini 2.0](https://deepmind.google/technologies/gemini/) 1M context）出現後，RAG 還有必要嗎？

這是 2026 最熱門的爭論之一。

**Long-context LLM 的問題（即使有 1M token window）：**
1. **成本**：1M token 的推理成本遠高於向量搜尋 + 精確召回
2. **Lost in the middle**：中間位置的資訊容易被模型忽略
3. **即時性**：LLM 的 context window 是靜態的，RAG 可以即時更新
4. **Latency**：把整個資料庫塞進 context，推理時間會成倍增加

**結論：** RAG 不消失，而是 RAG + Long-context 組合使用。RAG 負責精確召回少量相關文件，Long-context LLM 處理複雜的多文件推理。

---

### Q12：如果你能重來，你會改什麼？

這個問題考的是反思能力，要給真實的答案：

**改動 1：索引設計（最大的遺憾）**
- 現在 `ai_documents` 是 flat 的，crag 和 route 在同一張表
- 如果重來，會用 parent-child 結構，route 的向量包含 crag 摘要作為前置，不需要事後 Contextual RAG 覆寫

**改動 2：更早引入 observability**
- Judge 和 groundedness 是後期才加的，早期累積的查詢日誌缺乏品質指標
- 重來的話第一天就把 `ai_query_logs` 結構設計好

**改動 3：Semantic Cache 閾值驗證**
- 0.95 是直覺設定，實際上沒有 A/B 測試驗證
- 理想上應該先跑一批查詢，分析相似度分佈後再定閾值

---

## 十、STAR 格式：最難解決的問題

> 使用 **S**ituation → **T**ask → **A**ction → **R**esult 格式

---

### 問題一：Judge 驅動重生成反而讓回答退化

**Situation：** 加入 Judge 驅動重生成後，發現某些查詢的回答反而變差。Judge 判定 quality ≤ 2 觸發重生成，但新回答的 groundedness 反而更低。

**Task：** 需要設計一個不會退化的替換機制。

**Action：**
研究了 Self-RAG 論文和業界做法，發現問題在於「直接替換」——重生成後品質沒有比較，只要不觸發「找不到資訊」關鍵字就替換。解法是：
1. 對初始回答執行 Judge → 取得 `groundedness_original`
2. 重生成後再執行一次 Judge → 取得 `groundedness_regen`
3. 只有 `groundedness_regen > groundedness_original` 才替換

同時在 `pipeline_trace` 記錄兩次分數，讓問題可追蹤。

**Result：** 退化情況消除。在 trace 日誌中可以看到約 30% 的重生成被「靜默保留原始答案」，代表機制有效攔截了退化。

---

### 問題二：Multi-Query 子查詢的 filter 策略

**Situation：** 加入 Multi-Query Expansion 後，發現子查詢的搜尋結果品質不穩定。原本套用完整 filter（含 crag_id），但子查詢的語意是泛化的，被 crag_id 限制後召回率反而下降。

**Task：** 決定子查詢應該套哪些 filter。

**Action：**
分析子查詢的語意：它們是「不同角度的改寫」，目的是擴大語意覆蓋，不應該被精確位置限制。設計了三種 filter 策略：
- Primary query：套完整 filter（精確）
- HyDE query：只套 type filter（有彈性）
- 子查詢：只套 type filter（最寬鬆）

**Result：** Recall 提升，子查詢能找到用不同詞彙描述相同特性的路線，RRF 合併後精準度也維持。

---

## 十一、超參數設計與調整策略

### 所有可調參數一覽

| 參數 | 預設值 | 範圍 | 調整依據 |
|------|-------|------|---------|
| `max_results` | 5 | 1–20 | sources 數量 = context 長度，太多影響生成品質 |
| `merge_top_k` | 10 | 5–50 | RRF 候選數，越大召回更多但 reranker 成本增加 |
| `min_rrf_score` | 0.005 | 0–1 | 無 filter 時的最低 RRF 分數門檻，過低引入噪音 |
| `min_rrf_score_filtered` | 0.002 | 0–1 | 有 filter 時放寬（filter 本身已提升精準度）|
| `mmr_lambda` | 0.6 | 0–1 | 0=完全多樣, 1=完全相關；0.6 略偏相關 |
| `reranker_weight` | 0.7 | 0–1 | 與 popularity_weight 自動歸一化 |
| `popularity_weight` | 0.3 | 0–1 | 影片數越多的路線排越前面 |
| `groundedness_disclaimer_low` | 0.6 | 0–1 | 低於此值顯示 ❓ 免責聲明 |
| `groundedness_disclaimer_mid` | 0.8 | 0–1 | 低於此值顯示 ⚠️ 免責聲明 |
| `judge_regen_quality_max` | 2 | 1–3 | quality ≤ 此值觸發重生成（1–4 量表）|
| `semantic_cache_threshold` | 0.95 | 0.8–1 | 語義快取命中門檻，過低會錯誤命中不同意圖的查詢 |
| `bm25_top_k` | 10 | 5–50 | BM25 候選數，太少可能遺漏精確術語匹配 |
| `multi_query_count` | 3 | 1–5 | 子查詢數量，每加 1 個約增加 0.3s 延遲 |
| `max_tokens_generation` | 800 | 200–2000 | 生成回答的 token 上限 |
| `chat_history_depth` | 6 | 2–20 | 帶入 LLM 的對話歷史則數 |
| `max_pipeline_loops` | 2 | 1–3 | Pipeline loopBack 回跳上限，防止無限迴圈 |

### 調整策略

**調整前的問題診斷：**

```
回答不夠相關？  → 調整 min_rrf_score（降低門檻增加候選）、merge_top_k（增加候選）
回答太冗長？    → 降低 max_results、max_tokens_generation
路線名搜不到？  → 檢查 bm25_top_k、FTS 索引是否更新
高 groundedness 但品質低？ → 降低 judge_regen_quality_max（更嚴格觸發重生成）
相似查詢快取沒命中？ → 降低 semantic_cache_threshold（0.95 → 0.92）
結果太相似缺多樣性？ → 降低 mmr_lambda（0.6 → 0.5）
```

**重要的耦合關係：**
- `reranker_weight + popularity_weight` 自動歸一化，改一個值不需手動調另一個
- `merge_top_k` 增加會同時增加 cross-encoder reranker 的計算量
- `multi_query_count` 增加時，也應同步確認 Workers AI 速率限制不會觸發

---

## 十二、2026 面試熱門話題

### 12.1 Agentic RAG（已實作，`rag_strategy = 'agentic'`）

**傳統 RAG vs. Agentic RAG：**

| 面向 | 傳統 RAG（本系統 Baseline）| Agentic RAG（已實作）| Text-to-SQL（新增）|
|------|--------------------------|-------------------|--------------------|
| 檢索決策 | 固定流程，一次決定 | LLM 主動決定是否繼續搜尋 | SQL 模板直查 |
| 多跳推理 | 不支援 | 支援（每輪搜尋基於前輪結果）| 不適用 |
| 延遲 | ~1–2.5s | ~3–5s | ~0.1–0.3s |
| Token 成本 | baseline | +60% | 極低（僅 Tool Selection）|
| 適合場景 | 大部分查詢 | 複雜多跳問題 | 統計/計算/篩選 |

**本系統的 Agentic 設計（ReAct 模式，在 hybrid-search step 內實作）：**

```
LLM 決策迴圈（最多 agentic_max_steps 輪，預設 3）：
  收集 evidence
     ↓
  LLM 選擇行動：
    ANSWER  → 資訊足夠，直接生成回答
    RETRIEVE → 補充搜尋（指定改寫後的查詢）
    BROADEN  → 搜尋結果不足，放寬條件重試
     ↓
  更新 evidence
     ↓ （loop）
```

**何時走 Agentic，何時走 Baseline（在 hybrid-search step 內判斷）：**
```typescript
// steps/hybrid-search.ts
if (pipelineConfig.rag_strategy === 'agentic' && ctx.queryType === 'complex') {
  // Agentic Multi-Step RAG（ReAct 模式）
  const { candidates, terminationReason } = await queryService.agenticRetrieve(query, vectorFilter, pipelineConfig, ...);
} else {
  // Baseline：標準多路搜尋 + RRF
}
// simple 查詢即使設定 agentic 也自動走 Baseline（成本保護）
```

**關鍵工程挑戰：**
- **Stopping Condition**：「已有 3 份相關文件時優先 ANSWER」防止無限迴圈
- **去重**：多輪搜尋可能找到重複文件，需要 `deduplicateSources()`
- **日誌結構**：需記錄多輪步驟，`pipeline_trace` 需要擴充

---

### 12.2 Graph RAG（延伸討論）

**[Graph RAG](https://arxiv.org/abs/2404.16130)（[GitHub](https://github.com/microsoft/graphrag)）的核心想法：** 將知識庫建成知識圖譜（實體 + 關係），讓 LLM 能沿著關係邊進行多跳查詢。

**本系統為什麼沒用 Graph RAG：**
- 攀岩資料的關係相對簡單（路線→岩場→地區），不需要複雜的圖譜
- Cloudflare 生態沒有原生圖資料庫
- Vectorize 的 metadata filter 已足夠處理層級關係過濾

**什麼場景適合 Graph RAG：**
- 知識複雜、實體間關係多樣（如醫療、法律）
- 需要多跳推理（A 的父公司是 B，B 的 CEO 是誰？）

---

### 12.3 RAG 評估框架（RAGAS）

面試常問如何系統性評估 RAG，業界常用 [**RAGAS**](https://docs.ragas.io/)（[GitHub](https://github.com/explodinggradients/ragas)）框架：

| 指標 | 定義 | 本系統對應 |
|------|------|---------|
| **Faithfulness** | 回答有多少比例基於 context（無幻覺）| `groundedness_score` |
| **Answer Relevancy** | 回答對問題的相關程度 | `auto_score`（quality）|
| **Context Recall** | 所有相關資訊是否都被召回 | 間接由 multi-query + BM25 提升 |
| **Context Precision** | 召回的文件有多少是真正相關的 | cross-encoder reranker 提升 |

本系統的 `groundedness_score` 直接對應 RAGAS 的 Faithfulness，`auto_score` 對應 Answer Relevancy。

---

### 12.4 向量資料庫選型比較（常見追問）

| 選項 | 適合場景 | 本系統選 Vectorize 的理由 |
|------|---------|------------------------|
| [**Cloudflare Vectorize**](https://developers.cloudflare.com/vectorize/) | Cloudflare Workers 生態 | 原生整合，零網路延遲，共用 billing |
| [**Pinecone**](https://docs.pinecone.io/) | 獨立服務，功能最豐富 | 需額外費用 + 跨網路延遲 |
| **pgvector** | 已有 PostgreSQL | 本系統用 D1（SQLite），不適用 |
| [**Weaviate**](https://weaviate.io/) / [**Qdrant**](https://qdrant.tech/) | 自托管，控制度高 | Cloudflare Workers 無法連 self-hosted 服務 |

---

### 12.5 Embedding 模型選型

**選 [`bge-m3`](https://huggingface.co/BAAI/bge-m3) 的理由：**
- **多語言**：繁體中文 + 英文混合查詢效果佳（攀岩術語常中英混用）
- **1024 維**：精度與存儲成本的平衡（比 384 維準，比 3072 維省）
- **Cloudflare 原生**：Workers AI 直接支援，延遲最低
- **BGE 系列**：[MTEB Benchmark](https://huggingface.co/spaces/mteb/leaderboard) 多語言排名靠前（[論文](https://arxiv.org/abs/2210.07316)）

**Embedding 維度的取捨：**
- 維度越高：語意表達能力越強，但存儲成本和搜尋延遲增加
- 1024 維是目前主流 Embedding 模型的常見選擇

Sources:
- [RAG Interview Questions - DataCamp](https://www.datacamp.com/blog/rag-interview-questions)
- [Advanced Agentic AI Interview Questions 2026](https://aemonline.net/blog/25-advanced-agentic-ai-interview-questions-for-2026-with-answer-updated-february-2026/)
- [RAG Interview: 40 Questions - Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/02/rag-interview-questions-and-answers/)
- [Agentic RAG Survey - GitHub](https://github.com/asinghcsu/AgenticRAG-Survey)

### 技術參考資源索引

**論文 & 學術資源：**
| 技術 | 連結 |
|------|------|
| HyDE | [arXiv:2212.10496](https://arxiv.org/abs/2212.10496) |
| Contextual Retrieval | [Anthropic Blog](https://www.anthropic.com/news/contextual-retrieval) |
| RRF | [ACM DL](https://dl.acm.org/doi/10.1145/1571941.1572114) |
| MMR | [ACM DL](https://dl.acm.org/doi/10.1145/290941.291025) |
| Cross-encoder Reranking | [arXiv:1901.04085](https://arxiv.org/abs/1901.04085) |
| CRAG | [arXiv:2401.15884](https://arxiv.org/abs/2401.15884) |
| Self-RAG | [arXiv:2310.11511](https://arxiv.org/abs/2310.11511) |
| ReAct | [arXiv:2210.03629](https://arxiv.org/abs/2210.03629) |
| Adaptive RAG | [arXiv:2403.14403](https://arxiv.org/abs/2403.14403) |
| Graph RAG | [arXiv:2404.16130](https://arxiv.org/abs/2404.16130)、[GitHub](https://github.com/microsoft/graphrag) |
| Late Chunking | [arXiv:2409.04701](https://arxiv.org/abs/2409.04701) |
| RAFT | [arXiv:2403.10131](https://arxiv.org/abs/2403.10131) |
| CAG | [arXiv:2412.15605](https://arxiv.org/abs/2412.15605) |
| HNSW | [arXiv:1603.09320](https://arxiv.org/abs/1603.09320) |
| BGE-M3 | [arXiv:2402.03216](https://arxiv.org/abs/2402.03216) |
| MTEB Benchmark | [arXiv:2210.07316](https://arxiv.org/abs/2210.07316) |
| RAGAS | [Docs](https://docs.ragas.io/)、[GitHub](https://github.com/explodinggradients/ragas) |

**模型 & 服務：**
| 技術 | 連結 |
|------|------|
| Gemma 3 | [Google AI](https://ai.google.dev/gemma/docs/core) |
| Llama 3.1 | [Meta AI](https://ai.meta.com/blog/meta-llama-3-1/) |
| BGE-M3 | [Hugging Face](https://huggingface.co/BAAI/bge-m3) |
| BGE-reranker-base | [Hugging Face](https://huggingface.co/BAAI/bge-reranker-base) |
| MTEB Leaderboard | [Hugging Face](https://huggingface.co/spaces/mteb/leaderboard) |

**基礎設施 & 框架：**
| 技術 | 連結 |
|------|------|
| Cloudflare Workers | [Docs](https://developers.cloudflare.com/workers/) |
| Cloudflare Workers AI | [Docs](https://developers.cloudflare.com/workers-ai/) |
| Cloudflare Vectorize | [Docs](https://developers.cloudflare.com/vectorize/) |
| Cloudflare D1 | [Docs](https://developers.cloudflare.com/d1/) |
| Cloudflare KV | [Docs](https://developers.cloudflare.com/kv/) |
| SQLite FTS5 | [Docs](https://sqlite.org/fts5.html) |
| Hono | [hono.dev](https://hono.dev/) |
| LangChain | [Docs](https://docs.langchain.com/) |
| LlamaIndex | [Docs](https://docs.llamaindex.ai/) |
| Pinecone | [Docs](https://docs.pinecone.io/) |

**安全標準：**
| 技術 | 連結 |
|------|------|
| OWASP LLM Top 10 | [Official](https://owasp.org/www-project-top-10-for-large-language-model-applications/) |

---

## 十三、基礎觀念題（Analytics Vidhya 40 題精選）

> 這些是面試官用來確認基本功的題目，回答時要能連結到自己系統的實作。

---

### Q-B1：Sparse vs Dense Retrieval 的差異？各有什麼優缺點？

| 面向 | Sparse（BM25）| Dense（向量搜尋）|
|------|-------------|----------------|
| 原理 | TF-IDF 詞頻統計 | Embedding 向量相似度 |
| 優點 | 精確術語匹配、計算快 | 語意理解、處理同義詞 |
| 缺點 | 詞彙不匹配就找不到 | 對精確術語效果差 |
| 適合 | 路線名、難度代碼 | 模糊描述、意圖查詢 |

**本系統做法：** 同時跑 BM25（FTS5）+ 向量搜尋，RRF 合併兩路結果（Hybrid Search）。業界研究顯示 Hybrid 比單純向量提升 33–47% 精準度。

---

### Q-B2：Chunking 策略是什麼？如何決定 chunk size？

**什麼是 Chunking：** 將長文件切割成較小片段再 embed，確保每個向量代表的語意範圍聚焦。

**Chunk size 的取捨：**
- **太小**：單個 chunk 語意不完整，失去上下文
- **太大**：一個向量混入太多主題，語意模糊，搜尋精準度下降

**本系統的選擇（不切割）：** 攀岩路線資料天然是結構化的獨立單元（每條路線一筆），不需要切割，直接將一條路線的所有欄位組合為一個 document text 進行 embed。

**需要切割的場景：** 長篇文章、PDF、書籍——建議按段落切割，並用 sentence-window 保留前後文。

---

### Q-B3：Cosine Similarity 在向量搜尋中的角色？

向量搜尋的核心是計算 Query Embedding 與 Document Embedding 的相似度。Cosine Similarity 衡量兩個向量的角度差，與向量長度無關：

```
cosine_sim(A, B) = (A · B) / (|A| × |B|)
```

值域 -1 到 1，越接近 1 表示語意越相似。

**為什麼用 Cosine 而不是 Euclidean Distance？**
- Embedding 模型訓練時通常假設 cosine 距離
- 對向量長度不敏感（文件長度不影響相似度）

**本系統：** Cloudflare Vectorize 使用 cosine similarity 作為預設距離函數，設定 `min_vector_score = 0.5` 作為最低相似度門檻。

---

### Q-B4：什麼是 Precision 和 Recall？在 RAG 中如何平衡？

```
Precision = 相關文件數 / 總召回文件數   （召回的有多準）
Recall    = 相關文件數 / 所有相關文件數 （找到了多少）
```

**本系統的設計決策：**
- **高 Recall（多找一點）**：用 Multi-Query Expansion 從多個角度搜尋，CRAG 放寬回退確保有結果
- **提高 Precision（過濾噪音）**：Cross-encoder Reranking 精排，min_rrf_score 過濾低分候選
- **CRAG 的 Recall vs Precision 取捨**：放寬 grade filter 時 Recall 提升但 Precision 下降，適合「寧可多給幾個相近難度的路線，也不要無結果」的場景

---

### Q-B5：什麼讓 Embedding 的準確度對 Dense Retrieval 很重要？

Embedding 是整個 RAG 系統的基礎——如果 embedding 不能準確表達語意，後面的 reranking 和 LLM 再強也無法找回遺漏的文件。

**選擇 Embedding 模型的考量：**
1. **語言覆蓋**：繁中 + 英文混合（本系統用 `bge-m3` 多語言模型）
2. **向量維度**：1024 維平衡精度與成本
3. **MTEB Benchmark 排名**：衡量多語言表現的業界標準
4. **推理延遲**：Cloudflare Workers AI 原生支援，延遲最低

---

## 十四、中階實戰題（Analytics Vidhya 40 題精選）

---

### Q-M1：如何設計支援頻繁更新資料的 RAG 系統？

**挑戰：** 資料庫每天有新路線、岩場資訊更新，向量索引需要跟著同步。

**本系統的解法（兩段式）：**

```
新增/更新路線 → API 觸發 indexSingleRoute()
  Phase 1（同步）：embed 原始文字 → Vectorize upsert → D1 insert
  Phase 2（背景）：ctx.waitUntil → LLM 生成摘要 → Vectorize 覆寫
```

```sql
-- FTS5 由 D1 觸發器自動維護，不需手動同步
CREATE TRIGGER ai_documents_fts_insert
AFTER INSERT ON ai_documents BEGIN
  INSERT INTO ai_documents_fts(doc_id, text) VALUES (new.id, new.text);
END;
```

**分頁重建索引（避免 Worker timeout）：**
- 路線數量大時，分批（每批 100 筆）跑 `reindexAll()`
- `hasMore: true` 時前端輪詢繼續下一批

---

### Q-M2：如何評估 RAG 系統的品質？（RAGAS 框架）

**本系統已實作的評估：**

```
每次查詢後記錄到 ai_query_logs：
  ├─ groundedness_score（0.0–1.0）：faithfulness，回答基於 context 的比例
  ├─ auto_score（1–4）：answer quality，整體品質
  ├─ latency_ms（分段：embedding_ms, retrieval_ms, generation_ms）
  ├─ self_reflection_triggered：重生成比率
  └─ feedback_score：使用者主動回饋
```

**對應 RAGAS 框架指標：**

| RAGAS 指標 | 本系統對應 | 提升手段 |
|-----------|---------|---------|
| Faithfulness | `groundedness_score` | Judge 獨立模型評估 |
| Answer Relevancy | `auto_score` | Judge quality 分數 |
| Context Recall | 間接觀察 | Multi-Query + BM25 |
| Context Precision | 間接觀察 | Cross-encoder Reranker |

---

### Q-M3：RAG 系統中的典型結構性問題有哪些？如何改善？

| 問題 | 原因 | 本系統解法 |
|------|------|---------|
| Chunk 孤島 | Chunk 缺乏文件級脈絡 | Contextual RAG（LLM 生成語意摘要前置）|
| 詞彙不匹配 | 向量搜尋無法精確匹配術語 | BM25 FTS5 補足關鍵字搜尋 |
| 單一查詢召回不足 | 複雜問題多角度描述 | Multi-Query Expansion（3 路子查詢）|
| 結果多樣性不足 | Top-N 全是同難度同岩場 | MMR 多樣性選取（λ=0.6）|
| 幻覺（Hallucination）| LLM 超出 context 推斷 | groundedness_score 免責聲明 + Judge |

---

### Q-M4：如何在 RAG 系統中做 Hybrid Retrieval Filtering？

**本系統的 filter 策略（三層）：**

```
Layer 1：Metadata Filter（精確過濾）
  → Vectorize filter：grade_numeric, crag_id, area_id, region, route_type
  → 由 LLM Tool Calling 解析 + regex 補救

Layer 2：Score Filter（品質閾值）
  → 有 filter 時 min_rrf_score_filtered = 0.002（放寬）
  → 無 filter 時 min_rrf_score = 0.005（嚴格）

Layer 3：CRAG 動態放寬（無結果時）
  → 移除 grade_numeric → 移除 route_type → 移除全部
```

**重要設計原則：** filter 是召回的前提，寧可少用 filter 再讓 reranker 過濾，也不要 filter 過死導致零結果。

---

### Q-M5：如何優化 RAG 系統的延遲？

**主要優化手段：**

```
1. Pipeline skipWhen 自動跳過（最有效）
   每個 step 宣告 skipWhen 條件，engine 自動判斷
   simple → 跳過 HyDE + Multi-Query（節省 ~1s）
   sql/GK → 跳過整個 retrieval + post-retrieval（8 個 step）

2. earlyReturn 提前中斷
   semantic-cache、text-to-sql、GK 路徑可直接回傳
   不執行後續 step，零浪費

3. 快取（零延遲）
   精確快取（KV hash）→ < 10ms
   語義快取（向量相似）→ < 50ms（semantic-cache step）
   正常查詢 → ~1–2.5s

4. 並行化
   Pipeline 啟動前：loadPipelineConfig + earlyQueryVector + loadPrompts 並行
   embedding step 內：query + HyDE + expanded 向量並行計算
   hybrid-search step 內：多路 Vectorize + BM25 並行搜尋

5. 分流（六種路徑）
   sql → Text-to-SQL 直查（~0.1s earlyReturn）
   general-knowledge → 直接 LLM（~0.5s earlyReturn）
   simple → 輕量搜尋（~1.1s）
   complex → 完整 pipeline（~2–2.5s）
```

---

## 十五、進階系統設計題（Analytics Vidhya 40 題精選）

---

### Q-A1：如何設計多階段（Multi-Stage）檢索策略？

多階段檢索是業界標準的 Recall → Precision 兩段式設計：

```
Stage 1 — 寬鬆召回（高 Recall）
  向量搜尋 Top-50（快速）
  BM25 Top-10
  → RRF 合併 → Top-20 候選

Stage 2 — 精確重排（高 Precision）
  Cross-encoder 對 Top-20 重評分（慢但準）
  → Top-5 最終結果

Stage 3 — 多樣性選取
  MMR 從 Top-5 去除過度相似文件
  → Final Sources
```

**為什麼不直接用 Cross-encoder 搜尋全庫？**
Cross-encoder 需要將 query + 每個文件 concat 後輸入模型，對百萬筆文件執行一次是不可接受的。Bi-encoder（向量搜尋）快速縮小候選範圍，再讓 Cross-encoder 精排才是正確做法。

---

### Q-A2：RAG 系統有哪些隱私與安全風險？如何緩解？

**常見風險：**

| 風險 | 說明 | 本系統做法 |
|------|------|---------|
| **Prompt Injection** | 使用者輸入惡意指令劫持 LLM | Input Guardrails 過濾（`checkInput()`）|
| **System Prompt Leakage** | LLM 被誘導輸出 system prompt | Output Guardrails 檢查（`checkOutput()`）|
| **PII 洩露** | LLM 回答帶出用戶個資 | Output 過濾 PII 關鍵字 |
| **資料投毒** | 惡意文件污染向量索引 | 索引前內容審核（管理員控制）|
| **過度檢索** | 將不相關但敏感的文件帶入 context | metadata filter 限制搜尋範圍 |

**Output Guardrails 實作：**
```typescript
// backend/src/utils/guardrails.ts
// 截斷過長回應、過濾 system prompt 關鍵詞、移除 PII
answer = checkOutput(answer);
```

---

### Q-A3：如何處理超過模型 Context Window 的長文件？

**本系統的優勢：** 攀岩路線是結構化短文（每筆 200–500 字），不存在超過 context window 的問題。但面試時可以展示對這個問題的認識：

**業界常見做法：**

```
方法 1：Hierarchical RAG（層級式）
  → 先搜尋文件級摘要（快，找到相關文件）
  → 再搜尋該文件內的 chunk（精確，找到相關段落）

方法 2：Sentence Window Retrieval
  → 索引時切小 chunk（精確 embed）
  → 檢索時擴展至前後 N 句（提供上下文）

方法 3：Context Truncation
  → 截斷每個 source 到固定長度（本系統 judge_context_truncate = 2000）
  → 確保總 context 不超過 LLM context window
```

**本系統對應（judge_context_truncate）：**
```typescript
// context 傳給 Judge 時截斷，避免 Judge 模型超出 context window
{ contextTruncate: pipelineCfg.judge_context_truncate }  // 預設 2000 字元
```

---

### Q-A4：如何監控和 Debug RAG 系統的品質？

**本系統的 Observability 設計：**

```
每次查詢 → ai_query_logs 記錄：
  基本資訊：user_id, query, response, latency_ms
  分段延遲：embedding_ms, retrieval_ms, generation_ms
  品質指標：groundedness_score, auto_score, feedback_score
  觸發狀態：hyde_triggered, self_reflection_triggered
  標記狀態：flagged（'low_groundedness' | null）
  詳細追蹤：pipeline_trace（JSON，含每個 stage 的中間結果）
```

**pipeline_trace 包含（由各 pipeline step 各自寫入 ctx.trace）：**
```json
{
  "pipeline_steps": ["semantic-cache", "tool-selection", "hyde", "multi-query", "filter-build", "embedding", "hybrid-search", "cross-encoder", "mmr", "popularity-rerank", "llm-generation", "judge", "self-reflection"],
  "query_parsing": { "tool": "search_routes", "query_type": "complex", "alternatives": ["search_routes", "search_crags", "general_knowledge", "search_sql", "hybrid"] },
  "filter": { "applied": { "crag_id": {"$eq": "xxx"} }, "source": "llm_parsed", "history_supplemented": false },
  "embedding": { "early_vector_reused": true, "hyde_embedded": true, "expanded_count": 3 },
  "retrieval": { "paths": ["query_vec", "hyde_vec", "bm25", "expanded_0", "expanded_1", "expanded_2"], "crag_fallback": false },
  "generation": { "context_doc_count": 5, "regen_triggered": false },
  "self_reflection": { "original_groundedness": 0.72, "regen_groundedness": 0.85, "regen_accepted": true }
}
```

**主動監控策略：**
- `flagged = 'low_groundedness'` → 需人工審視
- `self_reflection_triggered` 比率高 → 考慮調整 judge_regen_quality_max
- `latency_ms` P95 突增 → 看 pipeline_trace 找瓶頸 stage

---

### Q-A5：什麼技術能改善 RAG 的 Grounding 和引用可靠性？

**Grounding（回答有據可查）的提升手段：**

1. **Contextual RAG**：讓 embedding 更準確，召回的文件更相關
2. **Cross-encoder Reranking**：過濾不相關文件，context 更乾淨
3. **Judge Groundedness Score**：獨立模型評估回答基於 context 的比例
4. **免責聲明注入**：低 groundedness 時主動告知使用者
5. **Source 引用**：回傳 sources 讓使用者可驗證

**Citation Reliability（引用精確）：**
```typescript
// 後處理：將路線名稱自動注入 markdown 連結（不依賴 LLM 格式遵守）
answer = this.injectRouteLinks(parsedAnswer, finalSources);
// 例：「幻想鄉」 → [幻想鄉](/crag/xxx/route/yyy)
```

**為什麼不讓 LLM 自己生成連結？**
LLM 生成的連結可能是幻覺 URL，用後處理注入確保連結都是真實存在的路線頁面。

---

### Q-A6：如何讓 Agentic RAG 的迴圈安全且可控？

**三個關鍵安全機制：**

```typescript
// 1. 最大步數限制（硬性上限，防無限迴圈）
const MAX_STEPS = 3;
for (let step = 0; step < MAX_STEPS; step++) {
  const action = await decideNextAction(query, evidence);
  if (action.type === 'ANSWER') break;  // 提前終止
  // ...
}

// 2. 文件數量 Stopping Condition（軟性上限）
// Prompt 中明確：「已有超過 3 份相關文件時，優先選 ANSWER」

// 3. 去重機制（避免重複搜尋同樣文件浪費 token）
allSources = deduplicateSources([...allSources, ...newDocs]);
```

**成本保護：**
```typescript
// simple 查詢即使設定 agentic 也自動走 Baseline
if (strategy === 'agentic' && queryType === 'complex') {
  return await this.agenticRetrieve(query, env, config);
}
```

---

### Q-A7：Multimodal RAG（多模態）如何影響檢索策略？

**本系統目前的 Multimodal 元素：**
- 路線有對應的 YouTube 影片（`route_videos` 關聯）
- 搜尋結果包含 `latestVideoUrl`，供前端展示影片
- 影片數量作為熱門度訊號，影響排序權重

**但目前的影片是「元資料」，不是真正的 Multimodal Embedding。**

**真正的 Multimodal RAG（延伸說明）：**
- 圖片/影片直接 embed（CLIP、BLIP-2 等模型）
- 查詢「大頭峰的攀爬姿勢」→ 找到含有相關技術姿勢的影片幀
- 技術挑戰：圖片 embedding 維度、跨模態對齊、儲存成本

**本系統為何不做：** 路線查詢主要靠文字描述就夠，影片是輔助參考，Multimodal embedding 的成本效益比不合理。

---

## 十六、容易混淆的概念澄清

---

### RAG vs Fine-tuning vs Prompt Engineering

```
Prompt Engineering：不更動模型，只調整輸入格式
  → 成本最低，但受 context window 限制，知識有截止日期

RAG：不更動模型，動態注入外部知識
  → 知識即時更新，可追蹤來源，適合動態資料

Fine-tuning：更動模型權重，讓模型學習特定知識/風格
  → 學習新知識效果有限，適合固定風格/格式、領域語言習慣

組合使用（最佳實踐）：
  Fine-tuning（學習攀岩術語表達風格）
  + RAG（即時查詢最新路線資料）
  + Prompt Engineering（調整輸出格式）
```

---

### Embedding 相似度 vs Cross-encoder Score 的差異

```
Bi-encoder（Embedding 相似度）：
  Query → embed → vector_q
  Doc   → embed → vector_d
  score = cosine(vector_q, vector_d)
  優點：可預計算 doc vector，搜尋速度 O(1)
  缺點：query 和 doc 沒有直接互動，精準度有上限

Cross-encoder（Reranker Score）：
  [Query; Doc] → 一起輸入模型 → score
  優點：直接建模 query-doc 交互，精準度高
  缺點：無法預計算，每次搜尋都要即時計算，不適合大規模
```

**本系統：** Bi-encoder 快速召回 Top-10，Cross-encoder 精排取 Top-5。

---

### KV 快取 vs 語義快取 vs 向量索引快取

| 類型 | 命中條件 | 延遲 | 適用場景 |
|------|---------|------|---------|
| KV 精確快取 | 完全相同的 query hash | < 10ms | 重複查詢 |
| 語義快取 | cosine 相似度 > 0.95 | < 50ms | 意思相同但表達不同的查詢 |
| 向量索引 | 每次都執行 | ~300ms | 正常搜尋 |

---

### Self-RAG vs CRAG vs Agentic RAG

| 技術 | 核心想法 | 本系統對應 |
|------|---------|---------|
| **Self-RAG** | LLM 評估自己的輸出是否需要搜尋、是否支持 | Judge-Guided 重生成 + loopBack 回跳 retrieval |
| **CRAG** | 檢索失敗時動態放寬條件重試 | 兩階段放寬（grade→route_type），在 hybrid-search step 內 |
| **Agentic RAG** | LLM 主動控制整個檢索迴圈 | 已實作（`rag_strategy = 'agentic'`，complex 查詢觸發）|

三者不互斥，本系統 Baseline 同時具備 Self-RAG 精神（Judge 評估 + loopBack）+ CRAG（放寬重試），Agentic RAG 是已實作的進階模式。所有功能都是模組化 pipeline step，可獨立開關。

---

## 十七、DataCamp 30 題：尚未覆蓋的重要概念

> 來源：DataCamp《Top 30 RAG Interview Questions and Answers for 2026》
> 以下補充現有文件未涵蓋、但面試高頻出現的題目。

---

### Q-DC1：Prompt Engineering 在 RAG 中的角色？

RAG 系統不只是「搜尋 + 生成」，Prompt 設計直接決定生成品質：

**System Prompt 策略（本系統實作）：**
```
Rule：「根據以下資料回答問題，若資料不足請說明，不要推測。」
```
明確指示 LLM 只使用 context 中的資料，是降低幻覺最有效的 Prompt 技術。

**Few-shot Prompting：** 給幾個問答範例，讓 LLM 學習回答格式（本系統目前未使用，未來可針對路線推薦格式加入）。

**Chain-of-Thought Prompting：** 讓 LLM 解釋推理過程再給答案，適合複雜多跳問題。本系統 Agentic RAG 的 `decideNextAction()` 設計有類似思路。

---

### Q-DC2：Chunking 有哪些策略？各自的優缺點？

| 策略 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **Fixed-length** | 固定字元/token 數切割 | 簡單，易實作 | 可能切斷語意 |
| **Sentence-based** | 以句子為單位 | 語意完整 | 太短可能失去上下文 |
| **Paragraph-based** | 以段落為單位 | 上下文完整 | 段落可能太長 |
| **Semantic chunking** | 依語意主題切割 | 語意聚焦 | 需要額外 NLP 模型 |
| **Sliding window** | 重疊切割（前後重疊 N 字）| 不遺漏邊界資訊 | 計算成本高，重複資訊 |

**本系統為何不需要 Chunking：** 攀岩路線資料是結構化獨立單元，每條路線已是天然的「chunk」（200–500 字），不存在跨 chunk 上下文問題。

---

### Q-DC3：什麼是 Late Chunking？與傳統 Chunking 的差異？

**傳統 Chunking 的問題：**
先切 chunk → 每個 chunk 獨立 embed → 各 chunk 的向量沒有考慮彼此，損失長程依賴。

**[Late Chunking](https://arxiv.org/abs/2409.04701)（Günther et al., 2024）：**
1. 先將整份文件輸入 Transformer 取得 token-level embeddings（保留完整上下文）
2. 再對這些 token embeddings 做 mean pooling 切出 chunk 向量
3. 每個 chunk 的向量「繼承」了全文的上下文資訊

```
傳統：  [切 chunk] → [每個 chunk 獨立 embed] → 向量
Late：  [全文 embed 取 token vectors] → [對 token vectors 切 chunk + pooling] → 向量
```

**效果：** 解決 chunk 孤島問題，類似 Contextual RAG 的概念，但在 embedding 層而非文字層處理。

**本系統的對應：** Contextual RAG（`enrichWithContextualSummaries`）是在文字層解決孤島問題（加摘要前置），Late Chunking 是在 embedding 層解決，兩者思路相通。

---

### Q-DC4：什麼是 CAG？和 RAG 的差異？何時選 CAG？

**[CAG（Cache-Augmented Generation）](https://arxiv.org/abs/2412.15605)：** 在將文件送入 LLM 前，先經過摘要或壓縮步驟，再存入 context cache。

```
傳統 RAG：  Query → 搜尋 → 原始文件 → LLM
CAG：       文件先壓縮摘要 → 存入 cache → Query → 搜尋 cache → LLM
```

| 面向 | RAG | CAG |
|------|-----|-----|
| 資料類型 | 動態，即時更新 | 靜態（產品手冊、學術論文）|
| Token 效率 | 原始文件較長 | 壓縮後 token 更少 |
| 維護成本 | 即時索引即可 | 需要事先壓縮整理 |
| 適合場景 | 即時資訊、攀岩路線 | 靜態知識庫 |

**本系統選 RAG 的理由：** 路線資料隨時有人新增，需即時更新；且 Contextual RAG 的摘要只是輔助 embedding，不是 CAG 式的文件壓縮。

---

### Q-DC5：如何處理 RAG 中的偏見（Bias）問題？

**三種來源的偏見：**

| 偏見來源 | 說明 | 緩解做法 |
|---------|------|---------|
| **知識庫偏見** | 資料本身有地域/語言/觀點偏差 | 多元資料來源、定期審核 |
| **檢索偏見** | 熱門文件被過度檢索 | MMR 多樣性選取、popularity weight 設上限 |
| **生成偏見** | LLM 的預訓練偏見影響輸出 | Judge 評估、輸出過濾 |

**本系統的相關設計：**
- MMR（λ=0.6）確保不過度推薦單一岩場或難度的路線
- popularity_weight（0.3）是輔助訊號，不是主要排序依據（避免完全由熱門度決定）

---

### Q-DC6：RAFT（Retrieval-Augmented Fine-Tuning）是什麼？

**[RAFT](https://arxiv.org/abs/2403.10131)** 結合 RAG 的動態檢索和 Fine-tuning 的領域適應：

```
訓練時：
  給模型「query + 相關文件（oracle）+ 干擾文件（distractor）」
  讓模型學會：從混合文件中找到有用的，忽略無關的

推理時：
  正常 RAG pipeline，但模型已學會更有效地使用 context
```

**對比 RAG vs Fine-tuning vs RAFT：**

```
純 RAG：模型不懂如何用 context → 可能忽略重要資訊
Fine-tuning：記住知識但無法更新 → 知識截止日期問題
RAFT：訓練「如何用 context」的能力 → 兩者優點兼得
```

**本系統目前：** 未使用 RAFT，使用 Prompt Engineering 指示 LLM 如何使用 context。如果未來路線資料量夠大，RAFT 是值得考慮的升級方向。

---

### Q-DC7：如何設計 RAG 系統的角色型存取控制（RBAC）？

**問題：** 不同使用者應該看到不同的 context 資料（如管理員 vs 普通用戶）。

**業界做法：**
```
在 chunk metadata 中加入 access_level tag
檢索時加入 access_level filter，確保只搜尋有權限的文件
```

**本系統的對應：**
- 目前所有路線資料是公開的，不需要 RBAC
- AI Chat 本身由 `NEXT_PUBLIC_ENABLE_AI_CHAT` 控制（目前管理員限定）
- 如果未來加入付費內容（進階路線資料），可以在 Vectorize metadata 加入 `subscription_tier` filter

---

### Q-DC8：如何處理 RAG 中的幻覺（Hallucination）？

**幻覺的來源：**
1. **Context Gap**：檢索到的文件不包含回答所需資訊，LLM 「補腦」
2. **Context Overflow**：Context 太長，LLM 忽略中間內容（Lost in the Middle）
3. **Instruction Conflict**：System prompt 和 user message 指令衝突

**本系統的多層防護：**

```
Layer 1（預防）：Metadata filter → 精確限制搜尋範圍，減少 context gap
Layer 2（偵測）：Judge groundedness_score → 量化幻覺程度
Layer 3（補救）：Judge-Guided 重生成 → 低品質時重試取較好者
Layer 4（告知）：groundedness < 0.6 → ❓ 免責聲明注入
Layer 5（輸出）：checkOutput() → 過濾 system prompt leakage、PII
```

---

### Q-DC9：如何確保 RAG 生成的輸出與檢索到的資料一致？

**三種技術手段：**

1. **Prompt 設計**：明確指示 LLM 只使用 context 資料
   ```
   系統提示："只根據以下資料回答，若資料不足，說明「找不到相關資訊」"
   ```

2. **Post-generation 驗證**：用 Judge 模型評估 groundedness（本系統實作）
   - groundedness 衡量回答有多少比例能在 context 中找到依據

3. **Citation Generation（引用注入）**：本系統的自動連結注入
   ```typescript
   // 後處理：路線名稱自動轉為可驗證連結
   answer = this.injectRouteLinks(parsedAnswer, finalSources);
   // [幻想鄉](/crag/xxx/route/yyy) — 使用者可點擊驗證
   ```

**為什麼不讓 LLM 自己生成連結？** LLM 生成的 URL 可能是幻覺（hallucinated URL），後處理注入確保每個連結都指向真實存在的頁面。

---

### Q-DC10：如何平衡 RAG 的 Recall 和 Precision（在規模擴大時）？

**規模擴大帶來的挑戰：**
- 文件數從 1000 條路線成長到 100,000 條 → min_rrf_score 需要重新校準
- 高 Recall + 低 Precision → context 充斥不相關文件 → LLM 生成品質下降

**本系統的動態策略：**

```
無 filter 時：min_rrf_score = 0.005（嚴格，因為沒有 filter 保護）
有 filter 時：min_rrf_score_filtered = 0.002（放寬，filter 本身已過濾）
CRAG 觸發後：徹底放寬（寧可低精準也要有結果）
```

**規模擴大時的調整建議：**
1. 提高 `min_rrf_score` 門檻（容忍更低 Recall，換取 Precision）
2. 調小 `merge_top_k`（減少候選，Cross-encoder 精排更聚焦）
3. 增加 Vectorize metadata filter 精度（如加入 `verified` 旗標只搜尋已審核路線）
4. Segment 索引（依地區或類型建立子索引，縮小每次搜尋範圍）

---

### Q-DC11：[Adaptive RAG](https://arxiv.org/abs/2403.14403) 是什麼？和本系統的關係？

**Adaptive RAG**（Jeong et al., 2024）讓系統動態決定要用哪種檢索策略：
- **No retrieval**：問題夠簡單，LLM 自己回答
- **Single-step RAG**：標準一次檢索
- **Iterative RAG**：多輪檢索直到答案夠好

**本系統就是 Adaptive RAG 的實作（6 種路徑）：**

```
general-knowledge    → No retrieval（直接 LLM，earlyReturn）
sql                  → No retrieval（SQL 模板查詢，earlyReturn）
clarification-needed → No retrieval（追問確認，earlyReturn）
simple               → Single-step RAG（輕量搜尋）
hybrid               → SQL + Vector rerank
complex              → Enhanced RAG（HyDE + Multi-Query + Judge 重生成）
complex + agentic    → Iterative RAG（多輪 ReAct，已實作）
```

LLM Tool Calling 的 Adaptive Routing 就是 Adaptive RAG 的核心機制——由 LLM 本身判斷需要什麼級別的檢索。模組化 Pipeline 的 `skipWhen` 機制讓每種路徑自動跳過不需要的 step。

---

### Q-DC12：如何確保 RAG 系統在生產環境中的穩健性（Robustness）？

**四個維度：**

| 維度 | 本系統的做法 |
|------|------------|
| **Redundancy（備援）** | Graceful degradation：BM25/HyDE/Judge 任一失敗不影響核心流程 |
| **Error handling** | 每個 try-catch 都靜默降級，錯誤記錄到 console，不 crash 主流程 |
| **Input validation** | Input Guardrails（`checkInput()`）過濾有害輸入 |
| **Monitoring** | `ai_query_logs` 完整記錄，`flagged` 欄位標記異常查詢 |

**Quota 系統的健壯性設計：**
```sql
-- 原子扣除額度（雙條件 WHERE 防止超扣）
UPDATE user_ranks
SET daily_ai_used = daily_ai_used + 1,
    daily_token_used = daily_token_used + ?
WHERE user_id = ?
  AND daily_ai_used < daily_ai_limit
  AND daily_token_used + ? <= daily_token_limit
```
斷線（SSE 中斷）時退還配額，確保使用者不被誤扣。LLM 完成後用實際 token 數校正估算差額。

---

## 十八、本系統獨特功能（面試官若看過 code 才會問）

---

### 18.1 SSE 串流設計（`?stream=true`）

**為什麼需要串流？**
RAG pipeline 完整跑完需要 2–3 秒，非串流模式用戶要等完整回答才看到任何東西。串流讓 LLM 一開始生成 token 就即時推送，大幅降低感知延遲（TTFT，Time To First Token）。

**實作架構：**

```
客戶端  POST /api/v1/ai/ask?stream=true
           ↓
路由層    建立 SSE 連線（Content-Type: text/event-stream）
           ↓
服務層    askStream() → ask(onToken=write)
           ↓ Stage 1–9 正常執行（同非串流）
           ↓ Stage 10：LLM 生成時呼叫 stream: true
           ↓ 每個 token 到達 → onToken() → 推送 SSE 事件
           ↓
客戶端    即時渲染每個 token
```

**SSE 事件格式：**
```json
// 內容 token（每個文字片段）
{ "type": "token", "token": "龍洞" }

// 結束（含剩餘配額）
{ "type": "done", "quota_remaining": 4 }

// 錯誤
{ "type": "error", "message": "AI 服務暫時無法使用" }
```

**串流模式的特殊處理：**
- **Judge 改為 `waitUntil` 非同步**：token 已推送無法替換，Judge 只做日誌記錄，不觸發重生成
- **建議問題過濾**：用滑動視窗偵測 `---SUGGESTIONS---` 分隔符，建議列表不推送給客戶端
- **斷線退還配額**：SSE 連線中斷時，`daily_ai_used` 退還 1 次（`MAX(0, daily_ai_used - 1)`）

**滑動視窗 token 過濾（關鍵實作細節）：**
```typescript
// 問題：建議問題標記 "---SUGGESTIONS---" 可能跨 SSE chunk 分割
// 解法：保留最後 (MARKER.length - 1) 個字元的 buffer，確保不會切斷標記偵測
const safeLen = slideBuffer.length - (MARKER.length - 1);
if (safeLen > 0) {
  await onToken(slideBuffer.slice(0, safeLen));  // 安全推送
  slideBuffer = slideBuffer.slice(safeLen);      // 保留尾部繼續監控
}
```

---

### 18.2 Memory 萃取機制（被動個人化學習）

**設計理念：** 不要求用戶填寫個人資料，而是從對話中被動學習。用戶說「我是 5.11a 的程度」，系統自動記住，下次回答自動調整難度建議。

**觸發時機：** 每次已登入用戶的查詢結束後，`ctx.waitUntil()` 在背景非阻塞執行：

```typescript
// 查詢回應後，背景萃取記憶（不阻塞回應）
ctx.waitUntil(extractMemoriesFromQuery(query, userId, env.DB, env.AI, gatewayOptions));
```

**萃取流程：**
```
用戶 query（只看用戶問題，不看 AI 回答）
     ↓
Llama-3.1-8b 分析 → 輸出 JSON 陣列
     ↓
白名單驗證（memory_key、memory_type 各有允許值）
     ↓
UPSERT 寫入 user_memories 表
```

**允許的 memory_key（固定白名單）：**
```typescript
const VALID_MEMORY_KEYS = new Set([
  'climbing_level',    // 攀岩程度（如 5.11a、V4）
  'preferred_region',  // 偏好地區（如台北、花蓮）
  'preferred_style',   // 偏好攀登類型（運攀、抱石、傳攀）
  'preferred_crag',    // 偏好岩場（如龍洞）
  'goals',             // 攀岩目標（想挑戰 5.12a）
]);
```

**為什麼要白名單？**
防止 LLM 亂輸出任意 key 污染資料庫，確保只有有業務意義的記憶被儲存。

**使用時機（查詢時注入 system prompt）：**
```typescript
const memorySummary = await getMemoriesSummary(userId, env.DB);
// 注入到 system prompt：「用戶偏好：運攀，能力 5.11a，常去龍洞」
const personalizedSystemPrompt = buildPersonalizedSystemPrompt(memorySummary, ascentContext, abilityLevel);
```

---

### 18.3 Quota 系統設計（原子操作防競爭）

**問題：** 用戶同時發多個請求，可能繞過配額檢查（TOCTOU Race Condition）。

**解法：原子 SQL UPDATE + 條件寫入**

```sql
-- 一個 SQL 同時做「檢查 + 扣除」，利用 SQLite 的原子性
UPDATE user_ranks
SET daily_ai_used  = daily_ai_used + 1,
    daily_token_used = daily_token_used + ?
WHERE user_id = ?
  AND daily_ai_used < daily_ai_limit         -- 次數未耗盡
  AND daily_token_used + ? <= daily_token_limit  -- token 未耗盡
```

`result.meta.changes` 為 `0` 表示 WHERE 條件不成立（配額耗盡），為 `1` 表示成功扣除。

**雙重配額：**
- `daily_ai_limit`：每日請求次數上限（依 Climber Rank 等級）
- `daily_token_limit`：每日 token 消耗上限（防止長問題濫用）

**斷線退還機制：**
```typescript
// SSE 串流中斷時退還（MAX(0,...) 防止負值）
await db.prepare(
  `UPDATE user_ranks SET
     daily_ai_used = MAX(0, daily_ai_used - 1),
     daily_token_used = MAX(0, daily_token_used - ?)
   WHERE user_id = ?`
).bind(estimatedTokens, userId).run();
```

**Token 估算與校正機制（Estimate → Correct）：**
```typescript
// 1. 查詢前：用字元長度估算 token 數（中文約 1 字 = 2 token）
function estimateTokens(inputText: string, outputText: string) {
  const prompt_tokens = Math.ceil(inputText.length / 2);
  const completion_tokens = Math.ceil(outputText.length / 2);
  return { prompt_tokens, completion_tokens, total_tokens: prompt_tokens + completion_tokens };
}

// 2. 查詢前：用估算值做原子扣除（deductQuotaAndToken）
// 3. 查詢後：LLM 回傳實際 usage → 與估算值差額校正
await addTokenUsage(userId, actualTokens, estimatedTokens, db);
// 內部邏輯：diff = actual - estimated → UPDATE daily_token_used += diff
```

**分段 Token 追蹤（token_breakdown）：**
每次查詢的 `pipeline_trace` 記錄每個 LLM 呼叫的 token 消耗明細：
```json
{
  "token_breakdown": {
    "query_parsing": { "prompt_tokens": 450, "completion_tokens": 30, "model": "gemma-3-12b-it", "estimated": false },
    "hyde": { "prompt_tokens": 200, "completion_tokens": 120, "model": "gemma-3-12b-it", "estimated": false },
    "multi_query": { "prompt_tokens": 180, "completion_tokens": 80, "model": "gemma-3-12b-it", "estimated": true },
    "main_generation": { "prompt_tokens": 1200, "completion_tokens": 400, "model": "gemma-3-12b-it", "estimated": false },
    "judge": { "prompt_tokens": 800, "completion_tokens": 20, "model": "llama-3.1-8b-instruct", "estimated": false }
  }
}
```

**高消耗標記（`is_high_consumption`）：**
當單次查詢的 token 消耗超過設定門檻時，`ai_query_logs` 自動標記 `is_high_consumption = true`，供 Admin 儀表板追蹤成本異常。

**Admin 成本儀表板（`/api/v1/admin/ai/stats`）：**
管理後台提供 Token 用量聚合統計端點，依時間區間查詢：
- 總 token 消耗、今日 token 消耗
- 過去 7 天每日 token 趨勢
- 快取命中率與查詢類型分佈

**與 Climber Rank 連動：**

| 等級 | 積分範圍 | daily_ai_limit | daily_token_limit |
|------|---------|---------------|-------------------|
| 麓（foothill）| 0–19 | 2 次 | 5,000 |
| 壁（wall）| 20–69 | 6 次 | 15,000 |
| 稜（ridge）| 70–99 | 12 次 | 30,000 |
| 巔（summit）| 100+ | 24 次 | 60,000 |

---

## 十九、向量索引內部原理（Senior 工程師必考）

---

### 19.1 ANN（Approximate Nearest Neighbor）為什麼比 Exact Search 更實用？

**Exact Search（暴力搜尋）：**
- 計算 query 向量與所有文件向量的相似度
- 複雜度 O(N × D)，N=文件數，D=向量維度
- 1000 條路線還好，但 1M 條文件 × 1024 維 = 不可接受

**ANN 的取捨：**
犧牲極少量精準度（通常 < 1% 的召回損失），換取 100–1000 倍的搜尋速度。

**Cloudflare Vectorize 使用 [HNSW](https://arxiv.org/abs/1603.09320)（Malkov & Yashunin, 2018）：**
```
Hierarchical Navigable Small World（分層可導小世界圖）

Layer 2（稀疏）：  A ─────────── E
Layer 1（中等）：  A ── B ─ C ── D ── E
Layer 0（稠密）：  A-B-C-D-...-Z（所有節點）

搜尋時：從最高層快速定位大區域 → 逐層精化 → 最底層精確搜尋
```

---

### 19.2 HNSW vs IVF（常見追問）

| 面向 | HNSW | IVF（Inverted File Index）|
|------|------|------------------------|
| 原理 | 多層圖結構，跳躍式搜尋 | 先 k-means 聚類，查詢時只搜尋相近 cluster |
| 搜尋速度 | 快（O(log N)）| 快（只搜部分 cluster）|
| 記憶體 | 高（圖結構要存邊）| 低（只存中心點）|
| 建索引速度 | 慢 | 快 |
| 動態更新 | 好（支援插入）| 差（需重新聚類）|
| 適合場景 | 動態資料（本系統）| 靜態大資料集 |

**本系統選 HNSW 的理由（Vectorize 預設）：** 路線資料頻繁更新（新路線持續增加），HNSW 支援動態插入，IVF 需要定期重新聚類。

---

### 19.3 向量維度的影響

| 維度 | 代表模型 | 語意精度 | 存儲/搜尋成本 |
|------|---------|---------|------------|
| 384 | MiniLM | 低 | 低 |
| 768 | BERT, BGE-small | 中 | 中 |
| **1024** | **BGE-M3（本系統）** | **高** | **中高** |
| 1536 | OpenAI text-embedding-3-small | 高 | 高 |
| 3072 | OpenAI text-embedding-3-large | 最高 | 最高 |

**本系統選 1024 的理由：** 多語言 + 繁中效果需要足夠維度，但 3072 的額外精度對攀岩路線這類結構化短文改善有限，成本不值得。

---

## 二十、為什麼 Gemma 生成、Llama 當 Judge？

這是一個刻意的架構決策，面試時主動提出展示系統思維。

**核心原則：角色分離（Separation of Concerns）**

```
Gemma-3-12b（生成）→ 語言品質強，繁中表達自然
Llama-3.1-8b（Judge）→ 輕量快速，獨立評估不受生成偏見影響
```

**為什麼不用 Gemma 自評？**
研究顯示同模型自評有 **64.5% 盲點率**（2025 學術研究）——模型傾向為自己的輸出打高分，特別是：
- 流暢但包含幻覺的回答
- 自信語氣的錯誤陳述
- 合理聽起來但超出 context 的推斷

**為什麼 Judge 用 Llama 而不是 Gemma？**

| 考量 | 選擇 | 原因 |
|------|------|------|
| 速度 | Llama-8b（輕量）| Judge 是同步執行，不能拖慢整體延遲 |
| 獨立性 | 不同家族模型 | Gemma 和 Llama 訓練方式不同，評估更客觀 |
| 成本 | 8b << 12b | Judge 每次查詢都執行，8b 成本更合理 |
| 能力 | 8b 足夠 | 評估 groundedness 不需要最強的模型 |

**Judge 的 Prompt 輸出格式（結構化，易解析）：**
```
groundedness: 0.85
quality: 3
```
直接用固定格式輸出，避免 JSON parsing 失敗的風險。

**完整的模型使用分工：**

| 任務 | 模型 | 理由 |
|------|------|------|
| Adaptive Routing（Tool Calling）| Gemma-3-12b | 意圖解析需要語言理解能力 |
| HyDE 生成 | Gemma-3-12b | 假設文件要高品質才有效 |
| Multi-Query 展開 | Gemma-3-12b | 改寫子查詢需要理解原意 |
| 最終回答生成 | Gemma-3-12b | 最重要的輸出，用最強模型 |
| Judge 評估 | Llama-3.1-8b | 輕量獨立，速度優先 |
| Contextual RAG 摘要 | Llama-3.1-8b | 背景任務，成本優先 |
| Memory 萃取 | Llama-3.1-8b | 背景任務，結構化輸出即可 |
| General Knowledge | Llama-3.1-8b | 通識問題不需要最強模型 |

---

## 二十一、Input / Output Guardrails（安全防護層）

> 對應程式碼：`backend/src/utils/guardrails.ts`

---

### 21.1 整體設計理念

Guardrails 是 RAG pipeline 的**最外層安全邊界**，在 LLM 呼叫發生之前（Input）和之後（Output）各攔截一次。

```
Request
  ↓
① checkInput()   ← 輸入防護：攔截惡意輸入，拋 GuardrailError → 400，不扣配額
  ↓
  Quota 檢查
  ↓
  [完整 RAG Pipeline]
  ↓
② checkOutput()  ← 輸出防護：過濾洩漏/PII/截斷，回傳淨化後的答案
  ↓
Response
```

**關鍵設計原則：Fail Early**
GuardrailError 在 input 階段就拋出（HTTP 400），不進入任何 LLM 呼叫，也**不扣除配額**。這防止惡意用戶用 jailbreak 查詢消耗系統資源。

---

### 21.2 Input Guardrails（`checkInput`）

執行四道檢查，任一失敗即拋 `GuardrailError`：

| 檢查 | 說明 | 範例觸發詞 |
|------|------|----------|
| **Custom Blocklist** | Admin 自訂封鎖詞（`ai_config.input_blocklist`）| 競爭對手名稱、違規術語 |
| **Prompt Injection** | 企圖覆寫 LLM 指令的關鍵字 | `"ignore previous instructions"`, `"override instructions"` |
| **Jailbreak Pattern** | 角色扮演/身份切換模式 | `"act as"`, `"扮演"`, `"假裝你是"`, `"你現在是"` |
| **Meaningless Input** | 純符號或連續重複字元 | `"!!!!!!!!!!!!"`, `"aaaaaaaaaa"` |

```typescript
// 輸入層防護 pipeline（順序執行）
const checks_run: string[] = [];

// 1. Admin 自訂 blocklist（從 ai_config 動態讀取）
checks_run.push('blocklist');
for (const keyword of customList) {
  if (lowerQuery.includes(keyword.toLowerCase())) throw new GuardrailError(...);
}

// 2. Prompt injection 關鍵字
checks_run.push('prompt_injection');
for (const keyword of injectionKeywords) {
  if (lowerQuery.includes(keyword)) throw new GuardrailError(...);
}

// 3. Jailbreak pattern
checks_run.push('jailbreak');
for (const pattern of jailbreakPatterns) {
  if (lowerQuery.includes(pattern.toLowerCase())) throw new GuardrailError(...);
}

// 4. 無效輸入（純符號 / 連續重複 10+ 個相同字元）
checks_run.push('meaningless');
const MEANINGLESS_SYMBOLS_RE = /^[^\w\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]+$/;
const REPEATED_CHARS_RE = /(.)\1{9,}/;
if (MEANINGLESS_SYMBOLS_RE.test(trimmed) || REPEATED_CHARS_RE.test(trimmed)) {
  throw new GuardrailError('輸入內容無效，請輸入有意義的問題');
}
```

**Admin 可動態調整清單（不需要重新部署）：**
```sql
-- 在 ai_config 中覆蓋預設清單（JSON 陣列格式）
UPDATE ai_config SET value = '["惡意詞1","惡意詞2"]'
WHERE key = 'input_blocklist';
```

**GuardrailsInputTrace（寫入 pipeline_trace）：**
```typescript
{
  passed: true,
  checks_run: ['blocklist', 'prompt_injection', 'jailbreak', 'meaningless'],
  triggered_check: null,      // 若觸發：是哪個檢查
  triggered_keyword: null,    // 若觸發：是哪個關鍵字
  query_length: 42,
  blocklist_size: 5,
}
```

---

### 21.3 Output Guardrails（`checkOutput`）

LLM 生成回答後，執行三道清理：

| 檢查 | 觸發條件 | 處理方式 |
|------|---------|---------|
| **System Prompt Leakage** | 回答包含 system prompt 中的敏感字串 | 整個回答替換為固定錯誤訊息 |
| **PII 過濾** | Email 格式 / 台灣電話號碼格式 | 正則替換為 `[已隱藏]` |
| **長度截斷** | 回答超過 3000 字元 | 截斷並加後綴說明 |

```typescript
// 1. System prompt leakage 偵測（任一觸發 → 整個替換，不暴露部分內容）
const DEFAULT_SYSTEM_PROMPT_LEAKAGE_PATTERNS = [
  'SYSTEM_PROMPT', 'You are a climbing assistant',
  '你是一個攀岩助理', '你是攀岩助理', 'system prompt', '<system>', '[SYSTEM]',
];
// 命中 → return '抱歉，回答過程發生錯誤，請重新提問。'

// 2. PII 過濾（正則替換）
const PII_PATTERNS = [
  { re: /\S+@\S+\.\S+/g, replacement: '[已隱藏]' },         // Email
  { re: /\b0\d{1,2}-?\d{6,8}\b/g, replacement: '[已隱藏]' }, // 台灣電話
];

// 3. 長度截斷（預設 3000 字元）
if (result.length > MAX_OUTPUT_LENGTH) {
  result = result.slice(0, MAX_OUTPUT_LENGTH) + '…（回答已截斷，請縮短問題或分多次詢問）';
}
```

**GuardrailsOutputTrace（寫入 pipeline_trace）：**
```typescript
{
  original_length: 850,
  output_length: 832,
  system_prompt_leaked: false,
  pii_count: 0,       // 過濾了幾個 PII
  truncated: false,
}
```

---

### 21.4 對應 [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)（面試可主動提）

| OWASP LLM 風險 | 本系統對應 |
|---------------|---------|
| **LLM01 Prompt Injection** | `checkInput` Prompt Injection 關鍵字 + Jailbreak Pattern 過濾 |
| **LLM02 Insecure Output Handling** | `checkOutput` 截斷 + PII 過濾 |
| **LLM06 Sensitive Information Disclosure** | System Prompt Leakage 偵測、PII 正則過濾 |
| **LLM07 Insecure Plugin Design** | Quota 原子操作防超扣 |
| **LLM10 Unbounded Consumption** | Quota 系統（次數 + token 雙重上限）、Meaningless Input 過濾（防 DoS）|

---

### 21.5 面試常見追問

**Q：為什麼不用 LLM 來做 Guardrails？**
速度和成本。Input Guardrails 是每次請求的第一道關，用 LLM 評估輸入會增加 0.5–1s 延遲且額外消耗 token。字串比對雖然簡單，但對已知的 prompt injection 模式已足夠有效，且執行成本幾乎為零。

**Q：字串比對 Guardrails 會不會被 Base64 編碼繞過？**
這是真實的攻擊向量（「aWdub3JlIHByZXZpb3VzIGluc3RydWN0aW9ucw==」）。目前的實作對這類繞過沒有防護。更完整的解法是加一層 LLM-based classifier（如 Llama Guard），但成本更高，對攀岩社群平台來說目前的風險可接受。

**Q：System Prompt Leakage 為什麼要整個替換而不是只移除洩漏部分？**
部分替換可能留下語意線索讓攻擊者推測 system prompt 內容。整個替換為固定訊息更安全，代價是損失那次回答——但這比洩漏 system prompt 的代價低得多。

**Q：PII 過濾只有 Email 和電話，夠嗎？**
對攀岩路線查詢的使用場景是足夠的。LLM 不太可能在攀岩問答中生成身分證字號或信用卡號。如果未來有更敏感的使用場景，可以擴充 `PII_PATTERNS` 陣列，不需要改架構。
