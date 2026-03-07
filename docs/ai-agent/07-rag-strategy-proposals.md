# RAG 策略方案規劃（2026）

> 建立日期：2026-03-05
> 最後更新：2026-03-06
> 相關程式碼：`backend/src/services/query.ts`、`backend/src/services/indexing.ts`、`backend/src/utils/ai-prompts.ts`、`backend/migrations/0059_bm25_hybrid.sql`、`backend/migrations/0060_multi_query_config.sql`
> 目的：規劃 Baseline 的改善路線，以及長期可選的 Agentic 模式

---

## 設計理念

策略分為兩種性質：

**改善型（B、C、D）**：對現有流程的局部強化，透過 A/B 測試驗證後直接融入 Baseline，不保留切換選項。切換只是測試手段，不是長期狀態。

**模式型（E）**：根本不同的 pipeline，成本與效果取捨明顯，長期與 Baseline 並存作為可選模式。

```
改善型路線：
  Baseline → 開啟 B/C/D → 觀察指標 → 有效 → 融入 Baseline → 只剩 Baseline

模式型路線：
  Baseline（simple/complex 通用）
  Agentic（complex 專用，高延遲高品質）  ← 永久並存
```

---

## 實作進度

| 策略 | 性質 | 狀態 |
|------|------|------|
| Baseline | 現有系統 | ✅ 已上線 |
| B - Contextual RAG | 改善型 → 驗證後融入 Baseline | ✅ 已融入 Baseline（2026-03-06） |
| C - Multi-Query Expansion | 改善型 → 驗證後融入 Baseline | ✅ 已融入 Baseline（2026-03-06） |
| D - BM25 Hybrid | 改善型 → 驗證後融入 Baseline | ✅ 已融入 Baseline（2026-03-06） |
| E - Agentic Multi-Step | 模式型 → 長期並存 | 🔧 開發中 |

---

## 一、Baseline（現有系統）

### 已具備功能

- Hybrid RAG（雙路向量 + RRF 合併）
- Adaptive Routing（simple / complex / general-knowledge 分流）
- HyDE（Hypothetical Document Embedding，complex 才觸發）
- CRAG 放寬回退（無結果時移除難度過濾重試）
- Cross-encoder Reranking + MMR 多樣性選取
- 熱門度加權排序
- Judge 品質評估（獨立 Llama 模型評 Gemma 輸出）
- **Judge-Guided Self-reflection**：重生成後對比 groundedness 取較高者（2026-03-05）
- 語義快取 + KV 快取
- **Contextual RAG**：索引時 LLM 生成語意摘要，背景 `waitUntil` 更新向量（2026-03-06，B 策略）
- **BM25 Hybrid（FTS5）**：D1 FTS5 全文搜尋加入 RRF 合併，補足關鍵字匹配（2026-03-06，D 策略）
- **Multi-Query Expansion**：complex 查詢自動改寫為 N 路子查詢，各自向量搜尋後 RRF 合併（2026-03-06，C 策略）

### 流程

```
Query
  ↓ [1] Input Guardrails
  ↓ [2] KV Cache
  ↓ [3] Quota Check
  ↓ [4] Adaptive Routing（LLM Tool-calling）
      ├─ general-knowledge → 直接 LLM 生成
      └─ simple / complex → RAG 路徑
  ↓ [5] HyDE + Multi-Query Expansion（complex 才觸發，並行執行）
  ↓ [6] 多路向量搜尋 + BM25（並行）
        ├─ 向量路 1：query embedding
        ├─ 向量路 2：HyDE embedding（complex）
        ├─ 向量路 3–N：子查詢 embedding × multi_query_count（complex）
        └─ BM25 路：D1 FTS5 全文搜尋（all）
  ↓      → N 路 RRF 合併
  ↓ [7] CRAG 放寬（無結果時，含 BM25 重試）
  ↓ [8] Cross-encoder Reranking
  ↓ [9] MMR 多樣性選取 + 熱門度加權
  ↓ [10] LLM 生成回答
  ↓ [11] Judge 評分
      ├─ quality ≤ 2（complex）→ 重生成
      │     → 對重生成再跑 Judge
      │     → 比較 groundedness，取較高者
      └─ quality > 2 → 直接使用
  ↓ [12] Groundedness 免責聲明注入
  ↓ Response

索引時（背景）：
  新增/更新文件 → 快速索引原始文字向量 → waitUntil 背景生成 LLM 語意摘要 → 覆寫 Vectorize 向量
  新增/更新文件 → D1 觸發器自動同步 ai_documents_fts（FTS5）
```

### 已解決缺口

| 缺口 | 對應改善 | 狀態 |
|------|---------|------|
| Chunk 缺乏文件級別上下文（chunk 孤島） | B - Contextual RAG | ✅ 已融入 |
| 單一查詢，複雜問題 recall 不足 | C - Multi-Query Expansion | ✅ 已融入 |
| 缺精確關鍵字匹配（路線名、難度） | D - BM25 Hybrid | ✅ 已融入 |
| Multi-hop 複雜問題無法多輪推理 | E - Agentic（獨立模式） | 📋 規劃中 |

---

## 二、改善型：B - Contextual RAG（✅ 已融入 Baseline）

### 概念

由 Anthropic 提出的 **Contextual Retrieval** 技術，在建立索引時為每個 chunk 注入文件級別摘要上下文，解決「chunk 孤島」問題——獨立的 chunk 缺乏跨文件關聯，導致語意搜尋失準。

- 傳統：chunk 直接轉向量 → 搜尋時語意失真
- Contextual：chunk 前加入「這段資料的核心特色與攀岩者使用情境」→ 向量更精準

### 實作方式（已實作）

**索引時（每次新增/更新文件觸發，背景非阻塞）：**

```typescript
// backend/src/utils/ai-prompts.ts
export const CONTEXTUAL_CHUNK_PROMPT = `以下是一筆{type}資料：

{content}

請用 1-2 句話描述這筆資料的核心特色，說明攀岩者在什麼情境下會需要這份資訊。
只輸出描述，不要多餘文字。`;
```

```typescript
// backend/src/services/indexing.ts
// Phase 1：原始文字快速建立向量索引（不阻塞回應）
// Phase 2：背景 waitUntil 生成 LLM contextual summary → 覆寫 Vectorize 向量
ctx.waitUntil(this.enrichWithContextualSummaries(type, documents, dbInserts));
```

**查詢時：** 與 Baseline 完全相同，無需更改。

### 實作說明

- **背景非阻塞**：新增文件時先快速建立原始向量，`ctx.waitUntil()` 在背景生成 LLM 摘要後更新 Vectorize
- **LLM 模型**：使用 `contextual_rag_model` config key（預設 `@cf/meta/llama-3.1-8b-instruct`）
- **向量覆寫**：LLM 生成的語意摘要只用於 embedding，不寫入 D1；D1 保留原始結構化文字供 LLM context 使用
- **config key**：`contextual_rag_model`（admin 設定頁尚未新增此項，直接讀 ai_config）

---

## 三、改善型：C - Multi-Query Expansion（✅ 已融入 Baseline）

### 概念

將使用者的單一查詢，透過 LLM 自動改寫為 N 個不同角度的子查詢，分別執行向量搜尋後用 RRF 合併，大幅提升召回率。

**解決的問題：** 使用者問「大頭峰適合初學者的路線」，一次搜尋可能遺漏「難度 5.8 以下」、「保護點充足」、「傳統攀登入門」等不同描述方式的路線資訊。

### 實作方式（已實作）

**Stage 5（與 HyDE 並行，complex 才觸發）：**

```typescript
// backend/src/utils/ai-prompts.ts
export const MULTI_QUERY_EXPANSION_PROMPT = `你是攀岩知識庫的查詢優化專家。
根據使用者的查詢，生成 {count} 個不同角度的搜尋查詢，以提高資訊召回率。

使用者查詢：{query}

生成 {count} 個查詢，每行一個，角度各異：
1. 原始查詢的語意改寫（不同詞彙表達相同意圖）
2. 聚焦在技術參數（難度等級、攀登類型）的查詢
3. 聚焦在使用者意圖（目的、經驗程度、適合對象）的查詢

只輸出 {count} 行查詢，不含編號或說明。`;
```

```typescript
// backend/src/services/query.ts
// complex 查詢：HyDE + Multi-Query 並行
if (queryType === 'complex') {
  [hydeDoc, expandedQueries] = await Promise.all([
    this.generateHyDE(query, llmModel, gatewayOptions),
    this.generateMultipleQueries(query, pipelineCfg.multi_query_count, llmModel, gatewayOptions),
  ]);
}

// Stage 4：多路並行搜尋（query + hyde + N 路子查詢 + BM25）
const allResults = await Promise.all([
  env.VECTOR_INDEX.query(queryVector, { topK: MERGE_TOP_K }),
  env.VECTOR_INDEX.query(hydeVector, { topK: MERGE_TOP_K }),
  this.searchBM25(query, pipelineCfg.bm25_top_k),
  ...expandedVectors.map((vec) => env.VECTOR_INDEX.query(vec, { topK: MERGE_TOP_K })),
]);
const mergedMatches = this.mergeResults(
  [queryMatches, hydeMatches, bm25Matches, ...expandedVecResults], MERGE_TOP_K
);
```

### 實作說明

- **只對 complex 查詢觸發**，simple 和 general-knowledge 不增加延遲
- **失敗靜默降級**：LLM 呼叫失敗時回傳空陣列，fallback 為無擴展的雙路搜尋
- **config key**：`multi_query_count`（預設 3，admin 設定頁可調整 1–5）
- **Migration**：`backend/migrations/0060_multi_query_config.sql`

---

## 四、改善型：D - BM25 Hybrid（SQLite FTS5）（✅ 已融入 Baseline）

### 概念

利用 D1（SQLite）內建的 FTS5 全文搜尋實現 BM25 關鍵字搜尋，與現有向量搜尋做 RRF 融合。業界研究顯示 Hybrid 比單純向量搜尋提升 **33–47% 精準度**。

**解決的問題：** 向量搜尋擅長語意相似，但對路線名稱（「幻想鄉」）、精確難度（「5.11b」）等術語效果差，BM25 補足這個缺口。

### 資料庫（已建立，Migration 0059）

```sql
-- backend/migrations/0059_bm25_hybrid.sql
-- FTS5 虛擬表（對 ai_documents 建立全文索引）
CREATE VIRTUAL TABLE IF NOT EXISTS ai_documents_fts USING fts5(
  doc_id UNINDEXED,
  text,
  tokenize='unicode61'
);

-- 三個同步觸發器（insert / update / delete）
CREATE TRIGGER IF NOT EXISTS ai_documents_fts_insert
AFTER INSERT ON ai_documents BEGIN
  INSERT INTO ai_documents_fts(doc_id, text) VALUES (new.id, new.text);
END;
-- （update / delete 觸發器略）

-- 回填現有資料至 FTS 索引
INSERT INTO ai_documents_fts(doc_id, text) SELECT id, text FROM ai_documents;
```

### 實作方式（已實作）

```typescript
// backend/src/services/query.ts
// BM25 全文搜尋：bm25() 回傳負值，取負數轉正分供 RRF 使用
private async searchBM25(query: string, topK: number): Promise<SearchResult[]> {
  const ftsQuery = this.buildFTSQuery(query);  // 清理特殊字元
  if (!ftsQuery) return [];
  try {
    const rows = await this.env.DB.prepare(`
      SELECT doc_id, bm25(ai_documents_fts) AS bm25_score
      FROM ai_documents_fts
      WHERE ai_documents_fts MATCH ?
      ORDER BY bm25(ai_documents_fts)
      LIMIT ?
    `).bind(ftsQuery, topK).all<{ doc_id: string; bm25_score: number }>();
    return rows.results.map((row) => ({ id: row.doc_id, score: -row.bm25_score }));
  } catch {
    return [];  // 靜默降級
  }
}
```

### 實作說明

- **適用範圍**：所有查詢（simple、complex），非 complex 專屬
- **失敗靜默降級**：FTS 查詢失敗時回傳空陣列，不影響向量搜尋路徑
- **CRAG 回退也包含 BM25**：放寬條件重試時 BM25 結果同樣加入 RRF
- **config key**：`bm25_top_k`（預設 10，admin 設定頁可調整 5–50）
- **Migration**：`backend/migrations/0059_bm25_hybrid.sql`

---

## 五、模式型：E - Agentic Multi-Step RAG

### 概念

根本不同的 pipeline：讓 LLM 主動控制檢索迴圈（ReAct 模式），自己決定是否需要再次搜尋、用什麼條件搜、資訊夠不夠回答。

**與 Baseline 的關係：**
不是改善而是替換，成本顯著更高（+1–3s、+50–100% token），但對 multi-hop 複雜查詢效果大幅優於 Baseline。長期與 Baseline 並存，由 `rag_strategy` 設定決定使用哪個模式。

**典型使用場景：** 「大頭峰哪條 5.10 路線附近有比較困難的變化路線，需要哪些技術準備？」

### Agentic Loop（最多 3 輪）

```typescript
for (let step = 0; step < maxSteps; step++) {
  const action = await decideNextAction(query, evidence, allSources);
  // action.type: 'ANSWER' | 'RETRIEVE' | 'BROADEN'

  if (action.type === 'ANSWER') break;

  if (action.type === 'RETRIEVE') {
    const newDocs = await vectorSearch(action.refinedQuery, env, config);
    allSources = deduplicateSources([...allSources, ...newDocs]);
    evidence = buildEvidenceString(allSources);
  }

  if (action.type === 'BROADEN') {
    const relaxedDocs = await vectorSearch(query, env, { ...config, removeFilters: true });
    allSources = deduplicateSources([...allSources, ...relaxedDocs]);
    evidence = buildEvidenceString(allSources);
  }
}
```

**決策 Prompt：**

```typescript
const AGENTIC_DECISION_PROMPT = `
你是攀岩知識庫的 AI 研究員。
使用者問題：{{QUERY}}
目前已收集到的資訊：{{EVIDENCE}}

請決定下一步行動（只輸出 JSON）：
- {"type": "ANSWER"} → 資訊已足夠，可以回答
- {"type": "RETRIEVE", "refinedQuery": "..."} → 需要補充搜尋
- {"type": "BROADEN"} → 搜尋結果不足，需要放寬條件

規則：已有超過 3 份相關文件時，優先選 ANSWER。
`;
```

### 與 Baseline 並存方式

```typescript
// query.ts
const strategy = config.rag_strategy ?? 'baseline';

if (strategy === 'agentic' && queryType === 'complex') {
  // 走 Agentic loop，取代 Stage 4–10
  return await this.agenticRetrieve(query, env, config);
}
// 其他情況一律走 Baseline
```

simple 查詢即使設定為 agentic 也自動走 Baseline（成本保護）。

### 預期效果

| 指標 | 對比 Baseline | 說明 |
|------|-------------|------|
| Complex 查詢準確率 | +25–40% | Multi-hop 支援 |
| 查詢延遲 | +1–3s | 多輪 LLM + 向量搜尋 |
| Token 消耗 | +50–100% | 多輪 LLM 呼叫 |
| Simple 查詢 | 無影響 | 自動繞過 |

### 實作方式（2026-03-06）

**接入點**：`ask()` 方法 Stage 2（vectorFilter 建立）後、Stage 3（embedding）前插入分支：

```
rag_strategy === 'agentic' && queryType === 'complex'?
├─ 是 → agenticRetrieve() → candidateMatches
└─ 否 → Stage 3–5（現有程式碼不動）→ candidateMatches
         ↓
Stage 6+ (Cross-Encoder / MMR / Judge)  ← 兩路完全相同
```

**新增 4 個 private methods**（`query.ts`）：
- `agenticRetrieve()` — 主控方法，管理多輪搜尋迴圈與 MERGE_TOP_K 計算
- `runAgenticSearch()` — 每輪搜尋：embedding + BM25 並行 → RRF 合併
- `decideNextAction()` — 呼叫 lightweight_model 決定 ANSWER / RETRIEVE / BROADEN；失敗靜默降級為 ANSWER
- `buildEvidenceSummary()` — 建立給決策 prompt 的文件摘要（前 8 筆）

**Pipeline Trace**：Agentic 路徑寫 `trace.agentic`（含 steps 陣列），不寫 `trace.retrieval`，可用 `JSON_EXTRACT(pipeline_trace, '$.agentic')` 識別。

**新增設定**（`ai_config` 表，`0062_agentic_config.sql`）：

| Key | 預設值 | 說明 |
|-----|--------|------|
| `rag_strategy` | `baseline` | `baseline` 或 `agentic` |
| `agentic_max_steps` | `3` | 最多額外搜尋輪數（1–5） |
| `agentic_min_docs_to_answer` | `3` | 累積文件數達此值提前結束（1–10） |

### 實作複雜度

**高**：需新增 `agenticRetrieve()` + `decideNextAction()`，設計 stopping condition，修改日誌結構記錄多輪步驟，加入無限迴圈安全機制。

---

## 六、策略比較總表

| 維度 | 舊 Baseline | 新 Baseline（B+C+D 融入後） | E Agentic |
|------|------------|--------------------------|---------|
| **Recall** | ★★★☆☆ | ★★★★★ | ★★★★★ |
| **Precision** | ★★★★☆ | ★★★★★ | ★★★★☆ |
| **Faithfulness** | ★★★★☆ | ★★★★☆ | ★★★★☆ |
| **複雜問題** | ★★★☆☆ | ★★★★☆ | ★★★★★ |
| **查詢延遲（simple）** | ~1s | ~1.1s（+BM25） | ~1.1s（自動繞過） |
| **查詢延遲（complex）** | ~1.5s | ~2–2.5s（+HyDE+MultiQ+BM25） | ~3–5s |
| **性質** | 現有 | 現行 Baseline | 長期並存 |
| **Token 消耗** | baseline | +25–30%（complex）/ +5%（simple） | +60% |
| **狀態** | 已取代 | ✅ 上線中 | 📋 規劃中 |

---

## 七、現行 Config 設計

B、C、D 已直接融入 Baseline，無需策略切換旗標。現行 ai_config 相關設定：

```sql
-- B - Contextual RAG（已上線）
-- 使用 ai_config key: contextual_rag_model
-- 預設: @cf/meta/llama-3.1-8b-instruct（admin 設定頁「模型設定」section 可調整）

-- C - Multi-Query Expansion（已上線，migration 0060）
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('multi_query_count', '3');   -- admin 設定頁可調整 1–5，只對 complex 觸發

-- D - BM25 Hybrid（已上線，migration 0059）
INSERT OR IGNORE INTO ai_config (key, value) VALUES
  ('bm25_top_k', '10');         -- admin 設定頁可調整 5–50，所有查詢觸發

-- E - Agentic（規劃中，永久保留切換選項）
-- 待實作後新增：
--   ('agentic_max_steps', '3')
--   ('agentic_only_for_complex', 'true')
--   ('agentic_min_docs_to_answer', '3')
```

---

## 八、實作進度與優先順序

### Phase 2（已完成，2026-03-06）

- ✅ **D - BM25 Hybrid**：D1 FTS5 索引 + 觸發器，`searchBM25()` 加入 RRF
- ✅ **B - Contextual RAG**：索引管線加入背景 `waitUntil` contextual enrichment
- ✅ **C - Multi-Query Expansion**：complex 查詢 LLM 子查詢展開 + N 路向量搜尋

### Phase 3（長期，規劃中）

**E - Agentic Multi-Step**：真正解決 multi-hop 複雜推理，預估 **3–5 天**

---

## 九、評估指標

| 指標 | 查詢位置 | 理想方向 |
|------|---------|---------|
| 平均 groundedness score | `ai_query_logs.groundedness_score` | ↑ 越高越好 |
| 平均 quality score | `ai_query_logs.auto_score` | ↑ 越高越好 |
| low_groundedness 比率 | `ai_query_logs.flagged = 'low_groundedness'` | ↓ 越低越好 |
| 查詢延遲 P50/P95 | `ai_query_logs.latency_ms` | 依可接受範圍 |
| Token 消耗 | `ai_query_logs.token_count` | 依成本預算 |
| Self-reflection 觸發比率 | `ai_query_logs.self_reflection_triggered` | 觀察趨勢 |
| 使用者回饋評分 | `ai_query_logs.feedback_score` | ↑ 越高越好 |

---

## 十、參考資料

| 來源 | 相關策略 |
|------|---------|
| Anthropic Contextual Retrieval (2024) | B - Contextual RAG |
| Self-RAG (Asai et al., ICLR 2024) | Baseline Self-reflection |
| Hybrid Search: BM25 + Embedding (Pinecone, 2025) | D - BM25 Hybrid |
| Agentic RAG with ReAct (LangChain, 2025) | E - Agentic Multi-Step |
| RAG in 2026: Claude/Gemini/Grok/Perplexity 分析 | 整體策略方向 |
| `docs/ai-agent/06-self-reflection-strategies.md` | Baseline Self-reflection 演進 |
