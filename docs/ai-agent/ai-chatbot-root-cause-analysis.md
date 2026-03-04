# AI 聊天機器人回應品質問題 — 根因分析

> 日期：2026-03-04
> 問題：AI 助理在路線推薦查詢中回傳空結果或低品質回答

---

## 問題現象

| 使用者問題 | AI 回應 | 預期行為 |
|-----------|---------|---------|
| 「台灣有哪些岩場？」 | 「根據現有資料，找不到符合條件的岩場。」 | 應列出龍洞、墾丁、關子嶺、德芙蘭、壽山等岩場 |
| 「南部推薦哪些攀岩路線？」 | 「根據現有資料，找不到符合條件的路線。」 | 應推薦墾丁、關子嶺、壽山等南部岩場路線 |
| 「剛爬完美人照鏡，不知道要爬什麼」 | 「美人照鏡是 5.11b 難度的運攀路線。目前根據資料，沒有其他路線與其難度相近。」 | 應推薦關子嶺或其他岩場的 5.11 左右路線 |

**關鍵觀察：連「台灣有哪些岩場？」這種最基本、不帶任何過濾條件的查詢都回傳空結果，代表問題不在過濾邏輯，而是 Vectorize 索引中完全沒有資料。**

靜態 JSON 中**明確存在**完整資料（龍洞 616 條、墾丁 120 條、關子嶺多條、壽山 107 條、德芙蘭 53 條），問題出在 D1 資料庫或 Vectorize 索引未建立。

---

## 系統架構概要

```
使用者查詢
  │
  ├─ Stage 1: Intent Recognition（LLM Tool Calling + HyDE）
  ├─ Stage 2: Filter Building（grade / crag / region 過濾條件）
  ├─ Stage 3: Parallel Embeddings（query + HyDE 向量化）
  ├─ Stage 4: Vectorize Search（雙路搜尋 + RRF 合併）
  ├─ Stage 5: Cross-encoder Reranking（bge-reranker-base）
  ├─ Stage 6: MMR 多樣性選取（λ=0.6）
  └─ Stage 7: LLM Answer Generation（Gemma 3 12B）
```

---

## 根因分析

### 根因 1：Vectorize 索引資料可能不完整或未建立

**嚴重度：高**

**問題描述：**
路線資料存在於兩個地方：
- 靜態 JSON 檔案（`apps/web/src/data/crags/*.json`）— 前端使用
- D1 資料庫 `routes` 表 — 後端 AI 使用

AI 聊天機器人的 RAG 流程依賴 **Cloudflare Vectorize** 向量索引。路線需要經過 `IndexingService.indexRoutes()` 將資料從 D1 寫入 Vectorize 才能被搜尋到。

**可能原因：**
1. D1 資料庫 `routes` 表為空或資料不完整（資料只存在靜態 JSON 中，未匯入 D1）
2. Vectorize 索引從未執行過，或執行後失敗
3. 部分路線的 embedding 生成失敗（`EmbeddingService.embedBatch()` 靜默失敗）
4. 路線的 `region` 欄位在 D1 中為 `NULL`（需透過 JOIN crags 取得，若 `crag_id` 未正確關聯則取不到）

**相關程式碼：** `backend/src/services/indexing.ts:114-156`
```typescript
// 索引路線時需從 crags 表 JOIN region
const routes = await this.env.DB.prepare(`
  SELECT r.*, c.name as crag_name, c.region, a.id as area_id, a.name as area_name
  FROM routes r
  LEFT JOIN crags c ON r.crag_id = c.id
  LEFT JOIN areas a ON r.area_id = a.id
  ORDER BY r.id
  LIMIT ? OFFSET ?
`).bind(limit, offset).all<RouteWithCrag>();
```

**驗證方式：**
1. 呼叫 `GET /api/v1/ai/health` 檢查 Vectorize 索引狀態
2. 查看 Admin Dashboard 的 Knowledge Base 區塊，確認已索引路線數量
3. 直接查詢 D1：`SELECT COUNT(*) FROM ai_documents WHERE type = 'route'`
4. 對比 D1 路線總數：`SELECT COUNT(*) FROM routes`

---

### 根因 2：「南部」地區過濾在 Tool Calling 階段解析失敗

**嚴重度：高**

**問題描述：**
查詢「南部推薦哪些攀岩路線？」時，系統需要：
1. LLM A（Tool Calling）解析出 `{ tool: "search_routes", params: { region: "南部" } }`
2. `buildFiltersFromParsed()` 將 `region: "南部"` 轉為 Vectorize filter `{ region: { $eq: "南部" } }`
3. Vectorize 搜尋時以 `region` 欄位過濾

**可能失敗點：**

**(a) LLM 未正確解析 region 參數：**
Gemma 3 12B 可能未正確將「南部」對應到 `region` 參數。TOOL_SELECTION_PROMPT 中的 `{regions}` 佔位符由資料庫動態注入，若 D1 中的 `crags.region` 欄位為空，則 LLM 看到的 regions 清單為「無」，導致無法選擇。

**(b) Vectorize metadata 中 region 欄位缺失：**
索引時 region 來自 `crags.region`。若 crags 表中 region 為 NULL，向量中的 metadata 就沒有 region，Vectorize filter 將找不到匹配。

**(c) Regex fallback 也依賴 DB 資料：**
`extractLocationFilter()` 從 `crags` 表讀取所有岩場名稱和 region，若資料缺失則同樣無法 fallback。

**相關程式碼：** `backend/src/services/query.ts:89-123`（extractLocationFilter）、`backend/src/services/query.ts:977-1036`（buildFiltersFromParsed）

---

### 根因 3：「相似路線推薦」流程同岩場限制過嚴，且 fallback 不足

**嚴重度：中高**

**問題描述：**
查詢「剛爬完美人照鏡，不知道要爬什麼」時：
1. `hasSimilarRouteIntent()` 偵測到「爬完」關鍵字 → 進入相似路線流程
2. `extractRouteReference()` 從 DB 找到「美人照鏡」（5.11b，關子嶺）
3. 設定 filter：`{ crag_id: "關子嶺ID", grade_numeric: { $gte: 108, $lte: 113 }, type: "route" }`
4. Vectorize 搜尋同岩場 + 相近難度 → 若關子嶺 5.11 附近路線不多，結果為空
5. Fallback：放寬為全站相近難度，但**仍然需要 Vectorize 中有索引資料**

**失敗原因推測：**
- 若 Vectorize 索引不完整（根因 1），即使 fallback 也找不到結果
- 回應「沒有其他路線與其難度相近」暗示系統確實找到了美人照鏡本身（因為能辨識其難度），但排除自身後沒有其他候選

**相關程式碼：** `backend/src/services/query.ts:195-216`、`backend/src/services/query.ts:358-372`

---

### 根因 4：HyDE 過濾策略在一般查詢中過於寬鬆

**嚴重度：中**

**問題描述：**
一般查詢（非相似路線）的 HyDE 搜尋只套用 `type` filter，不含地區/岩場限制：

```typescript
// query.ts:339-342
const hydeFilter: Record<string, unknown> =
  vectorFilter['crag_id'] || vectorFilter['area_id']
    ? { ...vectorFilter }                           // 相似路線：完整 filter
    : vectorFilter['type'] ? { type: vectorFilter['type'] } : {}; // 一般：只限 type
```

這導致 HyDE 搜尋可能帶回完全無關的岩場路線。但這在結果為空的場景中影響較小（問題是連主查詢都沒結果）。

---

### 根因 5：LLM 模型能力限制（Gemma 3 12B）

**嚴重度：中**

**問題描述：**
系統使用 `@cf/google/gemma-3-12b-it` 進行三個關鍵 LLM 呼叫：
1. **Tool Calling（意圖解析）**：需要將使用者自然語言轉為結構化 JSON
2. **HyDE（假設文件生成）**：需要生成攀岩相關的假設性答案
3. **Answer Generation（回答生成）**：需要根據 context 生成有洞察力的回答

Gemma 3 12B 在 Tool Calling 上的可靠性較主流大模型（GPT-4、Claude）低，可能導致：
- JSON 格式解析錯誤 → 整個 Tool Calling 失敗 → 退回 regex fallback
- `region` 等參數遺漏
- 回答品質不足，傾向於直接說「找不到」而非嘗試推薦

---

### 根因 6：快取機制可能固化錯誤回應

**嚴重度：低**

**問題描述：**
AI 回應會被快取 1 小時（`CACHE_TTL = 3600`）。若 Vectorize 索引不完整時的空結果被快取，即使之後索引修復，相同查詢在 1 小時內仍會返回舊的空結果。

**相關程式碼：** `backend/src/services/query.ts:5, 170-173`

---

## 修復建議（按優先級排序）

### P0：驗證並重建 Vectorize 索引

```bash
# 1. 確認 D1 中路線數量
# SQL: SELECT COUNT(*) FROM routes;
# SQL: SELECT COUNT(*) FROM ai_documents WHERE type = 'route';

# 2. 確認 crags 表 region 欄位有值
# SQL: SELECT id, name, region FROM crags;

# 3. 觸發全量重建索引
# POST /api/v1/ai/index  （需 admin 權限）
# Body: { "type": "all" }
```

### P1：加強 Tool Calling 的 fallback 機制

當 LLM A 回傳的 `region` 為空時，應用 `extractLocationFilter()` 做 regex 兜底。目前已有此邏輯（query.ts:261-271），但僅在 LLM 未設定 `region` 時才觸發。建議：
- 即使 LLM 已設定 region，若 Vectorize 搜尋結果為空，自動重試時移除 region filter

### P2：加入搜尋結果為空的 graceful fallback

目前若 `candidateMatches` 為空，系統直接將空 context 傳給 LLM，LLM 只能回「找不到」。建議：
- 當過濾搜尋結果為空時，逐步放寬條件重試（先移除 grade，再移除 crag/region）
- 至少返回該地區的岩場資訊，而非完全空白

### P3：考慮升級 LLM 模型

Gemma 3 12B 的 Tool Calling 可靠性不足。可評估：
- Workers AI 上其他模型（如 Llama 3.1 70B）
- 外部 API（OpenAI、Anthropic）搭配 AI Gateway

### P4：清除可能的錯誤快取

修復索引後，建議清除 KV 中所有 `ai:ask:*` 前綴的快取，避免舊的空結果繼續返回。

---

## 最可能的根因結論

**Vectorize 向量索引中完全沒有資料（或 D1 資料庫為空）**，這是所有問題的共同核心原因。

證據：連「台灣有哪些岩場？」這種不帶任何 filter 的查詢都回傳空結果。若索引中有任何岩場資料，Vectorize 語義搜尋至少會返回幾筆匹配。

問題鏈條推測：
```
靜態 JSON 資料（apps/web/src/data/crags/*.json）
    ↓ ❌ 未匯入
D1 資料庫（routes / crags 表）
    ↓ ❌ 表為空，indexRoutes() 無資料可索引
Cloudflare Vectorize（向量索引）
    ↓ ❌ 索引為空
RAG 搜尋 → 結果為空 → LLM 只能回「找不到」
```

**驗證步驟：**
1. 查看 Admin AI Dashboard（`/admin/ai`）的「已索引路線數」和「已索引岩場數」
2. 直接查 D1：`SELECT COUNT(*) FROM routes;` 和 `SELECT COUNT(*) FROM crags;`
3. 查索引文件數：`SELECT COUNT(*) FROM ai_documents;`

**修復步驟：**
1. 若 D1 為空 → 先透過 Admin Import API（`POST /api/v1/admin/import/crag`）將靜態 JSON 資料匯入 D1
2. 若 D1 有資料但索引為空 → 執行 `POST /api/v1/ai/index`（body: `{ "type": "all" }`）重建 Vectorize 索引
3. 索引完成後清除 KV 快取中的 `ai:ask:*` 前綴條目，避免舊的空結果繼續返回
